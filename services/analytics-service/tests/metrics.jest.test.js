const { EVENTS } = require('@rideshare/shared');
const { rideIncrements, paymentIncrements, parseDateKey } = require('../src/services/metrics.service');

describe('analytics-service metrics helpers', () => {
  test('ride completed increments completed + revenue', () => {
    const inc = rideIncrements(EVENTS.RIDE_COMPLETED, { fare: { total: 12.34 } });
    expect(inc.ridesCompleted).toBe(1);
    expect(inc.rideRevenueCents).toBe(1234);
  });

  test('payment refunded increments refund counters', () => {
    const inc = paymentIncrements(EVENTS.PAYMENT_REFUNDED, { amountCents: 500 });
    expect(inc.refundsCount).toBe(1);
    expect(inc.refundAmountCents).toBe(500);
  });

  test('parseDateKey validates YYYY-MM-DD', () => {
    expect(parseDateKey('2026-03-21')).toBe('2026-03-21');
    expect(parseDateKey('21-03-2026')).toBeNull();
  });
});
