'use strict';
/* Citation audit: in-text citations against the reference list, APA 7 rules and DOI checks. */
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../public/citeaudit.js');
const handler = require('../api/audit');

const TEXT = 'Imej membina kepercayaan (Hair et al., 2019; Halili & Sulaiman, 2023). Menurut Henseler et al. (2015), HTMT lebih tepat. ' +
  'Kajian lain (Lee, Chen, & Diaz, 2021) dan Smith (2018) menyokong. Tan dan Lim (2022, p. 4) berbeza. (e.g., Kock, 2015, 2017). ' +
  '(Abdul Rahman, 2020). Pada tahun (2019) sahaja. Halili et al. (2023) salah.';
const REFS = [
  { apa: 'Hair, J. F., Risher, J. J., Sarstedt, M., & Ringle, C. M. (2019). When to use and how to report PLS-SEM. European Business Review, 31(1), 2–24.', authors: ['Joseph F. Hair'], year: '2019', doi: '10.1108/EBR-11-2018-0203', title: 'When to use and how to report the results of PLS-SEM' },
  { apa: 'Halili, N. A., & Sulaiman, S. (2023). Images.', authors: ['Halili, Nur Akma'], year: '2023' },
  { apa: 'Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion.', authors: ['Jörg Henseler'], year: '2015' },
  { apa: 'Smith, A. (2019). Something.', authors: ['A Smith'], year: '2019' },
  { apa: 'Kock, N. (2015). Common method bias.', authors: ['Ned Kock'], year: '2015' },
  { apa: 'Unused, B., et al. (2010). Never cited.', authors: ['B Unused'], year: '2010' },
  { apa: 'Abdul Rahman, N. (2020). Malay surname.', authors: ['Abdul Rahman, N.'], year: '2020' },
  { apa: 'Hair, J. F. (2019). Another 2019 work.', authors: ['Hair, J. F.'], year: '2019' }
];

test('parseCitations reads parenthetical, narrative, multi-year and page citations', () => {
  const c = A.parseCitations(TEXT);
  const seen = c.map(x => x.names[0] + ' ' + x.year + (x.etal ? '+' : ''));
  assert.deepEqual(seen, ['Hair 2019+', 'Halili 2023', 'Henseler 2015+', 'Lee 2021', 'Smith 2018', 'Tan 2022', 'Kock 2015', 'Kock 2017', 'Abdul Rahman 2020', 'Halili 2023+']);
  assert.equal(c.find(x => x.names[0] === 'Henseler').raw, 'Henseler et al. (2015)');
  assert.equal(A.parseCitations('Pada tahun (2019) sahaja, (n = 312).').length, 0);
});

test('audit finds missing references, year mismatches, uncited references and APA slips', () => {
  const r = A.audit([{ label: 'Bab 2', text: TEXT }], REFS);
  assert.deepEqual(r.missing.map(x => x.cite), ['(Lee, Chen, & Diaz, 2021)', 'Tan dan Lim (2022, p. 4)']);
  assert.deepEqual(r.yearOff.map(x => x.cite + ' ' + x.listYears.join()), ['Smith (2018) 2019', '(e.g., Kock, 2015, 2017) 2015']);
  assert.deepEqual(r.uncited.map(x => x.r.authors[0]), ['B Unused']);
  assert.equal(r.needSuffix.length, 1);
  assert.deepEqual(r.ambiguous.map(x => x.cite), ['(Hair et al., 2019)']);
  assert.deepEqual(r.style.map(s => s.kind), ['needEtal', 'etalTwo', 'refEtal']);
  assert.equal(A.authorCount(REFS[0]), 4);
  assert.equal(A.authorCount(REFS[1]), 2);
});

test('a clean text gives no problems', () => {
  const r = A.audit([{ label: 'x', text: 'Imej penting (Smith, 2019). Kock (2015) setuju.' }], [REFS[3], REFS[4]]);
  assert.equal(r.missing.length + r.yearOff.length + r.uncited.length + r.style.length + r.needSuffix.length, 0);
});

test('POST /api/audit confirms, flags and suggests DOIs through OpenAlex', async () => {
  const saved = { a: process.env.THESTALK_AI_ACCESS_CODE, g: process.env.GEMINI_API_KEY, f: global.fetch };
  process.env.THESTALK_AI_ACCESS_CODE = 'secure-test-code-16'; process.env.GEMINI_API_KEY = 'g';
  const work = (doi, title, year) => ({ id: 'W', doi: 'https://doi.org/' + doi, display_name: title, publication_year: year, authorships: [{ author: { display_name: 'Joseph F. Hair' } }], primary_location: { source: { display_name: 'EBR' } }, biblio: {} });
  global.fetch = async url => {
    const u = decodeURIComponent(String(url));
    if (u.includes('filter=doi:')) return { ok: true, status: 200, json: async () => ({ results: [work('10.1108/ebr-11-2018-0203', 'When to use and how to report the results of PLS-SEM', 2019), work('10.9999/other', 'Totally different topic about fish', 2001)] }) };
    if (u.includes('title.search:')) return { ok: true, status: 200, json: async () => ({ results: [work('10.5555/found', 'Common method bias in PLS-SEM: a full collinearity assessment approach', 2015)] }) };
    throw new Error('unexpected ' + u);
  };
  const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } };
  try {
    await handler({ method: 'POST', headers: { 'x-thestalk-access': 'secure-test-code-16', host: 'localhost', origin: 'https://localhost', 'x-forwarded-for': '10.1.1.' + Math.random() }, body: { refs: [
      { i: 0, doi: 'https://doi.org/10.1108/EBR-11-2018-0203', title: 'When to use and how to report the results of PLS-SEM', year: '2019' },
      { i: 1, doi: '10.9999/other', title: 'Images and trust in Malaysian online shops', year: '2023' },
      { i: 2, doi: '10.1111/missing', title: 'Nothing', year: '2020' },
      { i: 3, doi: '', title: 'Common method bias in PLS-SEM: a full collinearity assessment approach', year: '2015' }
    ] } }, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const by = Object.fromEntries(res.body.checks.map(c => [c.i, c.status]));
    assert.deepEqual(by, { 0: 'ok', 1: 'mismatch', 2: 'notfound', 3: 'suggest' });
    assert.equal(res.body.checks.find(c => c.i === 3).doi, '10.5555/found');
  } finally {
    global.fetch = saved.f;
    for (const [k, v] of [['THESTALK_AI_ACCESS_CODE', saved.a], ['GEMINI_API_KEY', saved.g]]) v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
});
