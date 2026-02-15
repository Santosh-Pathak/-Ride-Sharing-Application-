const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/db.config');
const { app } = require('../../src/app');
const Location = require('../../src/models/Location.model');
const LocationHistory = require('../../src/models/LocationHistory.model');

describe('Location service integration', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await Location.deleteMany({});
    await LocationHistory.deleteMany({});
    await mongoose.connection.close();
  });

  it('GET /location/health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'location-service');
  });

  it('GET /location/nearby without lat/lng returns 400', async () => {
    const res = await request(app).get('/location/nearby').query({});
    assert.strictEqual(res.status, 400);
  });

  it('GET /location/nearby with lat,lng returns 200 and drivers array', async () => {
    const res = await request(app).get('/location/nearby').query({ lat: 40.7128, lng: -74.006 });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.drivers));
  });

  it('GET /location/eta with required params returns distance and eta', async () => {
    const res = await request(app).get(
      '/location/eta?fromLat=40.7128&fromLng=-74.006&toLat=40.7589&toLng=-73.9851'
    );
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.data.distanceKm === 'number');
    assert.ok(typeof res.body.data.etaMinutes === 'number');
  });

  it('PUT /location without auth returns 401', async () => {
    const res = await request(app).put('/location').send({ lat: 40.71, lng: -74.0 });
    assert.strictEqual(res.status, 401);
  });
});
