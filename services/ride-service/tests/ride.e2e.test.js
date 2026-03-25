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

const riderToken = tokenFor('rider-e2e-1', 'rider');
const driverToken = tokenFor('driver-e2e-1', 'driver');
const adminToken = tokenFor('admin-e2e-1', 'admin');

describe('Ride Service E2E Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Ride.deleteMany({ riderId: { $in: ['rider-e2e-1', 'rider-e2e-2'] } });
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('ride-service');
    });
  });

  describe('POST /rides', () => {
    it('should create a ride with valid coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7589,
          dropoffLng: -73.9851,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride._id).toBeDefined();
      expect(res.body.data.ride.riderId).toBe('rider-e2e-1');
      expect(res.body.data.ride.status).toBeDefined();
      expect(res.body.data.ride.pickup).toBeDefined();
      expect(res.body.data.ride.dropoff).toBeDefined();
      expect(res.body.data.ride.fare).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/rides')
        .send({ pickupLat: 40.71, pickupLng: -74, dropoffLat: 40.76, dropoffLng: -73.98 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ pickupLat: 40.71 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 'invalid',
          pickupLng: -74,
          dropoffLat: 40.76,
          dropoffLng: -73.98,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing dropoff coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ pickupLat: 40.71, pickupLng: -74 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /rides', () => {
    it('should return rides for authenticated user', async () => {
      const res = await request(app).get('/rides').set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.rides)).toBe(true);
    });

    it('should filter rides as rider', async () => {
      const res = await request(app)
        .get('/rides?asRider=true')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.rides)).toBe(true);
    });

    it('should filter rides as driver', async () => {
      const res = await request(app)
        .get('/rides?asDriver=true')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.rides)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/rides?limit=5')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rides.length).toBeLessThanOrEqual(5);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/rides');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Ride Lifecycle', () => {
    let rideId;

    it('should create a ride for lifecycle test', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7589,
          dropoffLng: -73.9851,
        });

      expect(res.status).toBe(201);
      rideId = res.body.data.ride._id;
    });

    it('should GET /rides/:id with valid ride ID', async () => {
      const res = await request(app)
        .get(`/rides/${rideId}`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride._id).toBe(rideId);
    });

    it('should return 404 for non-existent ride', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/rides/${fakeId}`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when non-participant tries to get ride', async () => {
      const otherUserToken = tokenFor('other-user-123', 'rider');
      const res = await request(app)
        .get(`/rides/${rideId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to get any ride', async () => {
      const res = await request(app)
        .get(`/rides/${rideId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /rides/:id/cancel', () => {
    let rideId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7589,
          dropoffLng: -73.9851,
        });
      rideId = res.body.data.ride._id;
    });

    it('should cancel ride by rider', async () => {
      const res = await request(app)
        .post(`/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride.status).toBe('cancelled');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post(`/rides/${rideId}/cancel`).send({ reason: 'Cancel' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent ride', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/rides/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ reason: 'Cancel' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /rides/:id/accept (driver actions)', () => {
    let rideId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7589,
          dropoffLng: -73.9851,
        });
      rideId = res.body.data.ride._id;
    });

    it('should return 403 when non-driver tries to accept', async () => {
      const res = await request(app)
        .post(`/rides/${rideId}/accept`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post(`/rides/${rideId}/accept`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent ride', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/rides/${fakeId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /rides/:id/reject (driver actions)', () => {
    let rideId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7589,
          dropoffLng: -73.9851,
        });
      rideId = res.body.data.ride._id;
    });

    it('should return 403 when non-driver tries to reject', async () => {
      const res = await request(app)
        .post(`/rides/${rideId}/reject`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ reason: 'Too far' });

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post(`/rides/${rideId}/reject`).send({ reason: 'Too far' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /rides/:id/start (driver actions)', () => {
    it('should return 403 when non-driver tries to start', async () => {
      const res = await request(app)
        .post('/rides/some-id/start')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/rides/some-id/start');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /rides/:id/complete (driver actions)', () => {
    it('should return 403 when non-driver tries to complete', async () => {
      const res = await request(app)
        .post('/rides/some-id/complete')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ distanceKm: 5, durationMin: 15 });

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/rides/some-id/complete')
        .send({ distanceKm: 5, durationMin: 15 });

      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject request with non-numeric coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 'abc',
          pickupLng: -74,
          dropoffLat: 40.76,
          dropoffLng: -73.98,
        });

      expect(res.status).toBe(400);
    });

    it('should reject request with NaN coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: NaN,
          pickupLng: -74,
          dropoffLat: 40.76,
          dropoffLng: -73.98,
        });

      expect(res.status).toBe(400);
    });

    it('should reject request with null coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: null,
          pickupLng: -74,
          dropoffLat: 40.76,
          dropoffLng: -73.98,
        });

      expect(res.status).toBe(400);
    });

    it('should reject request with invalid JSON', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid }');

      expect(res.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ride creation with same pickup and dropoff', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128,
          pickupLng: -74.006,
          dropoffLat: 40.7128,
          dropoffLng: -74.006,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.ride.fare.distanceKm).toBe(0);
    });

    it('should handle negative coordinates', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: -33.8688,
          pickupLng: 151.2093,
          dropoffLat: -33.8858,
          dropoffLng: 151.2075,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle coordinates with many decimal places', async () => {
      const res = await request(app)
        .post('/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLat: 40.7128123456789,
          pickupLng: -74.006123456789,
          dropoffLat: 40.7589123456789,
          dropoffLng: -73.985123456789,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
