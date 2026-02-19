const Ride = require('../models/Ride.model');
const { RIDE_STATUS } = require('@rideshare/shared');
const { AppError } = require('@rideshare/shared');
const { assertTransition } = require('./stateMachine');
const { getNearbyDrivers, selectBestDriver } = require('./matching.service');
const { estimateFare, calculateFare, getSurgeMultiplier } = require('./fare.service');
const {
  publishRideRequested,
  publishRideMatched,
  publishRideAccepted,
  publishRideRejected,
  publishRideStarted,
  publishRideCompleted,
  publishRideCancelled,
} = require('../events/ride.producer');
const { logger } = require('@rideshare/shared');

const ACCEPTANCE_TIMEOUT_SEC = Number(process.env.ACCEPTANCE_TIMEOUT_SEC) || 60;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toLatLng(point) {
  if (!point?.coordinates || point.coordinates.length < 2) return null;
  return { lng: point.coordinates[0], lat: point.coordinates[1] };
}

async function createRide(riderId, { pickupLat, pickupLng, dropoffLat, dropoffLng }) {
  const pickup = { type: 'Point', coordinates: [Number(pickupLng), Number(pickupLat)] };
  const dropoff = { type: 'Point', coordinates: [Number(dropoffLng), Number(dropoffLat)] };
  const distanceKm = haversineKm(
    pickup.coordinates[1],
    pickup.coordinates[0],
    dropoff.coordinates[1],
    dropoff.coordinates[0]
  );
  const estimatedDurationMin = (distanceKm / 30) * 60;
  const surge = getSurgeMultiplier();
  const fareEstimate = estimateFare(distanceKm, estimatedDurationMin, surge);

  const ride = await Ride.create({
    riderId,
    pickup,
    dropoff,
    status: RIDE_STATUS.REQUESTED,
    fare: fareEstimate,
  });

  const nearby = await getNearbyDrivers(pickupLat, pickupLng, 5, 10);
  const driver = selectBestDriver(nearby);

  if (driver && driver.driverId) {
    ride.driverId = driver.driverId;
    ride.status = RIDE_STATUS.MATCHED;
    ride.matchedAt = new Date();
    ride.acceptanceTimeoutAt = new Date(Date.now() + ACCEPTANCE_TIMEOUT_SEC * 1000);
    await ride.save();
    try {
      await publishRideMatched(ride);
    } catch (e) {
      logger.warn('Kafka publish ride.matched failed', { error: e.message });
    }
  }

  try {
    await publishRideRequested(ride);
  } catch (e) {
    logger.warn('Kafka publish ride.requested failed', { error: e.message });
  }

  return ride;
}

async function cancelRide(rideId, userId, role, reason) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.riderId !== userId && ride.driverId !== userId && role !== 'admin') {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  assertTransition(ride.status, RIDE_STATUS.CANCELLED);
  ride.status = RIDE_STATUS.CANCELLED;
  ride.cancelledAt = new Date();
  ride.cancellationReason = reason || 'User cancelled';
  await ride.save();
  try {
    await publishRideCancelled(ride, ride.cancellationReason);
  } catch (e) {
    logger.warn('Kafka publish ride.cancelled failed', { error: e.message });
  }
  return ride;
}

async function acceptRide(rideId, driverId) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.driverId !== driverId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  assertTransition(ride.status, RIDE_STATUS.ACCEPTED);
  ride.status = RIDE_STATUS.ACCEPTED;
  ride.acceptedAt = new Date();
  ride.acceptanceTimeoutAt = undefined;
  await ride.save();
  try {
    await publishRideAccepted(ride);
  } catch (e) {
    logger.warn('Kafka publish ride.accepted failed', { error: e.message });
  }
  return ride;
}

