'use strict';
/* POST /api/organize { paragraphs: [text], language } → { chapters: [{ title, sections: [{ title, paragraphs: [index] }] }], placed } */
const { json, protect, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const O = require('../lib/organize');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 400000);
    const list = Array.isArray(data.paragraphs) ? data.paragraphs : [];
    if (list.length < 3) return json(res, 400, { error: 'There is too little text to arrange.' });
    if (list.length > O.MAX_PARAS) return json(res, 413, { error: `Too many paragraphs to arrange at once (over ${O.MAX_PARAS}). Import a file with chapter headings, or arrange one chapter at a time.` });
    const language = O.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const sn = O.snippets(list);
    const raw = parseJSONLoose(await askAI(O.prompt({ language, count: sn.count }), 'PARAGRAPHS START\n' + sn.text + '\nPARAGRAPHS END', 4000, { text: { format: { type: 'json_object' } }, provider: pick(req) }));
    const out = O.clean(raw, sn.count);
    if (!out.chapters.length) return json(res, 502, { error: 'The AI could not arrange this text. Please try again.' });
    return json(res, 200, Object.assign(out, { ai: pick(req) }));
  } catch (e) {
    return fail(res, e);
  }
};
