/**
 * Ride and payment status constants
 */
const RIDE_STATUS = {
  REQUESTED: 'requested',
  MATCHED: 'matched',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
  ADMIN: 'admin',
};

module.exports = {
  RIDE_STATUS,
  PAYMENT_STATUS,
  USER_ROLES,
};
