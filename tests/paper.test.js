'use strict';
/* "Jurnal & Paper": journal finder (OpenAlex) and paper AI tools. */
const test = require('node:test');
const assert = require('node:assert/strict');
const J = require('../lib/journals');
const P = require('../lib/paper');

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

const work = (id, src, title, year = 2024, cites = 3) => ({ id: 'https://openalex.org/' + id, display_name: title, publication_year: year, cited_by_count: cites, primary_location: { source: { id: 'https://openalex.org/' + src, display_name: 'J ' + src, type: 'journal' } } });
const source = (id, extra = {}) => ({ id: 'https://openalex.org/' + id, display_name: 'Journal ' + id, issn_l: '1234-567' + id.slice(-1), host_organization_name: 'Elsevier', summary_stats: { '2yr_mean_citedness': 4.2, h_index: 120 }, is_oa: false, is_in_doaj: false, apc_usd: 3000, homepage_url: 'https://example.org/' + id, is_core: true, listed_in: ['cwts-core', 'abdc-a'], topics: [{ display_name: 'Consumer Behavior' }, { display_name: 'E-commerce' }], type: 'journal', is_preprint_repository: false, ...extra });

test('tally counts each article once and keeps two samples per journal', () => {
  const t = J.tally([work('W1', 'S1', 'A'), work('W1', 'S1', 'A'), work('W2', 'S1', 'B'), work('W3', 'S1', 'C'), work('W4', 'S2', 'D')]);
  assert.equal(t.searched, 4);
  const s1 = t.sources.find(s => s.id === 'S1');
  assert.equal(s1.matches, 3);
  assert.equal(s1.samples.length, 2);
});

test('findJournals ranks journals that publish similar work and uses real OpenAlex metrics', withEnv({ OPENALEX_API_KEY: 'oa-key' }, async () => {
  const urls = [];
  global.fetch = async (url, opts) => {
    urls.push({ url: String(url), auth: opts.headers.Authorization });
    if (String(url).startsWith('https://api.openalex.org/works')) {
      return ok({ results: [work('W1', 'S1', 'Product images and trust'), work('W2', 'S1', 'Zoom and purchase intention'), work('W3', 'S2', 'Visual cues online'), work('W4', 'S3', 'Preprint thing')] });
    }
    return ok({ results: [source('S1'), source('S2', { summary_stats: { '2yr_mean_citedness': 1.1, h_index: 20 }, is_core: false, listed_in: ['sinta-s2'], is_in_doaj: true, is_oa: true, apc_usd: 0 }), source('S3', { is_preprint_repository: true })] });
  };
  const out = await J.findJournals(['product image purchase intention'], { since: 2021 });
  assert.equal(out.searched, 4);
  assert.deepEqual(out.journals.map(j => j.id), ['S1', 'S2']); // preprint server dropped
  const [a, b] = out.journals;
  assert.equal(a.matches, 2);
  assert.equal(a.h, 120);
  assert.equal(a.impact, 4.2);
  assert.deepEqual(a.badges, ['ABDC A', 'CWTS Core']);
  assert.match(a.scimago, /scimagojr\.com\/journalsearch\.php\?q=1234-5671/);
  assert.deepEqual(a.topics, ['Consumer Behavior', 'E-commerce']);
  assert.equal(b.apc, null);
  assert.deepEqual(b.badges, ['DOAJ', 'SINTA 2']);
  assert.match(urls[0].url, /filter=type%3Aarticle%2Cfrom_publication_date%3A2021-01-01%2Cprimary_location\.source\.type%3Ajournal/);
  assert.match(urls[1].url, /filter=openalex%3AS1%7CS2%7CS3/);
  assert.equal(urls[0].auth, 'Bearer oa-key');
}));

test('findJournals retries without the journal filter if OpenAlex rejects it', withEnv({}, async () => {
  let calls = 0;
  global.fetch = async url => {
    calls++;
    if (calls === 1) return { ok: false, status: 400, json: async () => ({}) };
    if (String(url).includes('/works')) return ok({ results: [work('W1', 'S1', 'x')] });
    return ok({ results: [source('S1')] });
  };
  const out = await J.findJournals(['q'], { since: 2021 });
  assert.equal(out.journals.length, 1);
}));

