const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validation');

router.get('/', validate('productQuerySchema', 'query'), ctrl.list);
router.get('/:idOrSlug', ctrl.getOne);

router.post('/', authenticate, requireAdmin, validate('productBodySchema'), ctrl.create);
router.put('/:id', authenticate, requireAdmin, validate('productBodySchema'), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

router.post('/:id/main-image', authenticate, requireAdmin, upload.single('main_image'), ctrl.uploadMainImage);
router.post('/:id/detail-images', authenticate, requireAdmin, upload.array('detail_images', 10), ctrl.uploadDetailImages);

router.put('/images/:imageId/price', authenticate, requireAdmin, ctrl.updateImagePrice);
router.put('/images/:imageId/main', authenticate, requireAdmin, ctrl.setMainImage);
router.delete('/images/:imageId', authenticate, requireAdmin, ctrl.removeImage);

module.exports = router;