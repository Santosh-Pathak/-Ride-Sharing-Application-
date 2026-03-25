const { query } = require('../config/db.config');

async function createPayment({
  userId,
  rideId,
  amountCents,
  currency = 'USD',
  status = 'pending',
  externalId = null,
  metadata = null,
}) {
  const res = await query(
    `INSERT INTO payments (user_id, ride_id, amount_cents, currency, status, external_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      userId,
      rideId,
      amountCents,
      currency,
      status,
      externalId,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return res.rows[0];
}

async function getPaymentById(id) {
  const res = await query('SELECT * FROM payments WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getPaymentsByUserId(userId, limit = 50) {
  const res = await query(
    'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return res.rows;
}

async function updatePaymentStatus(id, status, externalId = null) {
  const res = await query(
    `UPDATE payments SET status = $2, updated_at = NOW(), external_id = COALESCE($3, external_id) WHERE id = $1 RETURNING *`,
    [id, status, externalId]
  );
  return res.rows[0];
}

module.exports = { createPayment, getPaymentById, getPaymentsByUserId, updatePaymentStatus };
