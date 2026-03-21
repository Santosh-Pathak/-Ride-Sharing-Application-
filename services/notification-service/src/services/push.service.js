/**
 * FCM HTTP v1 would go here; without credentials we log (mock).
 */
const { logger } = require('@rideshare/shared');

function isConfigured() {
  return !!process.env.FCM_SERVER_KEY;
}

async function sendPush({ userId, title, body, data = {} }) {
  if (!userId) {
    logger.warn('push.service: missing userId');
    return { success: false, mock: true, skipped: true };
  }
  if (!isConfigured()) {
    logger.info('[push mock]', { userId, title, body: (body || '').slice(0, 120), data });
    return { success: true, mock: true };
  }
  // Production: call FCM legacy HTTP API or Firebase Admin SDK with device tokens per userId.
  logger.warn('FCM_SERVER_KEY set but push delivery not wired; extend push.service.js');
  return { success: true, mock: true };
}

module.exports = { sendPush, isConfigured };
