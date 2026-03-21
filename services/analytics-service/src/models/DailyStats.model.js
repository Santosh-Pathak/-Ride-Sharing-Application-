const mongoose = require('mongoose');

/**
 * UTC calendar-day aggregates (dateKey = YYYY-MM-DD).
 */
const dailyStatsSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    ridesRequested: { type: Number, default: 0 },
    ridesMatched: { type: Number, default: 0 },
    ridesAccepted: { type: Number, default: 0 },
    ridesRejected: { type: Number, default: 0 },
    ridesStarted: { type: Number, default: 0 },
    ridesCompleted: { type: Number, default: 0 },
    ridesCancelled: { type: Number, default: 0 },
    /** Gross trip value from ride.completed fare (cents) */
    rideRevenueCents: { type: Number, default: 0 },
    paymentsCompleted: { type: Number, default: 0 },
    paymentsFailed: { type: Number, default: 0 },
    refundsCount: { type: Number, default: 0 },
    refundAmountCents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
