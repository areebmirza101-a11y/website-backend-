const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public subscription endpoint
router.post('/subscribe', newsletterController.subscribe);

// Admin-only list of newsletter subscribers
router.get('/subscribers', authenticate, requireAdmin, newsletterController.listSubscribers);

module.exports = router;