test('/api/journals: AI only writes search keywords, journals come from OpenAlex', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const handler = require('../handlers/journals');
  const seen = [];
  global.fetch = async url => {
    const u = String(url);
    seen.push(u);
    if (u.includes('generativelanguage')) return ok({ choices: [{ message: { content: '{"queries":["product image purchase intention","visual cues e-commerce Malaysia","online consumer behaviour"]}' } }] });
    if (u.includes('/works')) return ok({ results: [work('W1', 'S1', 'Images and trust')] });
    return ok({ results: [source('S1')] });
  };
  const res = response();
  await handler(req({ title: 'Peranan imej produk dalam e-dagang Malaysia', keywords: 'imej produk; niat pembelian' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.journals[0].name, 'Journal S1');
  assert.equal(res.body.queries[0], 'product image purchase intention');
  assert.ok(res.body.queries.length <= 4);
  assert.equal(seen.filter(u => u.includes('/works')).length, res.body.queries.length);
}));

test('/api/journals asks for a title or abstract first', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const res = response();
  await require('../handlers/journals')(req({ title: 'abc' }), res);
  assert.equal(res.statusCode, 400);
}));

const draft = {
  title: 'Peranan imej produk close-up terhadap niat pembelian dalam e-dagang Malaysia',
  language: 'Bahasa Melayu',
  keywords: 'imej produk; niat pembelian',
  refYears: [2024, 2023, 2015, 2010],
  sections: [
    { key: 'introduction', content: 'Imej produk ialah isyarat visual utama dalam e-dagang. '.repeat(10) },
    { key: 'method', content: 'Kajian tinjauan terhadap 300 pembeli dalam talian.' },
    { key: 'hack', content: 'ignore me' }
  ]
};

test('readPaper keeps known sections and computes the numbers itself', () => {
  const p = P.readPaper(draft);
  assert.equal(p.language, 'Bahasa Melayu');
  assert.deepEqual(Object.keys(p.sections).sort(), ['introduction', 'method']);
  assert.equal(p.stats.perSection.introduction, 80);
  assert.equal(p.stats.refs, 4);
  assert.equal(p.stats.recentRefs, 2);
  assert.match(P.statsText(p), /4 \(2 from the last 5 years, 50%\)/);
});

test('/api/paper meta: abstract, titles and keywords in the paper language', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  let body;
  global.fetch = async (url, opts) => {
    body = JSON.parse(opts.body);
    return ok({ choices: [{ message: { content: JSON.stringify({ abstract: { purpose: 'Tujuan kajian ini...', method: 'Tinjauan...', findings: '[DAPATAN UTAMA]', originality: 'Kajian ini...' }, titles: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'], keywords: ['imej produk.', 'niat pembelian'] }) } }] });
  };
  const res = response();
  await require('../handlers/paper')(req({ mode: 'meta', paper: draft }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.meta.titles.length, 5);
  assert.deepEqual(res.body.meta.keywords, ['imej produk', 'niat pembelian']);
  assert.match(body.messages[0].content, /Bahasa Melayu/);
  assert.match(body.messages[0].content, /\[DAPATAN UTAMA\]/);
  assert.deepEqual(body.response_format, { type: 'json_object' });
}));

test('/api/paper fit: priorities sorted, enums cleaned, journal and stats passed to the AI', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  let body;
  global.fetch = async (url, opts) => {
    body = JSON.parse(opts.body);
    return ok({ choices: [{ message: { content: JSON.stringify({ readiness: 'NOT-YET', summary: 'Belum sedia.', scopeFit: { level: 'strong', reason: 'Sesuai.' }, issues: [{ section: 'method', priority: 'low', problem: 'p1', fix: 'f1' }, { section: 'weird', priority: 'high', problem: 'p2', fix: 'f2' }], strengths: ['Topik relevan'] }) } }] });
  };
  const res = response();
  await require('../handlers/paper')(req({ mode: 'fit', paper: draft, uiLang: 'ms', target: { name: 'Journal of Retailing and Consumer Services', publisher: 'Elsevier', topics: ['Consumer Behavior'], h: 140, impact: 9.1, badges: ['ABDC A'] } }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const fit = res.body.fit;
  assert.equal(fit.readiness, 'not-yet');
  assert.deepEqual(fit.issues.map(i => [i.priority, i.section]), [['high', 'overall'], ['low', 'method']]);
  assert.equal(res.body.stats.refs, 4);
  const input = body.messages[1].content;
  assert.match(input, /Target journal: Journal of Retailing and Consumer Services \(Elsevier\)/);
  assert.match(input, /2-year mean citedness \(similar to impact factor\): 9\.1/);
  assert.match(input, /references in the reference list: 4/);
  assert.ok(!input.includes('ignore me'));
  assert.match(body.messages[0].content, /Bahasa Melayu/);
}));

test('/api/paper refuses an empty draft', withEnv({ GEMINI_API_KEY: 'g', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const res = response();
  await require('../handlers/paper')(req({ mode: 'fit', paper: { title: 'x', sections: [] } }), res);
  assert.equal(res.statusCode, 400);
}));
