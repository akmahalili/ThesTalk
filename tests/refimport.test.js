'use strict';
/* Import RIS / BibTeX from Mendeley, Zotero, EndNote and Google Scholar, with APA 7 entries. */
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../public/refimport.js');
const X = require('../public/refexport.js');

const RIS = `﻿TY  - JOUR\r\nAU  - Hair, Joseph F.\r\nAU  - Risher, Jeffrey J.\r\nAU  - Sarstedt, Marko\r\nAU  - Ringle, Christian M.\r\nTI  - When to use and how to report the results of PLS-SEM\r\nT2  - European Business Review\r\nPY  - 2019/01/14\r\nVL  - 31\r\nIS  - 1\r\nSP  - 2-24\r\nDO  - https://doi.org/10.1108/EBR-11-2018-0203\r\nAB  - Purpose The purpose of this paper\r\nis to provide an overview.\r\nER  - \r\n\r\n` +
  `TY  - BOOK\nAU  - Hair, Joseph F.\nAU  - Hult, G. Tomas M.\nTI  - A primer on partial least squares structural equation modeling (PLS-SEM)\nPY  - 2022\nET  - 3\nPB  - Sage\nER  - \n\n` +
  `TY  - CHAP\nAU  - Halili, Nur Akma\nTI  - Images in e-commerce\nT2  - Visual communication in Asia\nA2  - Sulaiman, Shahrunizam\nA2  - Kamaruddin, Norfadilah\nPY  - 2023\nSP  - 45\nEP  - 60\nPB  - UiTM Press\nER  - \n\n` +
  `TY  - THES\nAU  - Halili, Nur Akma\nTI  - The role of images in Malaysian e-commerce platforms\nPY  - 2027\nPB  - Universiti Teknologi MARA\nM3  - PhD thesis\nER  - \n`;
const BIB = String.raw`@string{ebr = "European Business Review"}
@article{henseler2015,
  author = {Henseler, J{\"o}rg and Ringle, Christian M. and Sarstedt, Marko},
  title = {A new criterion for assessing discriminant validity in variance-based structural equation modeling},
  journal = {Journal of the Academy of Marketing Science},
  year = 2015, volume = {43}, number = {1}, pages = {115--135},
  doi = {https://doi.org/10.1007/s11747-014-0403-8}
}
@inproceedings{lee2021,
  author = "Lee, Ann and Bo Chen and others",
  title = "{Zoom} features \& purchase intention",
  booktitle = {Proceedings of the 2021 Conference on Retail},
  editor = {Smith, John and Jane Doe},
  pages = {10-18}, year = {2021}, publisher = {ACM}
}
@comment{ignore {nested} me}
@book{field, author={Field, Andy}, title={Discovering statistics using {IBM SPSS} Statistics}, edition={5}, publisher={Sage}, year={2018}}
@misc{who, author={{World Health Organization}}, title={Digital health guidelines}, year={2020}, url={https://who.int/x}}
@article{noauthor, title = {Caf\'e culture in Garc\'{i}a M\"uller}, journal = ebr # " Special", year={2020}}`;

test('RIS from Mendeley / Zotero / EndNote becomes APA 7', () => {
  const { kind, refs } = R.parse(RIS, 'en');
  assert.equal(kind, 'ris');
  assert.equal(refs.length, 4);
  assert.equal(refs[0].apa, 'Hair, J. F., Risher, J. J., Sarstedt, M., & Ringle, C. M. (2019). When to use and how to report the results of PLS-SEM. European Business Review, 31(1), 2–24. https://doi.org/10.1108/EBR-11-2018-0203');
  assert.equal(refs[0].doi, '10.1108/EBR-11-2018-0203');
  assert.match(refs[0].abstract, /paper is to provide/);
  assert.equal(refs[1].apa, 'Hair, J. F., & Hult, G. T. M. (2022). A primer on partial least squares structural equation modeling (PLS-SEM) (3rd ed.). Sage.');
  assert.equal(refs[2].apa, 'Halili, N. A. (2023). Images in e-commerce. In S. Sulaiman & N. Kamaruddin (Eds.), Visual communication in Asia (pp. 45–60). UiTM Press.');
  assert.equal(refs[3].apa, 'Halili, N. A. (2027). The role of images in Malaysian e-commerce platforms [Doctoral dissertation, Universiti Teknologi MARA].');
  assert.match(R.parse(RIS, 'ms').refs[3].apa, /\[Tesis doktor falsafah, Universiti Teknologi MARA\]/);
});

test('BibTeX from Zotero / Google Scholar: braces, accents, @string, corporate authors', () => {
  const { kind, refs } = R.parse(BIB, 'en');
  assert.equal(kind, 'bib');
  assert.equal(refs.length, 5);
  assert.deepEqual(refs[0].authors, ['Henseler, Jörg', 'Ringle, Christian M.', 'Sarstedt, Marko']);
  assert.equal(refs[0].apa, 'Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. Journal of the Academy of Marketing Science, 43(1), 115–135. https://doi.org/10.1007/s11747-014-0403-8');
  assert.equal(refs[1].apa, 'Lee, A., & Chen, B. (2021). Zoom features & purchase intention. In J. Smith & J. Doe (Eds.), Proceedings of the 2021 Conference on Retail (pp. 10–18). ACM.');
  assert.equal(refs[2].apa, 'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). Sage.');
  assert.equal(refs[3].apa, 'World Health Organization. (2020). Digital health guidelines. https://who.int/x');
  assert.equal(refs[4].apa, 'Café culture in García Müller. (2020). European Business Review Special.');
});

test('export then import keeps the reference', () => {
  const ref = R.parse(RIS, 'en').refs[0];
  for (const text of [X.toRIS([ref]), X.toBibTeX([ref])]) {
    const back = R.parse(text, 'en').refs[0];
    assert.equal(back.apa, ref.apa);
  }
});

test('merge skips references already in the list', () => {
  const list = [{ apa: 'x', doi: '10.1108/ebr-11-2018-0203' }];
  const { refs } = R.parse(RIS + '\n' + RIS, 'en');
  assert.deepEqual(R.merge(list, refs, '2026-11-21'), { added: 3, skipped: 5 });
  assert.equal(list.length, 4);
  assert.equal(R.parse('just some text', 'en').kind, '');
});
