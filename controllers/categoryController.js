const createError = require('http-errors');
const { store } = require('../utils/data_store');

const slugify = (s) =>
  s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

exports.list = async (req, res) => {
  const categories = await store.categories.findAll({ order: [['name', 'ASC']] });
  res.json(categories);
};

exports.listWithSubs = async (req, res) => {
  try {
    const categories = await store.categories.findWithChildren();
    res.json(categories);
  } catch (err) {
    const cats = await store.categories.findAll({ order: [['name', 'ASC']] });
    res.json(cats);
  }
};

exports.getSubcategories = async (req, res) => {
  const { id } = req.params;
  try {
    const children = await store.categories.findChildren(id);
    res.json(children);
  } catch (err) {
    res.json([]);
  }
};

exports.create = async (req, res) => {
  const { name, description, parent_id, bg_image, show_on_home } = req.body;
  if (!name) throw createError(400, 'Category name is required');
  const bgImage = req.file ? `/uploads/${req.file.filename}` : (bg_image || null);
  const category = await store.categories.create({ name, description, slug: slugify(name), parent_id: parent_id || null, bg_image: bgImage, show_on_home: show_on_home === 'true' || show_on_home === true });
  res.status(201).json(category);
};

exports.update = async (req, res) => {
  const category = await store.categories.findByPk(req.params.id);
  if (!category) throw createError(404, 'Category not found');
  const { name, description, parent_id, bg_image, show_on_home } = req.body;
  const bgImage = req.file ? `/uploads/${req.file.filename}` : (bg_image !== undefined ? bg_image : category.bg_image);
  const updated = await store.categories.update(category.id, {
    name: name ?? category.name,
    slug: name ? slugify(name) : category.slug,
    description: description ?? category.description,
    parent_id: parent_id !== undefined ? parent_id : category.parent_id,
    bg_image: bgImage,
    show_on_home: show_on_home !== undefined ? (show_on_home === 'true' || show_on_home === true) : category.show_on_home,
  });
  res.json(updated);
};

exports.remove = async (req, res) => {
  const category = await store.categories.findByPk(req.params.id);
  if (!category) throw createError(404, 'Category not found');
  const children = await store.categories.findChildren(category.id);
  for (const child of children) {
    await store.categories.update(child.id, { parent_id: category.parent_id });
  }
  const products = await store.products.findAll({ where: { category_id: category.id } });
  const productList = Array.isArray(products) ? products : products.rows;
  for (const p of productList) {
    await store.products.update(p.id, { category_id: null });
  }
  await store.categories.destroy(category.id);
  res.json({ message: 'Category deleted' });
};
