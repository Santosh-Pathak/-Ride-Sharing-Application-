const { kafkaConsumer, EVENTS } = require('@rideshare/shared');
const { logger } = require('@rideshare/shared');
const paymentService = require('../services/payment.service');

const RIDE_TOPIC = process.env.KAFKA_RIDE_TOPIC || 'ride-events';
const GROUP_ID = process.env.KAFKA_PAYMENT_GROUP_ID || 'payment-service';

async function run() {
  await kafkaConsumer.consume(GROUP_ID, RIDE_TOPIC, async (message) => {
    if (message.event !== EVENTS.RIDE_COMPLETED) return;
    const ride = message.ride || message;
    const rideId = ride.id || ride._id;
    const riderId = ride.riderId;
    const fareTotal = ride.fare?.total;
    if (!riderId || fareTotal == null) {
      logger.warn('Ride completed event missing riderId or fare', { message });
      return;
    }
    const amountCents = Math.round(Number(fareTotal) * 100);
    if (amountCents <= 0) return;
    try {
      await paymentService.processRidePayment(rideId, riderId, amountCents);
      logger.info('Processed ride payment', { rideId, riderId, amountCents });
    } catch (err) {
      logger.error('Ride payment processing failed', { rideId, riderId, error: err.message });
    }
  });
}

module.exports = { run };
