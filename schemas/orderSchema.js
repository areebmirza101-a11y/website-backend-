const { z } = require('zod');

const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
};

const orderItemSchema = z.object({
  productId: z.preprocess(toNumber, z.number().int().positive('Product ID must be positive')),
  quantity: z.preprocess(toNumber, z.number().int().positive().optional()),
  size: z.string().optional(),
  color: z.string().optional(),
});

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
});

const checkoutSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Cart is empty'),
  customer: customerSchema,
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
});

const orderStatusSchema = z.object({
  status: z.string().optional(),
  payment_status: z.string().optional(),
});

module.exports = {
  checkoutSchema,
  orderStatusSchema,
  orderItemSchema,
  customerSchema,
};
