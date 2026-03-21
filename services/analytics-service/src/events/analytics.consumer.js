const { kafkaConsumer, EVENTS } = require('@rideshare/shared');
const { logger } = require('@rideshare/shared');
const metricsService = require('../services/metrics.service');

const RIDE_TOPIC = process.env.KAFKA_RIDE_TOPIC || 'ride-events';
const PAYMENT_TOPIC = process.env.KAFKA_PAYMENT_TOPIC || 'payment-events';
const RIDE_GROUP = process.env.KAFKA_ANALYTICS_RIDE_GROUP_ID || 'analytics-service-rides';
const PAYMENT_GROUP = process.env.KAFKA_ANALYTICS_PAYMENT_GROUP_ID || 'analytics-service-payments';

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
    await metricsService.applyRideEvent(event, ride);
    logger.debug('Analytics ride event recorded', { event });
  });
}

async function runPaymentConsumer() {
  await kafkaConsumer.consume(PAYMENT_GROUP, PAYMENT_TOPIC, async (message) => {
    const event = message.event;
    if (!event || !PAYMENT_EVENTS.has(event)) return;
    await metricsService.applyPaymentEvent(event, message);
    logger.debug('Analytics payment event recorded', { event });
  });
}

module.exports = { runRideConsumer, runPaymentConsumer };
