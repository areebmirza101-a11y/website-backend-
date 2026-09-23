const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.post('/checkout', optionalAuth, validate('checkoutSchema'), ctrl.checkout);
router.get('/', authenticate, requireAdmin, ctrl.listAll);
router.patch('/:id/status', authenticate, requireAdmin, validate('orderStatusSchema'), ctrl.updateStatus);
router.get('/mine', authenticate, ctrl.listMine);
router.get('/:id', authenticate, ctrl.getOne);

module.exports = router;
