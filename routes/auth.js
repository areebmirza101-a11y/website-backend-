const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.post('/register', validate('registerSchema'), ctrl.register);
router.post('/login', validate('loginSchema'), ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
