const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.get('/:id', notificationController.getById);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
