const express = require('express');
const driverController = require('../controllers/driver.controller');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireDriver } = require('../middleware/rbac.middleware');
const { uploadLicense } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/register', driverController.registerDriver);
router.get('/me', requireDriver, driverController.getMyDriverProfile);
router.patch('/me', requireDriver, driverController.updateDriverProfile);
router.patch('/me/availability', requireDriver, driverController.updateAvailability);
router.post('/documents/license', requireDriver, uploadLicense, uploadController.uploadLicense);

module.exports = router;
