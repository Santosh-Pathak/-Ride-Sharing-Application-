const mongoose = require('mongoose');
const { USER_ROLES } = require('@rideshare/shared');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.RIDER },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
