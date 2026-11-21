/* Talkademic "Semak Persamaan": a check before Turnitin. Talkademic fetches the abstracts of the works
   you cite (OpenAlex), finds sentences that repeat their wording, also compares with your other papers
   and finds passages copied between chapters, and suggests a paraphrase that keeps your citations. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const C = window.TalkademicSimilarityCore;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Semak Persamaan', alt: 'Similarity Check', sub: 'Semakan awal sebelum Turnitin: cari ayat yang sama perkataan dengan abstrak sumber yang anda sitasi, dengan paper anda yang lain, dan antara bab.',
      scope: 'Semak', thesis: 'Tesis', paper: 'Paper', own: 'Bandingkan juga dengan paper saya yang lain dalam app', go: '🔍 Semak persamaan', fetching: 'Mengambil abstrak {n} sumber di OpenAlex…', comparing: 'Membandingkan…',
      limit: 'Semakan ini hanya membandingkan dengan abstrak sumber yang disitasi dan teks anda sendiri. Turnitin membandingkan dengan teks penuh, laman web dan tugasan pelajar lain, jadi peratus sebenar mungkin lebih tinggi. Semak had persamaan yang ditetapkan oleh fakulti anda.',
      noRefs: 'Tiada rujukan untuk dibandingkan. Tambah rujukan dahulu.', noText: 'Tiada teks untuk disemak.', fail: 'Abstrak tidak dapat diambil sekarang. Perbandingan dengan paper anda dan antara bab tetap dibuat.',
      pct: 'Persamaan dengan sumber', checked: '{a} abstrak dibandingkan · {m} rujukan tanpa abstrak', words: '{n} perkataan sama', clean: 'Tiada ayat yang sama perkataan (8 perkataan atau lebih) dengan abstrak sumber.',
      passages: 'Ayat yang perlu diparafrasa', from: 'Sama dengan', ownTag: 'paper anda', open: 'Buka', para: '✨ Cadang parafrasa', paraBusy: 'Menulis semula…', use: 'Guna ayat ini', used: 'Ayat diganti dalam "{s}".', notFound: 'Ayat asal sudah berubah. Cadangan disalin, tampal sendiri.', copied: 'Disalin.',
      before: 'Sebelum: {a}% sama', after: 'Selepas: {b}% sama', sources: 'Mengikut sumber', repeats: 'Diulang antara bahagian', repeatsHelp: 'Teks ini muncul di dua tempat dalam dokumen yang sama. Ringkaskan atau rujuk silang.', at: 'di', and: 'dan',
      'band.low': 'Rendah', 'band.mid': 'Sederhana', 'band.high': 'Tinggi'
    },
    en: {
      title: 'Similarity Check', alt: 'Semak Persamaan', sub: 'A check before Turnitin: find sentences that repeat the wording of the abstracts you cite, of your other papers, and between chapters.',
      scope: 'Check', thesis: 'Thesis', paper: 'Paper', own: 'Also compare with my other papers in the app', go: '🔍 Check similarity', fetching: 'Fetching abstracts of {n} sources from OpenAlex…', comparing: 'Comparing…',
      limit: 'This check only compares with the abstracts of the works you cite and your own text. Turnitin compares with full texts, web pages and other students\' work, so the real percentage may be higher. Check the similarity limit set by your faculty.',
      noRefs: 'No references to compare with. Add references first.', noText: 'No text to check.', fail: 'Abstracts could not be fetched right now. Your papers and chapters were still compared.',
      pct: 'Similarity with sources', checked: '{a} abstracts compared · {m} references without an abstract', words: '{n} matching words', clean: 'No sentence repeats 8 or more words of a source abstract.',
      passages: 'Sentences to paraphrase', from: 'Same as', ownTag: 'your paper', open: 'Open', para: '✨ Suggest a paraphrase', paraBusy: 'Rewriting…', use: 'Use this sentence', used: 'Sentence replaced in "{s}".', notFound: 'The original sentence has changed. The suggestion was copied; paste it yourself.', copied: 'Copied.',
      before: 'Before: {a}% similar', after: 'After: {b}% similar', sources: 'By source', repeats: 'Repeated between sections', repeatsHelp: 'This text appears twice in the same document. Shorten it or cross-refer.', at: 'in', and: 'and',
      'band.low': 'Low', 'band.mid': 'Moderate', 'band.high': 'High'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'checked'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  let scope = 'thesis', withOwn = true, busy = '', result = null;

  /* Text places of the chosen document, each with its owner object so a sentence can be replaced. */
  function material() {
    const s = App.state();
    const P = window.ThesTalkPapers || {};
    if (scope.startsWith('paper:')) {
      const p = (s.papers || []).find(x => 'paper:' + x.id === scope);
      if (!p) return null;
      return { refs: p.references || [], language: p.language, places: (p.sections || []).filter(x => String(x.content || '').trim() && x.key !== 'references').map(x => ({ label: P.label ? P.label(p, x.key) : x.key, text: x.content, owner: x, title: P.label ? P.label(p, x.key) : x.key, touch: () => { p.updated = new Date().toISOString(); }, open: () => { P.open(p.id, x.key); shell().go('papers'); } })), self: p.id };
    }
    const places = [];
    for (const ch of s.chapters || []) for (const sec of ch.sections || []) if (String(sec.content || '').trim()) places.push({ label: ch.title.split(':')[0] + ' › ' + sec.title, text: sec.content, owner: sec, title: sec.title, thesis: true, open: () => { App.select(ch.id, sec.id); shell().go('academic'); } });
    return { refs: s.references || [], language: (s.project || {}).language, places, self: null };
  }
  function ownSources(m) {
    if (!withOwn) return [];
    return (App.state().papers || []).filter(p => p.id !== m.self).map(p => ({ id: 'own:' + p.id, title: (p.title || '').trim() || '—', text: (p.sections || []).filter(x => x.key !== 'references').map(x => x.content || '').join('\n'), kind: 'own' })).filter(x => x.text.split(/\s+/).length > 30);
  }

  async function run() {
    const m = material();
    if (!m || !m.places.length) { App.toast(t('noText')); return; }
    const refs = m.refs.map((r, i) => ({ i, doi: r.doi || '', title: r.title || '' }));
    let fetched = [], missing = [], failed = false;
    if (refs.length && App.accessCode && App.accessCode()) {
      busy = t('fetching', { n: refs.length }); render();
      try { const res = await App.apiPost('/api/similarity', { mode: 'sources', refs }); fetched = res.sources || []; missing = res.missing || []; }
      catch (e) { failed = true; }
    } else if (!refs.length && !ownSources(m).length && m.places.length < 2) { App.toast(t('noRefs')); return; }
    else if (refs.length) failed = true;
    busy = t('comparing'); render();
    await new Promise(r => setTimeout(r, 30));
    const sources = [...fetched.map(x => ({ id: 'ref:' + x.i, title: x.title, apa: (m.refs[x.i] || {}).apa || x.title, text: x.abstract, kind: 'source' })), ...ownSources(m)];
    const cmp = C.compare(m.places.map(p => ({ label: p.label, text: p.text })), sources, {});
    result = { m, sources, cmp, fetched: fetched.length, missing: missing.length, failed, para: {} };
    busy = ''; render();
  }

  async function paraphrase(k) {
    const r = result, ps = r.cmp.passages[k];
    const src = r.sources[ps.source];
    if (!(await App.ensureAI())) return;
    r.para[k] = { busy: true }; render();
    try {
      const res = await App.apiPost('/api/similarity', { mode: 'paraphrase', sentence: ps.sentence.text, source: ps.match, language: r.m.language || (lang() === 'en' ? 'English' : 'Bahasa Melayu') });
      r.para[k] = { text: res.paraphrase, before: C.coverage(ps.sentence.text, src.text), after: C.coverage(res.paraphrase, src.text) };
    } catch (e) { r.para[k] = null; App.toast(e.message || 'Error'); }
    render();
  }
  async function use(k) {
    const r = result, ps = r.cmp.passages[k], place = r.m.places[ps.place], sug = r.para[k];
    const owner = place.owner, old = ps.sentence.text;
    const content = String(owner.content || '');
    const at = content.indexOf(old);
    if (at < 0 || content.indexOf(old, at + 1) >= 0) {
      try { await navigator.clipboard.writeText(sug.text); } catch (e) { /* ignore */ }
      App.toast(t('notFound')); return;
    }
    if (place.thesis) { if (!Array.isArray(owner.history)) owner.history = []; owner.history.push({ content, at: App.date() }); if (owner.history.length > 15) owner.history.shift(); }
    owner.content = content.slice(0, at) + sug.text + content.slice(at + old.length);
    if (place.touch) place.touch();
    place.text = owner.content;
    App.save(); if (place.thesis && App.render) App.render();
    sug.used = true;
    App.toast(t('used', { s: place.title }));
    render();
  }

  /* ---------- view ---------- */
  const band = p => (p < 10 ? 'low' : p < 20 ? 'mid' : 'high');
  /* The whole sentence, with the words that match the source marked. */
  function highlighted(ps) {
    const s = ps.sentence, full = s.text;
    const raw = result.m.places[ps.place].text.slice(s.s, s.e);
    const lead = raw.length - raw.trimStart().length;
    const from = ps.start - s.s - lead, to = ps.end - s.s - lead;
    if (from < 0 || to > full.length) return h('p', { class: 'sm-sent', text: full });
    return h('p', { class: 'sm-sent' }, full.slice(0, from), h('mark', { text: full.slice(from, to) }), full.slice(to));
  }
  function render() {
    const root = $('#view-similarity');
    if (!root) return;
    const s = App.state();
    const sel = h('select', { 'aria-label': t('scope'), onchange: e => { scope = e.target.value; result = null; render(); } },
      h('option', { value: 'thesis', text: t('thesis') + ': ' + (((s.project || {}).title || '').trim() || '—') }),
      (s.papers || []).map(p => h('option', { value: 'paper:' + p.id, text: t('paper') + ': ' + (((p.title || '').trim()) || '—') })));
    sel.value = scope;
    const parts = [
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'similarityTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'card ana-form' },
        h('label', { class: 'form-field' }, h('span', { text: t('scope') }), sel),
        h('label', { class: 'sm-check' }, h('input', { type: 'checkbox', checked: withOwn, onchange: e => { withOwn = e.target.checked; } }), h('span', { text: t('own') })),
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: !!busy, onclick: run, text: t('go') }), busy ? h('span', { class: 'chat-activity', role: 'status', text: busy }) : null),
        h('p', { class: 'muted small-note', text: t('limit') }))
    ];
    if (result) {
      const r = result, c = r.cmp;
      const b = band(c.pct);
      parts.push(h('div', { class: 'card sm-score sm-' + b },
        h('div', { class: 'sm-big' }, h('span', { class: 'sm-pct', text: c.pct.toFixed(1) + '%' }), h('span', { class: 'sm-band', text: t('band.' + b) })),
        h('p', { class: 'sm-label', text: t('pct') }),
        h('p', { class: 'muted small-note', text: t('checked', { a: r.fetched, m: r.missing }) }),
        r.failed ? h('p', { class: 'result-notes', text: t('fail') }) : null));
      if (!c.passages.length) parts.push(h('div', { class: 'card au-clean' }, '✅ ', t('clean')));
      else parts.push(h('div', { class: 'card' }, h('h3', {}, t('passages'), ' ', h('span', { class: 'au-n', text: String(c.passages.length) })),
        h('ol', { class: 'sm-list' }, c.passages.map((ps, k) => {
          const src = r.sources[ps.source], sug = r.para[k], place = r.m.places[ps.place];
          return h('li', {},
            highlighted(ps),
            h('p', { class: 'sm-meta' }, h('span', { class: 'sm-words', text: t('words', { n: ps.words }) }), ' · ', t('from'), ' ', h('span', { class: 'sm-src' + (src.kind === 'own' ? ' own' : ''), text: (src.kind === 'own' ? t('ownTag') + ': ' : '') + src.title })),
            h('div', { class: 'au-where' }, h('span', { class: 'muted small-note', text: t('at') + ' ' + place.label }), h('button', { type: 'button', class: 'btn-reset text-action', onclick: place.open, text: t('open') })),
            sug && sug.text ? h('div', { class: 'sm-para' }, h('p', { text: sug.text }), h('p', { class: 'muted small-note', text: t('before', { a: sug.before.toFixed(0) }) + ' → ' + t('after', { b: sug.after.toFixed(0) }) }),
              sug.used ? null : h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary btn-mini', onclick: () => use(k), text: t('use') }), h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => paraphrase(k), text: '↻' }))) : null,
            !sug || (!sug.text && !sug.busy) ? h('button', { type: 'button', class: 'btn btn-outline btn-mini', onclick: () => paraphrase(k), text: t('para') }) : null,
            sug && sug.busy ? h('span', { class: 'chat-activity', role: 'status', text: t('paraBusy') }) : null);
        }))));
      if (c.bySource.length) parts.push(h('div', { class: 'card' }, h('h3', { text: t('sources') }), h('ul', { class: 'sm-sources' }, c.bySource.map(x => { const src = r.sources[x.i]; return h('li', {}, h('span', { class: 'sm-src' + (src.kind === 'own' ? ' own' : ''), text: (src.kind === 'own' ? t('ownTag') + ': ' : '') + (src.apa || src.title) }), h('strong', { text: (x.words / Math.max(1, c.total) * 100).toFixed(1) + '%' })); }))));
      if (c.repeats.length) parts.push(h('div', { class: 'card au-block au-warn' }, h('h3', {}, t('repeats'), ' ', h('span', { class: 'au-n', text: String(c.repeats.length) })), h('p', { class: 'muted small-note', text: t('repeatsHelp') }),
        h('ul', { class: 'au-list' }, c.repeats.map(x => h('li', {}, h('p', { class: 'au-snippet', text: '…' + x.a.text.slice(0, 260) + (x.a.text.length > 260 ? '…' : '') }), h('span', { class: 'muted small-note', text: t('words', { n: x.words }) + ' · ' + x.a.label + ' ' + t('and') + ' ' + x.b.label }))))));
    }
    fill(root, parts);
  }

  window.TalkademicSimilarity = { render, run };
})();
