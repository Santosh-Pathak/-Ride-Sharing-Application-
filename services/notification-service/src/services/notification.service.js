const { EVENTS } = require('@rideshare/shared');
const { logger } = require('@rideshare/shared');
const Notification = require('../models/Notification.model');
const emailService = require('./email.service');
const smsService = require('./sms.service');
const pushService = require('./push.service');

function rideIdFrom(ride) {
  if (!ride) return '';
  return ride.id || ride._id?.toString?.() || String(ride._id || '');
}

/**
 * Build title/body and target user ids for a ride Kafka event.
 */
function buildRideDispatch(event, ride) {
  const rid = rideIdFrom(ride);
  const riderId = ride?.riderId;
  const driverId = ride?.driverId;
  const out = [];

  switch (event) {
    case EVENTS.RIDE_REQUESTED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Ride requested',
          body: `We're finding a driver for your ride${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_MATCHED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Driver matched',
          body: `A driver has been matched to your ride${rid ? ` (${rid})` : ''}.`,
        });
      }
      if (driverId) {
        out.push({
          userId: driverId,
          title: 'New ride offer',
          body: `You have a new ride assignment${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_ACCEPTED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Driver on the way',
          body: `Your driver accepted the ride${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_REJECTED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Driver unavailable',
          body: `A driver declined. We're looking for another${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_STARTED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Trip started',
          body: `Your trip has started${rid ? ` (${rid})` : ''}.`,
        });
      }
      if (driverId) {
        out.push({
          userId: driverId,
          title: 'Trip started',
          body: `Trip in progress${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_COMPLETED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Trip completed',
          body: `Thanks for riding with us${rid ? `. Ride ${rid}` : ''}.`,
        });
      }
      if (driverId) {
        out.push({
          userId: driverId,
          title: 'Trip completed',
          body: `Ride completed${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    case EVENTS.RIDE_CANCELLED:
      if (riderId) {
        out.push({
          userId: riderId,
          title: 'Ride cancelled',
          body: `Your ride was cancelled${rid ? ` (${rid})` : ''}.`,
        });
      }
      if (driverId) {
        out.push({
          userId: driverId,
          title: 'Ride cancelled',
          body: `The ride was cancelled${rid ? ` (${rid})` : ''}.`,
        });
      }
      break;
    default:
      return [];
  }
  return out;
}

function buildPaymentDispatch(event, payload) {
  const userId = payload.userId;
  if (!userId) return [];
  const rideId = payload.rideId;
  const paymentId = payload.paymentId;
  switch (event) {
    case EVENTS.PAYMENT_COMPLETED: {
      const amt =
        payload.amountCents != null ? (Number(payload.amountCents) / 100).toFixed(2) : null;
      return [
        {
          userId,
          title: 'Payment completed',
          body:
            amt != null
              ? `Payment of ${amt} USD recorded${rideId ? ` for ride ${rideId}` : ''}.`
              : `Payment recorded${rideId ? ` for ride ${rideId}` : ''}.`,
          metadata: { paymentId, rideId, amountCents: payload.amountCents },
        },
      ];
    }
    case EVENTS.PAYMENT_FAILED:
      return [
        {
          userId,
          title: 'Payment failed',
          body: `We could not charge your wallet${rideId ? ` for ride ${rideId}` : ''}. Please top up and try again.`,
          metadata: { paymentId, rideId },
        },
      ];
    case EVENTS.PAYMENT_REFUNDED: {
      const ref =
        payload.amountCents != null ? (Number(payload.amountCents) / 100).toFixed(2) : null;
      return [
        {
          userId,
          title: 'Refund processed',
          body: ref != null ? `A refund of ${ref} USD was issued.` : 'A refund was issued.',
          metadata: { paymentId, amountCents: payload.amountCents },
        },
      ];
    }
    default:
      return [];
  }
}

async function deliverChannels(userId, title, body) {
  const devEmail = process.env.NOTIFICATION_DEV_EMAIL;
  const devPhone = process.env.NOTIFICATION_DEV_PHONE;
  const emailTo = devEmail || `user+${userId}@notify.mock`;
  const smsTo = devPhone || null;

  await emailService.sendEmail({ to: emailTo, subject: title, text: body });
  if (smsTo) await smsService.sendSms({ to: smsTo, body: `${title}: ${body}` });
  await pushService.sendPush({ userId, title, body });
}

/**
 * Persist in-app notification and fan out to channels (email/SMS/push; mocks when unconfigured).
 */
async function notifyUser({ userId, source, eventKey, title, body, metadata }) {
  const doc = await Notification.create({
    userId,
    source,
    eventKey,
    title,
    body,
    metadata,
  });
  try {
    await deliverChannels(userId, title, body);
  } catch (err) {
    logger.error('Channel delivery error', { userId, error: err.message });
  }
  return doc;
}

async function dispatchRideEvent(event, ride) {
  const items = buildRideDispatch(event, ride);
  for (const item of items) {
    try {
      await notifyUser({
        userId: item.userId,
        source: 'ride',
        eventKey: event,
        title: item.title,
        body: item.body,
        metadata: { rideId: rideIdFrom(ride), ...(item.metadata || {}) },
      });
    } catch (err) {
      logger.error('dispatchRideEvent failed', { event, error: err.message });
    }
  }
}

async function dispatchPaymentEvent(event, payload) {
  const items = buildPaymentDispatch(event, payload);
  for (const item of items) {
    try {
      await notifyUser({
        userId: item.userId,
        source: 'payment',
        eventKey: event,
        title: item.title,
        body: item.body,
        metadata: item.metadata || {},
      });
    } catch (err) {
      logger.error('dispatchPaymentEvent failed', { event, error: err.message });
    }
  }
}

async function listForUser(userId, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * l;
  const [items, total] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Notification.countDocuments({ userId }),
  ]);
  return { items, total, page: p, limit: l };
}

async function getForUser(userId, id) {
  return Notification.findOne({ _id: id, userId }).lean();
}

async function markRead(userId, id) {
  const doc = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { readAt: new Date() },
    { new: true }
  ).lean();
  return doc;
}

module.exports = {
  notifyUser,
  dispatchRideEvent,
  dispatchPaymentEvent,
  buildRideDispatch,
  buildPaymentDispatch,
  listForUser,
  getForUser,
  markRead,
};
