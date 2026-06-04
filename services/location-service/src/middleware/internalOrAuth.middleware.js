const { verifyInternalServiceKey } = require('@rideshare/shared');
const { authenticate } = require('./auth.middleware');

/**
 * Allow trusted microservices (shared secret) or end users (JWT).
 * Used for endpoints reachable both via direct service URL and via gateway.
 */
function requireInternalOrAuth(req, res, next) {
  const internal = verifyInternalServiceKey(req);
  if (internal.valid) {
    req.internalCaller = internal.serviceName;
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = { requireInternalOrAuth };
