const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { pool } = require('../../src/config/db.config');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function tokenFor(userId) {
  return jwt.sign({ userId, role: 'rider' }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Payment service integration', () => {
  before(async () => {
    await app.initDb();
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM wallets');
  });

  after(async () => {
    await pool.end();
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'payment-service');
  });

  it('GET /payments/wallet without auth returns 401', async () => {
    const res = await request(app).get('/payments/wallet');
    assert.strictEqual(res.status, 401);
  });

  it('GET /payments/wallet with auth returns wallet', async () => {
    const token = tokenFor('user-pay-1');
    const res = await request(app).get('/payments/wallet').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.wallet);
    assert.ok(typeof res.body.data.wallet.balanceCents === 'number');
  });

  it('POST /payments/wallet/topup increases balance', async () => {
    const token = tokenFor('user-pay-1');
    const res = await request(app)
      .post('/payments/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 1000 });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.balanceCents >= 1000);
  });

  it('GET /payments/transactions returns list', async () => {
    const token = tokenFor('user-pay-1');
    const res = await request(app).get('/payments/transactions').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.transactions));
  });
});
