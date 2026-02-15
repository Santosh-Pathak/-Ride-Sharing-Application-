const express = require('express');
const { errorHandler, logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString() });
});

app.use('/analytics', (req, res) => res.status(501).json({ message: 'Analytics APIs - Sprint 4' }));

app.use(errorHandler);

app.listen(PORT, () => logger.info(`Analytics service listening on port ${PORT}`));

module.exports = app;
