const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler, logger } = require('@rideshare/shared');
const analyticsRoutes = require('./routes/analytics.routes');
const { runRideConsumer, runPaymentConsumer } = require('./events/analytics.consumer');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString() });
});

app.use('/analytics', analyticsRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  runRideConsumer().catch((err) => logger.error('Analytics ride consumer failed', { error: err.message }));
  runPaymentConsumer().catch((err) =>
    logger.error('Analytics payment consumer failed', { error: err.message })
  );
  app.listen(PORT, () => {
    logger.info(`Analytics service listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start analytics-service', { error: err.message });
    throw err;
  });
}

module.exports = app;
