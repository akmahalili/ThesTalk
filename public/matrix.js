/* Talkademic "Matriks Literatur": add article PDFs (text is read on the phone with pdf.js),
   get one matrix row per article with a reference confirmed on OpenAlex, edit the cells,
   download the matrix as Excel, add the references, and synthesise themes, gaps and a
   cited literature-review passage. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const COLS = ['context', 'theory', 'method', 'sample', 'analysis', 'findings', 'gap', 'relevance'];
  const S = {
    ms: {
      title: 'Matriks Literatur', alt: 'Literature Matrix', sub: 'Masukkan PDF artikel. Talkademic isi matriks (konteks, teori, kaedah, sampel, analisis, dapatan, jurang), sahkan rujukan di OpenAlex, dan bantu tulis sintesis.',
      focus: 'Topik kajian anda (untuk lajur Kaitan)', write: 'Bahasa matriks', addPdf: 'Tambah PDF', paste: 'Tampal teks', pastePh: 'Tampal tajuk, pengarang, abstrak dan bahagian kaedah/dapatan artikel…', extract: 'Masukkan ke matriks',
      reading: 'Membaca PDF…', working: 'Mengisi matriks…', done: 'Siap', dup: 'Sudah ada dalam matriks', notPdf: 'Bukan fail PDF', scanned: 'PDF ini imej imbasan, tiada teks. Guna "Tampal teks".', tooShort: 'Teks terlalu pendek. Tampal sekurang-kurangnya abstrak dan kaedah.',
      empty: 'Matriks masih kosong. Tambah PDF artikel untuk mula.', n: '{n} kajian',
      'c.study': 'Kajian', 'c.context': 'Konteks', 'c.theory': 'Teori', 'c.method': 'Kaedah', 'c.sample': 'Sampel', 'c.analysis': 'Analisis', 'c.findings': 'Dapatan', 'c.gap': 'Jurang / limitasi', 'c.relevance': 'Kaitan',
      verified: '✓ Disahkan OpenAlex', unverified: 'Semak rujukan', remove: 'Buang', confirmRemove: 'Buang kajian ini daripada matriks?', excel: 'Muat turun Excel', allRefs: 'Tambah semua ke rujukan tesis', refsDone: '{n} rujukan baharu ditambah ke tesis.',
      clear: 'Kosongkan', confirmClear: 'Kosongkan seluruh matriks? Rujukan yang sudah ditambah tidak terjejas.', editHint: 'Ketik mana-mana sel untuk menyunting.',
      synth: 'Sintesis & cari jurang', synthBusy: 'Menyusun tema dan jurang… (sehingga 1 minit)', synthNeed: 'Perlu sekurang-kurangnya 2 kajian.', themes: 'Tema', gaps: 'Jurang kajian', passage: 'Petikan tinjauan literatur (boleh disunting)', refs: 'Rujukan',
      copy: 'Salin', copied: 'Disalin.', toThesis: 'Masukkan ke bahagian tesis semasa', toPaper: 'Masukkan ke Tinjauan Literatur paper', choose: 'Pilih paper', inserted: 'Dimasukkan ke "{s}" bersama {n} rujukan baharu.',
      note: 'Semak setiap sel dengan artikel asal sebelum digunakan. Kajian bertanda "Semak rujukan" tidak dijumpai di OpenAlex, jadi butiran rujukannya diambil daripada PDF.', xlsxName: 'Talkademic-matriks-literatur'
    },
    en: {
      title: 'Literature Matrix', alt: 'Matriks Literatur', sub: 'Add article PDFs. Talkademic fills the matrix (context, theory, method, sample, analysis, findings, gap), confirms each reference on OpenAlex and helps you write the synthesis.',
      focus: 'Your research topic (for the Relevance column)', write: 'Matrix language', addPdf: 'Add PDFs', paste: 'Paste text', pastePh: "Paste the article's title, authors, abstract and method/findings…", extract: 'Add to matrix',
      reading: 'Reading PDF…', working: 'Filling the matrix…', done: 'Done', dup: 'Already in the matrix', notPdf: 'Not a PDF file', scanned: 'This PDF is a scanned image with no text. Use "Paste text".', tooShort: 'Text is too short. Paste at least the abstract and method.',
      empty: 'The matrix is empty. Add article PDFs to start.', n: '{n} studies',
      'c.study': 'Study', 'c.context': 'Context', 'c.theory': 'Theory', 'c.method': 'Method', 'c.sample': 'Sample', 'c.analysis': 'Analysis', 'c.findings': 'Findings', 'c.gap': 'Gap / limitations', 'c.relevance': 'Relevance',
      verified: '✓ Confirmed on OpenAlex', unverified: 'Check reference', remove: 'Remove', confirmRemove: 'Remove this study from the matrix?', excel: 'Download Excel', allRefs: 'Add all to thesis references', refsDone: '{n} new references added to the thesis.',
      clear: 'Clear', confirmClear: 'Clear the whole matrix? References already added are kept.', editHint: 'Tap any cell to edit it.',
      synth: 'Synthesise & find gaps', synthBusy: 'Finding themes and gaps… (up to a minute)', synthNeed: 'Needs at least 2 studies.', themes: 'Themes', gaps: 'Research gaps', passage: 'Literature review passage (editable)', refs: 'References',
      copy: 'Copy', copied: 'Copied.', toThesis: 'Add to the current thesis section', toPaper: "Add to a paper's Literature Review", choose: 'Choose paper', inserted: 'Added to "{s}" with {n} new references.',
      note: 'Check every cell against the original article before using it. Studies marked "Check reference" were not found on OpenAlex, so their reference details come from the PDF.', xlsxName: 'Talkademic-literature-matrix'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'rows', 'maxLength', 'multiple'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const queue = [];
  let working = false, synthBusy = false, pasteOpen = false;
  function data() {
    const s = App.state();
    if (!s.matrix || typeof s.matrix !== 'object') s.matrix = { focus: '', language: lang() === 'en' ? 'English' : 'Bahasa Melayu', rows: [], synth: null };
    if (!Array.isArray(s.matrix.rows)) s.matrix.rows = [];
    return s.matrix;
  }
  const focusOf = d => (d.focus || '').trim() || ((App.state().project || {}).title || '').trim();
  const label = r => r.cite || ((r.authors && r.authors[0] ? r.authors[0].split(/\s+/).pop() + (r.authors.length > 2 ? ' et al.' : r.authors.length === 2 ? ' & ' + r.authors[1].split(/\s+/).pop() : '') : (r.title || '').slice(0, 40)) + ' (' + (r.year || 'n.d.') + ')');
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  /* ---------- PDF text (pdf.js, loaded only when needed) ---------- */
  let pdfjs = null;
  async function pdfText(file) {
    if (!pdfjs) {
      pdfjs = await import('/vendor/pdfjs/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
    }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, isEvalSupported: false, useSystemFonts: true }).promise;
    let out = '';
    try {
      for (let i = 1; i <= Math.min(doc.numPages, 45) && out.length < 190000; i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        for (const it of tc.items) { out += it.str; out += it.hasEOL ? '\n' : (it.str && !/\s$/.test(it.str) ? ' ' : ''); }
        out += '\n\n';
        page.cleanup();
      }
    } finally { doc.destroy(); }
    // Join words broken across lines with a hyphen.
    return out.replace(/(\w)-\n(\w)/g, '$1$2').replace(/[ \t]+\n/g, '\n').slice(0, 190000);
  }

  /* ---------- adding studies ---------- */
  function addFiles(files) {
    for (const f of files) queue.push({ id: App.uid(), name: f.name, file: f, status: /\.pdf$/i.test(f.name) || f.type === 'application/pdf' ? 'wait' : 'error', error: /\.pdf$/i.test(f.name) || f.type === 'application/pdf' ? '' : t('notPdf') });
    renderQueue();
    pump();
  }
  async function pump() {
    if (working) return;
    const job = queue.find(j => j.status === 'wait');
    if (!job) return;
    if (!(await App.ensureAI())) { queue.forEach(j => { if (j.status === 'wait') { j.status = 'error'; j.error = '—'; } }); renderQueue(); return; }
    working = true;
    try {
      let text = job.text || '';
      if (job.file && data().rows.some(r => r.file === job.name)) throw new Error(t('dup'));
      if (job.file) {
        job.status = 'read'; renderQueue();
        text = await pdfText(job.file);
        job.file = null;
        if (text.replace(/\s+/g, '').length < 300) throw new Error(t('scanned'));
      }
      job.status = 'ai'; renderQueue();
      const d = data();
      const res = await App.apiPost('/api/matrix', { mode: 'extract', text, fileName: job.name, focus: focusOf(d), language: d.language });
      const row = res.row;
      if (d.rows.some(r => (row.doi && r.doi && r.doi.toLowerCase() === row.doi.toLowerCase()) || (norm(r.title) && norm(r.title) === norm(row.title)))) { job.status = 'error'; job.error = t('dup'); }
      else { d.rows.push({ id: App.uid(), file: job.name, addedAt: App.date(), ...row }); job.status = 'done'; App.save(); render(); }
    } catch (e) {
      job.status = 'error'; job.error = e.message || 'Error';
    } finally {
      working = false; renderQueue();
      setTimeout(pump, 0);
    }
  }

  /* ---------- views ---------- */
  function renderQueue() {
    const box = $('#matrixQueue');
    if (!box) return;
    const icon = { wait: '…', read: '⟳', ai: '⟳', done: '✓', error: '✗' };
    const text = j => j.status === 'wait' ? '' : j.status === 'read' ? t('reading') : j.status === 'ai' ? t('working') : j.status === 'done' ? t('done') : j.error;
    box.replaceChildren(...queue.slice(-12).map(j => h('li', { class: 'mq-' + j.status }, h('span', { class: 'mq-ic', 'aria-hidden': 'true', text: icon[j.status] }), h('span', { class: 'mq-name', text: j.name }), h('span', { class: 'mq-st', text: text(j) }))));
    box.hidden = !queue.length;
  }

  function render() {
    const root = $('#view-matrix');
    if (!root) return;
    const d = data();
    const file = h('input', { type: 'file', accept: 'application/pdf,.pdf', multiple: true, hidden: true, onchange: e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) addFiles(f); } });
    const wl = h('select', { 'aria-label': t('write'), onchange: e => { d.language = e.target.value; App.save(); } }, h('option', { value: 'Bahasa Melayu', text: 'Bahasa Melayu' }), h('option', { value: 'English', text: 'English' }));
    wl.value = d.language;
    const pasteBox = h('textarea', { rows: 7, maxLength: 60000, placeholder: t('pastePh'), id: 'matrixPaste' });
    root.replaceChildren(
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'matrixTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'card ana-form' },
        h('div', { class: 'ana-row' },
          h('label', { class: 'form-field' }, h('span', { text: t('focus') }), h('input', { type: 'text', maxLength: 400, value: d.focus || '', placeholder: ((App.state().project || {}).title || ''), oninput: e => { d.focus = e.target.value; App.save(); } })),
          h('label', { class: 'form-field' }, h('span', { text: t('write') }), wl)),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => file.click() }, '📄 ', t('addPdf')), file,
          h('button', { type: 'button', class: 'btn-reset text-action', 'aria-expanded': String(pasteOpen), onclick: () => { pasteOpen = !pasteOpen; render(); }, text: t('paste') })),
        pasteOpen ? h('div', { class: 'mx-paste' }, pasteBox, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => {
          const v = pasteBox.value.trim();
          if (v.replace(/\s+/g, '').length < 300) { App.toast(t('tooShort')); return; }
          queue.push({ id: App.uid(), name: v.split('\n')[0].slice(0, 80), text: v, status: 'wait' });
          pasteOpen = false; render(); pump();
        }, text: t('extract') })) : null,
        h('ul', { class: 'mx-queue', id: 'matrixQueue', hidden: true })),
      table(d),
      d.rows.length ? synthCard(d) : null);
    renderQueue();
  }

  function table(d) {
    if (!d.rows.length) return h('div', { class: 'card mx-empty' }, h('p', { class: 'muted', text: t('empty') }));
    const cell = (r, k) => h('td', { 'data-label': t('c.' + k), class: 'mx-c mx-' + k },
      h('div', { class: 'mx-edit', contenteditable: 'plaintext-only', spellcheck: 'false', role: 'textbox', 'aria-label': t('c.' + k) + ' · ' + label(r), text: r[k] || '—',
        onblur: e => { const v = e.target.innerText.trim() || '—'; if (v !== r[k]) { r[k] = v; App.save(); } } }));
    return h('div', { class: 'card mx-card' },
      h('div', { class: 'mx-head' }, h('strong', { text: t('n', { n: d.rows.length }) }), h('span', { class: 'muted small-note', text: t('editHint') })),
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => excel(d) }, '⬇ ', t('excel')),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { const n = merge(stateRefs(), d.rows.map(refOf)); App.save(); if (App.render) App.render(); App.toast(t('refsDone', { n })); }, text: t('allRefs') }),
        h('button', { type: 'button', class: 'btn-reset text-action danger', onclick: () => { if (!confirm(t('confirmClear'))) return; d.rows = []; d.synth = null; App.save(); render(); }, text: t('clear') })),
      h('div', { class: 'mx-wrap' }, h('table', { class: 'mx-table' },
        h('thead', {}, h('tr', {}, h('th', { text: t('c.study') }), COLS.map(k => h('th', { text: t('c.' + k) })), h('th', { 'aria-label': t('remove') }))),
        h('tbody', {}, d.rows.map(r => h('tr', {},
          h('th', { scope: 'row', class: 'mx-study' },
            h('strong', { text: label(r) }), h('span', { class: 'mx-title', text: r.title }),
            r.venue ? h('em', { class: 'mx-venue', text: r.venue }) : null,
            h('span', { class: 'mx-badge ' + (r.verified ? 'ok' : 'warn'), title: r.apa || '', text: r.verified ? t('verified') : t('unverified') })),
          COLS.map(k => cell(r, k)),
          h('td', { class: 'mx-x' }, h('button', { type: 'button', class: 'btn-reset ref-x', 'aria-label': t('remove') + ': ' + label(r), title: t('remove'), onclick: () => { if (!confirm(t('confirmRemove'))) return; d.rows = d.rows.filter(x => x !== r); App.save(); render(); } }, '×'))))))),
      h('p', { class: 'result-notes', text: t('note') }));
  }

  function synthCard(d) {
    const s = d.synth;
    const papers = App.state().papers || [];
    const sel = h('select', { 'aria-label': t('choose') }, papers.map(p => h('option', { value: p.id, text: (p.title || '').trim() || '—' })));
    const body = s ? [
      s.themes.length ? h('div', {}, h('h3', { text: t('themes') }), h('ul', { class: 'mx-themes' }, s.themes.map(th => h('li', {}, h('strong', { text: th.name }), ' ', h('span', { text: th.note }), th.cites ? h('small', { class: 'muted', text: ' ' + th.cites }) : null)))) : null,
      s.gaps.length ? h('div', {}, h('h3', { text: t('gaps') }), h('ul', {}, s.gaps.map(g => h('li', { text: g })))) : null,
      h('h3', { text: t('passage') }),
      h('textarea', { rows: 12, value: s.synthesis, 'aria-label': t('passage'), oninput: e => { s.synthesis = e.target.value; App.save(); } }),
      s.references.length ? h('details', { class: 'ana-refs' }, h('summary', { text: t('refs') + ' (' + s.references.length + ')' }), h('ol', {}, s.references.map(x => h('li', { text: x.apa })))) : null,
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-outline', onclick: async () => { try { await navigator.clipboard.writeText(s.synthesis); } catch (e) { /* older browsers */ } App.toast(t('copied')); }, text: t('copy') }),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => toThesis(s), text: t('toThesis') })),
      papers.length ? h('div', { class: 'tool-row' }, sel, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => toPaper(s, sel.value), text: t('toPaper') })) : null
    ] : [];
    return h('div', { class: 'card ana-result mx-synth' },
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: synthBusy || d.rows.length < 2, onclick: synth }, '✨ ', t('synth')),
        d.rows.length < 2 ? h('span', { class: 'muted small-note', text: t('synthNeed') }) : null,
        synthBusy ? h('span', { class: 'chat-activity', role: 'status', text: t('synthBusy') }) : null),
      body);
  }

  async function synth() {
    const d = data();
    if (d.rows.length < 2) { App.toast(t('synthNeed')); return; }
    if (!(await App.ensureAI())) return;
    synthBusy = true; render();
    try {
      const res = await App.apiPost('/api/matrix', { mode: 'synth', rows: d.rows.map(r => ({ title: r.title, year: r.year, authors: r.authors, venue: r.venue, volume: r.volume, issue: r.issue, pages: r.pages, doi: r.doi, ...Object.fromEntries(COLS.map(k => [k, r[k]])) })), focus: focusOf(d), language: d.language });
      d.synth = { themes: res.themes || [], gaps: res.gaps || [], synthesis: res.synthesis || '', references: res.references || [], at: new Date().toISOString() };
      App.save();
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { synthBusy = false; render(); }
  }

  /* ---------- references and inserting ---------- */
  const refOf = r => ({ apa: r.apa, doi: r.doi || '', url: r.url || '', title: r.title || '', year: String(r.year || ''), authors: r.authors || [], venue: r.venue || '', volume: r.volume || '', issue: r.issue || '', pages: r.pages || '', type: r.type || '', addedAt: App.date() });
  function stateRefs() { const s = App.state(); if (!Array.isArray(s.references)) s.references = []; return s.references; }
  function merge(list, refs) {
    const key = r => String(r.doi || r.apa || '').toLowerCase();
    let n = 0;
    for (const r of refs) if (r && r.apa && !list.some(x => key(x) === key(r))) { list.push({ ...refOf(r), apa: r.apa }); n++; }
    return n;
  }
  function toThesis(s) {
    const sec = App.section();
    if (!sec) return;
    if (!Array.isArray(sec.history)) sec.history = [];
    if (String(sec.content || '').trim()) { sec.history.push({ content: sec.content, at: App.date() }); if (sec.history.length > 15) sec.history.shift(); }
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + s.synthesis.trim();
    const n = merge(stateRefs(), s.references);
    App.save(); if (App.render) App.render();
    App.toast(t('inserted', { n, s: sec.title }));
  }
  function toPaper(s, id) {
    const p = (App.state().papers || []).find(x => x.id === id);
    if (!p) return;
    if (!Array.isArray(p.sections)) p.sections = [];
    let sec = p.sections.find(x => x.key === 'literature');
    if (!sec) { sec = { key: 'literature', content: '' }; p.sections.push(sec); }
    sec.content = (sec.content.trim() ? sec.content.trim() + '\n\n' : '') + s.synthesis.trim();
    if (!Array.isArray(p.references)) p.references = [];
    const n = merge(p.references, s.references);
    p.updated = new Date().toISOString(); App.save();
    App.toast(t('inserted', { n, s: (p.title || '').trim() || '—' }));
  }

  /* ---------- Excel (.xlsx) ---------- */
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  function xlsx(head, rows, widths) {
    const col = i => String.fromCharCode(65 + i);
    const line = (cells, r, style) => `<row r="${r}">${cells.map((v, i) => `<c r="${col(i)}${r}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${esc(v)}</t></is></c>`).join('')}</row>`;
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${line(head, 1, 1)}${rows.map((r, i) => line(r, i + 2, 2)).join('')}</sheetData><autoFilter ref="A1:${col(head.length - 1)}${rows.length + 1}"/></worksheet>`;
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFE8FF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const name = esc(t('title')).slice(0, 31);
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${name.replace(/'/g, "''")}'!$A$1:$${col(head.length - 1)}$${rows.length + 1}</definedName></definedNames></workbook>`],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/worksheets/sheet1.xml', sheet],
      ['xl/styles.xml', styles]
    ];
    return new Blob([window.ThesTalkDocx.zip(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function excel(d) {
    const head = ['No.', t('c.study'), lang() === 'en' ? 'Title' : 'Tajuk', lang() === 'en' ? 'Journal' : 'Jurnal', ...COLS.map(k => t('c.' + k)), lang() === 'en' ? 'APA 7 reference' : 'Rujukan APA 7', 'DOI'];
    const rows = d.rows.map((r, i) => [String(i + 1), label(r), r.title, r.venue, ...COLS.map(k => r[k]), r.apa, r.doi ? 'https://doi.org/' + r.doi : '']);
    const blob = xlsx(head, rows, [5, 22, 40, 24, 24, 24, 26, 24, 24, 50, 44, 34, 60, 30]);
    const a = h('a', { href: URL.createObjectURL(blob), download: t('xlsxName') + '-' + new Date().toISOString().slice(0, 10) + '.xlsx' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  window.TalkademicMatrix = { render, xlsx, addFiles };
})();
