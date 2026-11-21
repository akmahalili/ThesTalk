/* Talkademic "Format Tesis UiTM": the whole thesis as a Word file in the IPSis Guidelines on
   Thesis/Dissertation Format (2026): Times New Roman 12 pt, 1.5 spacing, justified, first-line indent,
   margins left 3.8 cm and 2.5 cm elsewhere, page numbers centred at the bottom (lowercase Roman for
   the preliminary pages, Arabic from Chapter 1), title page, author's declaration, abstract(s),
   acknowledgement, table of contents, lists of tables, figures and abbreviations, CHAPTER n headings,
   numbered headings to three levels, captions numbered by chapter, REFERENCES with a 1/2-inch hanging
   indent, and the author's profile. Tab-separated lines become real tables, and the line
   "[Rajah: Kerangka Konseptual]" becomes the conceptual framework figure in a closed box.
   build() returns the OOXML parts; the browser zips them with ThesTalkDocx.zip. Browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicThesisDocx = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const CM = cm => Math.round(cm * 567);
  const PAGE = { w: 11906, h: 16838, left: CM(3.8), right: CM(2.5), top: CM(2.5), bottom: CM(2.5) };
  const TEXT_W = PAGE.w - PAGE.left - PAGE.right;
  const FIG = /^\s*\[(?:Rajah|Figure)\s*:\s*(?:Kerangka Konseptual|Conceptual Framework)\]\s*$/i;
  const MARK = /(\[(?:PERLU RUJUKAN|SOURCE NEEDED|NILAI\?|VALUE\?|DAPATAN[^\]]*|FINDING[^\]]*)\])/;

  const L = {
    en: { chapter: 'CHAPTER', confirm: 'CONFIRMATION BY PANEL OF EXAMINERS', decl: "AUTHOR'S DECLARATION", abstract: 'ABSTRACT', abstrak: 'ABSTRAK', ack: 'ACKNOWLEDGEMENT', toc: 'TABLE OF CONTENTS', lot: 'LIST OF TABLES', lof: 'LIST OF FIGURES', lop: 'LIST OF PLATES', loa: 'LIST OF ABBREVIATIONS', refs: 'REFERENCES', profile: "AUTHOR'S PROFILE", page: 'Page', tables: 'Tables', figures: 'Figures', plates: 'Plates', title: 'Title', abbr: 'Abbreviation', meaning: 'Meaning' },
    ms: { chapter: 'BAB', confirm: 'PENGESAHAN PANEL PEMERIKSA', decl: 'PERAKUAN PENGARANG', abstract: 'ABSTRACT', abstrak: 'ABSTRAK', ack: 'PENGHARGAAN', toc: 'ISI KANDUNGAN', lot: 'SENARAI JADUAL', lof: 'SENARAI RAJAH', lop: 'SENARAI PLAT', loa: 'SENARAI SINGKATAN', refs: 'RUJUKAN', profile: 'PROFIL PENGARANG', page: 'Halaman', tables: 'Jadual', figures: 'Rajah', plates: 'Plat', title: 'Tajuk', abbr: 'Singkatan', meaning: 'Maksud' }
  };

  /* ---------- runs and paragraphs ---------- */
  function rPr(o) {
    const p = [];
    if (o.font) p.push(`<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>`);
    if (o.b) p.push('<w:b/><w:bCs/>');
    if (o.i) p.push('<w:i/><w:iCs/>');
    if (o.vanish) p.push('<w:vanish/>');
    if (o.sz) p.push(`<w:sz w:val="${o.sz * 2}"/><w:szCs w:val="${o.sz * 2}"/>`);
    if (o.hl) p.push(`<w:highlight w:val="${o.hl}"/>`);
    return p.length ? `<w:rPr>${p.join('')}</w:rPr>` : '';
  }
  const run = (text, o) => `<w:r>${rPr(o || {})}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  const tabRun = () => '<w:r><w:tab/></w:r>';
  const br = () => '<w:r><w:br/></w:r>';
  /* Text with review markers highlighted yellow and **bold** markdown removed. */
  function textRuns(text, o) {
    return String(text).replace(/\*\*(.+?)\*\*/g, '$1').split(MARK).filter(Boolean).map(part => run(part, MARK.test(part) ? { ...(o || {}), hl: 'yellow' } : (o || {}))).join('');
  }
  function pPr(o) {
    const p = [];
    if (o.style) p.push(`<w:pStyle w:val="${o.style}"/>`);
    if (o.keepNext) p.push('<w:keepNext/>');
    if (o.keepLines) p.push('<w:keepLines/>');
    if (o.pageBreak) p.push('<w:pageBreakBefore/>');
    if (o.num) p.push(`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.num}"/></w:numPr>`);
    if (o.box) p.push('<w:pBdr><w:top w:val="single" w:sz="6" w:space="6" w:color="000000"/><w:left w:val="single" w:sz="6" w:space="6" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:space="6" w:color="000000"/><w:right w:val="single" w:sz="6" w:space="6" w:color="000000"/></w:pBdr>');
    if (o.tabs) p.push(`<w:tabs>${o.tabs.map(t => `<w:tab w:val="${t.val}"${t.leader ? ` w:leader="${t.leader}"` : ''} w:pos="${t.pos}"/>`).join('')}</w:tabs>`);
    if (o.spacing) { const s = o.spacing; p.push(`<w:spacing${s.before != null ? ` w:before="${s.before}"` : ''}${s.after != null ? ` w:after="${s.after}"` : ''}${s.line ? ` w:line="${s.line}" w:lineRule="auto"` : ''}/>`); }
    if (o.ind) { const i = o.ind; p.push(`<w:ind${i.left != null ? ` w:left="${i.left}"` : ''}${i.hanging != null ? ` w:hanging="${i.hanging}"` : ''}${i.firstLine != null ? ` w:firstLine="${i.firstLine}"` : ''}/>`); }
    if (o.jc) p.push(`<w:jc w:val="${o.jc}"/>`);
    if (o.sect) p.push(o.sect);
    return p.length ? `<w:pPr>${p.join('')}</w:pPr>` : '';
  }
  const para = (runs, o) => `<w:p>${pPr(o || {})}${runs || ''}</w:p>`;
  /* A hidden TC field: an entry for the table of contents (or a list of tables/figures) that is not printed. */
  const tc = (text, level, list) => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TC "${esc(String(text).replace(/"/g, "'"))}"${list ? ' \\f ' + list : ''} \\l ${level || 1} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;

  /* ---------- helpers ---------- */
  const titleCase = s => String(s).replace(/\S+/g, (w, i) => (i && /^(of|and|the|in|on|for|to|a|an|at|by|with|dan|di|ke|dari|daripada|untuk|dalam|yang|serta|atau)$/i.test(w)) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1));
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  function monthYear(d, lang) {
    const ms = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return (lang === 'ms' ? ms : en)[d.getMonth()] + ' ' + d.getFullYear();
  }
  /* "Chapter 2: Literature Review" → { title: 'LITERATURE REVIEW' }; "Bab 2 Kajian Literatur" too. */
  function chapterTitle(raw, n) {
    const s = String(raw || '').trim();
    const m = s.match(/^(?:chapter|bab)\s*([0-9ivx]+|one|two|three|four|five|six|seven|eight|nine|ten|satu|dua|tiga|empat|lima|enam|tujuh)?\s*[:.\-–]?\s*(.*)$/i);
    const title = (m ? m[2] : s).trim() || ('Chapter ' + n);
    return title.toUpperCase();
  }
  function sectionTitle(raw, chNo, idx) {
    const s = String(raw || '').trim();
    if (/^\d+(\.\d+)+\s+\S/.test(s)) return s;
    return chNo + '.' + (idx + 1) + ' ' + (s || 'Section');
  }
  const capRe = /^\s*(Table|Jadual|Figure|Rajah|Plate|Plat)\s+(\d+(?:\.\d+)?)\s*[:.–—-](?!\d)\s*(.{3,240})$/i;
  function caption(line) {
    const m = String(line).match(capRe);
    if (!m) return null;
    const k = m[1].toLowerCase();
    const kind = k === 'table' || k === 'jadual' ? 'T' : k === 'plate' || k === 'plat' ? 'P' : 'F';
    return { kind, label: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2], title: m[3].trim().replace(/[.]$/, '') };
  }

  /* Rough page estimate for the table of contents before Word updates the fields. */
  const LINES = 36, CHARS = 95;
  const linesOf = (text, single) => Math.max(1, Math.ceil(String(text).length / CHARS)) * (single ? 0.67 : 1);

  /* Italic journal name and volume (APA) when the reference knows its venue; italic title for a book. */
  function refRuns(r) {
    const apa = String(r && r.apa || '').trim();
    const venue = String(r && r.venue || '').trim();
    if (venue && apa.includes(venue)) {
      const m = apa.match(new RegExp(venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:, \\d+)?'));
      if (m) return run(apa.slice(0, m.index)) + run(m[0], { i: true }) + run(apa.slice(m.index + m[0].length));
    }
    const title = String(r && r.title || '').trim();
    if (/book/i.test(r && r.type || '') && title && apa.includes(title)) { const i = apa.indexOf(title); return run(apa.slice(0, i)) + run(title, { i: true }) + run(apa.slice(i + title.length)); }
    return run(apa);
  }

  /* ---------- the document ---------- */
  function build(state, fmt, opt) {
    const o = opt || {};
    const F = Object.assign({ kind: 'thesis', name: '', studentId: '', degree: '', programme: '', faculty: '', month: '', abstract: '', abstrak: '', ack: '', abbreviations: '', profile: '', confirm: false, vivaDate: '', examiners: '' }, fmt || {});
    const project = state.project || {};
    const lang = /melayu|malay/i.test(project.language || '') ? 'ms' : 'en';
    const T = L[lang];
    const isDiss = F.kind === 'dissertation';
    const month = F.month || monthYear(o.now || new Date(), lang);
    const fig = o.figures && o.figures.framework && o.figures.framework.bytes ? o.figures.framework : null;
    const body = [], front = [];
    const toc = [], lists = { T: [], F: [], P: [] };
    let page = 1, line = 0;
    const newPage = () => { page++; line = 0; };
    const add = n => { line += n; while (line > LINES) { page++; line -= LINES; } };
    let figId = 0, usedImage = false;
    const H = { center: 'center', both: 'both', left: 'left' };

    /* --- body first, so the table of contents knows the (estimated) pages --- */
    page = 1; line = 0;
    const chapters = (state.chapters || []).filter(ch => (ch.sections || []).some(s => String(s.content || '').trim()) || o.includeEmpty);
    chapters.forEach((ch, ci) => {
      const num = String(ch.title || '').match(/^(?:chapter|bab)\s*(\d+)/i);
      const n = num ? Number(num[1]) : (state.chapters || []).indexOf(ch) + 1;
      const title = chapterTitle(ch.title, n);
      if (ci) newPage();
      toc.push({ level: 1, text: T.chapter + ' ' + n + ': ' + title, page });
      body.push(para(tc(T.chapter + ' ' + n + ': ' + title, 1) + run(T.chapter + ' ' + n) + br() + run(title), { style: 'Heading1', pageBreak: ci > 0 }));
      add(3);
      (ch.sections || []).forEach((sec, si) => {
        const st = sectionTitle(sec.title, n, si);
        body.push(para(textRuns(st), { style: 'Heading2' }));
        toc.push({ level: 2, text: st, page }); add(2);
        const lines = String(sec.content || '').replace(/\r/g, '').split('\n');
        for (let li = 0; li < lines.length; li++) {
          const raw = lines[li];
          const text = raw.trim().replace(/^#{1,6}\s+/, '');
          if (!text) continue;
          // A run of tab-separated lines is a table (e.g. pasted from Analisis Soal Selidik).
          if (raw.includes('\t') && li + 1 < lines.length && lines[li + 1].includes('\t')) {
            const rows = [];
            while (li < lines.length && lines[li].includes('\t')) { rows.push(lines[li].split('\t').map(c => c.trim())); li++; }
            li--;
            body.push(table(rows)); add(rows.length * 1.3 + 1);
            continue;
          }
          if (FIG.test(text)) {
            if (fig) { figId++; usedImage = true; body.push(image(fig, figId)); add(Math.min(LINES - 4, Math.round(16 * fig.height / fig.width) + 2)); }
            else { body.push(para(run(text, { hl: 'yellow' }), { jc: H.center })); add(1); }
            continue;
          }
          const cap = caption(text);
          if (cap) {
            const label = cap.label + ' ' + titleCase(cap.title);
            lists[cap.kind].push({ text: label, page });
            body.push(para(tc(label, 1, cap.kind) + run(cap.label, { b: true }) + run(' ' + titleCase(cap.title)), { style: 'Caption', jc: cap.kind === 'T' ? H.left : H.center, keepNext: cap.kind === 'T' }));
            add(1.5);
            continue;
          }
          const h = text.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)\s+(.{2,150})$/);
          if (h && !/[.:;]$/.test(h[2]) && words(h[2]) <= 18) {
            const lvl = h[1].split('.').length >= 4 ? 4 : 3;
            body.push(para(textRuns(h[1] + ' ' + h[2]), { style: 'Heading' + lvl }));
            if (lvl === 3) toc.push({ level: 3, text: h[1] + ' ' + h[2], page });
            add(2); continue;
          }
          if (/^\s*[-•*]\s+/.test(raw)) { body.push(para(textRuns(text.replace(/^[-•*]\s+/, '')), { style: 'ListBullet', num: 1 })); add(linesOf(text)); continue; }
          if (/^(H\d+[a-z]?|RO\d+|RQ\d+|O\d+|S\d+|P\d+)\s*[:.]/i.test(text) || /^(\(?[a-z0-9]{1,3}[.)])\s+/i.test(text)) {
            body.push(para(textRuns(text), { style: 'Hanging' })); add(linesOf(text)); continue;
          }
          body.push(para(textRuns(text), { style: 'BodyText' })); add(linesOf(text));
        }
      });
    });
    // References.
    const refs = (Array.isArray(state.references) ? state.references : []).filter(r => r && String(r.apa || '').trim()).slice().sort((a, b) => String(a.apa).localeCompare(String(b.apa)));
    if (refs.length) {
      newPage();
      toc.push({ level: 1, text: T.refs, page });
      body.push(para(tc(T.refs, 1) + run(T.refs), { style: 'RefHeading', pageBreak: true }));
      add(2);
      for (const r of refs) { body.push(para(refRuns(r), { style: 'Reference' })); add(linesOf(r.apa) + 0.2); }
    }
    if (String(F.profile).trim()) {
      newPage();
      toc.push({ level: 1, text: T.profile, page });
      body.push(para(tc(T.profile, 1) + run(T.profile), { style: 'PrelimHeading', pageBreak: true }));
      for (const p of String(F.profile).split(/\n+/).map(x => x.trim()).filter(Boolean)) body.push(para(textRuns(p), { style: 'BodyText' }));
    }

    /* --- front matter --- */
    const title = String(project.title || 'Untitled').trim().toUpperCase();
    const name = String(F.name || '').trim().toUpperCase() || '[NAMA PELAJAR]';
    const degree = String(F.degree || '').trim() || 'Doctor of Philosophy';
    const faculty = String(F.faculty || '').trim() || '[Faculty]';
    const single = { line: 240 };
    // Title page (counted as i, number not shown).
    const tp = (text, sz, before) => para(run(text, { b: true, sz }), { jc: 'center', spacing: { before, after: 0, line: 240 } });
    front.push(tp('UNIVERSITI TEKNOLOGI MARA', 18, 0));
    front.push(para(run(title, { b: true, sz: 18 }), { jc: 'center', spacing: { before: 1700, after: 0, line: 240 } }));
    front.push(tp(name, 14, 2000));
    const stmt = lang === 'ms'
      ? (isDiss ? ['Disertasi dikemukakan bagi memenuhi', 'sebahagian syarat untuk ijazah'] : ['Tesis dikemukakan bagi memenuhi', 'syarat untuk ijazah'])
      : (isDiss ? ['Dissertation submitted in partial fulfilment', 'of the requirements for the degree of'] : ['Thesis submitted in fulfilment', 'of the requirements for the degree of']);
    front.push(tp(stmt[0], 14, 2000)); front.push(tp(stmt[1], 14, 0));
    front.push(tp(degree, 14, 360));
    if (String(F.programme).trim()) front.push(tp('(' + String(F.programme).trim() + ')', 14, 0));
    front.push(tp(faculty, 14, 1500));
    front.push(tp(month, 14, CM(2)));
    let pg = 2;
    const pre = [];
    const preHead = (key) => { pre.push({ text: T[key], page: pg }); return para(tc(T[key], 1) + run(T[key]), { style: 'PrelimHeading', pageBreak: true }); };
    if (F.confirm) {
      front.push(preHead('confirm'));
      const ex = String(F.examiners || '').split('\n').map(x => x.trim()).filter(Boolean);
      const txt = lang === 'ms'
        ? `Saya mengesahkan bahawa Panel Pemeriksa telah bermesyuarat pada ${F.vivaDate || '[tarikh]'} untuk menjalankan peperiksaan akhir ${titleCase(String(F.name || '[nama pelajar]').toLowerCase())} bagi ${isDiss ? 'disertasi' : 'tesis'} ${degree} bertajuk "${project.title || ''}" mengikut Akta Universiti Teknologi MARA 1976 (Akta 173). Panel Pemeriksa mengesyorkan supaya pelajar dianugerahkan ijazah yang berkaitan.`
        : `I certify that a Panel of Examiners has met on ${F.vivaDate || '[date]'} to conduct the final examination of ${titleCase(String(F.name || '[student name]').toLowerCase())} on ${/^[aeiou]/i.test(degree) ? 'an' : 'a'} ${degree} ${isDiss ? 'dissertation' : 'thesis'} entitled "${project.title || ''}" in accordance with Universiti Teknologi MARA Act 1976 (Akta 173). The Panel of Examiners recommends that the student be awarded the relevant degree. The Panel of Examiners was as follows:`;
      front.push(para(run(txt), { jc: 'both', spacing: single }));
      for (const e of (ex.length ? ex : ['[Name] (Chairman)', '[Name] (Internal Examiner)', '[Name] (External Examiner)'])) front.push(para(run(e), { spacing: { before: 240, after: 0, line: 240 } }));
      for (const [i, s] of ['', lang === 'ms' ? 'Dekan' : 'Dean', lang === 'ms' ? 'Institut Pengajian Pascasiswazah' : 'Institute of Postgraduate Studies', 'Universiti Teknologi MARA', (lang === 'ms' ? 'Tarikh' : 'Date') + ' :'].entries()) front.push(para(run(s || '[NAMA DEKAN]', { b: i === 0 }), { spacing: { before: i === 0 ? 1200 : 0, after: 0, line: 240 } }));
      pg++;
    }
    // Author's declaration.
    front.push(preHead('decl'));
    const declP = lang === 'ms'
      ? [`Saya mengaku bahawa kerja dalam ${isDiss ? 'disertasi' : 'tesis'} ini telah dijalankan mengikut peraturan Universiti Teknologi MARA. Ia adalah asli dan merupakan hasil kerja saya sendiri, kecuali yang dinyatakan atau diakui sebagai bahan rujukan. ${isDiss ? 'Disertasi' : 'Tesis'} ini tidak pernah dikemukakan kepada mana-mana institusi akademik atau bukan akademik untuk sebarang ijazah atau kelayakan.`,
        'Saya dengan ini mengakui bahawa saya telah dibekalkan dengan Peraturan Akademik Pascasiswazah, Universiti Teknologi MARA, yang mengawal selia pengajian dan penyelidikan saya.']
      : [`I declare that the work in this ${isDiss ? 'dissertation' : 'thesis'} was carried out in accordance with the regulations of Universiti Teknologi MARA. It is original and is the results of my own work, unless otherwise indicated or acknowledged as referenced work. This ${isDiss ? 'dissertation' : 'thesis'} has not been submitted to any other academic institution or non-academic institution for any degree or qualification.`,
        'I, hereby, acknowledge that I have been supplied with the Academic Rules and Regulations for Postgraduate, Universiti Teknologi MARA, regulating the conduct of my study and research.'];
    for (const p of declP) front.push(para(run(p), { jc: 'both', spacing: { after: 240, line: 360 } }));
    const fld = (label, value) => para(run(label) + tabRun() + run(':') + tabRun() + run(value), { tabs: [{ val: 'left', pos: 2880 }, { val: 'left', pos: 3200 }], ind: { left: 3200, hanging: 3200 }, spacing: { after: 0, line: 360 } });
    const fields = lang === 'ms'
      ? [['Nama Pelajar', titleCase(String(F.name || '').toLowerCase())], ['No. Pelajar', F.studentId], ['Program', F.programme || degree], ['Fakulti', F.faculty], [isDiss ? 'Tajuk Disertasi' : 'Tajuk Tesis', project.title || ''], ['Tandatangan Pelajar', '……………………………………………..'], ['Tarikh', month]]
      : [['Name of Student', titleCase(String(F.name || '').toLowerCase())], ['Student I.D. No.', F.studentId], ['Programme', F.programme || degree], ['Faculty', F.faculty], [isDiss ? 'Dissertation Title' : 'Thesis Title', project.title || ''], ['Signature of Student', '……………………………………………..'], ['Date', month]];
    front.push(para('', { spacing: { after: 0 } }));
    for (const [a, b] of fields) front.push(fld(a, b || ''));
    pg++;
    // Abstracts: a Malay thesis carries both, Malay first.
    const absPage = (key, text) => { front.push(preHead(key)); front.push(para(textRuns(String(text).replace(/\s*\n+\s*/g, ' ').trim() || '[' + T[key] + ']'), { jc: 'both', spacing: { after: 0, line: 240 } })); pg++; };
    const order = lang === 'ms' ? [['abstrak', F.abstrak], ['abstract', F.abstract]] : [['abstract', F.abstract], ['abstrak', F.abstrak]];
    // A Malay thesis needs both abstracts; an English thesis adds ABSTRAK only when it is written.
    for (const [k, v] of order) if (lang === 'ms' || k === 'abstract' || String(v).trim()) absPage(k, v);
    // Acknowledgement.
    front.push(preHead('ack'));
    const ackParas = String(F.ack || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
    for (const p of (ackParas.length ? ackParas : ['[' + T.ack + ']'])) front.push(para(textRuns(p), { jc: 'both', spacing: { after: 200, line: 240 } }));
    pg++;
    // Table of contents and lists: their own pages, then the entries are known.
    const tocPages = Math.max(1, Math.ceil((pre.length + 1 + toc.length + 4) / 30));
    const listPages = k => Math.max(1, Math.ceil((lists[k].length + 3) / 30));
    const abbr = String(F.abbreviations || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(.+?)\s*(?:=|:|\t|–|—| - )\s*(.+)$/); return m ? [m[1].trim(), m[2].trim()] : null; }).filter(Boolean);
    const tocPage = pg;
    pg += tocPages;
    const plan = [];
    for (const k of ['T', 'F', 'P']) if (lists[k].length) { plan.push({ k, page: pg }); pg += listPages(k); }
    const abbrPage = abbr.length ? pg : 0;
    const roman = n => { const map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]; let s = ''; for (const [v, r] of map) while (n >= v) { s += r; n -= v; } return s; };
    const entriesFront = [...pre.map(p => ({ level: 1, text: p.text, page: roman(p.page) })), { level: 1, text: T.toc, page: roman(tocPage) },
      ...plan.map(x => ({ level: 1, text: T[{ T: 'lot', F: 'lof', P: 'lop' }[x.k]], page: roman(x.page) })), ...(abbr.length ? [{ level: 1, text: T.loa, page: roman(abbrPage) }] : [])];
    const tocField = (instr, entries, styleOf) => {
      const right = [{ val: 'right', leader: 'dot', pos: TEXT_W }];
      if (!entries.length) return para('<w:r><w:fldChar w:fldCharType="begin"/></w:r>' + `<w:r><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r>` + '<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>');
      return entries.map((e, i) => para((i === 0 ? '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' + `<w:r><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r>` + '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' : '') +
        run(e.text) + tabRun() + run(String(e.page)) + (i === entries.length - 1 ? '<w:r><w:fldChar w:fldCharType="end"/></w:r>' : ''), { style: styleOf(e), tabs: right })).join('');
    };
    front.push(para(tc(T.toc, 1) + run(T.toc), { style: 'PrelimHeading', pageBreak: true }));
    front.push(para(run(T.page, { b: true }), { jc: 'right', spacing: { after: 120 } }));
    front.push(tocField('TOC \\o "2-3" \\f \\l "1-1" \\h \\z', [...entriesFront, ...toc], e => 'TOC' + e.level));
    for (const x of plan) {
      const head = T[{ T: 'lot', F: 'lof', P: 'lop' }[x.k]];
      front.push(para(tc(head, 1) + run(head), { style: 'PrelimHeading', pageBreak: true }));
      front.push(para(run(T[{ T: 'tables', F: 'figures', P: 'plates' }[x.k]], { b: true }) + tabRun() + run(T.title, { b: true }) + tabRun() + run(T.page, { b: true }), { tabs: [{ val: 'left', pos: 1440 }, { val: 'right', pos: TEXT_W }], spacing: { after: 120 } }));
      front.push(tocField('TOC \\f ' + x.k + ' \\h \\z', lists[x.k], () => 'TOC1'));
    }
    if (abbr.length) {
      front.push(para(tc(T.loa, 1) + run(T.loa), { style: 'PrelimHeading', pageBreak: true }));
      front.push(abbrTable(abbr.sort((a, b) => a[0].localeCompare(b[0]))));
    }
    // Section break: front matter in lowercase Roman (title page counted, number hidden).
    front.push(para('', { sect: sectPr('lowerRoman', true) }));

    const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${front.join('')}${body.join('') || para(run('[' + T.chapter + ' 1]'), { style: 'Heading1' })}${sectPr('decimal', false)}</w:body></w:document>`;
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'],
      ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(project.title || '')}</dc:title><dc:creator>${esc(titleCase(String(F.name || '').toLowerCase()))}</dc:creator></cp:coreProperties>`],
      ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdFtrBlank" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>' + (usedImage ? '<Relationship Id="rIdFw" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/kerangka.png"/>' : '') + '</Relationships>'],
      ['word/document.xml', document],
      ['word/styles.xml', styles()],
      ['word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:updateFields w:val="true"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>'],
      ['word/numbering.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'],
      ['word/footer1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>'],
      ['word/footer2.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p/></w:ftr>']
    ];
    if (usedImage) files.push(['word/media/kerangka.png', fig.bytes]);
    return { files, stats: { chapters: chapters.length, refs: refs.length, tables: lists.T.length, figures: lists.F.length + lists.P.length, pages: page, abstractWords: words(F.abstract), abstrakWords: words(F.abstrak), lang } };

    function sectPr(fmtName, first) {
      return `<w:sectPr><w:footerReference w:type="default" r:id="rIdFtr"/>${first ? '<w:footerReference w:type="first" r:id="rIdFtrBlank"/>' : ''}<w:pgSz w:w="${PAGE.w}" w:h="${PAGE.h}"/><w:pgMar w:top="${PAGE.top}" w:right="${PAGE.right}" w:bottom="${PAGE.bottom}" w:left="${PAGE.left}" w:header="709" w:footer="709" w:gutter="0"/><w:pgNumType w:fmt="${fmtName}" w:start="1"/>${first ? '<w:titlePg/>' : ''}</w:sectPr>`;
    }
    function image(img, id) {
      const cx = Math.round((TEXT_W - 400) * 635), cy = Math.round(cx * img.height / img.width);
      return `<w:p>${pPr({ jc: 'center', box: true, keepNext: true, spacing: { before: 240, after: 120, line: 240 } })}<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Figure ${id}" descr="Conceptual framework"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="kerangka.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdFw"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    }
  }

  /* APA-style table: lines above and below the header and at the end, no side borders. */
  function table(rows) {
    const n = Math.max(...rows.map(r => r.length));
    const first = Math.round(TEXT_W * (n > 2 ? 0.34 : 0.5)), rest = n > 1 ? Math.floor((TEXT_W - first) / (n - 1)) : 0;
    const widths = [first, ...Array.from({ length: n - 1 }, () => rest)];
    const total = widths.reduce((a, b) => a + b, 0);
    const line = 'w:val="single" w:sz="8" w:space="0" w:color="000000"';
    const cell = (text, w, ri, ci) => {
      const borders = ri === 0 ? `<w:tcBorders><w:top ${line}/><w:bottom ${line}/></w:tcBorders>` : ri === rows.length - 1 ? `<w:tcBorders><w:bottom ${line}/></w:tcBorders>` : '';
      const num = ci > 0 && /^[-–<>=.\d*%\s()]+$/.test(text);
      return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${borders}</w:tcPr>${para(run(text, { b: ri === 0, sz: 11 }), { jc: num || (ri === 0 && ci > 0) ? 'center' : 'left', spacing: { before: 40, after: 40, line: 240 } })}</w:tc>`;
    };
    return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map((r, ri) => `<w:tr>${ri === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${widths.map((w, ci) => cell(r[ci] || '', w, ri, ci)).join('')}</w:tr>`).join('')}</w:tbl>` + para('', { spacing: { after: 120, line: 240 } });
  }
  function abbrTable(rows) {
    const w1 = 2400, w2 = TEXT_W - w1;
    return `<w:tbl><w:tblPr><w:tblW w:w="${TEXT_W}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="${w1}"/><w:gridCol w:w="${w2}"/></w:tblGrid>${rows.map(([a, b]) => `<w:tr><w:tc><w:tcPr><w:tcW w:w="${w1}" w:type="dxa"/></w:tcPr>${para(run(a), { spacing: { after: 0, line: 360 } })}</w:tc><w:tc><w:tcPr><w:tcW w:w="${w2}" w:type="dxa"/></w:tcPr>${para(run(b), { spacing: { after: 0, line: 360 } })}</w:tc></w:tr>`).join('')}</w:tbl>` + para('');
  }

  function styles() {
    const st = (id, name, ppr, rpr, extra) => `<w:style w:type="paragraph" w:styleId="${id}"${id === 'Normal' ? ' w:default="1"' : ''}><w:name w:val="${name}"/>${id !== 'Normal' ? '<w:basedOn w:val="Normal"/><w:next w:val="' + (/^Heading|Caption|Prelim|RefHeading/.test(id) ? 'BodyText' : id) + '"/>' : ''}${extra || ''}${id !== 'Normal' ? '<w:qFormat/>' : ''}${ppr ? '<w:pPr>' + ppr + '</w:pPr>' : ''}${rpr ? '<w:rPr>' + rpr + '</w:rPr>' : ''}</w:style>`;
    const tnr = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';
    const right = `<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${TEXT_W}"/></w:tabs>`;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:docDefaults><w:rPrDefault><w:rPr>${tnr}<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-MY"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
      st('Normal', 'Normal', '', '') +
      st('BodyText', 'Body Text', '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="720"/><w:jc w:val="both"/>', '') +
      st('Heading1', 'heading 1', '<w:keepNext/><w:keepLines/><w:spacing w:before="0" w:after="360" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/>', '<w:b/><w:bCs/><w:caps/><w:sz w:val="28"/><w:szCs w:val="28"/>') +
      st('Heading2', 'heading 2', '<w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="0" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="1"/>', '<w:b/><w:bCs/>') +
      st('Heading3', 'heading 3', '<w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="0" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="2"/>', '<w:b/><w:bCs/>') +
      st('Heading4', 'heading 4', '<w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="0" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="3"/>', '<w:b/><w:bCs/><w:i/><w:iCs/>') +
      st('PrelimHeading', 'Prelim Heading', '<w:keepNext/><w:spacing w:before="0" w:after="360" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/>', '<w:b/><w:bCs/><w:caps/><w:sz w:val="28"/><w:szCs w:val="28"/>') +
      st('RefHeading', 'References Heading', '<w:keepNext/><w:spacing w:before="0" w:after="360" w:line="360" w:lineRule="auto"/>', '<w:b/><w:bCs/><w:caps/><w:sz w:val="28"/><w:szCs w:val="28"/>') +
      st('Reference', 'Reference', '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="720" w:hanging="720"/>', '') +
      st('Caption', 'caption', '<w:spacing w:before="120" w:after="240" w:line="240" w:lineRule="auto"/>', '') +
      st('ListBullet', 'List Bullet', '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="720" w:hanging="360"/><w:jc w:val="both"/>', '') +
      st('Hanging', 'Hanging Item', '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="720" w:hanging="720"/><w:jc w:val="both"/>', '') +
      st('TOC1', 'toc 1', right + '<w:spacing w:before="60" w:after="0" w:line="360" w:lineRule="auto"/>', '') +
      st('TOC2', 'toc 2', right + '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="360"/>', '') +
      st('TOC3', 'toc 3', right + '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:left="720"/>', '') +
      '</w:styles>';
  }

  /* Abbreviations written in the text as "Full Name (ABBR)", for the List of Abbreviations. */
  function findAbbreviations(text) {
    const out = new Map();
    for (const m of String(text || '').matchAll(/((?:[\p{L}][\p{L}'-]*\s+){1,8}?)\(([A-Z][A-Za-z&*-]{1,9}s?)\)/gu)) {
      const abbr = m[2], ws = m[1].trim().split(/\s+/);
      const letters = abbr.replace(/[^A-Z]/g, '');
      if (letters.length < 2 || out.has(abbr)) continue;
      // Take as many trailing words as needed for their initials to cover the abbreviation.
      for (let k = Math.min(ws.length, letters.length + 3); k >= letters.length - 1 && k >= 1; k--) {
        const cand = ws.slice(ws.length - k);
        const initials = cand.filter(w => /^[\p{Lu}]/u.test(w)).map(w => w[0].toUpperCase()).join('');
        if (initials.startsWith(letters[0]) && (initials === letters || initials.includes(letters) || letters.includes(initials) && initials.length >= letters.length - 1)) { while (cand.length > 1 && !/^[\p{Lu}]/u.test(cand[0])) cand.shift(); out.set(abbr, cand.join(' ')); break; }
      }
    }
    return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([a, b]) => a + ' = ' + b);
  }

  return { build, findAbbreviations, caption, chapterTitle, refRuns, monthYear, TEXT_W, PAGE };
});
