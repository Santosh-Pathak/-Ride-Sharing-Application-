const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db.config');
const { logger } = require('@rideshare/shared');

async function run() {
  const sqlPath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  logger.info('Payment DB migration completed');
}

run()
  .then(() => pool.end())
  .catch((err) => {
    logger.error('Migration failed', { error: err.message });
    pool.end();
    throw err;
  });
