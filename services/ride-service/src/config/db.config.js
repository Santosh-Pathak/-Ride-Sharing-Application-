const mongoose = require('mongoose');
const { logger } = require('@rideshare/shared');

const MONGODB_URI =
  process.env.RIDE_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/rideshare_rides';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected', { service: 'ride-service' });
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

module.exports = { connectDB, MONGODB_URI };
