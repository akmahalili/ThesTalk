/* Talkademic reference export: RIS (Mendeley, Zotero, EndNote) and BibTeX.
   Works in the browser (window.ThesTalkRefExport) and in Node (module.exports). */
(function (root) {
  'use strict';
  const PARTICLES = ['van', 'von', 'de', 'der', 'den', 'da', 'di', 'du', 'del', 'della', 'dos', 'das', 'la', 'le', 'ter', 'ten'];

  function splitName(full) {
    const t = String(full || '').trim().replace(/\s+/g, ' ');
    if (!t) return { sur: '', given: '' };
    if (t.includes(',')) { const i = t.indexOf(','); return { sur: t.slice(0, i).trim(), given: t.slice(i + 1).trim() }; }
    const parts = t.split(' ');
    if (parts.length === 1) return { sur: parts[0], given: '' };
    let i = parts.length - 1;
    while (i > 1 && PARTICLES.includes(parts[i - 1].toLowerCase())) i--;
    return { sur: parts.slice(i).join(' '), given: parts.slice(0, i).join(' ') };
  }
  const lastFirst = a => { const n = splitName(a); return n.given ? n.sur + ', ' + n.given : n.sur; };
  const pageParts = p => { const m = String(p || '').split(/[–—-]/).map(x => x.trim()).filter(Boolean); return { start: m[0] || '', end: m[1] || '' }; };
  const isJournal = r => !!r.venue && !/book|chapter|dissertation|thesis/i.test(r.type || '');
  const clean = s => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim();

  function toRIS(refs) {
    return (refs || []).map(r => {
      const lines = [];
      const add = (tag, v) => { const val = clean(v); if (val) lines.push(tag + '  - ' + val); };
      lines.push('TY  - ' + (isJournal(r) ? 'JOUR' : (/chapter/i.test(r.type || '') ? 'CHAP' : 'GEN')));
      (r.authors || []).forEach(a => add('AU', lastFirst(a)));
      add('TI', r.title || (!r.authors || !r.authors.length ? r.apa : ''));
      if (isJournal(r)) { add('T2', r.venue); add('JO', r.venue); } else add('T2', r.venue);
      add('PY', r.year);
      add('VL', r.volume);
      add('IS', r.issue);
      const pg = pageParts(r.pages); add('SP', pg.start); add('EP', pg.end);
      add('DO', r.doi);
      add('UR', r.url || (r.doi ? 'https://doi.org/' + r.doi : ''));
      if (!r.authors || !r.authors.length) add('N1', 'APA: ' + (r.apa || ''));
      lines.push('ER  - ');
      return lines.join('\r\n');
    }).join('\r\n\r\n') + ((refs || []).length ? '\r\n' : '');
  }

  function bibEscape(s) {
    return clean(s).replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_])/g, '\\$1').replace(/[{}]/g, '').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
  }
  function asciiWord(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
  function toBibTeX(refs) {
    const used = {};
    return (refs || []).map(r => {
      const first = (r.authors && r.authors[0]) ? splitName(r.authors[0]).sur : '';
      const word = (String(r.title || '').split(/\s+/).map(asciiWord).find(w => w.length > 3) || 'ref');
      let key = (asciiWord(first) || 'anon') + (r.year || 'nd') + word;
      if (used[key]) { used[key]++; key += String.fromCharCode(96 + used[key]); } else used[key] = 1;
      const journal = isJournal(r);
      const fields = [];
      const add = (k, v, braces) => { const val = clean(v); if (val) fields.push('  ' + k + ' = {' + (braces ? '{' + bibEscape(val) + '}' : bibEscape(val)) + '}'); };
      if (r.authors && r.authors.length) add('author', r.authors.map(lastFirst).join(' and '));
      add('title', r.title || r.apa, true);
      if (journal) add('journal', r.venue); else add('howpublished', r.venue);
      add('year', r.year);
      add('volume', r.volume);
      add('number', r.issue);
      add('pages', String(r.pages || '').replace(/[–—]/g, '--').replace(/(\d)-(\d)/, '$1--$2'));
      if (r.doi) fields.push('  doi = {' + clean(r.doi) + '}');
      if (r.url) fields.push('  url = {' + clean(r.url) + '}');
      if (!r.authors || !r.authors.length) add('note', 'APA: ' + (r.apa || ''));
      return '@' + (journal ? 'article' : 'misc') + '{' + key + ',\n' + fields.join(',\n') + '\n}';
    }).join('\n\n') + ((refs || []).length ? '\n' : '');
  }

  const api = { toRIS, toBibTeX, splitName };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ThesTalkRefExport = api;
})(typeof window !== 'undefined' ? window : globalThis);
