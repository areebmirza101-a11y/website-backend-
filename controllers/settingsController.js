const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const { store } = require('../utils/data_store');

exports.getSettings = async (req, res) => {
  const settings = await store.settings.findFirst();
  res.json(settings || {});
};

// Public-safe subset — no auth. Only exposes contact/branding fields the
// storefront legitimately needs (never passwords or internal fields).
exports.getPublicSettings = async (req, res) => {
  const s = (await store.settings.findFirst()) || {};
  res.json({
    company_name: s.company_name || '',
    app_logo: s.app_logo || '',
    app_favicon: s.app_favicon || '',
    tagline: s.tagline || '',
    phone: s.phone || '',
    whatsapp: s.whatsapp || '',
    email: s.email || '',
    address: s.address || '',
    business_hours: s.business_hours || '',
    facebook: s.facebook || '',
    instagram: s.instagram || '',
    linkedin: s.linkedin || '',
    youtube: s.youtube || '',
    feature_1_title: s.feature_1_title || '',
    feature_1_desc: s.feature_1_desc || '',
    feature_2_title: s.feature_2_title || '',
    feature_2_desc: s.feature_2_desc || '',
    feature_3_title: s.feature_3_title || '',
    feature_3_desc: s.feature_3_desc || '',
    social_links: s.social_links || [],
  });
};

exports.updateSettings = async (req, res) => {
  const { current_password, new_password, ...rest } = req.body;

  if (current_password && new_password) {
    if (!new_password || new_password.length < 6) {
      throw createError(400, 'New password must be at least 6 characters');
    }
    if (!current_password) {
      throw createError(400, 'Current password is required');
    }
    const user = req.user;
    if (!(await bcrypt.compare(current_password, user.password))) {
      throw createError(400, 'Current password is incorrect');
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await store.users.update(user.id, { password: hashed });
  }

  const data = { ...rest };

  if (req.files) {
    if (req.files.app_logo_file && req.files.app_logo_file[0]) {
      data.app_logo = `/uploads/${req.files.app_logo_file[0].filename}`;
    }
    if (req.files.app_favicon_file && req.files.app_favicon_file[0]) {
      data.app_favicon = `/uploads/${req.files.app_favicon_file[0].filename}`;
    }
    if (req.files.hero_bg_file && req.files.hero_bg_file[0]) {
      data.hero_bg = `/uploads/${req.files.hero_bg_file[0].filename}`;
    }
  }

  let settings = await store.settings.findFirst();
  if (settings) {
    settings = await store.settings.update(settings.id, data);
  } else {
    settings = await store.settings.create(data);
  }

  res.json(settings);
};