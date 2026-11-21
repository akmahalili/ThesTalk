'use strict';
/* Sync: only encrypted blobs, newest version wins, conflicts are refused, three versions kept. */
const test = require('node:test');
const assert = require('node:assert/strict');
const Y = require('../lib/sync');
const handler = require('../api/sync');

function memStore() {
  const files = new Map();
  return {
    files,
    async list(prefix) { return [...files.keys()].filter(k => k.startsWith(prefix)).map(k => ({ pathname: k, size: files.get(k).length })); },
    async put(p, text) { files.set(p, text); },
    async read(p) { return files.get(p); },
    async del(paths) { paths.forEach(p => files.delete(p)); }
  };
}
const ID = 'a'.repeat(64);
const DATA = 'VEtTMQ' + 'A'.repeat(100);

test('push, status and pull round-trip the newest version', async () => {
  const s = memStore();
  assert.deepEqual(await Y.status(s, ID), { at: null });
  const one = await Y.push(s, ID, { data: DATA, base: null, device: 'Android' }, 1795241900000);
  assert.equal(one.at, new Date(1795241900000).toISOString());
  assert.equal(one.device, 'android');
  const st = await Y.status(s, ID);
  assert.equal(st.at, one.at);
  const p = await Y.pull(s, ID);
  assert.equal(p.data, DATA);
  assert.equal(await Y.pull(s, 'b'.repeat(64)), null);
});

test('a push based on an old version is refused unless forced', async () => {
  const s = memStore();
  const one = await Y.push(s, ID, { data: DATA, base: null, device: 'android' }, 1000000000000);
  const two = await Y.push(s, ID, { data: DATA + 'B', base: one.at, device: 'windows' }, 1000000005000);
  const stale = await Y.push(s, ID, { data: DATA + 'C', base: one.at, device: 'android' }, 1000000009000);
  assert.deepEqual(stale, { conflict: true, at: two.at, device: 'windows' });
  const forced = await Y.push(s, ID, { data: DATA + 'C', base: one.at, device: 'android', force: true }, 1000000009000);
  assert.equal((await Y.pull(s, ID)).data, DATA + 'C');
  assert.equal(forced.device, 'android');
  // Only the three newest versions are kept.
  await Y.push(s, ID, { data: DATA, base: forced.at, device: 'mac' }, 1000000012000);
  assert.equal(s.files.size, 3);
});

test('clock skew never makes a new version look older', async () => {
  const s = memStore();
  const one = await Y.push(s, ID, { data: DATA, base: null, device: 'a' }, 2000000000000);
  const two = await Y.push(s, ID, { data: DATA, base: one.at, device: 'b' }, 1999999999000);
  assert.ok(new Date(two.at) > new Date(one.at));
});

test('bad data, oversized data and bad ids are rejected', async () => {
  const s = memStore();
  await assert.rejects(Y.push(s, ID, { data: 'not base64!', device: 'x' }), /not valid/);
  await assert.rejects(Y.push(s, ID, { data: 'A'.repeat(Y.MAX_DATA + 4), device: 'x' }), /too large/);
  assert.equal(Y.validId('../etc'), false);
  assert.equal(Y.parsePath('sync/' + ID + '/1795241900000-windows.json').device, 'windows');
  assert.equal(Y.parsePath('sync/x/1-a.json'), null);
});

test('POST /api/sync works through the handler and reports conflicts as 409', async () => {
  const saved = { code: process.env.THESTALK_AI_ACCESS_CODE, gem: process.env.GEMINI_API_KEY, tok: process.env.BLOB_READ_WRITE_TOKEN };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g'; delete process.env.BLOB_READ_WRITE_TOKEN;
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.0.0.' + Math.random() }, body });
  try {
    const off = res(); await handler(req({ op: 'status', id: ID }), off);
    assert.equal(off.statusCode, 503);
    handler.store = memStore();
    const a = res(); await handler(req({ op: 'push', id: ID, data: DATA, device: 'android' }), a);
    assert.equal(a.statusCode, 200);
    const b = res(); await handler(req({ op: 'push', id: ID, data: DATA, base: null, device: 'windows' }), b);
    assert.equal(b.statusCode, 409);
    assert.equal(b.body.device, 'android');
    const c = res(); await handler(req({ op: 'pull', id: ID }), c);
    assert.equal(c.body.data, DATA);
    const d = res(); await handler(req({ op: 'pull', id: 'c'.repeat(64) }), d);
    assert.equal(d.statusCode, 404);
    const e = res(); await handler(req({ op: 'status', id: 'nope' }), e);
    assert.equal(e.statusCode, 400);
  } finally {
    delete handler.store;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.code], ['GEMINI_API_KEY', saved.gem], ['BLOB_READ_WRITE_TOKEN', saved.tok]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});
