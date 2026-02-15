const express = require('express');
const userController = require('../controllers/user.controller');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.post('/profile/avatar', uploadAvatar, uploadController.uploadAvatar);
router.delete('/profile', userController.deactivateProfile);

module.exports = router;
