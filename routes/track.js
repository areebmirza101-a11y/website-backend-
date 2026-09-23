const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');

router.post('/', trackController.track);

module.exports = router;
