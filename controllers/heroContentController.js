const createError = require('http-errors');
const { store } = require('../utils/data_store');

exports.list = async (req, res) => {
  try {
    const hero = await store.heroContent.findAll();
    res.json(hero);
  } catch (err) {
    res.json([]);
  }
};

exports.create = async (req, res) => {
  const { title, subtitle, cta_text, cta_link, image_url } = req.body;
  if (!title) throw createError(400, 'Title is required');
  const hero = await store.heroContent.create({
    title,
    subtitle: subtitle || '',
    cta_text: cta_text || 'Shop Now',
    cta_link: cta_link || '/products',
    image_url: image_url || null,
  });
  res.status(201).json(hero);
};

exports.update = async (req, res) => {
  const hero = await store.heroContent.findById(req.params.id);
  if (!hero) throw createError(404, 'Hero content not found');
  const { title, subtitle, cta_text, cta_link, image_url, active } = req.body;
  const updated = await store.heroContent.update(req.params.id, {
    title: title ?? hero.title,
    subtitle: subtitle !== undefined ? subtitle : hero.subtitle,
    cta_text: cta_text ?? hero.cta_text,
    cta_link: cta_link ?? hero.cta_link,
    image_url: image_url !== undefined ? image_url : hero.image_url,
    active: active !== undefined ? active : hero.active,
  });
  res.json(updated);
};

exports.remove = async (req, res) => {
  const hero = await store.heroContent.findById(req.params.id);
  if (!hero) throw createError(404, 'Hero content not found');
  await store.heroContent.delete(req.params.id);
  res.json({ message: 'Hero content deleted' });
};

exports.uploadImage = async (req, res) => {
  const hero = await store.heroContent.findById(req.params.id);
  if (!hero) throw createError(404, 'Hero content not found');
  if (!req.file) throw createError(400, 'No image uploaded');
  const updated = await store.heroContent.update(hero.id, { image_url: `/uploads/${req.file.filename}` });
  res.json(updated);
};