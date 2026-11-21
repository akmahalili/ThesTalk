'use strict';
/*
 * Matriks Literatur: read one article's text (extracted from a PDF in the browser), fill a
 * literature-matrix row, confirm the reference details against OpenAlex, and synthesise
 * several rows into themes, gaps and a cited literature-review paragraph.
 */
const { cap } = require('./common');

const FIELDS = ['context', 'theory', 'method', 'sample', 'analysis', 'findings', 'gap', 'relevance'];
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));
const str = (v, n) => cap(typeof v === 'string' ? v : Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v), n).replace(/\s+/g, ' ').trim();

/* Long articles: keep the opening (title, abstract, introduction) and the parts a matrix needs. */
const HEADS = [
  /\n\s*(?:\d+(?:\.\d+)*\.?\s*)?(?:methodology|methods?|research (?:design|method(?:ology)?)|materials and methods|kaedah(?: kajian)?|metodologi)\b[^\n]{0,40}\n/i,
  /\n\s*(?:\d+(?:\.\d+)*\.?\s*)?(?:results?|findings|data analysis|analysis and results|dapatan(?: kajian)?|keputusan)\b[^\n]{0,40}\n/i,
  /\n\s*(?:\d+(?:\.\d+)*\.?\s*)?(?:discussion|perbincangan)\b[^\n]{0,40}\n/i,
  /\n\s*(?:\d+(?:\.\d+)*\.?\s*)?(?:conclusions?|limitations?|future research|implications|kesimpulan|limitasi|cadangan)\b[^\n]{0,60}\n/i
];
function excerpt(text, max = 30000) {
  let t = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  // Drop the reference list: it is long and would only confuse the extraction.
  const ref = t.search(/\n\s*(?:references|bibliography|rujukan|daftar pustaka)\s*\n/i);
  if (ref > t.length * 0.4) t = t.slice(0, ref);
  if (t.length <= max) return t.trim();
  const head = Math.round(max * 0.45);
  const each = Math.floor((max - head) / HEADS.length);
  const parts = [t.slice(0, head)];
  for (const re of HEADS) {
    const at = t.slice(head).search(re);
    if (at >= 0) parts.push('[…]\n' + t.slice(head + at, head + at + each));
  }
  return parts.join('\n').slice(0, max).trim();
}

