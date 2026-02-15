const express = require('express');
const { errorHandler, logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service', timestamp: new Date().toISOString() });
});

app.use('/payments', (req, res) => res.status(501).json({ message: 'Payment APIs - Sprint 3' }));

app.use(errorHandler);

app.listen(PORT, () => logger.info(`Payment service listening on port ${PORT}`));

module.exports = app;
