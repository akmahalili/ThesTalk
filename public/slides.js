/* Talkademic "Slaid Pembentangan": thesis or paper → presentation outline (AI) → editable preview
   with your own pictures → PowerPoint file built in the browser (vendored PptxGenJS).
   Pictures are kept on this device in IndexedDB, not in the workspace, so backups stay small. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Slaid Pembentangan', alt: 'Presentation Slides', sub: 'Jana slaid daripada tesis atau paper anda, letak gambar sendiri, kemudian muat turun PowerPoint. Setiap slaid ada nota penyampai.',
      source: 'Sumber', thesisAll: 'Seluruh tesis', paper: 'Paper', kind: 'Jenis pembentangan', 'k.proposal': 'Pembentangan proposal', 'k.viva': 'Viva / pertahanan akhir', 'k.conference': 'Persidangan', 'k.progress': 'Laporan kemajuan', 'k.lecture': 'Kuliah kelas',
      minutes: 'Masa', min: '{n} minit', write: 'Bahasa slaid', presenter: 'Nama penyampai', audience: 'Audiens (pilihan)', audiencePh: 'Contoh: panel penilai, pensyarah, pelajar',
      go: 'Jana slaid', busy: 'Menyusun slaid… (sehingga 1 minit)', need: 'Sumber ini belum cukup teks. Tulis beberapa perenggan dahulu.', confirmNew: 'Gantikan slaid sedia ada dengan set baharu? Gambar yang diletak akan dibuang.',
      slides: '{n} slaid', pptx: 'Muat turun PowerPoint', building: 'Membina fail PowerPoint…', built: 'Fail PowerPoint dimuat turun.', editHint: 'Ketik teks untuk sunting. Tambah gambar sendiri pada mana-mana slaid.',
      addImg: 'Tambah gambar', changeImg: 'Tukar gambar', removeImg: 'Buang gambar', idea: 'Cadangan gambar', notes: 'Nota penyampai', up: 'Naik', down: 'Turun', del: 'Buang slaid', confirmDel: 'Buang slaid ini?',
      refs: 'Rujukan', refsSlide: 'Tambah slaid rujukan', thanks: 'Terima kasih', placeholder: 'Letak gambar di sini', imgFail: 'Gambar ini tidak dapat dibaca. Cuba JPG atau PNG.',
      theme: 'Tema reka bentuk', themeHint: 'Ketik tema untuk tukar rupa semua slaid. Boleh tukar bila-bila masa.', random: 'Rawak', placeholderShort: 'Gambar', step: 'Langkah',
      note: 'Semak setiap slaid sebelum membentang. Angka diambil daripada teks anda; gambar dan susun atur boleh diubah lagi dalam PowerPoint.'
    },
    en: {
      title: 'Presentation Slides', alt: 'Slaid Pembentangan', sub: 'Generate slides from your thesis or paper, add your own pictures, then download PowerPoint. Every slide comes with speaker notes.',
      source: 'Source', thesisAll: 'Whole thesis', paper: 'Paper', kind: 'Presentation type', 'k.proposal': 'Proposal defence', 'k.viva': 'Viva / final defence', 'k.conference': 'Conference', 'k.progress': 'Progress report', 'k.lecture': 'Class lecture',
      minutes: 'Length', min: '{n} minutes', write: 'Slide language', presenter: 'Presenter name', audience: 'Audience (optional)', audiencePh: 'e.g. examiners, lecturers, students',
      go: 'Generate slides', busy: 'Arranging slides… (up to a minute)', need: 'This source does not have enough text yet. Write a few paragraphs first.', confirmNew: 'Replace the current slides with a new set? Pictures you added will be removed.',
      slides: '{n} slides', pptx: 'Download PowerPoint', building: 'Building the PowerPoint file…', built: 'PowerPoint file downloaded.', editHint: 'Tap text to edit it. Add your own pictures to any slide.',
      addImg: 'Add picture', changeImg: 'Change picture', removeImg: 'Remove picture', idea: 'Picture idea', notes: 'Speaker notes', up: 'Move up', down: 'Move down', del: 'Delete slide', confirmDel: 'Delete this slide?',
      refs: 'References', refsSlide: 'Add a references slide', thanks: 'Thank you', placeholder: 'Put a picture here', imgFail: 'This picture could not be read. Try JPG or PNG.',
      theme: 'Design theme', themeHint: 'Tap a theme to restyle every slide. You can switch any time.', random: 'Random', placeholderShort: 'Picture', step: 'Step',
      note: 'Check every slide before presenting. Numbers come from your text; pictures and layout can still be changed in PowerPoint.'
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
      else if (['value', 'disabled', 'hidden', 'checked'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const KINDS = ['proposal', 'viva', 'conference', 'progress', 'lecture'];
  let busy = false;

  /* ---------- pictures on this device (IndexedDB) ---------- */
  const IDB = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('talkademic', 1); r.onupgradeneeded = () => r.result.createObjectStore('images'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const tx = db.transaction('images', mode); const q = fn(tx.objectStore('images')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); };
    return { get: k => run('readonly', s => s.get(k)), put: (k, v) => run('readwrite', s => s.put(v, k)), del: k => run('readwrite', s => s.delete(k)) };
  })();
  const urls = new Map();
  async function imageUrl(id) {
    if (urls.has(id)) return urls.get(id);
    const v = await IDB.get(id).catch(() => null);
    const u = v && v.blob ? URL.createObjectURL(v.blob) : '';
    urls.set(id, u);
    return u;
  }
  async function shrink(file) {
    let src;
    try { src = await createImageBitmap(file); } catch (e) {
      src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    }
    const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight, k = Math.min(1, 1600 / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
    if (!blob) throw new Error('encode');
    return { blob, w: c.width, h: c.height };
  }
  const dataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

  /* ---------- data ---------- */
  function data() {
    const s = App.state();
    if (!s.slides || typeof s.slides !== 'object') s.slides = { source: 'thesis', kind: 'proposal', minutes: 15, language: (s.project && /melayu|malay/i.test(s.project.language || '')) ? 'Bahasa Melayu' : (lang() === 'en' ? 'English' : 'Bahasa Melayu'), presenter: presenterName(), audience: '', theme: 'galeri', deck: null };
    if (!s.slides.theme) s.slides.theme = 'galeri';
    return s.slides;
  }
  function presenterName() { try { return (JSON.parse(localStorage.getItem('thestalk_ui_v1') || '{}').name || '').trim(); } catch (e) { return ''; } }
  function sources() {
    const s = App.state(), out = [{ id: 'thesis', label: t('thesisAll') + ': ' + ((s.project || {}).title || '') }];
    (s.chapters || []).forEach(ch => out.push({ id: 'ch:' + ch.id, label: ch.title }));
    (s.papers || []).forEach(p => out.push({ id: 'paper:' + p.id, label: t('paper') + ': ' + ((p.title || '').trim() || '—') }));
    return out;
  }
  function material(id) {
    const s = App.state();
    if (id.startsWith('paper:')) {
      const p = (s.papers || []).find(x => 'paper:' + x.id === id);
      if (!p) return null;
      return { title: p.title || '', language: p.language, refs: p.references || [], sections: (p.sections || []).map(x => ({ name: x.key, content: x.content || '' })) };
    }
    const chs = id.startsWith('ch:') ? (s.chapters || []).filter(c => 'ch:' + c.id === id) : (s.chapters || []);
    return { title: (s.project || {}).title || '', language: (s.project || {}).language, refs: s.references || [], sections: chs.flatMap(c => (c.sections || []).map(x => ({ name: c.title + ' — ' + x.title, content: x.content || '' }))) };
  }
  const niceDate = k => { if (!/^\d{4}-\d{2}-\d{2}$/.test(k || '')) return k || ''; const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }); };
  const words = list => list.reduce((n, x) => n + (String(x.content).match(/\S+/g) || []).length, 0);

  /* ---------- generate ---------- */
  async function generate() {
    const d = data();
    const m = material(d.source);
    if (!m || words(m.sections) < 80) { App.toast(t('need')); return; }
    if (d.deck && !confirm(t('confirmNew'))) return;
    if (!(await App.ensureAI())) return;
    busy = true; render();
    try {
      const res = await App.apiPost('/api/slides', { title: m.title, kind: d.kind, minutes: d.minutes, language: d.language, presenter: d.presenter, audience: d.audience, sections: m.sections });
      if (d.deck) for (const sl of d.deck.slides) if (sl.img) IDB.del(sl.id).catch(() => {});
      const deck = res.deck;
      deck.slides.forEach(sl => {
        sl.id = App.uid();
        if (sl.layout === 'framework') { sl.links = sl.links.map(l => ({ f: sl.nodes.indexOf(l.from), t: sl.nodes.indexOf(l.to), label: l.label || '' })).filter(l => l.f >= 0 && l.t >= 0); }
      });
      deck.presenter = d.presenter; deck.date = new Date().toISOString().slice(0, 10); deck.source = d.source; deck.refsSlide = true; deck.theme = d.theme || 'galeri'; deck.kindLabel = t('k.' + d.kind);
      d.deck = deck; App.save();
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }

  /* ---------- editing helpers ---------- */
  function ed(obj, key, cls, tag = 'div') {
    return h(tag, { class: 'sl-ed ' + (cls || ''), contenteditable: 'plaintext-only', spellcheck: 'false', text: obj[key] || '',
      onblur: e => { const v = e.target.innerText.replace(/\s+/g, ' ').trim(); if (v !== obj[key]) { obj[key] = v; App.save(); } } });
  }
  function edList(arr, cls) {
    return h('ul', { class: 'sl-list ' + (cls || '') }, arr.map((x, i) => h('li', { contenteditable: 'plaintext-only', spellcheck: 'false', text: x,
      onblur: e => { const v = e.target.innerText.replace(/\s+/g, ' ').trim(); if (v !== arr[i]) { arr[i] = v; App.save(); } } })));
  }
  const clean = arr => arr.filter(x => String(x || '').trim());

  /* ---------- preview ---------- */
  function slideBox(sl, i, deck) {
    const pic = h('div', { class: 'sl-pic' + (sl.img ? '' : ' empty') }, sl.img ? null : h('span', { text: t('placeholder') }));
    if (sl.img) imageUrl(sl.id).then(u => { if (u) pic.style.backgroundImage = 'url("' + u + '")'; });
    const withPic = sl.img || sl.layout === 'image';
    let body;
    if (sl.layout === 'title' || sl.layout === 'end') body = [h('div', { class: 'sl-dark' }, ed(sl, 'title', 'sl-h1'), ed(sl, 'subtitle', 'sl-sub'), h('div', { class: 'sl-by', text: [deck.presenter, sl.layout === 'title' ? niceDate(deck.date) : ''].filter(Boolean).join(' · ') })), sl.img ? pic : null];
    else if (sl.layout === 'section') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-kicker'), ed(sl, 'statement', 'sl-statement')), sl.img ? pic : null];
    else if (sl.layout === 'bullets') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-h2'), edList(sl.bullets)), withPic ? pic : null];
    else if (sl.layout === 'stats') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-h2'), h('div', { class: 'sl-stats' }, sl.stats.map(x => h('div', { class: 'sl-stat' }, ed(x, 'value', 'sl-val'), ed(x, 'label', 'sl-lbl')))))];
    else if (sl.layout === 'framework') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-h2'), frameworkPreview(sl))];
    else if (sl.layout === 'compare') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-h2'), h('div', { class: 'sl-cmp' }, ['left', 'right'].map(k => h('div', { class: 'sl-side ' + k }, ed(sl[k], 'heading', 'sl-h3'), edList(sl[k].bullets)))))];
    else if (sl.layout === 'steps') body = [h('div', { class: 'sl-main' }, ed(sl, 'title', 'sl-h2'), h('ol', { class: 'sl-steplist' }, sl.steps.map((x, j) => h('li', {}, h('b', { class: 'sl-step-n', text: String(j + 1) }), ed(x, 'label', 'sl-step-l'), ed(x, 'text', 'sl-step-t')))))];
    else if (sl.layout === 'quote') body = [h('div', { class: 'sl-main sl-quote-main' }, h('span', { class: 'sl-qmark', 'aria-hidden': 'true', text: '“' }), ed(sl, 'quote', 'sl-quote-text'), ed(sl, 'source', 'sl-source'))];
    else body = [pic, h('div', { class: 'sl-band' }, ed(sl, 'title', 'sl-h2'), ed(sl, 'caption', 'sl-sub'))];
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      try { const v = await shrink(f); await IDB.put(sl.id, v); urls.delete(sl.id); sl.img = true; App.save(); render(); } catch (err) { App.toast(t('imgFail')); }
    } });
    const move = dir => { const a = deck.slides, j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; App.save(); render(); };
    return h('li', { class: 'sl-item' },
      h('div', { class: 'sl-frame sl-' + sl.layout + (withPic ? ' has-pic' : '') + (i % 2 ? ' odd' : ''), 'data-theme': deck.theme || 'klasik' },
        h('i', { class: 'sl-d1', 'aria-hidden': 'true' }), h('i', { class: 'sl-d2', 'aria-hidden': 'true' }), h('i', { class: 'sl-d3', 'aria-hidden': 'true' }),
        body, ['title', 'end'].includes(sl.layout) ? null : h('span', { class: 'sl-no', text: String(i + 1) })),
      h('div', { class: 'sl-tools' },
        h('span', { class: 'sl-num', text: '#' + (i + 1) }),
        h('button', { type: 'button', class: 'btn btn-outline btn-mini', onclick: () => file.click() }, '🖼 ', sl.img ? t('changeImg') : t('addImg')), file,
        sl.img ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: async () => { await IDB.del(sl.id).catch(() => {}); urls.delete(sl.id); sl.img = false; App.save(); render(); }, text: t('removeImg') }) : null,
        h('span', { class: 'sl-move' },
          h('button', { type: 'button', class: 'btn-reset sl-ic', 'aria-label': t('up'), title: t('up'), disabled: i === 0, onclick: () => move(-1) }, '↑'),
          h('button', { type: 'button', class: 'btn-reset sl-ic', 'aria-label': t('down'), title: t('down'), disabled: i === deck.slides.length - 1, onclick: () => move(1) }, '↓'),
          h('button', { type: 'button', class: 'btn-reset sl-ic', 'aria-label': t('del'), title: t('del'), onclick: () => { if (!confirm(t('confirmDel'))) return; if (sl.img) IDB.del(sl.id).catch(() => {}); deck.slides.splice(i, 1); App.save(); render(); } }, '×'))),
      sl.imageHint ? h('p', { class: 'sl-idea' }, h('strong', { text: '💡 ' + t('idea') + ': ' }), sl.imageHint) : null,
      h('details', { class: 'sl-notes' }, h('summary', { text: t('notes') }), ed(sl, 'notes', 'sl-note-text')));
  }
  function levels(sl) {
    const n = sl.nodes.length, lv = new Array(n).fill(0);
    for (let k = 0; k < n; k++) for (const l of sl.links) if (lv[l.t] < lv[l.f] + 1 && lv[l.f] + 1 < n) lv[l.t] = lv[l.f] + 1;
    const cols = [];
    lv.forEach((c, i) => { (cols[c] = cols[c] || []).push(i); });
    return cols.filter(Boolean);
  }
  function frameworkPreview(sl) {
    const cols = levels(sl);
    return h('div', { class: 'sl-fw' }, cols.map((col, ci) => [ci ? h('span', { class: 'sl-arrow', 'aria-hidden': 'true', text: '→' }) : null,
      h('div', { class: 'sl-col' }, col.map(i => { const box = { v: sl.nodes[i] }; const el = ed(box, 'v', 'sl-node'); el.addEventListener('blur', () => { if (box.v && box.v !== sl.nodes[i]) { sl.nodes[i] = box.v; App.save(); } }); return el; }))]));
  }

  /* Theme swatches: a tiny cover of each theme. Changing it restyles the current deck too. */
  function themePicker(d) {
    const TH = (window.TalkademicSlideThemes || {}).THEMES || {};
    const ORDER = (window.TalkademicSlideThemes || {}).ORDER || [];
    const pickTheme = id => { d.theme = id; if (d.deck) d.deck.theme = id; App.save(); render(); };
    return h('div', { class: 'sl-themes' },
      h('div', { class: 'sl-themes-head' }, h('span', { class: 'field-label', text: t('theme') }),
        h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { const others = ORDER.filter(x => x !== d.theme); pickTheme(others[Math.floor(Math.random() * others.length)]); } }, '🎲 ', t('random'))),
      h('div', { class: 'sl-theme-row', role: 'radiogroup', 'aria-label': t('theme') }, ORDER.map(id => h('button', { type: 'button', role: 'radio', 'aria-checked': String(d.theme === id), class: 'btn-reset sl-swatch' + (d.theme === id ? ' on' : ''), onclick: () => pickTheme(id) },
        h('span', { class: 'sl-sw-frame', 'data-theme': id }, h('i', { class: 'sw1' }), h('i', { class: 'sw2' }), h('i', { class: 'sw3' }), h('b', { text: 'Aa' })),
        h('span', { class: 'sl-sw-name', text: lang() === 'en' ? TH[id].en : TH[id].name })))),
      h('p', { class: 'muted small-note', text: t('themeHint') }));
  }
  function ensureFonts() {
    if (document.getElementById('slideFonts')) return;
    const l = document.createElement('link'); l.id = 'slideFonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Questrial&family=Lora:ital,wght@0,600;1,500&family=Courier+Prime&display=swap';
    document.head.append(l);
  }
  function render() {
    const root = $('#view-slides');
    if (!root) return;
    const d = data();
    const srcs = sources();
    if (!srcs.some(s => s.id === d.source)) d.source = 'thesis';
    const sel = (key, opts) => { const el = h('select', { onchange: e => { d[key] = key === 'minutes' ? Number(e.target.value) : e.target.value; App.save(); } }, opts.map(([v, l]) => h('option', { value: v, text: l }))); el.value = String(d[key]); return el; };
    const deck = d.deck;
    ensureFonts();
    fill(root, 
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'slidesTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'card ana-form' },
        h('label', { class: 'form-field' }, h('span', { text: t('source') }), sel('source', srcs.map(s => [s.id, s.label]))),
        h('div', { class: 'ana-row' },
          h('label', { class: 'form-field' }, h('span', { text: t('kind') }), sel('kind', KINDS.map(k => [k, t('k.' + k)]))),
          h('label', { class: 'form-field' }, h('span', { text: t('minutes') }), sel('minutes', [5, 10, 15, 20, 30].map(n => [String(n), t('min', { n })])))),
        h('div', { class: 'ana-row' },
          h('label', { class: 'form-field' }, h('span', { text: t('write') }), sel('language', [['Bahasa Melayu', 'Bahasa Melayu'], ['English', 'English']])),
          h('label', { class: 'form-field' }, h('span', { text: t('presenter') }), h('input', { type: 'text', maxLength: 120, value: d.presenter || '', oninput: e => { d.presenter = e.target.value; if (d.deck) d.deck.presenter = e.target.value; App.save(); } }))),
        themePicker(d),
        h('label', { class: 'form-field' }, h('span', { text: t('audience') }), h('input', { type: 'text', maxLength: 200, value: d.audience || '', placeholder: t('audiencePh'), oninput: e => { d.audience = e.target.value; App.save(); } })),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: generate }, '✨ ', t('go')),
          busy ? h('span', { class: 'chat-activity', role: 'status', text: t('busy') }) : null)),
      deck ? h('div', { class: 'card sl-deck' },
        h('div', { class: 'mx-head' }, h('strong', { text: t('slides', { n: deck.slides.length }) }), h('span', { class: 'muted small-note', text: t('editHint') })),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => pptx(deck).catch(e => App.toast(e.message || 'Error')) }, '⬇ ', t('pptx')),
          h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: deck.refsSlide !== false, onchange: e => { deck.refsSlide = e.target.checked; App.save(); } }), h('span', { text: t('refsSlide') }))),
        h('ol', { class: 'sl-items' }, deck.slides.map((sl, i) => slideBox(sl, i, deck))),
        h('p', { class: 'result-notes', text: t('note') })) : null);
  }

  /* ---------- references cited on the slides ---------- */
  function citedRefs(deck) {
    const m = material(deck.source || 'thesis');
    const text = JSON.stringify(deck.slides);
    const sur = r => { const a = (r.authors || [])[0] || ''; return a.includes(',') ? a.split(',')[0].trim() : a.trim().split(/\s+/).pop() || ''; };
    return (m ? m.refs : []).filter(r => r && r.apa && r.year && sur(r) && text.includes(sur(r)) && text.includes(String(r.year)))
      .sort((a, b) => String(a.apa).localeCompare(String(b.apa)));
  }

  /* ---------- PowerPoint ---------- */
  let loader = null;
  const loadPptx = () => loader || (loader = new Promise((res, rej) => { if (window.PptxGenJS) return res(); const s = document.createElement('script'); s.src = '/vendor/pptxgenjs/pptxgen.bundle.js'; s.onload = res; s.onerror = () => { loader = null; rej(new Error('PowerPoint library did not load. Check the internet connection.')); }; document.head.append(s); }));
  async function pptx(deck) {
    App.toast(t('building'));
    await loadPptx();
    const pres = new window.PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    pres.title = deck.title || 'Talkademic';
    pres.author = deck.presenter || '';
    const pics = {};
    for (const sl of deck.slides) if (sl.img) { const v = await IDB.get(sl.id).catch(() => null); if (v && v.blob) pics[sl.id] = await dataUrl(v.blob); }
    const refs = deck.refsSlide === false ? [] : citedRefs(deck);
    window.TalkademicSlideThemes.build(pres, deck, { pics, refs, t, niceDate, levels });
    let blob = await pres.write({ outputType: 'blob' });
    // Rebuild the zip without folder entries: OneDrive / SharePoint refuse files that have them.
    if (window.JSZip) {
      const src = await window.JSZip.loadAsync(blob), out = new window.JSZip();
      for (const [path, entry] of Object.entries(src.files)) if (!entry.dir) out.file(path, await entry.async('uint8array'), { createFolders: false });
      blob = await out.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', compression: 'DEFLATE' });
    }
    const safe = String(deck.title || 'Talkademic').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'Talkademic';
    const a = h('a', { href: URL.createObjectURL(blob), download: 'Talkademic-slaid-' + safe + '.pptx' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    App.toast(t('built'));
    return blob;
  }

  window.TalkademicSlides = { render, pptx, levels };
})();
