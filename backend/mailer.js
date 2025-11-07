const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { decrypt } = require('./utils');

async function createTransport({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure: !!secure,
    auth: { user, pass },
  });
}

async function verifySmtp({ host, port, secure, user, pass }) {
  const t = await createTransport({ host, port, secure, user, pass });
  try {
    await t.verify();
    return true;
  } finally {
    try {
      await t.close();
    } catch {}
  }
}

/**
 * Safer IMAP verification: just open INBOX read-only and close.
 * Avoids async iterators (LIST) so nothing continues after logout.
 */
async function verifyImap({ host, port, secure, user, pass }) {
  const client = new ImapFlow({
    host,
    port,
    secure: !!secure,
    auth: { user, pass },
    logger: false,
  });
  try {
    await client.connect();
    await client.mailboxOpen('INBOX', { readOnly: true });
    return true;
  } finally {
    try {
      await client.logout();
    } catch {}
  }
}

async function imapConnect(acc) {
  const client = new ImapFlow({
    host: acc.imap_host,
    port: acc.imap_port,
    secure: !!acc.imap_secure,
    auth: { user: acc.imap_user, pass: decrypt(acc.imap_pass) },
    logger: false,
  });
  await client.connect();
  return client;
}

module.exports = {
  createTransport,
  verifySmtp,
  verifyImap,
  imapConnect,
};
