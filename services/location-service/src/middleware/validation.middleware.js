const { AppError } = require('@rideshare/shared');

function validateLocationUpdate(req, res, next) {
  const { lat, lng, heading, speed } = req.body;
  if (lat === undefined && lng === undefined) {
    return next(new AppError('At least lat and lng are required', 400, 'VALIDATION_ERROR'));
  }
  const latN = lat !== undefined ? Number(lat) : null;
  const lngN = lng !== undefined ? Number(lng) : null;
  if (latN !== null && (Number.isNaN(latN) || latN < -90 || latN > 90)) {
    return next(new AppError('Invalid latitude', 400, 'VALIDATION_ERROR'));
  }
  if (lngN !== null && (Number.isNaN(lngN) || lngN < -180 || lngN > 180)) {
    return next(new AppError('Invalid longitude', 400, 'VALIDATION_ERROR'));
  }
  if (heading !== undefined && (Number.isNaN(Number(heading)) || heading < 0 || heading > 360)) {
    return next(new AppError('Invalid heading (0-360)', 400, 'VALIDATION_ERROR'));
  }
  if (speed !== undefined && (Number.isNaN(Number(speed)) || speed < 0)) {
    return next(new AppError('Invalid speed (non-negative)', 400, 'VALIDATION_ERROR'));
  }
  next();
}

function validateNearbyQuery(req, res, next) {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return next(new AppError('Query params lat and lng are required', 400, 'VALIDATION_ERROR'));
  }
  const latN = Number(lat);
  const lngN = Number(lng);
  if (Number.isNaN(latN) || latN < -90 || latN > 90) {
    return next(new AppError('Invalid latitude', 400, 'VALIDATION_ERROR'));
  }
  if (Number.isNaN(lngN) || lngN < -180 || lngN > 180) {
    return next(new AppError('Invalid longitude', 400, 'VALIDATION_ERROR'));
  }
  next();
}

function validateEtaQuery(req, res, next) {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return next(new AppError('Query params fromLat, fromLng, toLat, toLng are required', 400, 'VALIDATION_ERROR'));
  }
  next();
}

module.exports = { validateLocationUpdate, validateNearbyQuery, validateEtaQuery };
