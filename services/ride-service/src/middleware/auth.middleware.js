const jwt = require('jsonwebtoken');
const { AppError } = require('@rideshare/shared');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
}

function requireDriver(req, res, next) {
  if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  if (req.user.role !== 'driver' && req.user.role !== 'admin') {
    return next(new AppError('Driver or admin role required', 403, 'FORBIDDEN'));
  }
  next();
}

module.exports = { authenticate, requireDriver };
