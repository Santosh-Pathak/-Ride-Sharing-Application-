const { query } = require('../config/db.config');

async function createTransaction({
  userId,
  type,
  amountCents,
  balanceAfterCents,
  paymentId = null,
  description = null,
}) {
  const res = await query(
    `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, payment_id, description)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, type, amountCents, balanceAfterCents, paymentId, description]
  );
  return res.rows[0];
}

async function getTransactionsByUserId(userId, limit = 50, offset = 0) {
  const res = await query(
    `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
}

module.exports = { createTransaction, getTransactionsByUserId };
