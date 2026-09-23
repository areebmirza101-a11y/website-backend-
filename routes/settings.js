const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public', ctrl.getPublicSettings);
router.get('/', authenticate, requireAdmin, ctrl.getSettings);
router.put(
  '/',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'app_logo_file', maxCount: 1 },
    { name: 'app_favicon_file', maxCount: 1 },
    { name: 'hero_bg_file', maxCount: 1 },
  ]),
  ctrl.updateSettings
);

module.exports = router;