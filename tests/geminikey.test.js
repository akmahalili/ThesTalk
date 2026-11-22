'use strict';
/* When Google rejects the server's Gemini key, the app answers with Groq instead of failing. */
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.THESTALK_AI_ACCESS_CODE = 'owner-code-123456';
process.env.GEMINI_API_KEY = 'OLD-REVOKED-KEY';
process.env.GROQ_API_KEY = 'GROQ-KEY';
const C = require('../lib/common');

test('a rejected Gemini key falls back to Groq; without Groq the message says what to do', async () => {
  const real = globalThis.fetch; const seen = [];
  globalThis.fetch = async u => { seen.push(String(u)); return /generativelanguage/.test(String(u)) ? new Response('{"error":{"status":"PERMISSION_DENIED"}}', { status: 403 }) : new Response(JSON.stringify({ choices: [{ message: { content: 'Groq answer' } }] }), { status: 200, headers: { 'content-type': 'application/json' } }); };
  try {
    assert.equal(await C.askAI('sys', 'hello', 200, { provider: 'gemini' }), 'Groq answer');
    assert.ok(seen.some(u => /groq/.test(u)));
    delete process.env.GROQ_API_KEY;
    await assert.rejects(C.askAI('sys', 'hello', 200, { provider: 'gemini' }), /Google rejected the Gemini API key.*new Gemini key/);
  } finally { globalThis.fetch = real; process.env.GROQ_API_KEY = 'GROQ-KEY'; }
});
