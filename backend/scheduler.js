const { queryApp: query } = require('./db');
const { decrypt, encrypt, randomToken } = require('./utils');
const { createTransport, imapConnect } = require('./mailer');
const { genWarmupSubject, genWarmupBody, genReply } = require('./ai');


const WARMUP_INTERVAL = parseInt(process.env.WARMUP_INTERVAL_SEC || '120', 10) * 1000;
const IMAP_SCAN_INTERVAL = parseInt(process.env.IMAP_SCAN_INTERVAL_SEC || '60', 10) * 1000;

const DEBUG_IMAP = String(process.env.DEBUG_IMAP || '1') !== '0';
const ADOPT_MISSING_TOKENS = String(process.env.ADOPT_MISSING_TOKENS || '0') === '1';
const ENGAGEMENT_FOR_ALL = String(process.env.ENGAGEMENT_FOR_ALL || '1') === '1';

function dlog(...args){ if (DEBUG_IMAP) console.log('[imap][debug]', ...args); }

const SPAM_BOXES = ['[Gmail]/Spam','Spam','Junk','Bulk Mail','Bulk','[Yahoo]/Bulk','Junk E-mail'];

// function to refresh from DB
 async function loadSettings() {
  const rows = await query('SELECT `key`,`value` FROM settings WHERE `key`="ENGAGEMENT_FOR_ALL"')
  if (rows.length) ENGAGEMENT_FOR_ALL = rows[0].value === '1'
}

 function startSchedulers() {
  // const password = 'Idice%2024';
  // const encryptedPassword = encrypt(password);

  // console.log('Encrypted:', encryptedPassword);
  setInterval(() => tickWarmup().catch(console.error), WARMUP_INTERVAL);
  setInterval(() => scanImapAll().catch(console.error), IMAP_SCAN_INTERVAL);
  console.log(`[warmup] 🟢 scheduler every ${WARMUP_INTERVAL/1000}s | imap scan every ${IMAP_SCAN_INTERVAL/1000}s`);
}

 async function pickPair() {
  await query('UPDATE smtp_accounts SET sent_today=0, sent_today_date=CURDATE() WHERE sent_today_date IS NULL OR sent_today_date <> CURDATE()');
  const smtps = await query('SELECT * FROM smtp_accounts WHERE enabled=1 AND (sent_today < daily_limit) ORDER BY RAND() LIMIT 1');
  const provs = await query('SELECT * FROM provider_accounts WHERE enabled=1 ORDER BY RAND() LIMIT 1');
  return { smtp: smtps[0], provider: provs[0] };
}

 async function tickWarmup() {
  const { smtp, provider } = await pickPair();
  if (!smtp || !provider) return;

  const token = randomToken(8);
  const subject = await genWarmupSubject(`${smtp.from_email} to ${provider.email}`);
  const bodyCore = await genWarmupBody(`from: ${smtp.from_email}, to: ${provider.email}`);
  const body = `${bodyCore}\n\nRef: ${token}`;

  const t = await createTransport({
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: !!smtp.smtp_secure,
    user: smtp.smtp_user,
    pass: decrypt(smtp.smtp_pass)
  });


  try {
    const info = await t.sendMail({
      from: `${smtp.from_name || smtp.from_email} <${smtp.from_email}>`,
      to: provider.email,
      subject,
      text: body
    });
    await query(
      'INSERT INTO warmup_logs (token, subject, from_smtp_id, to_provider_id, message_id, status, sent_at) VALUES (?,?,?,?,?,?,NOW())',
      [token, subject, smtp.id, provider.id, info.messageId || null, 'sent']
    );
    await query('UPDATE smtp_accounts SET sent_today = sent_today + 1, sent_today_date=CURDATE() WHERE id=?', [smtp.id]);
    console.log(`[warmup] sent ${smtp.from_email} -> ${provider.email} token=${token}`);
  } catch (e) {
    await query(
      'INSERT INTO warmup_logs (token, subject, from_smtp_id, to_provider_id, status, error, sent_at) VALUES (?,?,?,?,?, ?, NOW())',
      [token, subject, smtp.id, provider.id, 'failed', String(e)]
    );
    console.warn('[warmup] send failed test', e);
  } finally {
    try { await t.close(); } catch {}
  }
}

 async function scanImapAll() {
  const provs = await query('SELECT * FROM provider_accounts WHERE enabled=1');
  if (!provs.length) { console.log('[imap] no provider accounts to scan'); return; }
  console.log(`[imap] starting scan for ${provs.length} account(s)`);
  for (const acc of provs) {
    try { await scanImapAccount(acc); } catch (e) { console.warn('[imap] scan error', acc.email, e.message); }
  }
  console.log('[imap] scan complete');
}

async function scanImapAccount(acc) {
  console.log(`[imap] connecting ${acc.email} (${acc.imap_host}:${acc.imap_port})`);
  const client = await imapConnect(acc);
  try {
    await client.mailboxOpen('INBOX', { readOnly: false });
    await processMailboxLast10(client, acc, 'INBOX', false);
    for (const box of SPAM_BOXES) {
      try {
        await client.mailboxOpen(box, { readOnly: false });
        await processMailboxLast10(client, acc, box, true);
      } catch (_) {}
    }
  } finally {
    try { await client.logout(); } catch {}
  }
}

