const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler } = require('@rideshare/shared');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { logger } = require('@rideshare/shared');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => logger.info(`User service listening on port ${PORT}`));
}

start().catch((err) => {
  logger.error('Failed to start user-service', { error: err.message });
  throw err;
});

module.exports = app;
