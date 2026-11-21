/* Talkademic "Format Tesis UiTM": fill in the preliminary pages (title page details, abstract,
   abstrak, acknowledgement, abbreviations, author's profile, optional panel confirmation) and
   download the whole thesis as a Word file in the IPSis 2026 format. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const D = window.TalkademicThesisDocx;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const GUIDE = 'https://ipsis.uitm.edu.my/images/IPSis%20Thesis%20Guideline%202026.pdf';
  const S = {
    ms: {
      title: 'Format Tesis UiTM', alt: 'UiTM Thesis Format', sub: 'Muat turun seluruh tesis sebagai fail Word mengikut Garis Panduan Format Tesis/Disertasi IPSis 2026: halaman tajuk, perakuan, abstrak, isi kandungan, senarai jadual dan rajah, penomboran halaman dan rujukan.',
      front: 'Halaman tajuk', kind: 'Jenis', thesis: 'Tesis (penyelidikan)', diss: 'Disertasi (mod campuran)', name: 'Nama pelajar', sid: 'No. pelajar', degree: 'Ijazah', prog: 'Program / bidang (pilihan)', progPh: 'cth. Art and Design', faculty: 'Fakulti / kolej', facultyPh: 'cth. College of Creative Arts', month: 'Bulan & tahun penyerahan',
      abstract: 'Abstract (English)', abstrak: 'Abstrak (Bahasa Melayu)', words: '{n} perkataan', min: 'minimum {n}', over: 'mungkin melebihi satu halaman', needMs: 'Tesis Bahasa Melayu perlu abstrak dalam kedua-dua bahasa.',
      ack: 'Penghargaan', ackHelp: 'Satu halaman. Namakan semua penyelia.', abbr: 'Senarai singkatan', abbrPh: 'PLS-SEM = Partial Least Squares Structural Equation Modelling', abbrFind: '✨ Cari dalam tesis', abbrFound: '{n} singkatan dijumpai.', abbrNone: 'Tiada singkatan baharu dijumpai.',
      profile: 'Profil pengarang (pilihan)', profilePh: 'Biodata ringkas: pencapaian akademik, pengalaman kerja, senarai penerbitan.',
      confirm: 'Sertakan Pengesahan Panel Pemeriksa (naskhah akhir selepas viva)', viva: 'Tarikh viva', examiners: 'Panel pemeriksa (satu baris setiap orang)', examinersPh: 'Prof. Dr. Nama (Chairman)\nDr. Nama (Internal Examiner)\nProf. Dr. Nama (External Examiner)',
      build: '⬇ Muat turun tesis format UiTM (Word)', building: 'Menyediakan fail…', done: 'Fail dimuat turun. Buka dalam Word dan tekan Ya untuk mengemas kini medan.',
      check: 'Format yang digunakan', c1: 'Times New Roman 12 pt, jarak baris 1.5, justified, inden baris pertama', c2: 'Margin kiri 3.8 cm; atas, kanan, bawah 2.5 cm', c3: 'Nombor halaman di tengah bawah: i, ii, iii… untuk halaman awal; 1, 2, 3… dari Bab 1', c4: 'BAB/CHAPTER n dan tajuk bab di tengah, 14 pt tebal; subtajuk 1.1 dan 1.1.1 tebal', c5: 'Kapsyen jadual di atas, rajah di bawah, dinomborkan ikut bab; garisan jadual tanpa sempadan sisi', c6: 'RUJUKAN/REFERENCES 14 pt tebal, inden gantung ½ inci',
      tips: 'Petua', t1: 'Baris berlabel "Table 4.1: Tajuk" atau "Rajah 2.1: Tajuk" menjadi kapsyen dan masuk ke senarai jadual/rajah.', t2: 'Jadual yang disalin dari Analisis Soal Selidik (baris dipisah tab) menjadi jadual Word.', t3: 'Baris [Rajah: Kerangka Konseptual] menjadi gambar kerangka.', t4: 'Tanda [PERLU RUJUKAN] diserlahkan kuning supaya mudah dicari.', t5: 'Bila Word bertanya untuk mengemas kini medan, tekan Ya: Isi Kandungan dan nombor halaman akan tepat.',
      source: 'Sumber: Garis Panduan Format Tesis/Disertasi IPSis UiTM 2026. Semak keperluan fakulti anda dan versi terkini.', msNote: 'Halaman tajuk dan perakuan versi Bahasa Melayu diterjemah daripada templat Inggeris IPSis. Semak susunan kata dengan fakulti.',
      stats: '{c} bab · {r} rujukan · {t} jadual · {f} rajah', empty: 'Tiada bab berisi lagi. Tulis tesis dahulu.'
    },
    en: {
      title: 'UiTM Thesis Format', alt: 'Format Tesis UiTM', sub: 'Download the whole thesis as a Word file in the IPSis 2026 Guidelines on Thesis/Dissertation Format: title page, declaration, abstract, contents, lists of tables and figures, page numbering and references.',
      front: 'Title page', kind: 'Type', thesis: 'Thesis (research)', diss: 'Dissertation (mixed mode)', name: 'Student name', sid: 'Student I.D. No.', degree: 'Degree', prog: 'Programme / field (optional)', progPh: 'e.g. Art and Design', faculty: 'Faculty / college', facultyPh: 'e.g. College of Creative Arts', month: 'Month & year of submission',
      abstract: 'Abstract (English)', abstrak: 'Abstrak (Malay)', words: '{n} words', min: 'minimum {n}', over: 'may run over one page', needMs: 'A Malay thesis needs the abstract in both languages.',
      ack: 'Acknowledgement', ackHelp: 'One page. Name all supervisors.', abbr: 'List of abbreviations', abbrPh: 'PLS-SEM = Partial Least Squares Structural Equation Modelling', abbrFind: '✨ Find in the thesis', abbrFound: '{n} abbreviations found.', abbrNone: 'No new abbreviations found.',
      profile: "Author's profile (optional)", profilePh: 'Short biography: academic achievements, work experience, list of publications.',
      confirm: 'Include Confirmation by Panel of Examiners (final copy after the viva)', viva: 'Viva date', examiners: 'Panel of examiners (one per line)', examinersPh: 'Prof. Dr. Name (Chairman)\nDr. Name (Internal Examiner)\nProf. Dr. Name (External Examiner)',
      build: '⬇ Download UiTM-format thesis (Word)', building: 'Preparing the file…', done: 'Downloaded. Open it in Word and press Yes to update the fields.',
      check: 'Formatting applied', c1: 'Times New Roman 12 pt, 1.5 line spacing, justified, first-line indent', c2: 'Left margin 3.8 cm; top, right, bottom 2.5 cm', c3: 'Page numbers centred at the bottom: i, ii, iii… for preliminary pages; 1, 2, 3… from Chapter 1', c4: 'CHAPTER n and the chapter title centred, 14 pt bold; headings 1.1 and 1.1.1 bold', c5: 'Table captions above, figure captions below, numbered by chapter; table lines without side borders', c6: 'REFERENCES 14 pt bold, ½-inch hanging indent',
      tips: 'Tips', t1: 'A line such as "Table 4.1: Title" or "Figure 2.1: Title" becomes a caption and goes into the list of tables/figures.', t2: 'Tables copied from Survey Analysis (tab-separated lines) become Word tables.', t3: 'The line [Figure: Conceptual Framework] becomes the framework picture.', t4: '[SOURCE NEEDED] markers are highlighted yellow so they are easy to find.', t5: 'When Word asks to update fields, press Yes: the contents and page numbers become exact.',
      source: 'Source: UiTM IPSis Guidelines on Thesis/Dissertation Format 2026. Check your faculty\'s requirements and the latest version.', msNote: 'The Malay title page and declaration are translated from the IPSis English template. Check the wording with your faculty.',
      stats: '{c} chapters · {r} references · {t} tables · {f} figures', empty: 'No chapter has text yet. Write the thesis first.'
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
  const DEGREES = ['Doctor of Philosophy', 'Master of Science', 'Master of Arts', 'Doctor of Business Administration', 'Master of Education'];

  function data() {
    const s = App.state();
    if (!s.thesisFormat || typeof s.thesisFormat !== 'object') {
      const pr = s.project || {};
      const ui = shell().ui ? shell().ui() : {};
      s.thesisFormat = { kind: 'thesis', name: ui.name || '', studentId: '', degree: /phd|doctor|doktor/i.test(pr.degree || '') ? 'Doctor of Philosophy' : /master|sarjana/i.test(pr.degree || '') ? 'Master of Science' : 'Doctor of Philosophy', programme: '', faculty: '', month: D.monthYear(new Date(), /melayu/i.test(pr.language || '') ? 'ms' : 'en'), abstract: '', abstrak: '', ack: '', abbreviations: '', profile: '', confirm: false, vivaDate: '', examiners: '' };
    }
    return s.thesisFormat;
  }
  const wordsOf = s => (String(s || '').match(/\S+/g) || []).length;

  async function download() {
    const f = data(), s = App.state();
    busy = true; render();
    try {
      const texts = (s.chapters || []).flatMap(c => (c.sections || []).map(x => x.content));
      const figures = window.TalkademicFramework ? await window.TalkademicFramework.docxFigures(texts) : {};
      const out = D.build(s, f, { figures });
      const blob = window.ThesTalkDocx.zip(out.files);
      const name = (s.project && s.project.title || 'Tesis').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'Tesis';
      const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name + '_UiTM.docx' });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      App.toast(t('done'));
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = false; render(); }
  }

  function render() {
    const root = $('#view-uitm');
    if (!root) return;
    const f = data(), s = App.state();
    const ms = /melayu/i.test((s.project || {}).language || '');
    const save = k => e => { f[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; App.save(); };
    const field = (k, label, props) => h('label', { class: 'form-field' }, h('span', { text: label }), h('input', Object.assign({ type: 'text', value: f[k] || '', oninput: save(k) }, props || {})));
    const area = (k, label, rows, props, extra) => h('label', { class: 'form-field' }, h('span', { text: label }), h('textarea', Object.assign({ rows, value: f[k] || '', oninput: e => { save(k)(e); const c = e.target.parentNode.querySelector('.uf-count'); if (c && extra) c.replaceWith(extra()); } }, props || {})), extra ? extra() : null);
    const phd = /doctor/i.test(f.degree);
    const counter = k => () => { const n = wordsOf(f[k]), min = phd ? 250 : 200; return h('span', { class: 'uf-count' + (n && n < min ? ' low' : n > 420 ? ' high' : ''), text: t('words', { n }) + ' · ' + t('min', { n: min }) + (n > 420 ? ' · ' + t('over') : '') }); };
    const kind = h('select', { onchange: save('kind'), 'aria-label': t('kind') }, h('option', { value: 'thesis', text: t('thesis') }), h('option', { value: 'dissertation', text: t('diss') }));
    kind.value = f.kind;
    const degree = h('input', { type: 'text', list: 'ufDegrees', value: f.degree, oninput: save('degree') });
    const filled = (s.chapters || []).filter(c => (c.sections || []).some(x => String(x.content || '').trim()));
    const st = D.build(s, f, {}).stats;
    fill(root,
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'uitmTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'uf-grid' },
        h('div', { class: 'uf-form' },
          h('div', { class: 'card ana-form' }, h('h3', { text: t('front') }),
            h('div', { class: 'ana-row' }, h('label', { class: 'form-field' }, h('span', { text: t('kind') }), kind), h('label', { class: 'form-field' }, h('span', { text: t('degree') }), degree, h('datalist', { id: 'ufDegrees' }, DEGREES.map(d => h('option', { value: d }))))),
            h('div', { class: 'ana-row' }, field('name', t('name'), { autocomplete: 'name' }), field('studentId', t('sid'), { inputmode: 'numeric' })),
            h('div', { class: 'ana-row' }, field('programme', t('prog'), { placeholder: t('progPh') }), field('faculty', t('faculty'), { placeholder: t('facultyPh') })),
            field('month', t('month')),
            ms ? h('p', { class: 'muted small-note', text: t('msNote') }) : null),
          h('div', { class: 'card ana-form' },
            area('abstract', t('abstract'), 8, { placeholder: 'This study…' }, counter('abstract')),
            area('abstrak', t('abstrak'), 8, { placeholder: 'Kajian ini…' }, counter('abstrak')),
            ms && (!String(f.abstract).trim() || !String(f.abstrak).trim()) ? h('p', { class: 'result-notes', text: t('needMs') }) : null),
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
            h('label', { class: 'uf-check' }, h('input', { type: 'checkbox', checked: !!f.confirm, onchange: e => { save('confirm')(e); render(); } }), h('span', { text: t('confirm') })),
            f.confirm ? h('div', {}, field('vivaDate', t('viva'), { placeholder: '15 June 2027' }), area('examiners', t('examiners'), 3, { placeholder: t('examinersPh') })) : null)),
        h('div', { class: 'uf-side' },
          h('div', { class: 'card' },
            h('p', { class: 'sv-chips', text: filled.length ? t('stats', { c: st.chapters, r: st.refs, t: st.tables, f: st.figures }) : t('empty') }),
            h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: busy || !filled.length, onclick: download, text: busy ? t('building') : t('build') })),
            h('h3', { text: t('check') }),
            h('ul', { class: 'uf-list' }, ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(k => h('li', { text: '✓ ' + t(k) }))),
            h('h3', { text: t('tips') }),
            h('ul', { class: 'uf-list tips' }, ['t1', 't2', 't3', 't4', 't5'].map(k => h('li', { text: t(k) }))),
            h('p', { class: 'muted small-note' }, t('source'), ' ', h('a', { href: GUIDE, target: '_blank', rel: 'noopener', text: 'PDF' }))))));
  }

  window.TalkademicThesisFormat = { render, download };
})();
