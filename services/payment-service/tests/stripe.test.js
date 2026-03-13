const { describe, it } = require('node:test');
const assert = require('node:assert');
const stripeService = require('../src/services/stripe.service');

describe('Stripe service (mock)', () => {
  it('createPaymentIntent returns mock intent when no key', async () => {
    const intent = await stripeService.createPaymentIntent(1000, 'usd');
    assert.ok(intent.id);
    assert.ok(intent.client_secret);
    assert.strictEqual(intent.amount, 1000);
  });

  it('isMockMode returns true when no key', () => {
    assert.strictEqual(stripeService.isMockMode(), true);
  });
});
