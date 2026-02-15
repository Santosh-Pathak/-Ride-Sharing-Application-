const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const { AppError } = require('@rideshare/shared');

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400, 'VALIDATION_ERROR');
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { user, avatar: avatarUrl } });
  } catch (err) {
    next(err);
  }
}

async function uploadLicense(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400, 'VALIDATION_ERROR');
    const licenseDocumentUrl = `/uploads/${req.file.filename}`;
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.userId },
      { licenseDocumentUrl },
      { new: true }
    );
    if (!driver) throw new AppError('Driver profile not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { driver, licenseDocumentUrl } });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAvatar, uploadLicense };
