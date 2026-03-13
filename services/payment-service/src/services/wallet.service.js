const { getClient } = require('../config/db.config');
const walletRepo = require('../repositories/wallet.repository');
const { AppError } = require('@rideshare/shared');

async function getOrCreateWallet(userId) {
  return walletRepo.getOrCreateWallet(userId, 'USD');
}

async function getBalance(userId) {
  const wallet = await walletRepo.getWallet(userId);
  if (!wallet) return { balanceCents: 0, currency: 'USD' };
  return { balanceCents: Number(wallet.balance_cents), currency: wallet.currency };
}

async function topUp(userId, amountCents, description = 'Wallet top-up') {
  if (amountCents <= 0) throw new AppError('Amount must be positive', 400, 'VALIDATION_ERROR');
  const client = await getClient();
  try {
    await client.query('BEGIN');
    let wallet = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (wallet.rows.length === 0) {
      await client.query(
        'INSERT INTO wallets (user_id, balance_cents, currency) VALUES ($1, 0, $2)',
        [userId, 'USD']
      );
      wallet = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    }
    const current = Number(wallet.rows[0].balance_cents);
    const newBalance = current + amountCents;
    await client.query('UPDATE wallets SET balance_cents = $2, updated_at = NOW() WHERE user_id = $1', [
      userId,
      newBalance,
    ]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, description)
       VALUES ($1, 'credit', $2, $3, $4)`,
      [userId, amountCents, newBalance, description]
    );
    await client.query('COMMIT');
    return { balanceCents: newBalance, currency: 'USD' };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function withdraw(userId, amountCents, description = 'Withdrawal') {
  if (amountCents <= 0) throw new AppError('Amount must be positive', 400, 'VALIDATION_ERROR');
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const wallet = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (wallet.rows.length === 0) throw new AppError('Wallet not found', 404, 'NOT_FOUND');
    const current = Number(wallet.rows[0].balance_cents);
    if (current < amountCents) throw new AppError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    const newBalance = current - amountCents;
    await client.query('UPDATE wallets SET balance_cents = $2, updated_at = NOW() WHERE user_id = $1', [
      userId,
      newBalance,
    ]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, description)
       VALUES ($1, 'debit', $2, $3, $4)`,
      [userId, -amountCents, newBalance, description]
    );
    await client.query('COMMIT');
    return { balanceCents: newBalance, currency: 'USD' };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { getOrCreateWallet, getBalance, topUp, withdraw };
