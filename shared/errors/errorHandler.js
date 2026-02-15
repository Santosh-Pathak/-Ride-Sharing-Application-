const { AppError } = require('./AppError');

/**
 * Central error handler middleware
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message,
  });
}

module.exports = { errorHandler };
