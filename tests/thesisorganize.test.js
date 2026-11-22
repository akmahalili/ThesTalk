'use strict';
/* Import Tesis: arranging an imported thesis by topic. */
const test = require('node:test');
const assert = require('node:assert/strict');
const O = require('../public/thesisorganize.js');
const LO = require('../lib/organize.js');

const P = (n, w) => Array.from({ length: n }, (_, i) => `${w} sentence ${i + 1} explains how product images shape trust among online shoppers in Malaysia.`).join(' ');
const word = {
  title: '',
  blocks: [
    { h: 0, text: 'UNIVERSITI TEKNOLOGI MARA' },
    { h: 0, text: 'THE ROLE OF PRODUCT IMAGES IN MALAYSIAN E-COMMERCE PLATFORMS' },
    { h: 0, text: 'NUR AKMA HALILI' },
    { h: 0, text: 'Thesis submitted in fulfilment of the requirements for the degree of Doctor of Philosophy' },
    { h: 0, text: "AUTHOR'S DECLARATION" }, { h: 0, text: P(3, 'Declaration') },
    { h: 0, text: 'ABSTRACT' }, { h: 0, text: P(4, 'Abstract') }, { h: 0, text: 'Keywords: product images, trust, e-commerce' },
    { h: 0, text: 'ABSTRAK' }, { h: 0, text: 'Kajian ini meneliti peranan imej produk dalam membina kepercayaan pembeli dalam talian di Malaysia dan kesannya terhadap niat membeli.' }, { h: 0, text: 'Kata kunci: imej produk, kepercayaan' },
    { h: 0, text: 'ACKNOWLEDGEMENT' }, { h: 0, text: 'I thank my supervisors Dr. Shahrunizam Sulaiman and Prof. Dr. Norfadilah Kamaruddin for their guidance.' }, { h: 0, text: 'Nur Akma Halili' },
    { h: 0, text: 'TABLE OF CONTENTS' }, { h: 0, text: 'CHAPTER 1 INTRODUCTION 1' }, { h: 0, text: '1.1 Background of the Study ........ 1' }, { h: 0, text: 'REFERENCES\t95' },
    { h: 0, text: 'LIST OF ABBREVIATIONS' }, { h: 0, text: 'PLS-SEM', cells: ['PLS-SEM', 'Partial Least Squares Structural Equation Modelling'] }, { h: 0, text: 'AVE   Average Variance Extracted' },
    { h: 1, text: 'CHAPTER 1\nINTRODUCTION' },
    { h: 2, text: '1.1 Background of the Study' }, { h: 0, text: P(5, 'Background') },
    { h: 2, text: '1.2 Problem Statement' }, { h: 0, text: P(3, 'Problem') },
    { h: 3, text: '1.2.1 Image Quality' }, { h: 0, text: P(2, 'Quality') },
    { h: 1, text: 'CHAPTER 2: LITERATURE REVIEW' },
    { h: 2, text: '2.1 Signalling Theory' }, { h: 0, text: P(3, 'Theory') },
    { h: 0, text: '1. Information quality' },
    { h: 0, text: 'Table 2.1: Summary of Past Studies' },
    { h: 0, text: 'x', cells: ['Author', 'Year', 'Finding'] }, { h: 0, text: 'x', cells: ['Hair', '2019', 'PLS-SEM'] },
    { h: 0, text: '', image: true },
    { h: 1, text: 'CHAPTER 3' }, { h: 1, text: 'RESEARCH METHODOLOGY' },
    { h: 2, text: '3.1 Research Design' }, { h: 0, text: P(2, 'Design') },
    { h: 1, text: 'CHAPTER FOUR' },
    { h: 2, text: '4.1 Respondent Profile' }, { h: 0, text: P(2, 'Respondents') },
    { h: 2, text: '4.2 Measurement Model' }, { h: 0, text: P(2, 'Measurement') },
    { h: 2, text: '4.3 Hypothesis Testing' }, { h: 0, text: P(2, 'Hypotheses') },
    { h: 1, text: 'REFERENCES' },
    { h: 0, text: 'Hair, J. F., Risher, J. J., Sarstedt, M., & Ringle, C. M. (2019). When to use and how to report the results of PLS-SEM. European Business Review, 31(1), 2–24. https://doi.org/10.1108/EBR-11-2018-0203' },
    { h: 0, text: 'Spence, M. (1973). Job market signaling. The Quarterly Journal of Economics, 87(3), 355–374.' },
    { h: 1, text: 'APPENDIX A: QUESTIONNAIRE' }, { h: 0, text: P(2, 'Appendix') },
    { h: 1, text: "AUTHOR'S PROFILE" }, { h: 0, text: 'Nur Akma Halili is a photography lecturer at a Malaysian polytechnic and a PhD candidate at UiTM.' }
  ]
};

