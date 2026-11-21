/* Talkademic citation audit: in-text citations against the reference list (APA 7).
   Finds citations with no reference, year mismatches, references never cited, same author-year
   pairs that need a/b, and common APA slips. Works in the browser and in Node (tests). */
(function (root) {
  'use strict';
  const PARTICLES = ['van', 'von', 'de', 'der', 'den', 'da', 'di', 'du', 'del', 'della', 'dos', 'das', 'la', 'le', 'ter', 'ten', 'bin', 'binti'];
  const fold = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
  const lastWord = s => { const w = fold(s).split(' ').filter(Boolean); return w.length ? w[w.length - 1] : ''; };
  const LEAD = /^(?:(?:e\.g\.|eg\.|see also|see|cf\.|lihat juga|lihat|contohnya|misalnya|rujuk|seperti)\s*,?\s+)/i;
  const YEAR = /\b((?:1[89]|20)\d{2})([a-z]?)\b/;

  /* Surnames in an author part such as "Hair et al.", "Halili & Sulaiman", "Lee, Chen, and Diaz". */
  function authorsOf(part) {
    let p = String(part || '').replace(LEAD, '').replace(/\[[^\]]*\]/g, '').trim();
    const etal = /\bet\s+al\.?/i.test(p);
    p = p.replace(/,?\s*\bet\s+al\.?/i, '').trim();
    const names = p.split(/\s*(?:,|&|\band\b|\bdan\b)\s*/i).map(x => x.trim()).filter(x => x && /\p{L}/u.test(x));
    return { names, etal };
  }

  /* Every author–date citation in a text, with where it sits. */
  function parseCitations(text) {
    const out = [];
    const t = String(text || '');
    const reParen = /\(([^()]*?(?:1[89]|20)\d{2}[a-z]?[^()]*)\)/g;
    let m;
    while ((m = reParen.exec(t))) {
      const inner = m[1];
      // A narrative citation's year in brackets, e.g. "Hair et al. (2019)", is handled below.
      if (/^\s*(?:1[89]|20)\d{2}[a-z]?(?:\s*,\s*(?:p|pp|ms|h)\.?\s*[\d–-]+)?\s*$/.test(inner)) continue;
      for (const raw of inner.split(';')) {
        const part = raw.trim();
        const ym = part.match(/^(.*?),\s*((?:(?:1[89]|20)\d{2}[a-z]?|n\.d\.|t\.t\.)(?:\s*,\s*(?:(?:1[89]|20)\d{2}[a-z]?))*)(?:\s*,\s*(?:p|pp|ms|h|para)\.?\s*[\d–\-, ]+)?\s*$/i);
        if (!ym) continue;
        const who = authorsOf(ym[1]);
        if (!who.names.length) continue;
        for (const y of ym[2].split(/\s*,\s*/)) {
          const yy = y.match(YEAR);
          out.push({ raw: '(' + part + ')', names: who.names, etal: who.etal, year: yy ? yy[1] : '', suffix: yy ? yy[2] : '', narrative: false, index: m.index });
        }
      }
    }
    const reNarr = /((?:[A-ZÀ-ɏ][\p{L}'’-]+\s+){0,2}[A-ZÀ-ɏ][\p{L}'’-]+(?:\s*,\s*[A-ZÀ-ɏ][\p{L}'’-]+)*(?:\s*,?\s+(?:&|and|dan)\s+(?:[A-ZÀ-ɏ][\p{L}'’-]+\s+){0,2}[A-ZÀ-ɏ][\p{L}'’-]+)?(?:\s+et\s+al\.)?)\s+\(((?:1[89]|20)\d{2})([a-z]?)(?:\s*,\s*(?:p|pp|ms|h)\.?\s*[\d–-]+)?\)/gu;
    while ((m = reNarr.exec(t))) {
      // Keep only the author names: drop leading sentence words such as "Menurut", "According to".
      let who = m[1].replace(/^(?:(?:Menurut|Mengikut|Kajian|Dapatan|Seperti|According|As|In|Following|Oleh|Dalam|Bagi|Walau|Namun|However)\s+(?:to\s+|oleh\s+|kajian\s+)?)+/u, '');
      const a = authorsOf(who);
      if (!a.names.length) continue;
      // "Hair et al." keeps one name; multi-word surnames keep their last word as the key below.
      const start = m[0].indexOf(who.trim());
      out.push({ raw: m[0].slice(Math.max(0, start)), names: a.names, etal: a.etal, year: m[2], suffix: m[3] || '', narrative: true, index: m.index + Math.max(0, start) });
    }
    return out.sort((x, y) => x.index - y.index);
  }

  /* Key for a reference: first author's surname (last word) and year. */
  function refKey(r) {
    let sur = '';
    const a = (r.authors || [])[0];
    if (a) {
      if (String(a).includes(',')) sur = String(a).split(',')[0];
      else { const parts = String(a).trim().split(/\s+/); let i = parts.length - 1; while (i > 0 && PARTICLES.includes(parts[i - 1].toLowerCase())) i--; sur = parts.slice(i).join(' '); }
    }
    if (!sur && r.apa) { const m = String(r.apa).match(/^\s*([^,(.]+?)(?:,|\.\s*\(|\s*\()/); sur = m ? m[1] : ''; }
    const ym = String(r.year || '').match(YEAR) || String(r.apa || '').match(/\(((?:1[89]|20)\d{2})([a-z]?)\)/);
    const suffix = (String(r.apa || '').match(/\((?:1[89]|20)\d{2}([a-z])\)/) || [])[1] || '';
    return { sur: lastWord(sur), year: ym ? ym[1] : '', suffix };
  }

  /* How many authors a reference lists (from its APA entry, else its author list). */
  function authorCount(r) {
    const head = String(r.apa || '').split(/\s\((?:(?:1[89]|20)\d{2}[a-z]?|n\.d\.|t\.t\.)\)/)[0];
    const n = head ? head.split(/\.,\s+/).filter(x => /\p{L}/u.test(x)).length : 0;
    return Math.max(n, (r.authors || []).length);
  }

  /* places: [{ label, text, open }] ; refs: reference objects. */
  function audit(places, refs) {
    const keys = refs.map(refKey);
    const used = new Set();
    const missing = [], yearOff = [], style = [], ambiguous = [];
    const seen = new Set();
    for (const place of places) {
      for (const c of parseCitations(place.text)) {
        const key = lastWord(c.names[0]);
        if (!key || !c.year) continue;
        const exact = keys.map((k, i) => ({ k, i })).filter(({ k }) => k.sur === key && k.year === c.year && (!c.suffix || !k.suffix || k.suffix === c.suffix));
        const snippet = String(place.text).slice(Math.max(0, c.index - 50), c.index + c.raw.length + 30).replace(/\s+/g, ' ').trim();
        if (exact.length) {
          exact.forEach(e => used.add(e.i));
          const n = authorCount(refs[exact[0].i]);
          const sig2 = 'n|' + c.raw + '|' + place.label;
          if (!seen.has(sig2)) {
            seen.add(sig2);
            if (c.etal && n > 0 && n <= 2) style.push({ kind: 'etalTwo', cite: c.raw, place, snippet });
            else if (!c.etal && n >= 3 && c.names.length < 3) style.push({ kind: 'needEtal', cite: c.raw, place, snippet });
          }
          if (exact.length > 1 && !c.suffix) ambiguous.push({ cite: c.raw, place, snippet });
        } else {
          const near = keys.map((k, i) => ({ k, i })).filter(({ k }) => k.sur === key);
          if (near.length) { near.forEach(e => used.add(e.i)); yearOff.push({ cite: c.raw, year: c.year, listYears: [...new Set(near.map(e => e.k.year))], place, snippet }); }
          else missing.push({ cite: c.raw, place, snippet });
        }
        // APA 7: one or two authors are named; three or more use "et al." from the first citation.
        const sig = c.raw + '|' + place.label;
        if (!seen.has(sig)) {
          seen.add(sig);
          if (!c.etal && c.names.length >= 3) style.push({ kind: 'needEtal', cite: c.raw, place, snippet });
        }
      }
    }
    const uncited = refs.map((r, i) => ({ r, i })).filter(({ i }) => !used.has(i));
    // Two works by the same first author in the same year need 2019a / 2019b.
    const groups = new Map();
    keys.forEach((k, i) => { if (!k.sur || !k.year || k.suffix) return; const g = k.sur + '|' + k.year; groups.set(g, (groups.get(g) || []).concat(i)); });
    const needSuffix = [...groups.values()].filter(g => g.length > 1).map(g => g.map(i => refs[i]));
    refs.forEach((r, i) => {
      if (/\bet\s+al\b/i.test(r.apa || '')) style.push({ kind: 'refEtal', ref: r, i });
      if (!keys[i].year && !/\(n\.d\.\)|\(t\.t\.\)/.test(r.apa || '')) style.push({ kind: 'refNoYear', ref: r, i });
    });
    const cites = places.reduce((n, p) => n + parseCitations(p.text).length, 0);
    return { cites, refs: refs.length, missing, yearOff, uncited, needSuffix, ambiguous, style };
  }

  const api = { parseCitations, refKey, audit, authorsOf, authorCount };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicCiteAudit = api;
})(typeof window !== 'undefined' ? window : globalThis);
