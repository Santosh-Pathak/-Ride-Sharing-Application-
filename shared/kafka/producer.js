const { Kafka } = require('kafkajs');
const { logger } = require('../logger/winston.logger');

let kafka = null;
let producer = null;

function getKafka() {
  if (kafka) return kafka;
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'rideshare',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  });
  return kafka;
}

/**
 * Get Kafka producer (singleton)
 */
async function getProducer() {
  if (producer) return producer;
  const k = getKafka();
  producer = k.producer();
  await producer.connect();
  producer.on('producer.disconnect', () => logger.warn('Kafka producer disconnected'));
  return producer;
}

/**
 * Send message to topic
 * @param {string} topic
 * @param {object} message
 * @param {string} [key]
 */
async function send(topic, message, key = null) {
  const p = await getProducer();
  await p.send({
    topic,
    messages: [{ key: key || undefined, value: JSON.stringify(message) }],
  });
  logger.debug('Kafka message sent', { topic, key });
}

async function disconnect() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info('Kafka producer disconnected');
  }
}

module.exports = { getKafka, getProducer, send, disconnect };
