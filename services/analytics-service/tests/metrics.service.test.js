const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EVENTS } = require('@rideshare/shared');
const {
  rideIncrements,
  paymentIncrements,
  fareToCents,
  parseDateKey,
} = require('../src/services/metrics.service');

describe('metrics.service', () => {
  it('rideIncrements maps lifecycle events', () => {
    assert.strictEqual(rideIncrements(EVENTS.RIDE_REQUESTED, {})?.ridesRequested, 1);
    assert.strictEqual(
      rideIncrements(EVENTS.RIDE_COMPLETED, { fare: { total: 12.5 } })?.ridesCompleted,
      1
    );
    assert.strictEqual(
      rideIncrements(EVENTS.RIDE_COMPLETED, { fare: { total: 12.5 } })?.rideRevenueCents,
      1250
    );
  });

  it('fareToCents handles missing fare', () => {
    assert.strictEqual(fareToCents({}), 0);
  });

  it('paymentIncrements maps payment events', () => {
    assert.deepStrictEqual(paymentIncrements(EVENTS.PAYMENT_COMPLETED, {}), {
      paymentsCompleted: 1,
    });
    assert.deepStrictEqual(paymentIncrements(EVENTS.PAYMENT_FAILED, {}), { paymentsFailed: 1 });
    assert.deepStrictEqual(paymentIncrements(EVENTS.PAYMENT_REFUNDED, { amountCents: 500 }), {
      refundsCount: 1,
      refundAmountCents: 500,
    });
  });

  it('parseDateKey validates format', () => {
    assert.strictEqual(parseDateKey('2025-01-15'), '2025-01-15');
    assert.strictEqual(parseDateKey('bad'), null);
  });
});
