const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    heading: { type: Number },
    speed: { type: Number },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

locationHistorySchema.index({ driverId: 1, recordedAt: -1 });
locationHistorySchema.index({ recordedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days TTL

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
