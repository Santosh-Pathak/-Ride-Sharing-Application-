/**
 * SMS via Twilio when TWILIO_ACCOUNT_SID is set; otherwise logs (mock).
 */
const { logger } = require('@rideshare/shared');

function isConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

async function sendSms({ to, body }) {
  if (!to) {
    logger.warn('sms.service: missing `to`');
    return { success: false, mock: true, skipped: true };
  }
  if (!isConfigured()) {
    logger.info('[sms mock]', { to, preview: (body || '').slice(0, 120) });
    return { success: true, mock: true };
  }
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await twilio.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
  return { success: true, mock: false };
}

module.exports = { sendSms, isConfigured };
