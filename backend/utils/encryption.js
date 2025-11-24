/**
 * utils/encryption.js
 * AES-256-CBC encryption & decryption utility
 * Safely encrypts and decrypts sensitive credentials (e.g., IMAP/SMTP passwords)
 */

const crypto = require('crypto');

const ENC_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32); // 32 bytes
const IV_LEN = 16;
  

// --- Encrypt function ---
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

// --- Decrypt function ---
function decrypt(enc) {
  if (!enc) return '';
  const [ivB64, data] = enc.split(':');
  if (!ivB64 || !data) return '';
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
