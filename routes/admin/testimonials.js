const express = require('express');
const router = express.Router();
const testimonialsController = require('../../controllers/admin/testimonialsController');

router.get('/', testimonialsController.list);
router.post('/', testimonialsController.create);
router.get('/:id', testimonialsController.getOne);
router.put('/:id', testimonialsController.update);
router.delete('/:id', testimonialsController.remove);

module.exports = router;
