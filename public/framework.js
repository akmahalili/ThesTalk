/* Talkademic "Kerangka Konseptual": build the study's conceptual framework (constructs, arrows,
   moderators, controls), number the hypotheses H1…Hn, download the figure as PNG, and put the
   figure with its hypotheses into the thesis or a paper. The Word export draws the figure where
   the line "[Rajah: Kerangka Konseptual]" stands, and the slides reuse it. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const C = window.TalkademicFrameworkCore;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Kerangka Konseptual', alt: 'Conceptual Framework', sub: 'Bina kerangka kajian anda: konstruk, anak panah dan hipotesis H1, H2… dinomborkan sendiri. Muat turun sebagai gambar atau masukkan terus ke tesis.',
      ai: '✨ Cadang dengan AI', aiFrom: 'Baca daripada', aiHelp: 'AI baca tajuk, objektif dan bab anda, kemudian cadangkan konstruk dan hubungan. Semak dan ubah selepas itu.', aiBusy: 'Membaca teks anda…', aiReplace: 'Ganti kerangka sekarang dengan cadangan AI?', aiNeed: 'Tulis objektif atau Bab 1 dahulu.', aiDone: 'Cadangan dimasukkan. Semak setiap konstruk.',
      thesis: 'Tesis', paper: 'Paper',
      constructs: 'Konstruk', addC: '+ Tambah konstruk', cName: 'Nama konstruk', dims: 'Dimensi / sub-konstruk', dimsPh: 'Satu dimensi setiap baris (pilihan)', del: 'Buang', confirmDel: 'Buang konstruk ini bersama anak panahnya?',
      'r.iv': 'Pemboleh ubah bebas (IV)', 'r.med': 'Pengantara (mediator)', 'r.mod': 'Penyederhana (moderator)', 'r.dv': 'Pemboleh ubah bersandar (DV)', 'r.ctrl': 'Kawalan (control)',
      paths: 'Hubungan (anak panah)', addP: '+ Tambah hubungan', auto: '⚡ Sambung automatik', autoDone: '{n} hubungan ditambah.', autoNone: 'Semua hubungan asas sudah ada.', pos: 'positif (+)', neg: 'negatif (−)', needTwo: 'Tambah sekurang-kurangnya dua konstruk dahulu.',
      mods: 'Penyederhanaan', addM: '+ Tambah penyederhanaan', modOf: 'menyederhanakan', needMod: 'Tukar satu konstruk kepada Penyederhana dahulu.',
      theory: 'Teori asas', theoryPh: 'cth. Signalling Theory (Spence, 1973)', mediation: 'Tambah hipotesis pengantaraan (X → M → Y) secara automatik', hypLang: 'Bahasa hipotesis',
      preview: 'Rajah', styleThesis: 'Tesis (hitam putih)', styleColour: 'Berwarna', png: '⬇ Muat turun PNG', emptyFig: 'Rajah akan muncul di sini selepas anda tambah konstruk.',
      hyps: 'Hipotesis', noHyp: 'Tiada hipotesis lagi. Tambah hubungan antara konstruk.', copy: 'Salin hipotesis', copied: 'Disalin.',
      insert: 'Masukkan ke tesis', insertSec: 'Bahagian tesis', toThesis: 'Masukkan rajah + hipotesis', toPaper: 'Masukkan ke Tinjauan Literatur paper', inserted: 'Dimasukkan ke "{s}". Rajah akan dilukis dalam fail Word.',
      insertNote: 'Baris [Rajah: Kerangka Konseptual] akan menjadi gambar rajah bila anda Export DOCX. Slaid Pembentangan juga akan guna kerangka ini.',
      clear: 'Kosongkan kerangka', confirmClear: 'Kosongkan seluruh kerangka?', fileName: 'Kerangka-konseptual'
    },
    en: {
      title: 'Conceptual Framework', alt: 'Kerangka Konseptual', sub: 'Build your study framework: constructs, arrows and hypotheses H1, H2… numbered for you. Download it as a picture or put it straight into the thesis.',
      ai: '✨ Suggest with AI', aiFrom: 'Read from', aiHelp: 'The AI reads your title, objectives and chapters, then suggests constructs and relationships. Check and edit them afterwards.', aiBusy: 'Reading your text…', aiReplace: 'Replace the current framework with the AI suggestion?', aiNeed: 'Write your objectives or Chapter 1 first.', aiDone: 'Suggestion added. Check every construct.',
      thesis: 'Thesis', paper: 'Paper',
      constructs: 'Constructs', addC: '+ Add construct', cName: 'Construct name', dims: 'Dimensions / sub-constructs', dimsPh: 'One dimension per line (optional)', del: 'Remove', confirmDel: 'Remove this construct and its arrows?',
      'r.iv': 'Independent variable (IV)', 'r.med': 'Mediator', 'r.mod': 'Moderator', 'r.dv': 'Dependent variable (DV)', 'r.ctrl': 'Control variable',
      paths: 'Relationships (arrows)', addP: '+ Add relationship', auto: '⚡ Connect automatically', autoDone: '{n} relationships added.', autoNone: 'All the basic relationships are already there.', pos: 'positive (+)', neg: 'negative (−)', needTwo: 'Add at least two constructs first.',
      mods: 'Moderation', addM: '+ Add moderation', modOf: 'moderates', needMod: 'Set one construct as Moderator first.',
      theory: 'Underpinning theory', theoryPh: 'e.g. Signalling Theory (Spence, 1973)', mediation: 'Add mediation hypotheses (X → M → Y) automatically', hypLang: 'Hypothesis language',
      preview: 'Figure', styleThesis: 'Thesis (black and white)', styleColour: 'Colour', png: '⬇ Download PNG', emptyFig: 'The figure appears here once you add constructs.',
      hyps: 'Hypotheses', noHyp: 'No hypotheses yet. Add relationships between constructs.', copy: 'Copy hypotheses', copied: 'Copied.',
      insert: 'Add to the thesis', insertSec: 'Thesis section', toThesis: 'Add figure + hypotheses', toPaper: "Add to a paper's Literature Review", inserted: 'Added to "{s}". The figure is drawn in the Word file.',
      insertNote: 'The line [Figure: Conceptual Framework] becomes the figure when you Export DOCX. Presentation Slides also use this framework.',
      clear: 'Clear framework', confirmClear: 'Clear the whole framework?', fileName: 'Conceptual-framework'
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
  let busy = false, aiSource = 'thesis', target = null;

  function data() {
    const s = App.state();
    if (!s.framework || typeof s.framework !== 'object') s.framework = C.empty();
    const f = s.framework;
    for (const k of ['constructs', 'paths', 'mods']) if (!Array.isArray(f[k])) f[k] = [];
    if (!f.style) f.style = 'thesis';
    if (!f.hypLang) f.hypLang = (s.project || {}).language === 'Bahasa Melayu' || lang() === 'ms' ? 'ms' : 'en';
    return f;
  }
  const named = f => f.constructs.filter(c => String(c.name || '').trim());
  const cname = (f, id) => ((f.constructs.find(c => c.id === id) || {}).name || '').trim() || '?';
  const save = () => App.save();

  /* ---------- editing ---------- */
  function addConstruct() {
    const f = data();
    const has = r => f.constructs.some(c => c.role === r);
    const role = !has('iv') ? 'iv' : !has('dv') ? 'dv' : 'iv';
    f.constructs.push({ id: C.newId('c'), name: '', role, items: [] });
    save(); render();
    const inputs = document.querySelectorAll('#view-framework .fw-cname');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }
  function removeConstruct(id) {
    const f = data();
    if (String((f.constructs.find(c => c.id === id) || {}).name || '').trim() && !confirm(t('confirmDel'))) return;
    f.constructs = f.constructs.filter(c => c.id !== id);
    const gone = new Set(f.paths.filter(p => p.from === id || p.to === id).map(p => p.id));
    f.paths = f.paths.filter(p => !gone.has(p.id));
    f.mods = f.mods.filter(m => m.by !== id && !gone.has(m.path));
    save(); render();
  }
  function addPath() {
    const f = data(), list = named(f);
    if (list.length < 2) { App.toast(t('needTwo')); return; }
    const exists = (a, b) => f.paths.some(p => p.from === a && p.to === b);
    let from = list[0].id, to = list[1].id;
    outer: for (const a of list) for (const b of list) if (a.id !== b.id && a.role !== 'dv' && b.role !== 'iv' && !exists(a.id, b.id)) { from = a.id; to = b.id; break outer; }
    f.paths.push({ id: C.newId('p'), from, to, sign: '+' });
    save(); render();
  }
  /* IV → mediator → DV, and IV → DV; each moderator without a job moderates the first path into a DV. */
  function autoConnect() {
    const f = data(), list = named(f);
    if (list.length < 2) { App.toast(t('needTwo')); return; }
    const of = r => list.filter(c => c.role === r);
    const ivs = of('iv'), meds = of('med'), dvs = of('dv');
    let n = 0;
    const link = (a, b) => { if (a.id !== b.id && !f.paths.some(p => p.from === a.id && p.to === b.id)) { f.paths.push({ id: C.newId('p'), from: a.id, to: b.id, sign: '+' }); n++; } };
    for (const x of ivs) for (const m of meds) link(x, m);
    for (const m of meds) for (const y of dvs) link(m, y);
    for (const x of ivs) for (const y of dvs) link(x, y);
    for (const z of of('mod')) {
      if (f.mods.some(m => m.by === z.id)) continue;
      const p = f.paths.find(q => dvs.some(y => y.id === q.to) && q.from !== z.id);
      if (p) { f.mods.push({ id: C.newId('m'), by: z.id, path: p.id }); n++; }
    }
    save(); render();
    App.toast(n ? t('autoDone', { n }) : t('autoNone'));
  }
  function addMod() {
    const f = data();
    const mods = named(f).filter(c => c.role === 'mod');
    if (!mods.length) { App.toast(t('needMod')); return; }
    if (!f.paths.length) { App.toast(t('noHyp')); return; }
    const by = (mods.find(z => !f.mods.some(m => m.by === z.id)) || mods[0]).id;
    const p = f.paths.find(q => q.from !== by && q.to !== by && !f.mods.some(m => m.by === by && m.path === q.id)) || f.paths[0];
    f.mods.push({ id: C.newId('m'), by, path: p.id });
    save(); render();
  }

  /* ---------- AI suggestion ---------- */
  function material() {
    const s = App.state();
    if (aiSource.startsWith('paper:')) {
      const p = (s.papers || []).find(x => 'paper:' + x.id === aiSource);
      if (!p) return null;
      return { title: p.title || '', language: p.language, objectives: '', questions: '', sections: (p.sections || []).filter(x => ['abstract', 'introduction', 'literature', 'method'].includes(x.key)).map(x => ({ name: x.key, content: x.content || '' })) };
    }
    const pr = s.project || {};
    const chs = (s.chapters || []).slice(0, 3);
    return { title: pr.title || '', language: pr.language, objectives: pr.objectives || '', questions: pr.questions || '', sections: chs.flatMap(c => (c.sections || []).map(x => ({ name: c.title + ' — ' + x.title, content: x.content || '' }))) };
  }
  async function suggest() {
    const m = material();
    const words = m ? [m.objectives, m.questions, ...m.sections.map(x => x.content)].join(' ').split(/\s+/).filter(Boolean).length : 0;
    if (words < 40) { App.toast(t('aiNeed')); return; }
    const f = data();
    if (named(f).length && !confirm(t('aiReplace'))) return;
    if (!(await App.ensureAI())) return;
    busy = true; render();
    try {
      const res = await App.apiPost('/api/framework', { title: m.title, objectives: m.objectives, questions: m.questions, language: f.hypLang === 'en' ? 'English' : 'Bahasa Melayu', sections: m.sections });
      const fw = res.framework;
      // Fresh ids so they never clash with older ones kept in other places.
      const map = new Map(fw.constructs.map(c => [c.id, C.newId('c')]));
      const pmap = new Map(fw.paths.map(p => [p.id, C.newId('p')]));
      f.constructs = fw.constructs.map(c => ({ ...c, id: map.get(c.id) }));
      f.paths = fw.paths.map(p => ({ ...p, id: pmap.get(p.id), from: map.get(p.from), to: map.get(p.to) }));
      f.mods = fw.mods.map(x => ({ id: C.newId('m'), by: map.get(x.by), path: pmap.get(x.path) }));
      if (fw.theory) f.theory = fw.theory;
      save();
      App.toast(fw.note ? t('aiDone') + ' ' + fw.note : t('aiDone'));
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }

  /* ---------- picture ---------- */
  function figure(f, style) { return C.svg(f, { style: style || f.style, lang: f.hypLang }); }
  async function pngOf(f, style, scale) {
    const fig = figure(f, style);
    if (fig.empty) return null;
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('The figure could not be drawn.')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fig.svg); });
    const k = scale || 2.4, cv = document.createElement('canvas');
    cv.width = Math.round(fig.width * k); cv.height = Math.round(fig.height * k);
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return { blob, width: fig.width, height: fig.height };
  }
  async function downloadPng() {
    try {
      const out = await pngOf(data());
      if (!out) { App.toast(t('emptyFig')); return; }
      const url = URL.createObjectURL(out.blob), a = document.createElement('a');
      a.href = url; a.download = t('fileName') + '.png'; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { App.toast(e.message); }
  }
  /* For the Word export: the figure as PNG bytes, only when some text asks for it. */
  async function docxFigures(texts) {
    const s = App.state();
    if (!s.framework || !(texts || []).some(x => String(x || '').split(/\r?\n/).some(l => C.FIGURE_LINE.test(l)))) return {};
    try {
      const out = await pngOf(s.framework, 'thesis', 2.6);
      if (!out) return {};
      return { framework: { bytes: new Uint8Array(await out.blob.arrayBuffer()), width: out.width, height: out.height } };
    } catch (e) { return {}; }
  }

  /* ---------- insert ---------- */
  function sections() {
    const s = App.state();
    return (s.chapters || []).flatMap((c, ci) => (c.sections || []).map(x => ({ ch: c, sec: x, ci, label: c.title.split(':')[0] + ' › ' + x.title })));
  }
  function defaultTarget() {
    const all = sections();
    const hit = all.find(x => /kerangka konseptual|conceptual framework|research framework|kerangka kajian/i.test(x.sec.title)) || all.find(x => /hipotesis|hypothes/i.test(x.sec.title)) || all.find(x => /kerangka|framework/i.test(x.sec.title)) || all.find(x => App.section && x.sec === App.section());
    return hit ? hit.sec.id : (all[0] && all[0].sec.id);
  }
  function figNo(ci, ch) {
    const m = String(ch.title).match(/(\d+)/);
    const n = m ? m[1] : String(ci + 1);
    const used = (ch.sections || []).map(x => x.content || '').join('\n').match(new RegExp('(?:Rajah|Figure)\\s+' + n + '\\.(\\d+)', 'g')) || [];
    return n + '.' + (used.length + 1);
  }
  function toThesis() {
    const f = data();
    if (named(f).length < 2) { App.toast(t('needTwo')); return; }
    const pick = sections().find(x => x.sec.id === (target || defaultTarget()));
    if (!pick) return;
    const sec = pick.sec;
    if (!Array.isArray(sec.history)) sec.history = [];
    if (String(sec.content || '').trim()) { sec.history.push({ content: sec.content, at: App.date() }); if (sec.history.length > 15) sec.history.shift(); }
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + C.thesisText(f, f.hypLang, figNo(pick.ci, pick.ch));
    App.save(); if (App.render) App.render();
    App.toast(t('inserted', { s: sec.title }));
  }
  function toPaper(id) {
    const f = data();
    if (named(f).length < 2) { App.toast(t('needTwo')); return; }
    const p = (App.state().papers || []).find(x => x.id === id);
    if (!p) return;
    if (!Array.isArray(p.sections)) p.sections = [];
    let sec = p.sections.find(x => x.key === 'literature');
    if (!sec) { sec = { key: 'literature', content: '' }; p.sections.push(sec); }
    const ms = /melayu/i.test(p.language || '') ? 'ms' : 'en';
    sec.content = (String(sec.content || '').trim() ? sec.content.trim() + '\n\n' : '') + C.thesisText(f, ms, '1');
    p.updated = new Date().toISOString(); App.save();
    App.toast(t('inserted', { s: (p.title || '').trim() || '—' }));
  }

  /* ---------- view ---------- */
  function refresh() {
    const f = data();
    const box = $('#fwFigure'), list = $('#fwHyps');
    if (box) {
      const fig = figure(f);
      if (fig.empty) fill(box, h('p', { class: 'muted fw-empty', text: t('emptyFig') }));
      else box.innerHTML = fig.svg;
    }
    if (list) {
      const hy = C.hypotheses(f, f.hypLang);
      fill(list, hy.length ? h('ol', { class: 'fw-hyp-list' }, hy.map(x => h('li', {}, h('strong', { text: x.tag + ': ' }), x.text))) : h('p', { class: 'muted', text: t('noHyp') }));
      document.querySelectorAll('#view-framework .fw-htag').forEach(el => { const x = el.dataset.path ? hy.find(y => y.path === el.dataset.path) : hy.find(y => y.mod === el.dataset.mod); el.textContent = x ? x.tag : ''; });
    }
  }

  function constructRow(f, c) {
    const role = h('select', { class: 'fw-role', 'aria-label': t('r.' + c.role), onchange: e => { c.role = e.target.value; if (c.role !== 'mod') f.mods = f.mods.filter(m => m.by !== c.id); save(); render(); } },
      C.ROLES.map(r => h('option', { value: r, text: t('r.' + r) })));
    role.value = c.role;
    const dims = h('textarea', { rows: 3, placeholder: t('dimsPh'), value: (c.items || []).join('\n'), oninput: e => { c.items = e.target.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 8); save(); refresh(); } });
    return h('li', { class: 'fw-c fw-r-' + c.role },
      h('div', { class: 'fw-c-top' },
        h('input', { type: 'text', class: 'fw-cname', maxlength: '80', placeholder: t('cName'), 'aria-label': t('cName'), value: c.name || '', oninput: e => { c.name = e.target.value; save(); refresh(); }, onchange: () => render() }),
        h('button', { type: 'button', class: 'btn-reset fw-x', 'aria-label': t('del'), title: t('del'), onclick: () => removeConstruct(c.id), text: '×' })),
      h('div', { class: 'fw-c-bottom' }, role,
        h('details', { class: 'fw-dims', open: (c.items || []).length > 0 }, h('summary', { text: t('dims') + ((c.items || []).length ? ' (' + c.items.length + ')' : '') }), dims)));
  }
  function cSelect(f, value, list, onchange, label) {
    const sel = h('select', { 'aria-label': label, onchange }, list.map(c => h('option', { value: c.id, text: c.name.trim() })));
    sel.value = value;
    return sel;
  }
  function pathRow(f, p) {
    const list = named(f);
    const set = k => e => { p[k] = e.target.value; if (p.from === p.to) App.toast(t('needTwo')); save(); render(); };
    const sign = h('select', { class: 'fw-sign', 'aria-label': 'sign', onchange: e => { p.sign = e.target.value; save(); refresh(); } }, h('option', { value: '+', text: t('pos') }), h('option', { value: '-', text: t('neg') }));
    sign.value = p.sign === '-' ? '-' : '+';
    return h('li', { class: 'fw-p' },
      h('span', { class: 'fw-htag', 'data-path': p.id }),
      h('div', { class: 'fw-p-body' },
        h('div', { class: 'fw-p-main' }, cSelect(f, p.from, list, set('from'), 'from'), h('span', { class: 'fw-arrow', 'aria-hidden': 'true', text: '→' }), cSelect(f, p.to, list, set('to'), 'to')),
        h('div', { class: 'fw-p-meta' }, sign,
          h('button', { type: 'button', class: 'btn-reset fw-x', 'aria-label': t('del'), onclick: () => { f.paths = f.paths.filter(x => x !== p); f.mods = f.mods.filter(m => m.path !== p.id); save(); render(); }, text: '×' }))));
  }
  function modRow(f, m) {
    const mods = named(f).filter(c => c.role === 'mod');
    const by = cSelect(f, m.by, mods, e => { m.by = e.target.value; save(); render(); }, t('mods'));
    const path = h('select', { 'aria-label': t('paths'), onchange: e => { m.path = e.target.value; save(); render(); } },
      f.paths.map(p => h('option', { value: p.id, text: cname(f, p.from) + ' → ' + cname(f, p.to) })));
    path.value = m.path;
    return h('li', { class: 'fw-p' }, h('span', { class: 'fw-htag', 'data-mod': m.id }),
      h('div', { class: 'fw-p-body' },
        h('div', { class: 'fw-p-main' }, by, h('button', { type: 'button', class: 'btn-reset fw-x', 'aria-label': t('del'), onclick: () => { f.mods = f.mods.filter(x => x !== m); save(); render(); }, text: '×' })),
        h('span', { class: 'muted small-note', text: t('modOf') }), path));
  }

  function render() {
    const root = $('#view-framework');
    if (!root) return;
    const f = data(), s = App.state(), papers = s.papers || [];
    const hasMod = named(f).some(c => c.role === 'mod');
    const src = h('select', { 'aria-label': t('aiFrom'), onchange: e => { aiSource = e.target.value; } },
      h('option', { value: 'thesis', text: t('thesis') + ': ' + (((s.project || {}).title || '').trim() || '—') }),
      papers.map(p => h('option', { value: 'paper:' + p.id, text: t('paper') + ': ' + (((p.title || '').trim()) || '—') })));
    src.value = aiSource;
    const secSel = h('select', { 'aria-label': t('insertSec'), onchange: e => { target = e.target.value; } }, sections().map(x => h('option', { value: x.sec.id, text: x.label })));
    secSel.value = target || defaultTarget() || '';
    const paperSel = papers.length ? h('select', { 'aria-label': t('paper') }, papers.map(p => h('option', { value: p.id, text: ((p.title || '').trim()) || '—' }))) : null;
    const hypLang = h('select', { 'aria-label': t('hypLang'), onchange: e => { f.hypLang = e.target.value; save(); refresh(); } }, h('option', { value: 'ms', text: 'Bahasa Melayu' }), h('option', { value: 'en', text: 'English' }));
    hypLang.value = f.hypLang;
    const styleBtn = (id, label) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(f.style === id), class: 'btn-reset fw-style' + (f.style === id ? ' on' : ''), onclick: () => { f.style = id; save(); render(); }, text: label });

    fill(root,
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'frameworkTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'fw-grid' },
        h('div', { class: 'fw-edit' },
          h('div', { class: 'card ana-form' },
            h('label', { class: 'form-field' }, h('span', { text: t('aiFrom') }), src),
            h('p', { class: 'muted small-note', text: t('aiHelp') }),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: suggest, text: t('ai') }), busy ? h('span', { class: 'chat-activity', role: 'status', text: t('aiBusy') }) : null)),
          h('div', { class: 'card fw-card' },
            h('h3', { text: t('constructs') }),
            f.constructs.length ? h('ul', { class: 'fw-clist' }, f.constructs.map(c => constructRow(f, c))) : null,
            h('button', { type: 'button', class: 'btn btn-outline', onclick: addConstruct, text: t('addC') })),
          h('div', { class: 'card fw-card' },
            h('h3', { text: t('paths') }),
            f.paths.length ? h('ul', { class: 'fw-plist' }, f.paths.map(p => pathRow(f, p))) : null,
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-outline', onclick: addPath, text: t('addP') }), h('button', { type: 'button', class: 'btn btn-outline', onclick: autoConnect, text: t('auto') }))),
          hasMod || f.mods.length ? h('div', { class: 'card fw-card' },
            h('h3', { text: t('mods') }),
            f.mods.length ? h('ul', { class: 'fw-plist' }, f.mods.map(m => modRow(f, m))) : null,
            h('button', { type: 'button', class: 'btn btn-outline', onclick: addMod, text: t('addM') })) : null,
          h('div', { class: 'card fw-card' },
            h('label', { class: 'form-field' }, h('span', { text: t('theory') }), h('input', { type: 'text', maxlength: '160', placeholder: t('theoryPh'), value: f.theory || '', oninput: e => { f.theory = e.target.value; save(); refresh(); } })),
            h('label', { class: 'fw-check' }, h('input', { type: 'checkbox', checked: f.mediation !== false, onchange: e => { f.mediation = e.target.checked; save(); refresh(); } }), h('span', { text: t('mediation') })),
            h('label', { class: 'form-field' }, h('span', { text: t('hypLang') }), hypLang))),
        h('div', { class: 'fw-out' },
          h('div', { class: 'card fw-fig-card' },
            h('div', { class: 'fw-fig-head' }, h('h3', { text: t('preview') }),
              h('div', { class: 'fw-styles', role: 'radiogroup', 'aria-label': t('preview') }, styleBtn('thesis', t('styleThesis')), styleBtn('colour', t('styleColour')))),
            h('div', { id: 'fwFigure', class: 'fw-figure' }),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: downloadPng, text: t('png') }))),
          h('div', { class: 'card fw-card' },
            h('h3', { text: t('hyps') }),
            h('div', { id: 'fwHyps' }),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-outline', onclick: async () => {
              const hy = C.hypotheses(f, f.hypLang).map(x => x.tag + ': ' + x.text).join('\n');
              if (!hy) return;
              try { await navigator.clipboard.writeText(hy); App.toast(t('copied')); } catch (e) { App.toast(hy.slice(0, 80) + '…'); }
            }, text: t('copy') }))),
          h('div', { class: 'card fw-card' },
            h('h3', { text: t('insert') }),
            h('label', { class: 'form-field' }, h('span', { text: t('insertSec') }), secSel),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: toThesis, text: t('toThesis') })),
            paperSel ? h('div', { class: 'tool-row' }, paperSel, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => toPaper(paperSel.value), text: t('toPaper') })) : null,
            h('p', { class: 'muted small-note', text: t('insertNote') })),
          named(f).length ? h('button', { type: 'button', class: 'btn-reset text-action danger fw-clear', onclick: () => { if (!confirm(t('confirmClear'))) return; const s2 = App.state(); s2.framework = C.empty(); save(); render(); }, text: t('clear') }) : null)));
    refresh();
  }

  window.TalkademicFramework = { render, docxFigures, forSlide: () => { const s = App.state(); return s.framework ? C.forSlide(s.framework) : null; }, _test: { pngOf } };
})();
