const createError = require('http-errors');
const { store } = require('../utils/data_store');
const PromotionModel = require('../models/promotionModel');
const { sendMail } = require('../utils/mailer');
const paypal = require('../utils/paypal');

/**
 * Helper to calculate promotional discounts and validate items
 */
async function prepareOrderData(items) {
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
  return { detailed, total };
}

// Places an order directly in the database (Manual / COD / Out-of-band payment)
exports.checkout = async (req, res) => {
  const { items, customer, currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, 'Cart is empty');
  }
  if (!customer?.name || !customer?.email || !customer?.address) {
    throw createError(400, 'Customer name, email and address are required');
  }

  const { detailed, total } = await prepareOrderData(items);

  const order = await store.orders.create({
    customer_name: customer.name,
    customer_email: customer.email,
    shipping_address: customer.address,
    shipping_city: customer.city,
    shipping_country: customer.country,
    shipping_zip: customer.zip,
    phone: customer.phone,
    total: total.toFixed(2),
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
  }).catch((err) => console.error('Admin email error:', err));

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
  }).catch((err) => console.error('Customer email error:', err));

  res.status(201).json({
    orderId: order.id,
    total: total.toFixed(2),
    status: 'pending',
  });
};

/**
 * 1. Create PayPal Order on backend and insert order record in DB
 */
exports.createPaypalOrder = async (req, res) => {
  const { items, customer, currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, 'Cart is empty');
  }
  if (!customer?.name || !customer?.email || !customer?.address) {
    throw createError(400, 'Customer name, email and address are required');
  }

  const { detailed, total } = await prepareOrderData(items);

  // Call PayPal API to generate official PayPal Order ID
  const paypalOrder = await paypal.createOrder(total, currency);

  // Store order in database
  const order = await store.orders.create({
    customer_name: customer.name,
    customer_email: customer.email,
    shipping_address: customer.address,
    shipping_city: customer.city,
    shipping_country: customer.country,
    shipping_zip: customer.zip,
    phone: customer.phone,
    total: total.toFixed(2),
    payment_method: 'paypal',
    payment_status: 'pending',
    status: 'pending',
    paypal_order_id: paypalOrder.id,
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

  res.status(201).json({
    paypalOrderId: paypalOrder.id,
    orderId: order.id,
    total: total.toFixed(2),
  });
};

/**
 * 2. Capture PayPal Payment after buyer approves on PayPal modal
 */
exports.capturePaypalOrder = async (req, res) => {
  const { paypalOrderId, orderId } = req.body;
  if (!paypalOrderId || !orderId) {
    throw createError(400, 'Missing paypalOrderId or orderId');
  }

  const order = await store.orders.findByPk(orderId);
  if (!order) {
    throw createError(404, 'Order not found');
  }

  if (order.payment_status === 'paid') {
    return res.json({ success: true, message: 'Order already paid', orderId: order.id });
  }

  // Capture payment with PayPal
  const captureData = await paypal.captureOrder(paypalOrderId);
  const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

  if (captureData.status !== 'COMPLETED' && capture?.status !== 'COMPLETED') {
    throw createError(400, `PayPal payment not completed. Status: ${captureData.status}`);
  }

  const captureId = capture?.id || captureData.id;

  // Mark order as paid
  await store.orders.update(order.id, {
    payment_status: 'paid',
    status: 'processing',
    paypal_capture_id: captureId,
  });

  // Send Order Confirmation to Admin
  await sendMail({
    to: process.env.SMTP_USER || 'info@velmorascreation.com',
    subject: `Paid Order Received (PayPal): #${order.id}`,
    html: `
      <h2>PayPal Order Paid Successfully (#${order.id})</h2>
      <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
      <p><strong>Total:</strong> ${order.total} ${order.currency || 'USD'}</p>
      <p><strong>Payment Status:</strong> Paid</p>
      <p><strong>PayPal Capture ID:</strong> ${captureId}</p>
      <p><strong>Order Status:</strong> Processing</p>
      <hr />
      <p>Please log in to the admin dashboard to fulfill this order.</p>
    `,
  }).catch((err) => console.error('Admin email error:', err));

  // Send Order Confirmation to Customer
  await sendMail({
    to: order.customer_email,
    subject: `Payment Confirmed - Velmoras Creation (#${order.id})`,
    html: `
      <h2>Thank you for your payment, ${order.customer_name}!</h2>
      <p>We have successfully received your payment via PayPal for order <strong>#${order.id}</strong>.</p>
      <p><strong>Transaction ID:</strong> ${captureId}</p>
      <p><strong>Total Paid:</strong> ${order.total} ${order.currency || 'USD'}</p>
      <hr />
      <p>Your order is now being processed and prepared for shipping.</p>
      <p>Best regards,<br>Velmoras Creation Team</p>
    `,
  }).catch((err) => console.error('Customer email error:', err));

  res.json({
    success: true,
    orderId: order.id,
    paymentStatus: 'paid',
    transactionId: captureId,
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
