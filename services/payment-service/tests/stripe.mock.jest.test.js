const stripeService = require('../src/services/stripe.service');

describe('payment-service stripe mock', () => {
  test('isMockMode true without key', () => {
    expect(stripeService.isMockMode()).toBe(true);
  });

  test('createPaymentIntent returns mock payload', async () => {
    const intent = await stripeService.createPaymentIntent(1200, 'usd', { rideId: 'r1' });
    expect(intent.id.startsWith('pi_mock_')).toBe(true);
    expect(intent.amount).toBe(1200);
  });
});
