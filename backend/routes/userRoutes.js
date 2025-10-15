const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById,login, register } = require('../controllers/userController');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

// Routes
router.get('/users', getAllUsers);
router.get('/user/:id', getUserById);
router.post('/login', login);
router.post('/register', register);

router.get('/transaction', getAllTransactions);
router.get('/transaction:id', getTransactionById);
router.post('/post-transaction', createTransaction);
router.put('/transaction/:id', updateTransaction);
router.delete('/get/:id', deleteTransaction);

module.exports = router;
