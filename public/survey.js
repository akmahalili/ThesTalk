/* Talkademic "Analisis Soal Selidik": open the questionnaire CSV (Google Forms, Microsoft Forms),
   check how each column is read, group items into constructs, and get the Chapter 4 numbers
   (respondent profile, Cronbach's alpha, descriptives, normality, correlations), charts, an
   Excel file, coded data for SPSS/SmartPLS, and a Results write-up built from the numbers.
   Respondent data stays in the browser; only the finished write-up goes to the AI, if asked. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const V = window.TalkademicSurveyCore;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Analisis Soal Selidik', alt: 'Survey Analysis', sub: 'Buka fail CSV soal selidik. Talkademic kira profil responden, alfa Cronbach, min, normaliti dan korelasi, lukis carta, dan tulis Bab 4 daripada angka sebenar.',
      open: '📂 Buka fail CSV', help: 'Google Forms: Respons → ikon Sheets → Fail → Muat turun → CSV. Microsoft Forms: Buka dalam Excel → Simpan sebagai CSV.', privacy: 'Data responden diproses dalam telefon/komputer ini sahaja. Hanya teks dapatan dihantar ke AI jika anda tekan Perhalusi.',
      bad: 'Fail ini tidak dapat dibaca sebagai jadual. Pastikan ia fail CSV dengan baris tajuk.', few: 'Perlu sekurang-kurangnya 3 responden.', big: 'Fail besar: data tidak disimpan dalam app. Buka semula fail selepas memuat semula halaman.', reopen: 'Buka semula fail {f} untuk melihat analisis.',
      loaded: '{n} responden · {c} lajur dibaca daripada {f}.', remove: 'Tutup fail', confirmRemove: 'Tutup fail ini? Tetapan lajur dan teks dapatan akan dibuang.',
      cols: 'Semak lajur', colsHelp: 'Talkademic meneka jenis setiap lajur. Betulkan jika salah. Item soalan negatif boleh ditanda Terbalik (R).',
      't.skip': 'Abaikan', 't.demo': 'Demografi', 't.number': 'Nombor (cth. umur)', 't.item': 'Item Likert', 't.text': 'Teks terbuka', rev: 'Terbalik (R)', label: 'Nama dalam laporan',
      cons: 'Konstruk', consHelp: 'Nama ini digunakan dalam jadual dan teks.', addCons: '+ Konstruk baharu', newCons: 'Konstruk {n}', empty: '(tiada item)',
      scale: 'Skala', auto: 'automatik',
      results: 'Keputusan', chips: '{n} responden · {k} konstruk · {i} item · {d} demografi', noItems: 'Tiada item Likert dikenal pasti. Tukar jenis lajur kepada Item Likert.',
      excel: '⬇ Excel semua jadual', coded: '⬇ Data berkod (CSV) untuk SPSS / SmartPLS', copyT: 'Salin jadual', copied: 'Disalin. Tampal dalam Word atau Excel.', png: '⬇ PNG',
      chartMeans: 'Min konstruk', chartDemo: 'Profil: {h}',
      write: 'Bahagian Dapatan (boleh disunting)', wlang: 'Bahasa', regen: '↻ Tulis semula daripada angka', stale: 'Tetapan berubah selepas teks ini ditulis. Tekan Tulis semula supaya angka sepadan.', polish: '✨ Perhalusi dengan AI', polishing: 'AI sedang memperhalusi… angka tidak akan diubah.', polished: 'Diperhalusi. Semua angka kekal sama.',
      copy: 'Salin teks', toThesis: 'Masukkan ke tesis', sec: 'Bahagian tesis', toPaper: 'Masukkan ke Dapatan paper', inserted: 'Dimasukkan ke "{s}".', note: 'Tanda [PERLU RUJUKAN] ialah tempat untuk sitasi kaedah (cth. nilai ambang alfa). Isi dengan rujukan anda sebelum hantar.',
      xlsxName: 'Talkademic-analisis-soal-selidik'
    },
    en: {
      title: 'Survey Analysis', alt: 'Analisis Soal Selidik', sub: 'Open your questionnaire CSV. Talkademic computes the respondent profile, Cronbach\'s alpha, means, normality and correlations, draws charts, and writes Chapter 4 from the real numbers.',
      open: '📂 Open CSV file', help: 'Google Forms: Responses → Sheets icon → File → Download → CSV. Microsoft Forms: Open in Excel → Save as CSV.', privacy: 'Respondent data is processed on this device only. Only the Results text goes to the AI if you press Polish.',
      bad: 'This file could not be read as a table. Make sure it is a CSV file with a header row.', few: 'Needs at least 3 respondents.', big: 'Large file: the data is not kept in the app. Open the file again after reloading the page.', reopen: 'Open {f} again to see the analysis.',
      loaded: '{n} respondents · {c} columns read from {f}.', remove: 'Close file', confirmRemove: 'Close this file? Column settings and the Results text will be removed.',
      cols: 'Check columns', colsHelp: 'Talkademic guesses the type of each column. Fix any wrong guess. Mark negatively worded items as Reverse (R).',
      't.skip': 'Ignore', 't.demo': 'Demographic', 't.number': 'Number (e.g. age)', 't.item': 'Likert item', 't.text': 'Open text', rev: 'Reverse (R)', label: 'Name in the report',
      cons: 'Constructs', consHelp: 'These names are used in the tables and the text.', addCons: '+ New construct', newCons: 'Construct {n}', empty: '(no items)',
      scale: 'Scale', auto: 'automatic',
      results: 'Results', chips: '{n} respondents · {k} constructs · {i} items · {d} demographics', noItems: 'No Likert items found. Change a column type to Likert item.',
      excel: '⬇ Excel with all tables', coded: '⬇ Coded data (CSV) for SPSS / SmartPLS', copyT: 'Copy table', copied: 'Copied. Paste it into Word or Excel.', png: '⬇ PNG',
      chartMeans: 'Construct means', chartDemo: 'Profile: {h}',
      write: 'Results section (editable)', wlang: 'Language', regen: '↻ Rewrite from the numbers', stale: 'Settings changed after this text was written. Press Rewrite so the numbers match.', polish: '✨ Polish with AI', polishing: 'The AI is polishing the wording… numbers stay the same.', polished: 'Polished. Every number is unchanged.',
      copy: 'Copy text', toThesis: 'Add to the thesis', sec: 'Thesis section', toPaper: "Add to a paper's Results", inserted: 'Added to "{s}".', note: 'The [SOURCE NEEDED] markers show where a method citation belongs (e.g. the alpha threshold). Add your references before submitting.',
      xlsxName: 'Talkademic-survey-analysis'
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
      else if (['value', 'disabled', 'hidden', 'checked', 'rows', 'open'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const MAX_KEEP = 700000;
  let mem = null, busy = false, target = null, colsOpen = null;

  function data() {
    const s = App.state();
    if (!s.survey || typeof s.survey !== 'object') s.survey = { file: '', headers: [], rows: null, cols: [], constructs: [], language: (s.project || {}).language === 'English' && lang() === 'en' ? 'English' : 'Bahasa Melayu', scale: 0, text: '', stale: false };
    return s.survey;
  }
  const table = d => (d.rows ? { headers: d.headers, rows: d.rows } : mem);
  const wl = d => (/english/i.test(d.language) ? 'en' : 'ms');
  const changed = d => { if (d.text) d.stale = true; App.save(); };

  async function openFile(file) {
    if (!file) return;
    let text = await file.text();
    const tb = V.parseCSV(text);
    if (tb.headers.length < 2 || !tb.rows.length) { App.toast(t('bad')); return; }
    if (tb.rows.length < 3) { App.toast(t('few')); return; }
    const d = data();
    const cols = V.classify(tb);
    const constructs = V.defaultConstructs(cols);
    d.file = file.name; d.headers = tb.headers; d.cols = cols.map(c => ({ i: c.i, header: c.header, type: c.type, construct: c.construct || '', reverse: false, label: c.label }));
    d.constructs = constructs; d.scale = 0; d.stale = false;
    const size = JSON.stringify(tb.rows).length;
    if (size <= MAX_KEEP) { d.rows = tb.rows; mem = null; } else { d.rows = null; mem = tb; App.toast(t('big')); }
    colsOpen = true;
    const res = analyse();
    d.text = res ? V.writeUp(res, wl(d)) : '';
    App.save(); render();
  }

  function analyse() {
    const d = data(), tb = table(d);
    if (!tb || !d.cols.length) return null;
    const cols = d.cols.map(c => ({ ...c, construct: c.type === 'item' ? c.construct : '' }));
    return V.analyse(tb, cols, d.constructs, { scale: d.scale || 0 });
  }

  /* ---------- downloads ---------- */
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  /* One sheet, tables one under another: a bold title, a shaded header row, then the rows. Numbers stay numbers. */
  function excel(res) {
    const tabs = V.tables(res, wl(data()));
    const col = i => (i >= 26 ? String.fromCharCode(64 + Math.floor(i / 26)) : '') + String.fromCharCode(65 + (i % 26));
    let r = 0;
    const lines = [];
    const cell = (v, ref, style) => /^-?\d+(\.\d+)?$/.test(String(v)) && style === 2 ? `<c r="${ref}" s="2"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    for (const tb of tabs) {
      r++; lines.push(`<row r="${r}">${cell(tb.title, 'A' + r, 3)}</row>`);
      tb.rows.forEach((row, k) => { r++; lines.push(`<row r="${r}">${row.map((v, i) => cell(v, col(i) + r, k ? 2 : 1)).join('')}</row>`); });
      if (tb.note) { r++; lines.push(`<row r="${r}">${cell(tb.note, 'A' + r, 4)}</row>`); }
      r++;
    }
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="30" customWidth="1"/><col min="3" max="12" width="14" customWidth="1"/></cols><sheetData>${lines.join('')}</sheetData></worksheet>`;
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font><font><i/><sz val="10"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFE8FF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const name = esc(t('title')).slice(0, 31);
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/worksheets/sheet1.xml', sheet],
      ['xl/styles.xml', styles]
    ];
    download(new Blob([window.ThesTalkDocx.zip(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), t('xlsxName') + '.xlsx');
  }
  /* Items as numbers (reverse items already flipped) and demographics as text: ready for SPSS or SmartPLS. */
  function coded() {
    const d = data(), tb = table(d);
    const res = analyse();
    if (!tb || !res) return;
    const keep = d.cols.filter(c => c.type === 'demo' || c.type === 'number' || c.type === 'item');
    const code = c => c.type === 'item' ? (c.header.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '').slice(0, 40) || 'item' + c.i) + (c.reverse && !/(^|_)R$/i.test(c.header.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/_+$/, '')) ? '_R' : '') : c.label || c.header;
    const q = v => /[",\n;]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const lines = [keep.map(c => q(code(c))).join(',')];
    for (const row of tb.rows) lines.push(keep.map(c => {
      if (c.type !== 'item') return q(row[c.i]);
      const v = V.likertValue(row[c.i], res.seven);
      return Number.isFinite(v) ? String(c.reverse ? res.scale + 1 - v : v) : '';
    }).join(','));
    download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }), t('xlsxName') + '-data.csv');
  }
  async function copyTable(tb) {
    const tsv = [tb.title, ...tb.rows.map(r => r.join('\t')), tb.note || ''].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(tsv); App.toast(t('copied')); } catch (e) { App.toast(tsv.slice(0, 60) + '…'); }
  }

  /* ---------- charts (SVG, also saved as PNG) ---------- */
  function barChart(title, bars, opt) {
    const o = opt || {}, W = 560, rowH = 34, left = 170, right = 62, top = 46;
    const H = top + bars.length * rowH + (o.axis ? 40 : 14);
    const max = o.max || Math.max(...bars.map(b => b.v), 1), min = o.min || 0;
    const x = v => left + (W - left - right) * (v - min) / (max - min || 1);
    const wrap = s => s.length > 24 ? s.slice(0, 22) + '…' : s;
    const parts = [`<rect width="${W}" height="${H}" fill="#ffffff"/>`, `<text x="16" y="28" font-size="17" font-weight="bold" fill="#1d1b2f">${esc(title)}</text>`];
    if (o.axis) for (let v = min; v <= max; v++) parts.push(`<line x1="${x(v)}" y1="${top - 6}" x2="${x(v)}" y2="${H - 34}" stroke="#e4e1ee"/><text x="${x(v)}" y="${H - 16}" text-anchor="middle" font-size="12" fill="#6b6880">${v}</text>`);
    bars.forEach((b, i) => {
      const y = top + i * rowH;
      parts.push(`<text x="${left - 10}" y="${y + 21}" text-anchor="end" font-size="13.5" fill="#1d1b2f">${esc(wrap(b.label))}</text>`);
      parts.push(`<rect x="${x(min)}" y="${y + 6}" width="${Math.max(2, x(b.v) - x(min))}" height="${rowH - 12}" rx="5" fill="${o.colour || '#6d5ae6'}"/>`);
      if (Number.isFinite(b.sd)) { const a = x(Math.max(min, b.v - b.sd)), z = x(Math.min(max, b.v + b.sd)), cy = y + rowH / 2; parts.push(`<path d="M${a},${cy} L${z},${cy} M${a},${cy - 6} L${a},${cy + 6} M${z},${cy - 6} L${z},${cy + 6}" stroke="#1d1b2f" stroke-width="1.4" fill="none"/>`); }
      parts.push(`<text x="${Math.min(W - 8, x(b.v) + (Number.isFinite(b.sd) ? x(Math.min(max, b.v + b.sd)) - x(b.v) : 0) + 8)}" y="${y + 21}" font-size="13" font-weight="bold" fill="#1d1b2f">${esc(b.text)}</text>`);
    });
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Trebuchet MS', 'Segoe UI', Roboto, Arial, sans-serif">${parts.join('')}</svg>`, W, H };
  }
  async function savePng(chart, name) {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(chart.svg); });
    const cv = document.createElement('canvas'); cv.width = chart.W * 2.5; cv.height = chart.H * 2.5;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    download(await new Promise(r => cv.toBlob(r, 'image/png')), name + '.png');
  }
  function chartCard(chart, name) {
    const box = h('div', { class: 'sv-chart' }); box.innerHTML = chart.svg;
    return h('div', { class: 'sv-chart-wrap' }, box, h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => savePng(chart, name).catch(e => App.toast(e.message || 'PNG')), text: t('png') }));
  }

  /* ---------- write-up ---------- */
  async function polish() {
    const d = data();
    if (!d.text.trim()) return;
    if (!(await App.ensureAI())) return;
    busy = true; render();
    try {
      const res = await App.apiPost('/api/survey', { text: d.text, language: d.language });
      d.text = res.text; App.save(); App.toast(t('polished'));
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }
  function sections() {
    const s = App.state();
    return (s.chapters || []).flatMap(c => (c.sections || []).map(x => ({ sec: x, label: c.title.split(':')[0] + ' › ' + x.title, ch: c })));
  }
  function defaultTarget() {
    const all = sections();
    const hit = all.find(x => /^(chapter|bab) 4/i.test(x.ch.title) && /demograf|profil|respond/i.test(x.sec.title)) || all.find(x => /^(chapter|bab) 4/i.test(x.ch.title)) || all.find(x => /dapatan|findings|results|analysis/i.test(x.ch.title + ' ' + x.sec.title));
    return hit ? hit.sec.id : (all[0] && all[0].sec.id);
  }
  function toThesis() {
    const d = data();
    const pick = sections().find(x => x.sec.id === (target || defaultTarget()));
    if (!pick || !d.text.trim()) return;
    const sec = pick.sec;
    if (!Array.isArray(sec.history)) sec.history = [];
    if (String(sec.content || '').trim()) { sec.history.push({ content: sec.content, at: App.date() }); if (sec.history.length > 15) sec.history.shift(); }
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + d.text.trim();
    App.save(); if (App.render) App.render();
    App.toast(t('inserted', { s: sec.title }));
  }
  function toPaper(id) {
    const d = data(), p = (App.state().papers || []).find(x => x.id === id);
    if (!p || !d.text.trim()) return;
    if (!Array.isArray(p.sections)) p.sections = [];
    let sec = p.sections.find(x => x.key === 'results');
    if (!sec) { sec = { key: 'results', content: '' }; p.sections.push(sec); }
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + d.text.trim();
    p.updated = new Date().toISOString(); App.save();
    App.toast(t('inserted', { s: (p.title || '').trim() || '—' }));
  }

  /* ---------- view ---------- */
  function colRow(d, c) {
    const type = h('select', { 'aria-label': c.header, onchange: e => {
      c.type = e.target.value;
      if (c.type === 'item' && !c.construct) { if (!d.constructs.length) d.constructs.push({ id: 'k1', name: t('newCons', { n: 1 }) }); c.construct = d.constructs[0].id; }
      changed(d); render();
    } }, ['item', 'demo', 'number', 'text', 'skip'].map(x => h('option', { value: x, text: t('t.' + x) })));
    type.value = c.type;
    let extra = null;
    if (c.type === 'item') {
      const cons = h('select', { 'aria-label': t('cons'), onchange: e => { c.construct = e.target.value; changed(d); render(); } }, d.constructs.map(k => h('option', { value: k.id, text: k.name })));
      cons.value = c.construct;
      extra = h('div', { class: 'sv-col-extra' }, cons, h('label', { class: 'sv-rev' }, h('input', { type: 'checkbox', checked: !!c.reverse, onchange: e => { c.reverse = e.target.checked; changed(d); render(); } }), h('span', { text: t('rev') })));
    } else if (c.type === 'demo' || c.type === 'number') {
      extra = h('div', { class: 'sv-col-extra' }, h('input', { type: 'text', maxlength: '80', 'aria-label': t('label'), placeholder: t('label'), value: c.label || '', onchange: e => { c.label = e.target.value.trim() || c.header; changed(d); render(); } }));
    }
    return h('li', { class: 'sv-col sv-t-' + c.type }, h('div', { class: 'sv-col-head' }, h('span', { class: 'sv-col-name', title: c.header, text: c.header }), type), extra);
  }
  function htmlTable(tb) {
    return h('div', { class: 'sv-table-wrap' }, h('table', { class: 'sv-table' },
      h('thead', {}, h('tr', {}, tb.rows[0].map(x => h('th', { text: x })))),
      h('tbody', {}, tb.rows.slice(1).map(r => h('tr', {}, r.map((x, i) => h('td', { class: i && /^[-–<>=.\d*\s]+$/.test(x) ? 'num' : '', text: x })))))),
      tb.note ? h('p', { class: 'muted small-note', text: tb.note }) : null);
  }

  function render() {
    const root = $('#view-survey');
    if (!root) return;
    const d = data(), tb = table(d), s = App.state();
    const input = h('input', { type: 'file', accept: '.csv,.tsv,.txt,text/csv', hidden: true, onchange: e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; openFile(f).catch(err => App.toast(err.message || t('bad'))); } });
    const head = h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'surveyTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') })));
    const openCard = h('div', { class: 'card ana-form' },
      h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => input.click(), text: t('open') }), input,
        d.file ? h('button', { type: 'button', class: 'btn-reset text-action danger', onclick: () => { if (!confirm(t('confirmRemove'))) return; s.survey = null; mem = null; App.save(); render(); }, text: t('remove') }) : null),
      d.file && tb ? h('p', { class: 'sv-loaded', text: t('loaded', { n: tb.rows.length, c: d.headers.length, f: d.file }) }) : d.file ? h('p', { class: 'result-notes', text: t('reopen', { f: d.file }) }) : null,
      h('p', { class: 'muted small-note', text: t('help') }),
      h('p', { class: 'muted small-note', text: '🔒 ' + t('privacy') }));
    if (!d.file || !tb) { fill(root, head, openCard); return; }

    const res = analyse();
    const items = d.cols.filter(c => c.type === 'item').length;
    const scaleSel = h('select', { 'aria-label': t('scale'), onchange: e => { d.scale = Number(e.target.value); changed(d); render(); } },
      h('option', { value: '0', text: t('auto') + (res ? ' (' + res.scale + ')' : '') }), [4, 5, 6, 7, 10].map(n => h('option', { value: String(n), text: n + (lang() === 'en' ? '-point' : ' mata') })));
    scaleSel.value = String(d.scale || 0);
    const colsCard = h('details', { class: 'card sv-cols', open: colsOpen !== false, ontoggle: e => { colsOpen = e.target.open; } },
      h('summary', {}, h('h3', { text: t('cols') + ' (' + d.cols.length + ')' })),
      h('p', { class: 'muted small-note', text: t('colsHelp') }),
      h('ul', { class: 'sv-col-list' }, d.cols.map(c => colRow(d, c))));
    const consCard = h('div', { class: 'card sv-cons' },
      h('h3', { text: t('cons') }), h('p', { class: 'muted small-note', text: t('consHelp') }),
      h('ul', { class: 'sv-cons-list' }, d.constructs.map(k => {
        const n = d.cols.filter(c => c.type === 'item' && c.construct === k.id).length;
        return h('li', {}, h('input', { type: 'text', maxlength: '80', value: k.name, 'aria-label': t('cons'), onchange: e => { k.name = e.target.value.trim() || k.name; changed(d); render(); } }), h('span', { class: 'muted small-note', text: n ? n + ' item' : t('empty') }));
      })),
      h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { const id = 'k' + Date.now().toString(36); d.constructs.push({ id, name: t('newCons', { n: d.constructs.length + 1 }) }); App.save(); render(); }, text: t('addCons') }),
        h('label', { class: 'form-field sv-scale' }, h('span', { text: t('scale') }), scaleSel)));

    const out = [];
    if (res) {
      out.push(h('p', { class: 'sv-chips', text: t('chips', { n: res.N, k: res.constructs.length, i: items, d: res.demos.length + res.numbers.length }) }));
      out.push(h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => excel(res), text: t('excel') }), h('button', { type: 'button', class: 'btn btn-outline', onclick: coded, text: t('coded') })));
      if (!res.constructs.length) out.push(h('p', { class: 'result-notes', text: t('noItems') }));
      const tabs = V.tables(res, wl(d));
      const charts = [];
      if (res.constructs.length) charts.push(chartCard(barChart(t('chartMeans'), res.constructs.map(c => ({ label: c.name, v: c.mean, sd: c.sd, text: V.fmt.f2(c.mean) })), { min: 1, max: res.scale, axis: true }), t('xlsxName') + '-min'));
      for (const dm of res.demos.slice(0, 6)) charts.push(chartCard(barChart(t('chartDemo', { h: dm.header }), dm.cats.slice(0, 10).map(c => ({ label: c.label, v: c.pct, text: V.fmt.f1(c.pct) + '%' })), { min: 0, max: 100, colour: '#17905f' }), t('xlsxName') + '-' + dm.header.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 30)));
      if (charts.length) out.push(h('div', { class: 'card' }, charts));
      for (const tbl of tabs) out.push(h('div', { class: 'card sv-tcard' }, h('div', { class: 'sv-thead' }, h('h3', { text: tbl.title }), h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => copyTable(tbl), text: t('copyT') })), htmlTable(tbl)));
      // Write-up.
      const langSel = h('select', { 'aria-label': t('wlang'), onchange: e => { d.language = e.target.value; d.text = V.writeUp(analyse(), wl(d)); d.stale = false; App.save(); render(); } }, h('option', { value: 'Bahasa Melayu', text: 'Bahasa Melayu' }), h('option', { value: 'English', text: 'English' }));
      langSel.value = d.language;
      const secSel = h('select', { 'aria-label': t('sec'), onchange: e => { target = e.target.value; } }, sections().map(x => h('option', { value: x.sec.id, text: x.label })));
      secSel.value = target || defaultTarget() || '';
      const papers = s.papers || [];
      const paperSel = papers.length ? h('select', { 'aria-label': 'paper' }, papers.map(p => h('option', { value: p.id, text: (p.title || '').trim() || '—' }))) : null;
      out.push(h('div', { class: 'card sv-write' },
        h('div', { class: 'sv-thead' }, h('h3', { text: t('write') }), h('label', { class: 'form-field sv-wlang' }, h('span', { text: t('wlang') }), langSel)),
        d.stale ? h('p', { class: 'result-notes', text: t('stale') }) : null,
        h('textarea', { class: 'sv-text', rows: 16, value: d.text, oninput: e => { d.text = e.target.value; App.save(); } }),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { d.text = V.writeUp(analyse(), wl(d)); d.stale = false; App.save(); render(); }, text: t('regen') }),
          h('button', { type: 'button', class: 'btn btn-outline', disabled: busy, onclick: polish, text: t('polish') }),
          h('button', { type: 'button', class: 'btn btn-outline', onclick: async () => { try { await navigator.clipboard.writeText(d.text); App.toast(t('copied')); } catch (e) { App.toast(e.message); } }, text: t('copy') }),
          busy ? h('span', { class: 'chat-activity', role: 'status', text: t('polishing') }) : null),
        h('label', { class: 'form-field' }, h('span', { text: t('sec') }), secSel),
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: toThesis, text: t('toThesis') })),
        paperSel ? h('div', { class: 'tool-row' }, paperSel, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => toPaper(paperSel.value), text: t('toPaper') })) : null,
        h('p', { class: 'muted small-note', text: t('note') })));
    }
    fill(root, head, openCard, h('div', { class: 'sv-grid' }, h('div', { class: 'sv-setup' }, colsCard, consCard), h('div', { class: 'sv-out' }, h('h2', { class: 'sv-h2', text: t('results') }), out)));
  }

  window.TalkademicSurvey = { render, _test: { openFile, analyse } };
})();
