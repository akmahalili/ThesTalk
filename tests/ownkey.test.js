'use strict';
/* Students use their own free Gemini/Groq key: only their key is used, never the owner's. */
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.THESTALK_AI_ACCESS_CODE = 'owner-code-123456';
process.env.GEMINI_API_KEY = 'OWNER-GEMINI-KEY';
process.env.GROQ_API_KEY = 'OWNER-GROQ-KEY';
const C = require('../lib/common');
const router = require('../api/[route].js');

const STUDENT_GEMINI = 'AIza' + 'S'.repeat(35);
const STUDENT_GROQ = 'gsk_' + 'g'.repeat(52);
function call(route, { method = 'POST', headers = {}, body = {}, url } = {}) {
  return new Promise(resolve => {
    const res = { statusCode: 200, headers: {}, chunks: [], headersSent: false, writableEnded: false,
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, write(c) { this.chunks.push(String(c)); }, flushHeaders() {}, on() {},
      end(c) { if (c) this.chunks.push(String(c)); this.writableEnded = true; resolve({ status: this.statusCode, json: JSON.parse(this.chunks.join('') || '{}') }); } };
    router({ method, headers: Object.assign({ host: 'x' }, headers), url: url || '/api/' + route, query: { route }, body }, res);
  });
}
function mockFetch(reply) {
  const seen = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (u, o) => { seen.push({ url: String(u), headers: o && o.headers || {}, body: o && o.body }); return reply(String(u), o); };
  return { seen, restore: () => { globalThis.fetch = real; } };
}
const ok = content => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { 'content-type': 'application/json' } });

test('no code and no key: asked for their own key', async () => {
  const r = await call('convert', { body: { idea: 'x' } });
  assert.equal(r.status, 401);
  assert.equal(r.json.needKey, true);
  assert.match(r.json.error, /own free Gemini key/);
});

test("a student's Gemini key is used for their request, never the owner's", async () => {
  const f = mockFetch(() => ok('Imej produk memainkan peranan penting dalam membina kepercayaan pembeli.'));
  try {
    const r = await call('convert', { headers: { 'x-talkademic-gemini-key': STUDENT_GEMINI }, body: { idea: 'imej produk penting untuk kepercayaan pembeli', project: { language: 'English' } } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const ai = f.seen.filter(x => /generativelanguage|groq/.test(x.url));
    assert.ok(ai.length >= 1);
    for (const x of ai) {
      const auth = JSON.stringify(x.headers);
      assert.ok(auth.includes(STUDENT_GEMINI), 'student key sent to Gemini');
      assert.ok(!auth.includes('OWNER'), 'owner key never used');
    }
  } finally { f.restore(); }
});

test("when the student's Gemini limit is reached, the owner's Groq key is not used", async () => {
  const f = mockFetch(u => /generativelanguage/.test(u) ? new Response('{}', { status: 429 }) : ok('should not be called'));
  try {
    const r = await call('convert', { headers: { 'x-talkademic-gemini-key': STUDENT_GEMINI }, body: { idea: 'imej produk penting' } });
    assert.equal(r.status, 429);
    assert.ok(!f.seen.some(x => /groq/.test(x.url)), 'no Groq call without the student\'s own Groq key');
  } finally { f.restore(); }
});

test('a student with both keys falls back to their own Groq key', async () => {
  const f = mockFetch(u => /generativelanguage/.test(u) ? new Response('{}', { status: 429 }) : ok('Imej produk membina kepercayaan pembeli dalam talian.'));
  try {
    const r = await call('convert', { headers: { 'x-talkademic-gemini-key': STUDENT_GEMINI, 'x-talkademic-groq-key': STUDENT_GROQ }, body: { idea: 'imej produk penting' } });
    assert.equal(r.status, 200);
    const groq = f.seen.find(x => /groq/.test(x.url));
    assert.ok(JSON.stringify(groq.headers).includes(STUDENT_GROQ));
  } finally { f.restore(); }
});

test('the owner code still uses the server keys; a badly formed key is ignored', async () => {
  const f = mockFetch(() => ok('Owner draft text about product images and buyer trust.'));
  try {
    const r = await call('convert', { headers: { 'x-thestalk-access': 'owner-code-123456', 'x-talkademic-gemini-key': STUDENT_GEMINI }, body: { idea: 'imej produk' } });
    assert.equal(r.status, 200);
    assert.ok(JSON.stringify(f.seen[0].headers).includes('OWNER-GEMINI-KEY'));
    const bad = await call('convert', { headers: { 'x-talkademic-gemini-key': 'not-a-key' }, body: { idea: 'x' } });
    assert.equal(bad.status, 401);
  } finally { f.restore(); }
});

test('status: own-key mode, key check, and cloud sync stays with the owner', async () => {
  const f = mockFetch(u => /models/.test(u) ? new Response('{"models":[]}', { status: 200 }) : ok(''));
  try {
    const st = await call('status', { method: 'GET', url: '/api/status?verify=1', headers: { 'x-talkademic-gemini-key': STUDENT_GEMINI } });
    assert.equal(st.json.aiEnabled, true);
    assert.equal(st.json.mode, 'own-key');
    assert.deepEqual(st.json.keyCheck, { gemini: 'ok' });
    assert.deepEqual([st.json.providers.gemini, st.json.providers.groq], [true, false]);
    assert.equal(st.json.defaultProvider, 'gemini');
    assert.ok(JSON.stringify(f.seen[0].headers).includes(STUDENT_GEMINI));
    const none = await call('status', { method: 'GET' });
    assert.equal(none.json.aiEnabled, false);
    const sync = await call('sync', { headers: { 'x-talkademic-gemini-key': STUDENT_GEMINI }, body: { op: 'status', id: 'x' } });
    assert.equal(sync.status, 403);
    assert.equal(sync.json.ownerOnly, true);
  } finally { f.restore(); }
});
