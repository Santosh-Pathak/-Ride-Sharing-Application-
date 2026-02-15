const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Driver = require('../../src/models/Driver.model');

describe('User service integration', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await User.deleteMany({});
    await Driver.deleteMany({});
    await mongoose.connection.close();
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'user-service');
  });

  it('POST /auth/register creates user and returns tokens', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'rider@test.com', password: 'password123', name: 'Rider One' });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
    assert.strictEqual(res.body.data.user.email, 'rider@test.com');
    assert.strictEqual(res.body.data.user.role, 'rider');
  });

  it('POST /auth/login returns tokens', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
  });

  it('POST /auth/login rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });

  it('GET /users/profile requires auth', async () => {
    const res = await request(app).get('/users/profile');
    assert.strictEqual(res.status, 401);
  });

  it('GET /users/profile returns user when authenticated', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    const token = loginRes.body.data.accessToken;
    const res = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.email, 'rider@test.com');
  });

  it('POST /auth/refresh returns new tokens', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    const refreshToken = loginRes.body.data.refreshToken;
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
  });

  it('POST /drivers/register creates driver and upgrades role', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    const token = loginRes.body.data.accessToken;
    const res = await request(app)
      .post('/drivers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ licenseNumber: 'DL123', vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2020 } });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.driver.licenseNumber, 'DL123');
    const user = await User.findOne({ email: 'rider@test.com' });
    assert.strictEqual(user.role, 'driver');
  });

  it('GET /drivers/me returns driver profile', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    const token = loginRes.body.data.accessToken;
    const res = await request(app)
      .get('/drivers/me')
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.driver.licenseNumber);
  });

  it('PATCH /drivers/me/availability updates availability', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'rider@test.com', password: 'password123' });
    const token = loginRes.body.data.accessToken;
    const res = await request(app)
      .patch('/drivers/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({ isAvailable: true });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.isAvailable, true);
  });
});
