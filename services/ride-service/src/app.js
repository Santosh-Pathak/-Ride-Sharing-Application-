const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler, logger } = require('@rideshare/shared');
const rideRoutes = require('./routes/ride.routes');
const { releaseTimedOutMatches } = require('./services/ride.service');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ride-service', timestamp: new Date().toISOString() });
});

app.use('/rides', rideRoutes);

app.use(errorHandler);

const ACCEPTANCE_TIMEOUT_CHECK_MS = 15 * 1000; // 15 seconds

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Ride service listening on port ${PORT}`);
  });
  setInterval(() => {
    releaseTimedOutMatches().catch((err) => logger.error('Timeout job failed', { error: err.message }));
  }, ACCEPTANCE_TIMEOUT_CHECK_MS);
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start ride-service', { error: err.message });
    throw err;
  });
}

module.exports = app;
