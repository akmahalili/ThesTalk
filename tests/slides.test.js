'use strict';
/* "Slaid Pembentangan": thesis or paper → slide outline with fixed layouts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../lib/slides');
const handler = require('../api/slides');

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

test('slide count follows the length of the talk', () => {
  assert.equal(D.count(5), 7);
  assert.equal(D.count(15), 14);
  assert.equal(D.count(60), 24);
});

test('readSections keeps every section and trims only the long ones', () => {
  const secs = D.readSections([{ name: 'Short', content: 'a b c' }, { name: 'Long', content: 'x'.repeat(50000) }, { name: 'Empty', content: '  ' }], 20000);
  assert.deepEqual(secs.map(s => s.name), ['Short', 'Long']);
  assert.equal(secs[0].content, 'a b c');
  assert.ok(secs[1].content.length < 20100);
});

test('clean fixes layouts the model got wrong and drops empty slides', () => {
  const deck = D.clean({ title: 'T', slides: [
    { layout: 'title', title: 'Imej produk', subtitle: 'Proposal' },
    { layout: 'title', title: 'Latar', subtitle: 'Kenapa imej penting' },
    { layout: 'stats', title: 'Sampel', stats: [{ value: '312', label: 'pembeli' }] },
    { layout: 'framework', title: 'Kerangka', nodes: ['Kualiti imej', 'Kepercayaan', 'Niat beli'], links: [{ from: 'Kualiti imej', to: 'Kepercayaan', label: 'H1' }, { from: 'X', to: 'Niat beli' }] },
    { layout: 'bullets', title: 'Kosong', bullets: [] },
    { layout: 'weird', title: 'Objektif', bullets: ['O1', 'O2'] },
    { layout: 'end', title: 'Terima kasih' }
  ] });
  assert.deepEqual(deck.slides.map(s => s.layout), ['title', 'section', 'bullets', 'framework', 'bullets', 'end']);
  assert.deepEqual(deck.slides[2].bullets, ['312 pembeli']);
  assert.equal(deck.slides[3].links.length, 1);
  assert.equal(D.clean({ slides: [{ layout: 'title', title: 'x' }] }), null);
});

test('POST /api/slides builds a deck from the thesis text', withEnv(env, async () => {
  let sent;
  global.fetch = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return ok({ choices: [{ message: { content: JSON.stringify({ title: 'Peranan imej', subtitle: 'Pembentangan proposal', slides: [
      { layout: 'title', title: 'Peranan imej', subtitle: 'Proposal', notes: 'Salam.' },
      { layout: 'bullets', title: 'Objektif', bullets: ['Kenal pasti', 'Uji'], imageHint: 'Tangkapan skrin Shopee', notes: 'Dua objektif.' },
      { layout: 'end', title: 'Terima kasih', subtitle: 'Soalan?' }
    ] }) } }] });
  };
  const res = response();
  const text = 'Kajian ini meneliti peranan imej produk dalam e-dagang Malaysia. '.repeat(20);
  await handler(req({ title: 'Peranan imej', kind: 'proposal', minutes: 10, language: 'Bahasa Melayu', sections: [{ name: 'Bab 1', content: text }] }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.deck.slides.length, 3);
  assert.equal(res.body.deck.slides[1].imageHint, 'Tangkapan skrin Shopee');
  assert.match(sent.messages[0].content, /Proposal defence/);
  assert.match(sent.messages[0].content, /make 9 slides/);
  assert.match(sent.messages[1].content, /## Bab 1/);
  const short = response();
  await handler(req({ title: 'x', sections: [{ name: 'a', content: 'too short' }] }), short);
  assert.equal(short.statusCode, 400);
}));

test('clean keeps steps and quote slides, and falls back when they are too thin', () => {
  const deck = D.clean({ title: 'T', slides: [
    { layout: 'title', title: 'A' },
    { layout: 'steps', title: 'Prosedur', steps: [{ label: 'Rintis', text: '30 responden' }, { label: 'Kutip data' }, 'Analisis'] },
    { layout: 'steps', title: 'Satu', steps: [{ label: 'Hanya satu' }] },
    { layout: 'quote', quote: 'Imej ialah bukti.', source: 'Bab 1' },
    { layout: 'quote', source: 'kosong' },
    { layout: 'end', title: 'Terima kasih' }
  ] });
  assert.deepEqual(deck.slides.map(s => s.layout), ['title', 'steps', 'bullets', 'quote', 'end']);
  assert.deepEqual(deck.slides[1].steps.map(x => x.label), ['Rintis', 'Kutip data', 'Analisis']);
  assert.match(D.instructions({ language: 'English', kind: 'viva', minutes: 15 }), /at least six different layouts/);
});

test('every slide theme draws every layout without errors', () => {
  const ST = require('../public/slidethemes.js');
  const deck = { title: 'Imej produk', presenter: 'Kema', date: '2026-11-21', kindLabel: 'Proposal', slides: [
    { id: 'a', layout: 'title', title: 'Imej produk', subtitle: 'Proposal' },
    { id: 'b', layout: 'section', title: 'Latar', statement: 'Imej ialah bukti.' },
    { id: 'c', layout: 'bullets', title: 'Masalah', bullets: ['Satu', 'Dua'] },
    { id: 'd', layout: 'stats', title: 'Sampel', stats: [{ value: '312', label: 'pembeli' }, { value: '5', label: 'konstruk' }] },
    { id: 'e', layout: 'framework', title: 'Kerangka', nodes: ['A', 'B', 'C'], links: [{ f: 0, t: 1, label: 'H1' }, { f: 1, t: 2 }] },
    { id: 'f', layout: 'compare', title: 'Jurang', left: { heading: 'Lepas', bullets: ['x'] }, right: { heading: 'Ini', bullets: ['y'] } },
    { id: 'g', layout: 'image', title: 'Contoh', caption: 'Foto' },
    { id: 'h', layout: 'steps', title: 'Prosedur', steps: [{ label: 'Satu', text: 'a' }, { label: 'Dua', text: 'b' }, { label: 'Tiga', text: 'c' }] },
    { id: 'i', layout: 'quote', quote: 'Imej ialah bukti.', source: 'Bab 1' },
    { id: 'j', layout: 'end', title: 'Terima kasih' }
  ] };
  const levels = sl => [[0], [1], [2]].slice(0, sl.nodes.length);
  for (const theme of ST.ORDER) {
    const calls = [];
    const slide = () => { const sl = { addText: (...a) => calls.push(['text', a]), addShape: (...a) => calls.push(['shape', a]), addImage: (...a) => calls.push(['image', a]), addNotes: () => {} }; return sl; };
    const slides = [];
    const pres = { ShapeType: { rect: 'rect', roundRect: 'roundRect', ellipse: 'ellipse', line: 'line' }, addSlide: () => { const s = slide(); slides.push(s); return s; } };
    ST.build(pres, Object.assign({ theme }, deck), { pics: { c: 'data:image/png;base64,AA==' }, refs: [{ apa: 'Hair, J. F. (2019). Title.' }], t: k => k, niceDate: x => x, levels });
    assert.equal(slides.length, 11, theme + ': ten slides plus one references slide');
    assert.ok(calls.some(c => c[0] === 'image'), theme + ': the picture is placed');
    assert.ok(calls.filter(c => c[0] === 'text').every(c => c[1][1] && c[1][1].fontFace), theme + ': every text has a font');
    assert.ok(slides.every(s => s.background && s.background.color), theme + ': every slide has a background');
  }
});
