const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const Ride = require('../../src/models/Ride.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function tokenFor(userId, role = 'rider') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Ride Service Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Ride.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('ride-service');
    });
  });

  describe('POST /rides', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/rides')
        .send({ pickupLat: 40.71, pickupLng: -74, dropoffLat: 40.76, dropoffLng: -73.98 });
      expect(res.status).toBe(401);
    });

    it('creates ride with valid auth', async () => {
      const token = tokenFor('rider-integration-1', 'rider');
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${token}`)
        .send({ pickupLat: 40.71, pickupLng: -74, dropoffLat: 40.76, dropoffLng: -73.98 });

      expect(res.status).toBe(201);
      expect(res.body.data.ride._id).toBeDefined();
      expect(res.body.data.ride.riderId).toBe('rider-integration-1');
      expect(['requested', 'matched'].includes(res.body.data.ride.status)).toBe(true);
      expect(res.body.data.ride.fare?.total).toBeGreaterThanOrEqual(0);
    });

    it('returns 400 with invalid body', async () => {
      const token = tokenFor('rider-integration-2', 'rider');
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${token}`)
        .send({ pickupLat: 40.71 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /rides', () => {
    it('returns my rides', async () => {
      const token = tokenFor('rider-integration-1', 'rider');
      const res = await request(app).get('/rides').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.rides)).toBe(true);
    });
  });
});
