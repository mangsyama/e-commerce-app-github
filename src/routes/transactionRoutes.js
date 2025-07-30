const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');

router.post('/', TransactionController.createTransaction);
router.get('/:id', TransactionController.getTransactionById);
router.get('/customer/:customerId', TransactionController.getTransactionsByCustomerId);
router.put('/:id/status', TransactionController.updateTransactionStatus);
router.delete('/:id', TransactionController.deleteTransaction);
router.get('/', TransactionController.getAllTransactions);

module.exports = router;