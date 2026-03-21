const { AppError } = require('@rideshare/shared');
const { USER_ROLES } = require('@rideshare/shared');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    next(new AppError('Forbidden: insufficient role', 403, 'FORBIDDEN'));
  };
}

const requireAdmin = requireRole(USER_ROLES.ADMIN);

module.exports = { requireRole, requireAdmin };
