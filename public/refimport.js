/* Talkademic reference import: RIS and BibTeX files from Mendeley, Zotero, EndNote or Google Scholar
   become Talkademic references with an APA 7 entry built here.
   Works in the browser (window.TalkademicRefImport) and in Node (module.exports). */
(function (root) {
  'use strict';
  const PARTICLES = ['van', 'von', 'de', 'der', 'den', 'da', 'di', 'du', 'del', 'della', 'dos', 'das', 'la', 'le', 'ter', 'ten', 'bin', 'binti', 'bt', 'b'];
  const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const cleanDoi = s => clean(s).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').replace(/[.,;]+$/, '');
  const pages = s => clean(s).replace(/\s*(--|–|—|-)\s*/, '–');

  /* ---------- RIS ---------- */
  const RIS_TYPE = { JOUR: 'journal', JFULL: 'journal', EJOUR: 'journal', MGZN: 'journal', NEWS: 'journal', BOOK: 'book', EBOOK: 'book', EDBOOK: 'book', CHAP: 'chapter', ECHAP: 'chapter', CONF: 'conference', CPAPER: 'conference', THES: 'thesis', RPRT: 'report', ELEC: 'web', WEB: 'web', BLOG: 'web' };
  function parseRIS(text) {
    const out = [];
    let cur = null, lastTag = '';
    for (const raw of String(text || '').replace(/\uFEFF/g, '').split(/\r?\n/)) {
      const m = raw.match(/^([A-Z][A-Z0-9])  ?-(?: (.*)|\s*)$/);
      if (!m) { if (cur && lastTag && raw.trim()) cur[lastTag][cur[lastTag].length - 1] += ' ' + raw.trim(); continue; }
      const tag = m[1], val = (m[2] || '').trim();
      if (tag === 'TY') { cur = { TY: [val] }; lastTag = 'TY'; continue; }
      if (!cur) continue;
      if (tag === 'ER') { out.push(fromRIS(cur)); cur = null; lastTag = ''; continue; }
      (cur[tag] = cur[tag] || []).push(val); lastTag = tag;
    }
    if (cur) out.push(fromRIS(cur));
    return out.filter(r => r && (r.title || r.authors.length));
  }
  function fromRIS(f) {
    const one = (...tags) => { for (const t of tags) if (f[t] && f[t][0]) return clean(f[t][0]); return ''; };
    const type = RIS_TYPE[(one('TY') || '').toUpperCase()] || 'misc';
    const year = ((one('PY', 'Y1', 'DA', 'Y2').match(/\b(1[5-9]|20)\d{2}\b/)) || [''])[0];
    let sp = one('SP'), ep = one('EP');
    if (sp && /[-–]/.test(sp) && !ep) { [sp, ep] = sp.split(/\s*[-–]+\s*/); }
    const book = type === 'chapter' || type === 'conference';
    return {
      type, title: one('TI', 'T1', 'CT'), authors: [...(f.AU || []), ...(f.A1 || [])].map(clean).filter(Boolean).slice(0, 60),
      editors: [...(f.ED || []), ...(f.A2 && book ? f.A2 : []), ...(f.A3 && book ? f.A3 : [])].map(clean).filter(Boolean).slice(0, 20),
      year, venue: book ? one('T2', 'BT', 'J2') : one('T2', 'JO', 'JF', 'JA', 'J2', 'BT'), volume: one('VL'), issue: one('IS', 'CP'),
      pages: sp ? pages(ep ? sp + '–' + ep : sp) : '', doi: cleanDoi(one('DO', 'DOI', 'M3').match(/10\.\d{4,9}\/\S+/) ? one('DO', 'DOI', 'M3') : ''),
      url: one('UR', 'L2', 'LK'), publisher: one('PB'), place: one('CY'), edition: one('ET'), school: type === 'thesis' ? one('PB') : '',
      degree: type === 'thesis' ? one('M3') : '', abstract: one('AB', 'N2').slice(0, 4000)
    };
  }

  /* ---------- BibTeX ---------- */
  const ACC = { '"': '\u0308', "'": '\u0301', '`': '\u0300', '^': '\u0302', '~': '\u0303', '=': '\u0304', '.': '\u0307', u: '\u0306', v: '\u030c', H: '\u030b', c: '\u0327', k: '\u0328', r: '\u030a' };
  const SYM = { ss: 'ß', o: 'ø', O: 'Ø', ae: 'æ', AE: 'Æ', aa: 'å', AA: 'Å', l: 'ł', L: 'Ł', i: 'ı', oe: 'œ', OE: 'Œ', textendash: '–', textemdash: '—', textquoteright: '’', textquoteleft: '‘', textquotedblleft: '“', textquotedblright: '”', textasciitilde: '~', textbackslash: '\\', textregistered: '®', texttrademark: '™', textcopyright: '©' };
  function latex(s) {
    let t = String(s || '');
    t = t.replace(/\\([a-zA-Z]+)\s*\{\}/g, (m, w) => (SYM[w] !== undefined ? SYM[w] : m));
    t = t.replace(/\{?\\(["'`^~=.])\s*(?:\{\s*\\?([a-zA-Z])\s*\}|\\?([a-zA-Z]))\}?/g, (m, a, x, y) => ((x || y) + ACC[a]).normalize('NFC'));
    t = t.replace(/\{?\\([uvHckr])\s*\{\s*\\?([a-zA-Z])\s*\}\}?/g, (m, a, ch) => (ch + ACC[a]).normalize('NFC'));
    t = t.replace(/\{?\\([uvHckr])\s+([a-zA-Z])\}?/g, (m, a, ch) => (ch + ACC[a]).normalize('NFC'));
    t = t.replace(/\\(ss|ae|AE|aa|AA|oe|OE|o|O|l|L|i|textendash|textemdash|textquoteright|textquoteleft|textquotedblleft|textquotedblright|textregistered|texttrademark|textcopyright)\b\s*/g, (m, w) => SYM[w]);
    t = t.replace(/\\(?:emph|textit|textbf|textsc|textup|mathrm|mbox|url|href\{[^}]*\})\s*\{([^{}]*)\}/g, '$1');
    t = t.replace(/\\([&%$#_{}])/g, '$1').replace(/---/g, '—').replace(/--/g, '–').replace(/~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+\s*/g, '');
    return clean(t);
  }
  function readValue(src, i) {
    while (/\s/.test(src[i])) i++;
    const parts = [];
    for (;;) {
      while (/\s/.test(src[i])) i++;
      let v = '';
      if (src[i] === '{') {
        let depth = 0, j = i;
        for (; j < src.length; j++) { if (src[j] === '{' && src[j - 1] !== '\\') depth++; else if (src[j] === '}' && src[j - 1] !== '\\') { depth--; if (depth === 0) break; } }
        v = src.slice(i + 1, j); i = j + 1;
      } else if (src[i] === '"') {
        let depth = 0, j = i + 1;
        for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; else if (src[j] === '"' && depth === 0 && src[j - 1] !== '\\') break; }
        v = src.slice(i + 1, j); i = j + 1;
      } else {
        const m = src.slice(i).match(/^[^,#}\s]+/); v = m ? m[0] : ''; i += v.length;
        v = { macro: v };
      }
      parts.push(v);
      while (/\s/.test(src[i])) i++;
      if (src[i] === '#') { i++; continue; }
      return { parts, i };
    }
  }
  const MONTHS = { jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June', jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December' };
  function parseBibTeX(text) {
    const src = String(text || '').replace(/\uFEFF/g, '');
    const strings = Object.assign({}, MONTHS), out = [];
    const re = /@\s*([a-zA-Z]+)\s*([{(])/g;
    let m;
    while ((m = re.exec(src))) {
      const kind = m[1].toLowerCase();
      let i = re.lastIndex;
      if (kind === 'comment' || kind === 'preamble') continue;
      const fields = {};
      const resolve = parts => parts.map(p => (typeof p === 'string' ? p : strings[p.macro.toLowerCase()] !== undefined ? strings[p.macro.toLowerCase()] : p.macro)).join('');
      if (kind !== 'string') {
        const k = src.slice(i).match(/^\s*([^,\s]*)\s*,/);
        if (!k) continue;
        i += k[0].length;
      }
      for (;;) {
        const f = src.slice(i).match(/^\s*([a-zA-Z][\w\-:.]*)\s*=\s*/);
        if (!f) break;
        i += f[0].length;
        const v = readValue(src, i);
        i = v.i;
        fields[f[1].toLowerCase()] = { raw: resolve(v.parts), braced: typeof v.parts[0] === 'string' && /^\{[^{}]*\}$/.test(String(v.parts[0]).trim()) };
        while (/\s/.test(src[i])) i++;
        if (src[i] === ',') { i++; continue; }
        break;
      }
      re.lastIndex = i;
      if (kind === 'string') { for (const [k, v] of Object.entries(fields)) strings[k] = v.raw; continue; }
      out.push(fromBib(kind, fields));
    }
    return out.filter(r => r && (r.title || r.authors.length));
  }
  const BIB_TYPE = { article: 'journal', book: 'book', booklet: 'book', inbook: 'chapter', incollection: 'chapter', inproceedings: 'conference', conference: 'conference', proceedings: 'book', phdthesis: 'thesis', mastersthesis: 'thesis', thesis: 'thesis', techreport: 'report', report: 'report', online: 'web', electronic: 'web', www: 'web', misc: 'misc', unpublished: 'misc' };
  function people(raw) {
    const s = String(raw || '').trim();
    if (!s) return { names: [], org: [] };
    const names = [], org = [];
    // Split on " and " at brace depth 0 only.
    let depth = 0, start = 0;
    const parts = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') depth++; else if (s[i] === '}') depth--;
      else if (depth === 0 && /\s/.test(s[i]) && /^\s+and\s+/i.test(s.slice(i))) { parts.push(s.slice(start, i)); const m = s.slice(i).match(/^\s+and\s+/i); i += m[0].length - 1; start = i + 1; }
    }
    parts.push(s.slice(start));
    for (const p of parts.map(x => x.trim()).filter(Boolean)) {
      if (/^others$/i.test(p)) continue;
      if (/^\{[^{}]*\}$/.test(p)) { const n = latex(p); names.push(n); org.push(n); continue; }
      const n = latex(p);
      if (n.includes(',')) {
        const bits = n.split(',').map(x => x.trim());
        // "von Last, Jr, First" → keep "von Last Jr, First"
        names.push(bits.length > 2 ? bits[0] + ' ' + bits[1] + ', ' + bits.slice(2).join(' ') : bits[0] + (bits[1] ? ', ' + bits[1] : ''));
      } else names.push(n);
    }
    return { names: names.slice(0, 60), org };
  }
  function fromBib(kind, f) {
    const v = k => (f[k] ? latex(f[k].raw) : '');
    const type = BIB_TYPE[kind] || 'misc';
    const au = people(f.author && f.author.raw), ed = people(f.editor && f.editor.raw);
    const year = (v('year') || v('date')).match(/\b(1[5-9]|20)\d{2}\b/);
    const doi = cleanDoi(v('doi'));
    return {
      type, title: v('title'), authors: au.names, org: [...au.org, ...ed.org], editors: ed.names, year: year ? year[0] : '',
      venue: type === 'journal' ? v('journal') || v('journaltitle') : v('booktitle') || v('journal') || v('howpublished') || v('series'),
      volume: v('volume'), issue: v('number') || v('issue'), pages: pages(v('pages')), doi: /^10\.\d{4,9}\//.test(doi) ? doi : '',
      url: v('url') || (v('eprint') && /arxiv/i.test(v('archiveprefix') || v('eprinttype')) ? 'https://arxiv.org/abs/' + v('eprint') : ''),
      publisher: v('publisher') || v('organization') || v('institution'), place: v('address') || v('location'), edition: v('edition'),
      school: v('school') || v('institution'), degree: kind === 'phdthesis' ? 'phd' : kind === 'mastersthesis' ? 'masters' : v('type'), abstract: v('abstract').slice(0, 4000)
    };
  }

  /* ---------- APA 7 ---------- */
  function splitName(full) {
    const t = clean(full);
    if (!t) return { sur: '', given: '' };
    if (t.includes(',')) { const i = t.indexOf(','); return { sur: t.slice(0, i).trim(), given: t.slice(i + 1).trim() }; }
    const parts = t.split(' ');
    if (parts.length === 1) return { sur: parts[0], given: '' };
    let i = parts.length - 1;
    while (i > 1 && PARTICLES.includes(parts[i - 1].toLowerCase())) i--;
    return { sur: parts.slice(i).join(' '), given: parts.slice(0, i).join(' ') };
  }
  const initials = given => clean(String(given).replace(/\./g, '. ')).split(' ').filter(Boolean)
    .map(w => w.split('-').map(x => (x ? x.charAt(0).toUpperCase() + '.' : '')).join('-')).join(' ');
  function nameAPA(a, org) {
    if (org && org.includes(a)) return a;
    const n = splitName(a);
    return n.sur + (n.given ? ', ' + initials(n.given) : '');
  }
  function listAPA(names, org) {
    const l = names.map(a => nameAPA(a, org)).filter(Boolean);
    if (!l.length) return '';
    if (l.length === 1) return l[0];
    if (l.length <= 20) return l.slice(0, -1).join(', ') + ', & ' + l[l.length - 1];
    return l.slice(0, 19).join(', ') + ', … ' + l[l.length - 1];
  }
  function editorsAPA(names) {
    const l = names.map(a => { const n = splitName(a); return (n.given ? initials(n.given) + ' ' : '') + n.sur; });
    if (!l.length) return '';
    const joined = l.length === 1 ? l[0] : l.length === 2 ? l[0] + ' & ' + l[1] : l.slice(0, -1).join(', ') + ', & ' + l[l.length - 1];
    return joined + (l.length > 1 ? ' (Eds.)' : ' (Ed.)');
  }
  const ordinal = n => { const v = n % 100, x = ['th', 'st', 'nd', 'rd']; return n + (x[(v - 20) % 10] || x[v] || x[0]); };
  const end = s => { const t = clean(s); return !t ? '' : /[.?!]$/.test(t) ? t : t + '.'; };
  function apa(r, lang) {
    const y = r.year || (lang === 'ms' ? 't.t.' : 'n.d.');
    const au = listAPA(r.authors || [], r.org || []);
    const link = r.doi ? ' https://doi.org/' + r.doi : r.url ? ' ' + r.url : '';
    let title = clean(r.title).replace(/[.\s]+$/, '');
    const edn = clean(r.edition).replace(/\s*(ed\.?|edition)$/i, '');
    const ed = edn && !/^(1|1st|first)$/i.test(edn) ? ' (' + (/^\d+$/.test(edn) ? ordinal(+edn) : edn) + ' ed.)' : '';
    if (r.type === 'thesis') {
      const phd = /phd|doctor|dissertation|doktor/i.test(r.degree || '');
      title += ' [' + (lang === 'ms' ? (phd ? 'Tesis doktor falsafah' : 'Tesis sarjana') : (phd ? 'Doctoral dissertation' : "Master's thesis")) + (r.school ? ', ' + r.school : '') + ']';
    } else title += ed;
    const head = au ? `${au}${/\.$/.test(au) ? '' : '.'} (${y}). ${end(title)}` : `${end(title)} (${y}).`;
    let src = '';
    if (r.type === 'journal') {
      if (r.venue) src = r.venue + (r.volume ? ', ' + r.volume + (r.issue ? '(' + r.issue + ')' : '') : '') + (r.pages ? ', ' + r.pages : '') + '.';
    } else if (r.type === 'chapter' || r.type === 'conference') {
      const eds = editorsAPA(r.editors || []);
      if (r.venue) src = (lang === 'ms' ? 'Dalam ' : 'In ') + (eds ? eds + ', ' : '') + r.venue + (r.pages ? ' (' + (lang === 'ms' ? 'ms. ' : 'pp. ') + r.pages + ')' : '') + '.';
      if (r.publisher && !(r.authors || []).includes(r.publisher)) src += (src ? ' ' : '') + end(r.publisher);
    } else if (r.type === 'thesis') {
      src = '';
    } else {
      const pub = r.publisher || (r.type !== 'book' ? r.venue : '');
      if (pub && pub !== au) src = end(pub);
    }
    return clean(head + (src ? ' ' + src : '') + link);
  }

  /* ---------- entry point ---------- */
  function detect(text) {
    const t = String(text || '');
    if (/^\s*TY  ?- /m.test(t)) return 'ris';
    if (/@\s*[a-zA-Z]+\s*[{(]/.test(t)) return 'bib';
    return '';
  }
  function parse(text, lang) {
    const kind = detect(text);
    const list = kind === 'ris' ? parseRIS(text) : kind === 'bib' ? parseBibTeX(text) : [];
    return { kind, refs: list.map(r => toRef(r, lang)) };
  }
  function toRef(r, lang) {
    return {
      apa: apa(r, lang), doi: r.doi || '', url: r.url || (r.doi ? 'https://doi.org/' + r.doi : ''), title: r.title || '', year: r.year || '',
      authors: (r.authors || []).slice(0, 25), venue: r.venue || r.publisher || '', volume: r.volume || '', issue: r.issue || '', pages: r.pages || '',
      type: r.type === 'journal' ? 'article' : r.type === 'conference' ? 'proceedings-article' : r.type === 'chapter' ? 'book-chapter' : r.type || '',
      publisher: r.publisher || '', abstract: r.abstract || '', source: 'import'
    };
  }
  const keyOf = r => (r.doi ? 'doi:' + String(r.doi).toLowerCase() : 't:' + String(r.title || r.apa || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  /* Adds refs not already in list. Returns { added, skipped }. */
  function merge(list, refs, date) {
    const have = new Set(list.map(keyOf));
    let added = 0, skipped = 0;
    for (const r of refs) {
      const k = keyOf(r);
      if (!r.apa || have.has(k)) { skipped++; continue; }
      have.add(k); list.push(Object.assign({}, r, { addedAt: date || '' })); added++;
    }
    return { added, skipped };
  }

  const api = { parse, parseRIS, parseBibTeX, latex, apa, toRef, detect, merge, splitName };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicRefImport = api;
})(typeof window !== 'undefined' ? window : globalThis);
