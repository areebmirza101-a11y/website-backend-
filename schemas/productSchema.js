const { z } = require('zod');

const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
};

const productBodySchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.preprocess(toNumber, z.number().nonnegative('Price cannot be negative')),
  stock: z.preprocess(toNumber, z.number().int().nonnegative('Stock cannot be negative')),
  category_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : toNumber(val)),
    z.number().int().positive().nullable().optional()
  ),
  active: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional(),
  featured: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  material: z.string().optional(),
  images: z.array(z.object({
    url: z.string().optional(),
    is_main: z.boolean().optional(),
    is_primary: z.boolean().optional(),
    price: z.preprocess(toNumber, z.number().positive().optional()).optional(),
  })).optional(),
});

const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  admin: z.enum(['true', 'false']).optional(),
  page: z.preprocess(toNumber, z.number().int().positive().optional()),
  limit: z.preprocess(toNumber, z.number().int().positive().max(1000).optional()),
  offset: z.preprocess(toNumber, z.number().int().nonnegative().optional()),
});

module.exports = {
  productBodySchema,
  productQuerySchema,
};
