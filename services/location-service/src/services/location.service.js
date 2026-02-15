const Location = require('../models/Location.model');
const LocationHistory = require('../models/LocationHistory.model');
const {
  updateDriverLocation: updateRedisLocation,
  removeDriver,
  getNearbyDrivers: getNearbyFromRedis,
  getDriverPosition,
} = require('../cache/redis.cache');
const { haversineKm, etaMinutes } = require('./geospatial.service');
const { AppError } = require('@rideshare/shared');

function validateCoords(lat, lng) {
  if (lat == null || lng == null) throw new AppError('lat and lng are required', 400, 'VALIDATION_ERROR');
  const latN = Number(lat);
  const lngN = Number(lng);
  if (Number.isNaN(latN) || latN < -90 || latN > 90) {
    throw new AppError('Invalid latitude', 400, 'VALIDATION_ERROR');
  }
  if (Number.isNaN(lngN) || lngN < -180 || lngN > 180) {
    throw new AppError('Invalid longitude', 400, 'VALIDATION_ERROR');
  }
  return { lat: latN, lng: lngN };
}

async function updateLocation(driverId, { lat, lng, heading, speed, isAvailable }) {
  const { lat: latN, lng: lngN } = validateCoords(lat, lng);
  const geoJson = {
    type: 'Point',
    coordinates: [lngN, latN],
  };
  await Location.findOneAndUpdate(
    { driverId },
    {
      driverId,
      location: geoJson,
      ...(heading !== undefined && { heading }),
      ...(speed !== undefined && { speed }),
      ...(isAvailable !== undefined && { isAvailable }),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  await LocationHistory.create({
    driverId,
    location: geoJson,
    heading,
    speed,
  });
  await updateRedisLocation(driverId, lngN, latN, isAvailable !== false);
  return { lat: latN, lng: lngN, heading, speed, isAvailable };
}

async function setDriverOffline(driverId) {
  await removeDriver(driverId);
  await Location.findOneAndUpdate(
    { driverId },
    { isAvailable: false, updatedAt: new Date() },
    { new: true }
  );
  return { driverId, isAvailable: false };
}

async function getNearbyDrivers(lng, lat, radiusKm = 5, limit = 20) {
  const { lat: latN, lng: lngN } = validateCoords(lat, lng);
  const radius = Math.min(Number(radiusKm) || 5, 50);
  const cappedLimit = Math.min(Number(limit) || 20, 50);
  const fromRedis = await getNearbyFromRedis(lngN, latN, radius, cappedLimit);
  return fromRedis;
}

async function getDriverLocation(driverId) {
  const fromRedis = await getDriverPosition(driverId);
  if (fromRedis) return fromRedis;
  const doc = await Location.findOne({ driverId }).lean();
  if (!doc || !doc.location || !doc.location.coordinates) return null;
  const [lng, lat] = doc.location.coordinates;
  return { lng, lat, heading: doc.heading, speed: doc.speed, isAvailable: doc.isAvailable };
}

async function getEta(fromLat, fromLng, toLat, toLng, avgSpeedKmh = 30) {
  const { lat: fLat, lng: fLng } = validateCoords(fromLat, fromLng);
  const { lat: tLat, lng: tLng } = validateCoords(toLat, toLng);
  const distanceKm = haversineKm(fLat, fLng, tLat, tLng);
  const minutes = etaMinutes(distanceKm, avgSpeedKmh);
  return { distanceKm, etaMinutes: Math.round(minutes * 10) / 10 };
}

module.exports = {
  updateLocation,
  setDriverOffline,
  getNearbyDrivers,
  getDriverLocation,
  getEta,
  validateCoords,
};
