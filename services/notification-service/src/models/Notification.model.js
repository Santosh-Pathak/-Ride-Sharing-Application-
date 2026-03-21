const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    source: { type: String, enum: ['ride', 'payment', 'system'], default: 'ride' },
    eventKey: { type: String },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
