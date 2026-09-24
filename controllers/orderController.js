const createError = require('http-errors');
const { store } = require('../utils/data_store');
const PromotionModel = require('../models/promotionModel');
const { sendMail } = require('../utils/mailer');

// Places an order directly in the database (no external payment gateway).
// Payment happens out-of-band (COD / manual transfer / custom arrangement);
// orders are created as 'pending' so an admin can confirm them.
exports.checkout = async (req, res) => {
  const { items, customer, currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, 'Cart is empty');
  }
  if (!customer?.name || !customer?.email || !customer?.address) {
    throw createError(400, 'Customer name, email and address are required');
  }

  // Fetch active promotions to calculate correct price
  const activePromos = await PromotionModel.findAll({ where: { active: true } });
  const now = new Date();
  const validPromos = activePromos.filter(sale => {
    if (sale.start_date && new Date(sale.start_date) > now) return false;
    if (sale.end_date && new Date(sale.end_date) < now) return false;
    return true;
  });

  const detailed = [];
  for (const it of items) {
    const product = await store.products.findByPk(it.productId);
    if (!product || !product.active) {
      throw createError(400, `Product ${it.productId} is unavailable`);
    }
    const qty = Math.max(parseInt(it.quantity, 10) || 1, 1);
    if (product.stock < qty) {
      throw createError(400, `Not enough stock for "${product.name}"`);
    }

    // Calculate sale price
    let lowestPrice = parseFloat(product.price);
    validPromos.forEach(sale => {
      let applies = false;
      if (sale.applies_to === 'all') applies = true;
      if (sale.applies_to === 'products' && sale.target_ids.includes(product.id)) applies = true;
      if (sale.applies_to === 'categories' && sale.target_ids.includes(product.category_id)) applies = true;
      if (applies) {
        let salePrice = parseFloat(product.price);
        if (sale.discount_type === 'percentage') {
          salePrice -= salePrice * (sale.discount_value / 100);
        } else {
          salePrice -= sale.discount_value;
        }
        if (salePrice < 0) salePrice = 0;
        if (salePrice < lowestPrice) lowestPrice = salePrice;
      }
    });

    detailed.push({ product, qty, size: it.size || null, color: it.color || null, finalPrice: lowestPrice });
  }

  const total = detailed.reduce((sum, d) => sum + d.finalPrice * d.qty, 0);

  const order = await store.orders.create({
    customer_name: customer.name,
    customer_email: customer.email,
    shipping_address: customer.address,
    shipping_city: customer.city,
    shipping_country: customer.country,
    shipping_zip: customer.zip,
    phone: customer.phone,
    total: total.toFixed(2),
    currency,
    payment_method: 'manual',
    payment_status: 'pending',
    status: 'pending',
    user_id: req.user?.id || null,
  });

  await store.order_items.bulkCreate(
    detailed.map((d) => ({
      order_id: order.id,
      product_id: d.product.id,
      product_name: d.product.name,
      price: d.finalPrice,
      quantity: d.qty,
      size: d.size,
      color: d.color,
    }))
  );

  // Send Order Confirmation to Admin
  await sendMail({
    to: process.env.SMTP_USER || 'info@velmorascreation.com',
    subject: `New Order Received: #${order.id}`,
    html: `
      <h2>New Order Received (#${order.id})</h2>
      <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
      <p><strong>Total:</strong> ${total.toFixed(2)} ${currency}</p>
      <p><strong>Status:</strong> Pending</p>
      <hr />
      <h3>Items:</h3>
      <ul>
        ${detailed.map(d => `<li>${d.qty}x ${d.product.name} (Size: ${d.size || 'N/A'}, Color: ${d.color || 'N/A'}) - ${d.finalPrice.toFixed(2)}</li>`).join('')}
      </ul>
      <p>Please log in to the admin dashboard to review and process this order.</p>
    `,
  });

  // Send Order Confirmation to Customer
  await sendMail({
    to: customer.email,
    subject: `Your Order Confirmation - Velmoras Creation (#${order.id})`,
    html: `
      <h2>Thank you for your order, ${customer.name}!</h2>
      <p>We have received your order <strong>#${order.id}</strong> and it is currently being processed.</p>
      <p><strong>Total:</strong> ${total.toFixed(2)} ${currency}</p>
      <hr />
      <h3>Order Details:</h3>
      <ul>
        ${detailed.map(d => `<li>${d.qty}x ${d.product.name} (Size: ${d.size || 'N/A'}, Color: ${d.color || 'N/A'})</li>`).join('')}
      </ul>
      <p>We will contact you shortly regarding the next steps.</p>
      <p>Best regards,<br>Velmoras Creation Team</p>
    `,
  });

  res.status(201).json({
    orderId: order.id,
    total: total.toFixed(2),
    status: 'pending',
  });
};

exports.listAll = async (req, res) => {
  const orders = await store.orders.findAll({
    order: [['created_at', 'DESC']],
    include: [{ as: 'items' }],
  });
  res.json(orders);
};

exports.listMine = async (req, res) => {
  const orders = await store.orders.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
  res.json(orders);
};

exports.getOne = async (req, res) => {
  const order = await store.orders.findByPk(req.params.id);
  if (!order) throw createError(404, 'Order not found');
  if (req.user?.role !== 'admin' && order.user_id && order.user_id !== req.user?.id) {
    throw createError(403, 'Not allowed');
  }
  res.json(order);
};

exports.updateStatus = async (req, res) => {
  const order = await store.orders.findByPk(req.params.id);
  if (!order) throw createError(404, 'Order not found');
  const { status, payment_status } = req.body;
  const updated = await store.orders.update(order.id, {
    ...(status ? { status } : {}),
    ...(payment_status ? { payment_status } : {}),
  });
  res.json(updated);
};
