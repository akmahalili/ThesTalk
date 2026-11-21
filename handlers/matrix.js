'use strict';
/*
 * POST /api/matrix — literature matrix.
 *   mode "extract": { text, fileName, focus, language } → { row } — one article (text read from its PDF in the browser).
 *                   Reference details are confirmed against OpenAlex when possible (row.verified).
 *   mode "synth":   { rows, focus, language } → { themes, gaps, synthesis, references } — cited in APA by lib/cite.js.
 */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const C = require('../lib/cite');
const M = require('../lib/matrix');
const S = require('../lib/sources');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 220000);
    const language = M.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const lang = language === 'Bahasa Melayu' ? 'ms' : 'en';
    const focus = cap(data.focus, 400);
    const ai = pick(req);
    const jsonMode = { text: { format: { type: 'json_object' } }, provider: ai };

    if (data.mode === 'extract') {
      const text = cap(data.text, 200000);
      if (text.replace(/\s+/g, '').length < 300) return json(res, 400, { error: 'This PDF has almost no text (it may be a scanned image). Paste the abstract and method instead.' });
      const raw = await askAI(M.extractInstructions(language), M.extractInput({ text, fileName: cap(data.fileName, 200), focus }), 1400, jsonMode);
      const row = M.cleanRow(C.parseJSONLoose(raw), text);
      if (!row) return json(res, 502, { error: 'AI could not read this article. Try again, or paste its abstract and method.' });
      // Confirm the reference against OpenAlex so the APA entry is not built from a misread PDF header.
      let work = null;
      try { work = await S.findWork({ doi: row.doi, title: row.title }); } catch (_) { work = null; }
      if (work) Object.assign(row, { title: work.title, authors: work.authors, year: work.year || row.year, venue: work.venue || row.venue, volume: work.volume, issue: work.issue, pages: work.pages, doi: work.doi || row.doi, type: work.type, cites: work.cites });
      row.verified = !!work;
      row.apa = C.apaReference(row, lang);
      row.cite = row.authors.length ? C.narrativeCite(row, lang) : '';
      row.url = row.doi ? 'https://doi.org/' + row.doi : (work && work.openalex) || '';
      return json(res, 200, { row, ai });
    }

    if (data.mode === 'synth') {
      const rows = M.readRows(data.rows);
      if (rows.length < 2) return json(res, 400, { error: 'Add at least two studies to the matrix first.' });
      const raw = await askAI(M.synthInstructions(language), M.synthInput({ rows, focus }), 2600, jsonMode);
      const out = M.cleanSynth(C.parseJSONLoose(raw), rows.length);
      if (!out) return json(res, 502, { error: 'AI returned an unreadable answer. Please try again.' });
      const rendered = C.render(out.synthesis, rows, lang);
      const byN = new Map(rows.map(r => [r.n, r]));
      const strip = v => String(v || '').replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\](?:\s*\[\d+\])*/g, '');
      const gaps = out.gaps.map(g => C.render(g, rows, lang));
      const refs = new Map(rendered.references.map(r => [r.n, r]));
      gaps.forEach(g => g.references.forEach(r => refs.set(r.n, r)));
      return json(res, 200, {
        themes: out.themes.map(t => ({ name: t.name, note: strip(t.note), cites: t.papers.length ? C.parenCite(t.papers.map(n => byN.get(n)), lang) : '', papers: t.papers })),
        gaps: gaps.map(g => g.text),
        synthesis: rendered.text,
        references: [...refs.values()].sort((a, b) => a.apa.localeCompare(b.apa)),
        ai
      });
    }
    return json(res, 400, { error: 'Unknown mode.' });
  } catch (e) {
    return fail(res, e);
  }
};
