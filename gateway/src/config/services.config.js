/**
 * Downstream service URLs - used by gateway proxy
 */
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  ride: process.env.RIDE_SERVICE_URL || 'http://localhost:3002',
  location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
};

module.exports = { services };
