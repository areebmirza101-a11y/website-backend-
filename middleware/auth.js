const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { store } = require('../utils/data_store');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw createError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    throw createError(401, 'Invalid or expired token');
  }

  const user = await store.users.findByPk(payload.id);
  if (!user) throw createError(401, 'User no longer exists');

  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await store.users.findByPk(payload.id);
  } catch (_) {
    /* ignore bad token for optional routes */
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    throw createError(403, 'Admin access required');
  }
  next();
}

module.exports = { authenticate, optionalAuth, requireAdmin };
