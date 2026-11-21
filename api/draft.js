'use strict';
/*
 * POST /api/draft — "Sembang → Paper penuh".
 *   mode "plan":    { remarks[], title, language, target } → { plan, papers, warnings }
 *   mode "section": { section, points[], papers[], title, language, target } → { text, references }
 * See lib/draft.js for how the steps fit together.
 */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const C = require('../lib/cite');
const D = require('../lib/draft');
const sources = require('../lib/sources');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 90000);
    const ai = pick(req);
    const language = D.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const title = cap(data.title, 400);
    const target = cap(data.target, 300);

    if (data.mode === 'plan') {
      const remarks = D.readRemarks(data.remarks);
      if (!remarks.length || remarks.join(' ').length < 30) return json(res, 400, { error: 'Add a few more ideas first.' });
      const raw = await askAI(D.planInstructions(language), D.planInput(remarks, title, target), 1800, { text: { format: { type: 'json_object' } }, provider: ai });
      const plan = D.cleanPlan(C.parseJSONLoose(raw));
      if (!plan) return json(res, 502, { error: 'AI could not organise the ideas. Please try again.' });

      // Evidence: recent studies for each claim, plus the underpinning theory without a year limit.
      const searches = plan.queries.map(q => sources.searchWorks(q, { recent: true, perPage: 8 }));
      if (plan.theory) searches.push(sources.searchWorks(plan.theory, { recent: false, perPage: 6 }));
      const settled = await Promise.allSettled(searches);
      const lists = settled.filter(s => s.status === 'fulfilled').map(s => s.value);
      const papers = C.mergePapers(lists).slice(0, 24);
      const warnings = [];
      if (!papers.length) {
        const failed = settled.find(s => s.status === 'rejected');
        warnings.push(failed ? (failed.reason && failed.reason.message) || 'Reference search failed.' : 'No matching papers were found, so claims that need evidence are marked for references.');
      }
      return json(res, 200, { plan, papers: D.forClient(papers), warnings, ai });
    }

    if (data.mode === 'section') {
      const key = String(data.section || '');
      if (!D.SECTIONS.includes(key)) return json(res, 400, { error: 'Unknown section.' });
      const papers = D.readPool(data.papers);
      const points = D.readPoints(data.points);
      const raw = await askAI(D.sectionInstructions(key, language), D.sectionInput({ key, points, title, target, papers, paperLanguage: language }), key === 'literature' ? 1700 : 1300, { provider: ai });
      const out = C.render(raw, papers, language === 'Bahasa Melayu' ? 'ms' : 'en');
      if (!out.text) return json(res, 502, { error: 'AI returned an empty section. Please try again.' });
      return json(res, 200, { text: out.text, references: out.references, ai });
    }

    return json(res, 400, { error: 'Unknown mode.' });
  } catch (e) {
    return fail(res, e);
  }
};
