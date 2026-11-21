'use strict';
/* POST /api/survey — { text, language } → { text } — polish the wording of a Results draft, numbers untouched. */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const V = require('../lib/survey');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 40000);
    const text = cap(data.text, 20000).trim();
    if (text.split(/\s+/).length < 30) return json(res, 400, { error: 'The Results draft is too short to polish.' });
    const language = V.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const out = String(await askAI(V.instructions(language), text, 4000, { provider: pick(req) }) || '').replace(/^```[a-z]*\n?|\n?```$/g, '').trim();
    const check = V.numbersKept(text, out);
    if (!out || !check.ok || V.markers(out) < V.markers(text)) {
      return json(res, 422, { error: 'The AI changed some numbers or markers, so the exact draft was kept.', lost: check.lost.slice(0, 10), added: check.added.slice(0, 10) });
    }
    return json(res, 200, { text: out, ai: pick(req) });
  } catch (e) {
    return fail(res, e);
  }
};
