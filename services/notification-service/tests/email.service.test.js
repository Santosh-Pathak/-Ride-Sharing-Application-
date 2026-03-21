const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('email.service (mock path)', () => {
  it('sendEmail returns mock when SMTP not configured', async () => {
    if (process.env.SMTP_HOST) {
      // Skip when real SMTP is configured in the environment
      return;
    }
    const emailService = require('../src/services/email.service');
    const r = await emailService.sendEmail({ to: 'a@b.com', subject: 'Hi', text: 'Body' });
    assert.strictEqual(r.mock, true);
    assert.strictEqual(r.success, true);
  });
});
