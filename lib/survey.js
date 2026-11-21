'use strict';
/*
 * Analisis Soal Selidik: the browser computes every number and writes a plain Results draft.
 * The AI may only polish the wording. Every number in the draft must survive unchanged,
 * otherwise the polished text is refused and the student keeps the exact draft.
 */
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));

function instructions(language) {
  return [
    `You polish the Results section of a quantitative thesis chapter. Write in formal academic ${language}, past tense, third person.`,
    'Keep every number, statistic, symbol and percentage exactly as written (for example 0.877, r(118) = .78, p < .001, 65.8%). Do not round, add or remove any number.',
    'Keep the meaning and the order of the findings. Do not add findings, interpretations beyond the text, or citations.',
    'Keep every marker such as [PERLU RUJUKAN] or [SOURCE NEEDED] exactly where it belongs; the student adds those citations later.',
    'Keep the short heading lines (e.g. "Analisis Kebolehpercayaan") as separate lines. Use paragraphs, not bullet points.',
    'Return only the polished text.'
  ].join('\n');
}

/* Numbers as written: 0.877, .78, 65.8, 118, -0.370 … (a thousands comma is not expected in these drafts). */
const numbers = s => (String(s || '').match(/-?\d*\.\d+|-?\d+/g) || []).map(x => x.replace(/^(-?)0+(?=\d)/, '$1'));

function numbersKept(before, after) {
  const need = new Map();
  for (const n of numbers(before)) need.set(n, (need.get(n) || 0) + 1);
  const have = new Map();
  for (const n of numbers(after)) have.set(n, (have.get(n) || 0) + 1);
  const lost = [];
  for (const [n, k] of need) if ((have.get(n) || 0) < k) lost.push(n);
  const added = [];
  for (const [n, k] of have) if ((need.get(n) || 0) < k) added.push(n);
  return { ok: !lost.length && !added.length, lost, added };
}

const markers = s => (String(s || '').match(/\[(?:PERLU RUJUKAN|SOURCE NEEDED)\]/g) || []).length;

module.exports = { instructions, numbersKept, markers, isMalay, numbers };
