const express = require('express');
const router = express.Router();
const AdminSizeGuideController = require('../../controllers/admin/sizeGuideController');

// All routes here are protected by admin auth middleware in app.js
router.get('/', AdminSizeGuideController.getAll);
router.post('/', AdminSizeGuideController.create);
router.put('/:id', AdminSizeGuideController.update);
router.delete('/:id', AdminSizeGuideController.delete);

module.exports = router;
