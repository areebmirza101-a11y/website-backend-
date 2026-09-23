const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validation');

router.get('/', ctrl.list);
router.get('/with-subs', ctrl.listWithSubs);
router.get('/:id/subcategories', ctrl.getSubcategories);
router.post('/', authenticate, requireAdmin, upload.single('bg_image'), validate('categoryBodySchema'), ctrl.create);
router.put('/:id', authenticate, requireAdmin, upload.single('bg_image'), validate('categoryBodySchema'), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
