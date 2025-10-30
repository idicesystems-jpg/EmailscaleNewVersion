const express = require("express");
const multer = require("multer");
const path = require("path");
const upload = multer({ dest: "uploads/" });
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");
const impersonationMiddleware  = require("../middlewares/impersonationMiddleware");
const {
  login,
  logout,
  register,
  getUsers,
  updateUser,
  addUser,
  updateStatus,
  deleteUser,
  exportCsv,
  getUsersWithoutPagination,
  updateUserProfile,
  changePassword,
  updateUserRole,
  getUserActivityLogs
} = require("../controllers/userController");
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const {
  saveDomainAndUser,
  getUserDomains,
  getDomainCreateData,
  importDomainsCsv,
  updateDomainStatus,
  destroyDomain,
  exportDomainsCsv,
  checkAlternateDomainAvailability,
  checkDomainAvailability,
} = require("../controllers/domainController");

const {
  getEmailProviderCounts,
  emailWarmup,
  deleteWarmupEmail,
  bulkDeleteWarmupEmail,
  exportEmailAccounts,
  exportWarmupCsv,
} = require("../controllers/emailWarmupController");

const {
  saveEmailNew,
  deleteEmailAccount,
} = require("../controllers/EmailAccountsController");
const {
  createTicket,
  getAllTickets,
  getTicketDetailById,
  replyTicket,
  getReplies,
  assignTicket,
  getUserTickets,
  getAdminList,
  closeTicket,
  rateTicket,
  deleteTicket,
  getUnreadCount,
  getNotificationsByEmail,
  markNotificationsRead,
} = require("../controllers/ticketController");

const {
  addNote,
  getNotes,
  updateNote,
  deleteNote,
} = require("../controllers/notesController");

const {
  getAllEmailCampaigns,
  getEmailCampaigns,
  singleEmailCampaign,
  emailCampaign,
  updateCampaignDetails,
  deleteCampaigns,
  deleteCampaign,
  updateLimits,
} = require("../controllers/emailCampaignController");

const {
  getAllSmtps,
  createSmtp,
  createSmtpBulk,
} = require("../controllers/smtpAccountsController");

const {
  checkOnboarding,
  completeOnboarding,
} = require("../controllers/userPreferenceController");

const {
  startImpersonation,
  stopImpersonation,
  getActiveImpersonation,
} = require("../controllers/impersonationController");

const { createNote, getAllNotes, addNoteAdminReply, deleteNoteWithReplies, reassignNote, deleteNoteReply } = require("../controllers/adminNoteController");


// Routes
router.post("/login", login);
// router.post("/logout", logout);

router.use(authenticateToken);
router.use(impersonationMiddleware);

router.post("/register", authenticateToken, register);
router.get("/users", getUsers);
router.get("/all-users", getUsersWithoutPagination);
router.put("/updateUserFormData/:id/update", updateUser);
router.post("/add-user", addUser);
router.put("/update-status/:id", updateStatus);
router.delete("/delete-user/:id", deleteUser);
router.get("/export-csv", exportCsv);
router.post("/update-user", updateUserProfile);
router.post("/change-password", changePassword);
router.put("/users/:id/role", updateUserRole);
router.get("/user-activity", getUserActivityLogs);

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
router.put("/domains/:id/status", updateDomainStatus);
router.delete("/domains/:id", destroyDomain);
router.get("/export-domains", exportDomainsCsv);

router.post(
  "/checkAlternateDomainAvailability",
  checkAlternateDomainAvailability
);
router.post("/check-domain-availability", checkDomainAvailability);

//emailWarmup Routes.
router.get("/email-provider-counts", getEmailProviderCounts);
router.get("/email-warmup", emailWarmup);
router.delete("/email-warmup/:id", deleteWarmupEmail);
router.post("/bulk-delete-warmup-email", bulkDeleteWarmupEmail);
router.get("/export-email-accounts", exportEmailAccounts);
router.get("/export-email-warmup-csv", exportWarmupCsv);

//EmailAccounts routes.
router.post("/save-email-new", saveEmailNew);
router.delete("/delete-email-accounts/:id", deleteEmailAccount);

//Tickets controller routes.
router.post("/create-ticket", upload.single("file"), createTicket);
router.get("/all-tickets", upload.single("file"), getAllTickets);
router.get("/getTicketDetailById/:id", getTicketDetailById);
router.post("/reply", upload.single("file"), replyTicket);
router.get("/replies/:id", getReplies);
router.post("/tickets/assign", assignTicket);
router.get('/admins', getAdminList); 

// logged in user tickets.
router.get("/user-tickets", getUserTickets);
router.post("/close/:id", closeTicket);
router.post("/rate/:id", rateTicket);
router.delete("/delete/:id", deleteTicket);
router.get("/notifications/unread-count/:email", getUnreadCount);
router.get("/notifications/:email", getNotificationsByEmail);
router.post("/notifications/mark-read/:email", markNotificationsRead);

// notesController routes
router.post("/ticket-notes/:ticketId", addNote);
router.get("/all-notes/:ticketId", getNotes);
router.put("/update-notes/:noteId", updateNote);
router.delete("/Notedelete/:noteId", deleteNote);

router.post("/get-all-email-campaigns", getAllEmailCampaigns);
router.post("/list-email-campaigns", getEmailCampaigns);
router.post("/single-email-campaign", singleEmailCampaign);
router.post("/email-campaign", upload.single("file"), emailCampaign);
router.put("/update-campaign", updateCampaignDetails);
router.post("/delete_campaigns", deleteCampaigns);
router.post("/delete_campaign", deleteCampaign);
router.post("/update-limits", updateLimits);

router.get("/smtps", getAllSmtps);
router.post("/smtps", createSmtp);
router.post("/smtps_bulk_import", createSmtpBulk);

// User Preference Routes
router.post("/check-onboarding", checkOnboarding);
router.post("/complete-onboarding", completeOnboarding);

// Impersonation Routes
router.post('/impersonate/start',startImpersonation);
router.post('/impersonate/stop',stopImpersonation);
router.get('/impersonate/active/:adminId',getActiveImpersonation);


//Admin notes controller routes
router.post("/add-admin-notes", createNote);
router.get("/get-admin-notes", getAllNotes);
router.post('/admin-note-replies', addNoteAdminReply);
router.delete('/delete-notes/:id', deleteNoteWithReplies);
router.put('/reassign-note/:id', reassignNote);
router.delete('/delete-note-reply/:id', deleteNoteReply);

module.exports = router;
