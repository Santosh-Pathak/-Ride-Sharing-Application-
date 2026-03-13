const fs = require('fs');
const path = require('path');
const express = require('express');
const { pool } = require('./config/db.config');
const { errorHandler, logger } = require('@rideshare/shared');
const paymentRoutes = require('./routes/payment.routes');
const { run: runPaymentConsumer } = require('./events/payment.consumer');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service', timestamp: new Date().toISOString() });
});

app.use('/payments', paymentRoutes);

app.use(errorHandler);

async function initDb() {
  const sqlPath = path.join(__dirname, 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  logger.info('Payment DB schema initialized');
}

async function start() {
  await initDb();
  runPaymentConsumer().catch((err) => logger.error('Payment consumer failed', { error: err.message }));
  app.listen(PORT, () => {
    logger.info(`Payment service listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start payment-service', { error: err.message });
    throw err;
  });
}

module.exports = app;
module.exports.initDb = initDb;
