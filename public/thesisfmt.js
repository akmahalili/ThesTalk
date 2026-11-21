/* Talkademic "Format Tesis Universiti": pick the university (public, private, or "other" with your own
   settings), fill in the preliminary pages (title page details, abstracts, keywords, acknowledgement,
   abbreviations, author's profile, approval page) and download the whole thesis as a Word file in that
   university's format. Each format links the guideline it was taken from. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const D = window.TalkademicThesisDocx;
  const Pf = window.TalkademicThesisProfiles;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Format Tesis Universiti', alt: 'University Thesis Format', sub: 'Pilih universiti anda, kemudian muat turun seluruh tesis sebagai fail Word mengikut garis panduan universiti itu: halaman tajuk, perakuan, abstrak, isi kandungan, senarai jadual dan rajah, penomboran halaman dan rujukan.',
      uni: 'Universiti', awam: 'Universiti awam', swasta: 'Universiti swasta', lain: 'Lain-lain', srcLabel: 'Garis panduan', notes: 'Perlu disemak', missing: 'Garis panduan {u} tidak dijumpai dalam talian. Pilih "Universiti lain" dan isi tetapan mengikut templat rasmi universiti anda.',
      custom: 'Tetapan universiti anda', cUniv: 'Nama universiti (halaman tajuk)', cUnivPh: 'cth. Universiti Sains Islam Malaysia', cMargins: 'Margin (cm): atas, bawah, kiri, kanan', cFont: 'Fon', cSize: 'Saiz fon', cLine: 'Jarak baris', cIndent: 'Inden perenggan', iAll: 'Semua perenggan', iNotFirst: 'Kecuali perenggan pertama selepas tajuk', iNone: 'Tiada inden', cAfter: 'Ruang selepas perenggan (pt)', cPage: 'Nombor halaman', pBC: 'Tengah bawah', pBR: 'Kanan bawah', pTR: 'Kanan atas', pTC: 'Tengah atas', cHide: 'Sembunyikan nombor pada muka pertama setiap bab', cChap: 'Nombor bab', nArabic: 'CHAPTER 1', nRoman: 'CHAPTER I', nWord: 'CHAPTER ONE', cLayout: 'Tajuk bab', lTwo: 'Dua baris (CHAPTER 1 / TAJUK)', lOne: 'Satu baris (CHAPTER 1: TAJUK)', cAbs: 'Abstrak', aThesis: 'Bahasa tesis dahulu', aMs: 'Abstrak BM dahulu', aEn: 'Abstract BI dahulu', aEnOnly: 'Abstract BI sahaja', cStmt: 'Ayat halaman tajuk (sebelum nama ijazah)',
      front: 'Halaman tajuk', kind: 'Jenis', thesis: 'Tesis (penyelidikan)', diss: 'Disertasi (mod campuran)', name: 'Nama pelajar', sid: 'No. pelajar / matrik', degree: 'Ijazah', prog: 'Program / bidang (pilihan)', progPh: 'cth. Art and Design', faculty: 'Fakulti / kolej', facultyPh: 'cth. College of Creative Arts', month: 'Bulan & tahun penyerahan', supervisor: 'Pengerusi jawatankuasa penyeliaan', title2: 'Tajuk dalam bahasa kedua (untuk abstrak terjemahan)',
      abstract: 'Abstract (English)', abstrak: 'Abstrak (Bahasa Melayu)', abstrakOpt: 'Abstrak (Bahasa Melayu, pilihan)', keywords: 'Keywords', kataKunci: 'Kata kunci', kwPh: 'empat hingga enam istilah, dipisah koma', words: '{n} perkataan', min: 'minimum {n}', over: 'mungkin melebihi satu halaman', needMs: 'Universiti ini memerlukan abstrak dalam kedua-dua bahasa.',
      ack: 'Penghargaan', ackHelp: 'Satu halaman. Namakan semua penyelia.', abbr: 'Senarai singkatan', abbrPh: 'PLS-SEM = Partial Least Squares Structural Equation Modelling', abbrFind: '✨ Cari dalam tesis', abbrFound: '{n} singkatan dijumpai.', abbrNone: 'Tiada singkatan baharu dijumpai.',
      profile: 'Profil pengarang (pilihan)', profilePh: 'Biodata ringkas: pencapaian akademik, pengalaman kerja, senarai penerbitan.',
      confirmUitm: 'Sertakan Pengesahan Panel Pemeriksa (naskhah akhir selepas viva)', confirmOther: 'Sertakan halaman pengesahan/kelulusan (naskhah akhir selepas viva)', viva: 'Tarikh viva', examiners: 'Panel pemeriksa (satu baris setiap orang)', examinersPh: 'Prof. Dr. Nama (Chairman)\nDr. Nama (Internal Examiner)\nProf. Dr. Nama (External Examiner)',
      build: '⬇ Muat turun tesis format {u} (Word)', buildAny: '⬇ Muat turun tesis (Word)', building: 'Menyediakan fail…', done: 'Fail dimuat turun. Buka dalam Word dan tekan Ya untuk mengemas kini medan.',
      check: 'Format yang digunakan', order: 'Susunan halaman awal', forms: 'Halaman kuning dalam fail ialah tempat borang rasmi bertandatangan: gantikan dengan borang daripada universiti.',
      tips: 'Petua', t1: 'Baris berlabel "Table 4.1: Tajuk" atau "Rajah 2.1: Tajuk" menjadi kapsyen dan masuk ke senarai jadual/rajah.', t2: 'Jadual yang disalin dari Analisis Soal Selidik (baris dipisah tab) menjadi jadual Word.', t3: 'Baris [Rajah: Kerangka Konseptual] menjadi gambar kerangka.', t4: 'Tanda [PERLU RUJUKAN] diserlahkan kuning supaya mudah dicari.', t5: 'Bila Word bertanya untuk mengemas kini medan, tekan Ya: Isi Kandungan dan nombor halaman akan tepat.',
      disclaimer: 'Format diambil daripada garis panduan rasmi yang diterbitkan dalam talian. Fakulti mungkin ada keperluan tambahan; semak versi terkini dengan pusat pengajian siswazah.', msNote: 'Halaman tajuk versi Bahasa Melayu mungkin diterjemah daripada templat Inggeris. Semak susunan kata dengan fakulti.',
      stats: '{c} bab · {r} rujukan · {t} jadual · {f} rajah', empty: 'Tiada bab berisi lagi. Tulis tesis dahulu.',
      f1: '{font} {size} pt, jarak baris {line}', iAllS: 'inden baris pertama', iNotFirstS: 'inden kecuali perenggan pertama selepas tajuk', iNoneS: 'tanpa inden', afterS: '{n} pt selepas perenggan',
      f2: 'Margin atas {t} cm, bawah {b} cm, kiri {l} cm, kanan {r} cm', f3: 'Nombor halaman {pos}: i, ii, iii… halaman awal; 1, 2, 3… dari Bab 1', hideS: '; tidak dicetak pada muka pertama bab', posBC: 'tengah bawah', posBR: 'kanan bawah', posTR: 'kanan atas', posTC: 'tengah atas',
      f4: 'Tajuk bab: {sample}, {size} pt tebal', f5: 'Abstrak: {order}', oThesis: 'bahasa tesis dahulu', oMs: 'Bahasa Melayu dahulu', oEn: 'Bahasa Inggeris dahulu', oEnOnly: 'Bahasa Inggeris sahaja', f6: 'Kapsyen jadual {tp}, rajah {fp}', above: 'di atas', below: 'di bawah', f7: '{refs}: jarak {line}, inden gantung ½ inci',
      keys: { confirm: 'Pengesahan panel', approval: 'Pengesahan', declaration: 'Perakuan', declForm: 'Borang status tesis', permission: 'Kebenaran mengguna', copyright: 'Hak cipta', abstracts: 'Abstrak', ack: 'Penghargaan', toc: 'Isi kandungan', lists: 'Senarai jadual & rajah', loa: 'Senarai singkatan' }
    },
    en: {
      title: 'University Thesis Format', alt: 'Format Tesis Universiti', sub: 'Choose your university, then download the whole thesis as a Word file in that university\'s guideline: title page, declaration, abstracts, contents, lists of tables and figures, page numbering and references.',
      uni: 'University', awam: 'Public universities', swasta: 'Private universities', lain: 'Other', srcLabel: 'Guideline', notes: 'To check', missing: 'No online guideline was found for {u}. Choose "Other university" and enter the settings from your university\'s official template.',
      custom: 'Your university\'s settings', cUniv: 'University name (title page)', cUnivPh: 'e.g. Universiti Sains Islam Malaysia', cMargins: 'Margins (cm): top, bottom, left, right', cFont: 'Font', cSize: 'Font size', cLine: 'Line spacing', cIndent: 'Paragraph indent', iAll: 'Every paragraph', iNotFirst: 'Except the first paragraph after a heading', iNone: 'No indent', cAfter: 'Space after paragraphs (pt)', cPage: 'Page numbers', pBC: 'Bottom centre', pBR: 'Bottom right', pTR: 'Top right', pTC: 'Top centre', cHide: 'Hide the number on the first page of each chapter', cChap: 'Chapter number', nArabic: 'CHAPTER 1', nRoman: 'CHAPTER I', nWord: 'CHAPTER ONE', cLayout: 'Chapter heading', lTwo: 'Two lines (CHAPTER 1 / TITLE)', lOne: 'One line (CHAPTER 1: TITLE)', cAbs: 'Abstracts', aThesis: 'Thesis language first', aMs: 'Malay abstrak first', aEn: 'English abstract first', aEnOnly: 'English abstract only', cStmt: 'Title-page statement (before the degree name)',
      front: 'Title page', kind: 'Type', thesis: 'Thesis (research)', diss: 'Dissertation (mixed mode)', name: 'Student name', sid: 'Student / matric no.', degree: 'Degree', prog: 'Programme / field (optional)', progPh: 'e.g. Art and Design', faculty: 'Faculty / college', facultyPh: 'e.g. College of Creative Arts', month: 'Month & year of submission', supervisor: 'Chairman of the supervisory committee', title2: 'Title in the second language (for the translated abstract)',
      abstract: 'Abstract (English)', abstrak: 'Abstrak (Malay)', abstrakOpt: 'Abstrak (Malay, optional)', keywords: 'Keywords', kataKunci: 'Kata kunci', kwPh: 'four to six terms, comma-separated', words: '{n} words', min: 'minimum {n}', over: 'may run over one page', needMs: 'This university needs the abstract in both languages.',
      ack: 'Acknowledgement', ackHelp: 'One page. Name all supervisors.', abbr: 'List of abbreviations', abbrPh: 'PLS-SEM = Partial Least Squares Structural Equation Modelling', abbrFind: '✨ Find in the thesis', abbrFound: '{n} abbreviations found.', abbrNone: 'No new abbreviations found.',
      profile: "Author's profile (optional)", profilePh: 'Short biography: academic achievements, work experience, list of publications.',
      confirmUitm: 'Include Confirmation by Panel of Examiners (final copy after the viva)', confirmOther: 'Include the approval page (final copy after the viva)', viva: 'Viva date', examiners: 'Panel of examiners (one per line)', examinersPh: 'Prof. Dr. Name (Chairman)\nDr. Name (Internal Examiner)\nProf. Dr. Name (External Examiner)',
      build: '⬇ Download {u}-format thesis (Word)', buildAny: '⬇ Download the thesis (Word)', building: 'Preparing the file…', done: 'Downloaded. Open it in Word and press Yes to update the fields.',
      check: 'Formatting applied', order: 'Order of the preliminary pages', forms: 'Yellow pages in the file mark where a signed official form goes: replace them with the university\'s form.',
      tips: 'Tips', t1: 'A line such as "Table 4.1: Title" or "Figure 2.1: Title" becomes a caption and goes into the list of tables/figures.', t2: 'Tables copied from Survey Analysis (tab-separated lines) become Word tables.', t3: 'The line [Figure: Conceptual Framework] becomes the framework picture.', t4: '[SOURCE NEEDED] markers are highlighted yellow so they are easy to find.', t5: 'When Word asks to update fields, press Yes: the contents and page numbers become exact.',
      disclaimer: 'Formats are taken from the official guidelines published online. Faculties may add requirements; check the latest version with the graduate school.', msNote: 'The Malay title page may be translated from the English template. Check the wording with your faculty.',
      stats: '{c} chapters · {r} references · {t} tables · {f} figures', empty: 'No chapter has text yet. Write the thesis first.',
      f1: '{font} {size} pt, {line} line spacing', iAllS: 'first-line indent', iNotFirstS: 'indent except the first paragraph after a heading', iNoneS: 'no indent', afterS: '{n} pt after paragraphs',
      f2: 'Margins top {t} cm, bottom {b} cm, left {l} cm, right {r} cm', f3: 'Page numbers {pos}: i, ii, iii… for preliminary pages; 1, 2, 3… from Chapter 1', hideS: '; not printed on the first page of a chapter', posBC: 'bottom centre', posBR: 'bottom right', posTR: 'top right', posTC: 'top centre',
      f4: 'Chapter heading: {sample}, {size} pt bold', f5: 'Abstracts: {order}', oThesis: 'thesis language first', oMs: 'Malay first', oEn: 'English first', oEnOnly: 'English only', f6: 'Table captions {tp}, figure captions {fp}', above: 'above', below: 'below', f7: '{refs}: {line} spacing, ½-inch hanging indent',
      keys: { confirm: 'Panel confirmation', approval: 'Approval', declaration: 'Declaration', declForm: 'Thesis status form', permission: 'Permission to use', copyright: 'Copyright', abstracts: 'Abstracts', ack: 'Acknowledgement', toc: 'Contents', lists: 'Lists of tables & figures', loa: 'Abbreviations' }
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
      else if (['value', 'disabled', 'hidden', 'checked', 'rows'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  let busy = false;
  const DEGREES = ['Doctor of Philosophy', 'Master of Science', 'Master of Arts', 'Doctor of Business Administration', 'Master of Education', 'Doktor Falsafah', 'Sarjana Sastera', 'Sarjana Sains'];
  const CUSTOM = { univ: '', top: 2.5, bottom: 2.5, left: 4, right: 2.5, font: 'Times New Roman', size: 12, line: 1.5, indent: 'all', after: 0, pageNum: 'bottom-center', hideChapterFirst: false, chapterNum: 'arabic', chapterLayout: 'two', abstractOrder: 'thesisFirst', statement: '' };

  function data() {
    const s = App.state();
    if (!s.thesisFormat || typeof s.thesisFormat !== 'object') {
      const pr = s.project || {};
      const ui = shell().ui ? shell().ui() : {};
      s.thesisFormat = { kind: 'thesis', name: ui.name || '', studentId: '', degree: /phd|doctor|doktor/i.test(pr.degree || '') ? 'Doctor of Philosophy' : /master|sarjana/i.test(pr.degree || '') ? 'Master of Science' : 'Doctor of Philosophy', programme: '', faculty: '', month: D.monthYear(new Date(), /melayu/i.test(pr.language || '') ? 'ms' : 'en'), abstract: '', abstrak: '', ack: '', abbreviations: '', profile: '', confirm: false, vivaDate: '', examiners: '' };
    }
    const f = s.thesisFormat;
    // Saved before v3.2: UiTM was the only format.
    if (!f.uni) f.uni = 'uitm';
    if (!f.custom || typeof f.custom !== 'object') f.custom = Object.assign({}, CUSTOM);
    for (const k of ['title2', 'keywords', 'kataKunci', 'supervisor']) if (f[k] == null) f[k] = '';
    return f;
  }
  const wordsOf = s => (String(s || '').match(/\S+/g) || []).length;
  const profileOf = f => Pf.resolve(f.uni, f.custom);

  async function download() {
    const f = data(), s = App.state(), p = profileOf(f);
    busy = true; render();
    try {
      const texts = (s.chapters || []).flatMap(c => (c.sections || []).map(x => x.content));
      const figures = window.TalkademicFramework ? await window.TalkademicFramework.docxFigures(texts) : {};
      const out = D.build(s, f, { figures, profile: p });
      const blob = window.ThesTalkDocx.zip(out.files);
      const name = (s.project && s.project.title || 'Tesis').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'Tesis';
      const tag = (p.id === 'custom' ? (String(f.custom.univ || '').trim() || 'Universiti') : p.short).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48);
      const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name + '_' + tag + '.docx' });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      App.toast(t('done'));
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }

  /* The format in words, from the profile itself, so the list always matches the file. */
  function summary(p, ms) {
    const L = ms ? 'ms' : 'en';
    const n = v => String(v);
    const pos = { 'bottom-center': 'posBC', 'bottom-right': 'posBR', 'top-right': 'posTR', 'top-center': 'posTC' }[p.pageNum.pos] || 'posBC';
    const label = ms ? 'BAB' : (p.chapter.label || 'CHAPTER');
    const num = p.chapter.num === 'roman' ? 'I' : p.chapter.num === 'word' ? (ms ? 'SATU' : 'ONE') : '1';
    const title = ms ? 'PENGENALAN' : 'INTRODUCTION';
    const sample = p.chapter.layout === 'one' ? `${label} ${num}: ${title}` : `${label} ${num} / ${title}`;
    const A = p.abstract || {};
    const order = A.enOnly ? 'oEnOnly' : A.order === 'msFirst' ? 'oMs' : A.order === 'enFirst' ? 'oEn' : 'oThesis';
    const refs = (p.labels && p.labels.refs && p.labels.refs[L]) || (ms ? 'RUJUKAN' : 'REFERENCES');
    const ind = { all: 'iAllS', notFirst: 'iNotFirstS', none: 'iNoneS' }[p.indent] || 'iAllS';
    return [
      t('f1', { font: p.font, size: p.size, line: n(p.line) }) + ', ' + t(ind) + (p.after ? ', ' + t('afterS', { n: p.after }) : ''),
      t('f2', { t: n(p.margins.top), b: n(p.margins.bottom), l: n(p.margins.left), r: n(p.margins.right) }),
      t('f3', { pos: t(pos) }) + (p.pageNum.hideChapterFirst ? t('hideS') : ''),
      t('f4', { sample, size: p.chapter.size }),
      t('f5', { order: t(order) }),
      t('f6', { tp: t(p.caption.table.pos), fp: t(p.caption.figure.pos) }),
      t('f7', { refs, line: n(p.refs.line) })
    ];
  }

  function universityCard(f, p) {
    const groups = ['awam', 'swasta', 'lain'].map(sec => h('optgroup', { label: t(sec) }, Pf.PROFILES.filter(x => x.sector === sec).map(x => h('option', { value: x.id, text: x.id === 'custom' ? x.name : x.short + ' · ' + x.name }))));
    const sel = h('select', { id: 'ufUni', onchange: e => { f.uni = e.target.value; App.save(); render(); } }, groups);
    sel.value = f.uni;
    const src = p.source;
    return h('div', { class: 'card ana-form uf-uni' },
      h('label', { class: 'form-field', for: 'ufUni' }, h('span', { text: t('uni') }), sel),
      src ? h('p', { class: 'uf-src' }, h('strong', { text: t('srcLabel') + ': ' }), h('a', { href: src.url, target: '_blank', rel: 'noopener', text: src.title })) : null,
      (p.check || []).length ? h('div', { class: 'uf-notes' }, h('strong', { text: t('notes') }), h('ul', {}, p.check.map(c => h('li', { text: c })))) : null,
      p.id === 'custom' ? customForm(f) : h('p', { class: 'muted small-note', text: t('missing', { u: Pf.NOT_FOUND.join(', ') }) }));
  }

  function customForm(f) {
    const c = f.custom;
    const set = (k, num) => e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; c[k] = num ? Number(v) : v; App.save(); renderSide(); };
    const select = (k, label, opts, num) => { const s = h('select', { onchange: set(k, num) }, opts.map(([v, l]) => h('option', { value: String(v), text: l }))); s.value = String(c[k]); return h('label', { class: 'form-field' }, h('span', { text: label }), s); };
    const numIn = (k, aria, min, max, step) => h('input', { type: 'number', min, max, step: step || 0.1, inputmode: 'decimal', value: c[k], 'aria-label': aria, oninput: set(k, true) });
    return h('div', { class: 'uf-custom' },
      h('h3', { text: t('custom') }),
      h('label', { class: 'form-field' }, h('span', { text: t('cUniv') }), h('input', { type: 'text', value: c.univ, placeholder: t('cUnivPh'), oninput: set('univ') })),
      h('div', { class: 'form-field' }, h('span', { text: t('cMargins') }), h('div', { class: 'uf-margins' }, numIn('top', 'top', 1, 6), numIn('bottom', 'bottom', 1, 6), numIn('left', 'left', 1, 6), numIn('right', 'right', 1, 6))),
      h('div', { class: 'ana-row' },
        select('font', t('cFont'), ['Times New Roman', 'Arial', 'Calibri', 'Tahoma', 'Book Antiqua', 'Century Schoolbook'].map(x => [x, x])),
        select('size', t('cSize'), [10, 11, 12, 13, 14].map(x => [x, x + ' pt']), true)),
      h('div', { class: 'ana-row' },
        select('line', t('cLine'), [[1, '1.0'], [1.15, '1.15'], [1.5, '1.5'], [2, '2.0']], true),
        select('indent', t('cIndent'), [['all', t('iAll')], ['notFirst', t('iNotFirst')], ['none', t('iNone')]])),
      h('div', { class: 'ana-row' },
        h('label', { class: 'form-field' }, h('span', { text: t('cAfter') }), numIn('after', t('cAfter'), 0, 36, 6)),
        select('pageNum', t('cPage'), [['bottom-center', t('pBC')], ['bottom-right', t('pBR')], ['top-right', t('pTR')], ['top-center', t('pTC')]])),
      h('label', { class: 'uf-check' }, h('input', { type: 'checkbox', checked: !!c.hideChapterFirst, onchange: set('hideChapterFirst') }), h('span', { text: t('cHide') })),
      h('div', { class: 'ana-row' },
        select('chapterNum', t('cChap'), [['arabic', t('nArabic')], ['roman', t('nRoman')], ['word', t('nWord')]]),
        select('chapterLayout', t('cLayout'), [['two', t('lTwo')], ['one', t('lOne')]])),
      select('abstractOrder', t('cAbs'), [['thesisFirst', t('aThesis')], ['msFirst', t('aMs')], ['enFirst', t('aEn')], ['enOnly', t('aEnOnly')]]),
      h('label', { class: 'form-field' }, h('span', { text: t('cStmt') }), h('input', { type: 'text', value: c.statement, placeholder: 'A thesis submitted in fulfilment of the requirements for the degree of', oninput: set('statement') })));
  }

  let sideEl = null;
  function renderSide() {
    if (!sideEl) return;
    const f = data(), s = App.state(), p = profileOf(f);
    const ms = /melayu/i.test((s.project || {}).language || '');
    const filled = (s.chapters || []).filter(c => (c.sections || []).some(x => String(x.content || '').trim()));
    const st = D.build(s, f, { profile: p }).stats;
    const keys = (S[lang()] || S.ms).keys;
    const prelims = (p.prelims || []).filter(k => !((k === 'confirm' || k === 'approval') && !f.confirm) && !(k === 'declaration' && p.decl && p.decl.type === 'none'));
    const hasForms = (p.decl && p.decl.type === 'form') || prelims.some(k => ['declForm', 'copyright'].includes(k) || (k === 'permission' && !p.permission) || (k === 'approval'));
    const label = p.id === 'custom' ? '' : p.short;
    fill(sideEl,
      h('div', { class: 'card' },
        h('p', { class: 'sv-chips', text: filled.length ? t('stats', { c: st.chapters, r: st.refs, t: st.tables, f: st.figures }) : t('empty') }),
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: busy || !filled.length, onclick: download, text: busy ? t('building') : label ? t('build', { u: label }) : t('buildAny') })),
        h('h3', { text: t('check') + ' · ' + (label || String(f.custom.univ || '').trim() || t('lain')) }),
        h('ul', { class: 'uf-list' }, summary(p, ms).map(x => h('li', { text: '✓ ' + x }))),
        h('h3', { text: t('order') }),
        h('p', { class: 'uf-order', text: prelims.map(k => keys[k] || k).join(' → ') }),
        hasForms ? h('p', { class: 'result-notes', text: t('forms') }) : null,
        h('h3', { text: t('tips') }),
        h('ul', { class: 'uf-list tips' }, ['t1', 't2', 't3', 't4', 't5'].map(k => h('li', { text: t(k) }))),
        h('p', { class: 'muted small-note', text: t('disclaimer') })));
  }

  function render() {
    const root = $('#view-uitm');
    if (!root) return;
    const f = data(), s = App.state(), p = profileOf(f);
    const ms = /melayu/i.test((s.project || {}).language || '');
    const A = p.abstract || {};
    const save = k => e => { f[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; App.save(); };
    const field = (k, label, props) => h('label', { class: 'form-field' }, h('span', { text: label }), h('input', Object.assign({ type: 'text', value: f[k] || '', oninput: save(k) }, props || {})));
    const area = (k, label, rows, props, extra) => h('label', { class: 'form-field' }, h('span', { text: label }), h('textarea', Object.assign({ rows, value: f[k] || '', oninput: e => { save(k)(e); const c = e.target.parentNode.querySelector('.uf-count'); if (c && extra) c.replaceWith(extra()); } }, props || {})), extra ? extra() : null);
    const phd = /doctor|doktor/i.test(f.degree);
    const counter = k => () => { const n = wordsOf(f[k]), min = phd ? 250 : 200; return h('span', { class: 'uf-count' + (n && n < min ? ' low' : n > 420 ? ' high' : ''), text: t('words', { n }) + ' · ' + t('min', { n: min }) + (n > 420 ? ' · ' + t('over') : '') }); };
    const kind = h('select', { onchange: save('kind'), 'aria-label': t('kind') }, h('option', { value: 'thesis', text: t('thesis') }), h('option', { value: 'dissertation', text: t('diss') }));
    kind.value = f.kind;
    const degree = h('input', { type: 'text', list: 'ufDegrees', value: f.degree, oninput: save('degree') });
    const bothNeeded = !A.enOnly && !(A.msNeedsBoth && !ms);
    const confirmable = (p.prelims || []).includes('confirm') || (p.prelims || []).includes('approval');
    sideEl = h('div', { class: 'uf-side' });
    fill(root,
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'uitmTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'uf-grid' },
        h('div', { class: 'uf-form' },
          universityCard(f, p),
          h('div', { class: 'card ana-form' }, h('h3', { text: t('front') }),
            h('div', { class: 'ana-row' }, h('label', { class: 'form-field' }, h('span', { text: t('kind') }), kind), h('label', { class: 'form-field' }, h('span', { text: t('degree') }), degree, h('datalist', { id: 'ufDegrees' }, DEGREES.map(d => h('option', { value: d }))))),
            h('div', { class: 'ana-row' }, field('name', t('name'), { autocomplete: 'name' }), field('studentId', t('sid'), { inputmode: 'numeric' })),
            h('div', { class: 'ana-row' }, field('programme', t('prog'), { placeholder: t('progPh') }), field('faculty', t('faculty'), { placeholder: t('facultyPh') })),
            h('div', { class: 'ana-row' }, field('month', t('month')), A.upm ? field('supervisor', t('supervisor'), { placeholder: 'Prof. Dr. …' }) : null),
            ms ? h('p', { class: 'muted small-note', text: t('msNote') }) : null),
          h('div', { class: 'card ana-form' },
            area('abstract', t('abstract'), 8, { placeholder: 'This study…' }, counter('abstract')),
            A.keywords ? field('keywords', t('keywords'), { placeholder: t('kwPh') }) : null,
            area('abstrak', bothNeeded ? t('abstrak') : t('abstrakOpt'), 8, { placeholder: 'Kajian ini…' }, counter('abstrak')),
            A.keywords ? field('kataKunci', t('kataKunci'), { placeholder: t('kwPh') }) : null,
            A.withTitle || A.upm ? field('title2', t('title2'), { placeholder: ms ? 'The Role of …' : 'Peranan …' }) : null,
            bothNeeded && (!String(f.abstract).trim() || !String(f.abstrak).trim()) ? h('p', { class: 'result-notes', text: t('needMs') }) : null),
          h('div', { class: 'card ana-form' },
            area('ack', t('ack'), 6), h('p', { class: 'muted small-note', text: t('ackHelp') }),
            area('abbreviations', t('abbr'), 5, { placeholder: t('abbrPh') }),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => {
              const text = (s.chapters || []).flatMap(c => (c.sections || []).map(x => x.content || '')).join('\n');
              const have = new Set(String(f.abbreviations || '').split('\n').map(x => x.split(/\s*[=:]\s*/)[0].trim()).filter(Boolean));
              const found = D.findAbbreviations(text).filter(x => !have.has(x.split(' = ')[0]));
              if (!found.length) { App.toast(t('abbrNone')); return; }
              f.abbreviations = [String(f.abbreviations || '').trim(), ...found].filter(Boolean).join('\n'); App.save(); render(); App.toast(t('abbrFound', { n: found.length }));
            }, text: t('abbrFind') })),
            area('profile', t('profile'), 4, { placeholder: t('profilePh') }),
            confirmable ? h('label', { class: 'uf-check' }, h('input', { type: 'checkbox', checked: !!f.confirm, onchange: e => { save('confirm')(e); render(); } }), h('span', { text: p.confirmPage === 'uitm' ? t('confirmUitm') : t('confirmOther') })) : null,
            confirmable && f.confirm && p.confirmPage === 'uitm' ? h('div', {}, field('vivaDate', t('viva'), { placeholder: '15 June 2027' }), area('examiners', t('examiners'), 3, { placeholder: t('examinersPh') })) : null)),
        sideEl));
    renderSide();
  }

  window.TalkademicThesisFormat = { render, download, summary };
})();
