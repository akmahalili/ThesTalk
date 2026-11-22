/* Talkademic "Import Tesis": choose a Word file, a PDF or pasted text; the app reads it on the device,
   arranges it by topic (thesisorganize.js) and shows the chapters and sections before anything changes.
   For a draft with no clear headings, "Susun ikut topik dengan AI" groups the paragraphs into chapters
   and sections without rewriting them. Importing replaces the thesis chapters (a copy is kept for undo),
   fills the preliminary pages of Format Tesis Universiti and adds the references to the library. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const O = window.TalkademicThesisOrganize;
  const shell = () => window.ThesTalkShell || {};
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Import tesis', intro: 'Pilih fail tesis anda. App membaca fail dalam peranti ini (tiada apa dimuat naik), kemudian menyusunnya ikut bab dan topik. Anda semak dahulu sebelum apa-apa berubah.',
      pick: '📄 Pilih fail Word, PDF atau teks', formats: 'Terbaik: Word (.docx). PDF juga boleh, tetapi jadual dan rajah mungkin perlu disemak. Fail .doc lama: Simpan Sebagai .docx dahulu.',
      paste: 'Atau tampal teks', pasted: 'Teks ditampal', pastePh: 'Tampal teks tesis atau draf di sini…', pasteGo: 'Susun teks ini',
      reading: 'Membaca {f}…', page: 'Membaca halaman {p} daripada {n}…', arranging: 'Menyusun ikut topik…',
      found: '{c} bab · {s} seksyen · {w} perkataan · {r} rujukan', aiBadge: '✨ Disusun oleh AI',
      needsAI: 'Fail ini tiada tajuk bab yang jelas. Tekan "Susun ikut topik dengan AI" untuk kumpulkan perenggan ke dalam bab dan seksyen. Ayat anda tidak diubah.',
      unplaced: '{n} perenggan tidak dapat disusun dan diletakkan dalam seksyen "Belum disusun".',
      chapters: 'Bab dan seksyen', words: '{n} perkataan', front: 'Ke Format Tesis Universiti', none: 'Tiada halaman awal ditemui.',
      fAbstract: 'Abstract', fAbstrak: 'Abstrak', fKeywords: 'Keywords', fKata: 'Kata kunci', fAck: 'Penghargaan', fAbbr: 'Senarai singkatan ({n})', fProfile: 'Profil pengarang', fTitle: 'Tajuk',
      left: 'Tidak diimport', lContents: 'Isi kandungan dan senarai jadual/rajah ({n} baris)', lFront: 'Perakuan, pengesahan dan halaman lain ({n})', lAppendix: 'Lampiran ({n} perenggan)', lImages: 'Gambar ditanda supaya mudah dimasukkan semula ({n})', leftNote: 'Halaman awal ini dijana semula oleh Format Tesis Universiti.',
      oFront: 'Isi halaman awal dalam Format Tesis Universiti', oRefs: 'Tambah {n} rujukan ke Pustaka', oTitle: 'Guna tajuk ini untuk projek',
      replace: 'Bab tesis sedia ada ({n} perkataan) akan diganti. Salinan disimpan: boleh batal di Profil → Backup & pulih.',
      modeTitle: 'Tesis sedia ada', modeMatch: 'Ganti {list} sahaja. Bab lain kekal.', modeAll: 'Ganti seluruh tesis ({n} perkataan sekarang)', modeAdd: 'Tambah sebagai bab baharu. Bab sedia ada kekal.', replacing: 'Akan diganti: {list}', undoNote: 'Salinan disimpan: boleh batal di Profil → Backup & pulih.', chLabel: 'Bab',
      ai: '✨ Susun ikut topik dengan AI', aiAgain: '✨ Susun semula dengan AI', aiWorking: 'AI sedang menyusun…', aiTooMany: 'Terlalu banyak perenggan untuk AI ({n}, had 600). Import fail yang ada tajuk bab.',
      go: 'Import ke tesis', cancel: 'Batal', back: '← Pilih fail lain', close: 'Tutup',
      done: 'Tesis diimport: {c} bab, {s} seksyen. Semak setiap bab dalam Tesis Saya.', errType: 'Jenis fail ini tidak disokong. Pilih .docx, .pdf atau .txt.', errPdf: 'PDF ini tidak dapat dibaca (mungkin imbasan gambar tanpa teks).', errEmpty: 'Tiada bab atau perenggan ditemui.',
      topic: { intro: 'Pengenalan', literature: 'Kajian literatur', method: 'Metodologi', results: 'Dapatan', discussion: 'Perbincangan', conclusion: 'Kesimpulan', other: 'Lain-lain' }
    },
    en: {
      title: 'Import thesis', intro: 'Choose your thesis file. The app reads it on this device (nothing is uploaded) and arranges it by chapter and topic. You check it before anything changes.',
      pick: '📄 Choose a Word, PDF or text file', formats: 'Best: Word (.docx). PDF works too, but tables and figures may need checking. Old .doc files: Save As .docx first.',
      paste: 'Or paste text', pasted: 'Pasted text', pastePh: 'Paste your thesis or draft text here…', pasteGo: 'Arrange this text',
      reading: 'Reading {f}…', page: 'Reading page {p} of {n}…', arranging: 'Arranging by topic…',
      found: '{c} chapters · {s} sections · {w} words · {r} references', aiBadge: '✨ Arranged by AI',
      needsAI: 'This file has no clear chapter headings. Tap "Arrange by topic with AI" to group the paragraphs into chapters and sections. Your sentences are not changed.',
      unplaced: '{n} paragraphs could not be placed and are in a "Not yet arranged" section.',
      chapters: 'Chapters and sections', words: '{n} words', front: 'To University Thesis Format', none: 'No preliminary pages found.',
      fAbstract: 'Abstract', fAbstrak: 'Abstrak (Malay)', fKeywords: 'Keywords', fKata: 'Kata kunci', fAck: 'Acknowledgement', fAbbr: 'List of abbreviations ({n})', fProfile: "Author's profile", fTitle: 'Title',
      left: 'Not imported', lContents: 'Contents and lists of tables/figures ({n} lines)', lFront: 'Declaration, approval and other pages ({n})', lAppendix: 'Appendices ({n})', lImages: 'Images marked so they are easy to put back ({n})', leftNote: 'University Thesis Format makes these preliminary pages again.',
      oFront: 'Fill the preliminary pages in University Thesis Format', oRefs: 'Add {n} references to the Library', oTitle: 'Use this title for the project',
      replace: 'The current thesis chapters ({n} words) will be replaced. A copy is kept: undo in Profile → Backup & restore.',
      modeTitle: 'Current thesis', modeMatch: 'Replace {list} only. Other chapters stay.', modeAll: 'Replace the whole thesis ({n} words now)', modeAdd: 'Add as new chapters. Current chapters stay.', replacing: 'Will be replaced: {list}', undoNote: 'A copy is kept: undo in Profile → Backup & restore.', chLabel: 'Chapter',
      ai: '✨ Arrange by topic with AI', aiAgain: '✨ Arrange again with AI', aiWorking: 'The AI is arranging…', aiTooMany: 'Too many paragraphs for the AI ({n}, limit 600). Import a file with chapter headings.',
      go: 'Import into thesis', cancel: 'Cancel', back: '← Choose another file', close: 'Close',
      done: 'Thesis imported: {c} chapters, {s} sections. Check each chapter in My Thesis.', errType: 'This file type is not supported. Choose .docx, .pdf or .txt.', errPdf: 'This PDF could not be read (it may be a scan with no text).', errEmpty: 'No chapters or paragraphs were found.',
      topic: { intro: 'Introduction', literature: 'Literature review', method: 'Methodology', results: 'Findings', discussion: 'Discussion', conclusion: 'Conclusion', other: 'Other' }
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const fmt = n => Number(n || 0).toLocaleString(lang() === 'en' ? 'en-MY' : 'ms-MY');
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  /* The number of a chapter: "Chapter 3: …", "BAB TIGA", or "3.1 …" (an earlier import that made sections into chapters). */
  const numOf = title => O.chapterNumber(title) || Number((String(title || '').trim().match(/^(\d{1,2})(?:\.\d+)*\s/) || [])[1] || 0);
  const thesisWords = () => (App.state().chapters || []).reduce((a, c) => a + (c.sections || []).reduce((b, x) => b + words(x.content), 0), 0);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'checked', 'open', 'rows'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }

  let root = null, body = null, job = null, busy = false, lastFocus = null;
  const show = (...kids) => body.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false && k !== ''));

  function open(file) {
    close();
    lastFocus = document.activeElement;
    body = h('div', { class: 'imp-body' });
    const dialog = h('div', { class: 'modal imp-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'impTitle' },
      h('div', { class: 'modal-top' }, h('h2', { id: 'impTitle', text: t('title') }), h('button', { type: 'button', class: 'btn-reset imp-x', 'aria-label': t('close'), text: '✕', onclick: close })),
      body);
    root = h('div', { class: 'modal-backdrop imp-backdrop', onclick: e => { if (e.target === root && !busy) close(); } }, dialog);
    document.addEventListener('keydown', onKey);
    document.body.append(root);
    if (file) read(file); else choose();
    setTimeout(() => { const f = root && root.querySelector('button.btn-primary, button'); if (f) f.focus(); }, 30);
  }
  function onKey(e) { if (e.key === 'Escape' && root && !busy) close(); }
  function close() {
    document.removeEventListener('keydown', onKey);
    if (root) root.remove();
    root = null; body = null; job = null; busy = false;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* gone */ }
  }

  function choose() {
    const input = h('input', { type: 'file', accept: '.docx,.pdf,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain', hidden: true, onchange: e => { const f = e.target.files && e.target.files[0]; if (f) read(f); } });
    const area = h('textarea', { rows: 6, placeholder: t('pastePh'), 'aria-label': t('paste') });
    show(
      h('p', { class: 'imp-intro', text: t('intro') }),
      h('button', { type: 'button', class: 'btn btn-primary imp-pick', text: t('pick'), onclick: () => input.click() }), input,
      h('p', { class: 'muted small-note', text: t('formats') }),
      h('details', { class: 'imp-paste' }, h('summary', { text: t('paste') }), area,
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-outline', text: t('pasteGo'), onclick: () => { if (area.value.trim()) arrange({ blocks: O.textBlocks(area.value) }, t('pasted')); } }))));
  }
  function progress(msg) { show(h('div', { class: 'imp-progress', role: 'status' }, h('span', { class: 'imp-spin', 'aria-hidden': 'true' }), h('span', { text: msg }))); }
  function fail(msg) {
    show(h('p', { class: 'result-notes', role: 'alert', text: msg }), h('div', { class: 'modal-actions' }, h('button', { type: 'button', class: 'btn btn-outline', text: t('back'), onclick: choose })));
  }

  async function read(file) {
    const name = file.name || 'file';
    progress(t('reading', { f: name }));
    try {
      if (/\.docx$/i.test(name) || /wordprocessingml/.test(file.type)) {
        const parsed = await window.TalkademicDocx.read(file);
        return arrange(parsed, name);
      }
      if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
        if (file.size > 60 * 1024 * 1024) return fail(shell().t ? shell().t('imp.err.too-large') : 'Too large');
        const pages = await pdfLines(file, (p, n) => { if (body) body.querySelector('.imp-progress span:last-child').textContent = t('page', { p, n }); });
        if (!pages.some(p => p.length)) return fail(t('errPdf'));
        return arrange({ blocks: O.pdfBlocks(pages) }, name);
      }
      if (/\.(txt|md)$/i.test(name) || /^text\//.test(file.type)) return arrange({ blocks: O.textBlocks(await file.text()) }, name);
      if (/\.doc$/i.test(name)) return fail(shell().t ? shell().t('imp.err.old-doc') : t('errType'));
      return fail(t('errType'));
    } catch (e) {
      const key = 'imp.err.' + (e.code || 'not-docx');
      fail(e.code && shell().t ? shell().t(key) : (e.message || t('errType')));
    }
  }

  /* pdf.js text, grouped into lines with their font size and height on the page. */
  let pdfjs = null;
  async function pdfLines(file, onPage) {
    if (!pdfjs) { pdfjs = await import('/vendor/pdfjs/pdf.min.mjs'); pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs'; }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, isEvalSupported: false, useSystemFonts: true }).promise;
    const pages = [];
    try {
      const n = Math.min(doc.numPages, 600);
      for (let i = 1; i <= n; i++) {
        if (onPage && (i === 1 || i % 5 === 0)) { onPage(i, n); await new Promise(r => setTimeout(r, 0)); }
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        const rows = [];
        for (const it of tc.items) {
          if (!it.str || !it.transform) continue;
          const y = it.transform[5], x = it.transform[4], size = Math.abs(it.transform[3]) || it.height || 0;
          let row = rows.find(r => Math.abs(r.y - y) <= Math.max(2, size * 0.35));
          if (!row) { row = { y, size: 0, items: [] }; rows.push(row); }
          row.items.push({ x, str: it.str, w: it.width || 0 });
          row.size = Math.max(row.size, size);
        }
        rows.sort((a, b) => b.y - a.y);
        pages.push(rows.map(r => {
          r.items.sort((a, b) => a.x - b.x);
          let text = '', end = null;
          for (const it of r.items) {
            if (text && end !== null && it.x - end > r.size * 0.15 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += it.x - end > r.size * 2 ? '\t' : ' ';
            text += it.str; end = it.x + it.w;
          }
          return { text, size: r.size, y: r.y, x: r.items.length ? r.items[0].x : 0 };
        }).filter(l => l.text.trim()));
        page.cleanup();
      }
    } finally { doc.destroy(); }
    return pages;
  }

  function arrange(parsed, name) {
    progress(t('arranging'));
    const result = O.organize(parsed, { parseRef: window.TalkademicDocx ? window.TalkademicDocx.parseRef : undefined });
    if (!result.chapters.length && !result.paragraphs.length) return fail(t('errEmpty'));
    const s = App.state();
    const title = String(s.project && s.project.title || '').trim();
    job = { name, result, ai: false, unplaced: 0, useTitle: !!result.title && (!title || /^(my first thesis|tesis pertama saya)$/i.test(title)), useFront: true, useRefs: true, mode: defaultMode(result) };
    preview();
  }

  /* Importing one or two chapters into a thesis that has others: replace only those chapters by number. */
  function defaultMode(r) {
    const s = App.state();
    if (!thesisWords()) return 'all';
    const nums = new Set(r.chapters.map(c => numOf(c.title)).filter(Boolean));
    const others = s.chapters.filter(c => !nums.has(numOf(c.title)) && c.sections.some(x => words(x.content)));
    return nums.size && others.length ? 'match' : 'all';
  }
  function matching(r) {
    const nums = new Set(r.chapters.map(c => numOf(c.title)).filter(Boolean));
    return { nums: [...nums].sort((a, b) => a - b), old: App.state().chapters.filter(c => nums.has(numOf(c.title))) };
  }
  function preview() {
    const r = job.result, stats = { c: r.chapters.length, s: r.chapters.reduce((a, c) => a + c.sections.length, 0), w: r.chapters.reduce((a, c) => a + c.sections.reduce((b, x) => b + words(x.content), 0), 0) };
    const current = thesisWords();
    const f = r.front;
    const frontItems = [
      r.title && [t('fTitle'), r.title],
      f.abstract && [t('fAbstract'), t('words', { n: fmt(words(f.abstract)) })],
      f.keywords && [t('fKeywords'), f.keywords],
      f.abstrak && [t('fAbstrak'), t('words', { n: fmt(words(f.abstrak)) })],
      f.kataKunci && [t('fKata'), f.kataKunci],
      f.ack && [t('fAck'), t('words', { n: fmt(words(f.ack)) })],
      f.abbreviations && [t('fAbbr', { n: f.abbreviations.split('\n').length }), ''],
      f.profile && [t('fProfile'), t('words', { n: fmt(words(f.profile)) })]
    ].filter(Boolean);
    const left = [
      r.skipped.contents && t('lContents', { n: fmt(r.skipped.contents) }),
      r.skipped.frontPages && t('lFront', { n: fmt(r.skipped.frontPages) }),
      r.skipped.appendix && t('lAppendix', { n: fmt(r.skipped.appendix) }),
      r.stats.images && t('lImages', { n: fmt(r.stats.images) })
    ].filter(Boolean);
    const tooMany = r.paragraphs.length > 600;
    const aiFirst = r.needsAI && !job.ai;
    const aiBtn = r.paragraphs.length >= 3 ? h('button', { type: 'button', class: aiFirst ? 'btn btn-primary' : 'btn btn-outline', disabled: busy || tooMany, title: tooMany ? t('aiTooMany', { n: r.paragraphs.length }) : null, text: busy ? t('aiWorking') : job.ai ? t('aiAgain') : t('ai'), onclick: arrangeWithAI }) : null;
    const check = (key, label) => h('label', { class: 'uf-check' }, h('input', { type: 'checkbox', checked: !!job[key], onchange: e => { job[key] = e.target.checked; } }), h('span', { text: label }));
    show(
      h('p', { class: 'imp-file' }, h('strong', { text: job.name }), job.ai ? h('span', { class: 'status-chip imp-ai', text: t('aiBadge') }) : null),
      h('p', { class: 'imp-stats', text: t('found', { c: fmt(stats.c), s: fmt(stats.s), w: fmt(stats.w), r: fmt(r.references.length) }) }),
      r.needsAI && !job.ai ? h('p', { class: 'result-notes', text: t('needsAI') }) : null,
      job.unplaced ? h('p', { class: 'result-notes', text: t('unplaced', { n: job.unplaced }) }) : null,
      h('h3', { text: t('chapters') }),
      h('div', { class: 'imp-outline' }, r.chapters.map((c, i) => h('details', { open: i === 0 },
        h('summary', {}, h('span', { class: 'imp-ch', text: c.title }), h('span', { class: 'imp-topic t-' + c.topic, text: (S[lang()] || S.ms).topic[c.topic] || c.topic }), h('span', { class: 'imp-w', text: fmt(c.sections.reduce((a, x) => a + words(x.content), 0)) })),
        h('ul', {}, c.sections.map(x => h('li', {}, h('span', { text: x.title }), h('span', { class: 'imp-w', text: fmt(words(x.content)) }))))))),
      h('h3', { text: t('front') }),
      frontItems.length ? h('ul', { class: 'imp-front' }, frontItems.map(([a, b]) => h('li', {}, h('span', { text: '✓ ' + a }), b ? h('span', { class: 'muted', text: b }) : null))) : h('p', { class: 'muted small-note', text: t('none') }),
      left.length ? h('div', { class: 'imp-left' }, h('strong', { text: t('left') }), h('ul', {}, left.map(x => h('li', { text: x }))), h('p', { class: 'muted small-note', text: t('leftNote') })) : null,
      h('div', { class: 'imp-options' },
        frontItems.some(([a]) => a !== t('fTitle')) ? check('useFront', t('oFront')) : null,
        r.references.length ? check('useRefs', t('oRefs', { n: fmt(r.references.length) })) : null,
        r.title ? check('useTitle', t('oTitle')) : null),
      current ? modeChooser(r, current) : null,
      h('div', { class: 'modal-actions imp-actions' },
        aiBtn,
        h('button', { type: 'button', class: 'btn btn-outline', disabled: busy, text: t('cancel'), onclick: close }),
        h('button', { type: 'button', class: aiFirst && aiBtn ? 'btn btn-outline imp-go' : 'btn btn-primary imp-go', disabled: busy || !r.chapters.length, text: t('go'), onclick: apply })));
  }

  function modeChooser(r, current) {
    const m = matching(r);
    const list = m.nums.map(n => t('chLabel') + ' ' + n).join(', ');
    const radio = (value, label) => h('label', { class: 'imp-radio' }, h('input', { type: 'radio', name: 'impMode', value, checked: job.mode === value, onchange: () => { job.mode = value; preview(); } }), h('span', { text: label }));
    const replaced = job.mode === 'all' ? [] : job.mode === 'match' ? m.old.map(c => c.title) : [];
    return h('fieldset', { class: 'imp-mode' }, h('legend', { text: t('modeTitle') }),
      m.nums.length ? radio('match', t('modeMatch', { list })) : null,
      radio('add', t('modeAdd')),
      radio('all', t('modeAll', { n: fmt(current) })),
      replaced.length ? h('p', { class: 'muted small-note', text: t('replacing', { list: replaced.join(' · ') }) }) : null,
      job.mode !== 'add' ? h('p', { class: 'muted small-note', text: t('undoNote') }) : null);
  }
  async function arrangeWithAI() {
    const r = job.result;
    if (busy || r.paragraphs.length < 3) return;
    if (App.ensureAI && !(await App.ensureAI())) return;
    busy = true; preview();
    try {
      const short = r.paragraphs.map(p => p.split(/\s+/).slice(0, 45).join(' '));
      const plan = await App.apiPost('/api/organize', { paragraphs: short, language: r.lang === 'ms' ? 'Bahasa Melayu' : 'English' });
      if (!job) return;
      const a = O.applyPlan(plan, r.paragraphs, r.lang);
      if (!a.chapters.length) throw new Error(t('errEmpty'));
      job.result = Object.assign({}, r, { chapters: a.chapters, needsAI: false });
      job.ai = true; job.unplaced = a.unplaced;
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; if (job) preview(); }
  }

  function apply() {
    const r = job.result, s = App.state();
    const had = thesisWords();
    const imported = r.chapters.map(c => ({ id: c.id, title: c.title, sections: c.sections.map(x => ({ id: x.id, title: x.title, content: x.content, history: [] })) }));
    let chapters = imported;
    if (had && job.mode === 'match') {
      const nums = new Set(imported.map(c => numOf(c.title)).filter(Boolean));
      chapters = s.chapters.filter(c => !nums.has(numOf(c.title))).concat(imported).map((c, i) => ({ c, i, n: numOf(c.title) || 999 }))
        .sort((a, b) => a.n - b.n || a.i - b.i).map(x => x.c);
    } else if (had && job.mode === 'add') chapters = s.chapters.concat(imported);
    const next = Object.assign({}, s, { chapters, activeChapter: imported[0].id, activeSection: imported[0].sections[0].id, conversion: null });
    next.project = Object.assign({}, s.project);
    if (job.useTitle && r.title) next.project.title = r.title.slice(0, 300);
    if (!had) next.project.language = r.lang === 'ms' ? 'Bahasa Melayu' : 'English';
    if (job.useRefs && r.references.length) {
      const known = new Set((s.references || []).map(x => String(x.apa || '').toLowerCase()));
      const refs = (s.references || []).slice();
      for (const x of r.references) {
        const k = x.apa.toLowerCase();
        if (known.has(k)) continue;
        known.add(k);
        refs.push({ apa: x.apa, doi: x.doi || '', url: x.url || '', title: x.title || '', year: x.year || '', authors: x.authors || [], venue: '', volume: '', issue: '', pages: '', type: 'import', addedAt: new Date().toISOString().slice(0, 10) });
      }
      next.references = refs;
    }
    if (job.useFront) {
      const tf = Object.assign({ kind: 'thesis', name: '', studentId: '', degree: '', programme: '', faculty: '', month: '', abstract: '', abstrak: '', ack: '', abbreviations: '', profile: '', confirm: false, vivaDate: '', examiners: '' }, s.thesisFormat || {});
      for (const k of ['abstract', 'abstrak', 'ack', 'abbreviations', 'profile', 'keywords', 'kataKunci']) if (String(r.front[k] || '').trim()) tf[k] = r.front[k];
      next.thesisFormat = tf;
    }
    const ok = shell().replaceWorkspace ? shell().replaceWorkspace(next) : App.replaceState(next);
    if (!ok) { App.toast(shell().t ? shell().t('imp.err.storage') : 'Storage full'); return; }
    const c = imported.length, sN = imported.reduce((a, x) => a + x.sections.length, 0);
    close();
    if (shell().go) shell().go('academic');
    if (App.setMobileTab) App.setMobileTab('thesis');
    if (App.render) App.render();
    App.toast(t('done', { c: fmt(c), s: fmt(sN) }));
  }

  window.TalkademicThesisImport = { open, close };
})();
