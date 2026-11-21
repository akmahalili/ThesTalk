'use strict';
/* "Analisis Data": SmartPLS / SPSS output → checks, table and an APA Results write-up. */
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../lib/analysis');
const handler = require('../api/analysis');

const ENV = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'AI_DISABLED', 'AI_PROVIDER', 'THESTALK_AI_ACCESS_CODE'];
function withEnv(env, fn) {
  return async () => {
    const saved = Object.fromEntries(ENV.map(k => [k, process.env[k]]));
    ENV.forEach(k => delete process.env[k]);
    Object.assign(process.env, env);
    const realFetch = global.fetch;
    try { await fn(); } finally {
      global.fetch = realFetch;
      ENV.forEach(k => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
    }
  };
}
const ok = body => ({ ok: true, status: 200, json: async () => body });
const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost' }, body });
const env = { GEMINI_API_KEY: 'g-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' };
const OUTPUT = 'Construct reliability and validity\n\tCronbach alpha\tComposite reliability (rho_c)\tAVE\nIQ\t0.871\t0.906\t0.659\nTR\t0.842\t0.889\t0.617\nPath coefficients\nIQ -> TR\t0.512\tT 9.81\tP 0.000';

test('every method reference has the details needed for APA 7', () => {
  assert.ok(A.METHOD_REFS.length >= 10);
  A.METHOD_REFS.forEach((r, i) => {
    assert.ok(r.authors.length && r.year && r.title, 'ref ' + (i + 1));
    if (r.volume) assert.match(r.doi, /^10\./, 'journal ref ' + (i + 1) + ' needs a DOI');
  });
  const henseler = A.METHOD_REFS.find(r => /discriminant validity in variance/i.test(r.title));
  assert.equal(henseler.doi, '10.1007/s11747-014-0403-8');
});

test('clean keeps known statuses, caps tables and drops empty answers', () => {
  assert.equal(A.clean({}), null);
  const out = A.clean({ summary: 'ok', checks: [{ item: 'AVE IQ', value: '0.659', threshold: '≥ 0.50', status: 'PASS' }, { item: 'x', status: 'weird' }, { value: 'no item' }],
    table: { title: 'T', columns: ['A', 'B'], rows: [['1', '2', '3'], 'bad'] } });
  assert.deepEqual(out.checks.map(c => c.status), ['pass', 'check']);
  assert.deepEqual(out.table.rows, [['1', '2']]);
  assert.equal(A.clean({ summary: 's', table: { rows: [['1']] } }).table, null);
});

test('the prompt asks for APA p values and numbered method citations', () => {
  const p = A.instructions('Bahasa Melayu', 'ms');
  assert.match(p, /p < \.001/);
  assert.match(p, /Bahasa Melayu/);
  assert.match(A.input({ output: OUTPUT, kind: 'measurement', hypotheses: 'H1: IQ -> TR', title: 'Imej produk' }), /OUTPUT START[\s\S]*IQ -> TR[\s\S]*OUTPUT END/);
});

test('POST /api/analysis renders method citations as APA and tidies the numbers', withEnv(env, async () => {
  let sent;
  global.fetch = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return ok({ choices: [{ message: { content: JSON.stringify({
      analysis: 'PLS-SEM measurement and structural model', software: 'SmartPLS 4',
      summary: 'Semua konstruk boleh dipercayai [1] dan H1 disokong [2].',
      checks: [{ item: 'AVE TR', value: '0.617', threshold: '≥ 0.50 [1]', status: 'pass' }],
      table: { title: 'Jadual 1', columns: ['Konstruk', 'α', 'CR', 'AVE'], rows: [['IQ', '0.871', '0.906', '0.659']] },
      writeup: 'Kebolehpercayaan komposit melebihi 0.70 [1]. Kesahan diskriminan dinilai menggunakan HTMT [2]. Laluan IQ → TR adalah signifikan (β = 0.512, t = 9.81, p = .000) {1}.',
      warnings: ['Laporkan juga f² [1].']
    }) } }] });
  };
  const res = response();
  await handler(req({ output: OUTPUT, kind: 'auto', language: 'Bahasa Melayu', uiLang: 'ms', hypotheses: 'H1', title: 'Imej produk' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const r = res.body.result;
  assert.match(r.writeup, /\(Hair et al\., 2019\)/);
  assert.match(r.writeup, /\(Henseler et al\., 2015\)/);
  assert.match(r.writeup, /p < \.001/);
  assert.doesNotMatch(r.writeup, /\[\d\]|p = \.000/);
  assert.equal(r.summary, 'Semua konstruk boleh dipercayai dan H1 disokong.');
  assert.equal(r.checks[0].threshold, '≥ 0.50');
  assert.equal(r.warnings[0], 'Laporkan juga f².');
  assert.equal(res.body.references.length, 2);
  assert.ok(res.body.references.every(x => x.apa && x.doi));
  assert.equal(sent.response_format.type, 'json_object');
  assert.match(sent.messages[1].content, /IQ -> TR/);
}));

test('POST /api/analysis refuses empty output and needs the access code', withEnv(env, async () => {
  const empty = response();
  await handler(req({ output: '   ' }), empty);
  assert.equal(empty.statusCode, 400);
  const noCode = response();
  await handler({ method: 'POST', headers: { host: 'localhost', origin: 'https://localhost' }, body: { output: OUTPUT } }, noCode);
  assert.equal(noCode.statusCode, 401);
}));
