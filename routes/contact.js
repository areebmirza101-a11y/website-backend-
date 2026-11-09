const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.post('/', validate('contactMessageSchema'), ctrl.create);
router.get('/', authenticate, requireAdmin, ctrl.list);
router.get('/unread-count', authenticate, requireAdmin, ctrl.unreadCount);
router.patch('/:id/read', authenticate, requireAdmin, ctrl.markRead);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);
router.post('/:id/reply', authenticate, requireAdmin, ctrl.reply);

module.exports = router;
