const { z } = require('zod');

const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
};

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email').optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};