test('a Word thesis is arranged into chapters by topic, with its preliminary pages and references', () => {
  const r = O.organize(word);
  assert.equal(r.lang, 'en');
  assert.deepEqual(r.chapters.map(c => c.title), ['Chapter 1: Introduction', 'Chapter 2: Literature Review', 'Chapter 3: Research Methodology', 'Chapter 4: Findings']);
  assert.deepEqual(r.chapters.map(c => c.topic), ['intro', 'literature', 'method', 'results']);
  assert.deepEqual(r.chapters[0].sections.map(s => s.title), ['1.1 Background of the Study', '1.2 Problem Statement']);
  const ps = r.chapters[0].sections[1].content;
  assert.ok(ps.includes('1.2.1 Image Quality') && ps.includes('Quality sentence 2'), 'sub-heading kept inside its section');
  const lit = r.chapters[1].sections[0].content;
  assert.ok(lit.includes('1. Information quality'), 'a numbered list item is not a section');
  assert.equal(r.chapters[1].sections.length, 1);
  assert.ok(lit.includes('Author\tYear\tFinding\nHair\t2019\tPLS-SEM'), 'table rows stay together as tab-separated lines');
  assert.ok(lit.includes('[Image from the original file'));
  assert.match(r.front.abstract, /^Abstract sentence 1/);
  assert.equal(r.front.keywords, 'product images, trust, e-commerce');
  assert.match(r.front.abstrak, /^Kajian ini/);
  assert.equal(r.front.kataKunci, 'imej produk, kepercayaan');
  assert.match(r.front.ack, /I thank my supervisors/);
  assert.ok(!r.front.ack.includes('\n\nNur Akma Halili'), 'signature line left out');
  assert.equal(r.front.abbreviations, 'PLS-SEM = Partial Least Squares Structural Equation Modelling\nAVE = Average Variance Extracted');
  assert.match(r.front.profile, /photography lecturer/);
  assert.equal(r.references.length, 2);
  assert.equal(r.references[0].doi, '10.1108/EBR-11-2018-0203');
  assert.ok(r.skipped.contents >= 3 && r.skipped.frontPages >= 1 && r.skipped.appendix >= 1);
  assert.equal(r.title, 'The Role of Product Images in Malaysian E-Commerce Platforms');
  assert.ok(!r.chapters.some(c => /abstract|declaration|acknowledg/i.test(c.title)), 'no preliminary page became a chapter');
  assert.equal(r.needsAI, false);
  assert.equal(r.stats.tables, 1);
});

test('Malay thesis: BAB SATU headings, Bab titles, sections by number', () => {
  const r = O.organize({ blocks: [
    { h: 0, text: 'BAB SATU' }, { h: 0, text: 'PENGENALAN' },
    { h: 0, text: '1.0 Pengenalan' }, { h: 0, text: 'Kajian ini meneliti peranan imej produk dalam platform e-dagang di Malaysia dan bagaimana pembeli menilai kualiti produk melalui gambar.' },
    { h: 0, text: '1.1 Pernyataan Masalah' }, { h: 0, text: 'Pembeli dalam talian tidak dapat menyentuh produk, maka mereka bergantung kepada gambar untuk membuat keputusan membeli dengan yakin.' },
    { h: 0, text: 'BAB 2 KAJIAN LITERATUR' }, { h: 0, text: '2.1 Teori Isyarat' }, { h: 0, text: 'Teori isyarat menjelaskan bagaimana penjual menghantar maklumat kualiti kepada pembeli yang tidak mempunyai maklumat lengkap tentang produk.' },
    { h: 0, text: 'RUJUKAN' }, { h: 0, text: 'Spence, M. (1973). Job market signaling. The Quarterly Journal of Economics, 87(3), 355–374.' }
  ] });
  assert.equal(r.lang, 'ms');
  assert.deepEqual(r.chapters.map(c => c.title), ['Bab 1: Pengenalan', 'Bab 2: Kajian Literatur']);
  assert.deepEqual(r.chapters[0].sections.map(s => s.title), ['1.0 Pengenalan', '1.1 Pernyataan Masalah']);
  assert.equal(r.references.length, 1);
});

