const { z } = require('zod');
const createError = require('http-errors');
const schemas = require('../schemas');

function validate(schemaName, source = 'body') {
  const schema = schemas[schemaName];
  if (!schema) throw new Error(`Unknown schema: ${schemaName}`);
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source] || {});
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        next(createError(400, 'Validation failed', { details: err.errors }));
      } else {
        next(err);
      }
    }
  };
}

module.exports = {
  validate,
};
