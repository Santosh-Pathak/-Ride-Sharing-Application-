const { Kafka } = require('kafkajs');
const { logger } = require('../logger/winston.logger');

let kafkaInstance = null;
function getKafka() {
  if (kafkaInstance) return kafkaInstance;
  kafkaInstance = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'rideshare',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  });
  return kafkaInstance;
}

/**
 * Create and run a consumer for a topic group
 * @param {string} groupId - Consumer group id
 * @param {string} topic - Topic to subscribe
 * @param {function} handler - async (message) => {}
 */
async function consume(groupId, topic, handler) {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic: t, partition, message }) => {
      try {
        const value = message.value?.toString();
        const payload = value ? JSON.parse(value) : {};
        await handler(payload, { topic: t, partition, offset: message.offset });
      } catch (err) {
        logger.error('Consumer error', { topic, error: err.message });
        throw err;
      }
    },
  });

  return consumer;
}

module.exports = { getKafka, consume };
