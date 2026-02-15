const express = require('express');
const { errorHandler, logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'location-service', timestamp: new Date().toISOString() });
});

app.use('/location', (req, res) => res.status(501).json({ message: 'Location APIs - Sprint 2' }));

app.use(errorHandler);

app.listen(PORT, () => logger.info(`Location service listening on port ${PORT}`));

module.exports = app;
