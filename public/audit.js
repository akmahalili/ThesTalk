/* Talkademic "Audit Sitasi": checks the thesis or a paper before it goes to a supervisor or journal:
   citations with no reference, wrong years, references never cited, 2019a/2019b, APA et al. rules,
   and DOIs (checked on OpenAlex, with suggestions for references that have none). */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const A = window.TalkademicCiteAudit;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Audit Sitasi', alt: 'Citation Audit', sub: 'Semak setiap sitasi dalam teks dengan senarai rujukan sebelum hantar kepada penyelia atau jurnal.',
      scope: 'Semak', thesis: 'Tesis', paper: 'Paper', go: 'Audit sekarang', busy: 'Menyemak DOI di OpenAlex…', doiFail: 'Semakan DOI tidak dapat dibuat sekarang. Semakan lain tetap sah.',
      summary: '{c} sitasi dalam teks · {r} rujukan', clean: 'Semua sitasi sepadan dengan senarai rujukan. Tiada masalah ditemui.',
      missing: 'Sitasi tanpa rujukan', missingHelp: 'Tambah rujukan ini ke senarai, atau betulkan ejaan/tahun dalam teks.',
      yearOff: 'Tahun tidak sepadan', yearOffHelp: 'Pengarang ada dalam senarai tetapi dengan tahun lain.', listHas: 'senarai: {y}',
      uncited: 'Rujukan tidak disitasi', uncitedHelp: 'APA: setiap rujukan dalam senarai mesti disitasi dalam teks.', remove: 'Buang', confirmRemove: 'Buang rujukan ini daripada senarai?',
      suffix: 'Perlu 2019a / 2019b', suffixHelp: 'Pengarang dan tahun yang sama: tambah a, b pada tahun dalam senarai dan dalam teks.', ambiguous: 'Sitasi ini boleh merujuk lebih daripada satu karya',
      style: 'Gaya APA 7', 'st.needEtal': 'Tiga pengarang atau lebih: guna "et al." dari sitasi pertama.', 'st.etalTwo': 'Dua pengarang: namakan kedua-duanya, jangan guna "et al."',
      'st.refEtal': 'Senarai rujukan tidak guna "et al.": tulis semua pengarang (sehingga 20).', 'st.refNoYear': 'Tiada tahun. Tambah tahun atau tulis (t.t.).',
      doi: 'DOI', 'doi.notfound': 'DOI tidak dijumpai. Semak semula nombornya.', 'doi.mismatch': 'DOI ini menunjuk kepada karya lain: {t} ({y}).', 'doi.suggest': 'DOI dicadangkan: {d}', addDoi: 'Tambah DOI', doiAdded: 'DOI ditambah.', 'doi.ok': '{n} DOI disahkan di OpenAlex.',
      open: 'Buka', at: 'di', none: 'Tiada', removed: 'Rujukan dibuang.'
    },
    en: {
      title: 'Citation Audit', alt: 'Audit Sitasi', sub: 'Check every in-text citation against the reference list before it goes to a supervisor or a journal.',
      scope: 'Check', thesis: 'Thesis', paper: 'Paper', go: 'Run audit', busy: 'Checking DOIs on OpenAlex…', doiFail: 'The DOI check could not run right now. The other checks are still valid.',
      summary: '{c} in-text citations · {r} references', clean: 'Every citation matches the reference list. No problems found.',
      missing: 'Citations with no reference', missingHelp: 'Add the reference to the list, or fix the spelling/year in the text.',
      yearOff: 'Year does not match', yearOffHelp: 'The author is in the list but with another year.', listHas: 'list: {y}',
      uncited: 'References never cited', uncitedHelp: 'APA: every reference in the list must be cited in the text.', remove: 'Remove', confirmRemove: 'Remove this reference from the list?',
      suffix: 'Needs 2019a / 2019b', suffixHelp: 'Same author and year: add a, b to the year in the list and in the text.', ambiguous: 'This citation could point to more than one work',
      style: 'APA 7 style', 'st.needEtal': 'Three or more authors: use "et al." from the first citation.', 'st.etalTwo': 'Two authors: name both, do not use "et al."',
      'st.refEtal': 'The reference list does not use "et al.": list all authors (up to 20).', 'st.refNoYear': 'No year. Add the year or write (n.d.).',
      doi: 'DOI', 'doi.notfound': 'DOI not found. Check the number again.', 'doi.mismatch': 'This DOI points to another work: {t} ({y}).', 'doi.suggest': 'Suggested DOI: {d}', addDoi: 'Add DOI', doiAdded: 'DOI added.', 'doi.ok': '{n} DOIs confirmed on OpenAlex.',
      open: 'Open', at: 'in', none: 'None', removed: 'Reference removed.'
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
      else if (['value', 'disabled', 'hidden'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  let scope = 'thesis', result = null, dois = null, busy = false, doiError = false;

  /* What to check: text places (with a way to open each) and the matching reference list. */
  function material() {
    const s = App.state();
    if (scope.startsWith('paper:')) {
      const p = (s.papers || []).find(x => 'paper:' + x.id === scope);
      if (!p) return null;
      if (!Array.isArray(p.references)) p.references = [];
      const P = window.ThesTalkPapers || {};
      return { refs: p.references, places: (p.sections || []).filter(x => String(x.content || '').trim()).map(x => ({ label: P.label ? P.label(p, x.key) : x.key, text: x.content, open: () => { P.open(p.id, x.key); shell().go('papers'); } })) };
    }
    if (!Array.isArray(s.references)) s.references = [];
    const places = [];
    for (const ch of s.chapters || []) for (const sec of ch.sections || []) if (String(sec.content || '').trim()) places.push({ label: ch.title.split(':')[0] + ' › ' + sec.title, text: sec.content, open: () => { App.select(ch.id, sec.id); shell().go('academic'); } });
    return { refs: s.references, places };
  }

  async function run() {
    const m = material();
    if (!m) return;
    result = A.audit(m.places, m.refs);
    result.material = m;
    dois = null; doiError = false;
    render();
    if (!m.refs.length || !App.accessCode || !App.accessCode()) return;
    busy = true; render();
    try {
      const res = await App.apiPost('/api/audit', { refs: m.refs.map((r, i) => ({ i, doi: r.doi || '', title: r.title || '', year: String(r.year || '') })) });
      dois = res.checks || [];
    } catch (e) { doiError = true; }
    finally { busy = false; render(); }
  }

  const block = (title, help, items, tone) => h('div', { class: 'card au-block au-' + tone },
    h('h3', {}, title, ' ', h('span', { class: 'au-n', text: String(items.length) })),
    help ? h('p', { class: 'muted small-note', text: help }) : null,
    items.length ? h('ul', { class: 'au-list' }, items) : h('p', { class: 'muted', text: t('none') }));
  const where = item => h('div', { class: 'au-where' },
    h('span', { class: 'muted small-note', text: t('at') + ' ' + item.place.label }),
    h('button', { type: 'button', class: 'btn-reset text-action', onclick: item.place.open, text: t('open') }));
  const quote = s => h('p', { class: 'au-snippet', text: '…' + s + '…' });

  function render() {
    const root = $('#view-audit');
    if (!root) return;
    const s = App.state();
    const sel = h('select', { 'aria-label': t('scope'), onchange: e => { scope = e.target.value; result = null; dois = null; render(); } },
      h('option', { value: 'thesis', text: t('thesis') + ': ' + ((s.project || {}).title || '') }),
      (s.papers || []).map(p => h('option', { value: 'paper:' + p.id, text: t('paper') + ': ' + ((p.title || '').trim() || '—') })));
    sel.value = scope;
    const parts = [
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'auditTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'card ana-form' },
        h('label', { class: 'form-field' }, h('span', { text: t('scope') }), sel),
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: run }, '🔍 ', t('go')), busy ? h('span', { class: 'chat-activity', role: 'status', text: t('busy') }) : null))
    ];
    if (result) parts.push(results());
    fill(root, parts);
  }

  function results() {
    const r = result, m = r.material;
    const doiBad = (dois || []).filter(d => d.status !== 'ok');
    const total = r.missing.length + r.yearOff.length + r.uncited.length + r.needSuffix.length + r.ambiguous.length + r.style.length + doiBad.length;
    const refLine = ref => h('p', { class: 'au-ref', text: ref.apa || ref.title || '—' });
    const out = [h('p', { class: 'au-summary' }, h('strong', { text: t('summary', { c: r.cites, r: r.refs }) }))];
    if (!total && !busy) out.push(h('div', { class: 'card au-clean' }, '✅ ', t('clean'), dois && dois.length ? h('p', { class: 'muted small-note', text: t('doi.ok', { n: dois.filter(d => d.status === 'ok').length }) }) : null));
    if (r.missing.length) out.push(block(t('missing'), t('missingHelp'), r.missing.map(x => h('li', {}, h('strong', { class: 'au-cite', text: x.cite }), quote(x.snippet), where(x))), 'bad'));
    if (r.yearOff.length) out.push(block(t('yearOff'), t('yearOffHelp'), r.yearOff.map(x => h('li', {}, h('strong', { class: 'au-cite', text: x.cite }), h('span', { class: 'au-tag', text: t('listHas', { y: x.listYears.join(', ') }) }), quote(x.snippet), where(x))), 'warn'));
    if (r.uncited.length) out.push(block(t('uncited'), t('uncitedHelp'), r.uncited.map(x => h('li', {}, refLine(x.r),
      h('button', { type: 'button', class: 'btn-reset text-action danger', onclick: () => { if (!confirm(t('confirmRemove'))) return; const i = m.refs.indexOf(x.r); if (i >= 0) m.refs.splice(i, 1); App.save(); if (App.renderRefsList) App.renderRefsList(); App.toast(t('removed')); run(); }, text: t('remove') }))), 'warn'));
    if (r.needSuffix.length || r.ambiguous.length) out.push(block(t('suffix'), t('suffixHelp'), [
      ...r.needSuffix.map(g => h('li', {}, g.map(refLine))),
      ...r.ambiguous.map(x => h('li', {}, h('strong', { class: 'au-cite', text: x.cite }), h('span', { class: 'au-tag', text: t('ambiguous') }), where(x)))
    ], 'warn'));
    if (r.style.length) out.push(block(t('style'), '', r.style.map(x => h('li', {}, x.cite ? h('strong', { class: 'au-cite', text: x.cite }) : refLine(x.ref), h('p', { class: 'au-msg', text: t('st.' + x.kind) }), x.place ? where(x) : null)), 'info'));
    if (doiError) out.push(h('p', { class: 'result-notes', text: t('doiFail') }));
    if (dois && doiBad.length) out.push(block(t('doi'), '', doiBad.map(d => {
      const ref = m.refs[d.i];
      if (!ref) return null;
      const msg = d.status === 'notfound' ? t('doi.notfound') : d.status === 'mismatch' ? t('doi.mismatch', { t: d.title, y: d.year }) : t('doi.suggest', { d: d.doi });
      return h('li', {}, refLine(ref), h('p', { class: 'au-msg', text: msg }),
        d.status === 'suggest' ? h('button', { type: 'button', class: 'btn btn-outline btn-mini', onclick: () => {
          ref.doi = d.doi; ref.url = 'https://doi.org/' + d.doi;
          if (ref.apa && !/doi\.org\//i.test(ref.apa)) ref.apa = ref.apa.trim().replace(/\s*$/, '') + ' https://doi.org/' + d.doi;
          App.save(); if (App.renderRefsList) App.renderRefsList(); App.toast(t('doiAdded'));
          dois = dois.filter(x => x !== d); render();
        } }, '🔗 ', t('addDoi')) : null);
    }), 'info'));
    return h('div', { class: 'au-results' }, out);
  }

  window.TalkademicAudit = { render, run };
})();
