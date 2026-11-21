/* Talkademic "Semak Persamaan" core: before Turnitin, find passages of the thesis or a paper that
   repeat, word for word, the abstracts of the works it cites (and the student's other papers),
   plus passages copied between chapters. Matching uses runs of identical words (word n-grams);
   in-text citations, quotation marks and the reference list are ignored. Browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicSimilarityCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  const fold = w => w.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'");

  /* Words with their place in the text. Words inside a citation "(Hair et al., 2019)" or inside
     quotation marks (a quotation is allowed when cited) are marked so they never count. */
  function tokens(text) {
    const s = String(text || '');
    const skip = [];
    for (const m of s.matchAll(/\([^()]{0,200}?\b(?:1[89]|20)\d{2}[a-z]?\b[^()]{0,120}\)/g)) skip.push([m.index, m.index + m[0].length]);
    for (const m of s.matchAll(/[“"][^”"\n]{3,600}[”"]/g)) skip.push([m.index, m.index + m[0].length]);
    const inSkip = i => skip.some(([a, b]) => i >= a && i < b);
    const out = [];
    for (const m of s.matchAll(WORD)) out.push({ w: fold(m[0]), s: m.index, e: m.index + m[0].length, cite: inSkip(m.index) });
    return out;
  }
  const keyAt = (tk, i, n) => { let k = ''; for (let j = i; j < i + n; j++) k += (j > i ? ' ' : '') + tk[j].w; return k; };
  function shingleSet(text, n) {
    const tk = tokens(text).filter(t => !t.cite), set = new Set();
    for (let i = 0; i + n <= tk.length; i++) set.add(keyAt(tk, i, n));
    return set;
  }
  /* Runs of words in `tk` (a place's tokens without citations) covered by n-grams found in `set`. */
  function spans(tk, set, n, min) {
    const hit = new Uint8Array(tk.length);
    for (let i = 0; i + n <= tk.length; i++) if (set.has(keyAt(tk, i, n))) for (let j = i; j < i + n; j++) hit[j] = 1;
    const out = [];
    for (let i = 0; i < tk.length;) {
      if (!hit[i]) { i++; continue; }
      let j = i; while (j < tk.length && hit[j]) j++;
      if (j - i >= min) out.push({ a: i, b: j, words: j - i });
      i = j;
    }
    return out;
  }
  function sentenceAround(text, s, e) {
    let a = s, b = e;
    while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
    while (b < text.length && !/[.!?\n]/.test(text[b])) b++;
    if (b < text.length && /[.!?]/.test(text[b])) b++;
    return { s: a, e: b, text: text.slice(a, b).trim() };
  }
  /* Cut the reference list off a paper or chapter so its entries never match their own abstracts. */
  function body(text) {
    const s = String(text || '');
    const m = s.match(/\n\s*(?:rujukan|references|bibliografi|bibliography)\s*\n/i);
    return m ? s.slice(0, m.index) : s;
  }

  /* places: [{ label, text }] · sources: [{ id, title, text, kind: 'source' | 'own' }]
     → overall percentage, passages (longest first), words matched per source, and repeats between places. */
  function compare(places, sources, opt) {
    const o = Object.assign({ n: 6, min: 8, repeatMin: 15 }, opt || {});
    const P = places.map((p, pi) => { const text = body(p.text); return { ...p, pi, text, tk: tokens(text).filter(t => !t.cite) }; });
    const total = P.reduce((a, p) => a + p.tk.length, 0);
    const marked = P.map(p => new Uint8Array(p.tk.length));
    const found = [];
    const per = sources.map(() => 0);
    sources.forEach((src, si) => {
      const set = shingleSet(src.text, o.n);
      if (!set.size) return;
      for (const p of P) for (const sp of spans(p.tk, set, o.n, o.min)) found.push({ p, si, ...sp });
    });
    // Longest first; a passage that mostly overlaps a longer one for the same place is the same match.
    found.sort((x, y) => y.words - x.words);
    const kept = [];
    for (const f of found) {
      const clash = kept.some(k => k.p === f.p && Math.min(k.b, f.b) - Math.max(k.a, f.a) > 0.5 * f.words);
      if (clash) continue;
      kept.push(f);
      for (let j = f.a; j < f.b; j++) marked[f.p.pi][j] = 1;
    }
    for (const k of kept) per[k.si] += k.words;
    const matched = marked.reduce((a, m) => a + m.reduce((x, y) => x + y, 0), 0);
    const passages = kept.map(k => {
      const s = k.p.tk[k.a].s, e = k.p.tk[k.b - 1].e;
      return { place: k.p.pi, label: k.p.label, source: k.si, words: k.words, start: s, end: e, match: k.p.text.slice(s, e), sentence: sentenceAround(k.p.text, s, e) };
    });
    // Repeats: long runs that appear in two different places of the same document.
    const repeats = [];
    if (P.length > 1) {
      const seen = new Map();
      P.forEach(p => { for (let i = 0; i + o.repeatMin <= p.tk.length; i += 1) { const key = keyAt(p.tk, i, o.repeatMin); if (!seen.has(key)) seen.set(key, { pi: p.pi, i }); } });
      P.forEach(p => {
        for (let i = 0; i + o.repeatMin <= p.tk.length && repeats.length < 20; i++) {
          const first = seen.get(keyAt(p.tk, i, o.repeatMin));
          if (!first || first.pi === p.pi) continue;
          // Grow the run as far as both copies agree.
          const q = P[first.pi];
          let len = o.repeatMin;
          while (i + len < p.tk.length && first.i + len < q.tk.length && p.tk[i + len].w === q.tk[first.i + len].w) len++;
          repeats.push({ a: { place: q.pi, label: q.label, text: q.text.slice(q.tk[first.i].s, q.tk[first.i + len - 1].e) }, b: { place: p.pi, label: p.label }, words: len });
          i += len - 1;
        }
      });
    }
    return { total, matched, pct: total ? matched / total * 100 : 0, passages, bySource: per.map((w, i) => ({ i, words: w })).filter(x => x.words).sort((a, b) => b.words - a.words), repeats };
  }

  /* Share of a sentence's words covered by n-grams of the source (used to show a paraphrase helped). */
  function coverage(sentence, sourceText, n) {
    const k = n || 4;
    const tk = tokens(sentence).filter(t => !t.cite);
    if (!tk.length) return 0;
    const set = shingleSet(sourceText, k);
    const sp = spans(tk, set, k, k);
    return sp.reduce((a, x) => a + x.words, 0) / tk.length * 100;
  }

  return { tokens, compare, coverage, body, sentenceAround };
});
