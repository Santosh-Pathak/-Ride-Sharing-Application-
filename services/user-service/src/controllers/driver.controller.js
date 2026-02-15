const Driver = require('../models/Driver.model');
const User = require('../models/User.model');
const { AppError } = require('@rideshare/shared');
const { USER_ROLES } = require('@rideshare/shared');

async function registerDriver(req, res, next) {
  try {
    const userId = req.user.userId;
    const { licenseNumber, vehicleInfo } = req.body;
    const existingUser = await User.findById(userId);
    if (!existingUser) throw new AppError('User not found', 404, 'NOT_FOUND');
    const existingDriver = await Driver.findOne({ userId });
    if (existingDriver) throw new AppError('Already registered as driver', 400, 'CONFLICT');
    const driver = await Driver.create({
      userId,
      licenseNumber: licenseNumber || '',
      vehicleInfo: vehicleInfo || {},
    });
    await User.findByIdAndUpdate(userId, { role: USER_ROLES.DRIVER });
    res.status(201).json({ success: true, data: { driver } });
  } catch (err) {
    next(err);
  }
}

async function getMyDriverProfile(req, res, next) {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId }).populate('userId', 'name email phone');
    if (!driver) throw new AppError('Driver profile not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { driver } });
  } catch (err) {
    next(err);
  }
}

async function updateDriverProfile(req, res, next) {
  try {
    const { licenseNumber, licenseDocumentUrl, vehicleInfo } = req.body;
    const update = {};
    if (licenseNumber !== undefined) update.licenseNumber = licenseNumber;
    if (licenseDocumentUrl !== undefined) update.licenseDocumentUrl = licenseDocumentUrl;
    if (vehicleInfo && typeof vehicleInfo === 'object') {
      update.vehicleInfo = vehicleInfo;
    }
    const driver = await Driver.findOneAndUpdate({ userId: req.user.userId }, update, { new: true });
    if (!driver) throw new AppError('Driver profile not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { driver } });
  } catch (err) {
    next(err);
  }
}

async function updateAvailability(req, res, next) {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      throw new AppError('isAvailable must be a boolean', 400, 'VALIDATION_ERROR');
    }
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.userId },
      { isAvailable },
      { new: true }
    );
    if (!driver) throw new AppError('Driver profile not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { isAvailable: driver.isAvailable } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerDriver,
  getMyDriverProfile,
  updateDriverProfile,
  updateAvailability,
};
