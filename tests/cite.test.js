'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cite = require('../api/cite');
const C = require('../lib/cite');
const { rebuildAbstract, toPaper } = require('../lib/sources');

const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } });
const headers = { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'content-type': 'application/json' };

const WORKS = [
  {
    id: 'https://openalex.org/W1', doi: 'https://doi.org/10.1002/mar.20080',
    display_name: 'On-line product presentation: Effects on mood, perceived risk, and purchase intention',
    publication_year: 2005, cited_by_count: 473, type: 'article',
    authorships: [{ author: { display_name: 'Jihye Park' } }, { author: { display_name: 'Sharron J. Lennon' } }, { author: { display_name: 'Leslie Stoel' } }],
    primary_location: { source: { display_name: 'Psychology & Marketing' } },
    biblio: { volume: '22', issue: '9', first_page: '695', last_page: '719' },
    abstract_inverted_index: { Because: [0], online: [1], apparel: [2], is: [3], risky: [4] }
  },
  {
    id: 'https://openalex.org/W2', doi: null,
    display_name: 'Does more mean better? An examination of <i>visual</i> product presentation in e-retailing',
    publication_year: 2012, cited_by_count: 56, type: 'article',
    authorships: [{ author: { display_name: 'Sarah Sungsook Song' } }, { author: { display_name: 'Minjeong Kim' } }],
    primary_location: { source: { display_name: 'Journal of Electronic Commerce Research' } },
    biblio: { volume: '13', issue: '4', first_page: '345', last_page: '355' },
    abstract_inverted_index: { Larger: [0], images: [1], reduce: [2], risk: [3] }
  }
];

function withEnv(env, fn) {
  const saved = {};
  for (const k of Object.keys(env)) { saved[k] = process.env[k]; if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; }
  const oldFetch = globalThis.fetch;
  return Promise.resolve().then(fn).finally(() => {
    globalThis.fetch = oldFetch;
    for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  });
}

test('cite endpoint writes from real papers and converts numbers into APA citations', () => withEnv(
  { OPENAI_API_KEY: 'test-not-a-real-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16', OPENALEX_API_KEY: 'test-openalex-key' },
  async () => {
    const ai = [];
    const searches = [];
    globalThis.fetch = async (url, options = {}) => {
      if (String(url).startsWith('https://api.openai.com/')) {
        const body = JSON.parse(options.body);
        ai.push(body);
        const output_text = ai.length === 1
          ? JSON.stringify({ claim: 'Close-up product images increase purchase confidence.', queries: ['product image zoom purchase intention', 'online product presentation perceived risk', 'AND "visual" OR tactile'] })
          : 'Close-up imagery may build confidence in online purchasing [1][2]. {2} found that larger images reduce intangibility. A made-up claim [9]. Malaysian evidence is limited [SOURCE NEEDED].\n###NOTE###\nThe papers support the idea for apparel.';
        return { ok: true, status: 200, json: async () => ({ output_text }) };
      }
      if (String(url).startsWith('https://api.openalex.org/works')) {
        searches.push({ url: String(url), auth: options.headers && options.headers.Authorization });
        return { ok: true, status: 200, json: async () => ({ results: WORKS }) };
      }
      throw new Error('unexpected fetch ' + url);
    };
    const r = response();
    await cite({ method: 'POST', headers, body: { idea: 'I think, gambar close up penting utk org yakin semasa membeli', project: { language: 'English', title: 'Images in e-commerce' }, recentOnly: true } }, r);
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    const b = r.body;
    assert.equal(b.academicText, 'Close-up imagery may build confidence in online purchasing (Park et al., 2005; Song & Kim, 2012). Song and Kim (2012) found that larger images reduce intangibility. A made-up claim. Malaysian evidence is limited [SOURCE NEEDED].');
    assert.equal(b.note, 'The papers support the idea for apparel.');
    assert.deepEqual(b.references.map(x => x.apa), [
      'Park, J., Lennon, S. J., & Stoel, L. (2005). On-line product presentation: Effects on mood, perceived risk, and purchase intention. Psychology & Marketing, 22(9), 695–719. https://doi.org/10.1002/mar.20080',
      'Song, S. S., & Kim, M. (2012). Does more mean better? An examination of visual product presentation in e-retailing. Journal of Electronic Commerce Research, 13(4), 345–355.'
    ]);
    assert.equal(b.references[0].url, 'https://doi.org/10.1002/mar.20080');
    assert.equal(b.papers.length, 2);
    assert.ok(b.papers.every(p => p.cited));
    assert.equal(b.provider, 'OpenAlex');
    // model calls
    assert.equal(ai.length, 2);
    assert.equal(ai[0].store, false);
    assert.deepEqual(ai[0].text, { format: { type: 'json_object' } });
    assert.match(ai[1].input, /\[1\] On-line product presentation/);
    assert.match(ai[1].input, /Abstract: Because online apparel is risky/);
    // searches: three cleaned queries, key sent as a bearer token, filters applied
    assert.equal(searches.length, 3);
    assert.ok(searches.every(s => s.auth === 'Bearer test-openalex-key'));
    const u = new URL(searches[0].url);
    assert.equal(u.searchParams.get('search'), 'product image zoom purchase intention');
    assert.match(u.searchParams.get('filter'), /has_abstract:true/);
    assert.match(u.searchParams.get('filter'), /publication_year:>2014/);
    assert.equal(new URL(searches[2].url).searchParams.get('search'), 'visual tactile');
  }
));

