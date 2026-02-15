const { getRedis } = require('@rideshare/shared');

const DRIVER_LOCATIONS_KEY = 'driver:locations';
const DRIVER_AVAILABLE_KEY = 'driver:available';

async function updateDriverLocation(driverId, lng, lat, isAvailable = true) {
  const redis = getRedis();
  await redis.geoadd(DRIVER_LOCATIONS_KEY, lng, lat, driverId);
  if (isAvailable) {
    await redis.sadd(DRIVER_AVAILABLE_KEY, driverId);
  } else {
    await redis.srem(DRIVER_AVAILABLE_KEY, driverId);
  }
  return true;
}

async function removeDriver(driverId) {
  const redis = getRedis();
  await redis.zrem(DRIVER_LOCATIONS_KEY, driverId);
  await redis.srem(DRIVER_AVAILABLE_KEY, driverId);
}

async function getNearbyDrivers(lng, lat, radiusKm, limit = 20) {
  const redis = getRedis();
  const results = await redis.georadius(
    DRIVER_LOCATIONS_KEY,
    lng,
    lat,
    radiusKm,
    'KM',
    'ASC',
    'COUNT',
    limit,
    'WITHDIST',
    'WITHCOORD'
  );
  if (!Array.isArray(results)) return [];
  return results.map((item) => {
    if (Array.isArray(item)) {
      const [driverId, dist, coords] = item;
      return {
        driverId: String(driverId),
        distanceKm: parseFloat(dist),
        coordinates: coords ? { lng: coords[0], lat: coords[1] } : null,
      };
    }
    return { driverId: String(item), distanceKm: null, coordinates: null };
  });
}

async function getNearbyDriverIds(lng, lat, radiusKm, limit = 20) {
  const redis = getRedis();
  const driverIds = await redis.georadius(
    DRIVER_LOCATIONS_KEY,
    lng,
    lat,
    radiusKm,
    'KM',
    'ASC',
    'COUNT',
    limit
  );
  return Array.isArray(driverIds) ? driverIds.map(String) : [];
}

async function getDriverPosition(driverId) {
  const redis = getRedis();
  const pos = await redis.geopos(DRIVER_LOCATIONS_KEY, driverId);
  if (!pos || !pos[0]) return null;
  const [lng, lat] = pos[0];
  return { lng: parseFloat(lng), lat: parseFloat(lat) };
}

async function isDriverAvailable(driverId) {
  const redis = getRedis();
  return redis.sismember(DRIVER_AVAILABLE_KEY, driverId);
}

module.exports = {
  updateDriverLocation,
  removeDriver,
  getNearbyDrivers,
  getNearbyDriverIds,
  getDriverPosition,
  isDriverAvailable,
  DRIVER_LOCATIONS_KEY,
  DRIVER_AVAILABLE_KEY,
};
