const { describe, it } = require('node:test');
const assert = require('node:assert');
const { haversineKm, etaMinutes } = require('../src/services/geospatial.service');

describe('Geospatial service', () => {
  it('haversineKm returns ~0 for same point', () => {
    const d = haversineKm(40.7128, -74.006, 40.7128, -74.006);
    assert.ok(d < 0.01);
  });

  it('haversineKm returns positive distance for two points', () => {
    const d = haversineKm(40.7128, -74.006, 40.7589, -73.9851);
    assert.ok(d > 1 && d < 20);
  });

  it('etaMinutes returns minutes for distance and speed', () => {
    const min = etaMinutes(10, 60);
    assert.strictEqual(min, 10);
  });
});
