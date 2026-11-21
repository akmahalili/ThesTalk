'use strict';
/* "Kerangka Konseptual": constructs and paths → hypotheses, SVG figure, thesis text, slide, AI suggestion, Word figure. */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/frameworkcore.js');
const F = require('../lib/framework');
const handler = require('../handlers/framework');

const FW = { theory: 'Signalling Theory (Spence, 1973)', mediation: true, constructs: [
  { id: 'a', name: 'Kualiti imej', role: 'iv', items: ['Resolusi', 'Pencahayaan'] },
  { id: 'b', name: 'Bilangan sudut', role: 'iv' },
  { id: 'm', name: 'Kepercayaan', role: 'med' },
  { id: 'z', name: 'Pengalaman', role: 'mod' },
  { id: 'y', name: 'Niat pembelian', role: 'dv' },
  { id: 'k', name: 'Umur', role: 'ctrl' },
  { id: 'e', name: '', role: 'iv' }],
  paths: [{ id: 'p1', from: 'a', to: 'm' }, { id: 'p2', from: 'b', to: 'm', sign: '-' }, { id: 'p3', from: 'm', to: 'y' }, { id: 'p4', from: 'a', to: 'y' },
    { id: 'bad', from: 'a', to: 'a' }, { id: 'dup', from: 'a', to: 'm' }, { id: 'ghost', from: 'a', to: 'nope' }, { id: 'empty', from: 'e', to: 'y' }],
  mods: [{ id: 'q', by: 'z', path: 'p3' }, { id: 'q2', by: 'y', path: 'p3' }, { id: 'q3', by: 'z', path: 'missing' }] };

test('normalize drops self, duplicate, unknown and unnamed paths and bad moderations', () => {
  const f = C.normalize(FW);
  assert.deepEqual(f.paths.map(p => p.id), ['p1', 'p2', 'p3', 'p4']);
  assert.deepEqual(f.mods.map(m => m.id), ['q']);
  assert.equal(f.paths[1].sign, '-');
});

test('hypotheses: direct paths, then mediation, then moderation, in Malay and English', () => {
  const ms = C.hypotheses(FW, 'ms');
  assert.deepEqual(ms.map(h => h.tag + ' ' + h.kind), ['H1 direct', 'H2 direct', 'H3 direct', 'H4 direct', 'H5 mediation', 'H6 mediation', 'H7 moderation']);
  assert.equal(ms[1].text, 'Bilangan sudut mempunyai pengaruh negatif yang signifikan terhadap Kepercayaan.');
  assert.equal(ms[4].text, 'Kepercayaan menjadi pengantara hubungan antara Kualiti imej dan Niat pembelian.');
  assert.equal(ms[6].text, 'Pengalaman menyederhanakan hubungan antara Kepercayaan dan Niat pembelian.');
  const en = C.hypotheses({ ...FW, mediation: false }, 'en');
  assert.equal(en.length, 5);
  assert.equal(en[0].text, 'Kualiti imej has a significant positive effect on Kepercayaan.');
  assert.equal(en[4].text, 'Pengalaman moderates the relationship between Kepercayaan and Niat pembelian.');
});

test('svg draws every named construct, the H labels and the theory, and grows to fit bends', () => {
  const out = C.svg(FW, { style: 'thesis', lang: 'ms' });
  assert.ok(out.width === 1000 && out.height > 300);
  for (const name of ['Kualiti imej', 'Kepercayaan', 'Niat pembelian', 'Umur', '• Resolusi', 'H1', 'H2 (−)', 'H7', 'Teori asas: Signalling Theory (Spence, 1973)']) assert.ok(out.svg.includes('>' + name + '<'), name);
  assert.equal((out.svg.match(/<rect /g) || []).length, 1 + 6 + 5); // background, six boxes, labels H1–H4 and H7
  const simple = C.svg({ constructs: [{ id: 'x', name: 'X', role: 'iv' }, { id: 'm', name: 'M', role: 'med' }, { id: 'y', name: 'Y', role: 'dv' }], paths: [{ from: 'x', to: 'm' }, { from: 'm', to: 'y' }, { from: 'x', to: 'y' }] }, { lang: 'en' });
  assert.match(simple.svg, / Q/); // X → Y bends round M
  assert.ok(simple.height > 90);
  assert.equal(C.svg({ constructs: [] }).empty, true);
  assert.ok(C.svg(FW, { style: 'colour' }).svg.includes('#fff2dc'));
});

test('thesis text and slide version', () => {
  const txt = C.thesisText(FW, 'ms', '2.3');
  const lines = txt.split('\n');
  assert.ok(C.FIGURE_LINE.test(lines[0]));
  assert.equal(lines[1], 'Rajah 2.3: Kerangka konseptual kajian berdasarkan Signalling Theory (Spence, 1973)');
  assert.ok(lines.includes('H5: Kepercayaan menjadi pengantara hubungan antara Kualiti imej dan Niat pembelian.'));
  assert.ok(C.FIGURE_LINE.test('[Figure: Conceptual Framework]') && !C.FIGURE_LINE.test('Lihat [Rajah: Kerangka Konseptual] di atas'));
  const sl = C.forSlide(FW);
  assert.deepEqual(sl.nodes, ['Kualiti imej', 'Bilangan sudut', 'Kepercayaan', 'Pengalaman', 'Niat pembelian']);
  assert.deepEqual(sl.links.map(l => sl.nodes[l.f] + '>' + sl.nodes[l.t] + ' ' + l.label), ['Kualiti imej>Kepercayaan H1', 'Bilangan sudut>Kepercayaan H2', 'Kepercayaan>Niat pembelian H3', 'Kualiti imej>Niat pembelian H4', 'Pengalaman>Niat pembelian H7']);
});

