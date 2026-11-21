'use strict';
/* POST /api/similarity
   { mode: 'sources', refs: [{ i, doi, title }] } → { sources: [{ i, title, doi, year, abstract }], missing: [i] }
   { mode: 'paraphrase', sentence, source, language } → { paraphrase } */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const { parseJSONLoose } = require('../lib/cite');
const S = require('../lib/sources');
const P = require('../lib/similarity');

const norm = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 60000);
    if (data.mode === 'paraphrase') {
      const sentence = cap(data.sentence, 1500).trim();
      if (sentence.split(/\s+/).length < 5) return json(res, 400, { error: 'Choose a longer sentence.' });
      const language = P.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
      const input = ['SENTENCE: ' + sentence, data.source ? 'SOURCE WORDING TO AVOID: ' + cap(data.source, 1500) : ''].filter(Boolean).join('\n');
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = parseJSONLoose(await askAI(P.paraphrasePrompt(language), input, 600, { text: { format: { type: 'json_object' } }, provider: pick(req) }));
        const out = String(raw && raw.paraphrase || '').trim();
        if (out && P.kept(sentence, out)) return json(res, 200, { paraphrase: out, ai: pick(req) });
      }
      return json(res, 422, { error: 'The suggestion dropped a citation or a number, so it was not used. Please try again.' });
    }
    const refs = (Array.isArray(data.refs) ? data.refs : []).slice(0, 120).map(r => ({ i: Number(r && r.i), doi: norm(r && r.doi), title: cap(r && r.title, 300) })).filter(r => Number.isInteger(r.i));
    const withDoi = refs.filter(r => /^10\.\d{4,9}\//.test(r.doi));
    const { found } = withDoi.length ? await S.lookupDois(withDoi.map(r => r.doi)) : { found: new Map() };
    const sources = [], missing = [];
    for (const r of withDoi) {
      const w = found.get(r.doi);
      if (w && w.abstract && w.abstract.length > 120) sources.push({ i: r.i, title: w.title, doi: r.doi, year: w.year, abstract: w.abstract });
      else if (!w && r.title) r.retry = true; else missing.push(r.i);
    }
    const byTitle = refs.filter(r => (r.retry || !/^10\.\d{4,9}\//.test(r.doi)) && r.title.split(/\s+/).length >= 4).slice(0, 15);
    const got = await Promise.all(byTitle.map(r => S.findWork({ title: r.title }).catch(() => null)));
    byTitle.forEach((r, k) => { const w = got[k]; if (w && w.abstract && w.abstract.length > 120) sources.push({ i: r.i, title: w.title, doi: w.doi, year: w.year, abstract: w.abstract }); else missing.push(r.i); });
    for (const r of refs) if (!sources.some(s => s.i === r.i) && !missing.includes(r.i)) missing.push(r.i);
    return json(res, 200, { sources: sources.sort((a, b) => a.i - b.i), missing: missing.sort((a, b) => a - b) });
  } catch (e) {
    return fail(res, e);
  }
};
