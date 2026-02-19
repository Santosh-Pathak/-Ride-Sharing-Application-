const mongoose = require('mongoose');
const { RIDE_STATUS } = require('@rideshare/shared');

const pointSchema = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }, // [lng, lat]
};

const rideSchema = new mongoose.Schema(
  {
    riderId: { type: String, required: true, index: true },
    driverId: { type: String, index: true },
    status: {
      type: String,
      enum: Object.values(RIDE_STATUS),
      default: RIDE_STATUS.REQUESTED,
      index: true,
    },
    pickup: {
      type: pointSchema,
      required: true,
    },
    dropoff: {
      type: pointSchema,
      required: true,
    },
    fare: {
      baseFare: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 },
      durationMin: { type: Number, default: 0 },
      ratePerKm: { type: Number, default: 0 },
      ratePerMin: { type: Number, default: 0 },
      surgeMultiplier: { type: Number, default: 1 },
      total: { type: Number, default: 0 },
    },
    requestedAt: { type: Date, default: Date.now },
    matchedAt: { type: Date },
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    acceptanceTimeoutAt: { type: Date },
  },
  { timestamps: true }
);

rideSchema.index({ riderId: 1, createdAt: -1 });
rideSchema.index({ driverId: 1, createdAt: -1 });
rideSchema.index({ status: 1, acceptanceTimeoutAt: 1 });

module.exports = mongoose.model('Ride', rideSchema);
