/* Talkademic "Analisis Data": paste SmartPLS / SPSS output (or open a .csv/.txt/.html export),
   get a plain-language explanation, threshold checks, a results table and an APA Results write-up
   that can go straight into a paper or the thesis. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Analisis Data', alt: 'Data Analysis', sub: 'Tampal output SmartPLS atau SPSS. Talkademic terangkan maksudnya, semak ambang piawai, dan tulis bahagian Dapatan gaya APA.',
      kind: 'Jenis analisis', 'k.auto': 'Kenal pasti sendiri', 'k.measurement': 'PLS-SEM: model pengukuran', 'k.structural': 'PLS-SEM: model struktur', 'k.descriptive': 'Deskriptif', 'k.reliability': 'Kebolehpercayaan (Cronbach)',
      'k.correlation': 'Korelasi', 'k.regression': 'Regresi', 'k.ttest': 'Ujian-t', 'k.anova': 'ANOVA', 'k.efa': 'Analisis faktor (EFA)', 'k.cfa': 'CB-SEM / CFA (AMOS)', 'k.other': 'Lain-lain',
      write: 'Bahasa tulisan', hyp: 'Hipotesis (pilihan)', hypPh: 'H1: Kualiti imej mempengaruhi kepercayaan…',
      out: 'Output statistik', outPh: 'Tampal jadual daripada SmartPLS (Copy to clipboard) atau SPSS (klik kanan jadual → Copy)…', file: 'Buka fail (.csv, .txt, .html)',
      go: 'Analisis', busy: 'Menganalisis output… (sehingga 1 minit)', need: 'Tampal output statistik dahulu.',
      means: 'Maksudnya', checks: 'Semakan ambang', table: 'Jadual keputusan', writeup: 'Bahagian Dapatan (boleh disunting)', refs: 'Rujukan kaedah', warn: 'Perlu diberi perhatian',
      pass: 'Lulus', fail: 'Tidak lulus', check: 'Semak', copy: 'Salin', copied: 'Disalin.', toPaper: 'Masukkan ke Dapatan paper', toThesis: 'Masukkan ke bahagian tesis semasa', noPaper: 'Belum ada paper. Cipta di Jurnal & Paper.',
      inserted: 'Dimasukkan ke "{s}" bersama {n} rujukan baharu.', note: 'Angka diambil terus daripada output anda. Semak semula, terutamanya tanda [NILAI?] yang perlu diisi.', choose: 'Pilih paper', csv: 'Ada fail CSV soal selidik (Google Forms)? Buka Analisis Soal Selidik'
    },
    en: {
      title: 'Data Analysis', alt: 'Analisis Data', sub: 'Paste SmartPLS or SPSS output. Talkademic explains it, checks the standard thresholds and writes an APA Results section.',
      kind: 'Analysis type', 'k.auto': 'Detect automatically', 'k.measurement': 'PLS-SEM: measurement model', 'k.structural': 'PLS-SEM: structural model', 'k.descriptive': 'Descriptive', 'k.reliability': "Reliability (Cronbach's alpha)",
      'k.correlation': 'Correlation', 'k.regression': 'Regression', 'k.ttest': 't-test', 'k.anova': 'ANOVA', 'k.efa': 'Factor analysis (EFA)', 'k.cfa': 'CB-SEM / CFA (AMOS)', 'k.other': 'Other',
      write: 'Write in', hyp: 'Hypotheses (optional)', hypPh: 'H1: Image quality influences trust…',
      out: 'Statistical output', outPh: 'Paste tables from SmartPLS (Copy to clipboard) or SPSS (right-click a table → Copy)…', file: 'Open a file (.csv, .txt, .html)',
      go: 'Analyse', busy: 'Analysing the output… (up to a minute)', need: 'Paste the statistical output first.',
      means: 'What it means', checks: 'Threshold checks', table: 'Results table', writeup: 'Results section (editable)', refs: 'Method references', warn: 'Needs attention',
      pass: 'Pass', fail: 'Fail', check: 'Check', copy: 'Copy', copied: 'Copied.', toPaper: "Add to a paper's Results", toThesis: 'Add to the current thesis section', noPaper: 'No papers yet. Create one in Journal Papers.',
      inserted: 'Added to "{s}" with {n} new references.', note: 'Numbers come straight from your output. Check them again, especially any [VALUE?] markers to fill in.', choose: 'Choose paper', csv: 'Have a questionnaire CSV (Google Forms)? Open Survey Analysis'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  /* replaceChildren turns null into the text "null", so drop empty parts first. */
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'rows', 'maxLength'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const KINDS = ['auto', 'measurement', 'structural', 'descriptive', 'reliability', 'correlation', 'regression', 'ttest', 'anova', 'efa', 'cfa', 'other'];
  let busy = false;
  function data() {
    const s = App.state();
    if (!s.analysis || typeof s.analysis !== 'object') s.analysis = { kind: 'auto', language: lang() === 'en' ? 'English' : 'Bahasa Melayu', hypotheses: '', output: '', result: null, references: [] };
    return s.analysis;
  }

  function render() {
    const root = $('#view-analysis');
    if (!root) return;
    const d = data();
    const kind = h('select', { 'aria-label': t('kind'), onchange: e => { d.kind = e.target.value; App.save(); } }, KINDS.map(k => h('option', { value: k, text: t('k.' + k) })));
    kind.value = d.kind;
    const wl = h('select', { 'aria-label': t('write'), onchange: e => { d.language = e.target.value; App.save(); } }, h('option', { value: 'Bahasa Melayu', text: 'Bahasa Melayu' }), h('option', { value: 'English', text: 'English' }));
    wl.value = d.language;
    const out = h('textarea', { id: 'anaOutput', rows: 10, maxLength: 30000, placeholder: t('outPh'), value: d.output, spellcheck: 'false', oninput: e => { d.output = e.target.value; App.save(); } });
    const file = h('input', { type: 'file', accept: '.csv,.txt,.tsv,.htm,.html,text/plain,text/csv,text/html', hidden: true, onchange: async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      let text = await f.text();
      if (/\.html?$/i.test(f.name) || /<table/i.test(text)) {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        text = Array.from(doc.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(c => c.textContent.trim()).join('\t')).join('\n') || doc.body.textContent;
      }
      d.output = text.slice(0, 30000); App.save(); render();
    } });
    fill(root, 
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'analysisTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('button', { type: 'button', class: 'btn-reset text-action ana-csv', onclick: () => shell().go && shell().go('survey'), text: t('csv') }),
      h('div', { class: 'card ana-form' },
        h('div', { class: 'ana-row' }, h('label', { class: 'form-field' }, h('span', { text: t('kind') }), kind), h('label', { class: 'form-field' }, h('span', { text: t('write') }), wl)),
        h('label', { class: 'form-field' }, h('span', { text: t('hyp') }), h('textarea', { rows: 3, maxLength: 3000, placeholder: t('hypPh'), value: d.hypotheses, oninput: e => { d.hypotheses = e.target.value; App.save(); } })),
        h('label', { class: 'form-field' }, h('span', { text: t('out') }), out),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: run }, '📊 ', t('go')),
          h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => file.click(), text: t('file') }), file,
          busy ? h('span', { class: 'chat-activity', role: 'status', text: t('busy') }) : null)),
      d.result ? result(d) : null);
  }

  function result(d) {
    const r = d.result;
    const icon = { pass: '✓', fail: '✗', check: '?' };
    const write = h('textarea', { rows: 12, value: r.writeup, 'aria-label': t('writeup'), oninput: e => { r.writeup = e.target.value; App.save(); } });
    const papers = (App.state().papers || []);
    const sel = h('select', { 'aria-label': t('choose') }, papers.map(p => h('option', { value: p.id, text: (p.title || '').trim() || '—' })));
    return h('div', { class: 'ana-result' },
      h('div', { class: 'card' },
        h('p', { class: 'ana-badge' }, h('strong', { text: r.analysis || '' }), r.software ? ' · ' + r.software : ''),
        h('h3', { text: t('means') }), h('p', { text: r.summary })),
      r.checks.length ? h('div', { class: 'card' }, h('h3', { text: t('checks') }),
        h('ul', { class: 'ana-checks' }, r.checks.map(c => h('li', { class: 'st-' + c.status },
          h('span', { class: 'st-dot', 'aria-label': t(c.status), text: icon[c.status] }),
          h('span', { class: 'ck-item', text: c.item }), h('span', { class: 'ck-val', text: c.value }), h('span', { class: 'ck-th muted', text: c.threshold }))))) : null,
      r.table ? h('div', { class: 'card' }, h('h3', { text: r.table.title || t('table') }),
        h('div', { class: 'ana-table-wrap' }, h('table', { class: 'ana-table' },
          h('thead', {}, h('tr', {}, r.table.columns.map(c => h('th', { text: c })))),
          h('tbody', {}, r.table.rows.map(row => h('tr', {}, row.map(c => h('td', { text: c })))))))) : null,
      r.warnings.length ? h('div', { class: 'card ana-warn' }, h('h3', { text: t('warn') }), h('ul', {}, r.warnings.map(w => h('li', { text: w })))) : null,
      h('div', { class: 'card' },
        h('h3', { text: t('writeup') }), write,
        d.references.length ? h('details', { class: 'ana-refs' }, h('summary', { text: t('refs') + ' (' + d.references.length + ')' }), h('ol', {}, d.references.map(x => h('li', { text: x.apa })))) : null,
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-outline', onclick: async () => { try { await navigator.clipboard.writeText(r.writeup); App.toast(t('copied')); } catch (e) { write.select(); document.execCommand('copy'); App.toast(t('copied')); } }, text: t('copy') }),
          h('button', { type: 'button', class: 'btn btn-outline', onclick: () => toThesis(d) }, t('toThesis'))),
        papers.length ? h('div', { class: 'tool-row' }, sel, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => toPaper(d, sel.value) }, t('toPaper'))) : h('p', { class: 'muted small-note', text: t('noPaper') }),
        h('p', { class: 'result-notes', text: t('note') })));
  }

  async function run() {
    const d = data();
    if (String(d.output || '').replace(/\s+/g, '').length < 20) { App.toast(t('need')); return; }
    if (!(await App.ensureAI())) return;
    busy = true; render();
    try {
      const res = await App.apiPost('/api/analysis', { output: d.output, kind: d.kind, language: d.language, uiLang: lang(), hypotheses: d.hypotheses, title: (App.state().project || {}).title || '' });
      d.result = res.result; d.references = res.references || []; d.at = new Date().toISOString();
      App.save();
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }

  const refShape = r => ({ apa: r.apa, doi: r.doi || '', url: r.url || '', title: r.title || '', year: String(r.year || ''), authors: r.authors || [], venue: r.venue || '', volume: r.volume || '', issue: r.issue || '', pages: r.pages || '', type: r.type || 'method', addedAt: new Date().toISOString().slice(0, 10) });
  function merge(list, refs) {
    const key = r => String(r.doi || r.apa || '').toLowerCase();
    let n = 0;
    for (const r of refs) if (r && r.apa && !list.some(x => key(x) === key(r))) { list.push(refShape(r)); n++; }
    return n;
  }
  function toPaper(d, id) {
    const p = (App.state().papers || []).find(x => x.id === id);
    if (!p) return;
    let sec = (p.sections || []).find(x => x.key === 'results');
    if (!sec) { sec = { key: 'results', content: '' }; p.sections.push(sec); }
    sec.content = (sec.content.trim() ? sec.content.trim() + '\n\n' : '') + d.result.writeup.trim();
    if (!Array.isArray(p.references)) p.references = [];
    const n = merge(p.references, d.references);
    p.updated = new Date().toISOString(); App.save();
    App.toast(t('inserted', { n, s: (p.title || '').trim() || '—' }));
  }
  function toThesis(d) {
    const sec = App.section();
    if (!sec) return;
    if (!Array.isArray(sec.history)) sec.history = [];
    if (String(sec.content || '').trim()) { sec.history.push({ content: sec.content, at: App.date() }); if (sec.history.length > 15) sec.history.shift(); }
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + d.result.writeup.trim();
    const s = App.state();
    if (!Array.isArray(s.references)) s.references = [];
    const n = merge(s.references, d.references);
    App.save(); if (App.render) App.render();
    App.toast(t('inserted', { n, s: sec.title }));
  }

  window.TalkademicAnalysis = { render };
})();
