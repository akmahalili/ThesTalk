'use strict';
/* "Latihan Viva": questions grounded in the thesis, feedback on each answer. */
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../lib/viva');
const handler = require('../handlers/viva');

test('cleanQuestions keeps known areas, trims and drops empty questions', () => {
  const q = V.cleanQuestions({ questions: [
    { area: 'method', q: 'Mengapa anda memilih PLS-SEM dan bukan CB-SEM untuk kajian ini?', why: 'Justifikasi kaedah', points: ['Model ramalan', 'Saiz sampel 312', '', 'Data tidak normal (not in the document)'], source: 'Bab 3' },
    { area: 'weird', q: 'Apakah sumbangan utama kajian anda kepada teori isyarat?', points: [] },
    { area: 'method', q: 'Hah?' }] }, 5);
  assert.equal(q.length, 2);
  assert.deepEqual(q[0].points, ['Model ramalan', 'Saiz sampel 312', 'Data tidak normal (not in the document)']);
  assert.equal(q[1].area, 'general');
});

test('cleanFeedback bounds the score and lists', () => {
  assert.equal(V.cleanFeedback({ score: 9, verdict: 'x', strengths: ['a', 'b', 'c', 'd'] }).score, 5);
  assert.equal(V.cleanFeedback({ score: 2.4 }).score, 2);
  assert.equal(V.cleanFeedback({ score: 'none' }), null);
  assert.equal(V.cleanFeedback({ score: 4, strengths: ['a', 'b', 'c', 'd'] }).strengths.length, 3);
});

test('POST /api/viva writes questions from the thesis and assesses an answer', async () => {
  const saved = { a: process.env.THESTALK_AI_ACCESS_CODE, g: process.env.GEMINI_API_KEY, d: process.env.AI_DISABLED, p: process.env.AI_PROVIDER, f: global.fetch };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g'; delete process.env.AI_DISABLED; delete process.env.AI_PROVIDER;
  const sent = [];
  let reply;
  global.fetch = async (url, opts) => { sent.push(JSON.parse(opts.body)); return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }) }; };
  const res = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } });
  const req = body => ({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.4.4.' + Math.floor(Math.random() * 200) }, body });
  try {
    reply = { questions: [{ area: 'contribution', q: 'Boleh ringkaskan sumbangan utama kajian anda?', why: 'Kefahaman keseluruhan', points: ['Konteks Malaysia', 'Teori isyarat'], source: 'Bab 1' }, { area: 'sampling', q: 'Bagaimana anda menentukan saiz sampel 312 orang?', why: 'Justifikasi sampel', points: ['G*Power'], source: 'Bab 3' }] };
    const text = 'Kajian ini meneliti peranan imej produk dalam platform e-dagang Malaysia menggunakan teori isyarat. '.repeat(15);
    const r1 = res(); await handler(req({ mode: 'questions', title: 'Imej', kind: 'proposal', style: 'tough', count: 3, language: 'Bahasa Melayu', sections: [{ name: 'Bab 1', content: text }] }), r1);
    assert.equal(r1.statusCode, 200, JSON.stringify(r1.body));
    assert.equal(r1.body.questions.length, 2);
    assert.match(sent[0].messages[0].content, /rigorous external examiner/);
    assert.match(sent[0].messages[0].content, /proposal defence/);
    assert.match(sent[0].messages[0].content, /write 3 questions in Bahasa Melayu/);
    reply = { score: 3, verdict: 'Jawapan memadai.', strengths: ['Jelas'], missing: ['Sebut G*Power'], better: 'Saya menggunakan G*Power…', followUp: 'Apakah saiz kesan yang anda gunakan?' };
    const r2 = res(); await handler(req({ mode: 'feedback', kind: 'proposal', style: 'tough', language: 'Bahasa Melayu', question: 'Bagaimana anda menentukan saiz sampel?', points: ['G*Power'], answer: 'Saya guna jadual Krejcie dan Morgan untuk populasi besar.', excerpt: text }), r2);
    assert.equal(r2.statusCode, 200, JSON.stringify(r2.body));
    assert.equal(r2.body.feedback.score, 3);
    assert.match(sent[1].messages[1].content, /CANDIDATE ANSWER START\nSaya guna jadual Krejcie/);
    const r3 = res(); await handler(req({ mode: 'feedback', question: 'Q?', answer: 'ya' }), r3);
    assert.equal(r3.statusCode, 400);
    const r4 = res(); await handler(req({ mode: 'questions', sections: [{ name: 'a', content: 'pendek' }] }), r4);
    assert.equal(r4.statusCode, 400);
  } finally {
    global.fetch = saved.f;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.a], ['GEMINI_API_KEY', saved.g], ['AI_DISABLED', saved.d], ['AI_PROVIDER', saved.p]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});
