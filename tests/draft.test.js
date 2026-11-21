'use strict';
/* "Sembang → Paper penuh": remarks → plan + real papers → sections with APA citations. */
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../lib/draft');

const ENV = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'AI_DISABLED', 'AI_PROVIDER', 'THESTALK_AI_ACCESS_CODE', 'OPENALEX_API_KEY'];
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
const gemini = content => ok({ choices: [{ message: { content } }] });
const work = (i, year = 2023) => ({ id: 'https://openalex.org/W' + i, doi: 'https://doi.org/10.1/' + i, display_name: 'Study ' + i + ' on product images', publication_year: year, type: 'article', cited_by_count: 10 * i,
  authorships: [{ author: { display_name: 'Aisha Rahman' } }, { author: { display_name: 'Ben Lee' } }], primary_location: { source: { display_name: 'Journal of Retailing' } }, biblio: { volume: '5', issue: '2', first_page: '1', last_page: '9' },
  abstract_inverted_index: { Close: [0], 'up': [1], images: [2], increase: [3], trust: [4] } });

test('cleanPlan keeps known sections, trims points and queries', () => {
  const plan = D.cleanPlan({ title: 'T', sections: { introduction: ['a', '', 7], method: ['m'], hack: ['x'] }, queries: ['"product image" AND trust', 'product image trust', 'ab'], theory: 'cue utilization theory' });
  assert.deepEqual(plan.sections.introduction, ['a']);
  assert.deepEqual(plan.sections.results, []);
  assert.equal(plan.sections.hack, undefined);
  assert.deepEqual(plan.queries, ['product image trust']);
  assert.equal(plan.theory, 'cue utilization theory');
  assert.equal(D.cleanPlan({ sections: {} }), null);
});

test('remarks are capped and chat words are explained to the AI', () => {
  const r = D.readRemarks(['gambar close up penting', { text: 'org yakin sbb nampak detail' }, '', 5]);
  assert.deepEqual(r, ['gambar close up penting', 'org yakin sbb nampak detail']);
  assert.match(D.planInstructions('Bahasa Melayu'), /sbb = sebab/);
  assert.match(D.planInstructions('Bahasa Melayu'), /academic Bahasa Melayu/);
});

test('/api/draft plan: organises remarks and returns a pool of real papers', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const urls = [];
  global.fetch = async (url, opts) => {
    const u = String(url);
    urls.push(u);
    if (u.includes('generativelanguage')) {
      const body = JSON.parse(opts.body);
      assert.match(body.messages[1].content, /1\. gambar close up penting utk org yakin/);
      return gemini(JSON.stringify({ title: 'Peranan imej close-up', sections: { introduction: ['Imej close-up penting untuk keyakinan pembeli.'], literature: ['(cadangan) Teori isyarat.'], method: [], results: [], discussion: ['Pembeli lebih yakin.'], conclusion: [] }, queries: ['close-up product image trust', 'product image purchase intention'], theory: 'cue utilization theory' }));
    }
    return ok({ results: [work(1), work(2), work(3, 2010)] });
  };
  const res = response();
  await require('../handlers/draft')(req({ mode: 'plan', remarks: ['gambar close up penting utk org yakin semasa membeli', 'aku rasa org Malaysia suka tengok detail kain'], language: 'Bahasa Melayu', title: '' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.plan.title, 'Peranan imej close-up');
  assert.equal(res.body.papers.length, 3); // merged across searches
  assert.equal(res.body.papers[0].authors[0], 'Aisha Rahman');
  const searches = urls.filter(u => u.includes('api.openalex.org/works'));
  assert.equal(searches.length, 3);
  assert.equal(searches.filter(u => /publication_year%3A%3E2014/.test(u)).length, 2); // theory search has no year limit
}));

test('/api/draft plan refuses too little input', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const res = response();
  await require('../handlers/draft')(req({ mode: 'plan', remarks: ['hai'] }), res);
  assert.equal(res.statusCode, 400);
}));

const pool = [1, 2, 3].map(i => ({ title: 'Study ' + i, authors: i === 3 ? ['Siti Aminah'] : ['Aisha Rahman', 'Ben Lee'], year: String(2020 + i), venue: 'Journal of Retailing', doi: '10.1/' + i, abstract: 'Close-up images increase trust.' }));

test('/api/draft section: numbers become APA citations, unknown numbers are dropped', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  let body;
  global.fetch = async (url, opts) => { body = JSON.parse(opts.body); return gemini('Imej close-up meningkatkan kepercayaan [1][2]. {3} mendapati perkara sama. Kesan ini juga dilaporkan [9].\n\nPerenggan kedua [PERLU RUJUKAN].'); };
  const res = response();
  await require('../handlers/draft')(req({ mode: 'section', section: 'introduction', points: ['Imej close-up penting.'], papers: pool, title: 'Peranan imej', language: 'Bahasa Melayu' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.match(res.body.text, /\(Rahman & Lee, 2021; Rahman & Lee, 2022\)/);
  assert.match(res.body.text, /Aminah \(2023\) mendapati/);
  assert.ok(!/\[9\]/.test(res.body.text));
  assert.match(res.body.text, /\[PERLU RUJUKAN\]/);
  assert.equal(res.body.references.length, 3);
  assert.match(body.messages[0].content, /\[PERLU RUJUKAN\]/);
  assert.match(body.messages[1].content, /\[1\] Study 1\. Aisha Rahman, Ben Lee \(2021\)/);
}));

test('/api/draft results section never gets papers to cite', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  let body;
  global.fetch = async (url, opts) => { body = JSON.parse(opts.body); return gemini('[DAPATAN 1]'); };
  const res = response();
  await require('../handlers/draft')(req({ mode: 'section', section: 'results', points: [], papers: pool, language: 'Bahasa Melayu' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.ok(!body.messages[1].content.includes('PAPERS'));
  assert.match(body.messages[0].content, /Never invent numbers/);
}));

test('/api/draft section rejects unknown sections', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const res = response();
  await require('../handlers/draft')(req({ mode: 'section', section: 'abstract' }), res);
  assert.equal(res.statusCode, 400);
}));

test('/api/draft sort: one casual remark gets a section, a formal sentence and a follow-up question', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  let body;
  global.fetch = async (url, opts) => { body = JSON.parse(opts.body); return gemini(JSON.stringify({ section: 'Introduction', part: 'masalah kajian', formal: 'Imej produk yang kabur menjejaskan kepercayaan pengguna.', ask: 'Ok, so apa jurang kajian yg awak nampak?' })); };
  const res = response();
  await require('../handlers/draft')(req({ mode: 'sort', remark: 'gambar blur buat org x percaya seller', empty: ['literature', 'method', 'bogus'], recent: [{ section: 'introduction', text: 'gambar penting' }], title: '', language: 'Bahasa Melayu' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.deepEqual(res.body.sorted, { section: 'introduction', part: 'masalah kajian', formal: 'Imej produk yang kabur menjejaskan kepercayaan pengguna.', ask: 'Ok, so apa jurang kajian yg awak nampak?' });
  assert.match(body.messages[1].content, /Sections with no ideas yet: literature, method\n/);
  assert.match(body.messages[1].content, /- \[introduction\] gambar penting/);
  assert.match(body.messages[0].content, /nk = nak/);
}));

test('cleanSort maps unknown sections to other', () => {
  assert.equal(D.cleanSort({ section: 'weather', formal: 'x' }).section, 'other');
  assert.equal(D.cleanSort({}), null);
});
