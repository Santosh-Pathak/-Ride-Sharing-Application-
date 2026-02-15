const express = require('express');
const { errorHandler, logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/notifications', (req, res) =>
  res.status(501).json({ message: 'Notification APIs - Sprint 3' })
);

app.use(errorHandler);

app.listen(PORT, () => logger.info(`Notification service listening on port ${PORT}`));

module.exports = app;
