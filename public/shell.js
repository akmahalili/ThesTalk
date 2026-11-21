/* ThesTalk shell: navigation, dashboard, BM/EN interface, light/dark theme,
   first-run onboarding, casual chat, proofreading, local search.
   Works on top of app.js through window.ThesTalkApp. */
(() => {
  'use strict';
  const App = window.ThesTalkApp;
  if (!App) return;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const UI_KEY = 'thestalk_ui_v1';
  const VIEWS = ['home', 'casual', 'academic', 'proofread', 'projects', 'library', 'settings'];

  const ui = Object.assign({ lang: 'ms', theme: 'system', name: '', mode: 'casual', onboarded: false, academicOpen: true, autoSpeak: false, voiceAutoSend: false }, readUI());
  function readUI() { try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveUI() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) { /* storage unavailable */ } }

  /* ---------- text ---------- */
  const T = {
    ms: {
      'voice.speak': 'Cakap untuk menaip', 'voice.listening': '🎙 Sedang mendengar… tekan lagi untuk berhenti', 'voice.transcribing': '🎙 Menukar suara kepada teks…',
      'voice.unsupported': 'Pelayar ini tidak menyokong input suara. Cuba Chrome.', 'voice.denied': 'Akses mikrofon ditolak. Benarkan mikrofon dalam tetapan pelayar.',
      'tts.listen': 'Dengar', 'tts.listenShort': 'Dengar', 'tts.unsupported': 'Pelayar ini tidak boleh membaca teks dengan suara.', 'tts.empty': 'Tiada teks untuk dibaca.',
      'tts.sample': 'Hai! Ini suara ThesTalk. Saya boleh bacakan jawapan dan draf tesis anda.', 'tts.hasMs': 'Suara Bahasa Melayu tersedia ✓', 'tts.noMs': 'Suara Bahasa Melayu tidak dijumpai pada peranti ini.',
      'lib.exportLabel': 'Eksport ke Mendeley / Zotero / EndNote', 'lib.exportHelp': 'Di Mendeley atau Zotero, pilih Import dan pilih fail ini.', 'lib.exportEmpty': 'Belum ada rujukan untuk dieksport.', 'lib.exported': 'Fail {file} dimuat turun.',
      'set.voice': 'Suara', 'set.autoSpeak': 'Baca jawapan AI secara automatik', 'set.voiceSend': 'Hantar terus selepas saya bercakap (Sembang Santai)', 'set.testVoice': 'Uji suara',
      'set.voiceHelp': 'Tiada suara BM? Di Android: Tetapan → Teks-ke-pertuturan → Enjin Google → pasang Bahasa Melayu.',
      'brand.tag': 'Sembang • Belajar • Menyelidik',
      'nav.dashboard': 'Dashboard', 'nav.home': 'Utama', 'nav.casual': 'Sembang', 'nav.academic': 'Akademik', 'nav.academicUp': 'AKADEMIK',
      'nav.projects': 'Projek Saya', 'nav.projectsShort': 'Projek', 'nav.library': 'Perpustakaan', 'nav.settings': 'Tetapan', 'nav.profile': 'Profil',
      'theme.toggle': 'Tukar tema', 'saved.title': 'Disimpan pada peranti ini', 'saved.body': 'Kandungan kekal dalam pelayar ini kecuali anda eksport. Tiada penyegerakan awan.',
      'search.label': 'Cari dalam ThesTalk', 'search.ph': 'Cari dalam ThesTalk…', 'search.empty': 'Tiada hasil untuk carian ini.',
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
      'casual.welcome': 'Hai! 👋 Saya ThesTalk. Tanya apa sahaja, dalam BM atau English. Nak idea, cadangan hiburan, bantuan menulis atau saranan? Saya sedia membantu.',
      'casual.noai': 'Mesej disimpan. Untuk balasan AI, sambungkan AI di Tetapan.', 'casual.working': 'ThesTalk sedang menaip…', 'casual.confirmClear': 'Kosongkan sembang santai ini?',
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
      'proof.title': 'Semakan Tatabahasa & Gaya', 'proof.sub': 'Tampal teks anda. ThesTalk membetulkan tatabahasa, ejaan dan kejelasan tanpa mengubah maksud atau sitasi.', 'proof.input': 'Teks anda',
      'proof.ph': 'Tampal perenggan anda di sini…', 'proof.btn': 'Semak teks', 'proof.result': 'Teks disemak', 'proof.note': 'Semak setiap perubahan sebelum guna. Fakta dan sitasi tidak disahkan oleh semakan ini.',
      'proof.insert': 'Masukkan ke seksyen tesis terpilih', 'proof.empty': 'Tampal sekurang-kurangnya satu ayat dahulu.', 'proof.needsAI': 'Semakan memerlukan AI. Sambungkan AI di Tetapan.',
      'proof.working': 'Sedang menyemak…', 'proof.done': 'Siap. Bandingkan dengan teks asal sebelum guna.', 'proof.confirm': 'Masukkan teks disemak ke dalam {section}?', 'proof.inserted': 'Dimasukkan ke dalam {section}.', 'proof.copied': 'Teks disalin.',
      'proj.sub': 'Satu projek tesis disimpan dalam pelayar ini. Eksport DOCX sebagai sandaran.', 'proj.open': 'Buka ruang kerja tesis', 'proj.edit': 'Edit profil tesis', 'proj.new': 'Projek baharu', 'proj.save': 'Simpan projek',
      'lib.sub': 'Rujukan daripada draf yang anda masukkan ke dalam tesis. Ia ditambah sebagai senarai Rujukan di hujung fail DOCX.', 'lib.copyAll': 'Salin semua', 'lib.find': 'Cari rujukan untuk idea baharu',
      'set.profile': 'Profil', 'set.name': 'Nama paparan', 'set.namePh': 'cth. Nur Akma', 'set.saved': 'Profil disimpan.', 'set.lang': 'Bahasa antara muka', 'set.theme': 'Tema', 'set.light': 'Cerah', 'set.dark': 'Gelap', 'set.system': 'Ikut peranti',
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
      'tts.sample': 'Hi! This is the ThesTalk voice. I can read your answers and thesis drafts aloud.', 'tts.hasMs': 'Malay voice available ✓', 'tts.noMs': 'No Malay voice found on this device.',
      'lib.exportLabel': 'Export to Mendeley / Zotero / EndNote', 'lib.exportHelp': 'In Mendeley or Zotero, choose Import and pick this file.', 'lib.exportEmpty': 'No references to export yet.', 'lib.exported': '{file} downloaded.',
      'set.voice': 'Voice', 'set.autoSpeak': 'Read AI replies aloud automatically', 'set.voiceSend': 'Send right after I finish speaking (Casual Chat)', 'set.testVoice': 'Test voice',
      'set.voiceHelp': 'No Malay voice? On Android: Settings → Text-to-speech → Google engine → install Malay.',
      'brand.tag': 'Chat • Learn • Research',
      'nav.dashboard': 'Dashboard', 'nav.home': 'Home', 'nav.casual': 'Chat', 'nav.academic': 'Academic', 'nav.academicUp': 'ACADEMIC',
      'nav.projects': 'My Projects', 'nav.projectsShort': 'Projects', 'nav.library': 'Library', 'nav.settings': 'Settings', 'nav.profile': 'Profile',
      'theme.toggle': 'Switch theme', 'saved.title': 'Saved on this device', 'saved.body': 'Your content stays in this browser unless you export it. No cloud sync.',
      'search.label': 'Search in ThesTalk', 'search.ph': 'Search in ThesTalk…', 'search.empty': 'No results for this search.',
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
      'casual.welcome': 'Hi! 👋 I’m ThesTalk. Ask me anything, in Malay or English. Need ideas, something fun to do, help with writing or a suggestion? I’m here to help.',
      'casual.noai': 'Message saved. For AI replies, connect AI in Settings.', 'casual.working': 'ThesTalk is typing…', 'casual.confirmClear': 'Clear this casual chat?',
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
      'proof.title': 'Proofread & Style', 'proof.sub': 'Paste your text. ThesTalk fixes grammar, spelling and clarity without changing the meaning or citations.', 'proof.input': 'Your text',
      'proof.ph': 'Paste your paragraph here…', 'proof.btn': 'Check text', 'proof.result': 'Checked text', 'proof.note': 'Review every change before using it. This check does not verify facts or citations.',
      'proof.insert': 'Insert into selected thesis section', 'proof.empty': 'Paste at least one sentence first.', 'proof.needsAI': 'Proofreading needs AI. Connect AI in Settings.',
      'proof.working': 'Checking…', 'proof.done': 'Done. Compare with your original before using it.', 'proof.confirm': 'Insert the checked text into {section}?', 'proof.inserted': 'Inserted into {section}.', 'proof.copied': 'Text copied.',
      'proj.sub': 'One thesis project is stored in this browser. Export DOCX as a backup.', 'proj.open': 'Open thesis workspace', 'proj.edit': 'Edit thesis profile', 'proj.new': 'New project', 'proj.save': 'Save project',
      'lib.sub': 'References from drafts you inserted into your thesis. They are added as a References list at the end of your DOCX.', 'lib.copyAll': 'Copy all', 'lib.find': 'Find references for a new idea',
      'set.profile': 'Profile', 'set.name': 'Display name', 'set.namePh': 'e.g. Nur Akma', 'set.saved': 'Profile saved.', 'set.lang': 'Interface language', 'set.theme': 'Theme', 'set.light': 'Light', 'set.dark': 'Dark', 'set.system': 'Match device',
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
    $('#academicToggle').classList.toggle('active', view === 'academic' || view === 'proofread');
    $$('.nav-sub').forEach(b => b.classList.toggle('active', (b.dataset.go === view) && (view !== 'academic' || b.dataset.focus === (focus || lastFocus))));
    const bottomMap = { academic: 'projects', proofread: 'home' };
    const bottom = bottomMap[view] || view;
    $$('.bottom-nav button').forEach(b => { const on = b.dataset.go === bottom; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (view === 'academic') applyFocus(focus);
    if (view === 'library') App.renderRefsList();
    if (view === 'casual') { renderCasual(); }
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
    (s.casualMessages || []).filter(m => m.role === 'user').slice(-5).forEach(m => items.push({ kind: 'casual', text: m.text, at: m.at }));
    (s.messages || []).filter(m => m.role === 'user').slice(-5).forEach(m => items.push({ kind: 'academic', text: m.text, at: m.at }));
    if (s.conversion && s.conversion.at && s.conversion.isAI) items.push({ kind: 'draft', text: s.conversion.text, at: s.conversion.at });
    return items.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 4);
  }
  function icon(id) { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'ic'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#' + id); svg.appendChild(use); return svg; }
  function renderRecent() {
    const ul = $('#recentList');
    ul.replaceChildren();
    const items = recentItems();
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
      li.appendChild(b); ul.appendChild(li);
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
    if (!App.aiAvailable()) { App.toast(t('casual.noai')); return; }
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
    if (!App.aiAvailable()) { status.textContent = t('proof.needsAI'); return; }
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
  let recorder = null, recStream = null, recChunks = [], browserRec = null;
  function appendText(box, text) {
    const v = String(text || '').trim(); if (!v) return;
    box.value = (box.value.trim() ? box.value.trim() + ' ' : '') + v;
    box.focus();
  }
  async function transcribeBlob(blob, type) {
    const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': type, 'X-ThesTalk-Access': App.accessCode() }, body: blob });
    let d = {}; try { d = await r.json(); } catch (e) { /* ignore */ }
    if (!r.ok) throw Error(d.error || 'Transcription failed.');
    return d.transcript || '';
  }
  function afterVoice() { if (ui.voiceAutoSend && $('#casualInput').value.trim()) sendCasual($('#casualInput').value); }
  async function toggleCasualMic() {
    const btn = $('#casualMic'), act = $('#casualActivity');
    if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
    if (browserRec) { browserRec.stop(); return; }
    Speech.stop();
    const canAI = App.aiAvailable() && App.transcriptionOn() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder;
    if (canAI) {
      try {
        recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(x => MediaRecorder.isTypeSupported(x)) || '';
        recorder = new MediaRecorder(recStream, mime ? { mimeType: mime } : undefined);
        recChunks = [];
        recorder.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
        recorder.onstop = async () => {
          recStream.getTracks().forEach(tr => tr.stop());
          btn.classList.remove('recording');
          const type = String(recorder.mimeType || 'audio/webm').split(';')[0];
          const blob = new Blob(recChunks, { type });
          recorder = null;
          if (blob.size < 150) { act.textContent = ''; return; }
          act.textContent = t('voice.transcribing');
          try { appendText($('#casualInput'), await transcribeBlob(blob, type)); act.textContent = ''; afterVoice(); }
          catch (e) { act.textContent = ''; App.toast(e.message); }
        };
        recorder.start();
        btn.classList.add('recording'); act.textContent = t('voice.listening');
        setTimeout(() => { if (recorder && recorder.state === 'recording') recorder.stop(); }, 90000);
        return;
      } catch (e) {
        if (recStream) recStream.getTracks().forEach(tr => tr.stop());
        recorder = null;
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) { App.toast(t('voice.denied')); return; }
      }
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { App.toast(t('voice.unsupported')); return; }
    browserRec = new SR();
    browserRec.lang = ui.lang === 'en' ? 'en-US' : 'ms-MY';
    browserRec.interimResults = false;
    browserRec.onresult = e => appendText($('#casualInput'), Array.from(e.results).map(r => r[0].transcript).join(' '));
    browserRec.onerror = e => { if (e && e.error === 'not-allowed') App.toast(t('voice.denied')); };
    browserRec.onend = () => { browserRec = null; btn.classList.remove('recording'); act.textContent = ''; afterVoice(); };
    try { browserRec.start(); btn.classList.add('recording'); act.textContent = t('voice.listening'); }
    catch (e) { browserRec = null; App.toast(t('voice.unsupported')); }
  }
  $('#casualMic').addEventListener('click', toggleCasualMic);

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
  $('#exportRIS').addEventListener('click', () => exportRefs('ris'));
  $('#exportBib').addEventListener('click', () => exportRefs('bib'));

  /* ---------- library ---------- */
  function renderLibraryCount() { $('#libCount').textContent = fmt((App.state().references || []).length); }

  /* ---------- settings ---------- */
  $('#profileForm').addEventListener('submit', e => {
    e.preventDefault();
    ui.name = $('#profileName').value.trim().slice(0, 60); saveUI();
    renderIdentity(); renderCasual(); App.toast(t('set.saved'));
  });
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => { ui.lang = b.dataset.lang === 'en' ? 'en' : 'ms'; saveUI(); applyI18n(); }));
  $$('[data-theme-set]').forEach(b => b.addEventListener('click', () => { ui.theme = b.dataset.themeSet; saveUI(); applyTheme(); }));
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));
  $('#connectAI2').addEventListener('click', () => $('#unlockAI').click());
  $('#restartOnboarding').addEventListener('click', showOnboarding);
  function onAI(on) {
    const chip = $('#aiStatusMirror');
    if (!chip) return;
    chip.textContent = t(on ? 'ai.on' : 'ai.off');
    chip.classList.toggle('local', !on);
  }

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

  /* ---------- refresh hook used by app.js ---------- */
  let refreshTimer = null;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      renderHome();
      renderLibraryCount();
      if (current === 'projects') renderProjects();
    }, 30);
  }

  window.ThesTalkShell = { refresh, onAI, go, t };

  /* ---------- boot ---------- */
  applyTheme();
  $('#academicGroup').hidden = !ui.academicOpen;
  $('#academicToggle').setAttribute('aria-expanded', String(ui.academicOpen));
  setMode(ui.mode);
  applyI18n();
  onAI(App.aiAvailable());
  $('#autoSpeak').checked = !!ui.autoSpeak;
  $('#voiceAutoSend').checked = !!ui.voiceAutoSend;
  renderVoiceInfo();
  show(location.hash.slice(1) || 'home');
  if (!ui.onboarded) showOnboarding();
})();
