const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/couponController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public validation endpoint for customers during Cart/Checkout
router.post('/validate', ctrl.validateCoupon);

// Admin endpoints (guarded by JWT and requireAdmin)
router.get('/admin', authenticate, requireAdmin, ctrl.listCoupons);
router.post('/admin', authenticate, requireAdmin, ctrl.createCoupon);
router.put('/admin/:id', authenticate, requireAdmin, ctrl.updateCoupon);
router.delete('/admin/:id', authenticate, requireAdmin, ctrl.deleteCoupon);
router.patch('/admin/:id/toggle', authenticate, requireAdmin, ctrl.toggleCoupon);

module.exports = router;

