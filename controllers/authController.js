const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const { store } = require('../utils/data_store');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw createError(400, 'Name, email and password are required');
  }
  if (password.length < 6) {
    throw createError(400, 'Password must be at least 6 characters');
  }

  const exists = await store.users.findByEmail(email);
  if (exists) throw createError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const user = await store.users.create({ name, email, password: hashed, role: 'customer' });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError(400, 'Email and password are required');

  const user = await store.users.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    throw createError(400, 'Current password and new password are required');
  }
  if (new_password.length < 6) {
    throw createError(400, 'New password must be at least 6 characters');
  }

  const user = req.user;
  if (!(await bcrypt.compare(current_password, user.password))) {
    throw createError(400, 'Current password is incorrect');
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await store.users.update(user.id, { password: hashed });

  res.json({ message: 'Password changed successfully' });
};
