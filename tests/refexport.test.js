'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { toRIS, toBibTeX } = require('../public/refexport');

const REFS = [
  { apa: 'Park, J., Lennon, S. J., & Stoel, L. (2005). On-line product presentation...', title: 'On-line product presentation: Effects on mood, perceived risk, and purchase intention', year: '2005', authors: ['Jihye Park', 'Sharron J. Lennon', 'Leslie Stoel'], venue: 'Psychology & Marketing', volume: '22', issue: '9', pages: '695–719', doi: '10.1002/mar.20080', url: 'https://doi.org/10.1002/mar.20080', type: 'article' },
  { apa: 'Song, S. S., & Kim, M. (2012). Does more mean better? An examination of visual product presentation in e-retailing.', title: 'Does more mean better?', year: '2012', doi: '', url: '' }
];

test('RIS export has one record per reference with authors, journal, pages and DOI', () => {
  const ris = toRIS(REFS);
  const records = ris.trim().split(/\r\n\r\n/);
  assert.equal(records.length, 2);
  assert.match(records[0], /^TY  - JOUR/);
  assert.match(records[0], /AU  - Park, Jihye\r\nAU  - Lennon, Sharron J\.\r\nAU  - Stoel, Leslie/);
  assert.match(records[0], /JO  - Psychology & Marketing/);
  assert.match(records[0], /SP  - 695\r\nEP  - 719/);
  assert.match(records[0], /DO  - 10\.1002\/mar\.20080/);
  assert.match(records[0], /ER  - $/);
  assert.match(records[1], /^TY  - GEN/);
  assert.match(records[1], /N1  - APA: Song, S\. S\./);
});

test('BibTeX export escapes special characters and builds stable keys', () => {
  const bib = toBibTeX(REFS.concat([{ ...REFS[0] }]));
  assert.match(bib, /@article\{park2005online,/);
  assert.match(bib, /author = \{Park, Jihye and Lennon, Sharron J\. and Stoel, Leslie\}/);
  assert.match(bib, /journal = \{Psychology \\& Marketing\}/);
  assert.match(bib, /pages = \{695--719\}/);
  assert.match(bib, /title = \{\{On-line product presentation: Effects on mood, perceived risk, and purchase intention\}\}/);
  assert.match(bib, /@misc\{anon2012does,/);
  assert.match(bib, /@article\{park2005onlineb,/);
});
