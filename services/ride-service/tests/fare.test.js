const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculateFare, estimateFare } = require('../src/services/fare.service');

describe('Fare service', () => {
  it('calculateFare returns total and breakdown', () => {
    const fare = calculateFare(10, 20, 1);
    assert.ok(fare.total >= 5);
    assert.ok(fare.baseFare > 0);
    assert.strictEqual(fare.surgeMultiplier, 1);
  });

  it('estimateFare returns same shape as calculateFare', () => {
    const fare = estimateFare(5, 10);
    assert.ok(typeof fare.total === 'number');
    assert.ok(fare.distanceKm === 5);
    assert.ok(fare.durationMin === 10);
  });
});
