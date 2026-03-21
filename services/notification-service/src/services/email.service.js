/**
 * Email delivery. Uses SMTP when SMTP_HOST is set; otherwise logs (mock).
 */
const { logger } = require('@rideshare/shared');

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    logger.warn('email.service: missing `to`');
    return { success: false, mock: true, skipped: true };
  }
  if (!isConfigured()) {
    logger.info('[email mock]', { to, subject, preview: (text || html || '').slice(0, 120) });
    return { success: true, mock: true };
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'rideshare@localhost';
  await transporter.sendMail({ from, to, subject, text, html });
  return { success: true, mock: false };
}

module.exports = { sendEmail, isConfigured };