test('clean keeps the AI framework only where it is consistent', () => {
  const f = F.clean({ theory: 'TAM', constructs: [{ name: 'Imej', role: 'iv', items: ['A', ''] }, { name: 'Trust', role: 'xx' }, { name: 'Niat', role: 'dv' }, { name: 'imej', role: 'dv' }, { name: 'Usia', role: 'iv' }],
    paths: [{ from: 'Imej', to: 'Niat' }, { from: 'Imej', to: 'Niat' }, { from: 'Imej', to: 'Ghost' }, { from: 'Trust', to: 'Niat', sign: '-' }],
    mods: [{ by: 'Usia', from: 'Imej', to: 'Niat' }, { by: 'Usia', from: 'Trust', to: 'Imej' }] });
  assert.deepEqual(f.constructs.map(c => c.name + ':' + c.role), ['Imej:iv', 'Trust:iv', 'Niat:dv', 'Usia:mod']);
  assert.deepEqual(f.constructs[0].items, ['A']);
  assert.deepEqual(f.paths.map(p => p.from + '>' + p.to + p.sign), ['c1>c3+', 'c2>c3-']);
  assert.deepEqual(f.mods, [{ id: 'm1', by: 'c4', path: 'p1' }]);
  assert.equal(F.clean({ constructs: [{ name: 'Only' }] }), null);
});

test('POST /api/framework reads the objectives and returns a clean framework', async () => {
  const saved = { a: process.env.THESTALK_AI_ACCESS_CODE, g: process.env.GEMINI_API_KEY, d: process.env.AI_DISABLED, p: process.env.AI_PROVIDER, f: global.fetch };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g'; delete process.env.AI_DISABLED; delete process.env.AI_PROVIDER;
  let sent;
  global.fetch = async (url, opts) => { sent = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify({ theory: '', constructs: [{ name: 'Kualiti imej', role: 'iv' }, { name: 'Niat pembelian', role: 'dv' }], paths: [{ from: 'Kualiti imej', to: 'Niat pembelian', sign: '+' }], mods: [], note: '' }) } }] }) }; };
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.2.2.' + Math.floor(Math.random() * 200) }, body });
  try {
    const r = res();
    await handler(req({ title: 'Imej produk', objectives: 'Mengenal pasti pengaruh kualiti imej produk terhadap niat pembelian pengguna e-dagang di Malaysia. '.repeat(4), language: 'Bahasa Melayu', sections: [] }), r);
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.framework.constructs.map(c => c.name), ['Kualiti imej', 'Niat pembelian']);
    assert.equal(r.body.framework.paths.length, 1);
    assert.match(sent.messages[0].content, /Write construct names in Bahasa Melayu/);
    assert.match(sent.messages[1].content, /Objectives:/);
    const short = res();
    await handler(req({ title: 'x', objectives: 'terlalu pendek', sections: [] }), short);
    assert.equal(short.statusCode, 400);
  } finally {
    global.fetch = saved.f;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.a], ['GEMINI_API_KEY', saved.g], ['AI_DISABLED', saved.d], ['AI_PROVIDER', saved.p]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});

test('the Word export draws the figure where the marker line stands', async () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../public/docx.js'), 'utf8');
  const win = {};
  new Function('window', src)(win);
  class FakeBlob { constructor(parts) { this.parts = parts; } }
  global.Blob = global.Blob || FakeBlob;
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const state = { project: { title: 'T', language: 'Bahasa Melayu' }, chapters: [{ title: 'Bab 2', sections: [{ title: '2.5 Kerangka', content: '[Rajah: Kerangka Konseptual]\nRajah 2.1: Kerangka konseptual kajian' }] }], references: [] };
  const blob = win.ThesTalkDocx.makeDocument(state, { figures: { framework: { bytes: png, width: 1000, height: 500 } } });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = Buffer.from(bytes).toString('latin1');
  assert.match(text, /word\/media\/kerangka\.png/);
  assert.match(text, /<wp:extent cx="5600000" cy="2800000"\/>/);
  assert.match(text, /r:embed="rIdFw"/);
  assert.match(text, /Rajah 2\.1: Kerangka konseptual kajian/);
  assert.ok(!text.includes('[Rajah: Kerangka Konseptual]'));
  const plain = Buffer.from(new Uint8Array(await win.ThesTalkDocx.makeDocument(state).arrayBuffer())).toString('latin1');
  assert.ok(plain.includes('[Rajah: Kerangka Konseptual]') && !plain.includes('kerangka.png'));
});

test('one /api function routes every name to its handler (Hobby plan: at most 12 functions)', async () => {
  const fs = require('fs'), path = require('path');
  const apiFiles = fs.readdirSync(path.join(__dirname, '../api')).filter(f => f.endsWith('.js'));
  assert.ok(apiFiles.length <= 12, apiFiles.join(', '));
  const router = require('../api/[route].js');
  const handlers = fs.readdirSync(path.join(__dirname, '../handlers')).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, '')).sort();
  assert.deepEqual(router.ROUTES.slice().sort(), handlers);
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const r404 = res();
  await router({ method: 'GET', url: '/api/nope', query: {}, headers: {} }, r404);
  assert.equal(r404.statusCode, 404);
  const r1 = res();
  await router({ method: 'GET', url: '/api/status?x=1', query: { route: 'status' }, headers: { host: 'localhost' } }, r1);
  assert.equal(r1.statusCode, 200);
  const r2 = res();
  await router({ method: 'GET', url: '/api/status', headers: { host: 'localhost' } }, r2);
  assert.equal(r2.statusCode, 200);
  assert.ok('providers' in r2.body || 'ai' in r2.body || Object.keys(r2.body).length);
});
