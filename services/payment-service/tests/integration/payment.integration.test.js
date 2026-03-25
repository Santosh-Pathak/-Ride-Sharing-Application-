const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { pool } = require('../../src/config/db.config');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function tokenFor(userId) {
  return jwt.sign({ userId, role: 'rider' }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Payment Service Integration Tests', () => {
  beforeAll(async () => {
    await app.initDb();
    await pool.query('DELETE FROM transactions WHERE user_id = $1', ['user-pay-integration-1']);
    await pool.query('DELETE FROM payments WHERE user_id = $1', ['user-pay-integration-1']);
    await pool.query('DELETE FROM wallets WHERE user_id = $1', ['user-pay-integration-1']);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Health Check', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('payment-service');
    });
  });

  describe('GET /payments/wallet', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/payments/wallet');
      expect(res.status).toBe(401);
    });

    it('returns wallet with auth', async () => {
      const token = tokenFor('user-pay-integration-1');
      const res = await request(app)
        .get('/payments/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.wallet).toBeDefined();
      expect(typeof res.body.data.wallet.balanceCents).toBe('number');
    });
  });

  describe('POST /payments/wallet/topup', () => {
    it('increases balance', async () => {
      const token = tokenFor('user-pay-integration-1');
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountCents: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.data.balanceCents).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('GET /payments/transactions', () => {
    it('returns transaction list', async () => {
      const token = tokenFor('user-pay-integration-1');
      const res = await request(app)
        .get('/payments/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });
});
