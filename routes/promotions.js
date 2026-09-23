const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to get active promotions
router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotion);

// Admin routes
router.post('/', authenticate, requireAdmin, upload.fields([{ name: 'banner_image_file', maxCount: 1 }]), promotionController.createPromotion);
router.put('/:id', authenticate, requireAdmin, upload.fields([{ name: 'banner_image_file', maxCount: 1 }]), promotionController.updatePromotion);
router.delete('/:id', authenticate, requireAdmin, promotionController.deletePromotion);

module.exports = router;
