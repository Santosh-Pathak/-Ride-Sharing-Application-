const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
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

describe('Ride service integration', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await Ride.deleteMany({});
    await mongoose.connection.close();
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'ride-service');
  });

  it('POST /rides without auth returns 401', async () => {
    const res = await request(app)
      .post('/rides')
      .send({ pickupLat: 40.71, pickupLng: -74, dropoffLat: 40.76, dropoffLng: -73.98 });
    assert.strictEqual(res.status, 401);
  });

  it('POST /rides with auth creates ride', async () => {
    const token = tokenFor('rider-1', 'rider');
    const res = await request(app)
      .post('/rides')
      .set('Authorization', `Bearer ${token}`)
      .send({ pickupLat: 40.71, pickupLng: -74, dropoffLat: 40.76, dropoffLng: -73.98 });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.ride._id);
    assert.strictEqual(res.body.data.ride.riderId, 'rider-1');
    assert.ok(['requested', 'matched'].includes(res.body.data.ride.status));
    assert.ok(res.body.data.ride.fare?.total >= 0);
  });

  it('GET /rides returns my rides', async () => {
    const token = tokenFor('rider-1', 'rider');
    const res = await request(app).get('/rides').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.rides));
  });

  it('POST /rides with invalid body returns 400', async () => {
    const token = tokenFor('rider-1', 'rider');
    const res = await request(app)
      .post('/rides')
      .set('Authorization', `Bearer ${token}`)
      .send({ pickupLat: 40.71 });
    assert.strictEqual(res.status, 400);
  });
});
