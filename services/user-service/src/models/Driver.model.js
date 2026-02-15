const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true },
    licenseDocumentUrl: { type: String },
    vehicleInfo: {
      make: String,
      model: String,
      year: Number,
      plate: String,
      color: String,
    },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
  },
  { timestamps: true }
);

driverSchema.index({ userId: 1 });
driverSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Driver', driverSchema);
