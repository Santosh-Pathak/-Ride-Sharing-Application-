const { haversineKm, etaMinutes } = require('../src/services/geospatial.service');

describe('location-service geospatial helpers', () => {
  test('haversineKm for same point is near zero', () => {
    expect(haversineKm(52.09, 5.12, 52.09, 5.12)).toBeCloseTo(0, 5);
  });

  test('etaMinutes returns 0 for non-positive speed', () => {
    expect(etaMinutes(10, 0)).toBe(0);
  });
});
