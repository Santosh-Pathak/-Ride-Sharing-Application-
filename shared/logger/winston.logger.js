const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  let log = `${ts} [${level}]: ${message}`;
  if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
  if (stack) log += `\n${stack}`;
  return log;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  defaultMeta: { service: process.env.SERVICE_NAME || 'rideshare' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

module.exports = { logger };
