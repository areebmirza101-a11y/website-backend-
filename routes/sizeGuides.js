const express = require('express');
const router = express.Router();
const SizeGuideController = require('../controllers/sizeGuideController');

router.get('/public', SizeGuideController.getActive);

module.exports = router;