test('a chapter heading with no title takes its topic from its sections', () => {
  assert.equal(O.topicFromSections(['5.1 Summary of Findings', '5.2 Implications', '5.3 Limitations']), 'conclusion');
  assert.equal(O.topicFromSections(['3.1 Research Design', '3.2 Population and Sampling', '3.3 Instrument']), 'method');
  assert.equal(O.topicOf('CHAPTER 4: RESULTS AND DISCUSSION'), 'results');
  assert.equal(O.chapterNumber('Chapter IV'), 4);
  assert.equal(O.chapterNumber('BAB LIMA'), 5);
  assert.equal(O.titleCase('DATA ANALYSIS USING PLS-SEM'), 'Data Analysis Using PLS-SEM');
  assert.equal(O.titleCase('Mixed Case Stays'), 'Mixed Case Stays');
});

test('PDF lines: running headers and page numbers dropped, wrapped lines joined, headings found', () => {
  const line = (text, y, size) => ({ text, y, size: size || 12 });
  const long = 'Product images are the main evidence that online shoppers use to judge a product they cannot';
  const pages = [
    [line('The Role of Product Images', 800, 9), line('CHAPTER 1', 700, 14), line('INTRODUCTION', 680, 14), line('1.1 Background of the Study', 640), line(long, 620), line('touch, so sellers in Malaysia invest a great deal of time and money in product photogra-', 605), line('phy to build trust.', 590), line(long, 560), line('touch at all.', 545), line('1', 60, 10)],
    [line('The Role of Product Images', 800, 9), line('1.2 Problem Statement', 740), line(long, 720), line('touch before buying.', 705), line('2', 60, 10)],
    [line('The Role of Product Images', 800, 9), line('REFERENCES', 740, 14), line('Hair, J. F., Risher, J. J., Sarstedt, M., & Ringle, C. M. (2019). When to use and how to report', 720), line('the results of PLS-SEM. European Business Review, 31(1), 2–24.', 705), line('Spence, M. (1973). Job market signaling. The Quarterly Journal of Economics, 87(3), 355–374.', 690), line('3', 60, 10)]
  ];
  const blocks = O.pdfBlocks(pages);
  assert.ok(!blocks.some(b => /The Role of Product Images/.test(b.text)), 'running header removed');
  assert.ok(!blocks.some(b => /^\d$/.test(b.text)), 'page numbers removed');
  const r = O.organize({ blocks });
  assert.deepEqual(r.chapters.map(c => c.title), ['Chapter 1: Introduction']);
  assert.deepEqual(r.chapters[0].sections.map(s => s.title), ['1.1 Background of the Study', '1.2 Problem Statement']);
  assert.ok(r.chapters[0].sections[0].content.includes('photography to build trust.'), 'hyphenated word joined');
  assert.equal(r.chapters[0].sections[0].content.split('\n\n').length, 2, 'two paragraphs');
  assert.equal(r.references.length, 2);
  assert.match(r.references[0].apa, /^Hair.*2–24\.$/);
});

test('pasted text with no headings asks for the AI; the AI plan moves whole paragraphs and loses none', () => {
  const text = ['Product images matter for online shoppers because they cannot touch the goods before paying for them online.', 'This study used a questionnaire with 120 respondents from three Malaysian e-commerce platforms in 2026.', 'Signalling theory explains how sellers send quality cues to buyers who lack information about products.', 'The results show that image quality has a significant effect on trust (β = 0.512, p < .001) among the respondents.'].join('\n\n');
  const blocks = O.textBlocks(text);
  const r = O.organize({ blocks });
  assert.equal(r.needsAI, true);
  assert.equal(r.paragraphs.length, 4);
  const plan = { chapters: [
    { title: 'Chapter 1: Introduction', sections: [{ title: '1.1 Background of the Study', paragraphs: [0] }] },
    { title: 'Chapter 2: Literature Review', sections: [{ title: '2.1 Signalling Theory', paragraphs: [2, 2, 99] }] },
    { title: 'Chapter 3: Research Methodology', sections: [{ title: '3.1 Research Design', paragraphs: [1] }] }
  ] };
  const a = O.applyPlan(plan, r.paragraphs, 'en');
  assert.deepEqual(a.chapters.map(c => c.title), ['Chapter 1: Introduction', 'Chapter 2: Literature Review', 'Chapter 3: Research Methodology']);
  assert.equal(a.unplaced, 1);
  const last = a.chapters[2].sections[a.chapters[2].sections.length - 1];
  assert.equal(last.title, 'Not yet arranged');
  assert.match(last.content, /β = 0\.512/);
  const all = a.chapters.flatMap(c => c.sections.map(s => s.content)).join('\n\n');
  for (const p of r.paragraphs) assert.ok(all.includes(p));
});

