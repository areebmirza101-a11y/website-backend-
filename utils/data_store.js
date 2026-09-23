const models = require('../models');

const store = {
  users: {
    findAll: () => models.users.findAll(),
    findByPk: (id) => models.users.findById(id),
    findByEmail: (email) => models.users.findByEmail(email),
    create: (data) => models.users.create(data),
    update: (id, data) => models.users.update(id, data),
    destroy: (id) => models.users.delete(id),
    count: (where = {}) => models.users.count(where),
  },

  categories: {
    findAll: (opts = {}) => models.categories.findAll(opts),
    findByPk: (id) => models.categories.findById(id),
    findBySlug: (slug) => models.categories.findBySlug(slug),
    create: (data) => models.categories.create(data),
    update: (id, data) => models.categories.update(id, data),
    destroy: (id) => models.categories.delete(id),
    count: () => models.categories.count(),
    findChildren: (parentId) => models.categories.findChildren(parentId),
    findWithChildren: () => models.categories.findWithChildren(),
  },

  products: {
    findAll: (opts = {}) => models.products.findAll(opts),
    findOne: (opts) => models.products.findOne(opts),
    findByPk: (id) => models.products.findById(id),
    findBySlug: (slug) => models.products.findBySlug(slug),
    create: (data) => models.products.create(data),
    update: (id, data) => models.products.update(id, data),
    destroy: (id) => models.products.delete(id),
    count: (where = {}) => models.products.count(where),
    increment: (field, { by = 1, where = {} }) => models.products.increment(field, { by, where }),
  },

  product_images: {
    findAll: () => models.product_images.findAll(),
    findByPk: (id) => models.product_images.findById(id),
    findByProductId: (productId) => models.product_images.findByProductId(productId),
    create: (data) => models.product_images.create(data),
    bulkCreate: (list) => models.product_images.bulkCreate(list),
    update: (id, data) => models.product_images.update(id, data),
    destroy: (id) => models.product_images.delete(id),
    deleteByProductId: (productId) => models.product_images.deleteByProductId(productId),
  },

  orders: {
    findAll: (opts = {}) => models.orders.findAll(opts),
    findOne: (opts) => models.orders.findById(opts.where?.id),
    findByPk: (id) => models.orders.findById(id),
    create: (data) => models.orders.create(data),
    update: (id, data) => models.orders.update(id, data),
    count: (where = {}) => models.orders.count(where),
  },

  order_items: {
    findAll: () => models.order_items.findAll(),
    bulkCreate: (list) => models.order_items.bulkCreate(list),
    destroy: (id) => models.order_items.delete(id),
  },

  heroContent: {
    findAll: () => models.heroContent.findAll(),
    findById: (id) => models.heroContent.findById(id),
    create: (data) => models.heroContent.create(data),
    update: (id, data) => models.heroContent.update(id, data),
    destroy: (id) => models.heroContent.delete(id),
  },

  settings: {
    findAll: () => models.settings.findAll(),
    findFirst: () => models.settings.findFirst(),
    create: (data) => models.settings.create(data),
    update: (id, data) => models.settings.update(id, data),
    destroy: (id) => models.settings.delete(id),
  },

  contact_messages: {
    findAll: () => models.contact_messages.findAll(),
    findById: (id) => models.contact_messages.findById(id),
    create: (data) => models.contact_messages.create(data),
    update: (id, data) => models.contact_messages.update(id, data),
    countUnread: () => models.contact_messages.countUnread(),
  },

  page_views: {
    create: (data) => models.page_views.create(data),
    findSince: (sinceIso) => models.page_views.findSince(sinceIso),
    count: () => models.page_views.count(),
  },
};

module.exports = {
  store,
};
