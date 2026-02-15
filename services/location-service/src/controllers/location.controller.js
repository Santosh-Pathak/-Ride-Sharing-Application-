const locationService = require('../services/location.service');

async function updateLocation(req, res, next) {
  try {
    const driverId = req.user.driverId || req.user.userId;
    const result = await locationService.updateLocation(driverId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function setOffline(req, res, next) {
  try {
    const driverId = req.user.driverId || req.user.userId;
    const result = await locationService.setDriverOffline(driverId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getNearby(req, res, next) {
  try {
    const { lat, lng, radiusKm, limit } = req.query;
    const drivers = await locationService.getNearbyDrivers(lng, lat, radiusKm, limit);
    res.json({ success: true, data: { drivers } });
  } catch (err) {
    next(err);
  }
}

async function getDriver(req, res, next) {
  try {
    const { driverId } = req.params;
    const location = await locationService.getDriverLocation(driverId);
    if (!location) {
      return res.status(404).json({ success: false, error: 'Driver location not found' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
}

async function getEta(req, res, next) {
  try {
    const { fromLat, fromLng, toLat, toLng, avgSpeedKmh } = req.query;
    const result = await locationService.getEta(
      fromLat,
      fromLng,
      toLat,
      toLng,
      avgSpeedKmh ? Number(avgSpeedKmh) : undefined
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateLocation,
  setOffline,
  getNearby,
  getDriver,
  getEta,
};
