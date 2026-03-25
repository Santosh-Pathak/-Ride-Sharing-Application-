const { getClient } = require('../config/db.config');
const paymentRepo = require('../repositories/payment.repository');
const stripeService = require('./stripe.service');
const { AppError } = require('@rideshare/shared');
const { PAYMENT_STATUS } = require('@rideshare/shared');
const { kafka, EVENTS } = require('@rideshare/shared');
const { logger } = require('@rideshare/shared');

const PAYMENT_TOPIC = process.env.KAFKA_PAYMENT_TOPIC || 'payment-events';

function centsFromDecimal(amount) {
  return Math.round(Number(amount) * 100);
}

async function processRidePayment(rideId, riderId, amountCents) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const walletRes = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [
      riderId,
    ]);
    if (walletRes.rows.length === 0) {
      await client.query(
        'INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, $2)',
        [riderId, 'USD']
      );
    }
    const wallet = (
      await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [riderId])
    ).rows[0];
    const balanceCents = Number(wallet.balance_cents);
    if (balanceCents < amountCents) {
      await client.query('ROLLBACK');
      const payment = await paymentRepo.createPayment({
        userId: riderId,
        rideId,
        amountCents,
        status: PAYMENT_STATUS.FAILED,
        metadata: { reason: 'insufficient_balance' },
      });
      try {
        await kafka.send(PAYMENT_TOPIC, {
          event: EVENTS.PAYMENT_FAILED,
          paymentId: payment.id,
          rideId,
          userId: riderId,
        });
      } catch (e) {
        logger.warn('Kafka payment.failed send failed', { error: e.message });
      }
      throw new AppError('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');
    }
    const newBalance = balanceCents - amountCents;
    const payment = (
      await client.query(
        `INSERT INTO payments (user_id, ride_id, amount_cents, currency, status) VALUES ($1, $2, $3, 'USD', $4) RETURNING *`,
        [riderId, rideId, amountCents, PAYMENT_STATUS.COMPLETED]
      )
    ).rows[0];
    await client.query(
      'UPDATE wallets SET balance_cents = $2, updated_at = NOW() WHERE user_id = $1',
      [riderId, newBalance]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, payment_id, description)
       VALUES ($1, 'ride_payment', $2, $3, $4, $5)`,
      [riderId, -amountCents, newBalance, payment.id, `Ride ${rideId}`]
    );
    await client.query('COMMIT');
    try {
      await kafka.send(PAYMENT_TOPIC, {
        event: EVENTS.PAYMENT_COMPLETED,
        paymentId: payment.id,
        rideId,
        userId: riderId,
        amountCents,
      });
    } catch (e) {
      logger.warn('Kafka payment.completed send failed', { error: e.message });
    }
    return payment;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function createPaymentIntent(userId, amountCents, metadata = {}) {
  if (amountCents <= 0) throw new AppError('Amount must be positive', 400, 'VALIDATION_ERROR');
  return stripeService.createPaymentIntent(amountCents, 'usd', { userId, ...metadata });
}

async function refundPayment(paymentId, userId, amountCents = null) {
  const payment = await paymentRepo.getPaymentById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
  if (payment.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (payment.status !== PAYMENT_STATUS.COMPLETED) {
    throw new AppError('Payment cannot be refunded', 400, 'INVALID_STATE');
  }
  const refundAmount = amountCents ?? Number(payment.amount_cents);
  let refund = { id: null, status: 'succeeded' };
  if (payment.external_id) {
    refund = await stripeService.createRefund(payment.external_id, refundAmount);
  }
  await paymentRepo.updatePaymentStatus(paymentId, PAYMENT_STATUS.REFUNDED);
  try {
    await kafka.send(PAYMENT_TOPIC, {
      event: EVENTS.PAYMENT_REFUNDED,
      paymentId,
      userId,
      amountCents: refundAmount,
    });
  } catch (e) {
    logger.warn('Kafka payment.refunded send failed', { error: e.message });
  }
  return { refundId: refund.id || `refund_${paymentId}`, status: refund.status };
}

module.exports = {
  processRidePayment,
  createPaymentIntent,
  refundPayment,
  centsFromDecimal,
};
