/* Talkademic "Jurnal & Paper": journal articles alongside the thesis.
   Papers live in the same workspace (state.papers), so they are saved, backed up and restored with it.
   Journals and their numbers come from OpenAlex (/api/journals); AI only writes and reviews (/api/paper, /api/cite). */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const SECTIONS = ['abstract', 'introduction', 'literature', 'method', 'results', 'discussion', 'conclusion'];

  const S = {
    ms: {
      title: 'Jurnal & Paper', titleAlt: 'Journal Papers', eyebrow: 'AKADEMIK',
      sub: 'Tulis artikel jurnal, cari jurnal sasaran berindeks dan semak apa yang perlu dibaiki sebelum hantar.',
      new: 'Paper baharu', untitled: 'Paper tanpa tajuk', pick: 'Pilih paper',
      empty: 'Belum ada paper jurnal.', emptyBody: 'Mulakan satu paper. Ia disimpan bersama projek tesis dan termasuk dalam backup.', start: 'Mula paper baharu',
      titleLabel: 'Tajuk paper', titlePh: 'cth. Peranan imej produk close-up terhadap niat pembelian dalam e-dagang Malaysia',
      language: 'Bahasa paper', ms: 'Bahasa Melayu', en: 'English',
      noTarget: 'Belum pilih jurnal sasaran.', findJournal: 'Cari jurnal sesuai', change: 'Tukar', targetLabel: 'Jurnal sasaran',
      stats: '{w} perkataan · {r} rujukan', statsRecent: ' · {p}% dari 5 tahun terkini',
      tabWrite: 'Tulis', tabJournals: 'Jurnal sasaran', tabMeta: 'Abstrak & tajuk', tabFit: 'Semak kesediaan',
      'sec.abstract': 'Abstrak', 'sec.introduction': 'Pengenalan', 'sec.literature': 'Kajian Literatur', 'sec.method': 'Metodologi', 'sec.results': 'Dapatan', 'sec.discussion': 'Perbincangan', 'sec.conclusion': 'Kesimpulan',
      'guide.abstract': '150–250 perkataan: tujuan, kaedah, dapatan utama, keaslian.',
      'guide.introduction': 'Latar belakang → masalah → jurang kajian → objektif/soalan → sumbangan kajian.',
      'guide.literature': 'Teori asas, kajian lepas terkini (5 tahun), pembinaan hipotesis atau kerangka.',
      'guide.method': 'Reka bentuk, sampel & persampelan, instrumen (sumber item), prosedur, analisis.',
      'guide.results': 'Dapatan sahaja, ikut soalan/hipotesis. Jadual dan statistik yang dilaporkan dengan lengkap.',
      'guide.discussion': 'Bandingkan dengan kajian lepas, jelaskan mengapa, implikasi teori & praktikal.',
      'guide.conclusion': 'Ringkasan sumbangan, had kajian, cadangan kajian akan datang.',
      words: '{n} perkataan', keywords: 'Kata kunci', keywordsPh: 'cth. imej produk; niat pembelian; e-dagang; Malaysia',
      secPh: 'Tulis atau tampal bahagian {s} di sini…',
      citeTitle: 'Tulis dengan rujukan sebenar', citeBody: 'Taip idea secara santai. Talkademic cari kajian sebenar (OpenAlex) dan tulis perenggan akademik dengan sitasi APA.',
      citePh: 'cth. gambar close up buat pembeli lebih yakin sebab nampak kualiti produk', citeBtn: 'Jana perenggan', citeBusy: 'Mencari kajian dan menulis… (sehingga 1 minit)',
      insertInto: 'Masukkan ke {s}', discard: 'Buang', citeAdded: 'Perenggan dimasukkan. {n} rujukan ditambah.',
      refs: 'Rujukan paper', noRefs: 'Belum ada rujukan. Guna "Tulis dengan rujukan sebenar" untuk menambah.', copyRefs: 'Salin rujukan', importRefs: 'Import RIS / BibTeX', importedRefs: '{a} rujukan diimport. {s} sudah ada.', importNone: 'Fail ini bukan RIS atau BibTeX, atau tiada rujukan di dalamnya.', copied: 'Rujukan disalin.', remove: 'Buang rujukan',
      exportDocx: 'Eksport DOCX', del: 'Padam paper', delConfirm: 'Padam paper "{t}"? Tindakan ini tidak boleh dibatalkan (kecuali dari backup).', deleted: 'Paper dipadam.',
      jIntro: 'Cadangan jurnal berdasarkan jurnal yang sudah menerbitkan kajian serupa dengan paper anda. Semua angka dari OpenAlex.',
      jFind: 'Cari jurnal sesuai', jRecent: '5 tahun terkini sahaja', jBusy: 'Mencari jurnal yang menerbitkan kajian serupa…',
      jNeed: 'Isi tajuk (dan sebaiknya abstrak atau kata kunci) dahulu.', jNone: 'Tiada jurnal ditemui. Cuba tambah kata kunci atau abstrak.',
      jFound: '{n} jurnal daripada {m} kajian serupa', jMatches: '{n} kajian serupa', jImpact: 'Impak 2 thn', jOA: 'Akses terbuka', jSub: 'Langganan',
      jApc: 'APC US${n}', jNoApc: 'Tiada APC', jTopics: 'Fokus: ', jSample: 'cth: ', jPick: 'Pilih sebagai sasaran', jIsTarget: '✓ Jurnal sasaran',
      jScimago: 'Semak kuartil (Scimago)', jSite: 'Laman jurnal', jPicked: 'Jurnal sasaran: {n}',
      jManual: 'Atau taip nama jurnal sendiri', jManualPh: 'cth. Journal of Retailing and Consumer Services', jSet: 'Tetapkan',
      jNote: 'Impak 2 thn ialah purata sitasi OpenAlex, bukan Impact Factor rasmi. Semak kuartil Q1–Q4 dan status Scopus/WoS di Scimago, dan hantar hanya melalui laman rasmi jurnal (elak jurnal "hijacked").',
      mIntro: 'Jana abstrak berstruktur, lima pilihan tajuk dan kata kunci daripada draf anda. Lebih lengkap draf, lebih baik hasilnya.',
      mGen: 'Jana abstrak, tajuk & kata kunci', mBusy: 'Menulis abstrak dan tajuk…', mAbstract: 'Abstrak berstruktur', mTitles: 'Pilihan tajuk', mKeywords: 'Kata kunci',
      aPurpose: 'Tujuan', aMethod: 'Reka bentuk/metodologi/pendekatan', aFindings: 'Dapatan', aOriginality: 'Keaslian/nilai',
      mUseAbstract: 'Guna sebagai Abstrak', mUse: 'Guna', mUseKw: 'Guna kata kunci', mReplace: 'Ganti kandungan Abstrak sedia ada?', mUsed: 'Dikemas kini.',
      mNote: 'Semak semula sebelum guna. Tanda [DAPATAN UTAMA] bermaksud draf belum ada dapatan, jadi isi sendiri.',
      fIntro: 'Semakan pantas di bawah dibuat terus pada peranti. Semakan AI menilai paper seperti penilai jurnal berimpak tinggi.',
      fQuick: 'Semakan pantas', fGo: 'Semak dengan AI', fBusy: 'Menilai paper anda… (sehingga 1 minit)', fGeneral: 'Tiada jurnal sasaran: semakan umum untuk jurnal berindeks Q1–Q2.',
      fFor: 'Dinilai untuk: {n}', fStale: 'Paper telah diubah selepas semakan ini. Semak semula untuk keputusan terkini.',
      'ready.ready': 'Sedia dihantar', 'ready.almost': 'Hampir sedia', 'ready.not-yet': 'Belum sedia',
      'scope.strong': 'Padan skop: kuat', 'scope.partial': 'Padan skop: separa', 'scope.weak': 'Padan skop: lemah', 'scope.unknown': 'Padan skop: tidak pasti',
      'pri.high': 'Keutamaan tinggi', 'pri.medium': 'Sederhana', 'pri.low': 'Rendah', fix: 'Cara baiki: ', openSec: 'Buka bahagian', strengths: 'Kekuatan',
      'sec.references': 'Rujukan', 'sec.title': 'Tajuk', 'sec.keywords': 'Kata kunci', 'sec.overall': 'Keseluruhan',
      'qc.sections': 'Semua bahagian ada kandungan', 'qc.sectionsBad': 'Masih kosong: {s}',
      'qc.abstract': 'Abstrak 150–300 perkataan', 'qc.abstractBad': 'Abstrak {n} perkataan (sasaran 150–300)',
      'qc.title': 'Tajuk tidak lebih 20 perkataan', 'qc.titleBad': 'Tajuk {n} perkataan (sasaran ≤ 20)',
      'qc.keywords': '4–8 kata kunci', 'qc.keywordsBad': '{n} kata kunci (sasaran 4–8)',
      'qc.refs': 'Sekurang-kurangnya 40 rujukan (panduan umum Q1–Q2)', 'qc.refsBad': '{n} rujukan (panduan umum: 40 atau lebih)',
      'qc.recent': 'Separuh rujukan dari 5 tahun terkini', 'qc.recentBad': '{p}% rujukan dari 5 tahun terkini (sasaran ≥ 50%)',
      'qc.target': 'Jurnal sasaran dipilih', 'qc.targetBad': 'Belum pilih jurnal sasaran',
      iImport: 'Import DOCX', iDone: 'Diimport "{t}": {s} bahagian dikenal pasti, {w} perkataan, {r} rujukan.', iNone: 'Tiada tajuk bahagian dikenal pasti, jadi semua teks dimasukkan ke Pengenalan. Pindahkan ke bahagian yang betul.', iSkipped: ' {n} baris hadapan (nama penulis, afiliasi) tidak dimasukkan.',
      'ie.old-doc': 'Fail .doc lama tidak disokong. Buka dalam Word dan Simpan Sebagai .docx.', 'ie.not-docx': 'Ini bukan fail Word .docx.', 'ie.too-large': 'Fail terlalu besar (had 25 MB).', 'ie.empty': 'Tiada teks ditemui dalam dokumen ini.', 'ie.old-browser': 'Pelayar ini terlalu lama untuk import. Kemas kini Chrome atau Safari.',
      tabChat: 'Sembang', cGreet: 'Ceritakan idea kajian anda secara santai, satu demi satu. Saya letak setiap ayat di bahagian paper yang sesuai, tukar jadi ayat akademik, dan tanya soalan untuk lengkapkan paper. Bila cukup, tekan Susun jadi paper penuh.',
      cPh: 'Taip atau cakap idea anda…', cSend: 'Hantar', cSorting: 'Menyusun…', cMove: 'Pindah ke bahagian', cUnsorted: 'Belum disusun.', cRetry: 'Susun semula', cOutline: 'Rangka paper', 'sec.other': 'Lain-lain',
      cGen: 'Susun jadi paper penuh', cEmptyWrite: 'Belum ada draf. Sembang dulu, Talkademic susun jadi paper.', cOpenChat: 'Buka Sembang',
      xTitle: 'Perhalusi dengan ChatGPT / Claude / Gemini (akaun anda)', xHow: 'Talkademic salin bahagian ini berserta arahan, kemudian buka ChatGPT, Claude atau Gemini (contohnya akaun Gemini UiTM). Hantar di sana, salin jawapan, kemudian tekan Tampal hasil.', xOpenedGemini: 'Teks dah disalin dan Gemini dibuka. Tekan lama di kotak taip dan pilih Tampal. Tukar ke akaun UiTM di gambar profil jika perlu.', xGeminiNote: 'Gemini dibuka dengan akaun Google yang sedang log masuk. Untuk guna Gemini UiTM, tukar akaun di gambar profil Gemini.',
      xAction: 'Arahan', 'xa.polish': 'Perhalusi untuk jurnal Q1–Q2', 'xa.expand': 'Kembangkan hujah', 'xa.shorten': 'Ringkaskan', 'xa.grammar': 'Semak tatabahasa sahaja', 'xa.translate': 'Terjemah ke bahasa lain',
      xOpened: 'Teks dah disalin dan {a} dibuka. Kalau kotak taip kosong, tekan lama dan pilih Tampal.', xPaste: 'Tampal hasil', xPasteTitle: 'Hasil dari ChatGPT / Claude / Gemini', xPastePh: 'Tampal jawapan ChatGPT, Claude atau Gemini di sini…',
      xFromClip: 'Tampal dari clipboard', xClipFail: 'Tidak dapat baca clipboard. Tekan lama dalam kotak dan pilih Tampal.', xReplace: 'Ganti bahagian', xAppend: 'Tambah di bawah', xCancel: 'Batal',
      xDone: 'Bahagian dikemas kini.', xUndo: '↶ Batal perubahan', xUndone: 'Bahagian dikembalikan.',
      xUnknown: 'Sitasi ini tiada dalam senarai rujukan paper, mungkin ditambah oleh ChatGPT/Claude/Gemini. Semak sebelum guna: {c}', xEmpty: 'Bahagian ini masih kosong.',
      xReviewTitle: 'Minta penilaian ChatGPT / Claude', xReviewBody: 'Salin seluruh paper berserta arahan penilai jurnal, kemudian buka app. Jawapan dibaca di sana.',
      dTitle: 'Sembang → Paper penuh', dBody: 'Taip idea, pendapat atau pemerhatian anda secara santai, satu demi satu (boleh guna mikrofon). Bila cukup, tekan Jana paper penuh: Talkademic susun ikut bahagian jurnal dan masukkan sitasi daripada kajian sebenar secara automatik.',
      dPh: 'cth. I think, gambar close up penting utk org yakin semasa membeli', dAdd: 'Tambah', dMic: 'Cakap untuk menaip', dCount: '{n} idea', dNone: 'Belum ada idea. Mula taip di bawah.',
      dImport: 'Ambil dari sembang ({n})', dImported: '{n} idea diambil dari sembang.', dRemove: 'Buang idea',
      dGen: 'Jana paper penuh dengan rujukan', dNeed: 'Tambah sekurang-kurangnya 2 idea dahulu.',
      dReplace: 'Kandungan paper sedia ada akan diganti dengan draf baharu. Salinan disimpan supaya boleh dikembalikan. Teruskan?',
      dStepPlan: 'Menyusun idea & mencari kajian sebenar', dStepSection: 'Menulis {s}', dStepAbstract: 'Menulis abstrak & kata kunci',
      dDone: 'Paper penuh siap: {w} perkataan, {r} rujukan. Semak setiap bahagian sebelum hantar.', dFail: 'Terhenti semasa "{s}": {e} Bahagian yang siap telah disimpan.',
      dUndo: '↶ Kembalikan draf sebelum jana', dUndoConfirm: 'Kembalikan paper seperti sebelum jana?', dUndone: 'Draf sebelum jana dikembalikan.',
      dNote: 'AI hanya memetik kajian yang benar-benar ditemui di OpenAlex. Tanda [PERLU RUJUKAN] dan [DAPATAN …] perlu anda isi sendiri. Kebanyakan jurnal minta penulis nyatakan penggunaan AI.',
      'qc.markers': 'Tiada tanda [PERLU RUJUKAN] atau [DAPATAN] tertinggal', 'qc.markersBad': '{n} tanda seperti [PERLU RUJUKAN] atau [DAPATAN] masih perlu diisi',
      needAI: 'Sambung AI dahulu di Tetapan (kod akses).', projTitle: 'Paper Jurnal', projEmpty: 'Belum ada paper jurnal.', open: 'Buka', edit: 'Sunting', projWords: '{n} perkataan', projNoTarget: 'Tiada jurnal sasaran', projTarget: 'Sasaran: {j}'
    },
    en: {
      title: 'Journal Papers', titleAlt: 'Jurnal & Paper', eyebrow: 'ACADEMIC',
      sub: 'Write journal articles, find indexed target journals and see what to fix before you submit.',
      new: 'New paper', untitled: 'Untitled paper', pick: 'Choose paper',
      empty: 'No journal papers yet.', emptyBody: 'Start a paper. It is saved with your thesis project and included in backups.', start: 'Start a new paper',
      titleLabel: 'Paper title', titlePh: 'e.g. The role of close-up product images in purchase intention in Malaysian e-commerce',
      language: 'Paper language', ms: 'Bahasa Melayu', en: 'English',
      noTarget: 'No target journal yet.', findJournal: 'Find suitable journals', change: 'Change', targetLabel: 'Target journal',
      stats: '{w} words · {r} references', statsRecent: ' · {p}% from the last 5 years',
      tabWrite: 'Write', tabJournals: 'Target journal', tabMeta: 'Abstract & title', tabFit: 'Readiness check',
      'sec.abstract': 'Abstract', 'sec.introduction': 'Introduction', 'sec.literature': 'Literature Review', 'sec.method': 'Methodology', 'sec.results': 'Results', 'sec.discussion': 'Discussion', 'sec.conclusion': 'Conclusion',
      'guide.abstract': '150–250 words: purpose, method, key findings, originality.',
      'guide.introduction': 'Background → problem → research gap → objectives/questions → contribution.',
      'guide.literature': 'Underpinning theory, recent studies (last 5 years), hypothesis or framework development.',
      'guide.method': 'Design, sample and sampling, instrument (item sources), procedure, analysis.',
      'guide.results': 'Findings only, following the questions/hypotheses. Report tables and statistics fully.',
      'guide.discussion': 'Compare with prior studies, explain why, theoretical and practical implications.',
      'guide.conclusion': 'Summary of contribution, limitations, future research.',
      words: '{n} words', keywords: 'Keywords', keywordsPh: 'e.g. product image; purchase intention; e-commerce; Malaysia',
      secPh: 'Write or paste the {s} here…',
      citeTitle: 'Write with real references', citeBody: 'Type an idea casually. Talkademic finds real studies (OpenAlex) and writes an academic paragraph with APA citations.',
      citePh: 'e.g. close-up photos make buyers more confident because they can see product quality', citeBtn: 'Write paragraph', citeBusy: 'Finding studies and writing… (up to a minute)',
      insertInto: 'Insert into {s}', discard: 'Discard', citeAdded: 'Paragraph inserted. {n} references added.',
      refs: 'Paper references', noRefs: 'No references yet. Use "Write with real references" to add some.', copyRefs: 'Copy references', importRefs: 'Import RIS / BibTeX', importedRefs: '{a} references imported. {s} were already there.', importNone: 'This file is not RIS or BibTeX, or it has no references.', copied: 'References copied.', remove: 'Remove reference',
      exportDocx: 'Export DOCX', del: 'Delete paper', delConfirm: 'Delete paper "{t}"? This cannot be undone (except from a backup).', deleted: 'Paper deleted.',
      jIntro: 'Suggestions are journals that already publish work similar to your paper. All numbers come from OpenAlex.',
      jFind: 'Find suitable journals', jRecent: 'Last 5 years only', jBusy: 'Finding journals that publish similar work…',
      jNeed: 'Add a title first (and ideally an abstract or keywords).', jNone: 'No journals found. Try adding keywords or an abstract.',
      jFound: '{n} journals from {m} similar studies', jMatches: '{n} similar studies', jImpact: '2-yr impact', jOA: 'Open access', jSub: 'Subscription',
      jApc: 'APC US${n}', jNoApc: 'No APC', jTopics: 'Focus: ', jSample: 'e.g. ', jPick: 'Set as target', jIsTarget: '✓ Target journal',
      jScimago: 'Check quartile (Scimago)', jSite: 'Journal site', jPicked: 'Target journal: {n}',
      jManual: 'Or type a journal name yourself', jManualPh: 'e.g. Journal of Retailing and Consumer Services', jSet: 'Set',
      jNote: '2-yr impact is OpenAlex\'s mean citedness, not the official Impact Factor. Check the Q1–Q4 quartile and Scopus/WoS status on Scimago, and submit only through the journal\'s official site (avoid hijacked journals).',
      mIntro: 'Generate a structured abstract, five title options and keywords from your draft. The fuller the draft, the better the result.',
      mGen: 'Generate abstract, titles & keywords', mBusy: 'Writing abstract and titles…', mAbstract: 'Structured abstract', mTitles: 'Title options', mKeywords: 'Keywords',
      aPurpose: 'Purpose', aMethod: 'Design/methodology/approach', aFindings: 'Findings', aOriginality: 'Originality/value',
      mUseAbstract: 'Use as Abstract', mUse: 'Use', mUseKw: 'Use keywords', mReplace: 'Replace the current Abstract?', mUsed: 'Updated.',
      mNote: 'Review before use. [KEY FINDING] means the draft has no findings yet, so fill them in yourself.',
      fIntro: 'The quick check below runs on your device. The AI check reviews the paper the way reviewers of high-impact journals do.',
      fQuick: 'Quick check', fGo: 'Check with AI', fBusy: 'Reviewing your paper… (up to a minute)', fGeneral: 'No target journal: general check for indexed Q1–Q2 journals.',
      fFor: 'Reviewed for: {n}', fStale: 'The paper has changed since this review. Check again for an up-to-date result.',
      'ready.ready': 'Ready to submit', 'ready.almost': 'Almost ready', 'ready.not-yet': 'Not ready yet',
      'scope.strong': 'Scope fit: strong', 'scope.partial': 'Scope fit: partial', 'scope.weak': 'Scope fit: weak', 'scope.unknown': 'Scope fit: unclear',
      'pri.high': 'High priority', 'pri.medium': 'Medium', 'pri.low': 'Low', fix: 'How to fix: ', openSec: 'Open section', strengths: 'Strengths',
      'sec.references': 'References', 'sec.title': 'Title', 'sec.keywords': 'Keywords', 'sec.overall': 'Overall',
      'qc.sections': 'Every section has content', 'qc.sectionsBad': 'Still empty: {s}',
      'qc.abstract': 'Abstract of 150–300 words', 'qc.abstractBad': 'Abstract has {n} words (aim for 150–300)',
      'qc.title': 'Title of 20 words or fewer', 'qc.titleBad': 'Title has {n} words (aim for ≤ 20)',
      'qc.keywords': '4–8 keywords', 'qc.keywordsBad': '{n} keywords (aim for 4–8)',
      'qc.refs': 'At least 40 references (general Q1–Q2 guide)', 'qc.refsBad': '{n} references (general guide: 40 or more)',
      'qc.recent': 'Half of references from the last 5 years', 'qc.recentBad': '{p}% of references from the last 5 years (aim for ≥ 50%)',
      'qc.target': 'Target journal chosen', 'qc.targetBad': 'No target journal yet',
      iImport: 'Import DOCX', iDone: 'Imported "{t}": {s} sections recognised, {w} words, {r} references.', iNone: 'No section headings were recognised, so all text went into the Introduction. Move it to the right sections.', iSkipped: ' {n} front-matter lines (authors, affiliations) were left out.',
      'ie.old-doc': 'Old .doc files are not supported. Open it in Word and Save As .docx.', 'ie.not-docx': 'This is not a Word .docx file.', 'ie.too-large': 'The file is too large (25 MB limit).', 'ie.empty': 'No text was found in this document.', 'ie.old-browser': 'This browser is too old to import. Update Chrome or Safari.',
      tabChat: 'Chat', cGreet: 'Tell me about your research casually, one idea at a time. I put each one in the right part of the paper, rewrite it academically, and ask questions to complete the paper. When you have enough, tap Build the full paper.',
      cPh: 'Type or speak your idea…', cSend: 'Send', cSorting: 'Sorting…', cMove: 'Move to section', cUnsorted: 'Not sorted yet.', cRetry: 'Sort again', cOutline: 'Paper outline', 'sec.other': 'Other',
      cGen: 'Build the full paper', cEmptyWrite: 'No draft yet. Chat first and Talkademic builds the paper.', cOpenChat: 'Open Chat',
      xTitle: 'Refine with ChatGPT / Claude / Gemini (your account)', xHow: 'Talkademic copies this section with an instruction, then opens ChatGPT, Claude or Gemini (for example your UiTM Gemini account). Send it there, copy the answer, then tap Paste result.', xOpenedGemini: 'Text copied and Gemini opened. Long-press the message box and choose Paste. Switch to your UiTM account from the profile picture if needed.', xGeminiNote: 'Gemini opens with the Google account that is signed in. To use your UiTM Gemini, switch accounts from the profile picture in Gemini.',
      xAction: 'Instruction', 'xa.polish': 'Polish for a Q1–Q2 journal', 'xa.expand': 'Expand the argument', 'xa.shorten': 'Make it shorter', 'xa.grammar': 'Grammar only', 'xa.translate': 'Translate to the other language',
      xOpened: 'Text copied and {a} opened. If the message box is empty, long-press and choose Paste.', xPaste: 'Paste result', xPasteTitle: 'Result from ChatGPT / Claude / Gemini', xPastePh: 'Paste the ChatGPT, Claude or Gemini answer here…',
      xFromClip: 'Paste from clipboard', xClipFail: 'Could not read the clipboard. Long-press in the box and choose Paste.', xReplace: 'Replace section', xAppend: 'Add below', xCancel: 'Cancel',
      xDone: 'Section updated.', xUndo: '↶ Undo change', xUndone: 'Section restored.',
      xUnknown: 'These citations are not in the paper\'s reference list and may have been added by ChatGPT/Claude/Gemini. Check them before use: {c}', xEmpty: 'This section is still empty.',
      xReviewTitle: 'Ask ChatGPT / Claude for a review', xReviewBody: 'Copies the whole paper with journal-reviewer instructions, then opens the app. Read the answer there.',
      dTitle: 'Chat → Full paper', dBody: 'Type your ideas, opinions or observations casually, one at a time (the mic works too). When you have enough, press Generate full paper: Talkademic organises them into journal sections and adds citations from real studies automatically.',
      dPh: 'e.g. I think close-up photos make people confident when buying', dAdd: 'Add', dMic: 'Speak to type', dCount: '{n} ideas', dNone: 'No ideas yet. Start typing below.',
      dImport: 'Import from chats ({n})', dImported: '{n} ideas imported from your chats.', dRemove: 'Remove idea',
      dGen: 'Generate full paper with references', dNeed: 'Add at least 2 ideas first.',
      dReplace: 'The current paper content will be replaced by a new draft. A copy is kept so you can restore it. Continue?',
      dStepPlan: 'Organising ideas & finding real studies', dStepSection: 'Writing {s}', dStepAbstract: 'Writing abstract & keywords',
      dDone: 'Full paper ready: {w} words, {r} references. Review every section before submitting.', dFail: 'Stopped at "{s}": {e} Finished sections have been saved.',
      dUndo: '↶ Restore the draft from before generating', dUndoConfirm: 'Restore the paper as it was before generating?', dUndone: 'Previous draft restored.',
      dNote: 'The AI only cites studies actually found in OpenAlex. Markers such as [SOURCE NEEDED] and [FINDING …] are for you to fill in. Most journals ask authors to declare AI use.',
      'qc.markers': 'No [SOURCE NEEDED] or [FINDING] markers left', 'qc.markersBad': '{n} markers such as [SOURCE NEEDED] or [FINDING] still to fill in',
      needAI: 'Connect AI first in Settings (access code).', projTitle: 'Journal Papers', projEmpty: 'No journal papers yet.', open: 'Open', edit: 'Edit', projWords: '{n} words', projNoTarget: 'No target journal', projTarget: 'Target: {j}'
    }
  };
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  function t(k, vars) {
    let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(String(b));
    return s;
  }
  const fmt = n => Number(n || 0).toLocaleString(lang() === 'en' ? 'en-GB' : 'ms-MY');
  const words = s => (String(s || '').trim().match(/\S+/g) || []).length;
  const isMs = p => p.language !== 'English';
  /* Section names inside the paper itself follow the paper's language, not the app's. */
  const paperLabel = (key, p) => S[isMs(p) ? 'ms' : 'en']['sec.' + key];

  /* Small DOM helper: h('button', {class, text, onclick}, ...children). Text is always set as text. */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'checked', 'disabled', 'hidden', 'rows', 'maxLength'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }

  /* ---------- state ---------- */
  const view = { tab: 'chat', section: 'introduction', busy: '', recent: true, cite: null, manual: '', note: '', progress: null, xAction: 'polish', paste: null, undo: null };
  function store() { const s = App.state(); if (!Array.isArray(s.papers)) s.papers = []; return s; }
  function current() { const s = store(); return s.papers.find(p => p.id === s.activePaper) || s.papers[0] || null; }
  function touch(p) { p.updated = new Date().toISOString(); App.save(); }
  function sectionOf(p, key) {
    if (!Array.isArray(p.sections)) p.sections = [];
    let s = p.sections.find(x => x.key === key);
    if (!s) { s = { key, content: '' }; p.sections.push(s); }
    return s;
  }
  function refYears(p) { return (p.references || []).map(r => parseInt(r && r.year, 10)).filter(y => y > 1800); }
  function stats(p) {
    const w = SECTIONS.reduce((a, k) => a + words(sectionOf(p, k).content), 0);
    const years = refYears(p), now = new Date().getFullYear();
    const recent = years.filter(y => y >= now - 5).length;
    return { words: w, refs: (p.references || []).length, recentPct: years.length ? Math.round((recent / years.length) * 100) : null };
  }
  function newPaper() {
    const s = store(), now = new Date().toISOString();
    const p = { id: App.uid(), title: '', language: lang() === 'en' ? 'English' : 'Bahasa Melayu', keywords: '', sections: SECTIONS.map(key => ({ key, content: '' })), references: [], target: null, journals: null, meta: null, fit: null, created: now, updated: now };
    s.papers.unshift(p); s.activePaper = p.id;
    view.tab = 'chat'; view.section = 'introduction'; view.cite = null;
    App.save(); render();
    setTimeout(() => { const el = $('#noteInput'); if (el) el.focus(); }, 50);
  }
  function openPaper(id) { store().activePaper = id; view.cite = null; App.save(); }
  function payload(p) {
    return { title: p.title, language: p.language, keywords: p.keywords, sections: SECTIONS.map(k => ({ key: k, content: sectionOf(p, k).content })), refYears: refYears(p) };
  }
  /* Re-checks the connection before refusing, and asks for the access code if it is missing. */
  async function needAI() { return !(await App.ensureAI()); }

  /* ---------- rendering ---------- */
  function render() {
    const root = $('#view-papers');
    if (!root) return;
    const y = window.scrollY;
    const p = current();
    const head = h('div', { class: 'view-head' }, h('div', {},
      h('div', { class: 'eyebrow' }, h('span', { class: 'eyebrow-dot' }), ' ', t('eyebrow')),
      h('h1', { id: 'papersTitle' }, t('title'), ' ', h('small', { text: t('titleAlt') })),
      h('p', { text: t('sub') })));
    root.replaceChildren(head, ...(p ? [picker(p), paperCard(p), tabs(), h('div', { id: 'paperBody', class: 'paper-body' }, body(p))] : [emptyState()]));
    window.scrollTo({ top: y });
    renderProjectsCard();
  }
  function renderBody() {
    const p = current(), box = $('#paperBody');
    if (!p || !box) return render();
    box.replaceChildren(body(p));
    updateStats(p);
    document.querySelectorAll('.paper-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === view.tab)));
  }
  function body(p) {
    if (view.tab === 'journals') return journalsTab(p);
    if (view.tab === 'meta') return metaTab(p);
    if (view.tab === 'fit') return fitTab(p);
    if (view.tab === 'chat') return chatTab(p);
    return writeTab(p);
  }

  function emptyState() {
    return h('div', { class: 'card paper-empty' },
      h('span', { class: 'pd-icon' }, '📄'),
      h('h2', { text: t('empty') }), h('p', { class: 'muted', text: t('emptyBody') }),
      h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: newPaper }, '＋ ', t('start')), importButton()));
  }

  function picker(p) {
    const sel = h('select', { id: 'paperSelect', 'aria-label': t('pick'), onchange: e => { openPaper(e.target.value); render(); } },
      store().papers.map(x => h('option', { value: x.id, text: x.title.trim() || t('untitled') })));
    sel.value = p.id;
    return h('div', { class: 'paper-picker' }, sel, h('button', { type: 'button', class: 'btn btn-outline', onclick: newPaper }, '＋ ', t('new')), importButton(),
      h('button', { type: 'button', class: 'btn btn-outline pp-export', onclick: () => exportDocx(p) }, '↓ ', t('exportDocx')));
  }

  function targetLine(p) {
    const go = () => { view.tab = 'journals'; renderBody(); };
    if (!p.target) return h('div', { class: 'paper-target none' }, h('span', { class: 'muted', text: t('noTarget') }), ' ', h('button', { type: 'button', class: 'btn-reset text-action', onclick: go, text: t('findJournal') }));
    const j = p.target, bits = [];
    if (j.h !== null && j.h !== undefined) bits.push('h-index ' + fmt(j.h));
    if (j.impact !== null && j.impact !== undefined) bits.push(t('jImpact') + ' ' + j.impact);
    return h('div', { class: 'paper-target' },
      h('span', { 'aria-hidden': 'true' }, '🎯'),
      h('span', { class: 'pt-text' }, h('small', { text: t('targetLabel') }), h('strong', { text: j.name }), bits.length ? h('small', { text: bits.join(' · ') }) : null),
      h('button', { type: 'button', class: 'btn-reset text-action', onclick: go, text: t('change') }));
  }

  function statsText(p) {
    const s = stats(p);
    return t('stats', { w: fmt(s.words), r: fmt(s.refs) }) + (s.recentPct !== null ? t('statsRecent', { p: s.recentPct }) : '');
  }
  function updateStats(p) { const el = $('#paperStats'); if (el) el.textContent = statsText(p); }

  function paperCard(p) {
    const title = h('textarea', { id: 'paperTitle', rows: 3, maxLength: 400, placeholder: t('titlePh'), value: p.title,
      oninput: e => { p.title = e.target.value; touch(p); const o = $('#paperSelect option[value="' + p.id + '"]'); if (o) o.textContent = p.title.trim() || t('untitled'); } });
    const langSel = h('select', { id: 'paperLang', onchange: e => { p.language = e.target.value; touch(p); renderBody(); } },
      h('option', { value: 'Bahasa Melayu', text: t('ms') }), h('option', { value: 'English', text: t('en') }));
    langSel.value = p.language;
    return h('div', { class: 'card paper-card' },
      h('label', { class: 'form-field' }, h('span', { text: t('titleLabel') }), title),
      h('div', { class: 'paper-row' },
        h('label', { class: 'form-field paper-lang' }, h('span', { text: t('language') }), langSel),
        targetLine(p)),
      h('p', { id: 'paperStats', class: 'paper-stats muted', text: statsText(p) }));
  }

  function tabs() {
    const list = [['chat', 'tabChat'], ['write', 'tabWrite'], ['journals', 'tabJournals'], ['meta', 'tabMeta'], ['fit', 'tabFit']];
    return h('div', { class: 'seg-control paper-tabs', role: 'group', 'aria-label': t('title') },
      list.map(([id, k]) => h('button', { type: 'button', 'data-tab': id, 'aria-pressed': String(view.tab === id), onclick: () => { view.tab = id; renderBody(); }, text: t(k) })));
  }

  /* ----- Write tab ----- */
  function writeTab(p) {
    const sec = sectionOf(p, view.section);
    const chips = h('div', { class: 'sec-chips', role: 'group', 'aria-label': t('tabWrite') },
      SECTIONS.map(k => h('button', { type: 'button', class: 'sec-chip' + (k === view.section ? ' active' : ''), 'aria-pressed': String(k === view.section),
        onclick: () => { view.section = k; renderBody(); } },
        h('span', { text: t('sec.' + k) }), h('small', { id: 'chipCount-' + k, text: fmt(words(sectionOf(p, k).content)) }))));
    const count = h('span', { id: 'secWords', class: 'muted small-note', text: t('words', { n: fmt(words(sec.content)) }) });
    const editor = h('textarea', { id: 'paperSection', class: 'paper-editor', rows: 14, placeholder: t('secPh', { s: t('sec.' + view.section).toLowerCase() }), value: sec.content,
      'aria-label': t('sec.' + view.section),
      oninput: e => {
        sec.content = e.target.value; touch(p);
        const n = words(sec.content);
        count.textContent = t('words', { n: fmt(n) });
        const c = $('#chipCount-' + view.section); if (c) c.textContent = fmt(n);
        updateStats(p);
      } });
    const kw = view.section === 'abstract'
      ? h('label', { class: 'form-field' }, h('span', { text: t('keywords') }), h('input', { id: 'paperKeywords', value: p.keywords || '', maxLength: 400, placeholder: t('keywordsPh'), oninput: e => { p.keywords = e.target.value; touch(p); } }))
      : null;
    const empty = !SECTIONS.some(k => sectionOf(p, k).content.trim());
    return h('div', { class: 'paper-write' },
      empty ? h('div', { class: 'card write-empty' }, h('span', { text: t('cEmptyWrite') }), h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { view.tab = 'chat'; renderBody(); } }, '💬 ', t('cOpenChat'))) : null,
      chips,
      h('div', { class: 'card paper-section' },
        h('div', { class: 'ps-head' }, h('h2', { text: t('sec.' + view.section) }), count),
        h('p', { class: 'muted small-note', text: t('guide.' + view.section) }),
        kw, editor, handoffRow(p)),
      citeBox(p),
      refsBox(p),
      h('div', { class: 'tool-row paper-actions' },
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => exportDocx(p) }, '↓ ', t('exportDocx')),
        h('button', { type: 'button', class: 'btn btn-outline btn-danger', onclick: () => deletePaper(p) }, t('del'))));
  }

  function citeBox(p) {
    const busy = view.busy === 'cite';
    const idea = h('textarea', { id: 'paperIdea', rows: 3, maxLength: 3000, placeholder: t('citePh'), value: view.citeIdea || '', oninput: e => { view.citeIdea = e.target.value; } });
    const result = view.cite && view.cite.paperId === p.id ? h('div', { class: 'conversion-result' },
      h('textarea', { rows: 7, value: view.cite.text, 'aria-label': t('citeTitle'), oninput: e => { view.cite.text = e.target.value; } }),
      view.cite.refs.length ? h('ol', { class: 'paper-refs-list small' }, view.cite.refs.map(r => h('li', { text: r.apa }))) : null,
      view.cite.warnings.length ? h('p', { class: 'result-notes', text: view.cite.warnings.join(' ') }) : null,
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => insertCite(p) }, t('insertInto', { s: t('sec.' + view.section) })),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { view.cite = null; renderBody(); }, text: t('discard') }))) : null;
    return h('div', { class: 'card paper-cite' },
      h('h3', {}, '✨ ', t('citeTitle')), h('p', { class: 'muted small-note', text: t('citeBody') }),
      idea,
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: !!view.busy, onclick: () => doCite(p) }, t('citeBtn')),
        busy ? h('span', { class: 'chat-activity', role: 'status', text: t('citeBusy') }) : null),
      result);
  }

  function refsBox(p) {
    const refs = (p.references || []).slice().sort((a, b) => String(a.apa).localeCompare(String(b.apa)));
    return h('details', { class: 'card paper-refs', open: refs.length ? true : null },
      h('summary', {}, h('strong', { text: t('refs') }), ' ', h('span', { class: 'nav-count', text: fmt(refs.length) })),
      refs.length
        ? h('ol', { class: 'paper-refs-list' }, refs.map(r => h('li', {}, h('span', { text: r.apa }), ' ',
            h('button', { type: 'button', class: 'btn-reset ref-x', 'aria-label': t('remove'), title: t('remove'), onclick: () => { p.references = p.references.filter(x => x !== r); touch(p); renderBody(); } }, '×'))))
        : h('p', { class: 'muted small-note', text: t('noRefs') }),
      h('div', { class: 'tool-row' },
        refs.length ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => copyText(refs.map(r => r.apa).join('\n'), t('copied')), text: t('copyRefs') }) : null,
        refImport(p)));
  }
  function refImport(p) {
    const input = h('input', { type: 'file', accept: '.ris,.bib,.bibtex,.txt,.nbib', hidden: true, onchange: async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      const I = window.TalkademicRefImport;
      const out = I.parse(await f.text(), /melayu|malay/i.test(p.language || '') ? 'ms' : 'en');
      if (!out.refs.length) { App.toast(t('importNone')); return; }
      if (!Array.isArray(p.references)) p.references = [];
      const r = I.merge(p.references, out.refs, App.date());
      touch(p); renderBody();
      App.toast(t('importedRefs', { a: r.added, s: r.skipped }));
    } });
    return [h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => input.click() }, '↑ ', t('importRefs')), input];
  }

  /* ----- Target journal tab ----- */
  function journalsTab(p) {
    const busy = view.busy === 'journals';
    const res = p.journals;
    const manual = h('input', { id: 'manualJournal', maxLength: 300, placeholder: t('jManualPh'), value: view.manual, oninput: e => { view.manual = e.target.value; } });
    return h('div', { class: 'paper-journals' },
      h('p', { class: 'muted', text: t('jIntro') }),
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: !!view.busy, onclick: () => findJournals(p) }, '🔍 ', t('jFind')),
        h('label', { class: 'switch-row inline' }, h('input', { type: 'checkbox', checked: view.recent, onchange: e => { view.recent = e.target.checked; } }), ' ', t('jRecent')),
        busy ? h('span', { class: 'chat-activity', role: 'status', text: t('jBusy') }) : null),
      res && res.items ? h('p', { class: 'small-note muted', text: res.items.length ? t('jFound', { n: res.items.length, m: fmt(res.searched) }) : t('jNone') }) : null,
      res && res.items ? h('div', { class: 'journal-list' }, res.items.map(j => journalCard(p, j))) : null,
      h('div', { class: 'card paper-manual' },
        h('label', { class: 'form-field' }, h('span', { text: t('jManual') }), manual),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => setManual(p) }, t('jSet'))),
      h('p', { class: 'result-notes', text: t('jNote') }));
  }

  function journalCard(p, j) {
    const isTarget = p.target && p.target.id === j.id;
    const metrics = [
      j.h !== null ? 'h-index ' + fmt(j.h) : null,
      j.impact !== null ? t('jImpact') + ' ' + j.impact : null,
      j.oa ? t('jOA') : t('jSub'),
      j.apc ? t('jApc', { n: fmt(j.apc) }) : t('jNoApc')
    ].filter(Boolean);
    return h('article', { class: 'journal-card' + (isTarget ? ' is-target' : '') },
      h('div', { class: 'jc-top' }, h('h3', { text: j.name }), h('span', { class: 'jc-pill', text: t('jMatches', { n: j.matches }) })),
      h('p', { class: 'jc-pub muted', text: [j.publisher, j.issn ? 'ISSN ' + j.issn : ''].filter(Boolean).join(' · ') }),
      h('div', { class: 'jc-metrics' }, metrics.map(m => h('span', { text: m }))),
      j.badges && j.badges.length ? h('div', { class: 'jc-badges' }, j.badges.map(b => h('span', { class: 'jc-badge', text: b }))) : null,
      j.topics && j.topics.length ? h('p', { class: 'jc-small', text: t('jTopics') + j.topics.slice(0, 3).join(' · ') }) : null,
      j.samples && j.samples[0] ? h('p', { class: 'jc-small muted', text: t('jSample') + j.samples[0].title + (j.samples[0].year ? ' (' + j.samples[0].year + ')' : '') }) : null,
      h('div', { class: 'jc-actions' },
        h('button', { type: 'button', class: 'btn ' + (isTarget ? 'btn-outline' : 'btn-primary'), disabled: isTarget, onclick: () => setTarget(p, j), text: isTarget ? t('jIsTarget') : t('jPick') }),
        h('a', { class: 'btn-reset text-action', href: j.scimago, target: '_blank', rel: 'noopener noreferrer', text: t('jScimago') + ' ↗' }),
        j.homepage ? h('a', { class: 'btn-reset text-action', href: j.homepage, target: '_blank', rel: 'noopener noreferrer', text: t('jSite') + ' ↗' }) : null));
  }

  /* ----- Abstract & title tab ----- */
  function metaTab(p) {
    const busy = view.busy === 'meta', m = p.meta;
    const part = (k, v) => v ? h('div', { class: 'abs-part' }, h('strong', { text: t(k) }), h('p', { text: v })) : null;
    return h('div', { class: 'paper-meta' },
      h('p', { class: 'muted', text: t('mIntro') }),
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: !!view.busy, onclick: () => genMeta(p) }, '✨ ', t('mGen')),
        busy ? h('span', { class: 'chat-activity', role: 'status', text: t('mBusy') }) : null),
      m ? h('div', { class: 'card meta-block' }, h('h3', { text: t('mAbstract') }),
        part('aPurpose', m.abstract.purpose), part('aMethod', m.abstract.method), part('aFindings', m.abstract.findings), part('aOriginality', m.abstract.originality),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => useAbstract(p) }, t('mUseAbstract'))) : null,
      m && m.titles.length ? h('div', { class: 'card meta-block' }, h('h3', { text: t('mTitles') }),
        h('ol', { class: 'title-options' }, m.titles.map(x => h('li', {}, h('span', { text: x }),
          h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { p.title = x; touch(p); render(); App.toast(t('mUsed')); }, text: t('mUse') }))))) : null,
      m && m.keywords.length ? h('div', { class: 'card meta-block' }, h('h3', { text: t('mKeywords') }),
        h('div', { class: 'jc-badges' }, m.keywords.map(k => h('span', { class: 'chip', text: k }))),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { p.keywords = m.keywords.join('; '); touch(p); App.toast(t('mUsed')); }, text: t('mUseKw') })) : null,
      m ? h('p', { class: 'result-notes', text: t('mNote') }) : null);
  }

  /* ----- Readiness tab ----- */
  function quickChecks(p) {
    const st = stats(p);
    const empty = SECTIONS.filter(k => !sectionOf(p, k).content.trim()).map(k => t('sec.' + k));
    const absW = words(sectionOf(p, 'abstract').content), titleW = words(p.title);
    const kws = String(p.keywords || '').split(/[;,]/).map(s => s.trim()).filter(Boolean).length;
    return [
      [!empty.length, empty.length ? t('qc.sectionsBad', { s: empty.join(', ') }) : t('qc.sections')],
      [absW >= 150 && absW <= 300, absW >= 150 && absW <= 300 ? t('qc.abstract') : t('qc.abstractBad', { n: absW })],
      [titleW > 0 && titleW <= 20, titleW > 0 && titleW <= 20 ? t('qc.title') : t('qc.titleBad', { n: titleW })],
      [kws >= 4 && kws <= 8, kws >= 4 && kws <= 8 ? t('qc.keywords') : t('qc.keywordsBad', { n: kws })],
      [st.refs >= 40, st.refs >= 40 ? t('qc.refs') : t('qc.refsBad', { n: st.refs })],
      [st.recentPct !== null && st.recentPct >= 50, st.recentPct !== null && st.recentPct >= 50 ? t('qc.recent') : t('qc.recentBad', { p: st.recentPct === null ? 0 : st.recentPct })],
      [!!p.target, p.target ? t('qc.target') : t('qc.targetBad')],
      [!markers(p), markers(p) ? t('qc.markersBad', { n: markers(p) }) : t('qc.markers')]
    ];
  }

  function fitTab(p) {
    const busy = view.busy === 'fit', f = p.fit;
    const stale = f && p.updated && f.at && new Date(p.updated) > new Date(f.at);
    const goSection = key => { if (SECTIONS.includes(key)) { view.section = key; view.tab = 'write'; renderBody(); } else if (key === 'title' || key === 'keywords') { view.section = 'abstract'; view.tab = 'write'; render(); } };
    return h('div', { class: 'paper-fit' },
      h('p', { class: 'muted', text: t('fIntro') }),
      h('div', { class: 'card' }, h('h3', { text: t('fQuick') }),
        h('ul', { class: 'quick-checks' }, quickChecks(p).map(([ok, text]) => h('li', { class: ok ? 'ok' : 'bad' }, h('span', { 'aria-hidden': 'true', text: ok ? '✓' : '!' }), ' ', text)))),
      reviewHandoff(p),
      h('p', { class: 'small-note muted', text: p.target ? t('fFor', { n: p.target.name }) : t('fGeneral') }),
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: !!view.busy, onclick: () => checkFit(p) }, '🩺 ', t('fGo')),
        busy ? h('span', { class: 'chat-activity', role: 'status', text: t('fBusy') }) : null),
      f ? h('div', { class: 'card fit-result' },
        stale ? h('p', { class: 'result-notes', text: t('fStale') }) : null,
        h('div', { class: 'fit-head' },
          h('span', { class: 'ready-badge ready-' + f.result.readiness, text: t('ready.' + f.result.readiness) }),
          h('span', { class: 'muted small-note', text: t('scope.' + f.result.scopeFit.level) + (f.target ? ' · ' + f.target : '') })),
        h('p', { text: f.result.summary }),
        f.result.scopeFit.reason ? h('p', { class: 'muted small-note', text: f.result.scopeFit.reason }) : null,
        h('ol', { class: 'issue-list' }, f.result.issues.map(i => h('li', { class: 'issue pri-' + i.priority },
          h('div', { class: 'issue-head' }, h('span', { class: 'pri', text: t('pri.' + i.priority) }), h('strong', { text: t('sec.' + i.section) })),
          i.problem ? h('p', { text: i.problem }) : null,
          i.fix ? h('p', { class: 'issue-fix' }, h('strong', { text: t('fix') }), i.fix) : null,
          (SECTIONS.includes(i.section) || i.section === 'title' || i.section === 'keywords') ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => goSection(i.section), text: t('openSec') + ' →' }) : null))),
        f.result.strengths.length ? h('div', {}, h('h3', { text: t('strengths') }), h('ul', { class: 'strength-list' }, f.result.strengths.map(s => h('li', { text: s })))) : null) : null);
  }

  /* ---------- actions ---------- */
  async function run(kind, fn) {
    if (view.busy) return;
    view.busy = kind; renderBody();
    try { await fn(); } catch (e) { App.toast(e.message || 'Error'); } finally { view.busy = ''; renderBody(); }
  }

  async function doCite(p) {
    const idea = String(view.citeIdea || '').trim();
    if (idea.length < 4 || await needAI()) return;
    run('cite', async () => {
      const data = await App.apiPost('/api/cite', {
        idea, recentOnly: true, chapter: 'Journal article', section: paperLabel(view.section, p),
        project: { title: p.title, language: p.language, citation: 'APA 7', degree: 'Journal article', university: '', objectives: '', questions: '', context: p.target ? 'Target journal: ' + p.target.name : '' }
      });
      view.cite = { paperId: p.id, text: String(data.academicText || ''), refs: Array.isArray(data.references) ? data.references : [], warnings: Array.isArray(data.warnings) ? data.warnings : [] };
    });
  }

  function insertCite(p) {
    if (!view.cite) return;
    const sec = sectionOf(p, view.section);
    sec.content = (sec.content.trim() ? sec.content.trim() + '\n\n' : '') + view.cite.text.trim();
    if (!Array.isArray(p.references)) p.references = [];
    const key = r => String(r.doi || r.apa || '').toLowerCase();
    let added = 0;
    for (const r of view.cite.refs) { if (r && r.apa && !p.references.some(x => key(x) === key(r))) { p.references.push(r); added++; } }
    view.cite = null; view.citeIdea = '';
    touch(p); renderBody();
    App.toast(t('citeAdded', { n: added }));
  }

  async function findJournals(p) {
    const abstract = sectionOf(p, 'abstract').content || sectionOf(p, 'introduction').content.slice(0, 2500);
    if (words(p.title) < 2 && words(abstract) < 8) { App.toast(t('jNeed')); return; }
    if (await needAI()) return;
    run('journals', async () => {
      const data = await App.apiPost('/api/journals', { title: p.title, abstract: abstract.slice(0, 3000), keywords: p.keywords || '', recentOnly: view.recent });
      p.journals = { at: new Date().toISOString(), items: Array.isArray(data.journals) ? data.journals : [], searched: data.searched || 0 };
      App.save();
    });
  }

  function setTarget(p, j) {
    p.target = { id: j.id, name: j.name, publisher: j.publisher || '', issn: j.issn || '', h: j.h, impact: j.impact, oa: !!j.oa, apc: j.apc || null, badges: j.badges || [], topics: j.topics || [], scimago: j.scimago || '', homepage: j.homepage || '' };
    touch(p); render();
    App.toast(t('jPicked', { n: j.name }));
  }

  function setManual(p) {
    const name = String(view.manual || '').trim().slice(0, 300);
    if (name.length < 3) return;
    setTarget(p, { id: 'manual:' + name.toLowerCase(), name, publisher: '', issn: '', h: null, impact: null, oa: false, apc: null, badges: [], topics: [], scimago: 'https://www.scimagojr.com/journalsearch.php?q=' + encodeURIComponent(name), homepage: '' });
    view.manual = '';
  }

  async function genMeta(p) {
    if (await needAI()) return;
    run('meta', async () => {
      const data = await App.apiPost('/api/paper', { mode: 'meta', paper: payload(p) });
      p.meta = data.meta; App.save();
    });
  }

  function abstractText(p, m) {
    const L = S[isMs(p) ? 'ms' : 'en'];
    return [['aPurpose', m.purpose], ['aMethod', m.method], ['aFindings', m.findings], ['aOriginality', m.originality]]
      .filter(([, v]) => v).map(([k, v]) => L[k] + ': ' + v).join('\n\n');
  }
  function useAbstract(p) {
    const m = p.meta && p.meta.abstract;
    if (!m) return;
    const text = abstractText(p, m);
    const sec = sectionOf(p, 'abstract');
    if (sec.content.trim() && !confirm(t('mReplace'))) return;
    sec.content = text; touch(p);
    view.tab = 'write'; view.section = 'abstract'; renderBody();
    App.toast(t('mUsed'));
  }

  async function checkFit(p) {
    if (await needAI()) return;
    run('fit', async () => {
      const data = await App.apiPost('/api/paper', { mode: 'fit', paper: payload(p), target: p.target, uiLang: lang() });
      p.fit = { at: new Date().toISOString(), target: data.target || null, result: data.fit };
      App.save();
    });
  }

  function deletePaper(p) {
    if (!confirm(t('delConfirm', { t: p.title.trim() || t('untitled') }))) return;
    const s = store();
    s.papers = s.papers.filter(x => x !== p);
    s.activePaper = s.papers[0] ? s.papers[0].id : null;
    App.save(); render(); App.toast(t('deleted'));
  }

  async function copyText(text, done) {
    try { await navigator.clipboard.writeText(text); App.toast(done); } catch (e) { App.toast(text.slice(0, 80) + '…'); }
  }

  async function exportDocx(p) {
    const ms = isMs(p);
    const chapters = SECTIONS.map(k => [k, sectionOf(p, k).content.trim()]).filter(([, c]) => c).map(([k, c]) => ({
      title: paperLabel(k, p),
      sections: [{ title: '', content: k === 'abstract' && p.keywords ? c + '\n\n' + (ms ? 'Kata kunci: ' : 'Keywords: ') + p.keywords : c }]
    }));
    const doc = { project: { title: p.title.trim() || t('untitled'), university: p.target ? (ms ? 'Jurnal sasaran: ' : 'Target journal: ') + p.target.name : '', degree: '', language: p.language }, chapters, references: p.references || [] };
    try {
      const figures = window.TalkademicFramework ? await window.TalkademicFramework.docxFigures(chapters.map(c => c.sections[0].content)) : {};
      const blob = window.ThesTalkDocx.makeDocument(doc, { figures });
      const name = (p.title || 'Talkademic_Paper').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_').slice(0, 64) || 'Talkademic_Paper';
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name + '.docx'; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { App.toast(e.message); }
  }

  /* ---------- Sembang → Paper penuh ---------- */
  const MARKER = /\[(?:PERLU RUJUKAN|SOURCE NEEDED|DAPATAN[^\]]*|FINDING[^\]]*|[A-Z][A-Z /]{3,})\]/g;
  function markers(p) { return SECTIONS.reduce((n, k) => n + (sectionOf(p, k).content.match(MARKER) || []).length, 0); }
  function chatIdeas(p) {
    const s = App.state(), done = new Set(p.importedIds || []);
    return [...(s.messages || []), ...(s.casualMessages || [])].filter(m => m && m.role === 'user' && m.text && String(m.text).trim().length > 8 && !done.has(m.id));
  }
  function addNote(p, text) {
    const v = String(text || '').trim();
    if (!v) return;
    if (!Array.isArray(p.notes)) p.notes = [];
    p.notes.push({ id: App.uid(), text: v.slice(0, 1500) });
    touch(p);
  }
  function mergeRefs(p, refs) {
    if (!Array.isArray(p.references)) p.references = [];
    const key = r => String(r.doi || r.apa || '').toLowerCase();
    let added = 0;
    for (const r of Array.isArray(refs) ? refs : []) { if (r && r.apa && !p.references.some(x => key(x) === key(r))) { p.references.push(r); added++; } }
    return added;
  }

  /* Chat tab: each casual remark is sorted into a section by the AI (section, element, formal
     sentence, follow-up question). The sorted remarks then feed "Build the full paper". */
  const ALL_SECS = ['introduction', 'literature', 'method', 'results', 'discussion', 'conclusion'];
  function sortedNotes(p) { return (p.notes || []).filter(n => n.section && !n.pending); }
  async function sortNote(p, note, ask) {
    if (!App.aiAvailable() && !(ask && await App.ensureAI())) { note.failed = true; note.pending = false; touch(p); renderBody(); return; }
    note.pending = true; note.failed = false; renderBody();
    const counts = Object.fromEntries(ALL_SECS.map(k => [k, 0]));
    sortedNotes(p).forEach(n => { if (counts[n.section] !== undefined) counts[n.section]++; });
    try {
      const data = await App.apiPost('/api/draft', { mode: 'sort', remark: note.text, title: p.title, language: p.language,
        empty: ALL_SECS.filter(k => !counts[k]), recent: sortedNotes(p).filter(n => n !== note).slice(-6).map(n => ({ section: n.section, text: n.text })) });
      Object.assign(note, { section: data.sorted.section, part: data.sorted.part, formal: data.sorted.formal, ask: data.sorted.ask, pending: false, failed: false });
    } catch (e) {
      note.pending = false; note.failed = true;
    }
    touch(p); renderBody();
  }
  function sendNote(p, text) {
    const v = String(text || '').trim();
    if (!v) return;
    if (!Array.isArray(p.notes)) p.notes = [];
    const note = { id: App.uid(), text: v.slice(0, 1500) };
    p.notes.push(note);
    view.note = '';
    touch(p);
    sortNote(p, note, true);
  }
  function chatTab(p) {
    const notes = Array.isArray(p.notes) ? p.notes : [];
    const busy = view.busy === 'draft';
    const counts = Object.fromEntries(ALL_SECS.map(k => [k, 0]));
    sortedNotes(p).forEach(n => { if (counts[n.section] !== undefined) counts[n.section]++; });
    const lastSorted = [...notes].reverse().find(n => n.section && !n.pending);
    const box = h('textarea', { id: 'noteInput', rows: 2, maxLength: 1500, placeholder: t('cPh'), value: view.note, 'aria-label': t('cPh'),
      oninput: e => { view.note = e.target.value; },
      onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } } });
    function send() { sendNote(p, box.value); setTimeout(() => { const el = $('#noteInput'); if (el) el.focus(); }, 0); }
    const listening = !!(shell().micOn && shell().micOn('paper-note'));
    const mic = h('button', { id: 'noteMic', type: 'button', class: 'icon-btn voice-btn' + (listening ? ' recording' : ''), 'aria-pressed': String(listening), 'aria-label': t('dMic'), title: t('dMic'),
      onclick: () => { if (shell().mic) shell().mic(() => $('#noteMic'), () => $('#noteAct'), () => $('#noteInput'), null, { key: 'paper-note' }); } }, '🎙');
    if (listening) setTimeout(() => { const a = $('#noteAct'); if (a && !a.textContent) a.textContent = shell().t ? shell().t('voice.listening') : ''; }, 0);
    const bot = (...kids) => h('li', { class: 'pc-bot' }, h('span', { class: 'pc-avatar', 'aria-hidden': 'true' }, '✦'), h('div', { class: 'pc-bubble' }, ...kids));
    const items = [bot(h('p', { text: t('cGreet') }))];
    for (const n of notes) {
      items.push(h('li', { class: 'pc-user' }, h('div', { class: 'pc-bubble' }, h('p', { text: n.text })),
        h('button', { type: 'button', class: 'btn-reset ref-x', 'aria-label': t('dRemove'), title: t('dRemove'), disabled: busy, onclick: () => { p.notes = p.notes.filter(x => x !== n); touch(p); renderBody(); } }, '×')));
      if (n.pending) items.push(bot(h('p', { class: 'pc-typing', text: t('cSorting') })));
      else if (n.failed || !n.section) items.push(bot(h('p', { class: 'muted', text: t('cUnsorted') + ' ' }, h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => sortNote(p, n, true), text: t('cRetry') }))));
      else {
        const move = h('select', { class: 'pc-move', 'aria-label': t('cMove'), onchange: e => { n.section = e.target.value; touch(p); renderBody(); } },
          [...ALL_SECS, 'other'].map(k => h('option', { value: k, text: t('sec.' + k) })));
        move.value = n.section;
        items.push(bot(
          h('div', { class: 'pc-tag' }, h('span', { 'aria-hidden': 'true' }, '📍'), move, n.part ? h('span', { class: 'pc-part', text: n.part }) : null),
          n.formal ? h('p', { class: 'pc-formal', text: n.formal }) : null,
          n === lastSorted && n.ask ? h('p', { class: 'pc-ask', text: n.ask }) : null));
      }
    }
    const progress = view.progress && view.progress.paperId === p.id ? h('ol', { class: 'draft-steps' }, view.progress.steps.map(st => h('li', { class: 'step-' + st.s },
      h('span', { class: 'step-dot', 'aria-hidden': 'true', text: st.s === 'done' ? '✓' : st.s === 'fail' ? '!' : st.s === 'doing' ? '…' : '' }), ' ', st.label))) : null;
    const fromChat = chatIdeas(p);
    const list = h('ol', { id: 'paperChat', class: 'paper-chat', 'aria-live': 'polite' }, items);
    setTimeout(() => { const el = $('#paperChat'); if (el) el.scrollTop = el.scrollHeight; }, 0);
    return h('div', { class: 'paper-chat-tab' },
      h('div', { class: 'outline-row', role: 'list', 'aria-label': t('cOutline') },
        h('span', { class: 'outline-label', text: t('cOutline') }),
        ALL_SECS.map(k => h('span', { role: 'listitem', class: 'outline-chip' + (counts[k] ? ' has' : '') }, t('sec.' + k), ' ', h('b', { text: String(counts[k]) })))),
      h('div', { class: 'card pc-card' },
        list,
        h('div', { class: 'note-compose' }, box, mic, h('button', { type: 'button', class: 'btn btn-primary pc-send', disabled: busy, 'aria-label': t('cSend'), onclick: send }, t('cSend'))),
        h('span', { id: 'noteAct', class: 'chat-activity', role: 'status' }),
        h('div', { class: 'tool-row' },
          fromChat.length ? h('button', { type: 'button', class: 'btn-reset text-action', disabled: busy, onclick: () => importChat(p), text: t('dImport', { n: fromChat.length }) }) : null,
          p.prevDraft && !busy ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => undoDraft(p), text: t('dUndo') }) : null)),
      h('button', { type: 'button', class: 'btn btn-primary draft-go', disabled: !!view.busy, onclick: () => generatePaper(p) }, '✨ ', t('cGen')),
      progress,
      h('p', { class: 'result-notes', text: t('dNote') }));
  }

  function importChat(p) {
    const list = chatIdeas(p);
    if (!list.length) return;
    if (!Array.isArray(p.importedIds)) p.importedIds = [];
    list.forEach(m => { addNote(p, m.text); p.importedIds.push(m.id); });
    touch(p); renderBody();
    (async () => { for (const n of p.notes.filter(x => !x.section && !x.pending)) await sortNote(p, n, false); })();
    App.toast(t('dImported', { n: list.length }));
  }

  function undoDraft(p) {
    const prev = p.prevDraft;
    if (!prev || !confirm(t('dUndoConfirm'))) return;
    p.title = prev.title; p.keywords = prev.keywords; p.references = prev.references || [];
    for (const s of prev.sections || []) sectionOf(p, s.key).content = s.content;
    p.prevDraft = null; view.progress = null;
    touch(p); render();
    App.toast(t('dUndone'));
  }

  async function generatePaper(p) {
    const notes = (p.notes || []).filter(n => n.text && n.section !== 'other').map(n => (n.section && ALL_SECS.includes(n.section) ? '[' + n.section + '] ' : '') + n.text + (n.formal ? ' (' + n.formal + ')' : ''));
    if (notes.length < 2) { App.toast(t('dNeed')); return; }
    if (await needAI()) return;
    const hasContent = SECTIONS.some(k => sectionOf(p, k).content.trim());
    if (hasContent && !confirm(t('dReplace'))) return;
    const order = ['introduction', 'literature', 'method', 'results', 'discussion', 'conclusion'];
    view.progress = { paperId: p.id, steps: [{ k: 'plan', label: t('dStepPlan'), s: 'doing' }, ...order.map(k => ({ k, label: t('dStepSection', { s: t('sec.' + k) }), s: 'wait' })), { k: 'abstract', label: t('dStepAbstract'), s: 'wait' }] };
    const step = (k, s) => { const x = view.progress.steps.find(i => i.k === k); if (x) x.s = s; renderBody(); };
    run('draft', async () => {
      p.prevDraft = { at: new Date().toISOString(), title: p.title, keywords: p.keywords, sections: SECTIONS.map(k => ({ key: k, content: sectionOf(p, k).content })), references: (p.references || []).slice() };
      const target = p.target ? p.target.name : '';
      let at = 'plan';
      try {
        const plan = await App.apiPost('/api/draft', { mode: 'plan', remarks: notes, title: p.title, language: p.language, target });
        if (!p.title.trim() && plan.plan && plan.plan.title) p.title = plan.plan.title;
        SECTIONS.forEach(k => { sectionOf(p, k).content = ''; });
        p.references = [];
        touch(p); step('plan', 'done');
        for (const k of order) {
          at = k; step(k, 'doing');
          const out = await App.apiPost('/api/draft', { mode: 'section', section: k, points: (plan.plan.sections || {})[k] || [], papers: plan.papers || [], title: p.title, language: p.language, target });
          sectionOf(p, k).content = String(out.text || '');
          mergeRefs(p, out.references);
          touch(p); step(k, 'done');
        }
        at = 'abstract'; step('abstract', 'doing');
        const meta = await App.apiPost('/api/paper', { mode: 'meta', paper: payload(p) });
        p.meta = meta.meta;
        if (meta.meta && meta.meta.abstract) sectionOf(p, 'abstract').content = abstractText(p, meta.meta.abstract);
        if (meta.meta && meta.meta.keywords && meta.meta.keywords.length && !String(p.keywords || '').trim()) p.keywords = meta.meta.keywords.join('; ');
        touch(p); step('abstract', 'done');
        view.section = 'introduction'; view.tab = 'write';
        const st = stats(p);
        App.toast(t('dDone', { w: fmt(st.words), r: fmt(st.refs) }));
        setTimeout(render, 0); // title may have changed
      } catch (e) {
        step(at, 'fail');
        const label = (view.progress.steps.find(i => i.k === at) || {}).label || at;
        throw new Error(t('dFail', { s: label, e: e.message || '' }));
      }
    });
  }

  /* ---------- Hand-off to the user's own ChatGPT / Claude ----------
     No API: the prompt is copied and the app is opened (prefilled when the link is short enough).
     The answer comes back through "Paste result", with an undo and a check for citations that are
     not in the paper's reference list. */
  const APPS = {
    chatgpt: { name: 'ChatGPT', url: q => 'https://chatgpt.com/?q=' + encodeURIComponent(q), home: 'https://chatgpt.com/' },
    claude: { name: 'Claude', url: q => 'https://claude.ai/new?q=' + encodeURIComponent(q), home: 'https://claude.ai/new' },
    // Gemini (e.g. the free UiTM / Workspace for Education account) has no prefill link, so the text is pasted.
    gemini: { name: 'Gemini', url: () => 'https://gemini.google.com/app', home: 'https://gemini.google.com/app' }
  };
  const ACTIONS = {
    polish: 'Polish this section for an indexed Q1–Q2 journal: sharpen the argument, flow, clarity and academic tone.',
    expand: 'Expand this section by about 30–50% with deeper argument and explanation. Mark any new claim that needs evidence with {marker}.',
    shorten: 'Make this section about 30% shorter without losing key points or any citation.',
    grammar: 'Correct grammar, spelling, punctuation and word choice only. Do not change the content.',
    translate: 'Translate this section into {other}, in formal academic style, keeping all citations exactly.'
  };
  function copyNow(text) {
    let done = false;
    try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); done = document.execCommand('copy'); ta.remove(); } catch (e) { /* fall back below */ }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
    return done;
  }
  function openApp(app, prompt) {
    copyNow(prompt);
    const a = APPS[app];
    const link = a.url(prompt);
    window.open(link.length <= 6000 ? link : a.home, '_blank', 'noopener');
    App.toast(t(app === 'gemini' ? 'xOpenedGemini' : 'xOpened', { a: a.name }));
  }
  function sectionPrompt(p, key, action) {
    const ms = isMs(p);
    const instr = ACTIONS[action].replace('{marker}', ms ? '[PERLU RUJUKAN]' : '[SOURCE NEEDED]').replace('{other}', ms ? 'English' : 'Bahasa Melayu');
    const outLang = action === 'translate' ? (ms ? 'English' : 'Bahasa Melayu') : (ms ? 'Bahasa Melayu (formal academic, Dewan Bahasa dan Pustaka style)' : 'English (formal academic)');
    return [
      'You are an expert academic editor for Scopus/Web of Science indexed journals.',
      'Task: ' + instr,
      'Rules:',
      '- Keep the meaning and every in-text citation exactly as written, for example (Rahman & Lee, 2021). Do not add, remove or change citations or references.',
      '- Do not invent data, numbers, findings or quotations. Keep placeholders such as [PERLU RUJUKAN], [SOURCE NEEDED] or [DAPATAN 1] as they are.',
      '- Write in ' + outLang + '. Return only the revised section as plain paragraphs, with no heading, commentary or markdown.',
      '',
      'Paper title: ' + (p.title || '-'),
      p.target ? 'Target journal: ' + p.target.name : '',
      'Section: ' + paperLabel(key, p),
      '---',
      sectionOf(p, key).content.trim(),
      '---'
    ].filter(x => x !== '').join('\n');
  }
  function reviewPrompt(p) {
    const ms = isMs(p);
    const body = ['abstract', ...SECTIONS.filter(k => k !== 'abstract')].map(k => { const c = sectionOf(p, k).content.trim(); return c ? '## ' + paperLabel(k, p) + '\n' + c : ''; }).filter(Boolean).join('\n\n');
    const refs = (p.references || []).map(r => r.apa).join('\n');
    return [
      'Act as a senior reviewer for ' + (p.target ? p.target.name : 'a Scopus/Web of Science indexed Q1–Q2 journal in this field') + '.',
      'Review the manuscript below. Give: (1) a verdict (ready / minor revision / major revision), (2) the main weaknesses in order of priority, each with the exact part and a concrete fix, (3) strengths, (4) whether it fits the journal\'s scope.',
      'Do not rewrite the paper. Do not invent references; if a claim needs a source, say so.',
      'Answer in ' + (ms ? 'Bahasa Melayu' : 'English') + '.',
      '',
      'Title: ' + (p.title || '-'),
      'Keywords: ' + (p.keywords || '-'),
      '',
      body,
      refs ? '\n## ' + (ms ? 'Rujukan' : 'References') + '\n' + refs : ''
    ].join('\n');
  }

  /* Author–year citations in pasted text that do not match the paper's reference list. */
  function unknownCitations(text, p) {
    const known = new Set();
    for (const r of p.references || []) {
      const y = String(r.year || '').slice(0, 4);
      for (const a of r.authors || []) { const sur = String(a).trim().split(/\s+/).pop(); if (sur) known.add(sur.toLowerCase() + '|' + y); }
      const m = String(r.apa || '').match(/^([^,(]+)/); if (m) known.add(m[1].trim().split(/\s+/).pop().toLowerCase() + '|' + y);
    }
    const found = new Set();
    const check = (sur, year) => { if (!known.has(sur.toLowerCase() + '|' + year)) found.add(sur + ' (' + year + ')'); };
    const reParen = /\(([^()]*?\d{4}[a-z]?[^()]*)\)/g;
    let m;
    while ((m = reParen.exec(text))) {
      for (const part of m[1].split(';')) {
        const c = part.match(/([A-ZÀ-ɏ][\p{L}'’-]+)[^,;]*?,\s*(\d{4})/u);
        if (c) check(c[1], c[2]);
      }
    }
    const reNarr = /([A-ZÀ-ɏ][\p{L}'’-]+)(?:\s+et al\.|\s+(?:&|and|dan)\s+[A-ZÀ-ɏ][\p{L}'’-]+)?\s+\((\d{4})[a-z]?\)/gu;
    while ((m = reNarr.exec(text))) check(m[1], m[2]);
    return [...found].slice(0, 8);
  }

  function handoffRow(p) {
    const key = view.section;
    const sel = h('select', { 'aria-label': t('xAction'), onchange: e => { view.xAction = e.target.value; } },
      Object.keys(ACTIONS).map(k => h('option', { value: k, text: t('xa.' + k) })));
    sel.value = view.xAction;
    const send = app => { if (!sectionOf(p, key).content.trim()) { App.toast(t('xEmpty')); return; } openApp(app, sectionPrompt(p, key, view.xAction)); };
    const paste = view.paste && view.paste.paperId === p.id && view.paste.key === key ? pastePanel(p, key) : null;
    const undo = view.undo && view.undo.paperId === p.id && view.undo.key === key
      ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { sectionOf(p, key).content = view.undo.content; view.undo = null; touch(p); renderBody(); App.toast(t('xUndone')); }, text: t('xUndo') }) : null;
    return h('div', { class: 'handoff' },
      h('p', { class: 'handoff-title' }, h('strong', { text: t('xTitle') })),
      h('p', { class: 'muted small-note', text: t('xHow') }),
      h('div', { class: 'handoff-row' },
        sel,
        h('button', { type: 'button', class: 'btn btn-outline app-btn app-chatgpt', onclick: () => send('chatgpt') }, h('span', { class: 'ai-dot ai-openai', 'aria-hidden': 'true' }), 'ChatGPT'),
        h('button', { type: 'button', class: 'btn btn-outline app-btn app-claude', onclick: () => send('claude') }, h('span', { class: 'ai-dot ai-claude', 'aria-hidden': 'true' }), 'Claude'),
        h('button', { type: 'button', class: 'btn btn-outline app-btn app-gemini', onclick: () => send('gemini') }, h('span', { class: 'ai-dot ai-gemini', 'aria-hidden': 'true' }), 'Gemini'),
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { view.paste = { paperId: p.id, key, text: '' }; renderBody(); setTimeout(() => { const el = $('#pasteBox'); if (el) el.focus(); }, 0); } }, '📋 ', t('xPaste'))),
      undo, paste);
  }

  function pastePanel(p, key) {
    const box = h('textarea', { id: 'pasteBox', rows: 8, placeholder: t('xPastePh'), value: view.paste.text, oninput: e => { view.paste.text = e.target.value; warn(); } });
    const note = h('p', { class: 'result-notes', hidden: true });
    function warn() { const u = unknownCitations(box.value, p); note.hidden = !u.length; note.textContent = u.length ? t('xUnknown', { c: u.join('; ') }) : ''; }
    setTimeout(warn, 0);
    const apply = mode => {
      const text = box.value.replace(/\*\*/g, '').replace(/^#+\s.*$/gm, '').trim();
      if (!text) return;
      const sec = sectionOf(p, key);
      view.undo = { paperId: p.id, key, content: sec.content };
      sec.content = mode === 'append' && sec.content.trim() ? sec.content.trim() + '\n\n' + text : text;
      view.paste = null; touch(p); renderBody();
      App.toast(t('xDone'));
    };
    return h('div', { class: 'conversion-result paste-panel' },
      h('strong', { text: t('xPasteTitle') }),
      box,
      note,
      h('div', { class: 'tool-row' },
        navigator.clipboard && navigator.clipboard.readText ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: async () => { try { box.value = await navigator.clipboard.readText(); view.paste.text = box.value; warn(); } catch (e) { App.toast(t('xClipFail')); } }, text: t('xFromClip') }) : null,
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => apply('replace'), text: t('xReplace') }),
        h('button', { type: 'button', class: 'btn btn-outline', onclick: () => apply('append'), text: t('xAppend') }),
        h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { view.paste = null; renderBody(); }, text: t('xCancel') })));
  }

  function reviewHandoff(p) {
    const send = app => { if (!stats(p).words) { App.toast(t('xEmpty')); return; } openApp(app, reviewPrompt(p)); };
    return h('div', { class: 'card handoff' },
      h('p', { class: 'handoff-title' }, h('strong', { text: t('xReviewTitle') })),
      h('p', { class: 'muted small-note', text: t('xReviewBody') }),
      h('div', { class: 'handoff-row' },
        h('button', { type: 'button', class: 'btn btn-outline app-btn', onclick: () => send('chatgpt') }, h('span', { class: 'ai-dot ai-openai', 'aria-hidden': 'true' }), 'ChatGPT'),
        h('button', { type: 'button', class: 'btn btn-outline app-btn', onclick: () => send('claude') }, h('span', { class: 'ai-dot ai-claude', 'aria-hidden': 'true' }), 'Claude'),
        h('button', { type: 'button', class: 'btn btn-outline app-btn', onclick: () => send('gemini') }, h('span', { class: 'ai-dot ai-gemini', 'aria-hidden': 'true' }), 'Gemini')),
      h('p', { class: 'muted small-note', text: t('xGeminiNote') }));
  }

  /* ---------- Import a Word paper (read on the device) ---------- */
  function importButton() {
    const input = h('input', { type: 'file', accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', hidden: true,
      onchange: e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importPaper(f); } });
    return h('span', { class: 'import-wrap' }, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => input.click() }, '📄 ', t('iImport')), input);
  }
  function guessLanguage(text) {
    const w = String(text).toLowerCase().match(/[a-z]+/g) || [];
    const ms = w.filter(x => ['dan', 'yang', 'ini', 'dalam', 'kajian', 'untuk', 'dengan', 'adalah', 'kepada', 'oleh'].includes(x)).length;
    const en = w.filter(x => ['the', 'and', 'of', 'in', 'to', 'is', 'that', 'this', 'with', 'for'].includes(x)).length;
    return ms > en ? 'Bahasa Melayu' : 'English';
  }
  async function importPaper(file) {
    let parsed;
    try { parsed = await window.TalkademicDocx.read(file); }
    catch (e) { App.toast(t('ie.' + (e.code || 'not-docx'))); return; }
    const m = window.TalkademicDocx.toPaper(parsed);
    const s = store(), now = new Date().toISOString();
    const all = Object.values(m.sections).join(' ');
    const p = { id: App.uid(), title: m.title || String(file.name || '').replace(/\.docx$/i, ''), language: guessLanguage(all), keywords: m.keywords,
      sections: SECTIONS.map(key => ({ key, content: m.sections[key] || '' })), references: m.references, target: null, journals: null, meta: null, fit: null, notes: [], created: now, updated: now };
    s.papers.unshift(p); s.activePaper = p.id;
    view.tab = 'write'; view.cite = null;
    view.section = SECTIONS.find(k => sectionOf(p, k).content.trim()) || 'introduction';
    App.save(); render();
    const filled = SECTIONS.filter(k => sectionOf(p, k).content.trim()).length;
    App.toast(m.recognised
      ? t('iDone', { t: p.title.slice(0, 60), s: filled, w: fmt(stats(p).words), r: m.references.length }) + (m.skipped ? t('iSkipped', { n: m.skipped }) : '')
      : t('iNone'));
  }

  /* ---------- "My Projects" card ---------- */
  function renderProjectsCard() {
    const box = $('#papersCard');
    if (!box) return;
    const list = store().papers;
    box.replaceChildren(...[
      h('div', { class: 'pd-top' }, h('span', { class: 'pd-icon' }, '📄'), h('div', {}, h('h2', { text: t('projTitle') }), h('p', { class: 'muted', text: list.length ? '' : t('projEmpty') }))),
      list.length ? h('ul', { class: 'paper-proj-list' }, list.map(p => {
        const name = p.title.trim() || t('untitled');
        const edit = () => { openPaper(p.id); view.tab = 'write'; shell().go('papers'); };
        return h('li', {},
          h('button', { type: 'button', class: 'btn-reset pp-title', onclick: () => { openPaper(p.id); shell().go('papers'); }, text: name }),
          h('span', { class: 'pp-meta', text: t('projWords', { n: fmt(stats(p).words) }) + ' · ' + (p.target ? t('projTarget', { j: p.target.name }) : t('projNoTarget')) }),
          h('span', { class: 'pp-actions' },
            h('button', { type: 'button', class: 'btn btn-outline btn-mini', onclick: edit, 'aria-label': t('edit') + ': ' + name }, '✏️ ', t('edit')),
            h('button', { type: 'button', class: 'btn btn-outline btn-mini btn-danger', onclick: () => deletePaper(p), 'aria-label': t('del') + ': ' + name }, '🗑 ', t('del'))));
      })) : null,
      h('div', { class: 'pd-actions' }, h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { shell().go('papers'); setTimeout(newPaper, 0); } }, '＋ ', t('new')))].filter(Boolean));
  }

  window.ThesTalkPapers = { render, renderProjectsCard, newPaper, open: (id, key) => { openPaper(id); view.tab = 'write'; if (SECTIONS.includes(key)) view.section = key; }, label: (p, key) => paperLabel(key, p), _test: { unknownCitations, sectionPrompt } };
})();
