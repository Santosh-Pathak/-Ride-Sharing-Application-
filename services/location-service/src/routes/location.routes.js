const express = require('express');
const locationController = require('../controllers/location.controller');
const { authenticate, requireDriver } = require('../middleware/auth.middleware');
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

router.get('/nearby', validateNearbyQuery, locationController.getNearby);
router.get('/driver/:driverId', locationController.getDriver);
router.get('/eta', validateEtaQuery, locationController.getEta);

module.exports = router;
