const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', analyticsController.dashboard);
router.get('/daily', analyticsController.daily);

module.exports = router;
