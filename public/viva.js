/* Talkademic "Latihan Viva": an AI examiner reads your thesis or paper and asks the questions a real
   panel would ask, one at a time, aloud if you like. Answer by voice or typing; get a score, what was
   missing, a model answer built from your own text and a follow-up question. A summary at the end
   shows the weakest areas, and the whole session can be saved as a Word file for revision. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Latihan Viva', alt: 'Viva Practice', sub: 'Pemeriksa AI baca tesis anda dan tanya soalan seperti panel sebenar. Jawab dengan suara atau taip, kemudian dapat maklum balas dan contoh jawapan daripada tesis anda sendiri.',
      source: 'Bahan', thesis: 'Tesis', paper: 'Paper', kind: 'Jenis sesi', 'k.proposal': 'Pembentangan proposal', 'k.viva': 'Viva akhir', 'k.conference': 'Soal jawab persidangan',
      style: 'Gaya pemeriksa', 's.supportive': 'Mesra', 's.balanced': 'Seimbang', 's.tough': 'Tegas (pemeriksa luar)', count: 'Bilangan soalan', language: 'Bahasa', voice: 'Bacakan soalan dengan suara',
      start: '🎓 Mula sesi viva', starting: 'Pemeriksa sedang membaca tesis anda… (sehingga 1 minit)', need: 'Tulis sekurang-kurangnya beberapa bahagian tesis dahulu.',
      qn: 'Soalan {i} daripada {n}', listen: '🔊 Dengar', answer: 'Jawapan anda', answerPh: 'Taip jawapan, atau tekan 🎙 dan jawab dengan suara seperti di hadapan panel…', mic: 'Jawab dengan suara',
      submit: 'Hantar jawapan', checking: 'Pemeriksa sedang menilai jawapan…', skip: 'Langkau', hint: 'Lihat isi penting', hideHint: 'Sembunyi isi penting', tests: 'Pemeriksa menguji:',
      score: 'Skor', strengths: 'Kekuatan', missing: 'Yang tertinggal', better: 'Contoh jawapan yang lebih kuat', followUp: 'Soalan susulan', answerFollow: 'Jawab soalan susulan', next: 'Soalan seterusnya', finish: 'Tamat & lihat ringkasan',
      skipped: 'Dilangkau', summary: 'Ringkasan sesi', avg: 'Purata skor', answered: '{a} dijawab · {s} dilangkau', weakest: 'Perlu lebih latihan', byArea: 'Mengikut bidang', again: 'Sesi baharu', review: 'Ulang soalan lemah',
      docx: '⬇ Simpan sesi (Word)', end: 'Tamatkan sesi', confirmEnd: 'Tamatkan sesi ini? Jawapan yang sudah dinilai disimpan dalam sejarah.', history: 'Sesi lepas', none: 'Belum ada sesi.', time: 'Masa',
      'a.contribution': 'Sumbangan', 'a.problem': 'Masalah & jurang', 'a.literature': 'Literatur', 'a.theory': 'Teori', 'a.method': 'Kaedah', 'a.sampling': 'Sampel & instrumen', 'a.analysis': 'Analisis', 'a.findings': 'Dapatan', 'a.limitations': 'Limitasi', 'a.implications': 'Implikasi', 'a.general': 'Umum',
      tip: 'Tip: jawab dalam 1–2 minit. Mulakan dengan jawapan terus, kemudian justifikasi dengan bukti daripada kajian anda.', fileName: 'Latihan-viva'
    },
    en: {
      title: 'Viva Practice', alt: 'Latihan Viva', sub: 'An AI examiner reads your thesis and asks questions like a real panel. Answer by voice or typing, then get feedback and a model answer built from your own thesis.',
      source: 'Material', thesis: 'Thesis', paper: 'Paper', kind: 'Session', 'k.proposal': 'Proposal defence', 'k.viva': 'Final viva', 'k.conference': 'Conference Q&A',
      style: 'Examiner style', 's.supportive': 'Supportive', 's.balanced': 'Balanced', 's.tough': 'Tough (external examiner)', count: 'Number of questions', language: 'Language', voice: 'Read the questions aloud',
      start: '🎓 Start viva session', starting: 'The examiner is reading your thesis… (up to a minute)', need: 'Write at least a few sections of the thesis first.',
      qn: 'Question {i} of {n}', listen: '🔊 Listen', answer: 'Your answer', answerPh: 'Type your answer, or press 🎙 and answer aloud as you would to the panel…', mic: 'Answer by voice',
      submit: 'Submit answer', checking: 'The examiner is assessing your answer…', skip: 'Skip', hint: 'Show key points', hideHint: 'Hide key points', tests: 'The examiner is testing:',
      score: 'Score', strengths: 'Strengths', missing: 'Missing', better: 'A stronger answer', followUp: 'Follow-up question', answerFollow: 'Answer the follow-up', next: 'Next question', finish: 'Finish & see summary',
      skipped: 'Skipped', summary: 'Session summary', avg: 'Average score', answered: '{a} answered · {s} skipped', weakest: 'Needs more practice', byArea: 'By area', again: 'New session', review: 'Retry weak questions',
      docx: '⬇ Save session (Word)', end: 'End session', confirmEnd: 'End this session? Assessed answers are kept in the history.', history: 'Past sessions', none: 'No sessions yet.', time: 'Time',
      'a.contribution': 'Contribution', 'a.problem': 'Problem & gap', 'a.literature': 'Literature', 'a.theory': 'Theory', 'a.method': 'Method', 'a.sampling': 'Sample & instrument', 'a.analysis': 'Analysis', 'a.findings': 'Findings', 'a.limitations': 'Limitations', 'a.implications': 'Implications', 'a.general': 'General',
      tip: 'Tip: answer in 1–2 minutes. Start with the direct answer, then justify it with evidence from your study.', fileName: 'Viva-practice'
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
  let busy = '', showHint = false, timer = null, spokenFor = '';

  function data() {
    const s = App.state();
    if (!s.viva || typeof s.viva !== 'object') s.viva = { source: 'thesis', kind: 'viva', style: 'balanced', count: 8, language: (s.project || {}).language === 'English' ? 'English' : 'Bahasa Melayu', voice: true, session: null, history: [] };
    if (!Array.isArray(s.viva.history)) s.viva.history = [];
    return s.viva;
  }
  function material(id) {
    const s = App.state();
    if (id.startsWith('paper:')) {
      const p = (s.papers || []).find(x => 'paper:' + x.id === id);
      if (!p) return null;
      return { title: p.title || '', sections: (p.sections || []).map(x => ({ name: x.key, content: x.content || '' })) };
    }
    return { title: (s.project || {}).title || '', sections: (s.chapters || []).flatMap(c => (c.sections || []).map(x => ({ name: c.title + ' — ' + x.title, content: x.content || '' }))) };
  }
  const words = m => m.sections.reduce((n, x) => n + (String(x.content).match(/\S+/g) || []).length, 0);
  /* The text the feedback is judged against: the section the question came from, else the start of the document. */
  function excerpt(q) {
    const m = material(data().session.source) || { sections: [] };
    const key = String(q.source || '').toLowerCase();
    const hit = key && m.sections.find(x => x.name.toLowerCase().includes(key) || key.includes(x.name.toLowerCase().split(' — ').pop()));
    const pool = hit ? [hit, ...m.sections.filter(x => x !== hit)] : m.sections;
    return pool.map(x => '## ' + x.name + '\n' + x.content).join('\n').slice(0, 8000);
  }

  async function start(retry) {
    const d = data();
    if (retry) {
      const old = d.session;
      const weak = old.questions.filter(q => !q.feedback || q.feedback.score <= 3).map(q => ({ area: q.area, q: q.q, why: q.why, points: q.points, source: q.source }));
      if (!weak.length) return;
      d.session = { id: App.uid(), created: new Date().toISOString(), source: old.source, kind: old.kind, style: old.style, language: old.language, questions: weak, index: 0, done: false };
      App.save(); render(); return;
    }
    const m = material(d.source);
    if (!m || words(m) < 150) { App.toast(t('need')); return; }
    if (!(await App.ensureAI())) return;
    busy = 'start'; render();
    try {
      const res = await App.apiPost('/api/viva', { mode: 'questions', title: m.title, kind: d.kind, style: d.style, count: d.count, language: d.language, sections: m.sections });
      d.session = { id: App.uid(), created: new Date().toISOString(), source: d.source, kind: d.kind, style: d.style, language: d.language, questions: res.questions, index: 0, done: false };
      showHint = false; App.save();
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = ''; render(); }
  }
  const current = () => { const s = data().session; return s && !s.done ? s.questions[s.index] : null; };
  /* The question being answered: the main one, or its follow-up once that is open. */
  const target = q => (q.follow ? q.follow : q);

  async function submit() {
    const d = data(), q = current();
    if (!q) return;
    const tq = target(q);
    const box = $('#vivaAnswer');
    const answer = (box ? box.value : tq.draft || '').trim();
    if (answer.split(/\s+/).filter(Boolean).length < 3) { App.toast(t('answerPh')); return; }
    if (shell().micOn && shell().micOn('viva')) shell().mic(() => $('#vivaMic'), () => $('#vivaAct'), () => $('#vivaAnswer'), null, { key: 'viva' });
    if (!(await App.ensureAI())) return;
    tq.answer = answer; tq.seconds = tq.started ? Math.round((Date.now() - tq.started) / 1000) : 0;
    busy = 'check'; render();
    try {
      const res = await App.apiPost('/api/viva', { mode: 'feedback', kind: d.session.kind, style: d.session.style, language: d.session.language, question: tq.q, why: q.why, points: tq === q ? q.points : (q.feedback ? q.feedback.missing : q.points), answer, excerpt: excerpt(q) });
      tq.feedback = res.feedback; tq.draft = '';
      App.save();
    } catch (e) { App.toast(e.message || 'Error'); }
    finally { busy = ''; render(); }
  }
  function openFollow() {
    const q = current();
    if (!q || !q.feedback || !q.feedback.followUp) return;
    q.follow = { q: q.feedback.followUp, started: Date.now() };
    spokenFor = ''; showHint = false; App.save(); render();
  }
  function next(skip) {
    const d = data(), s = d.session, q = current();
    if (!s || !q) return;
    if (skip) q.skipped = true;
    if (s.index < s.questions.length - 1) s.index++; else finish();
    showHint = false; spokenFor = '';
    if (shell().stopSpeak) shell().stopSpeak();
    App.save(); render();
  }
  function stats(s) {
    const done = s.questions.filter(q => q.feedback);
    const avg = done.length ? done.reduce((a, q) => a + q.feedback.score, 0) / done.length : 0;
    const area = new Map();
    for (const q of done) { const a = area.get(q.area) || { n: 0, sum: 0 }; a.n++; a.sum += q.feedback.score; area.set(q.area, a); }
    return { done: done.length, skipped: s.questions.filter(q => q.skipped && !q.feedback).length, avg, areas: [...area.entries()].map(([k, v]) => ({ area: k, avg: v.sum / v.n, n: v.n })).sort((a, b) => a.avg - b.avg) };
  }
  function finish() {
    const d = data(), s = d.session;
    if (!s) return;
    s.done = true;
    const st = stats(s);
    if (st.done) d.history = [{ id: s.id, created: s.created, kind: s.kind, style: s.style, avg: st.avg, done: st.done, total: s.questions.length }, ...d.history.filter(x => x.id !== s.id)].slice(0, 12);
    if (timer) { clearInterval(timer); timer = null; }
  }

  /* The whole session as a Word file: each question, the answer, the feedback and the model answer. */
  function saveDocx() {
    const d = data(), s = d.session;
    if (!s || !window.ThesTalkDocx) return;
    const ms = !/english/i.test(s.language);
    const st = stats(s);
    const block = (q, label) => [label + ': ' + q.q, '', (ms ? 'Jawapan saya: ' : 'My answer: ') + (q.answer || (q.skipped ? t('skipped') : '—')),
      ...(q.feedback ? ['', t('score') + ': ' + q.feedback.score + '/5 — ' + q.feedback.verdict,
        q.feedback.strengths.length ? t('strengths') + ': ' + q.feedback.strengths.join('; ') : '', q.feedback.missing.length ? t('missing') + ': ' + q.feedback.missing.join('; ') : '',
        '', t('better') + ':', q.feedback.better] : [])].filter(x => x !== null);
    const chapters = s.questions.map((q, i) => ({ title: (ms ? 'Soalan ' : 'Question ') + (i + 1) + ' · ' + t('a.' + q.area), sections: [{ title: '', content: [
      ...block(q, ms ? 'Soalan' : 'Question'),
      ...(q.points && q.points.length ? ['', (ms ? 'Isi penting: ' : 'Key points: ') + q.points.join('; ')] : []),
      ...(q.follow ? ['', ...block(q.follow, t('followUp'))] : [])].join('\n') }] }));
    const doc = { project: { title: t('title') + ' — ' + (material(s.source) || {}).title, university: t('k.' + s.kind) + ' · ' + t('s.' + s.style) + ' · ' + new Date(s.created).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ms-MY'), degree: t('avg') + ': ' + st.avg.toFixed(1) + '/5', language: s.language }, chapters, references: [] };
    const blob = window.ThesTalkDocx.makeDocument(doc);
    const url = URL.createObjectURL(blob), a = h('a', { href: url, download: t('fileName') + '-' + s.created.slice(0, 10) + '.docx' });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ---------- view ---------- */
  const dots = n => h('span', { class: 'vv-dots', 'aria-label': n + '/5' }, [1, 2, 3, 4, 5].map(i => h('i', { class: i <= n ? 'on' : '' })));
  const fmtTime = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  function tick() {
    const el = $('#vivaTimer'), q = current();
    if (!el || !q) { if (timer) { clearInterval(timer); timer = null; } return; }
    const tq = target(q);
    if (tq.feedback || !tq.started) return;
    const sec = Math.round((Date.now() - tq.started) / 1000);
    el.textContent = fmtTime(sec);
    el.classList.toggle('long', sec > 150);
  }
  function feedbackCard(fb) {
    return h('div', { class: 'vv-fb' },
      h('div', { class: 'vv-fb-head' }, h('strong', { text: t('score') }), dots(fb.score), h('span', { class: 'vv-score', text: fb.score + '/5' })),
      fb.verdict ? h('p', { class: 'vv-verdict', text: fb.verdict }) : null,
      fb.strengths.length ? h('div', {}, h('h4', { text: '✓ ' + t('strengths') }), h('ul', {}, fb.strengths.map(x => h('li', { text: x })))) : null,
      fb.missing.length ? h('div', {}, h('h4', { text: '△ ' + t('missing') }), h('ul', {}, fb.missing.map(x => h('li', { text: x })))) : null,
      fb.better ? h('details', { class: 'vv-better' }, h('summary', { text: t('better') }), h('p', { text: fb.better }),
        h('button', { type: 'button', class: 'btn-reset text-action', onclick: e => shell().speak && shell().speak(fb.better, e.currentTarget), text: t('listen') })) : null);
  }
  function sessionView(d) {
    const s = d.session, q = current();
    const st = stats(s);
    if (!q) {
      const weak = s.questions.filter(x => x.feedback && x.feedback.score <= 3);
      return h('div', { class: 'card vv-summary' },
        h('h3', { text: t('summary') }),
        h('div', { class: 'vv-big' }, h('span', { class: 'vv-big-n', text: st.avg ? st.avg.toFixed(1) : '–' }), h('span', { class: 'muted', text: '/5 · ' + t('avg') })),
        h('p', { class: 'muted', text: t('answered', { a: st.done, s: st.skipped }) }),
        st.areas.length ? h('div', {}, h('h4', { text: t('byArea') }), h('ul', { class: 'vv-areas' }, st.areas.map(a => h('li', {}, h('span', { text: t('a.' + a.area) }), dots(Math.round(a.avg)), h('span', { class: 'muted small-note', text: a.avg.toFixed(1) }))))) : null,
        weak.length ? h('div', {}, h('h4', { text: t('weakest') }), h('ol', { class: 'vv-weak' }, weak.map(x => h('li', {}, h('p', { class: 'vv-wq', text: x.q }), feedbackCard(x.feedback))))) : null,
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: saveDocx, text: t('docx') }),
          weak.length || st.skipped ? h('button', { type: 'button', class: 'btn btn-outline', onclick: () => start(true), text: t('review') }) : null,
          h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { d.session = null; App.save(); render(); }, text: t('again') })));
    }
    const tq = target(q);
    if (!tq.started) { tq.started = Date.now(); App.save(); }
    const isFollow = tq !== q;
    const answered = !!tq.feedback;
    const box = h('textarea', { id: 'vivaAnswer', rows: 6, placeholder: t('answerPh'), value: tq.answer || tq.draft || '', disabled: answered || busy === 'check', oninput: e => { tq.draft = e.target.value; App.save(); } });
    const listening = !!(shell().micOn && shell().micOn('viva'));
    const mic = h('button', { id: 'vivaMic', type: 'button', class: 'icon-btn voice-btn' + (listening ? ' recording' : ''), 'aria-pressed': String(listening), 'aria-label': t('mic'), title: t('mic'), disabled: answered,
      onclick: () => { if (shell().stopSpeak) shell().stopSpeak(); if (shell().mic) shell().mic(() => $('#vivaMic'), () => $('#vivaAct'), () => $('#vivaAnswer'), null, { key: 'viva', lang: /english/i.test(s.language) ? 'en-US' : 'ms-MY' }); } }, '🎙');
    const speakQ = e => shell().speak && shell().speak(tq.q, e && e.currentTarget);
    if (d.voice && spokenFor !== tq.q && !answered) { spokenFor = tq.q; setTimeout(() => speakQ(), 250); }
    const last = s.index >= s.questions.length - 1;
    return h('div', { class: 'card vv-session' },
      h('div', { class: 'vv-top' },
        h('span', { class: 'vv-progress', text: t('qn', { i: s.index + 1, n: s.questions.length }) }),
        h('span', { class: 'vv-area', text: t('a.' + q.area) }),
        h('span', { id: 'vivaTimer', class: 'vv-timer', title: t('time'), text: answered ? fmtTime(tq.seconds || 0) : '0:00' })),
      h('div', { class: 'vv-bar', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round((s.index + (answered ? 1 : 0)) / s.questions.length * 100) + '%' })),
      isFollow ? h('div', { class: 'vv-prev' }, h('span', { class: 'muted small-note', text: q.q }), h('span', { class: 'vv-prev-score', text: t('score') + ' ' + q.feedback.score + '/5' })) : null,
      h('p', { class: 'vv-q' + (isFollow ? ' vv-follow' : '') }, isFollow ? h('span', { class: 'vv-follow-tag', text: t('followUp') }) : null, tq.q),
      h('div', { class: 'tool-row vv-qtools' },
        h('button', { type: 'button', class: 'btn-reset text-action', onclick: speakQ, text: t('listen') }),
        !isFollow ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { showHint = !showHint; render(); }, text: showHint ? t('hideHint') : t('hint') }) : null),
      showHint && !isFollow ? h('div', { class: 'vv-hint' }, q.why ? h('p', {}, h('strong', { text: t('tests') + ' ' }), q.why) : null, h('ul', {}, (q.points || []).map(p => h('li', { text: p })))) : null,
      h('label', { class: 'form-field' }, h('span', { text: t('answer') }), h('div', { class: 'vv-answer' }, box, mic)),
      h('div', { id: 'vivaAct', class: 'chat-activity', role: 'status' }),
      !answered ? h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: !!busy, onclick: submit, text: t('submit') }),
        h('button', { type: 'button', class: 'btn btn-outline', disabled: !!busy, onclick: () => (isFollow ? (q.follow = null, next(false)) : next(true)), text: t('skip') }),
        busy === 'check' ? h('span', { class: 'chat-activity', role: 'status', text: t('checking') }) : null) : null,
      answered ? feedbackCard(tq.feedback) : null,
      answered ? h('div', { class: 'tool-row' },
        !isFollow && tq.feedback.followUp && !q.follow ? h('button', { type: 'button', class: 'btn btn-outline', onclick: openFollow }, '↪ ', t('answerFollow')) : null,
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => next(false), text: last ? t('finish') : t('next') })) : null,
      !answered && !isFollow && tq.feedback === undefined && !(tq.answer || tq.draft) ? h('p', { class: 'muted small-note', text: t('tip') }) : null,
      h('button', { type: 'button', class: 'btn-reset text-action danger vv-end', onclick: () => { if (!confirm(t('confirmEnd'))) return; finish(); App.save(); render(); }, text: t('end') }));
  }

  function render() {
    const root = $('#view-viva');
    if (!root) return;
    const d = data(), s = App.state();
    const head = h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'vivaTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') })));
    if (d.session) {
      fill(root, head, sessionView(d));
      if (!timer && current()) timer = setInterval(tick, 1000);
      tick();
      return;
    }
    const sel = (key, opts, label) => { const el = h('select', { 'aria-label': label, onchange: e => { d[key] = key === 'count' ? Number(e.target.value) : e.target.value; App.save(); } }, opts.map(([v, txt]) => h('option', { value: String(v), text: txt }))); el.value = String(d[key]); return h('label', { class: 'form-field' }, h('span', { text: label }), el); };
    const papers = s.papers || [];
    fill(root, head,
      h('div', { class: 'card ana-form vv-setup' },
        sel('source', [['thesis', t('thesis') + ': ' + (((s.project || {}).title || '').trim() || '—')], ...papers.map(p => ['paper:' + p.id, t('paper') + ': ' + ((p.title || '').trim() || '—')])], t('source')),
        h('div', { class: 'ana-row' }, sel('kind', ['proposal', 'viva', 'conference'].map(k => [k, t('k.' + k)]), t('kind')), sel('style', ['supportive', 'balanced', 'tough'].map(k => [k, t('s.' + k)]), t('style'))),
        h('div', { class: 'ana-row' }, sel('count', [5, 8, 12].map(n => [n, String(n)]), t('count')), sel('language', [['Bahasa Melayu', 'Bahasa Melayu'], ['English', 'English']], t('language'))),
        h('label', { class: 'vv-check' }, h('input', { type: 'checkbox', checked: d.voice !== false, onchange: e => { d.voice = e.target.checked; App.save(); } }), h('span', { text: '🔊 ' + t('voice') })),
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: !!busy, onclick: () => start(false), text: t('start') }), busy === 'start' ? h('span', { class: 'chat-activity', role: 'status', text: t('starting') }) : null)),
      h('div', { class: 'card' }, h('h3', { text: t('history') }),
        d.history.length ? h('ul', { class: 'vv-history' }, d.history.map(x => h('li', {}, h('span', { text: new Date(x.created).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ms-MY') + ' · ' + t('k.' + x.kind) + ' · ' + t('s.' + x.style) }), h('span', { class: 'vv-hscore' }, dots(Math.round(x.avg)), ' ', x.avg ? x.avg.toFixed(1) : '–', ' · ', x.done + '/' + x.total)))) : h('p', { class: 'muted', text: t('none') })));
  }

  window.TalkademicViva = { render, _test: { stats } };
})();
