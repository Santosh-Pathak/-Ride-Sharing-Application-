const notificationService = require('../services/notification.service');
const { AppError } = require('@rideshare/shared');

async function list(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { page, limit } = req.query;
    const result = await notificationService.listForUser(userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const doc = await notificationService.getForUser(userId, req.params.id);
    if (!doc) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const doc = await notificationService.markRead(userId, req.params.id);
    if (!doc) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, markRead };