/* The paper's own DOI is usually on its first page; DOIs later on belong to cited works. */
function firstDoi(text) {
  const m = String(text || '').slice(0, 6000).match(/\b(10\.\d{4,9}\/[^\s"<>]+)/);
  return m ? m[1].replace(/[.,;)\]]+$/, '') : '';
}

function extractInstructions(language) {
  return [
    'You read the text of ONE research article and fill one row of a literature-review matrix.',
    `Write every cell in ${language}, as short academic notes (not full paragraphs). Keep theory names, construct names, statistics and software names exactly as written.`,
    'Use only what the article text says. Never guess. If something is not stated, write "—". Bibliographic fields (title, authors, year, venue, doi) are copied exactly from the article, never translated.',
    'Return JSON only, with these keys:',
    '{"title": string, "authors": [full names in order], "year": string, "venue": journal or conference name, "doi": string,',
    ' "context": country, setting, industry or population (≤ 25 words),',
    ' "theory": theories, models or frameworks used (≤ 25 words),',
    ' "method": approach and design, e.g. quantitative cross-sectional survey, qualitative interviews (≤ 25 words),',
    ' "sample": sample size and who, sampling technique (≤ 25 words),',
    ' "analysis": analysis technique and software, e.g. PLS-SEM using SmartPLS 4 (≤ 20 words),',
    ' "findings": the key results, with the main numbers if given (≤ 60 words),',
    ' "gap": the gap the study fills plus its stated limitations or future research (≤ 50 words),',
    ' "relevance": one sentence on how this study relates to the reader\'s topic, only if a topic is given, else "—"}'
  ].join('\n');
}
function extractInput({ text, fileName, focus }) {
  return [
    focus ? "Reader's topic: " + focus : '',
    fileName ? 'File name: ' + fileName : '',
    'ARTICLE TEXT START',
    excerpt(text),
    'ARTICLE TEXT END'
  ].filter(Boolean).join('\n');
}
function cleanRow(obj, text) {
  if (!obj || typeof obj !== 'object') return null;
  const row = {
    title: str(obj.title, 400),
    authors: (Array.isArray(obj.authors) ? obj.authors : String(obj.authors || '').split(/;|\s&\s|\sand\s/)).map(a => str(a, 120)).filter(a => a && a !== '—').slice(0, 25),
    year: (String(obj.year || '').match(/\b(19|20)\d{2}\b/) || [''])[0],
    venue: str(obj.venue, 300).replace(/^—$/, ''),
    doi: str(obj.doi, 200).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^—$/, '')
  };
  if (!/^10\.\d{4,9}\//.test(row.doi)) row.doi = firstDoi(text);
  FIELDS.forEach(k => { row[k] = str(obj[k], k === 'findings' ? 700 : 450) || '—'; });
  if (!row.title && FIELDS.every(k => row[k] === '—')) return null;
  return row;
}

/* Synthesis across rows. Rows arrive numbered 1..n and the model cites them by number. */
function synthInstructions(language) {
  return [
    'You are helping a PhD student write a literature review from their literature matrix.',
    `Write in ${language}, formal academic style.`,
    'Each study is numbered. Cite studies ONLY by their numbers in square brackets, e.g. [2] or [1][4]. Never write author names or years yourself and never cite a number that is not in the list.',
    'Synthesise across studies (agreements, contradictions, patterns in theory, method and context). Do not summarise the studies one by one.',
    'Use only what the matrix says. Do not invent findings.',
    'Return JSON only:',
    '{"themes": [{"name": short theme name, "note": one or two sentences, "papers": [numbers]}] (3 to 6 themes),',
    ' "gaps": [3 to 5 research gaps the matrix shows, each one sentence, citing numbers where useful],',
    ' "synthesis": 2 to 4 paragraphs of literature-review text separated by blank lines, citing numbers}'
  ].join('\n');
}
function synthInput({ rows, focus }) {
  return [
    focus ? 'Topic of the review: ' + focus : '',
    'STUDIES:',
    ...rows.map(r => `[${r.n}] ${r.title} (${r.year || 'n.d.'})\n  Context: ${r.context}\n  Theory: ${r.theory}\n  Method: ${r.method}; Sample: ${r.sample}; Analysis: ${r.analysis}\n  Findings: ${r.findings}\n  Gap/limitations: ${r.gap}`)
  ].filter(Boolean).join('\n');
}
function readRows(list) {
  return (Array.isArray(list) ? list : []).slice(0, 40).map((r, i) => {
    const row = { n: i + 1, title: str(r && r.title, 300), year: str(r && r.year, 10), authors: (Array.isArray(r && r.authors) ? r.authors : []).map(a => str(a, 120)).filter(Boolean).slice(0, 25),
      venue: str(r && r.venue, 300), volume: str(r && r.volume, 20), issue: str(r && r.issue, 20), pages: str(r && r.pages, 40), doi: str(r && r.doi, 200) };
    FIELDS.forEach(k => { row[k] = str(r && r[k], 500) || '—'; });
    return row;
  }).filter(r => r.title);
}
function cleanSynth(obj, max) {
  if (!obj || typeof obj !== 'object') return null;
  const nums = v => (Array.isArray(v) ? v : []).map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= max);
  const themes = (Array.isArray(obj.themes) ? obj.themes : []).map(t => ({ name: str(t && t.name, 120), note: str(t && t.note, 500), papers: [...new Set(nums(t && t.papers))] })).filter(t => t.name).slice(0, 8);
  const gaps = (Array.isArray(obj.gaps) ? obj.gaps : []).map(g => str(g, 500)).filter(Boolean).slice(0, 8);
  const synthesis = typeof obj.synthesis === 'string' ? obj.synthesis.trim().slice(0, 12000) : '';
  if (!synthesis && !themes.length) return null;
  return { themes, gaps, synthesis };
}

module.exports = { FIELDS, excerpt, firstDoi, extractInstructions, extractInput, cleanRow, synthInstructions, synthInput, readRows, cleanSynth, isMalay, cap };
