const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { AppError } = require('@rideshare/shared');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d';

async function register(req, res, next) {
  try {
    const { email, password, name, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already registered', 400, 'CONFLICT');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, name, phone, role });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.status(201).json({
      success: true,
      data: { user: { id: user._id, email: user.email, name: user.name, role: user.role }, token },
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
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.json({
      success: true,
      data: { user: { id: user._id, email: user.email, name: user.name, role: user.role }, token },
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

module.exports = { register, login, me };
