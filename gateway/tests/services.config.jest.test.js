describe('gateway services config', () => {
  const previousEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...previousEnv };
  });

  afterAll(() => {
    process.env = previousEnv;
  });

  test('uses localhost defaults when env is missing', () => {
    delete process.env.USER_SERVICE_URL;
    delete process.env.RIDE_SERVICE_URL;
    const { services } = require('../src/config/services.config');
    expect(services.user).toBe('http://localhost:3001');
    expect(services.ride).toBe('http://localhost:3002');
    expect(services.analytics).toBe('http://localhost:3006');
  });

  test('uses env overrides when provided', () => {
    process.env.USER_SERVICE_URL = 'http://user-service:3001';
    const { services } = require('../src/config/services.config');
    expect(services.user).toBe('http://user-service:3001');
  });
});
