const { kafkaConsumer, EVENTS } = require('@rideshare/shared');
const { logger } = require('@rideshare/shared');
const notificationService = require('../services/notification.service');

const RIDE_TOPIC = process.env.KAFKA_RIDE_TOPIC || 'ride-events';
const PAYMENT_TOPIC = process.env.KAFKA_PAYMENT_TOPIC || 'payment-events';
const RIDE_GROUP = process.env.KAFKA_NOTIFICATION_RIDE_GROUP_ID || 'notification-service-rides';
const PAYMENT_GROUP = process.env.KAFKA_NOTIFICATION_PAYMENT_GROUP_ID || 'notification-service-payments';

const RIDE_EVENTS = new Set([
  EVENTS.RIDE_REQUESTED,
  EVENTS.RIDE_MATCHED,
  EVENTS.RIDE_ACCEPTED,
  EVENTS.RIDE_REJECTED,
  EVENTS.RIDE_STARTED,
  EVENTS.RIDE_COMPLETED,
  EVENTS.RIDE_CANCELLED,
]);

const PAYMENT_EVENTS = new Set([
  EVENTS.PAYMENT_COMPLETED,
  EVENTS.PAYMENT_FAILED,
  EVENTS.PAYMENT_REFUNDED,
]);

async function runRideConsumer() {
  await kafkaConsumer.consume(RIDE_GROUP, RIDE_TOPIC, async (message) => {
    const event = message.event;
    if (!event || !RIDE_EVENTS.has(event)) return;
    const ride = message.ride || message;
    await notificationService.dispatchRideEvent(event, ride);
    logger.debug('Notification ride event handled', { event });
  });
}

async function runPaymentConsumer() {
  await kafkaConsumer.consume(PAYMENT_GROUP, PAYMENT_TOPIC, async (message) => {
    const event = message.event;
    if (!event || !PAYMENT_EVENTS.has(event)) return;
    await notificationService.dispatchPaymentEvent(event, message);
    logger.debug('Notification payment event handled', { event });
  });
}

module.exports = { runRideConsumer, runPaymentConsumer };
