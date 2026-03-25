const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { pool } = require('../../src/config/db.config');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TEST_USER_ID = `e2e-payment-user-${Date.now()}`;

function tokenFor(userId, role = 'rider') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

const userToken = tokenFor(TEST_USER_ID, 'rider');
const otherUserToken = tokenFor(`other-${TEST_USER_ID}`, 'rider');

describe('Payment Service E2E Tests', () => {
  beforeAll(async () => {
    await app.initDb();
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM payments WHERE user_id = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM wallets WHERE user_id = $1', [TEST_USER_ID]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM payments WHERE user_id = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM wallets WHERE user_id = $1', [TEST_USER_ID]);
    await pool.end();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('payment-service');
    });
  });

  describe('GET /payments/wallet', () => {
    it('should return wallet for authenticated user', async () => {
      const res = await request(app)
        .get('/payments/wallet')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet).toBeDefined();
      expect(typeof res.body.data.wallet.balanceCents).toBe('number');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/payments/wallet');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/payments/wallet')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return wallet with zero balance for new user', async () => {
      const res = await request(app)
        .get('/payments/wallet')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.wallet.balanceCents).toBe(0);
    });
  });

  describe('POST /payments/wallet/topup', () => {
    it('should top up wallet with amountCents', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balanceCents).toBeGreaterThanOrEqual(5000);
    });

    it('should top up wallet with decimal amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 25.5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balanceCents).toBeGreaterThanOrEqual(7500);
    });

    it('should accumulate balance on multiple top-ups', async () => {
      const walletRes = await request(app)
        .get('/payments/wallet')
        .set('Authorization', `Bearer ${userToken}`);
      const initialBalance = walletRes.body.data.wallet.balanceCents;

      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.data.balanceCents).toBe(initialBalance + 1000);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/payments/wallet/topup').send({ amountCents: 1000 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for zero amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for negative amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: -100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /payments/wallet/withdraw', () => {
    beforeAll(async () => {
      await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 10000 });
    });

    it('should withdraw from wallet', async () => {
      const res = await request(app)
        .post('/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 2000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.balanceCents).toBe('number');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/payments/wallet/withdraw').send({ amountCents: 1000 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for insufficient balance', async () => {
      const res = await request(app)
        .post('/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 999999999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for zero amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for negative amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: -100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /payments/transactions', () => {
    it('should return transaction history', async () => {
      const res = await request(app)
        .get('/payments/transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/payments/transactions?limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transactions.length).toBeLessThanOrEqual(5);
    });

    it('should respect offset parameter', async () => {
      const res = await request(app)
        .get('/payments/transactions?limit=5&offset=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/payments/transactions');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return empty array for user with no transactions', async () => {
      const res = await request(app)
        .get('/payments/transactions')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });

  describe('GET /payments/payments', () => {
    it('should return payments list', async () => {
      const res = await request(app)
        .get('/payments/payments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.payments)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/payments/payments?limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.payments.length).toBeLessThanOrEqual(10);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/payments/payments');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /payments/payments/:id', () => {
    beforeAll(async () => {
      await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 1000 });
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .get('/payments/payments/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when accessing other user payment', async () => {
      const res = await request(app)
        .get('/payments/payments/some-payment-id')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /payments/payments/:id/invoice', () => {
    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .get('/payments/payments/999999/invoice')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when accessing other user invoice', async () => {
      const res = await request(app)
        .get('/payments/payments/some-payment-id/invoice')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /payments/payments/intent', () => {
    it('should create payment intent with amountCents', async () => {
      const res = await request(app)
        .post('/payments/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientSecret).toBeDefined();
    });

    it('should create payment intent with decimal amount', async () => {
      const res = await request(app)
        .post('/payments/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 15.99 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientSecret).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/payments/payments/intent').send({ amountCents: 1000 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for zero amount', async () => {
      const res = await request(app)
        .post('/payments/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for negative amount', async () => {
      const res = await request(app)
        .post('/payments/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: -100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing amount', async () => {
      const res = await request(app)
        .post('/payments/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /payments/payments/:id/refund', () => {
    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .post('/payments/payments/999999/refund')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when refunding other user payment', async () => {
      const res = await request(app)
        .post('/payments/payments/some-payment-id/refund')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid JSON', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid }');

      expect(res.status).toBe(400);
    });

    it('should reject oversized amount', async () => {
      const res = await request(app)
        .post('/payments/wallet/topup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountCents: 999999999999 });

      expect(res.status).toBe(400);
    });
  });
});
