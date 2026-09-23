const userSchemas = require('./userSchema');
const categorySchemas = require('./categorySchema');
const productSchemas = require('./productSchema');
const orderSchemas = require('./orderSchema');
const contactSchemas = require('./contactSchema');

module.exports = {
  ...userSchemas,
  ...categorySchemas,
  ...productSchemas,
  ...orderSchemas,
  ...contactSchemas,
};
