const { calculateFare } = require('../src/services/fare.service');
const { canTransition } = require('../src/services/stateMachine');
const { RIDE_STATUS } = require('@rideshare/shared');

describe('ride-service core helpers', () => {
  test('calculateFare returns non-zero total', () => {
    const fare = calculateFare(10, 20, 1);
    expect(fare.total).toBeGreaterThan(0);
  });

  test('state machine allows requested -> matched', () => {
    expect(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.MATCHED)).toBe(true);
  });

  test('state machine rejects completed -> in_progress', () => {
    expect(canTransition(RIDE_STATUS.COMPLETED, RIDE_STATUS.IN_PROGRESS)).toBe(false);
  });
});
