'use strict';
/*
 * POST /api/cite — "Convert with real references".
 * 1. The model turns the casual idea into a formal claim and three keyword queries.
 * 2. OpenAlex is searched for real papers that have abstracts.
 * 3. The model writes one paragraph that may cite those papers only by number.
 * 4. The server converts the numbers into APA 7 citations, drops numbers that match
 *    no retrieved paper and lists only the papers actually cited.
 */
const { json, protect, cap, metadata, getBody, askAI, pick, integrity, fail } = require('../lib/common');
const sources = require('../lib/sources');
const C = require('../lib/cite');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req);
    const idea = cap(data.idea, 6001);
    if (idea.length < 4 || idea.length > 6000) return json(res, 400, { error: 'Idea must be between 4 and 6000 characters.' });
    const meta = metadata(data);
    const lang = /melayu|malay/i.test(meta.language) ? 'ms' : 'en';
    const length = data.length === 'long' ? 'long' : 'short';
    const recent = data.recentOnly === true;
    const warnings = [];
    const ai = pick(req);

    // 1. Understand the idea and plan the searches.
    let claim = '';
    let queries = [];
    try {
      const raw = await askAI(C.QUERY_INSTRUCTIONS, C.queryInput(idea, meta), 400, { text: { format: { type: 'json_object' } }, provider: ai });
      const plan = C.parseJSONLoose(raw) || {};
      claim = cap(plan.claim, 400);
      queries = C.cleanQueries(plan.queries);
    } catch (e) {
      if (e.status === 429 || e.status === 402) throw e; // provider quota or credits: nothing else will work either
    }
    if (!queries.length) queries = [C.fallbackQuery(idea)];

    // 2. Find real papers.
    const lists = [];
    const errors = [];
    const settled = await Promise.allSettled(queries.map(q => sources.searchWorks(q, { recent })));
    settled.forEach(s => (s.status === 'fulfilled' ? lists.push(s.value) : errors.push(s.reason)));
    const papers = C.mergePapers(lists).slice(0, 12).map((p, i) => ({ ...p, n: i + 1 }));
    if (!papers.length) {
      warnings.push(errors.length
        ? (errors[0] && errors[0].message) || 'Reference search failed.'
        : 'No matching papers with abstracts were found, so claims that need evidence are marked [SOURCE NEEDED].');
    }

    // 3. Write from those papers only.
    const raw = await askAI(C.writeInstructions(lang, length) + '\n' + integrity, C.writeInput({ idea, claim, meta, papers }), length === 'long' ? 1500 : 1000, { provider: ai });

    // 4. Validate citations and build the reference list.
    const out = C.render(raw, papers, lang);
    if (!out.text) return json(res, 502, { error: 'AI returned an empty paragraph.' });
    if (papers.length && !out.references.length) warnings.push('The draft did not cite any of the papers found. Treat its claims as unsupported.');

    return json(res, 200, {
      academicText: out.text,
      note: out.note,
      claim,
      references: out.references,
      papers: out.papers,
      queries,
      warnings,
      provider: sources.provider,
      ai
    });
  } catch (e) {
    return fail(res, e);
  }
};
