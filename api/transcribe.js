'use strict';
/* POST /api/transcribe — speech to text for the mic buttons.
   Uses OpenAI when OPENAI_API_KEY is set, otherwise free Gemini (GEMINI_API_KEY). */
const { json, protect, fail, cap, transcribeGemini } = require('../lib/common');

const EXTENSIONS = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/mpeg': 'mp3' };

async function readAudio(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const parts = [];
  let total = 0;
  for await (const part of req) {
    total += part.length;
    if (total > 3_000_000) return null;
    parts.push(part);
  }
  return Buffer.concat(parts);
}

async function transcribeOpenAI(raw, type) {
  const form = new FormData();
  form.set('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe');
  form.set('file', new Blob([raw], { type }), `speech.${EXTENSIONS[type]}`);
  form.set('response_format', 'json');
  form.set('prompt', 'Malay and English research discussion; preserve BM technical terms and English words accurately.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  let r;
  try {
    r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal: controller.signal });
  } finally { clearTimeout(timer); }
  if (!r.ok) throw Object.assign(new Error('Transcription service failed.'), { status: 502 });
  const d = await r.json();
  return d.text || '';
}

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) return json(res, 503, { error: 'AI voice is not configured on the server. Switch voice to Browser.' });
  try {
    const type = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (!EXTENSIONS[type]) return json(res, 415, { error: 'Unsupported audio type.' });
    const raw = await readAudio(req);
    if (!raw) return json(res, 413, { error: 'Recording too large. Keep under 3 MB.' });
    if (raw.length < 150 || raw.length > 3_000_000) return json(res, 413, { error: 'Recording is empty or too large.' });
    const text = process.env.OPENAI_API_KEY ? await transcribeOpenAI(raw, type) : await transcribeGemini(raw, type);
    const transcript = cap(text, 6000);
    if (!transcript) return json(res, 422, { error: 'No speech detected.' });
    return json(res, 200, { transcript });
  } catch (e) {
    return fail(res, e);
  }
};
