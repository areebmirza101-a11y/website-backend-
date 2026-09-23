const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.post('/', validate('contactMessageSchema'), ctrl.create);
router.get('/', authenticate, requireAdmin, ctrl.list);
router.get('/unread-count', authenticate, requireAdmin, ctrl.unreadCount);
router.patch('/:id/read', authenticate, requireAdmin, ctrl.markRead);

module.exports = router;
