const express = require('express');
const { createServiceProxy } = require('../middleware/proxy.middleware');
const { defaultLimiter, authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.use('/auth', authLimiter, createServiceProxy('user'));
router.use('/users', defaultLimiter, createServiceProxy('user'));
router.use('/rides', defaultLimiter, createServiceProxy('ride'));
router.use('/location', defaultLimiter, createServiceProxy('location'));
router.use('/payments', defaultLimiter, createServiceProxy('payment'));
router.use('/notifications', defaultLimiter, createServiceProxy('notification'));
router.use('/analytics', defaultLimiter, createServiceProxy('analytics'));

module.exports = router;
