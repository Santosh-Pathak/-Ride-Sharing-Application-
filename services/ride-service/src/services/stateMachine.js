const { RIDE_STATUS } = require('@rideshare/shared');
const { AppError } = require('@rideshare/shared');

const TRANSITIONS = {
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.MATCHED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.MATCHED]: [RIDE_STATUS.ACCEPTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.ACCEPTED]: [RIDE_STATUS.DRIVER_ARRIVING, RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_ARRIVING]: [RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.IN_PROGRESS]: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: [],
};

function canTransition(fromStatus, toStatus) {
  const allowed = TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

function assertTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    throw new AppError(
      `Invalid transition from ${fromStatus} to ${toStatus}`,
      400,
      'INVALID_TRANSITION'
    );
  }
}

module.exports = { canTransition, assertTransition, TRANSITIONS };
