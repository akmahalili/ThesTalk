'use strict';
/* "Analisis Soal Selidik": questionnaire CSV → profile, Cronbach's alpha, descriptives, normality, correlations, write-up. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const V = require('../public/surveycore.js');
const L = require('../lib/survey');
const handler = require('../handlers/survey');

const CSV = fs.readFileSync(path.join(__dirname, 'fixtures/survey.csv'), 'utf8');
const close = (a, b, eps) => assert.ok(Math.abs(a - b) < (eps || 1e-6), a + ' vs ' + b);

test('parseCSV handles BOM, quotes, doubled quotes, line breaks in cells and semicolons', () => {
  const t = V.parseCSV('﻿Nama;Komen;Skor\r\nAli;"Bagus; ""sangat""\nbaik";5\r\n\r\nAbu;;4\n');
  assert.deepEqual(t.headers, ['Nama', 'Komen', 'Skor']);
  assert.deepEqual(t.rows, [['Ali', 'Bagus; "sangat"\nbaik', '5'], ['Abu', '', '4']]);
  assert.equal(V.detectDelimiter('a\tb\tc\n1\t2\t3'), '\t');
});

test('likertValue reads numbers and Malay/English labels, 5- and 7-point', () => {
  assert.equal(V.likertValue('4'), 4);
  assert.equal(V.likertValue('5 - Sangat setuju'), 5);
  assert.equal(V.likertValue('Sangat Tidak Setuju'), 1);
  assert.equal(V.likertValue('Tidak pasti'), 3);
  assert.equal(V.likertValue('Strongly agree'), 5);
  assert.equal(V.likertValue('Agree', true), 6);
  assert.equal(V.likertValue('Somewhat disagree', true), 3);
  assert.ok(Number.isNaN(V.likertValue('Shopee')));
});

test('classify sorts Google Forms columns and groups grid items into constructs', () => {
  const t = V.parseCSV(CSV);
  const cols = V.classify(t);
  const types = Object.fromEntries(cols.map(c => [c.header, c.type]));
  assert.equal(types['Timestamp'], 'skip');
  assert.equal(types['Alamat e-mel'], 'skip');
  assert.equal(types['Jantina'], 'demo');
  assert.equal(types['Umur'], 'number');
  assert.equal(types['Komen'], 'text');
  assert.equal(types['Kualiti imej [Gambar jelas]'], 'item');
  assert.equal(types['NB3 (R)'], 'item');
  const cons = V.defaultConstructs(cols);
  assert.deepEqual(cons.map(c => c.name), ['Kualiti imej', 'KP', 'NB']);
  assert.equal(cols.find(c => c.header === 'Kualiti imej [Latar bersih]').label, 'Latar bersih');
});

test('analyse matches SciPy/NumPy reference values', () => {
  const t = V.parseCSV(CSV);
  const cols = V.classify(t), cons = V.defaultConstructs(cols);
  cols.find(c => c.header === 'NB3 (R)').reverse = true;
  const r = V.analyse(t, cols, cons);
  assert.equal(r.N, 120); assert.equal(r.scale, 5);
  // Reference values computed with numpy (alpha, corrected item-total r, alpha if deleted) and scipy.stats (pearsonr).
  close(r.constructs[0].alpha, 0.876953); close(r.constructs[1].alpha, 0.775486); close(r.constructs[2].alpha, 0.685057);
  close(r.constructs[1].items[1].citc, 0.572906); close(r.constructs[2].items[0].alphaIfDeleted, 0.600125);
  close(r.corr[0][1].r, 0.781596); close(r.corr[1][2].p, 4.7065e-13, 1e-16);
  assert.equal(r.constructs[0].level, 'moderate');
  const jantina = r.demos.find(d => d.header === 'Jantina');
  assert.deepEqual(jantina.cats.map(c => c.label + ' ' + c.n), ['Perempuan 79', 'Lelaki 41']);
  // p of r for a small sample (scipy: 0.39969146875)
  close(V.stats.pOfR(0.3, 10), 0.39969146875, 1e-9);
  close(V.stats.skewness([1, 2, 2, 3, 5, 5, 5]), -0.0519408, 1e-6); // scipy.stats.skew(bias=False)
});

test('tables and the write-up use only the computed numbers', () => {
  const t = V.parseCSV(CSV);
  const cols = V.classify(t), cons = V.defaultConstructs(cols);
  const r = V.analyse(t, cols, cons);
  const tabs = V.tables(r, 'ms');
  assert.deepEqual(tabs.map(x => x.id), ['demo', 'demo', 'num', 'rel', 'itemrel', 'desc', 'items', 'corr']);
  assert.deepEqual(tabs.find(x => x.id === 'rel').rows[1], ['Kualiti imej', '3', '120', '0.877', 'baik']);
  const ms = V.writeUp(r, 'ms');
  assert.match(ms, /Seramai 120 responden/);
  assert.match(ms, /majoriti responden ialah Perempuan \(79, 65\.8%\)/);
  assert.match(ms, /Kualiti imej \(3 item\) mencatat α = 0\.877/);
  assert.match(ms, /r\(118\) = \.78, p < \.001/);
  assert.match(ms, /\[PERLU RUJUKAN\]/);
  const en = V.writeUp(r, 'en');
  assert.match(en, /A total of 120 respondents/);
  assert.match(en, /\[SOURCE NEEDED\]/);
});

test('numbersKept refuses an AI rewrite that changes, drops or adds a number', () => {
  const a = 'Alfa ialah 0.877 dan r(118) = .78, p < .001, iaitu 65.8%.';
  assert.equal(L.numbersKept(a, 'Nilai alfa 0.877; r(118) = .78, p < .001 (65.8%).').ok, true);
  assert.deepEqual(L.numbersKept(a, 'Alfa ialah 0.88 dan r(118) = .78, p < .001, iaitu 65.8%.').lost, ['0.877']);
  assert.deepEqual(L.numbersKept(a, a + ' Sebanyak 3 item.').added, ['3']);
});

test('POST /api/survey keeps the polish only when every number survives', async () => {
  const saved = { a: process.env.THESTALK_AI_ACCESS_CODE, g: process.env.GEMINI_API_KEY, d: process.env.AI_DISABLED, p: process.env.AI_PROVIDER, f: global.fetch };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g'; delete process.env.AI_DISABLED; delete process.env.AI_PROVIDER;
  const text = 'Analisis Kebolehpercayaan\n\nKebolehpercayaan diuji menggunakan alfa Cronbach. Kualiti imej (3 item) mencatat α = 0.877, iaitu baik, manakala KP mencatat α = 0.775 [PERLU RUJUKAN]. Semua konstruk melepasi nilai 0.70 yang biasanya disyorkan untuk kajian sains sosial.';
  let reply = '';
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: reply } }] }) });
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.3.3.' + Math.floor(Math.random() * 200) }, body });
  try {
    reply = text.replace('Kebolehpercayaan diuji', 'Kebolehpercayaan ketekalan dalaman telah diuji');
    const ok = res(); await handler(req({ text, language: 'Bahasa Melayu' }), ok);
    assert.equal(ok.statusCode, 200, JSON.stringify(ok.body));
    assert.match(ok.body.text, /telah diuji/);
    reply = text.replace('0.877', '0.88');
    const bad = res(); await handler(req({ text, language: 'Bahasa Melayu' }), bad);
    assert.equal(bad.statusCode, 422);
    assert.deepEqual(bad.body.lost, ['0.877']);
    reply = text.replace(' [PERLU RUJUKAN]', '');
    const noMark = res(); await handler(req({ text, language: 'Bahasa Melayu' }), noMark);
    assert.equal(noMark.statusCode, 422);
  } finally {
    global.fetch = saved.f;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.a], ['GEMINI_API_KEY', saved.g], ['AI_DISABLED', saved.d], ['AI_PROVIDER', saved.p]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});
