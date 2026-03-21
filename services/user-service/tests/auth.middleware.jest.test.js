const jwt = require('jsonwebtoken');
const { authenticate, JWT_SECRET } = require('../src/middleware/auth.middleware');

describe('user-service auth middleware', () => {
  test('rejects missing authorization header', () => {
    const req = { headers: {} };
    const next = jest.fn();

    authenticate(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  test('accepts valid bearer token', () => {
    const token = jwt.sign({ userId: 'u1', role: 'rider' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    authenticate(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user.userId).toBe('u1');
  });
});
