'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chat = require('../api/chat');
const convert = require('../api/convert');

const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } });
const headers = { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'content-type': 'application/json' };

async function withMock(fn) {
  const oldFetch = globalThis.fetch;
  const saved = { k: process.env.OPENAI_API_KEY, c: process.env.THESTALK_AI_ACCESS_CODE };
  process.env.OPENAI_API_KEY = 'test-not-a-real-key';
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16';
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ output_text: 'OK reply' }) }; };
  try { await fn(calls); } finally {
    globalThis.fetch = oldFetch;
    if (saved.k === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = saved.k;
    if (saved.c === undefined) delete process.env.THESTALK_AI_ACCESS_CODE; else process.env.THESTALK_AI_ACCESS_CODE = saved.c;
  }
}

test('casual chat uses the everyday assistant and never sends the research profile', () => withMock(async calls => {
  const r = response();
  await chat({ method: 'POST', headers, body: { mode: 'casual', message: 'Bagi idea hujung minggu', history: [{ role: 'user', text: 'hai' }, { role: 'assistant', text: 'Hai!' }], project: { title: 'Secret thesis title' } } }, r);
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.reply, 'OK reply');
  assert.match(calls[0].instructions, /friendly everyday assistant/);
  assert.doesNotMatch(JSON.stringify(calls[0].input), /Secret thesis title/);
  assert.equal(calls[0].input.length, 3);
}));

test('academic chat still includes the research profile', () => withMock(async calls => {
  const r = response();
  await chat({ method: 'POST', headers, body: { message: 'Bincangkan gambar produk', project: { title: 'Image communication' } } }, r);
  assert.equal(r.statusCode, 200);
  assert.match(calls[0].instructions, /research thinking partner/);
  assert.match(calls[0].input[0].content, /Image communication/);
}));

test('proofread mode keeps meaning and citations and returns only the corrected text', () => withMock(async calls => {
  const r = response();
  await convert({ method: 'POST', headers, body: { mode: 'proofread', idea: 'Gambar produk penting (Park et al., 2005).' } }, r);
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.academicText, 'OK reply');
  assert.equal(r.body.mode, 'proofread');
  assert.match(calls[0].instructions, /Preserve the meaning, claims, hedging, citations/);
  assert.match(calls[0].input, /Park et al\., 2005/);
}));
