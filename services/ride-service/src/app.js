const express = require('express');
const { errorHandler, logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ride-service', timestamp: new Date().toISOString() });
});

app.use('/rides', (req, res) => res.status(501).json({ message: 'Ride APIs - Sprint 2' }));

app.use(errorHandler);

app.listen(PORT, () => logger.info(`Ride service listening on port ${PORT}`));

module.exports = app;
