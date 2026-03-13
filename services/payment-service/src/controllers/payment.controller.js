const paymentRepo = require('../repositories/payment.repository');
const transactionRepo = require('../repositories/transaction.repository');
const paymentService = require('../services/payment.service');

async function getTransactions(req, res, next) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const transactions = await transactionRepo.getTransactionsByUserId(
      req.user.userId,
      Number(limit),
      Number(offset)
    );
    res.json({ success: true, data: { transactions } });
  } catch (err) {
    next(err);
  }
}

async function getPayments(req, res, next) {
  try {
    const { limit = 50 } = req.query;
    const payments = await paymentRepo.getPaymentsByUserId(req.user.userId, Number(limit));
    res.json({ success: true, data: { payments } });
  } catch (err) {
    next(err);
  }
}

async function getPaymentById(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await paymentRepo.getPaymentById(id);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    if (payment.user_id !== req.user.userId) return res.status(403).json({ success: false, error: 'Forbidden' });
    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

async function createPaymentIntent(req, res, next) {
  try {
    const { amountCents, amount } = req.body;
    const cents =
      amountCents != null ? Number(amountCents) : Math.round(Number(amount || 0) * 100);
    const intent = await paymentService.createPaymentIntent(req.user.userId, cents, req.body.metadata || {});
    res.json({ success: true, data: intent });
  } catch (err) {
    next(err);
  }
}

async function refund(req, res, next) {
  try {
    const { id } = req.params;
    const { amountCents, amount } = req.body || {};
    const cents = amountCents != null ? Number(amountCents) : amount != null ? Math.round(Number(amount) * 100) : null;
    const result = await paymentService.refundPayment(id, req.user.userId, cents);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function invoice(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await paymentRepo.getPaymentById(id);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    if (payment.user_id !== req.user.userId) return res.status(403).json({ success: false, error: 'Forbidden' });
    res.json({
      success: true,
      data: {
        invoice: {
          paymentId: payment.id,
          rideId: payment.ride_id,
          amountCents: payment.amount_cents,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.created_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  getPayments,
  getPaymentById,
  createPaymentIntent,
  refund,
  invoice,
};
