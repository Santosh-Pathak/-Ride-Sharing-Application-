const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Driver = require('../../src/models/Driver.model');

const testEmail = `e2e_${Date.now()}@test.com`;
const testPassword = 'TestPassword123!';
const testName = 'E2E Test User';

let accessToken;
let refreshToken;

describe('User Service E2E Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Driver.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200 with service info', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('user-service');
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword, name: testName });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.name).toBe(testName);
      expect(res.body.data.user.role).toBe('rider');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.expiresIn).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword, name: testName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'incomplete@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: testPassword, name: testName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'shortpwd@test.com', password: '123', name: testName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@test.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 400 for missing refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.name).toBe(testName);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /users/profile', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.name).toBe(testName);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update user profile successfully', async () => {
      const res = await request(app)
        .patch('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name', phone: '+1234567890' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.phone).toBe('+1234567890');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .patch('/users/profile')
        .send({ name: 'New Name' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /users/profile', () => {
    it('should deactivate user profile', async () => {
      const res = await request(app)
        .delete('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isActive).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).delete('/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /drivers/register', () => {
    beforeAll(async () => {
      await User.findOneAndUpdate(
        { email: testEmail },
        { isActive: true },
        { new: true }
      );
    });

    it('should register as driver successfully', async () => {
      const res = await request(app)
        .post('/drivers/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          licenseNumber: 'DL123456',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            color: 'Silver',
            plateNumber: 'ABC123',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver.licenseNumber).toBe('DL123456');
      expect(res.body.data.driver.vehicleInfo.make).toBe('Toyota');

      const user = await User.findOne({ email: testEmail });
      expect(user.role).toBe('driver');
    });

    it('should return 400 if already registered as driver', async () => {
      const res = await request(app)
        .post('/drivers/register')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ licenseNumber: 'DL789' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/drivers/register')
        .send({ licenseNumber: 'DL999' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /drivers/me', () => {
    it('should return driver profile', async () => {
      const res = await request(app)
        .get('/drivers/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver.licenseNumber).toBe('DL123456');
      expect(res.body.data.driver.userId).toBeDefined();
    });

    it('should return 403 for non-driver user', async () => {
      const userRes = await request(app)
        .post('/auth/register')
        .send({ email: `rider_${Date.now()}@test.com`, password: testPassword, name: 'Rider' });
      const riderToken = userRes.body.data.accessToken;

      const res = await request(app)
        .get('/drivers/me')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/drivers/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /drivers/me', () => {
    it('should update driver profile', async () => {
      const res = await request(app)
        .patch('/drivers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          licenseNumber: 'DL_UPDATED',
          vehicleInfo: { make: 'Honda', model: 'Accord', year: 2023 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver.licenseNumber).toBe('DL_UPDATED');
      expect(res.body.data.driver.vehicleInfo.make).toBe('Honda');
    });

    it('should return 404 for non-existent driver', async () => {
      const userRes = await request(app)
        .post('/auth/register')
        .send({
          email: `nondriver_${Date.now()}@test.com`,
          password: testPassword,
          name: 'Non Driver',
        });
      const token = userRes.body.data.accessToken;

      const res = await request(app)
        .patch('/drivers/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ licenseNumber: 'DL_NONE' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /drivers/me/availability', () => {
    it('should set driver availability to true', async () => {
      const res = await request(app)
        .patch('/drivers/me/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isAvailable: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(true);
    });

    it('should set driver availability to false', async () => {
      const res = await request(app)
        .patch('/drivers/me/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('should return 400 for non-boolean isAvailable', async () => {
      const res = await request(app)
        .patch('/drivers/me/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isAvailable: 'yes' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .patch('/drivers/me/availability')
        .send({ isAvailable: true });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should reject request with invalid JSON', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
    });

    it('should reject oversized payload', async () => {
      const largePayload = { email: testEmail, password: testPassword, name: 'A'.repeat(10000) };
      const res = await request(app)
        .post('/auth/register')
        .send(largePayload);

      expect(res.status).toBe(400);
    });
  });
});
