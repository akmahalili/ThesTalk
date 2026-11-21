'use strict';
/* "Semak Persamaan": word-run matching against cited abstracts, own papers and between chapters; paraphrase guard. */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/similaritycore.js');
const P = require('../lib/similarity');
const handler = require('../handlers/similarity');

const ABS = 'This study examines how product image quality influences consumer trust and purchase intention in online marketplaces across Southeast Asia using survey data from 312 respondents.';

test('compare finds copied wording, but ignores citations, quotations and the reference list', () => {
  const thesis = 'Kajian lepas menunjukkan bahawa this study examines how product image quality influences consumer trust and purchase intention in online marketplaces (Tan, 2021). Ayat lain.\n' +
    'Petikan "product image quality influences consumer trust and purchase intention in online marketplaces across Southeast Asia" adalah dibenarkan.\nRujukan\nTan, A. (2021). This study examines how product image quality influences consumer trust and purchase intention in online marketplaces.';
  const r = C.compare([{ label: '2.1', text: thesis }], [{ title: 'Tan', text: ABS }]);
  assert.equal(r.passages.length, 1);
  assert.equal(r.passages[0].words, 16);
  assert.equal(r.passages[0].match, 'this study examines how product image quality influences consumer trust and purchase intention in online marketplaces');
  assert.match(r.passages[0].sentence.text, /^Kajian lepas menunjukkan bahawa this study/);
  assert.equal(Math.round(r.pct), 64); // 16 of 25 counted words (citation, quotation and reference list excluded)
  assert.deepEqual(r.bySource, [{ i: 0, words: 16 }]);
});

test('short shared phrases (under 8 words) are not reported', () => {
  const r = C.compare([{ label: 'x', text: 'We found that product image quality influences consumer trust strongly here.' }], [{ title: 's', text: ABS }]);
  assert.equal(r.passages.length, 0);
  assert.equal(r.matched, 0);
});

test('repeats between chapters and paraphrase coverage', () => {
  const para = 'Kajian ini meneliti peranan imej produk dalam platform e-dagang di Malaysia dengan menggunakan teori isyarat sebagai asas kepada kerangka kajian.';
  const r = C.compare([{ label: 'Bab 1', text: 'Pengenalan. ' + para }, { label: 'Bab 3', text: 'Seperti dinyatakan, ' + para + ' Seterusnya.' }], []);
  assert.equal(r.repeats.length, 1);
  assert.ok(r.repeats[0].words >= 20);
  assert.equal(r.repeats[0].a.label, 'Bab 1');
  assert.equal(C.coverage('This study examines how product image quality influences consumer trust', ABS), 100);
  assert.equal(C.coverage('Kualiti gambar produk mempengaruhi kepercayaan pengguna', ABS), 0);
});

test('kept() refuses a paraphrase that drops a citation or a number', () => {
  const s = 'Hair et al. (2019) found that 312 respondents trusted clear images (Tan & Lim, 2021).';
  assert.equal(P.kept(s, 'According to Hair et al. (2019), clear images were trusted by 312 respondents (Tan & Lim, 2021).'), true);
  assert.equal(P.kept(s, 'Clear images were trusted by 312 respondents (Tan & Lim, 2021).'), false);
  assert.equal(P.kept(s, 'Hair et al. (2019) found that many respondents trusted clear images (Tan & Lim, 2021).'), false);
});

test('POST /api/similarity fetches abstracts and guards the paraphrase', async () => {
  const saved = { a: process.env.THESTALK_AI_ACCESS_CODE, g: process.env.GEMINI_API_KEY, d: process.env.AI_DISABLED, p: process.env.AI_PROVIDER, f: global.fetch };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g'; delete process.env.AI_DISABLED; delete process.env.AI_PROVIDER;
  const inv = Object.fromEntries([]);
  ABS.split(' ').forEach((w, i) => { (inv[w] = inv[w] || []).push(i); });
  const work = (doi, title) => ({ id: 'W', doi: 'https://doi.org/' + doi, display_name: title, publication_year: 2021, authorships: [], biblio: {}, abstract_inverted_index: inv });
  let reply = '';
  global.fetch = async (url, opts) => {
    const u = decodeURIComponent(String(url));
    if (u.includes('filter=doi:')) return { ok: true, status: 200, json: async () => ({ results: [work('10.1234/abc', 'Images and trust')] }) };
    if (u.includes('title.search:')) return { ok: true, status: 200, json: async () => ({ results: [work('10.5555/xyz', 'Product images and purchase intention online')] }) };
    if (u.includes('generativelanguage')) return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify({ paraphrase: reply }) } }] }) };
    throw new Error('unexpected ' + u);
  };
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.5.5.' + Math.floor(Math.random() * 200) }, body });
  try {
    const r1 = res();
    await handler(req({ mode: 'sources', refs: [{ i: 0, doi: '10.1234/abc', title: 'Images and trust' }, { i: 1, doi: '', title: 'Product images and purchase intention online' }, { i: 2, doi: '', title: 'Short' }] }), r1);
    assert.equal(r1.statusCode, 200, JSON.stringify(r1.body));
    assert.deepEqual(r1.body.sources.map(s => s.i), [0, 1]);
    assert.equal(r1.body.sources[0].abstract, ABS);
    assert.deepEqual(r1.body.missing, [2]);
    reply = 'Menurut Hair et al. (2019), seramai 312 responden lebih mempercayai gambar yang jelas.';
    const r2 = res(); await handler(req({ mode: 'paraphrase', sentence: 'Hair et al. (2019) found that 312 respondents trusted clear images.', language: 'Bahasa Melayu' }), r2);
    assert.equal(r2.statusCode, 200, JSON.stringify(r2.body));
    reply = 'Ramai responden lebih mempercayai gambar yang jelas.';
    const r3 = res(); await handler(req({ mode: 'paraphrase', sentence: 'Hair et al. (2019) found that 312 respondents trusted clear images.', language: 'English' }), r3);
    assert.equal(r3.statusCode, 422);
  } finally {
    global.fetch = saved.f;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.a], ['GEMINI_API_KEY', saved.g], ['AI_DISABLED', saved.d], ['AI_PROVIDER', saved.p]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});
