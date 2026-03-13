const express = require('express');
const walletController = require('../controllers/wallet.controller');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/wallet', walletController.getWallet);
router.post('/wallet/topup', walletController.topUp);
router.post('/wallet/withdraw', walletController.withdraw);

router.get('/transactions', paymentController.getTransactions);
router.get('/payments', paymentController.getPayments);
router.get('/payments/:id/invoice', paymentController.invoice);
router.get('/payments/:id', paymentController.getPaymentById);
router.post('/payments/intent', paymentController.createPaymentIntent);
router.post('/payments/:id/refund', paymentController.refund);

module.exports = router;
