const crypto = require('crypto');
const { AppError } = require('../errors/AppError');

const INTERNAL_SERVICE_HEADER = 'x-internal-service-key';
const INTERNAL_SERVICE_NAME_HEADER = 'x-internal-service-name';

function getInternalServiceSecret() {
  return process.env.INTERNAL_SERVICE_SECRET || '';
}

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate internal service key from incoming request headers.
 * @returns {{ valid: boolean, serviceName?: string }}
 */
function verifyInternalServiceKey(req) {
  const expected = getInternalServiceSecret();
  if (!expected) {
    return { valid: false };
  }
  const provided = req.get(INTERNAL_SERVICE_HEADER);
  if (!provided || !timingSafeEqualString(provided, expected)) {
    return { valid: false };
  }
  const serviceName = req.get(INTERNAL_SERVICE_NAME_HEADER) || 'internal';
  return { valid: true, serviceName };
}

/** Headers for outbound service-to-service HTTP (e.g. fetch). */
function getInternalServiceHeaders(callerServiceName) {
  const secret = getInternalServiceSecret();
  if (!secret) {
    return {};
  }
  const headers = { [INTERNAL_SERVICE_HEADER]: secret };
  if (callerServiceName) {
    headers[INTERNAL_SERVICE_NAME_HEADER] = callerServiceName;
  }
  return headers;
}

/** Reject requests without a valid internal service key. */
function requireInternalServiceKey(req, res, next) {
  const expected = getInternalServiceSecret();
  if (!expected) {
    return next(
      new AppError(
        'Internal service authentication is not configured',
        503,
        'INTERNAL_AUTH_NOT_CONFIGURED'
      )
    );
  }
  const result = verifyInternalServiceKey(req);
  if (!result.valid) {
    return next(new AppError('Invalid internal service credentials', 403, 'FORBIDDEN'));
  }
  req.internalCaller = result.serviceName;
  next();
}

module.exports = {
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SERVICE_NAME_HEADER,
  getInternalServiceSecret,
  verifyInternalServiceKey,
  getInternalServiceHeaders,
  requireInternalServiceKey,
};
