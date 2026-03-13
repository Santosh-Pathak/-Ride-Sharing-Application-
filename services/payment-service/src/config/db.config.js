const { Pool } = require('pg');
const { logger } = require('@rideshare/shared');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://rideshare:rideshare_secret@localhost:5432/rideshare';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', { error: err.message }));

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) logger.debug('Slow query', { duration, text: text.slice(0, 80) });
  return res;
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient, DATABASE_URL };
