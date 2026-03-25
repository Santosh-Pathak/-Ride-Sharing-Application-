const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Driver = require('../../src/models/Driver.model');

const TEST_EMAIL = `integration_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPassword123!';

describe('User Service Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Driver.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('user-service');
    });
  });

  describe('POST /auth/register', () => {
    it('creates user and returns tokens', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Integration Test User' });

      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.user.role).toBe('rider');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Duplicate' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('Authenticated Routes', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      token = res.body.data.accessToken;
    });

    it('GET /users/profile requires auth', async () => {
      const res = await request(app).get('/users/profile');
      expect(res.status).toBe(401);
    });

    it('GET /users/profile returns user when authenticated', async () => {
      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
    });

    it('POST /auth/refresh returns new tokens', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('POST /drivers/register creates driver and upgrades role', async () => {
      const res = await request(app)
        .post('/drivers/register')
        .set('Authorization', `Bearer ${token}`)
        .send({ licenseNumber: 'DL123', vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2020 } });

      expect(res.status).toBe(201);
      expect(res.body.data.driver.licenseNumber).toBe('DL123');

      const user = await User.findOne({ email: TEST_EMAIL });
      expect(user.role).toBe('driver');
    });

    it('GET /drivers/me returns driver profile', async () => {
      const res = await request(app)
        .get('/drivers/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.driver.licenseNumber).toBe('DL123');
    });

    it('PATCH /drivers/me/availability updates availability', async () => {
      const res = await request(app)
        .patch('/drivers/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ isAvailable: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(true);
    });
  });
});
