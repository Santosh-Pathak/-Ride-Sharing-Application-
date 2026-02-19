const { logger } = require('@rideshare/shared');

const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://localhost:3003';

async function getNearbyDrivers(pickupLat, pickupLng, radiusKm = 5, limit = 10) {
  const q = `lat=${encodeURIComponent(pickupLat)}&lng=${encodeURIComponent(pickupLng)}&radiusKm=${radiusKm}&limit=${limit}`;
  const url = `${LOCATION_SERVICE_URL}/location/nearby?${q}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn('Location service nearby failed', { status: res.status });
      return [];
    }
    const data = await res.json();
    const drivers = data.data?.drivers || [];
    return drivers.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  } catch (err) {
    logger.error('Matching: fetch nearby failed', { error: err.message });
    return [];
  }
}

function selectBestDriver(nearbyDrivers) {
  if (!nearbyDrivers || nearbyDrivers.length === 0) return null;
  return nearbyDrivers[0];
}

module.exports = { getNearbyDrivers, selectBestDriver };
