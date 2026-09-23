const createError = require('http-errors');
const { store } = require('../utils/data_store');

const slugify = (s) =>
  s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const generateSku = (name) =>
  slugify(name).replace(/-+/g, '-').replace(/^-|-$/g, '').toUpperCase();

const productInclude = [
  { model: 'Category', as: 'category' },
  { model: 'ProductImage', as: 'images' },
  { model: 'SizeGuide', as: 'size_guide' }
];

exports.list = async (req, res) => {
  const { category, search, featured, show_in_hero, page = 1, limit = 12, admin } = req.query;
  const where = {};
  if (!admin) where.active = true;
  if (featured === 'true') where.featured = true;
  if (show_in_hero === 'true') where.show_in_hero = true;
  if (search) where.name = { ilike: `%${search}%` };

  const include = [...productInclude];
  if (category && category !== 'all') {
    const cat = await store.categories.findBySlug(category);
    if (cat) {
      where.category_id = cat.id;
    }
  }

  const perPage = Math.min(parseInt(limit, 10) || 12, 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

  const result = await store.products.findAll({
    where,
    include,
    limit: perPage,
    offset,
    order: [['created_at', 'DESC']],
    page: parseInt(page, 10) || 1,
  });

  res.json({
    products: result.rows,
    total: result.count,
    page: result.page,
    pages: result.pages,
  });
};

exports.getOne = async (req, res) => {
  const { idOrSlug } = req.params;
  const where = /^\d+$/.test(idOrSlug) ? { id: Number(idOrSlug) } : { slug: idOrSlug };
  const product = await store.products.findOne({ where, include: productInclude });
  if (!product) throw createError(404, 'Product not found');
  res.json(product);
};

exports.create = async (req, res) => {
  const body = { ...req.body };
  if (!body.name) throw createError(400, 'Product name is required');
  body.slug = slugify(body.slug || body.name);
  body.sku = body.sku || generateSku(body.name);
  if (body.size_guide_id === '') body.size_guide_id = null;
  ['sizes', 'colors'].forEach((k) => {
    if (typeof body[k] === 'string') {
      body[k] = body[k].split(',').map((v) => v.trim()).filter(Boolean);
    }
  });

  const product = await store.products.create(body);

  if (req.files && req.files.length) {
    const existingImages = await store.product_images.findByProductId(product.id);
    const hadImages = existingImages.length > 0;
    const mainFile = req.files.find((f) => f.fieldname === 'main_image');
    const detailFiles = req.files.filter((f) => f.fieldname === 'detail_images') || [];

    const imageRecords = [];

    if (mainFile) {
      imageRecords.push({
        url: `/uploads/${mainFile.filename}`,
        product_id: product.id,
        is_main: true,
        is_primary: true,
        price: null,
      });
    } else if (!hadImages && detailFiles.length) {
      imageRecords.push({
        url: `/uploads/${detailFiles[0].filename}`,
        product_id: product.id,
        is_main: true,
        is_primary: true,
        price: null,
      });
    }

    for (let i = 0; i < detailFiles.length; i++) {
      const file = detailFiles[i];
      const isMain = !mainFile && i === 0 && !hadImages;
      imageRecords.push({
        url: `/uploads/${file.filename}`,
        product_id: product.id,
        is_main: isMain,
        is_primary: isMain,
        price: null,
      });
    }

    if (imageRecords.length) {
      await store.product_images.bulkCreate(imageRecords);
    }
  }

  const full = await store.products.findByPk(product.id);
  res.status(201).json(full);
};

exports.update = async (req, res) => {
  const product = await store.products.findByPk(req.params.id);
  if (!product) throw createError(404, 'Product not found');

  const body = { ...req.body };
  if (body.name && !body.slug) body.slug = slugify(body.name);
  if (body.slug) body.slug = slugify(body.slug);
  if (body.name && !body.sku) body.sku = generateSku(body.name);
  if (body.sku) body.sku = body.sku.toUpperCase().replace(/\s+/g, '-');
  if (body.size_guide_id === '') body.size_guide_id = null;
  ['sizes', 'colors'].forEach((k) => {
    if (typeof body[k] === 'string') {
      body[k] = body[k].split(',').map((v) => v.trim()).filter(Boolean);
    }
  });

  const updated = await store.products.update(product.id, body);
  console.log('Update payload:', body);
  console.log('Updated product:', updated);

  if (req.files && req.files.length) {
    const existingImages = await store.product_images.findByProductId(product.id);
    const hadImages = existingImages.length > 0;
    const mainFile = req.files.find((f) => f.fieldname === 'main_image');
    const detailFiles = req.files.filter((f) => f.fieldname === 'detail_images') || [];

    const imageRecords = [];

    if (mainFile) {
      imageRecords.push({
        url: `/uploads/${mainFile.filename}`,
        product_id: product.id,
        is_main: true,
        is_primary: true,
        price: null,
      });
    } else if (!hadImages && detailFiles.length) {
      imageRecords.push({
        url: `/uploads/${detailFiles[0].filename}`,
        product_id: product.id,
        is_main: true,
        is_primary: true,
        price: null,
      });
    }

    for (let i = 0; i < detailFiles.length; i++) {
      const file = detailFiles[i];
      const isMain = !mainFile && i === 0 && !hadImages;
      imageRecords.push({
        url: `/uploads/${file.filename}`,
        product_id: product.id,
        is_main: isMain,
        is_primary: isMain,
        price: null,
      });
    }

    if (imageRecords.length) {
      await store.product_images.bulkCreate(imageRecords);
    }
  }

  const full = await store.products.findByPk(updated.id);
  res.json(full);
};

exports.remove = async (req, res) => {
  const product = await store.products.findByPk(req.params.id);
  if (!product) throw createError(404, 'Product not found');
  await store.products.destroy(product.id);
  res.json({ message: 'Product deleted' });
};

exports.setMainImage = async (req, res) => {
  const product = await store.products.findByPk(req.params.id);
  if (!product) throw createError(404, 'Product not found');

  const { imageId } = req.body;
  if (!imageId) throw createError(400, 'imageId is required');

  await store.product_images.update(imageId, { is_main: true, is_primary: true });

  const allImages = await store.product_images.findAll();
  for (const img of allImages) {
    if (img.product_id === product.id && img.id !== imageId) {
      await store.product_images.update(img.id, { is_main: false, is_primary: false });
    }
  }

  res.json({ message: 'Main image updated' });
};

exports.uploadMainImage = async (req, res) => {
  const product = await store.products.findByPk(req.params.id);
  if (!product) throw createError(404, 'Product not found');
  if (!req.file) throw createError(400, 'No image uploaded');

  const existingMain = await store.product_images.findByProductId(product.id).then(
    (imgs) => imgs.find((img) => img.is_main)
  );

  if (existingMain) {
    await store.product_images.update(existingMain.id, {
      url: `/uploads/${req.file.filename}`,
      is_main: true,
      is_primary: true,
    });
  } else {
    await store.product_images.create({
      url: `/uploads/${req.file.filename}`,
      product_id: product.id,
      is_main: true,
      is_primary: true,
      price: null,
    });
  }

  res.json({ message: 'Main image updated' });
};

exports.uploadDetailImages = async (req, res) => {
  const product = await store.products.findByPk(req.params.id);
  if (!product) throw createError(404, 'Product not found');
  if (!req.files || !req.files.length) throw createError(400, 'No images uploaded');

  const hadImages = (await store.product_images.findByProductId(product.id)).length > 0;

  const created = [];
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const isMain = !hadImages && i === 0;
    const record = await store.product_images.create({
      url: `/uploads/${file.filename}`,
      product_id: product.id,
      is_main: isMain,
      is_primary: isMain,
      price: null,
    });
    created.push(record);
  }
  res.status(201).json(created);
};

exports.updateImagePrice = async (req, res) => {
  const image = await store.product_images.findByPk(req.params.imageId);
  if (!image) throw createError(404, 'Image not found');

  const { price } = req.body;
  const updated = await store.product_images.update(image.id, {
    price: price !== undefined && price !== '' ? parseFloat(price) : null,
  });
  res.json(updated);
};

exports.removeImage = async (req, res) => {
  const image = await store.product_images.findByPk(req.params.imageId);
  if (!image) throw createError(404, 'Image not found');
  await store.product_images.destroy(image.id);
  res.json({ message: 'Image removed' });
};
