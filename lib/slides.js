'use strict';
/*
 * Slaid pembentangan: turn a thesis or a journal paper into a presentation outline.
 * The model returns slides of a few fixed layouts (short text, numbers only from the source,
 * a picture idea per slide and speaker notes); the browser previews them and builds the .pptx.
 */
const { cap } = require('./common');

const KINDS = {
  proposal: 'Proposal defence: background, problem statement, objectives and research questions, literature and gap, theory and framework, methodology, expected contribution, timeline.',
  viva: 'Viva / final defence: background, problem, objectives, framework, methodology, key findings, discussion, contributions (theoretical and practical), limitations and future research, conclusion.',
  conference: 'Conference presentation: why it matters and the gap, purpose, method, key findings, implications, conclusion.',
  progress: 'Progress report to supervisors: aim of the study, what is done, current chapter, problems faced, next steps and timeline.',
  lecture: 'Class lecture for students: learning outcomes, key ideas with examples, a short activity or question, summary.'
};
const LAYOUTS = ['title', 'section', 'bullets', 'stats', 'framework', 'compare', 'image', 'end'];
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));
const str = (v, n) => cap(typeof v === 'string' ? v : v == null ? '' : String(v), n).replace(/\s+/g, ' ').trim();
const list = (v, n, each) => (Array.isArray(v) ? v : []).map(x => str(x, each)).filter(Boolean).slice(0, n);

function count(minutes) {
  const m = Math.max(5, Math.min(45, Number(minutes) || 15));
  return Math.max(7, Math.min(24, Math.round(m * 0.9)));
}

function instructions({ language, kind, minutes }) {
  const n = count(minutes);
  return [
    'You turn a research document into a presentation outline.',
    `Write in ${language}. Formal but spoken style: short phrases, never paragraphs. One idea per slide.`,
    `Presentation: ${KINDS[kind] || KINDS.conference} About ${minutes} minutes, so make ${n} slides (± 2).`,
    'The audience understands faster with pictures, so lean on visuals: prefer "image", "stats", "framework" and "compare" layouts where they fit, and give every slide a concrete picture idea.',
    'Use only facts, numbers and names that appear in the document. Never invent results. If the document has no findings yet, present expected outcomes as plans.',
    'Keep in-text citations only when they appear in the document, copied exactly, e.g. (Hair et al., 2019).',
    'Layouts and their fields (every slide also has "imageHint": a concrete picture or visual to show, ≤ 15 words, and "notes": what the presenter says, 2 to 4 sentences):',
    '- "title": {"title", "subtitle"} — first slide only.',
    '- "section": {"title": short label, "statement": one strong sentence ≤ 20 words}',
    '- "bullets": {"title", "bullets": 3 to 5 lines, each ≤ 12 words}',
    '- "stats": {"title", "stats": [{"value": number exactly as in the document, "label": ≤ 6 words}] 2 to 4 items}',
    '- "framework": {"title", "nodes": 2 to 6 short construct names, "links": [{"from": node, "to": node, "label": optional e.g. H1}]}',
    '- "compare": {"title", "left": {"heading", "bullets": 2 to 4}, "right": {"heading", "bullets": 2 to 4}}',
    '- "image": {"title", "caption": ≤ 20 words} — a slide built around one picture.',
    '- "end": {"title", "subtitle"} — last slide only (thank you and questions).',
    'Return JSON only: {"title": presentation title, "subtitle": string, "slides": [{"layout": ..., ...fields, "imageHint": ..., "notes": ...}]}'
  ].join('\n');
}

function input({ title, kind, minutes, audience, presenter, sections }) {
  return [
    'Document title: ' + title,
    presenter ? 'Presenter: ' + presenter : '',
    audience ? 'Audience: ' + audience : '',
    'Presentation type: ' + kind + ', ' + minutes + ' minutes',
    'DOCUMENT START',
    ...sections.map(s => '## ' + s.name + '\n' + s.content),
    'DOCUMENT END'
  ].filter(Boolean).join('\n');
}

/* Fit the document into the prompt: every section keeps its opening, long ones are trimmed. */
function readSections(raw, max = 42000) {
  const secs = (Array.isArray(raw) ? raw : []).map(s => ({ name: str(s && s.name, 160), content: String((s && s.content) || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim() }))
    .filter(s => s.content).slice(0, 60);
  const total = secs.reduce((n, s) => n + s.content.length, 0);
  if (total <= max) return secs;
  const share = Math.floor(max / secs.length);
  // Short sections keep everything; the space they leave goes to the long ones.
  const short = secs.filter(s => s.content.length <= share);
  const spare = max - short.reduce((n, s) => n + s.content.length, 0);
  const longN = secs.length - short.length;
  const each = longN ? Math.floor(spare / longN) : share;
  return secs.map(s => (s.content.length <= share ? s : { name: s.name, content: s.content.slice(0, each) + ' […]' }));
}

function cleanSlide(s, i, total) {
  if (!s || typeof s !== 'object') return null;
  let layout = LAYOUTS.includes(s.layout) ? s.layout : 'bullets';
  if (layout === 'title' && i > 0) layout = 'section';
  const out = { layout, title: str(s.title, 140), imageHint: str(s.imageHint, 160), notes: str(s.notes, 1200) };
  if (layout === 'title' || layout === 'end') out.subtitle = str(s.subtitle, 200);
  if (layout === 'section') { out.statement = str(s.statement || s.subtitle, 220); if (!out.statement && !out.title) return null; }
  if (layout === 'bullets') { out.bullets = list(s.bullets, 6, 160); if (!out.bullets.length) return null; }
  if (layout === 'stats') {
    out.stats = (Array.isArray(s.stats) ? s.stats : []).map(x => ({ value: str(x && x.value, 24), label: str(x && x.label, 80) })).filter(x => x.value).slice(0, 4);
    if (out.stats.length < 2) { out.layout = 'bullets'; out.bullets = out.stats.map(x => x.value + ' ' + x.label); delete out.stats; if (!out.bullets.length) return null; }
  }
  if (layout === 'framework') {
    out.nodes = [...new Set(list(s.nodes, 6, 60))];
    const has = new Set(out.nodes);
    out.links = (Array.isArray(s.links) ? s.links : []).map(l => ({ from: str(l && l.from, 60), to: str(l && l.to, 60), label: str(l && l.label, 20) }))
      .filter(l => has.has(l.from) && has.has(l.to) && l.from !== l.to).slice(0, 10);
    if (out.nodes.length < 2) return null;
  }
  if (layout === 'compare') {
    const side = v => ({ heading: str(v && v.heading, 60), bullets: list(v && v.bullets, 4, 140) });
    out.left = side(s.left); out.right = side(s.right);
    if (!out.left.bullets.length || !out.right.bullets.length) return null;
  }
  if (layout === 'image') out.caption = str(s.caption, 200);
  if (layout === 'end' && i < total - 1) out.layout = 'section';
  return out;
}

function clean(obj) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.slides)) return null;
  const raw = obj.slides.slice(0, 30);
  const slides = raw.map((s, i) => cleanSlide(s, i, raw.length)).filter(Boolean);
  if (slides.length < 3) return null;
  return { title: str(obj.title, 200), subtitle: str(obj.subtitle, 240), slides };
}

module.exports = { KINDS, LAYOUTS, count, instructions, input, readSections, clean, isMalay, cap };
