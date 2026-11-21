'use strict';
/* POST /api/framework — { title, objectives, questions, language, sections:[{name, content}] } → { framework } */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const F = require('../lib/framework');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 60000);
    const sections = F.readSections(data.sections);
    const objectives = cap(data.objectives, 3000), questions = cap(data.questions, 3000);
    const words = [objectives, questions, ...sections.map(s => s.content)].join(' ').split(/\s+/).filter(Boolean).length;
    if (words < 40) return json(res, 400, { error: 'Write your objectives or the introduction first. The framework is built from your text.' });
    const language = F.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const raw = await askAI(F.instructions(language), F.input({ title: cap(data.title, 300), objectives, questions, sections }),
      2500, { text: { format: { type: 'json_object' } }, provider: pick(req) });
    const framework = F.clean(parseJSONLoose(raw));
    if (!framework) return json(res, 502, { error: 'The AI could not find at least two constructs in your text. Add your objectives or research questions and try again.' });
    return json(res, 200, { framework, ai: pick(req) });
  } catch (e) {
    return fail(res, e);
  }
};
