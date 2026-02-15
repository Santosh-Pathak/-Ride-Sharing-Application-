const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { AppError } = require('@rideshare/shared');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const {
  storeRefreshToken,
  validateAndConsumeRefreshToken,
} = require('../services/refreshToken.service');

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';

function buildTokenPayload(user) {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

async function register(req, res, next) {
  try {
    const { email, password, name, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already registered', 400, 'CONFLICT');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, name, phone, role });
    const accessToken = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshTokenId = await storeRefreshToken(user._id.toString());
    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken: refreshTokenId,
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }
    const accessToken = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshTokenId = await storeRefreshToken(user._id.toString());
    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken: refreshTokenId,
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400, 'VALIDATION_ERROR');
    const payload = await validateAndConsumeRefreshToken(refreshToken);
    if (!payload) throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
    const accessToken = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const newRefreshTokenId = await storeRefreshToken(user._id.toString());
    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken: newRefreshTokenId,
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, me };
