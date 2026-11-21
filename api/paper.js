'use strict';
/*
 * POST /api/paper — AI help for journal articles ("Jurnal & Paper").
 *   mode "meta": structured abstract, five title options and six keywords from the draft.
 *   mode "fit":  what to fix before submitting to the chosen target journal, by priority.
 * Word and reference counts are computed here, not by the model.
 */
const { json, protect, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const P = require('../lib/paper');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 70000);
    const mode = data.mode === 'fit' ? 'fit' : data.mode === 'meta' ? 'meta' : '';
    if (!mode) return json(res, 400, { error: 'Unknown mode.' });
    const paper = P.readPaper(data.paper);
    if (paper.stats.words < 30 && paper.title.length < 10) return json(res, 400, { error: 'Write a title and at least a few paragraphs first.' });
    const ai = pick(req);
    const json_mode = { text: { format: { type: 'json_object' } }, provider: ai };

    if (mode === 'meta') {
      const raw = await askAI(P.metaInstructions(paper.language), P.paperText(paper, 30000), 1100, json_mode);
      const meta = P.cleanMeta(parseJSONLoose(raw));
      if (!meta) return json(res, 502, { error: 'AI returned an unreadable answer. Please try again.' });
      return json(res, 200, { meta, ai });
    }

    const target = P.readTarget(data.target);
    const input = P.targetText(target) + '\n\n' + P.statsText(paper) + '\n\n' + P.paperText(paper);
    const raw = await askAI(P.fitInstructions(data.uiLang === 'en' ? 'en' : 'ms'), input, 1500, json_mode);
    const fit = P.cleanFit(parseJSONLoose(raw));
    if (!fit) return json(res, 502, { error: 'AI returned an unreadable answer. Please try again.' });
    return json(res, 200, { fit, stats: paper.stats, target: target ? target.name : null, ai });
  } catch (e) {
    return fail(res, e);
  }
};
