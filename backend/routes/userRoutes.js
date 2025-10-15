const express = require('express');
const router = express.Router();
const {login, register, getUsers, updateUser, addUser } = require('../controllers/userController');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

// Routes
router.post('/login', login);
router.post('/register', register);
router.get('/users', getUsers);
router.put('/update-user', updateUser);
router.post('/add-user', addUser);

router.get('/transaction', getAllTransactions);
router.get('/transaction:id', getTransactionById);
router.post('/post-transaction', createTransaction);
router.put('/transaction/:id', updateTransaction);
router.delete('/get/:id', deleteTransaction);

module.exports = router;
