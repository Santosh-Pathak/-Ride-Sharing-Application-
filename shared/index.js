const internalService = require('./auth/internalService');

module.exports = {
  ...require('./constants/events'),
  ...require('./constants/status'),
  ...require('./errors/AppError'),
  ...require('./errors/errorHandler'),
  ...internalService,
  logger: require('./logger/winston.logger').logger,
  getRedis: require('./redis/client').getRedis,
  closeRedis: require('./redis/client').closeRedis,
  kafka: require('./kafka/producer'),
  kafkaConsumer: require('./kafka/consumer'),
};