async function rejectRide(rideId, driverId, reason) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.driverId !== driverId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  ride.driverId = null;
  ride.status = RIDE_STATUS.REQUESTED;
  ride.matchedAt = null;
  ride.acceptanceTimeoutAt = null;
  await ride.save();
  try {
    await publishRideRejected(ride, reason);
  } catch (e) {
    logger.warn('Kafka publish ride.rejected failed', { error: e.message });
  }
  const pickup = toLatLng(ride.pickup);
  if (pickup) {
    const nearby = await getNearbyDrivers(pickup.lat, pickup.lng, 5, 10);
    const next = selectBestDriver(nearby.filter((d) => d.driverId !== driverId));
    if (next && next.driverId) {
      ride.driverId = next.driverId;
      ride.status = RIDE_STATUS.MATCHED;
      ride.matchedAt = new Date();
      ride.acceptanceTimeoutAt = new Date(Date.now() + ACCEPTANCE_TIMEOUT_SEC * 1000);
      await ride.save();
      await publishRideMatched(ride).catch(() => {});
    }
  }
  return ride;
}

async function startRide(rideId, driverId) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.driverId !== driverId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  assertTransition(ride.status, RIDE_STATUS.IN_PROGRESS);
  ride.status = RIDE_STATUS.IN_PROGRESS;
  ride.startedAt = new Date();
  await ride.save();
  try {
    await publishRideStarted(ride);
  } catch (e) {
    logger.warn('Kafka publish ride.started failed', { error: e.message });
  }
  return ride;
}

async function completeRide(rideId, driverId, distanceKm, durationMin) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.driverId !== driverId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  assertTransition(ride.status, RIDE_STATUS.COMPLETED);
  const surge = getSurgeMultiplier();
  const fare = calculateFare(
    distanceKm ?? ride.fare?.distanceKm ?? 0,
    durationMin ?? ride.fare?.durationMin ?? 0,
    surge
  );
  ride.fare = fare;
  ride.status = RIDE_STATUS.COMPLETED;
  ride.completedAt = new Date();
  await ride.save();
  try {
    await publishRideCompleted(ride);
  } catch (e) {
    logger.warn('Kafka publish ride.completed failed', { error: e.message });
  }
  return ride;
}

async function getRide(rideId, userId, role) {
  const ride = await Ride.findById(rideId).lean();
  if (!ride) throw new AppError('Ride not found', 404, 'NOT_FOUND');
  if (ride.riderId !== userId && ride.driverId !== userId && role !== 'admin') {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  return ride;
}

async function getMyRides(userId, role, { asRider, asDriver, limit = 20 } = {}) {
  const filter = {};
  if (role === 'admin') {
    // admin can see all or filter
  } else if (asRider) {
    filter.riderId = userId;
  } else if (asDriver) {
    filter.driverId = userId;
  } else {
    filter.$or = [{ riderId: userId }, { driverId: userId }];
  }
  const rides = await Ride.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
  return rides;
}

async function releaseTimedOutMatches() {
  const now = new Date();
  const timedOut = await Ride.find({
    status: RIDE_STATUS.MATCHED,
    acceptanceTimeoutAt: { $lte: now },
  });
  for (const ride of timedOut) {
    ride.driverId = null;
    ride.status = RIDE_STATUS.REQUESTED;
    ride.matchedAt = null;
    ride.acceptanceTimeoutAt = null;
    await ride.save();
    const pickup = toLatLng(ride.pickup);
    if (pickup) {
      const nearby = await getNearbyDrivers(pickup.lat, pickup.lng, 5, 10);
      const next = selectBestDriver(nearby);
      if (next && next.driverId) {
        ride.driverId = next.driverId;
        ride.status = RIDE_STATUS.MATCHED;
        ride.matchedAt = new Date();
        ride.acceptanceTimeoutAt = new Date(Date.now() + ACCEPTANCE_TIMEOUT_SEC * 1000);
        await ride.save();
        await publishRideMatched(ride).catch(() => {});
      }
    }
  }
}

module.exports = {
  createRide,
  cancelRide,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  getRide,
  getMyRides,
  releaseTimedOutMatches,
};
