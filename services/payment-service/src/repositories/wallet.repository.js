const { query } = require('../config/db.config');

async function getOrCreateWallet(userId, currency = 'USD') {
  const res = await query(
    `INSERT INTO wallets (user_id, currency) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [userId, currency]
  );
  return res.rows[0];
}

async function getWallet(userId) {
  const res = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

async function updateBalance(userId, balanceCents) {
  const res = await query(
    `UPDATE wallets SET balance_cents = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
    [userId, balanceCents]
  );
  return res.rows[0];
}

module.exports = { getOrCreateWallet, getWallet, updateBalance };
