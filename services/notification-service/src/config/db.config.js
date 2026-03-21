const mongoose = require('mongoose');
const { logger } = require('@rideshare/shared');

const MONGODB_URI =
  process.env.NOTIFICATION_MONGODB_URI || 'mongodb://localhost:27017/rideshare_notifications';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected', { service: 'notification-service' });
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

module.exports = { connectDB, MONGODB_URI };
