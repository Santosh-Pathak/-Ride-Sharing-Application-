const rideService = require('../services/ride.service');

async function create(req, res, next) {
  try {
    const riderId = req.user.userId;
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;
    const ride = await rideService.createRide(riderId, {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    });
    res.status(201).json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ride = await rideService.cancelRide(id, req.user.userId, req.user.role, reason);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;
    const ride = await rideService.acceptRide(id, driverId);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ride = await rideService.rejectRide(id, req.user.userId, reason);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await rideService.startRide(id, req.user.userId);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const { id } = req.params;
    const { distanceKm, durationMin } = req.body;
    const ride = await rideService.completeRide(id, req.user.userId, distanceKm, durationMin);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await rideService.getRide(id, req.user.userId, req.user.role);
    res.json({ success: true, data: { ride } });
  } catch (err) {
    next(err);
  }
}

async function getMine(req, res, next) {
  try {
    const { asRider, asDriver, limit } = req.query;
    const rides = await rideService.getMyRides(req.user.userId, req.user.role, {
      asRider: asRider === 'true',
      asDriver: asDriver === 'true',
      limit,
    });
    res.json({ success: true, data: { rides } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  cancel,
  accept,
  reject,
  start,
  complete,
  getById,
  getMine,
};
