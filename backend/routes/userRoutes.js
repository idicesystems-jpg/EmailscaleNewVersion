const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const router = express.Router();
const {
  login,
  register,
  getUsers,
  updateUser,
  addUser,
  updateStatus,
  deleteUser,
  exportCsv,
} = require("../controllers/userController");
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const { saveDomainAndUser, getUserDomains, getDomainCreateData, importDomainsCsv, updateDomainStatus, destroyDomain } = require("../controllers/domainController");

// Routes
router.post("/login", login);
router.post("/register", register);
router.get("/users", getUsers);
router.put("/update-user/:id", updateUser);
router.post("/add-user", addUser);
router.put("/update-status/:id", updateStatus);
router.delete("/delete-user/:id", deleteUser);
router.get("/export-csv", exportCsv);

router.get("/transaction", getAllTransactions);
router.get("/transaction:id", getTransactionById);
router.post("/post-transaction", createTransaction);
router.put("/transaction/:id", updateTransaction);
router.delete("/get/:id", deleteTransaction);

// domainController route
router.post("/save-domain", saveDomainAndUser);
router.get("/domains/:user_id", getUserDomains);
router.get("/all-domains", getDomainCreateData);
router.post("/import-domains", upload.single("import_file"), importDomainsCsv);
router.put('/domains/:id/status', updateDomainStatus);
router.delete('/domains/:id', destroyDomain);

module.exports = router;
