const express = require('express');
const rideController = require('../controllers/ride.controller');
const { authenticate, requireDriver } = require('../middleware/auth.middleware');
const { validateCreateRide } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', validateCreateRide, rideController.create);
router.get('/', rideController.getMine);
router.get('/:id', rideController.getById);
router.post('/:id/cancel', rideController.cancel);
router.post('/:id/accept', requireDriver, rideController.accept);
router.post('/:id/reject', requireDriver, rideController.reject);
router.post('/:id/start', requireDriver, rideController.start);
router.post('/:id/complete', requireDriver, rideController.complete);

module.exports = router;
