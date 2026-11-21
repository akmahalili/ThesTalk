'use strict';
/* "Format Tesis UiTM": the IPSis 2026 layout in the generated Word parts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../public/thesisdocx.js');

const P = 'Product images are the main evidence that online shoppers use (Hair et al., 2019). Partial Least Squares Structural Equation Modelling (PLS-SEM) was used. ';
const state = lang => ({ project: { title: 'The Role of Product Images', language: lang },
  chapters: [
    { title: 'Chapter 1: Introduction', sections: [{ title: '1.1 Background of the Study', content: P + '\n1.1.1 Online Shopping\n' + P + '\n- point one [PERLU RUJUKAN]\nH1: Image quality affects trust.' }] },
    { title: 'Chapter 2: Literature Review', sections: [{ title: 'Conceptual Framework', content: '[Rajah: Kerangka Konseptual]\nRajah 2.1: kerangka konseptual kajian\nFigure 2.1 shows the model.' }] },
    { title: 'Chapter 3: Method', sections: [{ title: '3.1 Design', content: '' }] },
    { title: 'Chapter 4: Findings', sections: [{ title: '4.1 Profile', content: 'Table 4.1: Profile by gender\nCategory\tn\t%\nFemale\t79\t65.8\nMale\t41\t34.2' }] }],
  references: [{ apa: 'Spence, M. (1973). Job market signaling. The Quarterly Journal of Economics, 87(3), 355–374.', venue: 'The Quarterly Journal of Economics' }, { apa: 'Hair, J. F. (2019). PLS-SEM. European Business Review, 31(1), 2–24.', venue: 'European Business Review' }] });
const fmt = { name: 'Nur Akma Halili', studentId: '2023123456', degree: 'Doctor of Philosophy', faculty: 'College of Creative Arts', month: 'December 2026', abstract: 'This study examines images.', ack: 'Thank you.', abbreviations: 'PLS-SEM = Partial Least Squares Structural Equation Modelling' };
const part = (out, name) => out.files.find(f => f[0] === name)[1];

test('page setup, styles and numbering follow IPSis 2026', () => {
  const out = D.build(state('English'), fmt, { figures: { framework: { bytes: new Uint8Array([1, 2, 3]), width: 1000, height: 400 } } });
  const doc = part(out, 'word/document.xml'), styles = part(out, 'word/styles.xml');
  assert.match(doc, /<w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="2155"/); // 2.5 cm and 3.8 cm
  assert.match(doc, /<w:pgNumType w:fmt="lowerRoman" w:start="1"\/><w:titlePg\/>/);
  assert.match(doc, /<w:pgNumType w:fmt="decimal" w:start="1"\/>/);
  assert.match(styles, /w:ascii="Times New Roman"[^>]*\/><w:sz w:val="24"\/>/);
  assert.match(styles, /w:styleId="BodyText">.*?<w:spacing w:after="0" w:line="360" w:lineRule="auto"\/><w:ind w:firstLine="720"\/><w:jc w:val="both"\/>/);
  assert.match(styles, /w:styleId="Reference">.*?<w:ind w:left="720" w:hanging="720"\/>/);
  assert.match(part(out, 'word/settings.xml'), /<w:updateFields w:val="true"\/>/);
  assert.match(part(out, 'word/footer1.xml'), /<w:jc w:val="center"\/>.*PAGE/);
});

test('preliminary pages, chapters, captions, tables, figure and references', () => {
  const out = D.build(state('English'), fmt, { figures: { framework: { bytes: new Uint8Array([1, 2, 3]), width: 1000, height: 400 } } });
  const doc = part(out, 'word/document.xml');
  const text = doc.replace(/<w:instrText[^>]*>[^<]*<\/w:instrText>/g, '').replace(/<[^>]+>/g, '');
  for (const s of ['UNIVERSITI TEKNOLOGI MARA', 'THE ROLE OF PRODUCT IMAGES', 'NUR AKMA HALILI', 'Thesis submitted in fulfilment', 'of the requirements for the degree of', "AUTHOR'S DECLARATION", 'Student I.D. No.', 'ABSTRACT', 'ACKNOWLEDGEMENT', 'TABLE OF CONTENTS', 'LIST OF TABLES', 'LIST OF FIGURES', 'LIST OF ABBREVIATIONS', 'CHAPTER 1', 'INTRODUCTION', '2.1 Conceptual Framework', 'REFERENCES']) assert.ok(text.includes(s), s);
  assert.ok(!text.includes('ABSTRAK'), 'no Malay abstract page for an English thesis without one');
  assert.ok(!text.includes('CHAPTER 3'), 'empty chapters are left out');
  assert.match(doc, /TC "CHAPTER 4: FINDINGS" \\l 1/);
  assert.match(doc, /TOC \\o "2-3" \\f \\l "1-1" \\h \\z/);
  assert.match(doc, /TC "Rajah 2\.1 Kerangka Konseptual Kajian" \\f F \\l 1/);
  assert.match(doc, /TC "Table 4\.1 Profile by Gender" \\f T \\l 1/);
  assert.ok(!/TC "Figure 2\.1 Shows/.test(doc), 'a sentence that starts with "Figure 2.1 shows" is not a caption');
  assert.match(doc, /<w:tbl>.*<w:tblHeader\/>.*Female.*65\.8.*<\/w:tbl>/);
  assert.match(doc, /r:embed="rIdFw"/);
  assert.match(doc, /<w:highlight w:val="yellow"\/>.*\[PERLU RUJUKAN\]/);
  assert.match(doc, /w:styleId|w:pStyle w:val="Heading3"/);
  assert.ok(doc.indexOf('Hair, J. F.') < doc.indexOf('Spence, M.'), 'references sorted');
  assert.match(doc, /<w:i\/><w:iCs\/><\/w:rPr><w:t xml:space="preserve">European Business Review, 31<\/w:t>/);
  assert.ok(out.files.some(f => f[0] === 'word/media/kerangka.png'));
  assert.deepEqual([out.stats.chapters, out.stats.refs, out.stats.tables, out.stats.figures], [3, 2, 1, 1]);
});

test('a Malay thesis has both abstracts, Malay labels, BAB headings', () => {
  const out = D.build(state('Bahasa Melayu'), { ...fmt, abstrak: 'Kajian ini meneliti imej.', confirm: true, vivaDate: '15 Jun 2027' }, {});
  const text = part(out, 'word/document.xml').replace(/<w:instrText[^>]*>[^<]*<\/w:instrText>/g, '').replace(/<[^>]+>/g, '');
  for (const s of ['PENGESAHAN PANEL PEMERIKSA', 'PERAKUAN PENGARANG', 'ABSTRAK', 'ABSTRACT', 'PENGHARGAAN', 'ISI KANDUNGAN', 'BAB 1', 'RUJUKAN', 'Tesis dikemukakan bagi memenuhi', '15 Jun 2027']) assert.ok(text.includes(s), s);
  assert.ok(text.indexOf('ABSTRAK') < text.indexOf('ABSTRACT'), 'Malay abstract first');
  assert.ok(!part(out, 'word/_rels/document.xml.rels').includes('kerangka.png'), 'no image without the PNG');
});

test('findAbbreviations and caption parsing', () => {
  assert.deepEqual(D.findAbbreviations('The Institute of Postgraduate Studies (IPSis) and Partial Least Squares Structural Equation Modelling (PLS-SEM) and the theory of planned behaviour (TPB) and (UiTM).'),
    ['IPSis = Institute of Postgraduate Studies', 'PLS-SEM = Partial Least Squares Structural Equation Modelling']);
  assert.deepEqual(D.caption('Jadual 4.2: Min konstruk'), { kind: 'T', label: 'Jadual 4.2', title: 'Min konstruk' });
  assert.equal(D.caption('Figure 4.1 shows the means.'), null);
  assert.equal(D.chapterTitle('Bab 2: Kajian Literatur', 2), 'KAJIAN LITERATUR');
});
