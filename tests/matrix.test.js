'use strict';
/* "Matriks Literatur": one matrix row per article, references confirmed on OpenAlex, cited synthesis. */
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../lib/matrix');
const S = require('../lib/sources');
const handler = require('../api/matrix');

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
const env = { GEMINI_API_KEY: 'g-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16', OPENALEX_API_KEY: 'oa' };
const ARTICLE = 'Product images and consumer trust in Malaysian e-commerce\nNur Akma Halili, Shahrunizam Sulaiman\nhttps://doi.org/10.1234/abcd.2024.5.\nAbstract\nThis study examines product images. ' + 'Lorem ipsum dolor sit amet. '.repeat(30) +
  '\n3. Methodology\nA survey of 312 Shopee buyers was analysed with PLS-SEM.\n4. Results\nImage quality influenced trust.\nReferences\nHair, J. F. (2019). https://doi.org/10.1108/EBR-11-2018-0203\n';
const work = { id: 'https://openalex.org/W1', doi: 'https://doi.org/10.1234/abcd.2024.5', display_name: 'Product images and consumer trust in Malaysian e-commerce', publication_year: 2024,
  authorships: [{ author: { display_name: 'Nur Akma Halili' } }, { author: { display_name: 'Shahrunizam Sulaiman' } }], primary_location: { source: { display_name: 'Journal of Visual Commerce' } }, biblio: { volume: '5', issue: '2', first_page: '10', last_page: '25' }, cited_by_count: 3, type: 'article' };

test('excerpt drops the reference list and keeps method and results of long articles', () => {
  assert.doesNotMatch(M.excerpt(ARTICLE), /EBR-11/);
  const long = 'Title\nAbstract ' + 'intro words. '.repeat(4000) + '\n3. Methodology\nWe surveyed 312 buyers.\n' + 'more. '.repeat(3000) + '\n4. Results\nTrust rose.\n' + 'x. '.repeat(3000) + '\n6. Conclusion\nLimits apply.\n';
  const e = M.excerpt(long, 12000);
  assert.ok(e.length <= 12000);
  assert.match(e, /^Title/);
  assert.match(e, /surveyed 312 buyers/);
  assert.match(e, /Trust rose/);
  assert.match(e, /Limits apply/);
});

test('firstDoi takes the DOI on the first page, not one from the references', () => {
  assert.equal(M.firstDoi(ARTICLE), '10.1234/abcd.2024.5');
  assert.equal(M.firstDoi('no doi here'), '');
});

test('cleanRow fills missing cells with a dash and falls back to the DOI in the text', () => {
  const r = M.cleanRow({ title: 'T', authors: 'A One; B Two', year: 'Published 2023', theory: ['TAM', 'UTAUT'], findings: '' }, ARTICLE);
  assert.deepEqual(r.authors, ['A One', 'B Two']);
  assert.equal(r.year, '2023');
  assert.equal(r.theory, 'TAM; UTAUT');
  assert.equal(r.findings, '—');
  assert.equal(r.doi, '10.1234/abcd.2024.5');
  assert.equal(M.cleanRow({}, ''), null);
});

test('findWork confirms by DOI and refuses a weak title match', withEnv(env, async () => {
  const urls = [];
  global.fetch = async url => { urls.push(String(url)); if (String(url).includes('/doi:')) return ok(work); return ok({ results: [{ ...work, display_name: 'Something else entirely about cats' }] }); };
  const p = await S.findWork({ doi: 'https://doi.org/10.1234/abcd.2024.5', title: 'Product images and consumer trust in Malaysian e-commerce' });
  assert.equal(p.venue, 'Journal of Visual Commerce');
  assert.match(urls[0], /works\/doi:10\.1234%2Fabcd\.2024\.5/);
  assert.equal(await S.findWork({ title: 'Product images and consumer trust in Malaysian e-commerce' }), null);
}));

test('extract: one row per article with an APA reference confirmed on OpenAlex', withEnv(env, async () => {
  global.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes('generativelanguage')) {
      assert.match(JSON.parse(opts.body).messages[1].content, /Reader's topic: imej produk/);
      return ok({ choices: [{ message: { content: JSON.stringify({ title: 'Product images and consumer trust in malaysian e-commerce', authors: ['Halili, N. A.'], year: '2024', venue: '—', doi: '', context: 'Pembeli Shopee, Malaysia', theory: 'Signalling theory', method: 'Tinjauan kuantitatif', sample: '312 pembeli', analysis: 'PLS-SEM', findings: 'Kualiti imej meningkatkan kepercayaan.', gap: 'Sampel satu platform.', relevance: 'Berkait terus.' }) } }] });
    }
    return ok(work);
  };
  const res = response();
  await handler(req({ mode: 'extract', text: ARTICLE, fileName: 'a.pdf', focus: 'imej produk', language: 'Bahasa Melayu' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const r = res.body.row;
  assert.equal(r.verified, true);
  assert.deepEqual(r.authors, ['Nur Akma Halili', 'Shahrunizam Sulaiman']);
  assert.equal(r.doi, '10.1234/abcd.2024.5');
  assert.match(r.apa, /^Halili, N\. A\., & Sulaiman, S\. \(2024\)\. Product images .*Journal of Visual Commerce, 5\(2\), 10–25\. https:\/\/doi\.org\/10\.1234\/abcd\.2024\.5$/);
  assert.equal(r.cite, 'Halili dan Sulaiman (2024)');
  assert.equal(r.sample, '312 pembeli');
}));

test('extract refuses scanned PDFs with no text', withEnv(env, async () => {
  const res = response();
  await handler(req({ mode: 'extract', text: '   \n  page 1 ' }), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /scanned/);
}));

test('synth: themes, gaps and a passage cited in APA from the matrix only', withEnv(env, async () => {
  const rows = [
    { title: 'Product images and trust', year: '2024', authors: ['Nur Akma Halili', 'Shahrunizam Sulaiman'], venue: 'J1', theory: 'Signalling', method: 'Survey', findings: 'Trust up' },
    { title: 'Zoom features online', year: '2021', authors: ['Ann Lee', 'Bo Chen', 'Cy Diaz'], venue: 'J2', theory: 'S-O-R', method: 'Experiment', findings: 'Zoom helps' }
  ];
  global.fetch = async () => ok({ choices: [{ message: { content: JSON.stringify({
    themes: [{ name: 'Kepercayaan', note: 'Imej membina kepercayaan [1][2].', papers: [1, 2, 9] }],
    gaps: ['Kajian kualitatif masih kurang [2].'],
    synthesis: 'Kajian lepas menunjukkan imej produk membina kepercayaan [1][2]. Menurut {2}, ciri zum turut membantu.'
  }) } }] });
  const res = response();
  await handler(req({ mode: 'synth', rows, focus: 'imej', language: 'Bahasa Melayu' }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.match(res.body.synthesis, /\(Halili & Sulaiman, 2024; Lee et al\., 2021\)/);
  assert.match(res.body.synthesis, /Lee et al\. \(2021\)/);
  assert.equal(res.body.themes[0].note, 'Imej membina kepercayaan.');
  assert.deepEqual(res.body.themes[0].papers, [1, 2]);
  assert.match(res.body.gaps[0], /\(Lee et al\., 2021\)/);
  assert.equal(res.body.references.length, 2);
  const one = response();
  await handler(req({ mode: 'synth', rows: rows.slice(0, 1) }), one);
  assert.equal(one.statusCode, 400);
}));