test('text with markdown headings and tab tables', () => {
  const r = O.organize({ blocks: O.textBlocks('# CHAPTER 1: INTRODUCTION\n\n## 1.1 Background\n\nImages build trust in online stores across Malaysia, especially for clothing and beauty products sold by small sellers.\n\nConstruct\tAVE\nTR\t0.617\nIQ\t0.702') });
  assert.equal(r.chapters[0].title, 'Chapter 1: Introduction');
  assert.ok(r.chapters[0].sections[0].content.endsWith('Construct\tAVE\nTR\t0.617\nIQ\t0.702'));
});

test('the organize route: snippets fit, the AI answer is checked', () => {
  const paras = Array.from({ length: 600 }, (_, i) => 'word '.repeat(200) + i);
  const sn = LO.snippets(paras);
  assert.equal(sn.count, 600);
  assert.ok(sn.text.length <= LO.MAX_CHARS);
  assert.match(sn.text, /^\[0\] word/);
  const c = LO.clean({ chapters: [{ title: 'Chapter 1: Introduction', sections: [{ title: '1.1 Background', paragraphs: [0, 1, '2', 7, 1] }, { title: 'Empty', paragraphs: [] }] }, { title: 'x', sections: [] }] }, 5);
  assert.deepEqual(c, { chapters: [{ title: 'Chapter 1: Introduction', sections: [{ title: '1.1 Background', paragraphs: [0, 1, 2] }] }], placed: 3 });
  assert.match(LO.prompt({ language: 'English', count: 4 }), /exactly one section/);
});

test('a chapter file with sections in Heading 1 and no CHAPTER line becomes one chapter named by topic', () => {
  const P = w => `${w} paragraph explains the quantitative methodology used to study product images on Shopee and Lazada in Malaysia.`;
  const r = O.organize({ blocks: [
    { h: 1, text: '3.1 Introduction' }, { h: 0, text: P('Intro') },
    { h: 1, text: '3.2 Research Design' }, { h: 0, text: P('Design') },
    { h: 2, text: '3.2.1 Quantitative Approach' }, { h: 0, text: P('Approach') },
    { h: 1, text: '3.3 Population and Sampling' }, { h: 0, text: P('Sampling') },
    { h: 1, text: '3.4 Research Instrument' }, { h: 0, text: P('Instrument') }
  ] });
  assert.deepEqual(r.chapters.map(c => c.title), ['Chapter 3: Research Methodology']);
  assert.deepEqual(r.chapters[0].sections.map(s => s.title), ['3.1 Introduction', '3.2 Research Design', '3.3 Population and Sampling', '3.4 Research Instrument']);
  assert.ok(r.chapters[0].sections[1].content.includes('3.2.1 Quantitative Approach'));
  assert.equal(r.needsAI, false);
  // Two chapters in one file, still without CHAPTER lines.
  const two = O.organize({ blocks: [{ h: 1, text: '1.1 Background of the Study' }, { h: 0, text: P('Background') }, { h: 1, text: '1.2 Problem Statement' }, { h: 0, text: P('Problem') }, { h: 1, text: '2.1 Signalling Theory' }, { h: 0, text: P('Theory') }, { h: 1, text: '2.2 Previous Studies' }, { h: 0, text: P('Past') }] });
  assert.deepEqual(two.chapters.map(c => c.title), ['Chapter 1: Introduction', 'Chapter 2: Literature Review']);
  // A Word Title "CHAPTER 3 RESEARCH METHODOLOGY" opens the chapter.
  const titled = O.organize({ title: 'CHAPTER 3 RESEARCH METHODOLOGY', blocks: [{ h: 1, text: '3.1 Introduction' }, { h: 0, text: P('Intro') }] });
  assert.deepEqual(titled.chapters.map(c => c.title), ['Chapter 3: Research Methodology']);
});
