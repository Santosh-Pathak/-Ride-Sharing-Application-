const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { defaultLimiter } = require('./middleware/rateLimit.middleware');
const { requestLogger } = require('./middleware/requestLogger.middleware');
const routes = require('./routes');
const { logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use(defaultLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
  logger.info(`Gateway listening on port ${PORT}`);
});

module.exports = app;
