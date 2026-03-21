const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EVENTS } = require('@rideshare/shared');
const {
  buildRideDispatch,
  buildPaymentDispatch,
} = require('../src/services/notification.service');

describe('notification.service helpers', () => {
  it('buildRideDispatch: requested notifies rider', () => {
    const items = buildRideDispatch(EVENTS.RIDE_REQUESTED, { riderId: 'u1', _id: 'rid1' });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].userId, 'u1');
    assert.match(items[0].title, /Ride requested/i);
  });

  it('buildRideDispatch: matched notifies rider and driver', () => {
    const items = buildRideDispatch(EVENTS.RIDE_MATCHED, {
      riderId: 'u1',
      driverId: 'd1',
      id: 'r1',
    });
    assert.strictEqual(items.length, 2);
    const ids = new Set(items.map((i) => i.userId));
    assert.deepStrictEqual(ids, new Set(['u1', 'd1']));
  });

  it('buildPaymentDispatch: completed includes amount', () => {
    const items = buildPaymentDispatch(EVENTS.PAYMENT_COMPLETED, {
      userId: 'u1',
      rideId: 'r1',
      paymentId: 'p1',
      amountCents: 1250,
    });
    assert.strictEqual(items.length, 1);
    assert.match(items[0].body, /12\.50/);
  });

  it('buildPaymentDispatch: failed without amount', () => {
    const items = buildPaymentDispatch(EVENTS.PAYMENT_FAILED, {
      userId: 'u1',
      rideId: 'r1',
      paymentId: 'p1',
    });
    assert.strictEqual(items.length, 1);
    assert.match(items[0].body, /wallet/i);
  });
});
