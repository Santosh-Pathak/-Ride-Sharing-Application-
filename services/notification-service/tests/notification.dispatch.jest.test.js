const { EVENTS } = require('@rideshare/shared');
const { buildRideDispatch, buildPaymentDispatch } = require('../src/services/notification.service');

describe('notification-service dispatch builders', () => {
  test('ride matched notifies rider and driver', () => {
    const items = buildRideDispatch(EVENTS.RIDE_MATCHED, {
      riderId: 'rider-1',
      driverId: 'driver-1',
      id: 'ride-1',
    });
    expect(items).toHaveLength(2);
  });

  test('payment completed includes formatted amount', () => {
    const items = buildPaymentDispatch(EVENTS.PAYMENT_COMPLETED, {
      userId: 'u1',
      amountCents: 3450,
      rideId: 'ride-2',
      paymentId: 'pay-1',
    });
    expect(items[0].body).toContain('34.50');
  });
});
