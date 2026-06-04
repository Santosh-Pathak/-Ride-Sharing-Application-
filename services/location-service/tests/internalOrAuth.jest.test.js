const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { INTERNAL_SERVICE_HEADER } = require('@rideshare/shared');

describe('requireInternalOrAuth', () => {
  const secret = 'test-internal-secret-32chars!!';
  const jwtSecret = 'test-jwt-secret-for-internal-or-auth';

  beforeAll(() => {
    process.env.INTERNAL_SERVICE_SECRET = secret;
    process.env.JWT_SECRET = jwtSecret;
  });

  function buildApp() {
    jest.resetModules();
    const { requireInternalOrAuth } = require('../src/middleware/internalOrAuth.middleware');
    const app = express();
    app.get('/protected', requireInternalOrAuth, (req, res) => {
      res.json({
        ok: true,
        internalCaller: req.internalCaller,
        userId: req.user?.userId,
      });
    });
    return app;
  }

  test('returns 401 without internal key or JWT', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
  });

  test('allows valid internal service key', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set(INTERNAL_SERVICE_HEADER, secret)
      .set('x-internal-service-name', 'ride-service');
    expect(res.status).toBe(200);
    expect(res.body.internalCaller).toBe('ride-service');
  });

  test('allows valid JWT', async () => {
    const token = jwt.sign({ userId: 'u1', role: 'rider' }, jwtSecret);
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
  });
});
