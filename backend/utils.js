const crypto = require('crypto');

const ENC_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32); // 32 bytes
const IV_LEN = 16;

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

// function decrypt(enc) {
//   console.log('Decrypting:', enc);
//   if (!enc) return '';
//   const [ivB64, data] = enc.split(':');
//   const iv = Buffer.from(ivB64, 'base64');
//   const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
//   let decrypted = decipher.update(data, 'base64', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }

function decrypt(enc) {
  if (!enc) return '';
  try {
    // If it's not in the expected format, just return the decoded string
    if (!enc.includes(':')) return decodeURIComponent(enc);

    const [ivB64, data] = enc.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decrypt error:', err.message);
    return decodeURIComponent(enc);
  }
}



function randomToken(len = 16) {
  return crypto.randomBytes(len).toString('hex');
}

function isTruthy(x) {
  if (typeof x === 'boolean') return x;
  if (typeof x === 'number') return x !== 0;
  if (typeof x === 'string') return ['true', '1', 'yes', 'on'].includes(x.toLowerCase());
  return !!x;
}

module.exports = {
  encrypt,
  decrypt,
  randomToken,
  isTruthy
};
