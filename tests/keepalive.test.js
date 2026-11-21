'use strict';
/* Kept-alive AI responses: a slow answer starts as 200 with spaces, the real status goes into _status. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { keepAlive } = require('../lib/keepalive');
const { json } = require('../lib/common');

function serve(handler) {
  const srv = http.createServer(async (req, res) => { const stop = keepAlive(req, res, { start: 60, every: 40 }); try { await handler(req, res); } finally { stop(); } });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function call(srv, headers) {
  const r = await fetch('http://127.0.0.1:' + srv.address().port + '/api/x', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: '{}' });
  return { status: r.status, raw: await r.text() };
}

test('slow answer: 200 with leading spaces, body unchanged', async () => {
  const srv = await serve(async (req, res) => { await wait(250); json(res, 200, { text: 'ok' }); });
  const r = await call(srv, { 'X-Talkademic-Wait': '1' });
  srv.close();
  assert.equal(r.status, 200);
  assert.match(r.raw, /^ {2,}\{/);
  assert.deepEqual(JSON.parse(r.raw), { text: 'ok' });
});

test('slow error: real status goes into _status', async () => {
  const srv = await serve(async (req, res) => { await wait(200); json(res, 429, { error: 'Free AI limit reached.' }); });
  const r = await call(srv, { 'X-Talkademic-Wait': '1' });
  srv.close();
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.raw), { error: 'Free AI limit reached.', _status: 429 });
});

test('quick answers and old clients keep their normal status', async () => {
  const quick = await serve(async (req, res) => json(res, 401, { error: 'Invalid AI access code.' }));
  const a = await call(quick, { 'X-Talkademic-Wait': '1' });
  quick.close();
  assert.deepEqual([a.status, JSON.parse(a.raw)], [401, { error: 'Invalid AI access code.' }]);
  const slow = await serve(async (req, res) => { await wait(200); json(res, 502, { error: 'x' }); });
  const b = await call(slow);
  slow.close();
  assert.deepEqual([b.status, JSON.parse(b.raw)], [502, { error: 'x' }]);
});

test('the router keeps every route and adds ping', () => {
  const R = require('../api/[route].js');
  for (const n of ['analysis', 'survey', 'viva', 'ping', 'status']) assert.ok(R.ROUTES.includes(n), n);
});
