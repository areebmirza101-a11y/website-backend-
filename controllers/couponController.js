const CouponModel = require('../models/couponModel');
const createError = require('http-errors');

exports.validateCoupon = async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) throw createError(400, 'Please enter a coupon code');

  const orderAmount = parseFloat(subtotal) || 0;
  const coupon = await CouponModel.findByCode(code);

  if (!coupon) {
    throw createError(404, 'Invalid coupon code. Please check and try again.');
  }

  if (!coupon.active) {
    throw createError(400, 'This promo code is no longer active.');
  }

  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    throw createError(400, 'This promo code has not started yet.');
  }

  if (coupon.end_date && new Date(coupon.end_date) < now) {
    throw createError(400, 'This promo code has expired.');
  }

  if (coupon.min_order_amount > 0 && orderAmount < coupon.min_order_amount) {
    throw createError(
      400,
      `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required for coupon ${coupon.code}`
    );
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (orderAmount * coupon.discount_value) / 100;
  } else {
    discountAmount = coupon.discount_value;
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, orderAmount);
  discountAmount = Math.round(discountAmount * 100) / 100;

  res.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
      min_order_amount: coupon.min_order_amount,
    },
    message: `Coupon ${coupon.code} applied successfully!`,
  });
};

exports.listCoupons = async (req, res) => {
  const coupons = await CouponModel.findAll();
  res.json(coupons);
};

exports.createCoupon = async (req, res) => {
  const { code, name, discount_type, discount_value, min_order_amount, start_date, end_date, active } = req.body;
  if (!code || !code.trim()) throw createError(400, 'Coupon code is required');
  if (discount_value === undefined || isNaN(discount_value) || Number(discount_value) <= 0) {
    throw createError(400, 'A valid discount value greater than 0 is required');
  }

  // Check duplicate
  const exists = await CouponModel.findByCode(code);
  if (exists) throw createError(409, `Coupon with code "${code.trim().toUpperCase()}" already exists`);

  const coupon = await CouponModel.create({
    code,
    name: name || `${code.trim().toUpperCase()} Promo`,
    discount_type,
    discount_value,
    min_order_amount,
    start_date,
    end_date,
    active,
  });

  res.status(201).json(coupon);
};

exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const existing = await CouponModel.findById(id);
  if (!existing) throw createError(404, 'Coupon not found');

  if (req.body.code && req.body.code.trim().toUpperCase() !== existing.code) {
    const dup = await CouponModel.findByCode(req.body.code);
    if (dup && dup.id !== Number(id)) {
      throw createError(409, `Coupon with code "${req.body.code.trim().toUpperCase()}" already exists`);
    }
  }

  const updated = await CouponModel.update(id, req.body);
  res.json(updated);
};

exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  const existing = await CouponModel.findById(id);
  if (!existing) throw createError(404, 'Coupon not found');

  await CouponModel.delete(id);
  res.status(204).send();
};

exports.toggleCoupon = async (req, res) => {
  const { id } = req.params;
  const existing = await CouponModel.findById(id);
  if (!existing) throw createError(404, 'Coupon not found');

  const updated = await CouponModel.update(id, { active: !existing.active });
  res.json(updated);
};

