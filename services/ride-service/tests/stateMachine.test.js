const { describe, it } = require('node:test');
const assert = require('node:assert');
const { canTransition, assertTransition } = require('../src/services/stateMachine');
const { RIDE_STATUS } = require('@rideshare/shared');

describe('Ride state machine', () => {
  it('allows requested -> matched', () => {
    assert.strictEqual(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.MATCHED), true);
  });

  it('allows requested -> cancelled', () => {
    assert.strictEqual(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.CANCELLED), true);
  });

  it('allows in_progress -> completed', () => {
    assert.strictEqual(canTransition(RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.COMPLETED), true);
  });

  it('disallows completed -> in_progress', () => {
    assert.strictEqual(canTransition(RIDE_STATUS.COMPLETED, RIDE_STATUS.IN_PROGRESS), false);
  });

  it('assertTransition throws for invalid transition', () => {
    assert.throws(
      () => assertTransition(RIDE_STATUS.COMPLETED, RIDE_STATUS.REQUESTED),
      /Invalid transition/
    );
  });
});
