/* Talkademic thesis formats of Malaysian universities, each taken from the university's own
   published guideline (link and edition kept with the profile). Where a guideline is silent or
   contradicts itself, the profile uses the common practice and says so in `check`, so the student
   knows what to confirm with the graduate school. Universities without an online guideline use
   the "custom" profile, where every setting can be changed.

   Units: margins in cm; line = line-spacing multiple; after = space after paragraphs in points;
   indent: 'all' | 'notFirst' (no indent for the first paragraph after a heading) | 'none'.
   Title-page lines: t = text with {TOKENS}, sz = font size, caps, b = bold, gap = share of the
   free page height placed above the line. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicThesisProfiles = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BASE = {
    margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 },
    font: 'Times New Roman', size: 12, line: 1.5, after: 0, indent: 'all', indentCm: 1.27, align: 'both',
    pageNum: { pos: 'bottom-center', size: 12, hideChapterFirst: false },
    chapter: { label: 'CHAPTER', num: 'arabic', layout: 'two', size: 14, gapBefore: 0 },
    h2: { caps: false }, abstract: { order: 'thesisFirst', line: 1, withTitle: false, keywords: false, indent: false },
    refs: { align: 'center', line: 1, after: 12 },
    caption: { table: { pos: 'above', align: 'left' }, figure: { pos: 'below', align: 'center' } },
    lists: { lofFirst: false },
    labels: {}, decl: { type: 'text' }, prelims: ['declaration', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
    confirmPage: null
  };
  const P = (o) => {
    const p = JSON.parse(JSON.stringify(BASE));
    for (const [k, v] of Object.entries(o)) p[k] = v && typeof v === 'object' && !Array.isArray(v) && p[k] && typeof p[k] === 'object' && !Array.isArray(p[k]) ? Object.assign(p[k], v) : v;
    return p;
  };
  const caps = (t, sz, gap, b) => ({ t, sz, gap: gap || 0, caps: true, b: b !== false });
  const line = (t, sz, gap, b) => ({ t, sz, gap: gap || 0, b: b !== false });

  const PROFILES = [
    P({
      id: 'uitm', short: 'UiTM', name: 'Universiti Teknologi MARA', sector: 'awam', univ: 'UNIVERSITI TEKNOLOGI MARA',
      source: { title: 'Guidelines on Thesis/Dissertation Format 2026, IPSis', url: 'https://ipsis.uitm.edu.my/images/IPSis%20Thesis%20Guideline%202026.pdf', year: 2026 },
      margins: { top: 2.5, bottom: 2.5, left: 3.8, right: 2.5 },
      refs: { align: 'left', line: 1.5, after: 0 },
      prelims: ['confirm', 'declaration', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
      abstract: { order: 'thesisFirst', line: 1, msNeedsBoth: true },
      decl: { type: 'uitm' }, confirmPage: 'uitm',
      title: [caps('{UNIV}', 18), caps('{TITLE}', 18, 3), caps('{NAME}', 14, 3), line('{STATEMENT}', 14, 3), line('{DEGREE}', 14, 0.4), line('{PROGRAMME_PAREN}', 14), line('{FACULTY}', 14, 2), line('{MONTHYEAR}', 14, 1.2)],
      statement: { thesis: 'Thesis submitted in fulfilment\nof the requirements for the degree of', diss: 'Dissertation submitted in partial fulfilment\nof the requirements for the degree of' },
      statementMs: { thesis: 'Tesis dikemukakan bagi memenuhi\nsyarat untuk ijazah', diss: 'Disertasi dikemukakan bagi memenuhi\nsebahagian syarat untuk ijazah' },
      check: ['Halaman tajuk dan perakuan versi BM diterjemah daripada templat Inggeris IPSis.']
    }),
    P({
      id: 'um', short: 'UM', name: 'Universiti Malaya', sector: 'awam', univ: 'UNIVERSITI MALAYA',
      source: { title: 'Guidelines for the Preparation of Research Report, Dissertation and Thesis (2021)', url: 'https://engine.um.edu.my/PG/2023/Guidelines%20For%20The%20Preparation%20of%20Research%20Report,%20Dissertation%20and%20Thesis.pdf', year: 2021 },
      margins: { top: 2, bottom: 2, left: 4, right: 2 }, line: 2,
      pageNum: { pos: 'bottom-right', size: 10, dist: 1.0 },
      chapter: { layout: 'one', size: 12 },
      abstract: { order: 'thesisFirst', line: 2, withTitle: true, keywords: 5 },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'center' } },
      lists: { lofFirst: true },
      labels: { decl: { en: 'ORIGINAL LITERARY WORK DECLARATION', ms: 'PERAKUAN KEASLIAN PENULISAN' } },
      decl: { type: 'form', note: 'Borang Original Literary Work Declaration (MAYA) yang ditandatangani pelajar dan saksi.' },
      prelims: ['declaration', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 12, 0), caps('{NAME}', 12, 3), caps('{STATEMENT} {DEGREE}', 12, 3), caps('{FACULTY}', 12, 3), caps('{UNIV}', 12, 0.3), caps('KUALA LUMPUR', 12), caps('{YEAR}', 12, 1)],
      titleLine: 1.15,
      statement: { thesis: 'THESIS SUBMITTED IN FULFILMENT OF THE REQUIREMENTS FOR THE DEGREE OF', diss: 'DISSERTATION SUBMITTED IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE DEGREE OF' },
      check: ['Jarak perenggan (inden) tidak dinyatakan dalam garis panduan.', 'Fakulti mungkin ada keperluan tambahan.']
    }),
    P({
      id: 'ukm', short: 'UKM', name: 'Universiti Kebangsaan Malaysia', sector: 'awam', univ: 'UNIVERSITI KEBANGSAAN MALAYSIA',
      source: { title: 'Panduan Penulisan Tesis Gaya UKM (2015)', url: 'https://www.ukm.my/spsfper/wp-content/uploads/2023/02/2015-GayaUKM-BI-Final.pdf', year: 2015 },
      margins: { top: 3, bottom: 2.5, left: 3.8, right: 2.5 }, line: 1.5, indent: 'notFirst',
      pageNum: { pos: 'top-right', hideChapterFirst: true },
      chapter: { num: 'roman', layout: 'two', size: 12, gapBefore: 2 },
      abstract: { order: 'thesisFirst', line: 1 },
      refs: { align: 'center', line: 1, after: 12 },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' } },
      decl: { type: 'text', text: { en: 'I hereby declare that the work in this thesis is my own except for quotations and summaries which have been duly acknowledged.', ms: 'Saya akui karya ini adalah hasil kerja saya sendiri kecuali nukilan dan ringkasan yang tiap-tiap satunya telah saya jelaskan sumbernya.' } },
      prelims: ['declaration', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 12, 1.5), caps('{NAME}', 12, 3), caps('{STATEMENT} {DEGREE}', 12, 3), caps('{FACULTY}', 12, 3), caps('{UNIV}', 12, 0.3), caps('{CITY}', 12), caps('{YEAR}', 12, 1.5)],
      city: 'BANGI',
      statement: { thesis: 'THESIS SUBMITTED IN FULFILMENT FOR THE DEGREE OF', diss: 'THESIS SUBMITTED IN PARTIAL FULFILMENT FOR THE DEGREE OF' },
      statementMs: { thesis: 'TESIS YANG DIKEMUKAKAN UNTUK MEMPEROLEH IJAZAH', diss: 'TESIS YANG DIKEMUKAKAN UNTUK MEMENUHI SEBAHAGIAN SYARAT MEMPEROLEH IJAZAH' },
      check: ['Tesis Bahasa Inggeris juga perlu halaman tajuk Bahasa Melayu.', 'Tajuk dan subtajuk 11 pt dalam garis panduan; di sini 12 pt tebal.']
    }),
    P({
      id: 'usm', short: 'USM', name: 'Universiti Sains Malaysia', sector: 'awam', univ: 'UNIVERSITI SAINS MALAYSIA',
      source: { title: 'Format Thesis Guidelines, IPS USM (2019)', url: 'https://ips.usm.my/images/downloadIPS/viva/viva_exam/FormatThesisGuidelines_210219.pdf', year: 2019 },
      margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 }, line: 2,
      pageNum: { pos: 'bottom-center', dist: 1.0 },
      abstract: { order: 'msFirst', line: 2, withTitle: true, indent: true },
      refs: { align: 'center', line: 1, after: 12 },
      decl: { type: 'none' },
      prelims: ['ack', 'toc', 'lists', 'loa', 'abstracts'],
      title: [caps('{TITLE}', 14, 1), line('by', 12, 2, false), caps('{NAME}', 14, 0.3), line('{STATEMENT} {DEGREE}', 12, 3, false), line('{MONTHYEAR}', 12, 2, false)],
      statement: { thesis: 'Thesis submitted in fulfilment of the requirements for the degree of', diss: 'Dissertation submitted in partial fulfilment of the requirements for the degree of' },
      check: ['Borang pengakuan keaslian diserahkan berasingan; tidak dimasukkan dalam halaman awal.', 'Garis panduan tidak menetapkan label "CHAPTER 1"; di sini guna CHAPTER 1 dan tajuk.']
    }),
    P({
      id: 'upm', short: 'UPM', name: 'Universiti Putra Malaysia', sector: 'awam', univ: 'UNIVERSITI PUTRA MALAYSIA',
      source: { title: 'Guide to Thesis Preparation, SGS UPM (2013)', url: 'https://www.slideshare.net/slideshow/guide-to-thesis-preparation-ver-2013/36135641', year: 2013 },
      margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 }, line: 2,
      abstract: { order: 'thesisFirst', line: 2, upm: true },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'left' }, figure: { pos: 'below', align: 'left' } },
      decl: { type: 'form', note: 'Borang Declaration by Graduate Student (UPM) yang ditandatangani.' },
      prelims: ['abstracts', 'ack', 'approval', 'declaration', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 12, 2), line('By', 12, 3, false), caps('{NAME}', 12, 0.4), line('{STATEMENT} {DEGREE}', 12, 4, false), line('{MONTHYEAR}', 12, 3, false)],
      statement: { thesis: 'Thesis Submitted to the School of Graduate Studies, Universiti Putra Malaysia, in Fulfilment of the Requirements for the Degree of', diss: 'Thesis Submitted to the School of Graduate Studies, Universiti Putra Malaysia, in Partial Fulfilment of the Requirements for the Degree of' },
      check: ['Panduan dalam talian ialah edisi 2013 (salinan SlideShare); semak versi terkini di SGS UPM.', 'Logo UPM perlu ditambah sendiri pada halaman tajuk.', 'Biodata pelajar dan senarai penerbitan wajib di bahagian akhir.']
    }),
    P({
      id: 'utm', short: 'UTM', name: 'Universiti Teknologi Malaysia', sector: 'awam', univ: 'UNIVERSITI TEKNOLOGI MALAYSIA',
      source: { title: 'Thesis Writing Guidelines 2023, SPS UTM', url: 'https://sps.utm.my/wp-content/uploads/2023/11/Thesis-Guideline-18.10.2023-1.pdf', year: 2023 },
      margins: { top: 2.5, bottom: 2.5, left: 3.25, right: 3.25 }, line: 1.5, after: 18,
      pageNum: { pos: 'bottom-center', dist: 1.25 },
      abstract: { order: 'thesisFirst', line: 1, indent: true },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'center' } },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' } },
      prelims: ['declaration', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 14, 1.5), caps('{NAME}', 12, 3), line('{STATEMENT}', 12, 3, false), line('{DEGREE}', 12, 0.3), line('{FACULTY}', 12, 2, false), line('{UNIV}', 12, 0.3, false), line('{MONTHYEAR}', 12, 2, false)],
      statement: { thesis: 'A thesis submitted in fulfilment of the\nrequirements for the award of the degree of', diss: 'A dissertation submitted in partial fulfilment of the\nrequirements for the award of the degree of' },
      check: ['Borang status tesis, pengakuan penyelia dan pengesahan peperiksaan diletakkan sebelum halaman tajuk; masukkan borang rasmi.', 'Naskhah akhir berjilid menggunakan kertas B5.']
    }),
    P({
      id: 'uthm', short: 'UTHM', name: 'Universiti Tun Hussein Onn Malaysia', sector: 'awam', univ: 'UNIVERSITI TUN HUSSEIN ONN MALAYSIA',
      source: { title: 'Postgraduate Thesis Writing Guide, 1st ed. (2025), CGS UTHM', url: 'https://cgs.uthm.edu.my/images/references/1st%20POSTGRADUATE%20THESIS%20WRITING%20GUIDE_JANUARY%202025.pdf', year: 2025 },
      margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 }, line: 1.5, indent: 'notFirst',
      abstract: { order: 'enFirst', line: 1 },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'left' }, figure: { pos: 'below', align: 'left' } },
      labels: { decl: { en: "STUDENT'S DECLARATION", ms: 'PENGAKUAN PELAJAR' } },
      prelims: ['declaration', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 14, 1.5), caps('{NAME}', 12, 3), line('{STATEMENT} {DEGREE}', 12, 3, false), line('{FACULTY}', 12, 3, false), line('{UNIV}', 12, 0.3, false), line('{MONTHYEAR}', 12, 2, false)],
      statement: { thesis: 'A thesis submitted in fulfilment of the requirement for the award of the', diss: 'A dissertation submitted in partial fulfilment of the requirement for the award of the' },
      check: ['Ayat penyataan halaman tajuk tidak tertera dalam bahagian panduan yang dibaca; semak Lampiran.', 'Pengakuan pelajar ditandatangani pelajar dan semua penyelia.']
    }),
    P({
      id: 'ums', short: 'UMS', name: 'Universiti Malaysia Sabah', sector: 'awam', univ: 'UNIVERSITI MALAYSIA SABAH',
      source: { title: 'UMS Thesis/Dissertation Submission and Writing Guidelines (2020)', url: 'https://www.ums.edu.my/pascav2/files/2020_UMS_Thesis_Dissertation_Submission_And_Writing_Guidelines.pdf', year: 2020 },
      margins: { top: 2.8, bottom: 2.8, left: 3.8, right: 2.8 }, font: 'Tahoma', size: 11, line: 1.5, indent: 'notFirst',
      pageNum: { pos: 'bottom-center', size: 11, hideChapterFirst: true },
      chapter: { size: 14 },
      abstract: { order: 'thesisFirst', line: 1, withTitle: true },
      refs: { align: 'center', line: 1, after: 11 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'left' } },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' } },
      decl: { type: 'text', text: { en: 'I hereby acknowledge that I have stated the source of each extract, summary and reference in this study.', ms: 'Saya akui bahawa saya telah menyatakan sumber bagi setiap petikan, ringkasan dan rujukan dalam kajian ini.' } },
      prelims: ['declaration', 'approval', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 18, 1), caps('{NAME}', 18, 3), caps('{STATEMENT} {DEGREE}', 18, 3), caps('{FACULTY}', 18, 3), caps('{UNIV}', 18, 0.2), caps('{YEAR}', 18, 0.2)],
      statement: { thesis: 'THESIS SUBMITTED IN FULFILMENT OF THE REQUIREMENTS FOR THE DEGREE OF', diss: 'DISSERTATION SUBMITTED IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE DEGREE OF' },
      check: ['Muka pertama setiap bab ada margin atas 28 mm dan bawah 38 mm.']
    }),
    P({
      id: 'upsi', short: 'UPSI', name: 'Universiti Pendidikan Sultan Idris', sector: 'awam', univ: 'UNIVERSITI PENDIDIKAN SULTAN IDRIS',
      source: { title: 'Guidelines to Writing Thesis/Dissertation (2023, updated 2024), IGS UPSI', url: 'https://postgrad.upsi.edu.my/thesis/1-1_ThesisEng.pdf', year: 2024 },
      margins: { top: 2.54, bottom: 2.54, left: 3.81, right: 2.54 }, line: 2,
      pageNum: { pos: 'top-right', hideChapterFirst: true },
      abstract: { order: 'msFirst', line: 1, withTitle: true },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'left' }, figure: { pos: 'above', align: 'left' } },
      labels: { decl: { en: 'DECLARATION OF ORIGINAL WORK', ms: 'PERAKUAN KEASLIAN PENULISAN' }, ack: { en: 'APPRECIATION', ms: 'PENGHARGAAN' }, refs: { en: 'REFERENCE', ms: 'RUJUKAN' } },
      decl: { type: 'form', note: 'Borang Declaration of Original Work dan Declaration of Thesis/Dissertation (e-Form IGS UPSI).' },
      prelims: ['declaration', 'declForm', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 12, 1), caps('{NAME}', 12, 3), caps('{STATEMENT}', 12, 3), caps('{FACULTY}', 12, 3), caps('{UNIV}', 12, 0.3), caps('{YEAR}', 12, 1)],
      statement: { thesis: 'THESIS PRESENTED TO QUALIFY FOR A {DEGREE}', diss: 'DISSERTATION PRESENTED TO QUALIFY FOR A {DEGREE}' },
      statementMs: { thesis: 'TESIS DIKEMUKAKAN BAGI MEMENUHI SYARAT UNTUK MEMPEROLEH IJAZAH {DEGREE}', diss: 'DISERTASI DIKEMUKAKAN BAGI MEMENUHI SYARAT UNTUK MEMPEROLEH IJAZAH {DEGREE}' },
      titleMargins: { top: 5.969, bottom: 5.969 },
      check: ['Penomboran bab bermula di muka kedua Bab 1 (muka pertama bab dikira tetapi tidak dicetak).']
    }),
    P({
      id: 'unimas', short: 'UNIMAS', name: 'Universiti Malaysia Sarawak', sector: 'awam', univ: 'UNIVERSITI MALAYSIA SARAWAK',
      source: { title: 'Thesis Format, Centre for Graduate Studies UNIMAS', url: 'https://ir.unimas.my/id/eprint/19731/1/Thesis_Format_new.pdf', year: 2016 },
      margins: { top: 3, bottom: 3, left: 2.5, right: 2.5 }, line: 2,
      abstract: { order: 'thesisFirst', line: 2, withTitle: true },
      refs: { align: 'center', line: 2, after: 0 },
      labels: { refs: { en: 'BIBLIOGRAPHY', ms: 'BIBLIOGRAFI' } },
      prelims: ['declaration', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [line('{TITLE}', 14, 1.5), line('{NAME}', 12, 3, false), line('A thesis submitted', 12, 3, false), line('{STATEMENT} {DEGREE}', 12, 0.2, false), line('{FACULTY}', 12, 3, false), caps('{UNIV}', 12, 0.3), line('{YEAR}', 12, 1.5, false)],
      statement: { thesis: 'In fulfillment of the requirements for the degree of', diss: 'In partial fulfillment of the requirements for the degree of' },
      check: ['Margin kiri dan kanan 2.5 cm mengikut panduan ini; semak templat Word terkini dari CGS.', 'Abstrak terjemahan ditulis condong (italic).']
    }),
    P({
      id: 'unimap', short: 'UniMAP', name: 'Universiti Malaysia Perlis', sector: 'awam', univ: 'UNIVERSITI MALAYSIA PERLIS',
      source: { title: 'UniMAP Thesis Guidelines 2024, Centre for Graduate Studies', url: 'https://cgs.unimap.edu.my/v2/GUIDELINES%20PREPARATION/Thesis%20Guidelines%202024.pdf', year: 2024 },
      margins: { top: 2.5, bottom: 2.5, left: 3.5, right: 2.5 }, line: 2,
      pageNum: { pos: 'bottom-center', dist: 1.25 },
      chapter: { layout: 'one', size: 12 },
      abstract: { order: 'msFirst', line: 1, withTitle: true },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'center' } },
      labels: { decl: { en: 'DECLARATION OF THESIS', ms: 'PERAKUAN TESIS' } },
      decl: { type: 'form', note: 'Borang Declaration of Thesis (Lampiran G) dengan klasifikasi sulit/terhad/akses terbuka.' },
      prelims: ['declaration', 'permission', 'ack', 'toc', 'lists', 'loa', 'abstracts'],
      title: [caps('{TITLE}', 18, 1), caps('{NAME}', 12, 3), line('({MATRIC})', 12, 0, false), line('{STATEMENT} {DEGREE}', 12, 3, false), line('{FACULTY}', 12, 3, false), caps('{UNIV}', 12, 0.3), line('{YEAR}', 12, 1.5, false)],
      statement: { thesis: 'A thesis submitted in fulfilment of the requirements for the degree of', diss: 'A dissertation submitted in partial fulfilment of the requirements for the degree of' },
      check: ['Abstrak (BM kemudian BI) diletakkan sejurus sebelum Bab 1.']
    }),
    P({
      id: 'iium', short: 'UIAM / IIUM', name: 'Universiti Islam Antarabangsa Malaysia', sector: 'awam', univ: 'INTERNATIONAL ISLAMIC UNIVERSITY MALAYSIA',
      source: { title: 'Guidelines for Thesis Format (TNR), CPS IIUM (2024)', url: 'https://centre.iium.edu.my/cps/wp-content/uploads/sites/2/2024/05/GUIDELINES-FOR-THESIS-FORMAT-TNR.pdf', year: 2024 },
      margins: { top: 2.5, bottom: 2.5, left: 3.8, right: 2.5 }, line: 1.5, indent: 'notFirst',
      pageNum: { pos: 'bottom-center', dist: 1.3 },
      chapter: { num: 'word', layout: 'two', size: 14 },
      h2: { caps: true },
      abstract: { order: 'enFirst', line: 1, arabic: true },
      refs: { align: 'center', line: 1.5, after: 12 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'above', align: 'center' } },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' }, ack: { en: 'ACKNOWLEDGEMENTS', ms: 'PENGHARGAAN' } },
      decl: { type: 'text', text: { en: 'I hereby declare that this thesis is the result of my own investigations, except where otherwise stated. I also declare that it has not been previously or concurrently submitted as a whole for any other degrees at IIUM or other institutions.', ms: 'Saya mengaku bahawa tesis ini adalah hasil penyelidikan saya sendiri kecuali yang dinyatakan sumbernya. Saya juga mengaku bahawa tesis ini tidak pernah dikemukakan untuk sebarang ijazah lain di UIAM atau institusi lain.' } },
      prelims: ['abstracts', 'approval', 'declaration', 'copyright', 'ack', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 17, 1), caps('BY', 17, 2), caps('{NAME}', 17, 0.5), line('{STATEMENT} {DEGREE}', 12, 3, false), caps('{FACULTY}', 17, 3), caps('{UNIV}', 17, 0.5), caps('{MONTHYEAR}', 17, 2)],
      statement: { thesis: 'A thesis submitted in fulfilment of the requirement for the degree of', diss: 'A dissertation submitted in fulfilment of the requirement for the degree of' },
      check: ['Abstrak Bahasa Arab (ملخص البحث) wajib; app hanya sediakan halamannya.', 'Contoh panduan tidak konsisten: "CHAPTER ONE" dua baris vs "CHAPTER ONE: INTRODUCTION".']
    }),
    P({
      id: 'uum', short: 'UUM', name: 'Universiti Utara Malaysia', sector: 'awam', univ: 'UNIVERSITI UTARA MALAYSIA',
      source: { title: 'Thesis Guideline (Aug 2021), UUM College of Business, dan templat tesis UUM', url: 'http://cob.uum.edu.my/images/PG_Unit_COB/Thesis_Guideline/Thesis_Guideline_Aug2021.pdf', year: 2021 },
      margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 }, line: 2,
      chapter: { num: 'word', layout: 'two', size: 12 },
      abstract: { order: 'msFirst', line: 1 },
      refs: { align: 'center', line: 1, after: 12 },
      labels: { decl: { en: 'PERAKUAN KERJA TESIS / DISERTASI', ms: 'PERAKUAN KERJA TESIS / DISERTASI' } },
      decl: { type: 'form', note: 'Borang Perakuan Kerja Tesis/Disertasi yang ditandatangani (gantikan halaman ini).' },
      prelims: ['declaration', 'permission', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
      permission: { en: ['In presenting this thesis in fulfilment of the requirements for a postgraduate degree from Universiti Utara Malaysia, I agree that the Universiti Library may make it freely available for inspection. I further agree that permission for the copying of this thesis in any manner, in whole or in part, for scholarly purpose may be granted by my supervisor(s) or, in their absence, by the Dean of the graduate school. It is understood that any copying or publication or use of this thesis or parts thereof for financial gain shall not be allowed without my written permission. It is also understood that due recognition shall be given to me and to Universiti Utara Malaysia for any scholarly use which may be made of any material from my thesis.', 'Requests for permission to copy or to make other use of materials in this thesis, in whole or in part, should be addressed to the Dean of the graduate school, Universiti Utara Malaysia, 06010 UUM Sintok, Kedah Darul Aman.'], ms: null },
      labelsExtra: { permission: { en: 'Permission to Use', ms: 'Kebenaran Mengguna' } },
      title: [caps('{TITLE}', 14, 2), caps('{NAME}', 14, 4), caps('{DEGREE}', 14, 4), caps('{UNIV}', 14, 0.3), caps('{YEAR}', 14, 1)],
      statement: { thesis: '', diss: '' },
      check: ['Sumber ialah panduan Kolej Perniagaan dan templat UUM; semak panduan Awang Had Salleh Graduate School untuk fakulti anda.', 'Kedudukan nombor halaman tidak dinyatakan; di sini tengah bawah.']
    }),
    P({
      id: 'umk', short: 'UMK', name: 'Universiti Malaysia Kelantan', sector: 'awam', univ: 'UNIVERSITI MALAYSIA KELANTAN',
      source: { title: 'Guideline for Thesis Preparation (2023), Fakulti Keusahawanan dan Perniagaan UMK', url: 'https://fkp.umk.edu.my/download/download/Guideline%20for%20Thesis%20Preparation%202023%20FKP.pdf', year: 2023 },
      margins: { top: 2, bottom: 2, left: 4, right: 2 }, line: 2,
      chapter: { layout: 'one', size: 12 },
      abstract: { order: 'thesisFirst', line: 1, withTitle: true },
      refs: { align: 'center', line: 1, after: 12 },
      prelims: ['abstracts', 'ack', 'declaration', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 14, 2), caps('{NAME}', 12, 3), line('{STATEMENT} {DEGREE}', 12, 3, false), caps('{UNIV}', 12, 3), line('{YEAR}', 12, 1.5, false)],
      statement: { thesis: 'A thesis submitted in fulfilment of the requirements for the degree of', diss: 'A dissertation submitted in partial fulfilment of the requirements for the degree of' },
      check: ['Sumber ialah panduan peringkat fakulti (berdasarkan panduan CPS UMK edisi 2022).', 'Jenis dan saiz fon tidak dinyatakan; di sini Times New Roman 12.', 'Logo UMK perlu ditambah pada halaman tajuk.']
    }),
    P({
      id: 'mmu', short: 'MMU', name: 'Multimedia University', sector: 'swasta', univ: 'MULTIMEDIA UNIVERSITY',
      source: { title: 'Guideline for Preparation of Thesis v5.1 (Aug 2026), IPS MMU', url: 'https://ips.mmu.edu.my/wp-content/uploads/2026/08/MMU_Guideline-of-thesis-preparation_V5.1_August2026.pdf', year: 2026 },
      margins: { top: 2, bottom: 4, left: 4, right: 2.5 }, line: 1.5, after: 24,
      abstract: { order: 'enFirst', line: 1.5, enOnly: true },
      refs: { align: 'center', line: 1, after: 12 },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' } },
      prelims: ['copyright', 'declaration', 'ack', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 14, 2), caps('{NAME}', 12, 4), caps('{DEGREE}', 12, 4), caps('{UNIV}', 12, 0.3), caps('{MONTHYEAR}', 12, 1.5)],
      statement: { thesis: '', diss: '' },
      check: ['Margin bawah 4 cm seperti dalam panduan v5.1.']
    }),
    P({
      id: 'uniten', short: 'UNITEN', name: 'Universiti Tenaga Nasional', sector: 'swasta', univ: 'UNIVERSITI TENAGA NASIONAL',
      source: { title: 'Thesis Guidelines (update April 2025), College of Graduate Studies', url: 'https://www.uniten.edu.my/media/v50c55vg/thesis-guidelines-update-april-2025.pdf', year: 2025 },
      margins: { top: 2.5, bottom: 2.5, left: 4, right: 2.5 }, line: 1.5,
      abstract: { order: 'enFirst', line: 1, enOnly: true },
      refs: { align: 'center', line: 1, after: 12 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'center' } },
      labels: { decl: { en: 'DECLARATION', ms: 'PENGAKUAN' } },
      prelims: ['declaration', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 14, 2), caps('{NAME}', 12, 3), line('{STATEMENT} {DEGREE}', 12, 3, false), line('{MONTHYEAR}', 12, 3, false)],
      statement: { thesis: 'A Thesis Submitted to the College of Graduate Studies, Universiti Tenaga Nasional in Fulfillment of the Requirements for the Degree of', diss: 'A Dissertation Submitted to the College of Graduate Studies, Universiti Tenaga Nasional in Partial Fulfillment of the Requirements for the Degree of' },
      check: ['Jarak baris teks tidak dinyatakan; di sini 1.5.', 'Borang Thesis Status Declaration diletakkan selepas halaman tajuk.']
    }),
    P({
      id: 'ucsi', short: 'UCSI', name: 'UCSI University', sector: 'swasta', univ: 'UCSI UNIVERSITY',
      source: { title: 'Thesis and Dissertation Preparation Guidelines for Postgraduate Candidates (2018)', url: 'https://www.ucsiuniversity.edu.my/sites/default/files/thesisguidelines.pdf', year: 2018 },
      margins: { top: 2.5, bottom: 2.5, left: 3.5, right: 2.5 }, line: 1.5, after: 18,
      pageNum: { pos: 'bottom-right', dist: 1.5 },
      chapter: { num: 'roman', layout: 'two', size: 12 },
      abstract: { order: 'enFirst', line: 1, enOnly: true },
      refs: { align: 'center', line: 1, after: 18 },
      caption: { table: { pos: 'above', align: 'center' }, figure: { pos: 'below', align: 'center' } },
      labels: { decl: { en: 'DECLARATION OF ORIGINALITY AND EXCLUSIVENESS', ms: 'PERAKUAN KEASLIAN' } },
      prelims: ['ack', 'approval', 'declaration', 'abstracts', 'toc', 'lists', 'loa'],
      title: [caps('{TITLE}', 18, 1), caps('{NAME}', 18, 3), caps('{DEGREE}', 18, 3), caps('{FACULTY}', 18, 0.3), caps('{UNIV}', 18, 0.3), caps('{YEAR}', 18, 1)],
      statement: { thesis: '', diss: '' },
      check: ['Tahun pada halaman tajuk ialah tahun viva.']
    }),
    P({
      id: 'custom', short: 'Lain', name: 'Universiti lain (tetapan sendiri)', sector: 'lain', univ: '',
      source: null,
      prelims: ['declaration', 'abstracts', 'ack', 'toc', 'lists', 'loa'],
      title: [caps('{UNIV}', 16), caps('{TITLE}', 16, 3), caps('{NAME}', 14, 3), line('{STATEMENT}', 12, 3, false), line('{DEGREE}', 12, 0.3), line('{FACULTY}', 12, 2, false), line('{MONTHYEAR}', 12, 1.5, false)],
      statement: { thesis: 'A thesis submitted in fulfilment of the requirements for the degree of', diss: 'A dissertation submitted in partial fulfilment of the requirements for the degree of' },
      check: ['Isi tetapan mengikut garis panduan universiti anda.']
    })
  ];

  /* Universities whose current guideline could not be found online: they use the custom profile. */
  const NOT_FOUND = ['USIM', 'UMT', 'UPNM', 'UTeM', 'UniSZA', 'UMPSA'];

  const byId = id => PROFILES.find(p => p.id === id) || PROFILES[0];
  /* The custom profile with the student's own settings applied on top. */
  function resolve(id, custom) {
    const p = JSON.parse(JSON.stringify(byId(id)));
    if (p.id !== 'custom' || !custom) return p;
    const c = custom;
    const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
    p.univ = String(c.univ || '').trim().toUpperCase();
    p.margins = { top: num(c.top, 2.5, 1, 6), bottom: num(c.bottom, 2.5, 1, 6), left: num(c.left, 4, 1, 6), right: num(c.right, 2.5, 1, 6) };
    p.font = ['Times New Roman', 'Arial', 'Calibri', 'Tahoma', 'Book Antiqua', 'Century Schoolbook'].includes(c.font) ? c.font : 'Times New Roman';
    p.size = num(c.size, 12, 10, 14);
    p.line = [1, 1.15, 1.5, 2].includes(Number(c.line)) ? Number(c.line) : 1.5;
    p.indent = ['all', 'notFirst', 'none'].includes(c.indent) ? c.indent : 'all';
    p.after = num(c.after, 0, 0, 36);
    p.pageNum = { pos: ['bottom-center', 'bottom-right', 'top-right', 'top-center'].includes(c.pageNum) ? c.pageNum : 'bottom-center', size: p.size, hideChapterFirst: !!c.hideChapterFirst };
    p.chapter = { label: 'CHAPTER', num: ['arabic', 'roman', 'word'].includes(c.chapterNum) ? c.chapterNum : 'arabic', layout: c.chapterLayout === 'one' ? 'one' : 'two', size: 14, gapBefore: 0 };
    p.abstract = { order: ['thesisFirst', 'msFirst', 'enFirst'].includes(c.abstractOrder) ? c.abstractOrder : 'thesisFirst', line: 1, enOnly: c.abstractOrder === 'enOnly' };
    if (c.abstractOrder === 'enOnly') p.abstract.order = 'enFirst';
    if (String(c.statement || '').trim()) p.statement = p.statementMs = { thesis: String(c.statement).trim(), diss: String(c.statement).trim() };
    return p;
  }

  return { PROFILES, NOT_FOUND, byId, resolve };
});
