const fs = require('fs');
const express = require('express');
const { connectDB } = require('./config/db.config');
const { errorHandler } = require('@rideshare/shared');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const driverRoutes = require('./routes/driver.routes');
const { logger } = require('@rideshare/shared');
const { UPLOAD_DIR } = require('./middleware/upload.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info('Created uploads directory', { path: UPLOAD_DIR });
}

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => logger.info(`User service listening on port ${PORT}`));
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start user-service', { error: err.message });
    throw err;
  });
}

module.exports = app;
