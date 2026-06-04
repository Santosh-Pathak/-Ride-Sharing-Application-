const { getInternalServiceHeaders } = require('@rideshare/shared');
const { getNearbyDrivers } = require('../src/services/matching.service');

describe('matching.service internal HTTP', () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.INTERNAL_SERVICE_SECRET;
  const originalUrl = process.env.LOCATION_SERVICE_URL;

  beforeEach(() => {
    process.env.INTERNAL_SERVICE_SECRET = 'ride-to-location-secret-32chars';
    process.env.LOCATION_SERVICE_URL = 'http://location.test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { drivers: [] } }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
    else process.env.INTERNAL_SERVICE_SECRET = originalSecret;
    if (originalUrl === undefined) delete process.env.LOCATION_SERVICE_URL;
    else process.env.LOCATION_SERVICE_URL = originalUrl;
  });

  test('getNearbyDrivers sends internal service headers on fetch', async () => {
    await getNearbyDrivers(40.7, -74.0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers).toEqual(getInternalServiceHeaders('ride-service'));
  });
});
