const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'mistral';

// Variation pools
const SUBJECT_STYLES = [
  'casual and friendly',
  'short and professional',
  'lighthearted',
  'neutral tone',
  'colloquial everyday',
  'slightly formal',
  'very brief',
  'question-style',
  'statement style',
  'slightly playful'
];

const BODY_STYLES = [
  'like a colleague checking in',
  'like an old friend saying hello',
  'like a work partner confirming connection',
  'like a casual note',
  'like a professional but friendly message',
  'like a relaxed chatty message',
  'like a busy person with a one-liner',
  'like a thoughtful but short message'
];

 async function genWarmupSubject(context = '') {
  const style = pick(SUBJECT_STYLES);
  const wordTarget = pick([2,3,4,5]);
  const prompt = [
    `Write exactly one short email subject, ${wordTarget} words.`,
    `Tone/style: ${style}.`,
    `Do not include quotes, emojis, punctuation at the end.`,
    `Do not use "warmup" or "test".`,
    `Context: ${context}`,
    `Return ONLY the subject text.`
  ].join('\n');

  let s = await ollamaGenerate(prompt);
  s = sanitizeSubject(s);

  if (!s) {
    const fallbacks = [
      'Quick hello',
      'Checking in',
      'A short note',
      'Just a ping',
      'Friendly hello',
      'Catch up soon',
      'Hello there',
      'Small update',
      'Quick message',
      'Note for you'
    ];
    s = pick(fallbacks);
  }
  return s;
}

 async function genWarmupBody(context = '') {
  const style = pick(BODY_STYLES);
  const lengthChoice = pick([
    '1 short sentence (~20 words)',
    '2 sentences (~40 words total)',
    '3 sentences (~60 words total)',
    '4 sentences (~80 words total)'
  ]);
  const prompt = [
    `Write a short email body.`,
    `Length: ${lengthChoice}.`,
    `Tone/style: ${style}.`,
    `Must sound natural and human.`,
    `No links, no signatures, no emojis, no marketing words.`,
    `Do not use "warmup" or "test".`,
    `Context: ${context}`,
    `Return ONLY the body text.`
  ].join('\n');

  let body = await ollamaGenerate(prompt);
  body = sanitizeBody(body);

  if (!body) {
    const fallbacks = [
      "Hey, just dropping a quick line to make sure email is flowing okay. Hope your day’s going well!",
      "Hi there, sending a short message to see if things are reaching you smoothly. All good here!",
      "Hello! Thought I’d send a quick hello and check that everything looks normal. No rush to reply.",
      "Good morning! Wanted to be sure my note makes it through—nothing urgent, just checking connection."
    ];
    body = pick(fallbacks);
  }
  return body;
}

 async function genReply(original = '') {
  const styles = [
    'short and polite',
    'casual and friendly',
    'professional and brief',
    'lighthearted and warm'
  ];
  const style = pick(styles);
  const lengthChoice = pick([
    '1 sentence (~15 words)',
    '2 sentences (~30 words)',
    '3 sentences (~45 words)'
  ]);
  const prompt = [
    `Write a ${style} reply.`,
    `Length: ${lengthChoice}.`,
    `Reply naturally to this email:`,
    original.slice(0, 500),
    `No emojis, no marketing, no "warmup".`
  ].join('\n');

  let text = await ollamaGenerate(prompt);
  text = sanitizeBody(text);

  if (!text) {
    const fallbacks = [
      "Thanks, that came through fine on my end!",
      "Got it, looks good here. Appreciate the note!",
      "All clear, thanks for checking in.",
      "Yes, this reached me just fine. Thanks for sending it over!"
    ];
    text = pick(fallbacks);
  }
  return text;
}

async function ollamaGenerate(prompt) {
  try {
    console.log(`[AI] Using model: ${MODEL}`);
    console.log(`[AI] Prompt sample:`, prompt.slice(0, 120).trim() + (prompt.length > 120 ? '...' : ''));
    
    const { data } = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      { model: MODEL, prompt, stream: false },
      { timeout: 60000 }
    );
    return (data && (data.response || data)) || '';
  } catch (e) {
    console.warn('[AI] generation failed, fallback used:', e.message);
    return '';
  }
}

function sanitizeSubject(s) {
  if (!s) return '';
  s = s.replace(/[\r\n]+/g, ' ').trim();
  s = s.replace(/^["'`]+|["'`]+$/g, '');
  s = s.replace(/[^\p{Letter}\p{Number}\p{Mark}\s\-]/gu, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  if (s.length > 48) s = s.slice(0, 48).trim();
  if (/warmup|test/i.test(s)) s = s.replace(/warmup|test/ig, '').trim();
  return s;
}

function sanitizeBody(b) {
  if (!b) return '';
  b = b.replace(/^[>\s"'`]+/g, '').replace(/[\s"'`]+$/g, '').trim();
  b = b.replace(/^subject\s*:\s*.*$/gim, '').trim();
  b = b.replace(/warmup|test/ig, '').trim();
  if (b.length > 800) b = b.slice(0, 800).trim();
  return b;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

module.exports = {
  genWarmupSubject,
  genWarmupBody,
  genReply
};