const { kafka, EVENTS } = require('@rideshare/shared');

const RIDE_TOPIC = process.env.KAFKA_RIDE_TOPIC || 'ride-events';

function toPayload(ride) {
  const doc = ride && typeof ride.toObject === 'function' ? ride.toObject() : { ...ride };
  const id = doc._id?.toString();
  if (doc._id) delete doc._id;
  return { ...doc, id };
}

async function publishRideRequested(ride) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_REQUESTED, ride: toPayload(ride) }, ride._id?.toString());
}

async function publishRideMatched(ride) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_MATCHED, ride: toPayload(ride) }, ride._id?.toString());
}

async function publishRideAccepted(ride) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_ACCEPTED, ride: toPayload(ride) }, ride._id?.toString());
}

async function publishRideRejected(ride, reason) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_REJECTED, ride: toPayload(ride), reason }, ride._id?.toString());
}

async function publishRideStarted(ride) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_STARTED, ride: toPayload(ride) }, ride._id?.toString());
}

async function publishRideCompleted(ride) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_COMPLETED, ride: toPayload(ride) }, ride._id?.toString());
}

async function publishRideCancelled(ride, reason) {
  await kafka.send(RIDE_TOPIC, { event: EVENTS.RIDE_CANCELLED, ride: toPayload(ride), reason }, ride._id?.toString());
}

module.exports = {
  publishRideRequested,
  publishRideMatched,
  publishRideAccepted,
  publishRideRejected,
  publishRideStarted,
  publishRideCompleted,
  publishRideCancelled,
};
