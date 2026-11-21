'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const ENV = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'AI_PROVIDER', 'THESTALK_AI_ACCESS_CODE'];
async function withEnv(env, fn) {
  const saved = {};
  ENV.forEach(k => { saved[k] = process.env[k]; delete process.env[k]; });
  Object.assign(process.env, env);
  const oldFetch = globalThis.fetch;
  try { await fn(); } finally {
    globalThis.fetch = oldFetch;
    ENV.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  }
}
const fresh = () => { delete require.cache[require.resolve('../lib/common')]; return require('../lib/common'); };

test('a Gemini key alone configures the app and uses the free Gemini endpoint', () => withEnv(
  { GEMINI_API_KEY: 'test-gemini-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    const common = fresh();
    assert.equal(common.configured(), true);
    assert.equal(common.provider(), 'gemini');
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), body: JSON.parse(options.body), auth: options.headers.Authorization });
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: ' Jawapan AI ' } }] }) };
    };
    const out = await common.askAI('Be helpful', [{ role: 'user', content: 'hai' }, { role: 'assistant', content: 'Hai!' }, { role: 'user', content: 'idea?' }], 500, { text: { format: { type: 'json_object' } } });
    assert.equal(out, 'Jawapan AI');
    assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    assert.equal(calls[0].auth, 'Bearer test-gemini-key');
    assert.equal(calls[0].body.model, 'gemini-3.5-flash-lite');
    assert.deepEqual(calls[0].body.response_format, { type: 'json_object' });
    assert.deepEqual(calls[0].body.messages.map(m => m.role), ['system', 'user', 'assistant', 'user']);
    assert.ok(calls[0].body.max_tokens >= 2048);
  }
));

test('Gemini moves to the next free model on 404, 429 or 5xx and reports the free limit clearly', () => withEnv(
  { GEMINI_API_KEY: 'test-gemini-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    const common = fresh();
    const models = [];
    globalThis.fetch = async (url, options) => {
      const m = JSON.parse(options.body).model; models.push(m);
      if (m === 'gemini-3.5-flash-lite') return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'OK' } }] }) };
    };
    assert.equal(await common.askAI('x', 'hello'), 'OK');
    assert.deepEqual(models, ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
    globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
    await assert.rejects(common.askAI('x', 'hello'), e => e.status === 429 && /free tier/i.test(e.message));
    const tried = [];
    globalThis.fetch = async (url, options) => { const m = JSON.parse(options.body).model; tried.push(m); return m === 'gemini-3.5-flash-lite' ? { ok: false, status: 429, json: async () => ({}) } : { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'Lite OK' } }] }) }; };
    assert.equal(await common.askAI('x', 'hello'), 'Lite OK');
    assert.deepEqual(tried, ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
    await assert.rejects(common.askAI('x', 'hello'), e => e.status === 503 && /busy/i.test(e.message));
  }
));

test('OpenAI is still used when only an OpenAI key is set', () => withEnv(
  { OPENAI_API_KEY: 'test-openai', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    const common = fresh();
    assert.equal(common.provider(), 'openai');
    let url = '';
    globalThis.fetch = async u => { url = String(u); return { ok: true, json: async () => ({ output_text: 'ok' }) }; };
    assert.equal(await common.askAI('x', 'y'), 'ok');
    assert.equal(url, 'https://api.openai.com/v1/responses');
  }
));

test('voice transcription uses free Gemini when there is no OpenAI key', () => withEnv(
  { GEMINI_API_KEY: 'test-gemini-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    fresh();
    delete require.cache[require.resolve('../api/transcribe')];
    const transcribe = require('../api/transcribe');
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), headers: options.headers, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: ' Saya rasa gambar close up penting. ' }] } }] }) };
    };
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } };
    await transcribe({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'content-type': 'audio/webm;codecs=opus' }, body: Buffer.alloc(400, 7) }, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.transcript, 'Saya rasa gambar close up penting.');
    assert.match(calls[0].url, /models\/gemini-3\.5-flash-lite:generateContent$/);
    assert.equal(calls[0].headers['x-goog-api-key'], 'test-gemini-key');
    assert.equal(calls[0].body.contents[0].parts[0].inline_data.mime_type, 'audio/webm');
  }
));

test('transcription drops timestamp-only output from silent recordings', () => withEnv(
  { GEMINI_API_KEY: 'test-gemini-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    const common = fresh();
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '00:00' }] } }] }) });
    assert.equal(await common.transcribeGemini(Buffer.alloc(300), 'audio/webm'), '');
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '[00:02] Gambar produk penting.' }] } }] }) });
    assert.equal(await common.transcribeGemini(Buffer.alloc(300), 'audio/webm'), 'Gambar produk penting.');
  }
));

test('voice stays on free Gemini when a paid OpenAI key is also set', () => withEnv(
  { GEMINI_API_KEY: 'test-gemini-key', OPENAI_API_KEY: 'sk-test', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    fresh();
    delete require.cache[require.resolve('../api/transcribe')];
    const transcribe = require('../api/transcribe');
    const urls = [];
    globalThis.fetch = async (url) => { urls.push(String(url)); return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Helo' }] } }] }) }; };
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } };
    await transcribe({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'content-type': 'audio/webm' }, body: Buffer.alloc(400, 7) }, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.match(urls[0], /generativelanguage\.googleapis\.com/);
  }
));
