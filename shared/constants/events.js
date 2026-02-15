/**
 * Kafka / application event names - single source of truth
 */
const EVENTS = {
  // Ride lifecycle
  RIDE_REQUESTED: 'ride.requested',
  RIDE_MATCHED: 'ride.matched',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_REJECTED: 'ride.rejected',
  RIDE_STARTED: 'ride.started',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_CANCELLED: 'ride.cancelled',

  // Payment
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Notifications
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_EMAIL: 'notification.email',
  NOTIFICATION_SMS: 'notification.sms',
  NOTIFICATION_PUSH: 'notification.push',

  // Location
  LOCATION_UPDATE: 'location.update',
  DRIVER_AVAILABLE: 'driver.available',
  DRIVER_UNAVAILABLE: 'driver.unavailable',

  // User
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
};

module.exports = { EVENTS };
