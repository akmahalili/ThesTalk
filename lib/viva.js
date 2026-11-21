'use strict';
/*
 * Latihan Viva: an AI examiner asks questions grounded in the student's own thesis or paper,
 * then gives feedback on each spoken or typed answer (score, what was missing, a model answer
 * built from the thesis, and a follow-up question).
 */
const { cap } = require('./common');

const KINDS = {
  proposal: 'proposal defence (the study is planned; probe the problem, gap, framework, method and feasibility)',
  viva: 'final viva voce (the study is complete; probe contribution, method, analysis, findings, limitations and implications)',
  conference: 'question time after a conference presentation (short, sharp questions on method, findings and relevance)'
};
const STYLES = {
  supportive: 'a supportive examiner who is kind but still checks real understanding',
  balanced: 'a balanced examiner who is fair, specific and probing',
  tough: 'a rigorous external examiner who challenges assumptions, asks for justification and looks for weaknesses'
};
const AREAS = ['contribution', 'problem', 'literature', 'theory', 'method', 'sampling', 'analysis', 'findings', 'limitations', 'implications', 'general'];
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));
const str = (v, n) => cap(typeof v === 'string' ? v : v == null ? '' : String(v), n).replace(/\s+/g, ' ').trim();
const list = (v, n, each) => (Array.isArray(v) ? v : []).map(x => str(x, each)).filter(Boolean).slice(0, n);

function readSections(v, limit) {
  let left = limit || 30000;
  const out = [];
  for (const s of Array.isArray(v) ? v.slice(0, 60) : []) {
    const content = cap(s && s.content, Math.max(0, Math.min(left, 6000))).trim();
    if (!content) continue;
    left -= content.length;
    out.push({ name: str(s.name, 120) || 'Section', content });
    if (left <= 0) break;
  }
  return out;
}

function questionPrompt({ language, kind, style, count }) {
  return [
    `You are ${STYLES[style] || STYLES.balanced} at a Malaysian university, preparing for a ${KINDS[kind] || KINDS.viva}.`,
    `Read the candidate's document and write ${count} questions in ${language} that an examiner would really ask about THIS study: name its constructs, theory, sample, instrument, analysis and findings where relevant. No generic textbook questions.`,
    `Cover different areas, chosen from: ${AREAS.slice(0, -1).join(', ')}. Order them as a real session flows: start with an opening question (e.g. summarise the study or its contribution), end with limitations or implications.`,
    'For each question give:',
    '- "area": one of the areas above',
    '- "q": the question, spoken style, at most 35 words',
    '- "why": what the examiner is testing, at most 20 words',
    '- "points": 3 to 5 short points a strong answer covers, taken from the document; when the document does not cover something an examiner expects, write that point and end it with " (not in the document)"',
    '- "source": the section name of the document the question draws on most',
    'Return JSON only: {"questions": [{"area", "q", "why", "points", "source"}]}'
  ].join('\n');
}

function feedbackPrompt({ language, style }) {
  return [
    `You are ${STYLES[style] || STYLES.balanced} giving feedback on one viva answer. Write in ${language}, addressed to the candidate as "anda" / "you".`,
    'Judge the answer against the question, the key points and the document excerpt. Reward a clear, direct, justified answer; a short answer that covers the key points is good. Spoken answers may have filler words; ignore them.',
    'Score 1 to 5: 1 = does not answer, 2 = weak, 3 = adequate, 4 = good, 5 = excellent.',
    '"better" is a model answer the candidate could say, first person, at most 120 words, using only facts in the document excerpt and key points. Never invent numbers, results or citations; if a fact is missing, say what the candidate should check.',
    '"followUp" is one probing follow-up question the examiner would ask next, or "" if the answer was complete.',
    'Return JSON only: {"score": 1-5, "verdict": one sentence, "strengths": up to 3 short points, "missing": up to 3 short points, "better": string, "followUp": string}'
  ].join('\n');
}

function cleanQuestions(raw, count) {
  const qs = (raw && Array.isArray(raw.questions) ? raw.questions : []).map(q => ({
    area: AREAS.includes(q && q.area) ? q.area : 'general',
    q: str(q && q.q, 400),
    why: str(q && q.why, 200),
    points: list(q && q.points, 5, 220),
    source: str(q && q.source, 160)
  })).filter(q => q.q.length > 8);
  return qs.slice(0, count || 15);
}

function cleanFeedback(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const n = Math.round(Number(raw.score));
  if (!Number.isFinite(n) || n < 1) return null;
  const score = Math.min(5, n);
  return { score, verdict: str(raw.verdict, 300), strengths: list(raw.strengths, 3, 220), missing: list(raw.missing, 3, 220), better: cap(String(raw.better || ''), 1200).trim(), followUp: str(raw.followUp, 400) };
}

module.exports = { KINDS, STYLES, AREAS, isMalay, readSections, questionPrompt, feedbackPrompt, cleanQuestions, cleanFeedback };
