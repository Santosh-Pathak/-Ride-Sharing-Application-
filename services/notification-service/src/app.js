const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler, logger } = require('@rideshare/shared');
const notificationRoutes = require('./routes/notification.routes');
const { runRideConsumer, runPaymentConsumer } = require('./events/notification.consumer');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/notifications', notificationRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  runRideConsumer().catch((err) => logger.error('Notification ride consumer failed', { error: err.message }));
  runPaymentConsumer().catch((err) =>
    logger.error('Notification payment consumer failed', { error: err.message })
  );
  app.listen(PORT, () => {
    logger.info(`Notification service listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start notification-service', { error: err.message });
    throw err;
  });
}

module.exports = app;
