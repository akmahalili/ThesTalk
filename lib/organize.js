'use strict';
/*
 * Import Tesis, "Susun ikut topik": a draft with no clear chapter or section headings is grouped by
 * topic into thesis chapters and sections. The AI sees only the opening words of each paragraph
 * (numbered) and returns which paragraphs go into which section; the app then moves the full
 * paragraphs itself, so the student's own words are never rewritten.
 */
const { cap } = require('./common');

const MAX_PARAS = 600, MAX_CHARS = 60000;
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));
const str = (v, n) => cap(typeof v === 'string' ? v : v == null ? '' : String(v), n).replace(/\s+/g, ' ').trim();

/* Opening words of each paragraph, shortened evenly so the whole list fits. */
function snippets(list) {
  const paras = (Array.isArray(list) ? list : []).slice(0, MAX_PARAS).map(p => str(p, 2000));
  let each = 40;
  const build = () => paras.map((p, i) => { const w = p.split(' '); return `[${i}] ${w.slice(0, each).join(' ')}${w.length > each ? ' …' : ''}`; }).join('\n');
  let text = build();
  while (text.length > MAX_CHARS && each > 8) { each -= 6; text = build(); }
  return { text: cap(text, MAX_CHARS), count: paras.length };
}

function prompt({ language, count }) {
  return [
    `You arrange a Malaysian postgraduate thesis draft by topic. You get ${count} numbered paragraphs (only their opening words).`,
    'Group them into the usual thesis chapters, in this order, using only the chapters the text has: Introduction; Literature Review; Research Methodology; Findings (or Results); Discussion; Conclusion and Recommendations.',
    'Inside each chapter, group paragraphs into sections with the usual numbered headings, for example 1.1 Background of the Study, 1.2 Problem Statement, 1.3 Research Objectives, 1.4 Research Questions, 1.5 Significance of the Study, 1.6 Scope of the Study, 2.1 …, 3.1 Research Design, 3.2 Population and Sampling, 3.3 Research Instrument, 3.4 Data Collection, 3.5 Data Analysis, 4.1 Respondent Profile …',
    `Write chapter and section titles in ${language}. Chapter titles look like "Chapter 1: Introduction" (or "Bab 1: Pengenalan" in Malay).`,
    'Put every paragraph number in exactly one section. Keep paragraphs that belong together (a table, a list, a paragraph that continues the previous one) in the same section. A section may take paragraphs from different parts of the draft when they are on the same topic; keep their original order.',
    'Leave out empty sections. Do not invent text.',
    'Return JSON only: {"chapters":[{"title":"Chapter 1: Introduction","sections":[{"title":"1.1 Background of the Study","paragraphs":[0,1,2]}]}]}'
  ].join('\n');
}

function clean(raw, count) {
  const chapters = [];
  const seen = new Set();
  for (const c of Array.isArray(raw && raw.chapters) ? raw.chapters.slice(0, 10) : []) {
    const sections = [];
    for (const s of Array.isArray(c && c.sections) ? c.sections.slice(0, 25) : []) {
      const paragraphs = [];
      for (const v of Array.isArray(s && s.paragraphs) ? s.paragraphs : []) { const n = Number(v); if (Number.isInteger(n) && n >= 0 && n < count && !seen.has(n)) { seen.add(n); paragraphs.push(n); } }
      if (paragraphs.length) sections.push({ title: str(s.title, 200) || 'Section', paragraphs });
    }
    if (sections.length) chapters.push({ title: str(c.title, 200) || 'Chapter ' + (chapters.length + 1), sections });
  }
  return { chapters, placed: seen.size };
}

module.exports = { MAX_PARAS, MAX_CHARS, isMalay, snippets, prompt, clean };
