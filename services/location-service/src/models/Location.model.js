const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true, index: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    heading: { type: Number, min: 0, max: 360 }, // degrees
    speed: { type: Number, min: 0 }, // km/h
    isAvailable: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

locationSchema.index({ location: '2dsphere' });
locationSchema.index({ driverId: 1, updatedAt: -1 });

module.exports = mongoose.model('Location', locationSchema);
