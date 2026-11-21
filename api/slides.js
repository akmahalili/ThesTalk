'use strict';
/* POST /api/slides — { title, kind, minutes, language, audience, presenter, sections:[{name, content}] } → { deck } */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const D = require('../lib/slides');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 90000);
    const sections = D.readSections(data.sections);
    const words = sections.reduce((n, s) => n + (s.content.match(/\S+/g) || []).length, 0);
    if (words < 80) return json(res, 400, { error: 'Write at least a few paragraphs first. Slides are made from your text.' });
    const kind = D.KINDS[data.kind] ? data.kind : 'conference';
    const minutes = Math.max(5, Math.min(45, Number(data.minutes) || 15));
    const language = D.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const raw = await askAI(D.instructions({ language, kind, minutes }),
      D.input({ title: cap(data.title, 300) || 'Untitled', kind, minutes, audience: cap(data.audience, 200), presenter: cap(data.presenter, 200), sections }),
      5000, { text: { format: { type: 'json_object' } }, provider: pick(req) });
    const deck = D.clean(parseJSONLoose(raw));
    if (!deck) return json(res, 502, { error: 'AI returned an unreadable outline. Please try again.' });
    return json(res, 200, { deck, ai: pick(req) });
  } catch (e) {
    return fail(res, e);
  }
};
