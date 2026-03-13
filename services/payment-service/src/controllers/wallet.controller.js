const walletService = require('../services/wallet.service');

async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getOrCreateWallet(req.user.userId);
    const balance = await walletService.getBalance(req.user.userId);
    res.json({ success: true, data: { wallet: { ...wallet, ...balance } } });
  } catch (err) {
    next(err);
  }
}

async function topUp(req, res, next) {
  try {
    const { amountCents, amount, description } = req.body;
    const cents = amountCents != null ? Number(amountCents) : Math.round(Number(amount || 0) * 100);
    const result = await walletService.topUp(
      req.user.userId,
      cents,
      description || 'Wallet top-up'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function withdraw(req, res, next) {
  try {
    const { amountCents, amount, description } = req.body;
    const cents = amountCents != null ? Number(amountCents) : Math.round(Number(amount || 0) * 100);
    const result = await walletService.withdraw(
      req.user.userId,
      cents,
      description || 'Withdrawal'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWallet, topUp, withdraw };
