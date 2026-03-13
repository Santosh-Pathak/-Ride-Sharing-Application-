/**
 * Stripe integration with mock fallback when STRIPE_SECRET_KEY is not set.
 * Never log or store full card details; use Stripe PaymentMethod IDs only.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const isMock = !STRIPE_SECRET_KEY;

async function createPaymentIntent(amountCents, currency = 'usd', metadata = {}) {
  if (isMock) {
    return {
      id: `pi_mock_${Date.now()}`,
      client_secret: `mock_secret_${Date.now()}`,
      status: 'requires_payment_method',
      amount: amountCents,
      currency,
    };
  }
  const Stripe = require('stripe');
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return {
    id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
}

async function confirmPaymentIntent(paymentIntentId) {
  if (isMock) {
    return { status: 'succeeded', id: paymentIntentId };
  }
  const Stripe = require('stripe');
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status === 'succeeded') return { status: 'succeeded', id: pi.id };
  const updated = await stripe.paymentIntents.confirm(paymentIntentId);
  return { status: updated.status, id: updated.id };
}

async function createRefund(paymentIntentId, amountCents = null) {
  if (isMock) {
    return { id: `re_mock_${Date.now()}`, status: 'succeeded' };
  }
  const Stripe = require('stripe');
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const params = amountCents ? { amount: amountCents } : {};
  const refund = await stripe.refunds.create({ payment_intent: paymentIntentId, ...params });
  return { id: refund.id, status: refund.status };
}

function isMockMode() {
  return isMock;
}

module.exports = { createPaymentIntent, confirmPaymentIntent, createRefund, isMockMode };
