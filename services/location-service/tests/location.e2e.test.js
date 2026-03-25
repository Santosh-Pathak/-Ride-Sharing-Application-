const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../../src/config/db.config');
const { app } = require('../../src/app');
const Location = require('../../src/models/Location.model');
const LocationHistory = require('../../src/models/LocationHistory.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function tokenFor(userId, role = 'driver') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

const driverToken = tokenFor('driver-loc-e2e-1', 'driver');
const riderToken = tokenFor('rider-loc-e2e-1', 'rider');

describe('Location Service E2E Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Location.deleteMany({ driverId: { $regex: /driver-loc-e2e/ } });
    await LocationHistory.deleteMany({ driverId: { $regex: /driver-loc-e2e/ } });
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('location-service');
    });
  });

  describe('PUT /location', () => {
    it('should update driver location with valid coordinates', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006, heading: 90, speed: 30 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lat).toBeDefined();
      expect(res.body.data.lng).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .put('/location')
        .send({ lat: 40.7128, lng: -74.006 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when non-driver tries to update location', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ lat: 40.7128, lng: -74.006 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid latitude (> 90)', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 95, lng: -74.006 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid longitude (> 180)', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -200 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for negative speed', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006, speed: -10 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid heading (> 360)', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006, heading: 400 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid heading (< 0)', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006, heading: -10 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept update with only lat and lng', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should accept string numeric values', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: '40.7128', lng: '-74.006' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should accept string numeric values for heading and speed', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006, heading: '90', speed: '30' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /location/offline', () => {
    it('should set driver offline', async () => {
      const res = await request(app)
        .post('/location/offline')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/location/offline');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when non-driver tries to go offline', async () => {
      const res = await request(app)
        .post('/location/offline')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /location/nearby', () => {
    beforeAll(async () => {
      await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006 });
    });

    it('should return nearby drivers with valid coordinates', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: -74.006 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.drivers)).toBe(true);
    });

    it('should respect radiusKm parameter', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: -74.006, radiusKm: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.drivers)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: -74.006, limit: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.drivers.length).toBeLessThanOrEqual(3);
    });

    it('should return 400 without lat parameter', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lng: -74.006 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 without lng parameter', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid lat format', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 'invalid', lng: -74.006 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid lng format', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for lat out of range', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 95, lng: -74.006 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for lng out of range', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: -200 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /location/driver/:driverId', () => {
    beforeAll(async () => {
      await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 40.7128, lng: -74.006 });
    });

    it('should return driver location by ID', async () => {
      const res = await request(app).get('/location/driver/driver-loc-e2e-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driverId).toBe('driver-loc-e2e-1');
    });

    it('should return 404 for non-existent driver', async () => {
      const res = await request(app).get('/location/driver/non-existent-driver-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /location/eta', () => {
    it('should calculate ETA with valid coordinates', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&fromLng=-74.006&toLat=40.7589&toLng=-73.9851'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.distanceKm).toBeDefined();
      expect(res.body.data.etaMinutes).toBeDefined();
    });

    it('should calculate ETA with custom avgSpeedKmh', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&fromLng=-74.006&toLat=40.7589&toLng=-73.9851&avgSpeedKmh=40'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.etaMinutes).toBeDefined();
    });

    it('should return 400 without fromLat', async () => {
      const res = await request(app).get(
        '/location/eta?fromLng=-74.006&toLat=40.7589&toLng=-73.9851'
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 without fromLng', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&toLat=40.7589&toLng=-73.9851'
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 without toLat', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&fromLng=-74.006&toLng=-73.9851'
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 without toLng', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&fromLng=-74.006&toLat=40.7589'
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should reject request with NaN coordinates', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: NaN, lng: -74.006 });

      expect(res.status).toBe(400);
    });

    it('should reject request with undefined coordinates', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid JSON', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid }');

      expect(res.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle location at equator', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 0, lng: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle location at international date line', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 0, lng: 180 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle location at north pole', async () => {
      const res = await request(app)
        .put('/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 90, lng: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle nearby search at boundary coordinates', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: -90, lng: 180 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