test('cite endpoint still answers, with a clear warning, when reference search is unavailable', () => withEnv(
  { OPENAI_API_KEY: 'test-not-a-real-key', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16', OPENALEX_API_KEY: undefined },
  async () => {
    globalThis.fetch = async (url, options = {}) => {
      if (String(url).startsWith('https://api.openai.com/')) {
        const body = JSON.parse(options.body);
        const output_text = body.text ? 'not json at all' : 'Product images may matter to buyers [SOURCE NEEDED].\n###NOTA###\nSumber masih diperlukan.';
        return { ok: true, status: 200, json: async () => ({ output_text }) };
      }
      return { ok: false, status: 429, json: async () => ({}) };
    };
    const r = response();
    await cite({ method: 'POST', headers, body: { idea: 'gambar produk penting', project: { language: 'Bahasa Melayu' } } }, r);
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.references.length, 0);
    assert.equal(r.body.academicText, 'Product images may matter to buyers [SOURCE NEEDED].');
    assert.match(r.body.warnings[0], /OPENALEX_API_KEY/);
  }
));

test('cite endpoint refuses requests without the access code', () => withEnv(
  { OPENAI_API_KEY: 'fake', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' },
  async () => {
    const r = response();
    await cite({ method: 'POST', headers: { host: 'localhost', origin: 'https://localhost' }, body: { idea: 'hello there' } }, r);
    assert.equal(r.statusCode, 401);
  }
));

test('APA helpers handle Malay output, particles, hyphenated names and missing years', () => {
  const p = { n: 1, title: 'A study', year: '', authors: ['Willemijn van Dolen', 'Tun-Min Catherine Jai'], venue: '', doi: '' };
  assert.equal(C.parenCite([p], 'ms'), '(van Dolen & Jai, t.t.)');
  assert.equal(C.narrativeCite(p, 'ms'), 'van Dolen dan Jai (t.t.)');
  assert.equal(C.apaReference(p, 'en'), 'van Dolen, W., & Jai, T.-M. C. (n.d.). A study.');
  assert.equal(C.splitName('Park, Minjung').sur, 'Park');
});

test('OpenAlex records become clean paper objects', () => {
  assert.equal(rebuildAbstract({ world: [1], hello: [0], again: [2, 4], the: [3] }), 'hello world again the again');
  const p = toPaper(WORKS[1]);
  assert.equal(p.title, 'Does more mean better? An examination of visual product presentation in e-retailing');
  assert.equal(p.pages, '345–355');
  assert.equal(p.doi, '');
  assert.equal(C.mergePapers([[toPaper(WORKS[0]), p], [toPaper(WORKS[0])]]).length, 2);
});

test('a {n} citation at the end of a clause becomes parenthetical, and markdown emphasis is removed', () => {
  const C = require('../lib/cite');
  const papers = [{ n: 1, title: 'A', authors: ['Ali Falahat'], year: '2019', venue: 'J' }, { n: 2, title: 'B', authors: ['Siti Aminah'], year: '2021', venue: 'J' }];
  const out = C.render('E-dagang berkembang pesat {1}. {2} mendapati *e-commerce* penting.', papers, 'ms');
  assert.equal(out.text, 'E-dagang berkembang pesat (Falahat, 2019). Aminah (2021) mendapati e-commerce penting.');
});
