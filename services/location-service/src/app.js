const http = require('http');
const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler, logger } = require('@rideshare/shared');
const locationRoutes = require('./routes/location.routes');
const { attachSocketServer } = require('./sockets/location.socket');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'location-service', timestamp: new Date().toISOString() });
});

app.use('/location', locationRoutes);

app.use(errorHandler);

const server = http.createServer(app);
attachSocketServer(server);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Location service listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start location-service', { error: err.message });
    throw err;
  });
}

module.exports = { app, server };
