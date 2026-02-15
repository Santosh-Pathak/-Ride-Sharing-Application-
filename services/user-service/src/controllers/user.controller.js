const User = require('../models/User.model');
const { AppError } = require('@rideshare/shared');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function deactivateProfile(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { user }, message: 'Profile deactivated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, deactivateProfile };
