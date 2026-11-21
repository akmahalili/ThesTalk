'use strict';
/*
 * POST /api/journals — suggest target journals for a draft article.
 * The AI only turns the title/abstract into English search keywords; the journals and every
 * number shown come from OpenAlex (journals that published similar articles recently).
 */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose, cleanQueries } = require('../lib/cite');
const { JOURNAL_QUERY_INSTRUCTIONS } = require('../lib/paper');
const J = require('../lib/journals');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 20000);
    const title = cap(data.title, 400);
    const abstract = cap(data.abstract, 3000);
    const keywords = cap(data.keywords, 400);
    if (title.length < 6 && abstract.length < 40) return json(res, 400, { error: 'Add a paper title or abstract first.' });

    let queries = [];
    try {
      const raw = await askAI(JOURNAL_QUERY_INSTRUCTIONS, 'Title: ' + (title || '-') + '\nKeywords: ' + (keywords || '-') + '\nAbstract: ' + (abstract || '-'), 300,
        { text: { format: { type: 'json_object' } }, provider: pick(req) });
      queries = cleanQueries((parseJSONLoose(raw) || {}).queries);
    } catch (e) { /* AI busy or over its limit: fall back to the user's own words below */ }
    const own = cleanQueries([keywords.split(/[;,]/).slice(0, 5).join(' '), title.split(/\s+/).slice(0, 10).join(' ')]);
    queries = [...queries, ...own].filter((q, i, a) => a.findIndex(x => x.toLowerCase() === q.toLowerCase()) === i).slice(0, 4);

    const since = data.recentOnly === false ? 2015 : new Date().getFullYear() - 5;
    const out = await J.findJournals(queries, { since });
    return json(res, 200, { journals: out.journals, searched: out.searched, queries, since });
  } catch (e) {
    return fail(res, e);
  }
};
