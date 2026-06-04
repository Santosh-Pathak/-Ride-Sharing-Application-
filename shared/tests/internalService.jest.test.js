const {
  verifyInternalServiceKey,
  getInternalServiceHeaders,
  INTERNAL_SERVICE_HEADER,
} = require('../auth/internalService');

describe('internal service auth', () => {
  const originalSecret = process.env.INTERNAL_SERVICE_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_SERVICE_SECRET;
    } else {
      process.env.INTERNAL_SERVICE_SECRET = originalSecret;
    }
  });

  test('verifyInternalServiceKey rejects missing or wrong key', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret-32chars!!';
    expect(verifyInternalServiceKey({ get: () => undefined }).valid).toBe(false);
    expect(
      verifyInternalServiceKey({ get: (h) => (h === INTERNAL_SERVICE_HEADER ? 'wrong' : undefined) })
        .valid
    ).toBe(false);
  });

  test('verifyInternalServiceKey accepts matching key', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret-32chars!!';
    const req = {
      get: (h) => {
        if (h === INTERNAL_SERVICE_HEADER) return 'test-internal-secret-32chars!!';
        if (h === 'x-internal-service-name') return 'ride-service';
        return undefined;
      },
    };
    const result = verifyInternalServiceKey(req);
    expect(result.valid).toBe(true);
    expect(result.serviceName).toBe('ride-service');
  });

  test('getInternalServiceHeaders includes secret and caller name', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'abc';
    const headers = getInternalServiceHeaders('ride-service');
    expect(headers[INTERNAL_SERVICE_HEADER]).toBe('abc');
    expect(headers['x-internal-service-name']).toBe('ride-service');
  });
});
