const express = require('express');
const locationController = require('../controllers/location.controller');
const { authenticate, requireDriver } = require('../middleware/auth.middleware');
const { requireInternalOrAuth } = require('../middleware/internalOrAuth.middleware');
const {
  validateLocationUpdate,
  validateNearbyQuery,
  validateEtaQuery,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.put(
  '/',
  authenticate,
  requireDriver,
  validateLocationUpdate,
  locationController.updateLocation
);
router.post('/offline', authenticate, requireDriver, locationController.setOffline);

router.get('/nearby', requireInternalOrAuth, validateNearbyQuery, locationController.getNearby);
router.get('/driver/:driverId', requireInternalOrAuth, locationController.getDriver);
router.get('/eta', requireInternalOrAuth, validateEtaQuery, locationController.getEta);

module.exports = router;
