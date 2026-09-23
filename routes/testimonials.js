const express = require('express');
const router = express.Router();
const testimonialsController = require('../controllers/testimonialsController');

router.get('/', testimonialsController.list);

module.exports = router;
