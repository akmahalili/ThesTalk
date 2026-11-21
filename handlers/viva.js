'use strict';
/* POST /api/viva
   { mode: 'questions', title, kind, style, count, language, sections:[{name, content}] } → { questions }
   { mode: 'feedback', kind, style, language, question, why, points, answer, excerpt } → { feedback } */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const V = require('../lib/viva');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 90000);
    const language = V.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const kind = V.KINDS[data.kind] ? data.kind : 'viva';
    const style = V.STYLES[data.style] ? data.style : 'balanced';
    const json0 = { text: { format: { type: 'json_object' } }, provider: pick(req) };
    if (data.mode === 'feedback') {
      const question = cap(data.question, 500).trim(), answer = cap(data.answer, 6000).trim();
      if (!question) return json(res, 400, { error: 'Missing question.' });
      if (answer.split(/\s+/).filter(Boolean).length < 3) return json(res, 400, { error: 'Answer the question first (type or speak).' });
      const points = (Array.isArray(data.points) ? data.points : []).slice(0, 6).map(p => '- ' + cap(p, 240)).join('\n');
      const input = ['QUESTION: ' + question, data.why ? 'EXAMINER IS TESTING: ' + cap(data.why, 240) : '', points ? 'KEY POINTS:\n' + points : '', 'DOCUMENT EXCERPT START', cap(data.excerpt, 8000) || '(none)', 'DOCUMENT EXCERPT END', 'CANDIDATE ANSWER START', answer, 'CANDIDATE ANSWER END'].filter(Boolean).join('\n');
      const feedback = V.cleanFeedback(parseJSONLoose(await askAI(V.feedbackPrompt({ language, style }), input, 1500, json0)));
      if (!feedback) return json(res, 502, { error: 'The AI returned unreadable feedback. Please try again.' });
      return json(res, 200, { feedback, ai: pick(req) });
    }
    const sections = V.readSections(data.sections, 30000);
    const words = sections.reduce((n, s) => n + (s.content.match(/\S+/g) || []).length, 0);
    if (words < 150) return json(res, 400, { error: 'Write more of the thesis first. The examiner asks about your own text.' });
    const count = Math.max(3, Math.min(15, Number(data.count) || 8));
    const input = ['Title: ' + (cap(data.title, 300) || 'Untitled'), 'DOCUMENT START', ...sections.map(s => '## ' + s.name + '\n' + s.content), 'DOCUMENT END'].join('\n');
    const questions = V.cleanQuestions(parseJSONLoose(await askAI(V.questionPrompt({ language, kind, style, count }), input, 3500, json0)), count);
    if (questions.length < 2) return json(res, 502, { error: 'The AI could not write questions from this text. Please try again.' });
    return json(res, 200, { questions, ai: pick(req) });
  } catch (e) {
    return fail(res, e);
  }
};
