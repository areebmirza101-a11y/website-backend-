const createError = require('http-errors');
const { store } = require('../../utils/data_store');

// Public-safe user shape (never leak the password hash)
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  created_at: u.created_at,
});

// Match an order to a customer by user_id first, then by email (covers guest
// checkouts made with the same email before/after registering).
const orderBelongsTo = (order, user) =>
  (order.user_id != null && order.user_id === user.id) ||
  (!!order.customer_email &&
    !!user.email &&
    order.customer_email.toLowerCase() === user.email.toLowerCase());

exports.list = async (req, res) => {
  const users = (await store.users.findAll()).filter((u) => u.role === 'customer');
  const allOrders = await store.orders.findAll();

  const customers = users
    .map((u) => {
      const theirOrders = allOrders.filter((o) => orderBelongsTo(o, u));
      const paid = theirOrders.filter((o) => o.payment_status === 'paid');
      const totalSpent = paid.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
      const lastOrder = theirOrders
        .map((o) => o.created_at)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;

      return {
        ...publicUser(u),
        orderCount: theirOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderAt: lastOrder,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent || new Date(b.created_at) - new Date(a.created_at));

  res.json(customers);
};

exports.getOne = async (req, res) => {
  const user = await store.users.findByPk(req.params.id);
  if (!user || user.role !== 'customer') throw createError(404, 'Customer not found');

  const allOrders = await store.orders.findAll({ include: [{ as: 'items' }] });
  const orders = allOrders
    .filter((o) => orderBelongsTo(o, user))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const paid = orders.filter((o) => o.payment_status === 'paid');
  const totalSpent = paid.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

  res.json({
    customer: publicUser(user),
    stats: {
      orderCount: orders.length,
      paidCount: paid.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
    },
    orders,
  });
};

// Delete a customer. Orders reference users with ON DELETE SET NULL and keep a
// name/email snapshot, so a customer's order history survives the deletion.
exports.remove = async (req, res) => {
  const user = await store.users.findByPk(req.params.id);
  if (!user) throw createError(404, 'Customer not found');
  if (user.role === 'admin') throw createError(403, 'Admin accounts cannot be deleted here');
  if (req.user && String(req.user.id) === String(user.id)) {
    throw createError(400, 'You cannot delete your own account');
  }

  await store.users.destroy(user.id);
  res.json({ success: true, id: user.id });
};
