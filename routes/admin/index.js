const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboardController');
const customersController = require('../../controllers/admin/customersController');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// All /api/admin routes require an authenticated admin
router.use(authenticate, requireAdmin);

router.get('/stats', dashboardController.stats);
router.get('/customers', customersController.list);
router.get('/customers/:id', customersController.getOne);
router.delete('/customers/:id', customersController.remove);

router.use('/size-guides', require('./sizeGuides'));
router.use('/testimonials', require('./testimonials'));

module.exports = router;
