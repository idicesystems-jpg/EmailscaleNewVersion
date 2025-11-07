// utils/mailVerification.js
const { createTransport } = require('nodemailer');
const { ImapFlow } = require('imapflow');

/**
 * Verify SMTP connection by testing credentials
 */
async function verifySmtp({ host, port, secure, user, pass }) {
  const transporter = await createTransport({ host, port, secure, auth: { user, pass } });
  try {
    await transporter.verify();
    return true;
  } finally {
    try { await transporter.close(); } catch {}
  }
}

/**
 * Verify IMAP connection safely (read-only)
 */
async function verifyImap({ host, port, secure, user, pass }) {
  const client = new ImapFlow({
    host,
    port,
    secure: !!secure,
    auth: { user, pass },
    logger: false
  });
  try {
    await client.connect();
    await client.mailboxOpen('INBOX', { readOnly: true });
    return true;
  } finally {
    try { await client.logout(); } catch {}
  }
}

module.exports = { verifySmtp, verifyImap };