function extractHeader(raw, name) {
  const re = new RegExp(`^${name}:\\s*(.+)$`, 'gim');
  const m = re.exec(raw);
  return m ? m[1].trim() : null;
}

async function adoptIfMissing({ token, acc, subject, fromAddr, boxName, isSpamBox }) {
  if (!ADOPT_MISSING_TOKENS) return null;
  let fromSmtpId = null;
  if (fromAddr) {
    const sm = await query('SELECT id FROM smtp_accounts WHERE from_email = ? LIMIT 1', [fromAddr]);
    if (sm.length) fromSmtpId = sm[0].id;
  }
  await query(
    'INSERT INTO warmup_logs (token, subject, from_smtp_id, to_provider_id, status, mailbox, spam_folder, received_at, sent_at) VALUES (?,?,?,?,?,?,?,NOW(),NULL)',
    [token, subject?.slice(0,255) || null, fromSmtpId, acc.id, 'received', boxName, isSpamBox ? 1 : 0]
  );
  const [row] = await query('SELECT * FROM warmup_logs WHERE token=? ORDER BY id DESC LIMIT 1', [token]);
  return row || null;
}

async function processMailboxLast10(client, acc, boxName, isSpamBox) {
  const lock = await client.getMailboxLock(boxName);
  try {
    const status = await client.status(boxName, { messages: true });
    const total = status.messages || 0;
    if (!total) return;
    const start = Math.max(1, total - 9);
    const range = `${start}:*`;

    const msgs = [];
    for await (let msg of client.fetch(range, { envelope:true, source:true, flags:true, uid:true })) {
      msgs.push(msg);
    }
    msgs.reverse();

    for (const msg of msgs) {
      const raw = msg.source.toString('utf8');
      const subject = msg.envelope?.subject || '';
      const fromAddr = msg.envelope?.from?.[0]?.address;
      const tokenMatch = raw.match(/\b([a-f0-9]{16})\b/);
      const token = tokenMatch ? tokenMatch[1] : null;
      if (!token) continue;

      let [log] = await query('SELECT * FROM warmup_logs WHERE token=?', [token]);
      if (!log) {
        log = await adoptIfMissing({ token, acc, subject, fromAddr, boxName, isSpamBox });
        if (!log) continue;
      }

      if (!log.received_at) {
        await query('UPDATE warmup_logs SET received_at=NOW(), mailbox=?, spam_folder=? WHERE id=?',
          [boxName, isSpamBox?1:0, log.id]);
      }

      // ⭐ Engagement handling
      const originalMsgId = extractHeader(raw, 'Message-ID') || extractHeader(raw, 'Message-Id');
      if (isSpamBox) {
        const isYahoo = acc.provider === 'yahoo' || acc.provider === 'aol';
        if (isYahoo) {
          try {
            await client.messageMove(msg.uid, 'INBOX', { uid: true });
            if (originalMsgId) {
              const inboxUids = await client.search({ header: ['Message-ID', originalMsgId] }, { uid:true });
              if (inboxUids.length) {
                const flags = ['\\Seen','\\Flagged','NonJunk','NotJunk','$NotJunk'];
                if (ENGAGEMENT_FOR_ALL) flags.push('\\Answered');
                await client.messageFlagsAdd(inboxUids, flags, { uid:true });
              }
            }
          } catch {
            // fallback: COPY + delete
            await client.messageCopy(msg.uid, 'INBOX', { uid:true });
            await client.messageDelete(msg.uid, { uid:true, expunge:true });
          }
        } else {
          try {
            await client.messageMove(msg.uid, 'INBOX', { uid:true });
            if (ENGAGEMENT_FOR_ALL && originalMsgId) {
              const inboxUids = await client.search({ header: ['Message-ID', originalMsgId] }, { uid:true });
              if (inboxUids.length) {
                await client.messageFlagsAdd(inboxUids, ['\\Seen','\\Flagged','\\Answered'], { uid:true });
              }
            }
          } catch {}
        }
      }

      // always mark the original as Seen + Starred
      try { await client.messageFlagsAdd(msg.uid, ['\\Seen','\\Flagged'], { uid:true }); } catch {}

      // reply logic...
      if (!log.reply_at && acc.smtp_host && acc.smtp_user && acc.smtp_pass && fromAddr) {
        try {
          const transporter = await createTransport({
            host: acc.smtp_host,
            port: acc.smtp_port,
            secure: !!acc.smtp_secure,
            user: acc.smtp_user,
            pass: decrypt(acc.smtp_pass)
          });
          const replyText = await genReply(raw.slice(0,800));
          await transporter.sendMail({
            from: acc.email,
            to: fromAddr,
            subject: 'Re: ' + subject,
            text: replyText,
            headers: originalMsgId ? { 'In-Reply-To': originalMsgId, 'References': originalMsgId } : {}
          });
          await query('UPDATE warmup_logs SET reply_at=NOW(), status="replied" WHERE id=?', [log.id]);
        } catch(e) {
          await query('UPDATE warmup_logs SET status="failed", error=? WHERE id=?', [String(e), log.id]);
        }
      }
    }
  } finally { lock.release(); }
}

module.exports = {
  loadSettings,
  startSchedulers,
  tickWarmup,
  scanImapAll
};