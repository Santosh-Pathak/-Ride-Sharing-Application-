const { AppError } = require('@rideshare/shared');
const { USER_ROLES } = require('@rideshare/shared');

/**
 * Require at least one of the given roles. Use after authenticate.
 * @param  {...string} allowedRoles - e.g. USER_ROLES.ADMIN, USER_ROLES.DRIVER
 */
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

/** Shorthand: require admin only */
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/** Shorthand: require driver (or admin) */
const requireDriver = requireRole(USER_ROLES.DRIVER, USER_ROLES.ADMIN);

module.exports = { requireRole, requireAdmin, requireDriver };
