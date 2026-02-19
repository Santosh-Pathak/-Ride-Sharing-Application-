const { AppError } = require('@rideshare/shared');

function validateCreateRide(req, res, next) {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;
  const latLng = (v) => v !== undefined && v !== null && !Number.isNaN(Number(v));
  if (!latLng(pickupLat) || !latLng(pickupLng) || !latLng(dropoffLat) || !latLng(dropoffLng)) {
    return next(new AppError('pickupLat, pickupLng, dropoffLat, dropoffLng are required and must be numbers', 400, 'VALIDATION_ERROR'));
  }
  next();
}

module.exports = { validateCreateRide };
