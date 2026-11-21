/* Talkademic shell: navigation, dashboard, BM/EN interface, light/dark theme,
   first-run onboarding, casual chat, proofreading, local search.
   Works on top of app.js through window.ThesTalkApp. */
(() => {
  'use strict';
  const App = window.ThesTalkApp;
  if (!App) return;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const UI_KEY = 'thestalk_ui_v1';
  const VIEWS = ['home', 'casual', 'hub', 'academic', 'proofread', 'papers', 'matrix', 'analysis', 'goals', 'slides', 'audit', 'framework', 'survey', 'projects', 'library', 'settings'];

  const ui = Object.assign({ lang: 'ms', theme: 'system', name: '', mode: 'casual', onboarded: false, academicOpen: true, autoSpeak: false, voiceAutoSend: false, ai: 'gemini' }, readUI());
  function readUI() { try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveUI() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) { /* storage unavailable */ } }

  /* ---------- text ---------- */
  const T = {
    ms: {
      'voice.speak': 'Cakap untuk menaip', 'voice.listening': '🎙 Sedang mendengar… tekan lagi untuk berhenti', 'voice.transcribing': '🎙 Menukar suara kepada teks…',
      'voice.unsupported': 'Pelayar ini tidak menyokong input suara. Cuba Chrome.', 'voice.denied': 'Akses mikrofon ditolak. Benarkan mikrofon dalam tetapan pelayar.',
      'tts.listen': 'Dengar', 'tts.listenShort': 'Dengar', 'tts.unsupported': 'Pelayar ini tidak boleh membaca teks dengan suara.', 'tts.empty': 'Tiada teks untuk dibaca.',
      'tts.sample': 'Hai! Ini suara Talkademic. Saya boleh bacakan jawapan dan draf tesis anda.', 'tts.hasMs': 'Suara Bahasa Melayu tersedia ✓', 'tts.noMs': 'Suara Bahasa Melayu tidak dijumpai pada peranti ini.',
      'lib.importLabel': 'Import dari Mendeley / Zotero / EndNote', 'lib.importBtn': 'Import RIS / BibTeX', 'lib.importHelp': 'Di Mendeley/Zotero: pilih rujukan → Export → RIS atau BibTeX. Google Scholar: Cite → BibTeX.', 'lib.imported': '{a} rujukan diimport. {s} sudah ada.', 'lib.importNone': 'Fail ini bukan RIS atau BibTeX, atau tiada rujukan di dalamnya.', 'lib.exportLabel': 'Eksport ke Mendeley / Zotero / EndNote', 'lib.exportHelp': 'Di Mendeley atau Zotero, pilih Import dan pilih fail ini.', 'lib.exportEmpty': 'Belum ada rujukan untuk dieksport.', 'lib.exported': 'Fail {file} dimuat turun.',
      'set.voice': 'Suara', 'set.autoSpeak': 'Baca jawapan AI secara automatik', 'set.voiceSend': 'Hantar terus selepas saya bercakap (Sembang Santai)', 'set.testVoice': 'Uji suara',
      'set.voiceHelp': 'Tiada suara BM? Di Android: Tetapan → Teks-ke-pertuturan → Enjin Google → pasang Bahasa Melayu.',
      'brand.tag': 'Sembang • Belajar • Menyelidik',
      'nav.dashboard': 'Dashboard', 'nav.home': 'Utama', 'nav.casual': 'Sembang', 'nav.academic': 'Akademik', 'nav.academicUp': 'AKADEMIK',
      'hub.title': 'Ruang Akademik', 'hub.sub': 'Semua alat akademik di satu tempat.',
      'hub.thesis': 'Pembantu Tesis', 'hub.thesis.d': 'Tulis bab tesis dengan sokongan AI.', 'hub.research': 'Pembantu Penyelidikan', 'hub.research.d': 'Sembang idea, kemudian tukar kepada tulisan akademik bersitasi.',
      'hub.papers.d': 'Sembang jadi paper penuh, cari jurnal berindeks, semak sebelum hantar.', 'hub.data.d': 'Tampal output SmartPLS / SPSS, dapat penerangan dan bahagian Dapatan.', 'nav.matrix': 'Matriks Literatur', 'nav.goals': 'Sasaran & Peringatan', 'nav.slides': 'Slaid Pembentangan', 'nav.audit': 'Audit Sitasi', 'hub.audit.d': 'Semak sitasi dengan senarai rujukan, tahun, et al. dan DOI.', 'nav.framework': 'Kerangka Konseptual', 'hub.framework.d': 'Lukis konstruk dan anak panah, hipotesis H1, H2… automatik, terus ke tesis.', 'nav.survey': 'Analisis Soal Selidik', 'hub.survey.d': 'Fail CSV Google Forms jadi profil responden, alfa Cronbach, min, korelasi dan Bab 4.', 'hub.slides.d': 'Tesis atau paper jadi slaid bergambar dengan nota penyampai, muat turun PowerPoint.', 'hub.goals.d': 'Sasaran perkataan harian, streak dan kiraan hari ke tarikh akhir.', 'hub.matrix.d': 'Masukkan PDF artikel, dapat matriks, fail Excel dan sintesis bersitasi.', 'hub.writing': 'Penulisan Akademik', 'hub.writing.d': 'Tukar idea santai kepada perenggan akademik.',
      'hub.proof': 'Semakan Bahasa & Gaya', 'hub.proof.d': 'Betulkan tatabahasa dan nada akademik.', 'hub.refs': 'Rujukan & Sitasi', 'hub.refs.d': 'Senarai rujukan tesis, eksport ke Mendeley atau Zotero.',
      'set.role': 'Peranan (pilihan)', 'set.rolePh': 'cth. Penyelidik PhD, UiTM', 'fab.newPaper': 'Paper baharu', 'ob.welcome': 'Selamat datang ke Talkademic',
      'nav.papers': 'Jurnal & Paper', 'card.papers': 'Jurnal & Paper', 'card.papers.d': 'Tulis artikel, cari jurnal berindeks dan semak sebelum hantar.',
      'nav.projects': 'Projek Saya', 'nav.projectsShort': 'Projek', 'nav.library': 'Perpustakaan', 'nav.settings': 'Tetapan', 'nav.profile': 'Profil',
      'del.one': 'Padam', 'del.confirm': 'Padam mesej ini dan balasannya daripada sejarah sembang?', 'del.done': 'Dipadam.', 'del.hide': 'Buang dari senarai', 'recent.clear': 'Kosongkan aktiviti', 'recent.confirmClear': 'Kosongkan semua aktiviti terkini? Ini memadam semua mesej Sembang Santai dan Sembang Akademik. Bab tesis dan paper tidak terjejas.',
      'proj.import': 'Import DOCX',
      'imp.thesisConfirm': 'Import tesis daripada Word: {c} bab, {w} perkataan, {r} rujukan.', 'imp.thesisReplace': 'Bab tesis sedia ada akan diganti. Salinan disimpan: boleh batal di Profil → Backup & pulih → Batalkan pemulihan terakhir.',
      'imp.thesisDone': 'Tesis diimport: {c} bab, {r} rujukan. Semak setiap bab di ruang kerja tesis.',
      'imp.err.old-doc': 'Fail .doc lama tidak disokong. Buka dalam Word dan Simpan Sebagai .docx.', 'imp.err.not-docx': 'Ini bukan fail Word .docx.', 'imp.err.too-large': 'Fail terlalu besar (had 25 MB).',
      'imp.err.empty': 'Tiada teks ditemui dalam dokumen ini.', 'imp.err.old-browser': 'Pelayar ini terlalu lama untuk import. Kemas kini Chrome atau Safari.', 'imp.err.storage': 'Storan pelayar penuh, jadi tesis tidak dapat diimport.',
      'bk.title': 'Backup & pulih', 'bk.body': 'Semua kerja disimpan dalam pelayar ini sahaja. Simpan fail backup, kemudian pulihkan di telefon atau laptop lain.',
      'bk.save': 'Simpan backup', 'bk.share': 'Kongsi', 'bk.restore': 'Pulih dari fail', 'bk.undo': '↶ Batalkan pemulihan terakhir', 'bk.note': 'Kod akses AI tidak termasuk dalam backup.',
      'bk.last': 'Backup terakhir: {d}', 'bk.never': 'Belum pernah backup.', 'bk.saved': 'Backup disimpan: {f}', 'bk.shareFail': 'Tidak dapat berkongsi. Guna Simpan backup.',
      'bk.confirm': 'Pulihkan backup "{t}" ({d})?\n{c} bab · {w} perkataan · {r} rujukan\n\nProjek semasa akan diganti. Salinan disimpan supaya anda boleh batalkan.',
      'bk.unknownDate': 'tarikh tidak diketahui', 'bk.noUndo': 'Ruang storan tidak cukup untuk simpan salinan batal. Teruskan tanpa salinan?',
      'bk.restored': 'Backup dipulihkan.', 'bk.undoConfirm': 'Kembalikan projek seperti sebelum pemulihan terakhir?', 'bk.undone': 'Pemulihan dibatalkan.',
      'bk.err.empty': 'Fail itu kosong.', 'bk.err.not-json': 'Ini bukan fail backup Talkademic.', 'bk.err.not-thestalk': 'Ini bukan fail backup Talkademic.', 'bk.err.too-large': 'Fail terlalu besar.',
      'bk.err.newer-format': 'Backup ini dari versi Talkademic yang lebih baharu. Muat semula app dan cuba lagi.', 'bk.err.storage': 'Storan pelayar penuh, jadi backup tidak dapat dipulihkan.',
      'bk.nudgeNever': 'Kerja anda hanya ada dalam pelayar ini. Simpan backup supaya tidak hilang.', 'bk.nudgeOld': 'Backup terakhir {n} hari lalu. Simpan yang baharu?', 'bk.saveNow': 'Backup sekarang',
      'theme.toggle': 'Tukar tema', 'saved.title': 'Disimpan pada peranti ini', 'saved.body': 'Kandungan kekal dalam pelayar ini sahaja. Simpan backup di Tetapan supaya tidak hilang.',
      'search.label': 'Cari dalam Talkademic', 'search.ph': 'Cari dalam Talkademic…', 'search.empty': 'Tiada hasil untuk carian ini.',
      'search.casual': 'Sembang', 'search.academic': 'Sembang akademik', 'search.section': 'Seksyen tesis', 'search.ref': 'Rujukan',
      'greet.name': 'Selamat datang, {name} 👋', 'greet': 'Selamat datang 👋', 'home.sub': 'Sahabat anda untuk sembang, belajar dan menyelidik.',
      'mode.casual': 'Sembang', 'mode.academic': 'Akademik', 'home.askLabel': 'Tanya apa sahaja', 'home.ask': 'Tanya apa sahaja…', 'home.askSend': 'Hantar',
      'card.casual': 'Sembang Santai', 'card.casual.d': 'Tanya apa sahaja, kongsi idea, atau berbual santai.',
      'card.academic': 'Pembantu Akademik', 'card.academic.d': 'Sokongan untuk penyelidikan, penulisan, tesis dan rujukan.',
      'home.quick': 'Akses Pantas', 'tile.idea': 'Idea', 'tile.fun': 'Hiburan', 'tile.writing': 'Penulisan', 'tile.suggest': 'Saranan',
      'tile.thesis': 'Tesis', 'tile.research': 'Penyelidikan', 'tile.data': 'Analisis Data', 'tile.proof': 'Semak & Gaya', 'tile.refs': 'Rujukan', 'soon': 'Akan datang',
      'home.project': 'Projek Semasa', 'stat.words': 'perkataan', 'stat.chapters': 'bab', 'stat.refs': 'rujukan', 'home.continue': 'Sambung menulis',
      'home.recent': 'Aktiviti Terkini', 'recent.empty': 'Belum ada aktiviti. Mula dengan bertanya sesuatu.',
      'recent.casual': 'Sembang', 'recent.academic': 'Penyelidikan', 'recent.draft': 'Draf akademik', 'time.now': 'baru sahaja',
      'casual.eyebrow': 'Mod Sembang', 'casual.sub': 'Tanya apa sahaja dalam BM atau English: idea, hiburan, penulisan atau saranan.', 'casual.clear': 'Kosongkan sembang',
      'casual.welcome': 'Hai! 👋 Saya Talkademic. Tanya apa sahaja, dalam BM atau English. Nak idea, cadangan hiburan, bantuan menulis atau saranan? Saya sedia membantu.',
      'casual.noai': 'Mesej disimpan. Untuk balasan AI, sambungkan AI di Tetapan.', 'casual.working': 'Talkademic sedang menaip…', 'casual.confirmClear': 'Kosongkan sembang santai ini?',
      'prompt.idea': 'Bagi saya 5 idea kreatif untuk ', 'prompt.fun': 'Cadangkan aktiviti santai yang menarik untuk hujung minggu ini.', 'prompt.write': 'Tolong perbaiki ayat ini supaya lebih jelas: ', 'prompt.suggest': 'Apa saranan anda tentang ',
      'send': 'Hantar', 'save': 'Simpan', 'copy': 'Salin', 'cancel': 'Batal', 'close': 'Tutup', 'export': 'Eksport DOCX', 'draft': 'DRAF',
      'ws.crumb': 'Akademik', 'ws.heading': 'Dari idea ke tesis.', 'ws.welcomeT': 'Perjalanan penyelidikan anda bermula dengan perbualan.', 'ws.welcomeB': 'Tulis secara santai, tukar idea kepada draf, dan tentukan apa yang masuk ke dalam tesis.',
      'ws.tabTalk': 'Sembang & Draf', 'ws.tabThesis': 'Tesis Saya', 'ws.thinking': 'Ruang berfikir anda', 'ws.chatTitle': 'Jom bincang penyelidikan', 'ws.chatSub': 'Jangan risau tentang bahasa akademik. Terangkan idea anda sahaja.',
      'ws.chatPh': 'cth. Saya rasa gambar produk mempengaruhi pembeli sebab...', 'ws.hint': 'Enter hantar · Shift+Enter baris baharu', 'ws.autoDraft': 'Draf akademik automatik', 'ws.autoVoice': 'Hantar suara automatik',
      'ws.disclaimer': '✦ Tesis anda disimpan pada peranti ini sahaja. Sahkan semua sitasi yang dijana AI.', 'ws.academicSpace': 'Ruang akademik anda', 'ws.builder': 'Pembina Tesis', 'ws.section': 'Seksyen',
      'ws.document': 'Dokumen anda', 'ws.editorPh': 'Seksyen tesis anda bermula di sini. Taip terus atau masukkan draf akademik daripada perbualan…', 'ws.autosave': 'Perubahan disimpan automatik dalam pelayar ini.', 'ws.history': 'Sejarah',
      'ws.assistant': 'Pembantu penulisan akademik', 'ws.convertTitle': 'Tukar idea anda kepada penulisan penyelidikan', 'ai.connect': 'Sambung AI',
      'ws.convertHelp': 'Pilih mesej dalam sembang dan tekan Convert. Draf akademik muncul di sini untuk semakan anda. Tiada apa dimasukkan secara automatik.',
      'ws.withRefs': 'Cari rujukan jurnal sebenar', 'ws.recentRefs': '2015 ke atas sahaja', 'ws.emptyT': 'Idea seterusnya bermula di sini', 'ws.emptyB': 'Pilih mesej daripada perbualan untuk menghasilkan draf.',
      'ws.refsCited': 'Rujukan dipetik · OpenAlex', 'ws.allFound': 'Semua kajian ditemui', 'ws.insert': 'Masukkan ke seksyen terpilih', 'ws.regenerate': 'Jana semula',
      'proof.title': 'Semakan Tatabahasa & Gaya', 'proof.sub': 'Tampal teks anda. Talkademic membetulkan tatabahasa, ejaan dan kejelasan tanpa mengubah maksud atau sitasi.', 'proof.input': 'Teks anda',
      'proof.ph': 'Tampal perenggan anda di sini…', 'proof.btn': 'Semak teks', 'proof.result': 'Teks disemak', 'proof.note': 'Semak setiap perubahan sebelum guna. Fakta dan sitasi tidak disahkan oleh semakan ini.',
      'proof.insert': 'Masukkan ke seksyen tesis terpilih', 'proof.empty': 'Tampal sekurang-kurangnya satu ayat dahulu.', 'proof.needsAI': 'Semakan memerlukan AI. Sambungkan AI di Tetapan.',
      'proof.working': 'Sedang menyemak…', 'proof.done': 'Siap. Bandingkan dengan teks asal sebelum guna.', 'proof.confirm': 'Masukkan teks disemak ke dalam {section}?', 'proof.inserted': 'Dimasukkan ke dalam {section}.', 'proof.copied': 'Teks disalin.',
      'proj.sub': 'Satu projek tesis disimpan dalam pelayar ini. Eksport DOCX sebagai sandaran.', 'proj.open': 'Buka ruang kerja tesis', 'proj.edit': 'Edit profil tesis', 'proj.new': 'Projek baharu', 'proj.save': 'Simpan projek',
      'lib.sub': 'Rujukan daripada draf yang anda masukkan ke dalam tesis. Ia ditambah sebagai senarai Rujukan di hujung fail DOCX.', 'lib.copyAll': 'Salin semua', 'lib.find': 'Cari rujukan untuk idea baharu',
      'set.profile': 'Profil', 'set.name': 'Nama paparan', 'set.namePh': 'cth. Nur Akma', 'set.saved': 'Profil disimpan.', 'set.lang': 'Bahasa antara muka', 'set.theme': 'Tema', 'set.light': 'Cerah', 'set.dark': 'Gelap', 'set.system': 'Ikut peranti',
      'set.aiPick': 'Pilih AI', 'set.aiPickBody': 'Semua AI di sini percuma. Gemini untuk kegunaan harian; Groq (jika disambung) juga menjadi sandaran bila had percuma Gemini habis. Untuk ChatGPT atau Claude yang anda langgan, guna butang Hantar ke ChatGPT / Claude dalam Jurnal & Paper.',
      'set.aiPickRefs': 'Rujukan sebenar tetap dicari dalam OpenAlex, apa pun AI yang dipilih.', 'set.aiPickLocked': 'Sambung AI dahulu (kod akses) untuk memilih AI.',
      'ai.free': 'Percuma', 'ai.paid': 'Kredit API', 'ai.needKey': 'Belum ada API key', 'ai.switched': 'Kini menggunakan {x}',
      'set.ai': 'Sambungan AI', 'set.aiBody': 'AI memerlukan pemilik aplikasi menetapkan kunci API di pelayan dan anda memasukkan kod akses.', 'ai.on': '✦ AI disambung', 'ai.off': 'AI belum aktif',
      'set.thesis': 'Profil tesis', 'set.thesisBody': 'Tajuk, objektif, soalan kajian, bahasa draf dan gaya sitasi.', 'set.onboard': 'Tunjuk semula pengenalan',
      'pf.title': 'Tajuk tesis', 'pf.uni': 'Universiti / institusi', 'pf.degree': 'Ijazah', 'pf.ro': 'Objektif kajian (satu setiap baris)', 'pf.rq': 'Soalan kajian (satu setiap baris)', 'pf.context': 'Teori / metodologi / konteks penting', 'pf.lang': 'Bahasa draf', 'pf.cite': 'Gaya sitasi',
      'hist.title': 'Pulihkan draf', 'default.name': 'Penyelidik',
      'ob.lang': 'Pilih Bahasa', 'ob.name': 'Nama anda (pilihan)', 'ob.namePh': 'cth. Nur Akma', 'ob.next': 'Teruskan', 'ob.mode': 'Pilih Mod Penggunaan',
      'ob.casualT': 'Mod Sembang', 'ob.casualD': 'Sembang santai, idea, inspirasi dan kehidupan harian.', 'ob.acadT': 'Mod Akademik', 'ob.acadD': 'Penyelidikan, tesis, penulisan dan pembelajaran.', 'ob.start': 'Mula'
    },
    en: {
      'voice.speak': 'Speak to type', 'voice.listening': '🎙 Listening… tap again to stop', 'voice.transcribing': '🎙 Turning speech into text…',
      'voice.unsupported': 'This browser does not support voice input. Try Chrome.', 'voice.denied': 'Microphone access was blocked. Allow the microphone in your browser settings.',
      'tts.listen': 'Listen', 'tts.listenShort': 'Listen', 'tts.unsupported': 'This browser cannot read text aloud.', 'tts.empty': 'Nothing to read yet.',
      'tts.sample': 'Hi! This is the Talkademic voice. I can read your answers and thesis drafts aloud.', 'tts.hasMs': 'Malay voice available ✓', 'tts.noMs': 'No Malay voice found on this device.',
      'lib.importLabel': 'Import from Mendeley / Zotero / EndNote', 'lib.importBtn': 'Import RIS / BibTeX', 'lib.importHelp': 'In Mendeley/Zotero: select references → Export → RIS or BibTeX. Google Scholar: Cite → BibTeX.', 'lib.imported': '{a} references imported. {s} were already there.', 'lib.importNone': 'This file is not RIS or BibTeX, or it has no references.', 'lib.exportLabel': 'Export to Mendeley / Zotero / EndNote', 'lib.exportHelp': 'In Mendeley or Zotero, choose Import and pick this file.', 'lib.exportEmpty': 'No references to export yet.', 'lib.exported': '{file} downloaded.',
      'set.voice': 'Voice', 'set.autoSpeak': 'Read AI replies aloud automatically', 'set.voiceSend': 'Send right after I finish speaking (Casual Chat)', 'set.testVoice': 'Test voice',
      'set.voiceHelp': 'No Malay voice? On Android: Settings → Text-to-speech → Google engine → install Malay.',
      'brand.tag': 'Chat • Learn • Research',
      'nav.dashboard': 'Dashboard', 'nav.home': 'Home', 'nav.casual': 'Chat', 'nav.academic': 'Academic', 'nav.academicUp': 'ACADEMIC',
      'hub.title': 'Academic Workspace', 'hub.sub': 'All your academic tools in one place.',
      'hub.thesis': 'Thesis Assistant', 'hub.thesis.d': 'Write thesis chapters with AI support.', 'hub.research': 'Research Assistant', 'hub.research.d': 'Chat through ideas, then turn them into cited academic writing.',
      'hub.papers.d': 'Turn chat into a full paper, find indexed journals, check before submitting.', 'hub.data.d': 'Paste SmartPLS / SPSS output, get an explanation and a Results section.', 'nav.matrix': 'Literature Matrix', 'nav.goals': 'Goals & Reminders', 'nav.slides': 'Presentation Slides', 'nav.audit': 'Citation Audit', 'hub.audit.d': 'Check citations against the reference list, years, et al. and DOIs.', 'nav.framework': 'Conceptual Framework', 'hub.framework.d': 'Draw constructs and arrows, hypotheses H1, H2… numbered for you, straight into the thesis.', 'nav.survey': 'Survey Analysis', 'hub.survey.d': 'Google Forms CSV into respondent profile, Cronbach\'s alpha, means, correlations and Chapter 4.', 'hub.slides.d': 'Turn your thesis or paper into picture-led slides with speaker notes, download PowerPoint.', 'hub.goals.d': 'Daily word target, streak and countdown to deadlines.', 'hub.matrix.d': 'Add article PDFs, get a matrix, an Excel file and a cited synthesis.', 'hub.writing': 'Academic Writing', 'hub.writing.d': 'Turn casual ideas into academic paragraphs.',
      'hub.proof': 'Proofread & Style', 'hub.proof.d': 'Fix grammar and academic tone.', 'hub.refs': 'Citations & References', 'hub.refs.d': 'Your thesis reference list, export to Mendeley or Zotero.',
      'set.role': 'Role (optional)', 'set.rolePh': 'e.g. PhD researcher, UiTM', 'fab.newPaper': 'New paper', 'ob.welcome': 'Welcome to Talkademic',
      'nav.papers': 'Journal Papers', 'card.papers': 'Journal Papers', 'card.papers.d': 'Write articles, find indexed journals and check before submitting.',
      'nav.projects': 'My Projects', 'nav.projectsShort': 'Projects', 'nav.library': 'Library', 'nav.settings': 'Settings', 'nav.profile': 'Profile',
      'del.one': 'Delete', 'del.confirm': 'Delete this message and its reply from the chat history?', 'del.done': 'Deleted.', 'del.hide': 'Remove from list', 'recent.clear': 'Clear activity', 'recent.confirmClear': 'Clear all recent activity? This deletes every Casual Chat and Academic Chat message. Thesis chapters and papers are not affected.',
      'proj.import': 'Import DOCX',
      'imp.thesisConfirm': 'Import thesis from Word: {c} chapters, {w} words, {r} references.', 'imp.thesisReplace': 'Your current thesis chapters will be replaced. A copy is kept: undo in Profile → Backup & restore → Undo last restore.',
      'imp.thesisDone': 'Thesis imported: {c} chapters, {r} references. Review each chapter in the thesis workspace.',
      'imp.err.old-doc': 'Old .doc files are not supported. Open it in Word and Save As .docx.', 'imp.err.not-docx': 'This is not a Word .docx file.', 'imp.err.too-large': 'The file is too large (25 MB limit).',
      'imp.err.empty': 'No text was found in this document.', 'imp.err.old-browser': 'This browser is too old to import. Update Chrome or Safari.', 'imp.err.storage': 'Browser storage is full, so the thesis could not be imported.',
      'bk.title': 'Backup & restore', 'bk.body': 'All your work is stored only in this browser. Save a backup file, then restore it on another phone or laptop.',
      'bk.save': 'Save backup', 'bk.share': 'Share', 'bk.restore': 'Restore from file', 'bk.undo': '↶ Undo last restore', 'bk.note': 'The AI access code is not included in backups.',
      'bk.last': 'Last backup: {d}', 'bk.never': 'No backup yet.', 'bk.saved': 'Backup saved: {f}', 'bk.shareFail': 'Could not share. Use Save backup instead.',
      'bk.confirm': 'Restore backup "{t}" ({d})?\n{c} chapters · {w} words · {r} references\n\nThe current project will be replaced. A copy is kept so you can undo.',
      'bk.unknownDate': 'unknown date', 'bk.noUndo': 'Not enough storage to keep an undo copy. Continue without it?',
      'bk.restored': 'Backup restored.', 'bk.undoConfirm': 'Go back to the project as it was before the last restore?', 'bk.undone': 'Restore undone.',
      'bk.err.empty': 'The file is empty.', 'bk.err.not-json': 'This is not a Talkademic backup file.', 'bk.err.not-thestalk': 'This is not a Talkademic backup file.', 'bk.err.too-large': 'The file is too large.',
      'bk.err.newer-format': 'This backup is from a newer Talkademic. Reload the app and try again.', 'bk.err.storage': 'Browser storage is full, so the backup could not be restored.',
      'bk.nudgeNever': 'Your work exists only in this browser. Save a backup so you don\'t lose it.', 'bk.nudgeOld': 'Last backup was {n} days ago. Save a new one?', 'bk.saveNow': 'Back up now',
      'theme.toggle': 'Switch theme', 'saved.title': 'Saved on this device', 'saved.body': 'Your content stays only in this browser. Save a backup in Settings so you don\'t lose it.',
      'search.label': 'Search in Talkademic', 'search.ph': 'Search in Talkademic…', 'search.empty': 'No results for this search.',
      'search.casual': 'Chat', 'search.academic': 'Academic chat', 'search.section': 'Thesis section', 'search.ref': 'Reference',
      'greet.name': 'Welcome, {name} 👋', 'greet': 'Welcome 👋', 'home.sub': 'Your companion for chat, learning and research.',
      'mode.casual': 'Chat', 'mode.academic': 'Academic', 'home.askLabel': 'Ask me anything', 'home.ask': 'Ask me anything…', 'home.askSend': 'Send',
      'card.casual': 'Casual Chat', 'card.casual.d': 'Ask anything, share ideas, or have a casual chat.',
      'card.academic': 'Academic Assistant', 'card.academic.d': 'Support for research, writing, your thesis and references.',
      'home.quick': 'Quick Access', 'tile.idea': 'Ideas', 'tile.fun': 'Entertainment', 'tile.writing': 'Writing', 'tile.suggest': 'Suggestions',
      'tile.thesis': 'Thesis', 'tile.research': 'Research', 'tile.data': 'Data Analysis', 'tile.proof': 'Proofread', 'tile.refs': 'References', 'soon': 'Coming soon',
      'home.project': 'Current Project', 'stat.words': 'words', 'stat.chapters': 'chapters', 'stat.refs': 'references', 'home.continue': 'Continue writing',
      'home.recent': 'Recent Activity', 'recent.empty': 'No activity yet. Start by asking something.',
      'recent.casual': 'Chat', 'recent.academic': 'Research', 'recent.draft': 'Academic draft', 'time.now': 'just now',
      'casual.eyebrow': 'Chat mode', 'casual.sub': 'Ask anything in Malay or English: ideas, entertainment, writing or suggestions.', 'casual.clear': 'Clear chat',
      'casual.welcome': 'Hi! 👋 I’m Talkademic. Ask me anything, in Malay or English. Need ideas, something fun to do, help with writing or a suggestion? I’m here to help.',
      'casual.noai': 'Message saved. For AI replies, connect AI in Settings.', 'casual.working': 'Talkademic is typing…', 'casual.confirmClear': 'Clear this casual chat?',
      'prompt.idea': 'Give me 5 creative ideas for ', 'prompt.fun': 'Suggest a fun, relaxing activity for this weekend.', 'prompt.write': 'Please improve this text so it reads more clearly: ', 'prompt.suggest': 'What do you suggest about ',
      'send': 'Send', 'save': 'Save', 'copy': 'Copy', 'cancel': 'Cancel', 'close': 'Close', 'export': 'Export DOCX', 'draft': 'DRAFT',
      'ws.crumb': 'Academic', 'ws.heading': 'From thoughts to thesis.', 'ws.welcomeT': 'Your research journey starts with a conversation.', 'ws.welcomeB': 'Write naturally, convert your thoughts into a draft, and decide what belongs in your thesis.',
      'ws.tabTalk': 'Talk & Draft', 'ws.tabThesis': 'My Thesis', 'ws.thinking': 'Your thinking space', 'ws.chatTitle': "Let's talk research", 'ws.chatSub': "Don't worry about academic language. Just explain your ideas.",
      'ws.chatPh': 'e.g. I think product images influence buyers because...', 'ws.hint': 'Enter to send · Shift+Enter for new line', 'ws.autoDraft': 'Auto academic draft', 'ws.autoVoice': 'Auto send voice',
      'ws.disclaimer': '✦ Your thesis is saved on this device only. Validate all AI-generated citations.', 'ws.academicSpace': 'Your academic workspace', 'ws.builder': 'Thesis Builder', 'ws.section': 'Section',
      'ws.document': 'Your document', 'ws.editorPh': 'Your thesis section begins here. Type directly or insert an academic draft from your conversation…', 'ws.autosave': 'Changes are saved automatically in this browser.', 'ws.history': 'History',
      'ws.assistant': 'Academic writing assistant', 'ws.convertTitle': 'Turn your thoughts into research writing', 'ai.connect': 'Connect AI',
      'ws.convertHelp': 'Choose a message in the chat and press Convert. Your academic draft appears here for your review. Nothing is inserted automatically.',
      'ws.withRefs': 'Find real references', 'ws.recentRefs': '2015 onwards only', 'ws.emptyT': 'Your next idea starts here', 'ws.emptyB': 'Pick a message from your conversation to create a draft.',
      'ws.refsCited': 'References cited · OpenAlex', 'ws.allFound': 'All papers found', 'ws.insert': 'Insert into selected section', 'ws.regenerate': 'Regenerate',
      'proof.title': 'Proofread & Style', 'proof.sub': 'Paste your text. Talkademic fixes grammar, spelling and clarity without changing the meaning or citations.', 'proof.input': 'Your text',
      'proof.ph': 'Paste your paragraph here…', 'proof.btn': 'Check text', 'proof.result': 'Checked text', 'proof.note': 'Review every change before using it. This check does not verify facts or citations.',
      'proof.insert': 'Insert into selected thesis section', 'proof.empty': 'Paste at least one sentence first.', 'proof.needsAI': 'Proofreading needs AI. Connect AI in Settings.',
      'proof.working': 'Checking…', 'proof.done': 'Done. Compare with your original before using it.', 'proof.confirm': 'Insert the checked text into {section}?', 'proof.inserted': 'Inserted into {section}.', 'proof.copied': 'Text copied.',
      'proj.sub': 'One thesis project is stored in this browser. Export DOCX as a backup.', 'proj.open': 'Open thesis workspace', 'proj.edit': 'Edit thesis profile', 'proj.new': 'New project', 'proj.save': 'Save project',
      'lib.sub': 'References from drafts you inserted into your thesis. They are added as a References list at the end of your DOCX.', 'lib.copyAll': 'Copy all', 'lib.find': 'Find references for a new idea',
      'set.profile': 'Profile', 'set.name': 'Display name', 'set.namePh': 'e.g. Nur Akma', 'set.saved': 'Profile saved.', 'set.lang': 'Interface language', 'set.theme': 'Theme', 'set.light': 'Light', 'set.dark': 'Dark', 'set.system': 'Match device',
      'set.aiPick': 'Choose AI', 'set.aiPickBody': 'Every AI here is free. Gemini for everyday use; Groq (if connected) is also the backup when Gemini\'s free limit runs out. For your ChatGPT or Claude subscription, use the Send to ChatGPT / Claude button in Journal Papers.',
      'set.aiPickRefs': 'Real references still come from OpenAlex, whichever AI you choose.', 'set.aiPickLocked': 'Connect AI first (access code) to choose an AI.',
      'ai.free': 'Free', 'ai.paid': 'API credits', 'ai.needKey': 'No API key yet', 'ai.switched': 'Now using {x}',
      'set.ai': 'AI connection', 'set.aiBody': 'AI needs the app owner to set an API key on the server and you to enter the access code.', 'ai.on': '✦ AI connected', 'ai.off': 'AI not active',
      'set.thesis': 'Thesis profile', 'set.thesisBody': 'Title, objectives, research questions, draft language and citation style.', 'set.onboard': 'Show the welcome screens again',
      'pf.title': 'Thesis title', 'pf.uni': 'University / institution', 'pf.degree': 'Degree', 'pf.ro': 'Research objectives (one per line)', 'pf.rq': 'Research questions (one per line)', 'pf.context': 'Theories / methodology / important context', 'pf.lang': 'Draft language', 'pf.cite': 'Citation style',
      'hist.title': 'Restore a draft', 'default.name': 'Researcher',
      'ob.lang': 'Choose Language', 'ob.name': 'Your name (optional)', 'ob.namePh': 'e.g. Nur Akma', 'ob.next': 'Continue', 'ob.mode': 'Choose Your Mode',
      'ob.casualT': 'Chat Mode', 'ob.casualD': 'Casual chat, ideas, inspiration and everyday topics.', 'ob.acadT': 'Academic Mode', 'ob.acadD': 'Research, thesis, writing and learning.', 'ob.start': 'Start'
    }
  };
  const otherLang = l => (l === 'en' ? 'ms' : 'en');
  function tr(lang, key, vars) {
    let s = (T[lang] && T[lang][key]) ?? T.ms[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
    return s;
  }
  const t = (key, vars) => tr(ui.lang, key, vars);
  const locale = () => (ui.lang === 'en' ? 'en-MY' : 'ms-MY');
  const fmt = n => Number(n || 0).toLocaleString(locale());

  function applyI18n() {
    document.documentElement.lang = ui.lang === 'en' ? 'en' : 'ms';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $$('[data-k]').forEach(el => { el.textContent = t(el.dataset.k); });
    $$('[data-k2]').forEach(el => {
      const v = tr(otherLang(ui.lang), el.dataset.k2);
      el.textContent = v;
      el.hidden = !v || v === t(el.dataset.k2);
    });
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === ui.lang)));
    $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', t('theme.toggle')));
    renderIdentity();
    renderCasual();
    if (typeof renderAI === 'function') try { renderAI(); } catch (e) { /* picker not ready yet */ }
    if (typeof renderBackup === 'function') try { renderBackup(); } catch (e) { /* not ready yet */ }
    try { if (window.ThesTalkPapers) { if (current === 'papers') window.ThesTalkPapers.render(); window.ThesTalkPapers.renderProjectsCard(); } } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicAnalysis && current === 'analysis') window.TalkademicAnalysis.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicMatrix && current === 'matrix') window.TalkademicMatrix.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicGoals) { if (current === 'goals') window.TalkademicGoals.render(); window.TalkademicGoals.home(); } } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicSlides && current === 'slides') window.TalkademicSlides.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicAudit && current === 'audit') window.TalkademicAudit.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicFramework && current === 'framework') window.TalkademicFramework.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicSurvey && current === 'survey') window.TalkademicSurvey.render(); } catch (e) { /* not ready yet */ }
    try { if (window.TalkademicSync) window.TalkademicSync.render(); } catch (e) { /* not ready yet */ }
    refresh();
  }

  /* ---------- theme ---------- */
  const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme() {
    const root = document.documentElement;
    if (ui.theme === 'dark' || ui.theme === 'light') root.setAttribute('data-theme', ui.theme);
    else root.removeAttribute('data-theme');
    $$('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === ui.theme)));
  }
  function toggleTheme() {
    const dark = ui.theme === 'dark' || (ui.theme === 'system' && prefersDark());
    ui.theme = dark ? 'light' : 'dark';
    saveUI(); applyTheme();
  }

  /* ---------- identity ---------- */
  function displayName() { return (ui.name || '').trim(); }
  function initials(name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return (parts.length ? parts.slice(0, 2).map(p => p[0]).join('') : 'T').toUpperCase();
  }
  function renderIdentity() {
    const name = displayName();
    $('#avatarInitials').textContent = initials(name || t('default.name'));
    $('#avatarName').textContent = name || t('default.name');
    $('#heroTitle').textContent = name ? t('greet.name', { name }) : t('greet');
    $('#heroAlt').textContent = name ? tr(otherLang(ui.lang), 'greet.name', { name }).replace(' 👋', '') : tr(otherLang(ui.lang), 'greet').replace(' 👋', '');
    $('#profileName').value = name;
    $('#profileRole').value = ui.role || '';
    $('#profileAvatar').textContent = initials(name || t('default.name'));
    $('#profileHeroName').textContent = name || t('default.name');
    $('#profileHeroRole').textContent = ui.role || 'Talkademic';
  }

  /* ---------- navigation ---------- */
  let current = 'home';
  let pendingFocus = null;
  function go(view, focus) {
    if (!VIEWS.includes(view)) view = 'home';
    pendingFocus = focus || null;
    if (location.hash !== '#' + view) location.hash = view; // triggers show() through hashchange
    else show(view);
  }
  function show(view) {
    if (!VIEWS.includes(view)) view = 'home';
    current = view;
    VIEWS.forEach(v => { const el = $('#view-' + v); if (el) el.hidden = v !== view; });
    const focus = pendingFocus; pendingFocus = null;
    $$('.side-nav .nav-item[data-go]').forEach(b => b.classList.toggle('active', b.dataset.go === view));
    $('#academicToggle').classList.toggle('active', view === 'academic' || view === 'proofread' || view === 'papers' || view === 'matrix' || view === 'analysis' || view === 'goals' || view === 'slides' || view === 'audit' || view === 'framework' || view === 'survey');
    $$('.nav-sub').forEach(b => b.classList.toggle('active', (b.dataset.go === view) && (view !== 'academic' || b.dataset.focus === (focus || lastFocus))));
    const bottomMap = { academic: 'hub', proofread: 'hub', papers: 'hub', analysis: 'hub', matrix: 'hub', goals: 'hub', slides: 'hub', audit: 'hub', framework: 'hub', survey: 'hub', library: 'hub' };
    const bottom = bottomMap[view] || view;
    $$('.bottom-nav button').forEach(b => { const on = b.dataset.go === bottom; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (view === 'academic') applyFocus(focus);
    if (view === 'library') App.renderRefsList();
    if (view === 'casual') { renderCasual(); }
    if (view === 'papers' && window.ThesTalkPapers) window.ThesTalkPapers.render();
    if (view === 'analysis' && window.TalkademicAnalysis) window.TalkademicAnalysis.render();
    if (view === 'matrix' && window.TalkademicMatrix) window.TalkademicMatrix.render();
    if (view === 'goals' && window.TalkademicGoals) window.TalkademicGoals.render();
    if (view === 'slides' && window.TalkademicSlides) window.TalkademicSlides.render();
    if (view === 'audit' && window.TalkademicAudit) window.TalkademicAudit.render();
    if (view === 'framework' && window.TalkademicFramework) window.TalkademicFramework.render();
    if (view === 'survey' && window.TalkademicSurvey) window.TalkademicSurvey.render();
    if (view === 'settings' && window.TalkademicSync) window.TalkademicSync.render();
    refresh();
    closeSearch();
    window.scrollTo({ top: 0 });
  }
  let lastFocus = 'research';
  function applyFocus(focus) {
    if (focus) lastFocus = focus;
    if (focus === 'thesis') App.setMobileTab('thesis');
    else if (focus === 'research') { App.setMobileTab('chat'); setTimeout(() => $('#chatInput').focus({ preventScroll: true }), 60); }
    else if (focus === 'writing') { App.setMobileTab('thesis'); setTimeout(() => $('#conversionPanel').scrollIntoView({ block: 'start', behavior: 'smooth' }), 80); }
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go]');
    if (!el || el.disabled) return;
    if (el.id === 'libFind') { const box = $('#withRefs'); if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event('change')); } }
    go(el.dataset.go, el.dataset.focus);
  });
  $('#academicToggle').addEventListener('click', () => {
    ui.academicOpen = !ui.academicOpen; saveUI();
    $('#academicGroup').hidden = !ui.academicOpen;
    $('#academicToggle').setAttribute('aria-expanded', String(ui.academicOpen));
  });

  /* ---------- dashboard ---------- */
  function setMode(mode) {
    ui.mode = mode === 'academic' ? 'academic' : 'casual'; saveUI();
    $$('.mode-switch [data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === ui.mode)));
    $('#tilesCasual').hidden = ui.mode !== 'casual';
    $('#tilesAcademic').hidden = ui.mode !== 'academic';
  }
  $$('.mode-switch [data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#askInput').value.trim();
    if (!text) { $('#askInput').focus(); return; }
    $('#askInput').value = '';
    if (ui.mode === 'academic') { go('academic', 'research'); App.addMessage(text); }
    else { go('casual'); sendCasual(text); }
  });

  function relTime(at) {
    const d = new Date(at);
    if (Number.isNaN(d.valueOf())) return '';
    const sec = Math.round((d - Date.now()) / 1000);
    const abs = Math.abs(sec);
    if (abs < 60) return t('time.now');
    try {
      const rtf = new Intl.RelativeTimeFormat(ui.lang === 'en' ? 'en' : 'ms', { numeric: 'auto' });
      if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
      if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
      return rtf.format(Math.round(sec / 86400), 'day');
    } catch (e) { return d.toLocaleString(locale()); }
  }
  function recentItems() {
    const s = App.state();
    const items = [];
    (s.casualMessages || []).filter(m => m.role === 'user').slice(-5).forEach(m => items.push({ kind: 'casual', text: m.text, at: m.at, msg: m, list: 'casualMessages' }));
    (s.messages || []).filter(m => m.role === 'user').slice(-5).forEach(m => items.push({ kind: 'academic', text: m.text, at: m.at, msg: m, list: 'messages' }));
    if (s.conversion && s.conversion.at && s.conversion.isAI && !s.conversion.hideRecent) items.push({ kind: 'draft', text: s.conversion.text, at: s.conversion.at });
    return items.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 4);
  }
  function icon(id) { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'ic'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#' + id); svg.appendChild(use); return svg; }
  /* Deleting a user message also removes the assistant reply that follows it. */
  function deleteMessage(listName, msg, ask = true) {
    const s = App.state(), arr = s[listName];
    if (!Array.isArray(arr)) return;
    const i = arr.indexOf(msg);
    if (i < 0 || (ask && !confirm(t('del.confirm')))) return;
    arr.splice(i, arr[i + 1] && arr[i + 1].role === 'assistant' ? 2 : 1);
    if (listName === 'messages' && s.selectedMessage === msg.id) s.selectedMessage = null;
    App.save();
    if (listName === 'messages' && App.render) App.render();
    renderCasual(); renderRecent();
    App.toast(t('del.done'));
  }
  function renderRecent() {
    const ul = $('#recentList');
    ul.replaceChildren();
    const items = recentItems();
    $('#clearRecent').hidden = !items.length;
    if (!items.length) { const li = document.createElement('li'); li.className = 'recent-empty'; li.textContent = t('recent.empty'); ul.appendChild(li); return; }
    const map = { casual: ['ic-chat', 'recent.casual', () => go('casual')], academic: ['ic-cap', 'recent.academic', () => go('academic', 'research')], draft: ['ic-pen', 'recent.draft', () => go('academic', 'writing')] };
    items.forEach(it => {
      const [ic, label, act] = map[it.kind];
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button'; b.onclick = act;
      const iconBox = document.createElement('span'); iconBox.className = 'ra-icon'; iconBox.appendChild(icon(ic));
      const body = document.createElement('span'); body.className = 'ra-body';
      const title = document.createElement('span'); title.className = 'ra-title'; title.textContent = t(label) + ': ' + String(it.text || '').replace(/\s+/g, ' ').trim();
      const meta = document.createElement('span'); meta.className = 'ra-meta'; meta.textContent = relTime(it.at);
      body.append(title, meta);
      b.append(iconBox, body, icon('ic-arrow'));
      const x = document.createElement('button'); x.type = 'button'; x.className = 'ra-del'; x.textContent = '×';
      x.setAttribute('aria-label', (it.msg ? t('del.one') : t('del.hide')) + ': ' + String(it.text || '').slice(0, 40)); x.title = it.msg ? t('del.one') : t('del.hide');
      x.onclick = () => { if (it.msg) deleteMessage(it.list, it.msg); else { App.state().conversion.hideRecent = true; App.save(); renderRecent(); } };
      li.append(b, x); ul.appendChild(li);
    });
  }
  function totals() {
    const s = App.state();
    return { words: s.chapters.reduce((a, c) => a + App.wordTotal(c), 0), chapters: s.chapters.length, refs: (s.references || []).length };
  }
  function renderHome() {
    const s = App.state(), n = totals();
    $('#homeProjectTitle').textContent = s.project.title || '—';
    $('#homeWords').textContent = fmt(n.words);
    $('#homeChapters').textContent = fmt(n.chapters);
    $('#homeRefs').textContent = fmt(n.refs);
    renderRecent();
    try { if (window.TalkademicGoals) window.TalkademicGoals.home(); } catch (e) { /* goals not ready */ }
  }

  /* ---------- projects ---------- */
  function renderProjects() {
    const s = App.state(), p = s.project, n = totals();
    $('#pdTitle').textContent = p.title || '—';
    $('#pdMeta').textContent = [p.degree, p.university, p.language, p.citation].filter(Boolean).join(' · ');
    $('#pdWords').textContent = fmt(n.words);
    $('#pdChapters').textContent = fmt(n.chapters);
    $('#pdRefs').textContent = fmt(n.refs);
    const ul = $('#pdChapterList');
    ul.replaceChildren();
    const counts = s.chapters.map(c => App.wordTotal(c));
    const max = Math.max(1, ...counts);
    s.chapters.forEach((ch, i) => {
      const li = document.createElement('li');
      const name = document.createElement('button'); name.type = 'button'; name.className = 'btn-reset text-action'; name.textContent = ch.title;
      name.onclick = () => { App.select(ch.id); go('academic', 'thesis'); };
      const w = document.createElement('span'); w.className = 'w'; w.textContent = fmt(counts[i]) + ' ' + t('stat.words');
      const bar = document.createElement('div'); bar.className = 'bar'; const fill = document.createElement('span'); fill.style.width = Math.max(2, Math.round(counts[i] / max * 100)) + '%'; bar.appendChild(fill);
      li.append(name, w, bar); ul.appendChild(li);
    });
  }
  $('#pdEdit').addEventListener('click', () => App.openProject());
  $('#pdExport').addEventListener('click', () => App.exportDoc());

  /* ---------- casual chat ---------- */
  let casualBusy = false;
  function bubble(m) {
    const row = document.createElement('div'); row.className = 'message-row' + (m.role === 'user' ? ' user' : '');
    const av = document.createElement('div'); av.className = 'avatar' + (m.role === 'user' ? ' user-avatar' : ''); av.textContent = m.role === 'user' ? initials(displayName() || t('default.name')) : '✦';
    const col = document.createElement('div'); col.className = 'msg-column';
    const b = document.createElement('div'); b.className = 'message ' + (m.role === 'user' ? 'user-msg' : 'assistant-msg'); b.textContent = m.text;
    const time = document.createElement('div'); time.className = 'message-time'; time.textContent = m.at ? new Date(m.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : 'THESTALK';
    col.append(b);
    if (m.role === 'user' && m.id) { const del = document.createElement('button'); del.type = 'button'; del.className = 'msg-del'; del.textContent = '×'; del.title = t('del.one'); del.setAttribute('aria-label', t('del.one')); del.onclick = () => deleteMessage('casualMessages', m); col.append(del); }
    if (m.role !== 'user') { const sp = document.createElement('button'); sp.type = 'button'; sp.className = 'msg-speak'; sp.textContent = '🔊'; sp.setAttribute('aria-label', t('tts.listen')); sp.onclick = () => Speech.speak(m.text, sp); col.append(sp); }
    col.append(time); row.append(av, col);
    return row;
  }
  function renderCasual() {
    const area = $('#casualMessages');
    area.replaceChildren();
    const list = App.state().casualMessages || [];
    if (!list.length) area.appendChild(bubble({ role: 'assistant', text: t('casual.welcome') }));
    list.forEach(m => area.appendChild(bubble(m)));
    area.scrollTop = area.scrollHeight;
  }
  async function sendCasual(text) {
    const val = String(text || '').trim();
    if (!val || casualBusy) return;
    const s = App.state();
    if (!Array.isArray(s.casualMessages)) s.casualMessages = [];
    const history = s.casualMessages.slice(-10).map(m => ({ role: m.role, text: m.text }));
    const msg = { id: App.uid(), role: 'user', text: val, at: App.date() };
    s.casualMessages.push(msg);
    if (s.casualMessages.length > 200) s.casualMessages.splice(0, s.casualMessages.length - 200);
    $('#casualInput').value = '';
    renderCasual(); App.save();
    if (!(await App.ensureAI())) return;
    casualBusy = true; $('#casualSend').disabled = true; $('#casualActivity').textContent = t('casual.working');
    try {
      const data = await App.apiPost('/api/chat', { message: val, history, mode: 'casual' });
      if (!data.reply) throw Error('AI did not return a reply.');
      const st = App.state();
      if (st.casualMessages && st.casualMessages.includes(msg)) { st.casualMessages.push({ id: App.uid(), role: 'assistant', text: data.reply, at: App.date() }); renderCasual(); App.save(); if (ui.autoSpeak) { const btns = $$('#casualMessages .msg-speak'); Speech.speak(data.reply, btns[btns.length - 1]); } }
    } catch (e) { App.toast(e.message || t('casual.noai')); }
    finally { casualBusy = false; $('#casualSend').disabled = false; $('#casualActivity').textContent = ''; }
  }
  $('#casualForm').addEventListener('submit', e => { e.preventDefault(); sendCasual($('#casualInput').value); });
  $('#casualInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendCasual(e.target.value); } });
  $('#clearRecent').addEventListener('click', () => {
    if (!confirm(t('recent.confirmClear'))) return;
    const s = App.state();
    s.casualMessages = []; s.messages = []; s.selectedMessage = null;
    if (s.conversion) s.conversion.hideRecent = true;
    App.save(); if (App.render) App.render(); renderCasual(); renderRecent();
    App.toast(t('del.done'));
  });
  $('#clearCasual').addEventListener('click', () => {
    const s = App.state();
    if (!s.casualMessages || !s.casualMessages.length) return;
    if (!confirm(t('casual.confirmClear'))) return;
    s.casualMessages = []; renderCasual(); App.save();
  });
  function startPrompt(kind) {
    const text = t('prompt.' + kind);
    if (current !== 'casual') go('casual');
    const box = $('#casualInput');
    box.value = text;
    setTimeout(() => { box.focus(); box.setSelectionRange(text.length, text.length); }, 80);
  }
  $$('[data-prompt]').forEach(b => b.addEventListener('click', () => startPrompt(b.dataset.prompt)));

  /* ---------- proofread ---------- */
  let proofBusy = false;
  $('#proofBtn').addEventListener('click', async () => {
    const text = $('#proofInput').value.trim();
    const status = $('#proofStatus');
    if (text.length < 4) { status.textContent = t('proof.empty'); return; }
    if (!(await App.ensureAI())) { status.textContent = t('proof.needsAI'); return; }
    if (proofBusy) return;
    proofBusy = true; $('#proofBtn').disabled = true; status.textContent = t('proof.working');
    try {
      const data = await App.apiPost('/api/convert', { idea: text, mode: 'proofread', project: App.state().project });
      if (!data.academicText) throw Error('AI returned an empty response.');
      $('#proofOutput').value = data.academicText;
      $('#proofResult').hidden = false;
      status.textContent = t('proof.done');
    } catch (e) { status.textContent = e.message || 'Error'; }
    finally { proofBusy = false; $('#proofBtn').disabled = false; }
  });
  $('#proofCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#proofOutput').value); App.toast(t('proof.copied')); }
    catch (e) { $('#proofOutput').select(); document.execCommand('copy'); App.toast(t('proof.copied')); }
  });
  $('#proofInsert').addEventListener('click', () => {
    const text = $('#proofOutput').value.trim();
    if (!text) return;
    const section = App.section().title;
    if (!confirm(t('proof.confirm', { section }))) return;
    if (App.insertText(text)) App.toast(t('proof.inserted', { section }));
  });


  /* ---------- read aloud (browser speech synthesis, free) ---------- */
  const Speech = (() => {
    const synth = window.speechSynthesis;
    let current = null;
    const MS_WORDS = new Set(['yang', 'dan', 'untuk', 'ini', 'dengan', 'tidak', 'adalah', 'saya', 'kepada', 'dalam', 'itu', 'boleh', 'akan', 'pada', 'oleh', 'kajian', 'pengguna', 'juga', 'lebih', 'atau', 'anda', 'kita', 'ada', 'dari', 'daripada', 'sebagai', 'bagi', 'ialah', 'mereka', 'secara', 'telah', 'tersebut', 'serta', 'apabila', 'kerana', 'sebab']);
    function detectLang(text) {
      const words = String(text).toLowerCase().match(/[a-z]+/g) || [];
      if (!words.length) return ui.lang === 'en' ? 'en' : 'ms';
      const hits = words.filter(w => MS_WORDS.has(w)).length;
      return hits / words.length > 0.06 ? 'ms' : 'en';
    }
    function pickVoice(lang) {
      if (!synth) return null;
      const voices = synth.getVoices() || [];
      const prefs = lang === 'ms' ? ['ms-my', 'ms', 'id-id', 'id'] : ['en-gb', 'en-us', 'en'];
      for (const p of prefs) { const v = voices.find(x => String(x.lang || '').replace('_', '-').toLowerCase().startsWith(p)); if (v) return v; }
      return null;
    }
    function chunks(text) {
      const out = [];
      String(text).split(/(?<=[.!?。])\s+|\n+/).forEach(sentence => {
        let s = sentence.trim();
        while (s.length > 220) { let cut = s.lastIndexOf(',', 220); if (cut < 80) cut = s.lastIndexOf(' ', 220); if (cut < 40) cut = 220; out.push(s.slice(0, cut + 1)); s = s.slice(cut + 1).trim(); }
        if (s) out.push(s);
      });
      return out;
    }
    function stop() { if (synth) synth.cancel(); if (current && current.btn) current.btn.classList.remove('speaking'); current = null; }
    function speak(text, btn) {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { App.toast(t('tts.unsupported')); return; }
      if (current && btn && current.btn === btn) { stop(); return; }
      stop();
      const raw = String(text || '').trim();
      if (!raw) { App.toast(t('tts.empty')); return; }
      const lang = detectLang(raw);
      const clean = raw.replace(/\[SOURCE NEEDED\]/gi, lang === 'ms' ? '(sumber diperlukan)' : '(source needed)').replace(/https?:\/\/\S+/g, '').replace(/[*#_`>]/g, '');
      const voice = pickVoice(lang);
      const parts = chunks(clean);
      const me = { btn };
      current = me;
      if (btn) btn.classList.add('speaking');
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang === 'ms' ? 'ms-MY' : 'en-GB';
        u.rate = 1;
        if (i === parts.length - 1) u.onend = u.onerror = () => { if (current === me) stop(); };
        synth.speak(u);
      });
    }
    const hasMalay = () => !!(synth && (synth.getVoices() || []).some(v => /^(ms|id)/i.test(String(v.lang || ''))));
    return { speak, stop, hasMalay, supported: !!synth };
  })();
  function renderVoiceInfo() {
    const el = $('#voiceInfo'); if (!el) return;
    el.textContent = !Speech.supported ? t('tts.unsupported') : Speech.hasMalay() ? t('tts.hasMs') : t('tts.noMs');
  }
  if (window.speechSynthesis) window.speechSynthesis.addEventListener('voiceschanged', renderVoiceInfo);
  $('#speakDraft').addEventListener('click', e => Speech.speak($('#academicOutput').value, e.currentTarget));
  $('#speakSection').addEventListener('click', e => Speech.speak($('#sectionEditor').value, e.currentTarget));
  $('#proofSpeak').addEventListener('click', e => Speech.speak($('#proofOutput').value, e.currentTarget));
  $('#testVoice').addEventListener('click', e => Speech.speak(t('tts.sample'), e.currentTarget));
  $('#autoSpeak').addEventListener('change', e => { ui.autoSpeak = e.target.checked; saveUI(); });
  $('#voiceAutoSend').addEventListener('change', e => { ui.voiceAutoSend = e.target.checked; saveUI(); });

  /* 🔊 on academic chat replies (rendered by app.js), plus auto-read of new replies */
  const assistantCount = () => (App.state().messages || []).filter(m => m.role === 'assistant').length;
  let seenAssistant = assistantCount();
  function decorateAcademic() {
    $$('#messages .message-row:not(.user)').forEach(row => {
      const msg = row.querySelector('.message');
      if (!msg || row.querySelector('.msg-speak')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'msg-speak'; b.textContent = '🔊'; b.setAttribute('aria-label', t('tts.listen'));
      b.onclick = () => Speech.speak(msg.textContent, b);
      msg.insertAdjacentElement('afterend', b);
    });
    const n = assistantCount();
    if (n > seenAssistant && ui.autoSpeak) {
      const list = (App.state().messages || []).filter(m => m.role === 'assistant');
      const btns = $$('#messages .message-row:not(.user) .msg-speak');
      Speech.speak(list[list.length - 1].text, btns[btns.length - 1]);
    }
    seenAssistant = n;
  }
  new MutationObserver(decorateAcademic).observe($('#messages'), { childList: true });
  decorateAcademic();

  /* ---------- mic in Casual Chat (Gemini/OpenAI transcription, browser fallback) ---------- */
  /* ---------- voice input: stays ON until the user taps the mic again ----------
     AI mode records in ~40-second segments on one open microphone, so each piece is transcribed
     while recording carries on. Browser mode keeps speech recognition running and restarts it
     whenever the browser ends it after a pause. A 30-minute safety limit stops a forgotten mic. */
  const SEGMENT_MS = 40000, MAX_MS = 30 * 60000;
  let mic = null;
  const el = v => (typeof v === 'function' ? v() : v);
  function appendText(target, text) {
    const box = el(target);
    const v = String(text || '').trim(); if (!v || !box) return;
    box.value = (box.value.trim() ? box.value.trim() + ' ' : '') + v;
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }
  async function transcribeBlob(blob, type) {
    const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': type, 'X-ThesTalk-Access': App.accessCode() }, body: blob });
    let d = {}; try { d = await r.json(); } catch (e) { /* ignore */ }
    if (r.status === 422) return ''; // silence in this segment
    if (!r.ok) throw Error(d.error || 'Transcription failed.');
    return d.transcript || '';
  }
  function afterVoice() { if (ui.voiceAutoSend && $('#casualInput').value.trim()) sendCasual($('#casualInput').value); }
  function micStatus() {
    if (!mic) return;
    const act = el(mic.act); if (!act) return;
    act.textContent = mic.wanted ? t('voice.listening') + (mic.pending ? ' · ' + t('voice.transcribing') : '') : (mic.pending ? t('voice.transcribing') : '');
  }
  function finishMic(m) {
    if (m.pending || m.recorder || m.rec) return; // wait for the last pieces
    if (m.stream) m.stream.getTracks().forEach(tr => tr.stop());
    clearTimeout(m.limit);
    const btn = el(m.btn), act = el(m.act);
    if (btn) { btn.classList.remove('recording'); btn.setAttribute('aria-pressed', 'false'); }
    if (act) act.textContent = '';
    if (mic === m) mic = null;
    if (m.after) m.after();
  }
  function stopMic() {
    const m = mic; if (!m) return;
    m.wanted = false;
    clearTimeout(m.segTimer);
    if (m.recorder && m.recorder.state === 'recording') m.recorder.stop();
    else if (m.rec) { try { m.rec.stop(); } catch (e) { m.rec = null; } }
    micStatus(); finishMic(m);
  }
  function startSegment(m) {
    const recorder = new MediaRecorder(m.stream, m.mime ? { mimeType: m.mime } : undefined);
    const chunks = [];
    m.recorder = recorder;
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      m.recorder = null;
      const type = String(recorder.mimeType || m.mime || 'audio/webm').split(';')[0];
      if (m.wanted) startSegment(m); // keep listening while this piece is transcribed
      const blob = new Blob(chunks, { type });
      if (blob.size >= 1500) {
        m.pending++; micStatus();
        try { appendText(m.box, await transcribeBlob(blob, type)); }
        catch (e) { App.toast(e.message); }
        finally { m.pending--; micStatus(); }
      }
      if (!m.wanted) finishMic(m);
    };
    recorder.start();
    clearTimeout(m.segTimer);
    m.segTimer = setTimeout(() => { if (m.wanted && recorder.state === 'recording') recorder.stop(); }, SEGMENT_MS);
  }
  function startBrowser(m) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    m.rec = rec;
    rec.lang = m.lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) appendText(m.box, e.results[i][0].transcript); };
    rec.onerror = e => { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { m.wanted = false; App.toast(t('voice.denied')); } };
    rec.onend = () => {
      m.rec = null;
      if (m.wanted) setTimeout(() => { if (m.wanted) { try { startBrowser(m); } catch (e) { m.wanted = false; finishMic(m); } } }, 200);
      else finishMic(m);
    };
    rec.start();
  }
  /* Voice input for any text box. Tap once to start, tap again to stop. */
  async function toggleMic(btn, act, box, after, opts = {}) {
    if (mic) { const same = opts.key ? mic.key === opts.key : mic.btn === btn; stopMic(); if (same) return; }
    Speech.stop();
    const m = { key: opts.key || '', btn, act, box, after, wanted: true, pending: 0, stream: null, recorder: null, rec: null, mime: '', lang: opts.lang || (ui.lang === 'en' ? 'en-US' : 'ms-MY') };
    const canAI = !opts.browserOnly && App.aiAvailable() && App.transcriptionOn() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder;
    if (canAI) {
      try {
        m.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        m.mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(x => MediaRecorder.isTypeSupported(x)) || '';
        mic = m;
        startSegment(m);
      } catch (e) {
        if (m.stream) m.stream.getTracks().forEach(tr => tr.stop());
        m.stream = null; mic = null;
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) { App.toast(t('voice.denied')); return; }
      }
    }
    if (!mic) {
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) { App.toast(t('voice.unsupported')); return; }
      mic = m;
      try { startBrowser(m); } catch (e) { mic = null; App.toast(t('voice.unsupported')); return; }
    }
    const b = el(btn); if (b) { b.classList.add('recording'); b.setAttribute('aria-pressed', 'true'); }
    m.limit = setTimeout(() => { if (mic === m) stopMic(); }, MAX_MS);
    micStatus();
  }
  $('#askMic').addEventListener('click', () => toggleMic($('#askMic'), $('#askAct'), $('#askInput'), null));
  $('#fabNewPaper').addEventListener('click', () => { go('papers'); setTimeout(() => window.ThesTalkPapers && window.ThesTalkPapers.newPaper(), 0); });
  const toggleCasualMic = () => toggleMic($('#casualMic'), $('#casualActivity'), $('#casualInput'), afterVoice);
  $('#casualMic').addEventListener('click', toggleCasualMic);
  $('#voiceBtn').onclick = () => toggleMic($('#voiceBtn'), $('#chatActivity'), $('#chatInput'),
    () => { const box = $('#chatInput'); if ($('#autoSendVoice') && $('#autoSendVoice').checked && box.value.trim()) App.addMessage(box.value); },
    { browserOnly: $('#voiceMode') && $('#voiceMode').value === 'browser', lang: $('#voiceLang') && $('#voiceLang').value });

  /* ---------- reference export (RIS / BibTeX) ---------- */
  function sortedReferences() { return (App.state().references || []).slice().sort((a, b) => String(a.apa).localeCompare(String(b.apa))); }
  function download(name, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function exportRefs(kind) {
    const refs = sortedReferences();
    if (!refs.length) { App.toast(t('lib.exportEmpty')); return; }
    const X = window.ThesTalkRefExport;
    const file = kind === 'ris' ? 'thestalk-references.ris' : 'thestalk-references.bib';
    download(file, kind === 'ris' ? X.toRIS(refs) : X.toBibTeX(refs), kind === 'ris' ? 'application/x-research-info-systems' : 'application/x-bibtex');
    App.toast(t('lib.exported', { file }));
  }
  async function importRefs(file) {
    if (!file) return;
    const I = window.TalkademicRefImport;
    const s = App.state();
    const out = I.parse(await file.text(), /melayu|malay/i.test((s.project || {}).language || '') ? 'ms' : 'en');
    if (!out.refs.length) { App.toast(t('lib.importNone')); return; }
    if (!Array.isArray(s.references)) s.references = [];
    const r = I.merge(s.references, out.refs, App.date());
    App.save(); App.render(); App.renderRefsList();
    App.toast(t('lib.imported', { a: r.added, s: r.skipped }));
  }
  $('#importRefs').addEventListener('click', () => $('#importRefsFile').click());
  $('#importRefsFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; importRefs(f).catch(err => App.toast(err.message || 'Error')); });
  $('#exportRIS').addEventListener('click', () => exportRefs('ris'));
  $('#exportBib').addEventListener('click', () => exportRefs('bib'));

  /* ---------- library ---------- */
  function renderLibraryCount() { $('#libCount').textContent = fmt((App.state().references || []).length); }

  /* ---------- settings ---------- */
  $('#profileForm').addEventListener('submit', e => {
    e.preventDefault();
    ui.name = $('#profileName').value.trim().slice(0, 60); ui.role = $('#profileRole').value.trim().slice(0, 80); saveUI();
    renderIdentity(); renderCasual(); App.toast(t('set.saved'));
  });
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => { ui.lang = b.dataset.lang === 'en' ? 'en' : 'ms'; saveUI(); applyI18n(); }));
  $$('[data-theme-set]').forEach(b => b.addEventListener('click', () => { ui.theme = b.dataset.themeSet; saveUI(); applyTheme(); }));
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));
  $('#connectAI2').addEventListener('click', () => $('#unlockAI').click());
  $('#restartOnboarding').addEventListener('click', showOnboarding);
  function onAI(on) {
    const chip = $('#aiStatusMirror');
    if (chip) {
      chip.textContent = t(on ? 'ai.on' : 'ai.off');
      chip.classList.toggle('local', !on);
    }
    renderAI();
  }

  /* ---------- Pilih AI: Gemini (free) / Claude / ChatGPT ---------- */
  const AI_LIST = [
    { id: 'gemini', name: 'Gemini', by: 'Google', cost: 'ai.free' },
    { id: 'claude', name: 'Claude', by: 'Anthropic', cost: 'ai.paid' },
    { id: 'openai', name: 'ChatGPT', by: 'OpenAI', cost: 'ai.paid' },
    { id: 'groq', name: 'Groq', by: 'GPT-OSS · Qwen', cost: 'ai.free' }
  ];
  const aiKeys = () => (App.providers && App.providers()) || {};
  /* The AI that will actually answer: the saved choice if its key exists, otherwise the server default. */
  function aiChoice() {
    const k = aiKeys();
    if (k[ui.ai]) return ui.ai;
    const d = App.defaultProvider && App.defaultProvider();
    if (d && k[d]) return d;
    return (AI_LIST.find(a => k[a.id]) || AI_LIST[0]).id;
  }
  const aiName = id => (AI_LIST.find(a => a.id === id) || AI_LIST[0]).name;
  function fillAIOptions(box) {
    if (!box) return;
    const k = aiKeys(), on = App.aiAvailable(), cur = aiChoice();
    box.replaceChildren();
    // Only AIs that are switched on in this app are listed (paid ones without credits stay hidden).
    const shown = AI_LIST.filter(a => k[a.id]);
    (shown.length ? shown : AI_LIST.slice(0, 1)).forEach(a => {
      const usable = on && !!k[a.id];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ai-option'; b.dataset.ai = a.id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(usable && a.id === cur));
      b.disabled = !usable;
      const dot = document.createElement('span'); dot.className = 'ai-dot ai-' + a.id; dot.setAttribute('aria-hidden', 'true');
      const txt = document.createElement('span'); txt.className = 'ai-text';
      const nm = document.createElement('strong'); nm.textContent = a.name;
      const sub = document.createElement('small'); sub.textContent = usable ? t(a.cost) + ' · ' + a.by : (on ? t('ai.needKey') : a.by);
      txt.append(nm, sub);
      const tick = document.createElement('span'); tick.className = 'ai-tick'; tick.setAttribute('aria-hidden', 'true'); tick.textContent = '✓';
      b.append(dot, txt, tick);
      b.addEventListener('click', () => setAI(a.id));
      box.appendChild(b);
    });
  }
  function renderAI() {
    const on = App.aiAvailable();
    const pill = $('#aiPill');
    if (pill) { pill.hidden = !on; $('#aiPillName').textContent = aiName(aiChoice()); }
    fillAIOptions($('#aiOptions'));
    fillAIOptions($('#aiMenuOptions'));
    const note = $('#aiPickNote');
    if (note) note.textContent = t(on ? 'set.aiPickRefs' : 'set.aiPickLocked');
  }
  function setAI(id) {
    if (!aiKeys()[id]) return;
    const changed = ui.ai !== id;
    ui.ai = id; saveUI(); renderAI(); closeAIMenu();
    if (changed) App.toast(t('ai.switched').replace('{x}', aiName(id)));
  }
  function closeAIMenu() { const m = $('#aiMenu'); if (m) m.hidden = true; const p = $('#aiPill'); if (p) p.setAttribute('aria-expanded', 'false'); }
  $('#aiPill').addEventListener('click', e => {
    e.stopPropagation();
    const m = $('#aiMenu'), open = m.hidden;
    if (open) fillAIOptions($('#aiMenuOptions'));
    m.hidden = !open; e.currentTarget.setAttribute('aria-expanded', String(open));
    if (open) { const b = m.querySelector('[aria-checked="true"]') || m.querySelector('button:not([disabled])'); if (b) b.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.ai-pick-wrap')) closeAIMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAIMenu(); });

  /* ---------- search ---------- */
  function snippet(text, q) {
    const s = String(text || '').replace(/\s+/g, ' ');
    const i = s.toLowerCase().indexOf(q);
    if (i < 0) return s.slice(0, 80);
    return (i > 30 ? '…' : '') + s.slice(Math.max(0, i - 30), i + q.length + 50) + (i + q.length + 50 < s.length ? '…' : '');
  }
  function runSearch(raw) {
    const q = raw.trim().toLowerCase();
    const box = $('#searchResults');
    if (q.length < 2) { closeSearch(); return; }
    const s = App.state(), out = [];
    (s.casualMessages || []).forEach(m => { if (m.text.toLowerCase().includes(q)) out.push([t('search.casual'), snippet(m.text, q), () => go('casual')]); });
    (s.messages || []).forEach(m => { if (m.text.toLowerCase().includes(q)) out.push([t('search.academic'), snippet(m.text, q), () => go('academic', 'research')]); });
    s.chapters.forEach(ch => ch.sections.forEach(sec => {
      if (sec.title.toLowerCase().includes(q) || String(sec.content || '').toLowerCase().includes(q)) {
        out.push([t('search.section'), sec.title + ' — ' + snippet(sec.content || sec.title, q), () => { App.select(ch.id, sec.id); go('academic', 'thesis'); }]);
      }
    }));
    (s.references || []).forEach(r => { if (String(r.apa).toLowerCase().includes(q)) out.push([t('search.ref'), snippet(r.apa, q), () => go('library')]); });
    box.replaceChildren();
    if (!out.length) { const p = document.createElement('div'); p.className = 'sr-empty'; p.textContent = t('search.empty'); box.appendChild(p); }
    out.slice(0, 12).forEach(([kind, text, act]) => {
      const b = document.createElement('button'); b.type = 'button';
      const k = document.createElement('span'); k.className = 'sr-kind'; k.textContent = kind;
      const tx = document.createElement('span'); tx.className = 'sr-text'; tx.textContent = text;
      b.append(k, tx);
      b.onclick = () => { act(); $('#globalSearch').value = ''; closeSearch(); };
      box.appendChild(b);
    });
    box.hidden = false;
  }
  function closeSearch() { const box = $('#searchResults'); if (box) box.hidden = true; }
  $('#globalSearch').addEventListener('input', e => runSearch(e.target.value));
  $('#globalSearch').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; closeSearch(); } if (e.key === 'ArrowDown') { const first = $('#searchResults button'); if (first) { e.preventDefault(); first.focus(); } } });
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) closeSearch(); });

  /* ---------- onboarding ---------- */
  let obLang = ui.lang, obMode = ui.mode;
  function renderOnboarding() {
    const o = otherLang(obLang);
    $('#obWelcome').textContent = tr(obLang, 'ob.welcome');
    $('#obTitle1').textContent = tr(obLang, 'ob.lang'); $$('.ob-alt')[0].textContent = tr(o, 'ob.lang');
    $('#obNameLabel').textContent = tr(obLang, 'ob.name'); $('#obName').placeholder = tr(obLang, 'ob.namePh');
    $('#obNext').textContent = tr(obLang, 'ob.next');
    $('#obTitle2').textContent = tr(obLang, 'ob.mode'); $('#obAlt2').textContent = tr(o, 'ob.mode');
    $('#obCasualT').textContent = tr(obLang, 'ob.casualT'); $('#obCasualD').textContent = tr(obLang, 'ob.casualD');
    $('#obAcadT').textContent = tr(obLang, 'ob.acadT'); $('#obAcadD').textContent = tr(obLang, 'ob.acadD');
    $('#obStart').textContent = tr(obLang, 'ob.start');
    $$('[data-ob-lang]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.obLang === obLang)));
    $$('[data-ob-mode]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.obMode === obMode)));
  }
  function obStep(n) { $$('.ob-step').forEach(s => { s.hidden = s.dataset.step !== String(n); }); }
  function showOnboarding() {
    obLang = ui.lang; obMode = ui.mode;
    $('#obName').value = ui.name || '';
    renderOnboarding(); obStep(1);
    $('#onboard').hidden = false;
    setTimeout(() => { const b = document.querySelector('[data-ob-lang][aria-checked="true"]'); if (b) b.focus(); }, 60);
  }
  $$('[data-ob-lang]').forEach(b => b.addEventListener('click', () => { obLang = b.dataset.obLang; renderOnboarding(); }));
  $$('[data-ob-mode]').forEach(b => b.addEventListener('click', () => { obMode = b.dataset.obMode; renderOnboarding(); }));
  $('#obNext').addEventListener('click', () => {
    ui.lang = obLang; ui.name = $('#obName').value.trim().slice(0, 60); saveUI(); applyI18n();
    obStep(2);
    setTimeout(() => { const b = document.querySelector('[data-ob-mode][aria-checked="true"]'); if (b) b.focus(); }, 60);
  });
  $('#obStart').addEventListener('click', () => {
    ui.onboarded = true; saveUI(); setMode(obMode);
    $('#onboard').hidden = true;
    go('home');
  });

  /* ---------- backup & restore ---------- */
  const BK = window.ThesTalkBackup;
  const UNDO_KEY = 'thestalk_undo_restore_v1';
  const PREFS_KEY = 'thestalk_preferences_v2';
  const DAY = 86400000;
  function readPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function readUndo() { try { const u = JSON.parse(localStorage.getItem(UNDO_KEY) || 'null'); return u && BK.validWorkspace(u.workspace) ? u : null; } catch (e) { return null; } }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString(ui.lang === 'en' ? 'en-GB' : 'ms-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function canShareFiles() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] })); } catch (e) { return false; }
  }
  function backupFile() {
    App.persist();
    const s = App.state(), now = new Date();
    const text = JSON.stringify(BK.makeBackup(s, ui, readPrefs(), now));
    return new File([text], BK.backupFilename(s.project.title, now), { type: 'application/json' });
  }
  function markBackedUp() { ui.lastBackup = new Date().toISOString(); saveUI(); renderBackup(); }
  function saveBackup() {
    const f = backupFile();
    const url = URL.createObjectURL(f);
    const a = document.createElement('a');
    a.href = url; a.download = f.name; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    markBackedUp();
    App.toast(t('bk.saved').replace('{f}', f.name));
  }
  async function shareBackup() {
    const f = backupFile();
    try { await navigator.share({ files: [f], title: 'Talkademic backup' }); markBackedUp(); }
    catch (e) { if (!e || e.name !== 'AbortError') App.toast(t('bk.shareFail')); }
  }
  /* Replace the workspace, then reload so every view starts clean from the restored data. */
  function applyRestore(ws, newUI, prefs, doneKey) {
    if (!App.replaceState(ws)) {
      localStorage.removeItem(UNDO_KEY); // free space and try once more
      if (!App.replaceState(ws)) { App.toast(t('bk.err.storage')); renderBackup(); return; }
    }
    Object.assign(ui, newUI || {}, { onboarded: true });
    saveUI();
    try { if (prefs && Object.keys(prefs).length) localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* optional */ }
    try { sessionStorage.setItem('thestalk_flash', t(doneKey)); } catch (e) { /* optional */ }
    location.reload();
  }
  async function restoreFrom(file) {
    let parsed;
    try { parsed = BK.parseBackup(await file.text()); }
    catch (e) { App.toast(t('bk.err.' + (e.code || 'not-thestalk'))); return; }
    const sm = parsed.summary;
    const msg = t('bk.confirm').replace('{t}', sm.title || '—').replace('{d}', parsed.exportedAt ? fmtDate(parsed.exportedAt) : t('bk.unknownDate'))
      .replace('{c}', fmt(sm.chapters)).replace('{w}', fmt(sm.words)).replace('{r}', fmt(sm.references));
    if (!confirm(msg)) return;
    try {
      App.persist();
      localStorage.setItem(UNDO_KEY, JSON.stringify({ at: new Date().toISOString(), workspace: App.state(), ui: Object.assign({}, ui), preferences: readPrefs() }));
    } catch (e) {
      localStorage.removeItem(UNDO_KEY);
      if (!confirm(t('bk.noUndo'))) return;
    }
    applyRestore(parsed.workspace, parsed.ui, parsed.preferences, 'bk.restored');
  }
  /* Used by sync: keep an undo copy, then switch to the workspace from the other device. */
  function syncApply(ws, prefs, flashText) {
    try { App.persist(); localStorage.setItem(UNDO_KEY, JSON.stringify({ at: new Date().toISOString(), workspace: App.state(), ui: Object.assign({}, ui), preferences: readPrefs() })); }
    catch (e) { localStorage.removeItem(UNDO_KEY); }
    applyRestore(ws, {}, prefs, flashText);
  }
  function undoRestore() {
    const u = readUndo();
    if (!u) { localStorage.removeItem(UNDO_KEY); renderBackup(); return; }
    if (!confirm(t('bk.undoConfirm'))) return;
    localStorage.removeItem(UNDO_KEY);
    applyRestore(u.workspace, u.ui, u.preferences, 'bk.undone');
  }
  function renderBackup() {
    const last = $('#backupLast');
    if (!last) return;
    last.textContent = ui.lastBackup ? t('bk.last').replace('{d}', fmtDate(ui.lastBackup)) : t('bk.never');
    $('#backupShare').hidden = !canShareFiles();
    $('#backupUndo').hidden = !readUndo();
    // Home reminder: only once there is work to lose, and no backup in the last 7 days.
    const s = App.state(), n = totals();
    const hasWork = n.words > 0 || n.refs > 0 || (s.messages || []).length > 0 || (s.casualMessages || []).length > 0;
    const age = ui.lastBackup ? Math.floor((Date.now() - new Date(ui.lastBackup).getTime()) / DAY) : Infinity;
    const nudge = $('#backupNudge');
    nudge.hidden = !(hasWork && age >= 7);
    if (!nudge.hidden) $('#backupNudgeText').textContent = isFinite(age) ? t('bk.nudgeOld').replace('{n}', age) : t('bk.nudgeNever');
  }
  $('#backupSave').addEventListener('click', saveBackup);
  $('#backupNudgeBtn').addEventListener('click', saveBackup);
  $('#backupShare').addEventListener('click', shareBackup);
  $('#backupRestore').addEventListener('click', () => $('#backupFile').click());
  $('#backupFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) restoreFrom(f); });
  $('#backupUndo').addEventListener('click', undoRestore);
  // An undo copy doubles storage use, so it is dropped after 7 days.
  (() => { const u = readUndo(); if (!u || Date.now() - new Date(u.at).getTime() > 7 * DAY) localStorage.removeItem(UNDO_KEY); })();

  /* ---------- import a Word thesis (read on the device) ---------- */
  async function importThesis(file) {
    let parsed;
    try { parsed = await window.TalkademicDocx.read(file); }
    catch (e) { App.toast(t('imp.err.' + (e.code || 'not-docx'))); return; }
    const m = window.TalkademicDocx.toThesis(parsed);
    if (!m.chapters.length) { App.toast(t('imp.err.empty')); return; }
    const s = App.state(), n = totals();
    const w = m.chapters.reduce((a, c) => a + c.sections.reduce((b, x) => b + (String(x.content).match(/\S+/g) || []).length, 0), 0);
    let msg = t('imp.thesisConfirm').replace('{c}', fmt(m.chapters.length)).replace('{w}', fmt(w)).replace('{r}', fmt(m.references.length));
    if (n.words) msg += '\n\n' + t('imp.thesisReplace');
    if (!confirm(msg)) return;
    App.persist();
    try { localStorage.setItem(UNDO_KEY, JSON.stringify({ at: new Date().toISOString(), workspace: s, ui: Object.assign({}, ui), preferences: readPrefs() })); } catch (e) { localStorage.removeItem(UNDO_KEY); }
    const known = new Set((s.references || []).map(r => String(r.apa || '').toLowerCase()));
    const refs = (s.references || []).slice();
    for (const r of m.references) {
      const k = r.apa.toLowerCase();
      if (known.has(k)) continue;
      known.add(k);
      refs.push({ apa: r.apa, doi: r.doi || '', url: r.url || '', title: r.title || '', year: r.year || '', authors: r.authors || [], venue: '', volume: '', issue: '', pages: '', type: 'import', addedAt: new Date().toISOString().slice(0, 10) });
    }
    const next = Object.assign({}, s, { chapters: m.chapters, references: refs, activeChapter: m.chapters[0].id, activeSection: m.chapters[0].sections[0].id });
    if (m.title && !String(s.project && s.project.title || '').trim()) next.project = Object.assign({}, s.project, { title: m.title.slice(0, 300) });
    if (!BK.validWorkspace(next) || !App.replaceState(next)) { App.toast(t('imp.err.storage')); return; }
    refresh();
    App.toast(t('imp.thesisDone').replace('{c}', fmt(m.chapters.length)).replace('{r}', fmt(m.references.length)));
  }
  $('#importThesis').addEventListener('click', () => $('#thesisDocx').click());
  $('#thesisDocx').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importThesis(f); });

  /* ---------- refresh hook used by app.js ---------- */
  let refreshTimer = null;
  function refresh() {
    try { if (window.TalkademicSync) window.TalkademicSync.changed(); } catch (e) { /* sync not ready */ }
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      renderHome();
      renderLibraryCount();
      renderBackup();
      if (current === 'projects') { renderProjects(); if (window.ThesTalkPapers) window.ThesTalkPapers.renderProjectsCard(); }
    }, 30);
  }

  window.ThesTalkShell = { refresh, onAI, go, t, aiChoice, lang: () => ui.lang, mic: toggleMic, micOn: key => !!mic && mic.key === key, syncApply, ui: () => Object.assign({}, ui), prefs: readPrefs };

  /* ---------- boot ---------- */
  applyTheme();
  $('#academicGroup').hidden = !ui.academicOpen;
  $('#academicToggle').setAttribute('aria-expanded', String(ui.academicOpen));
  setMode(ui.mode);
  applyI18n();
  onAI(App.aiAvailable());
  renderBackup();
  try { const m = sessionStorage.getItem('thestalk_flash'); if (m) { sessionStorage.removeItem('thestalk_flash'); setTimeout(() => App.toast(m), 300); } } catch (e) { /* optional */ }
  $('#autoSpeak').checked = !!ui.autoSpeak;
  $('#voiceAutoSend').checked = !!ui.voiceAutoSend;
  renderVoiceInfo();
  show(location.hash.slice(1) || 'home');
  if (!ui.onboarded) showOnboarding();
})();
