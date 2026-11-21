'use strict';
/*
 * Kerangka konseptual: ask the AI to propose constructs and hypothesised paths from the researcher's
 * own text (title, objectives, research questions, chapters). The browser draws and edits the result.
 */
const { cap } = require('./common');

const ROLES = ['iv', 'med', 'mod', 'dv', 'ctrl'];
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));
const str = (v, n) => cap(typeof v === 'string' ? v : v == null ? '' : String(v), n).replace(/\s+/g, ' ').trim();

function instructions(language) {
  return [
    'You help a postgraduate student draw the conceptual framework of a quantitative study.',
    `Write construct names in ${language}, short (2 to 5 words), as used in the student's text.`,
    'Use only constructs, relationships and dimensions that the text states or clearly implies (objectives, research questions, hypotheses, literature). Never add a construct the text does not mention.',
    'Roles: "iv" independent variable, "med" mediator, "mod" moderator, "dv" dependent variable, "ctrl" control variable.',
    'Each construct may list "items": its dimensions or sub-constructs named in the text (at most 6); otherwise an empty list.',
    '"paths" are hypothesised direct effects between construct names, with "sign" "+" or "-" (use "-" only when the text expects a negative effect).',
    '"mods" are moderations: {"by": moderator name, "from": path start, "to": path end}, and that path must also be in "paths".',
    '"theory": the underpinning theory named in the text, with its citation only if the text gives one; empty string if none is named.',
    'Return JSON only: {"theory": string, "constructs": [{"name", "role", "items": []}], "paths": [{"from", "to", "sign"}], "mods": [{"by", "from", "to"}], "note": one short sentence on anything unclear, in the same language}'
  ].join('\n');
}

function input({ title, objectives, questions, sections }) {
  return [
    'Study title: ' + (title || '-'),
    objectives ? 'Objectives:\n' + objectives : '',
    questions ? 'Research questions:\n' + questions : '',
    'TEXT START',
    ...sections.map(s => '## ' + s.name + '\n' + s.content),
    'TEXT END'
  ].filter(Boolean).join('\n');
}

function readSections(v) {
  let left = 24000;
  const out = [];
  for (const s of Array.isArray(v) ? v.slice(0, 40) : []) {
    const content = cap(s && s.content, Math.max(0, left)).trim();
    if (!content) continue;
    left -= content.length;
    out.push({ name: str(s.name, 120) || 'Section', content });
    if (left <= 0) break;
  }
  return out;
}

/* Keep only well-formed parts and give them ids the browser can use. */
function clean(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const constructs = [], byName = new Map();
  for (const c of Array.isArray(raw.constructs) ? raw.constructs.slice(0, 12) : []) {
    const name = str(c && c.name, 80);
    if (!name || byName.has(name.toLowerCase())) continue;
    const id = 'c' + (constructs.length + 1);
    byName.set(name.toLowerCase(), id);
    constructs.push({ id, name, role: ROLES.includes(c.role) ? c.role : 'iv', items: (Array.isArray(c.items) ? c.items : []).map(x => str(x, 80)).filter(Boolean).slice(0, 6) });
  }
  if (constructs.length < 2) return null;
  const idOf = n => byName.get(str(n, 80).toLowerCase());
  const paths = [], seen = new Set();
  for (const p of Array.isArray(raw.paths) ? raw.paths.slice(0, 30) : []) {
    const from = idOf(p && p.from), to = idOf(p && p.to);
    if (!from || !to || from === to || seen.has(from + '>' + to)) continue;
    seen.add(from + '>' + to);
    paths.push({ id: 'p' + (paths.length + 1), from, to, sign: p.sign === '-' ? '-' : '+' });
  }
  const mods = [];
  for (const m of Array.isArray(raw.mods) ? raw.mods.slice(0, 10) : []) {
    const by = idOf(m && m.by), from = idOf(m && m.from), to = idOf(m && m.to);
    const p = paths.find(x => x.from === from && x.to === to);
    if (!by || !p || by === from || by === to || mods.some(x => x.by === by && x.path === p.id)) continue;
    mods.push({ id: 'm' + (mods.length + 1), by, path: p.id });
    const c = constructs.find(x => x.id === by);
    if (c.role !== 'mod') c.role = 'mod';
  }
  return { theory: str(raw.theory, 160), mediation: true, constructs, paths, mods, note: str(raw.note, 300) };
}

module.exports = { instructions, input, readSections, clean, isMalay, ROLES };
