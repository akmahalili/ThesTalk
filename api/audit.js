'use strict';
/* POST /api/audit — DOI checks for the citation audit (no AI, OpenAlex only).
   { refs: [{ i, doi, title, year }] } → { checks: [{ i, status: ok | notfound | mismatch | suggest, doi, title, year }] }
   Without a DOI, a journal-looking reference gets a DOI suggestion when OpenAlex finds the same title. */
const { json, protect, getBody, cap, fail } = require('../lib/common');
const S = require('../lib/sources');
const C = require('../lib/cite');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 120000);
    const refs = (Array.isArray(data.refs) ? data.refs : []).slice(0, 150).map(r => ({ i: Number(r && r.i), doi: cap(r && r.doi, 200), title: cap(r && r.title, 400), year: cap(r && r.year, 10) })).filter(r => Number.isInteger(r.i));
    const norm = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');
    const withDoi = refs.filter(r => /^10\.\d{4,9}\//.test(norm(r.doi)));
    const { found } = withDoi.length ? await S.lookupDois(withDoi.map(r => r.doi)) : { found: new Map() };
    const checks = [];
    for (const r of withDoi) {
      const w = found.get(norm(r.doi));
      if (!w) { checks.push({ i: r.i, status: 'notfound', doi: norm(r.doi) }); continue; }
      const yearOff = r.year && w.year && Math.abs(Number(r.year) - Number(w.year)) > 1;
      const titleOff = r.title && w.title && S.titleMatch(r.title, w.title) < 0.5;
      checks.push({ i: r.i, status: yearOff || titleOff ? 'mismatch' : 'ok', doi: norm(r.doi), title: w.title, year: String(w.year || ''), apa: C.apaReference(w, 'en') });
    }
    // Suggest DOIs for up to 12 references that have none.
    const noDoi = refs.filter(r => !/^10\.\d{4,9}\//.test(norm(r.doi)) && String(r.title).split(/\s+/).length >= 4).slice(0, 12);
    const found2 = await Promise.all(noDoi.map(r => S.findWork({ title: r.title }).catch(() => null)));
    noDoi.forEach((r, k) => { const w = found2[k]; if (w && w.doi && (!r.year || !w.year || Math.abs(Number(r.year) - Number(w.year)) <= 1)) checks.push({ i: r.i, status: 'suggest', doi: norm(w.doi), title: w.title, year: String(w.year || '') }); });
    return json(res, 200, { checks });
  } catch (e) {
    return fail(res, e);
  }
};
