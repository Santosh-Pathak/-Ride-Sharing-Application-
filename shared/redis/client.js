const Redis = require('ioredis');
const { logger } = require('../logger/winston.logger');

let client = null;

/**
 * Get or create Redis client (singleton)
 * @param {object} options - ioredis options
 * @returns {import('ioredis').Redis}
 */
function getRedis(options = {}) {
  if (client) return client;

  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    ...options,
  };

  if (process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL, config);
  } else {
    client = new Redis(config);
  }

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error', { error: err.message }));

  return client;
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis connection closed');
  }
}

module.exports = { getRedis, closeRedis };
