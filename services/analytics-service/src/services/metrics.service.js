const { EVENTS } = require('@rideshare/shared');
const DailyStats = require('../models/DailyStats.model');

function utcDateKey(d = new Date()) {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

function fareToCents(ride) {
  const t = ride?.fare?.total;
  if (t == null || Number.isNaN(Number(t))) return 0;
  return Math.round(Number(t) * 100);
}

/**
 * Map ride Kafka event to DailyStats $inc fields.
 */
function rideIncrements(event, ride) {
  const base = {};
  switch (event) {
    case EVENTS.RIDE_REQUESTED:
      base.ridesRequested = 1;
      break;
    case EVENTS.RIDE_MATCHED:
      base.ridesMatched = 1;
      break;
    case EVENTS.RIDE_ACCEPTED:
      base.ridesAccepted = 1;
      break;
    case EVENTS.RIDE_REJECTED:
      base.ridesRejected = 1;
      break;
    case EVENTS.RIDE_STARTED:
      base.ridesStarted = 1;
      break;
    case EVENTS.RIDE_COMPLETED: {
      base.ridesCompleted = 1;
      const cents = fareToCents(ride);
      if (cents > 0) base.rideRevenueCents = cents;
      break;
    }
    case EVENTS.RIDE_CANCELLED:
      base.ridesCancelled = 1;
      break;
    default:
      return null;
  }
  return base;
}

function paymentIncrements(event, payload) {
  switch (event) {
    case EVENTS.PAYMENT_COMPLETED:
      return { paymentsCompleted: 1 };
    case EVENTS.PAYMENT_FAILED:
      return { paymentsFailed: 1 };
    case EVENTS.PAYMENT_REFUNDED: {
      const cents = payload.amountCents != null ? Number(payload.amountCents) : 0;
      return {
        refundsCount: 1,
        refundAmountCents: cents > 0 ? cents : 0,
      };
    }
    default:
      return null;
  }
}

async function applyRideEvent(event, ride) {
  const inc = rideIncrements(event, ride);
  if (!inc || Object.keys(inc).length === 0) return;
  const dateKey = utcDateKey();
  await DailyStats.updateOne({ dateKey }, { $inc: inc }, { upsert: true });
}

async function applyPaymentEvent(event, payload) {
  const inc = paymentIncrements(event, payload);
  if (!inc || Object.keys(inc).length === 0) return;
  const dateKey = utcDateKey();
  await DailyStats.updateOne({ dateKey }, { $inc: inc }, { upsert: true });
}

function parseDateKey(s) {
  if (!s || typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

async function aggregateRange(fromKey, toKey) {
  const match = { dateKey: { $gte: fromKey, $lte: toKey } };
  const [row] = await DailyStats.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        ridesRequested: { $sum: '$ridesRequested' },
        ridesMatched: { $sum: '$ridesMatched' },
        ridesAccepted: { $sum: '$ridesAccepted' },
        ridesRejected: { $sum: '$ridesRejected' },
        ridesStarted: { $sum: '$ridesStarted' },
        ridesCompleted: { $sum: '$ridesCompleted' },
        ridesCancelled: { $sum: '$ridesCancelled' },
        rideRevenueCents: { $sum: '$rideRevenueCents' },
        paymentsCompleted: { $sum: '$paymentsCompleted' },
        paymentsFailed: { $sum: '$paymentsFailed' },
        refundsCount: { $sum: '$refundsCount' },
        refundAmountCents: { $sum: '$refundAmountCents' },
        daysWithData: { $sum: 1 },
      },
    },
  ]);
  return (
    row || {
      ridesRequested: 0,
      ridesMatched: 0,
      ridesAccepted: 0,
      ridesRejected: 0,
      ridesStarted: 0,
      ridesCompleted: 0,
      ridesCancelled: 0,
      rideRevenueCents: 0,
      paymentsCompleted: 0,
      paymentsFailed: 0,
      refundsCount: 0,
      refundAmountCents: 0,
      daysWithData: 0,
    }
  );
}

async function listDaily(fromKey, toKey) {
  return DailyStats.find({ dateKey: { $gte: fromKey, $lte: toKey } })
    .sort({ dateKey: 1 })
    .lean();
}

module.exports = {
  utcDateKey,
  fareToCents,
  rideIncrements,
  paymentIncrements,
  applyRideEvent,
  applyPaymentEvent,
  parseDateKey,
  aggregateRange,
  listDaily,
};
