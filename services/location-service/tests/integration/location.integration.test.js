const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/db.config');
const { app } = require('../../src/app');
const Location = require('../../src/models/Location.model');
const LocationHistory = require('../../src/models/LocationHistory.model');

describe('Location Service Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Location.deleteMany({});
    await LocationHistory.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('location-service');
    });
  });

  describe('GET /location/nearby', () => {
    it('returns 400 without lat/lng', async () => {
      const res = await request(app).get('/location/nearby').query({});
      expect(res.status).toBe(400);
    });

    it('returns 200 and drivers array with lat,lng', async () => {
      const res = await request(app)
        .get('/location/nearby')
        .query({ lat: 40.7128, lng: -74.006 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.drivers)).toBe(true);
    });
  });

  describe('GET /location/eta', () => {
    it('returns distance and eta with required params', async () => {
      const res = await request(app).get(
        '/location/eta?fromLat=40.7128&fromLng=-74.006&toLat=40.7589&toLng=-73.9851'
      );

      expect(res.status).toBe(200);
      expect(typeof res.body.data.distanceKm).toBe('number');
      expect(typeof res.body.data.etaMinutes).toBe('number');
    });
  });

  describe('PUT /location', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put('/location')
        .send({ lat: 40.71, lng: -74.0 });
      expect(res.status).toBe(401);
    });
  });
});
