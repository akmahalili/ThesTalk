/* Talkademic "Sasaran & Peringatan": a daily word target with a streak, deadlines with a countdown,
   and calendar files (.ics) so the phone's own calendar gives the reminders (free, no account). */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      title: 'Sasaran & Peringatan', alt: 'Goals & Reminders', sub: 'Tetapkan sasaran perkataan harian, jejak streak, dan kira hari ke tarikh akhir. Peringatan masuk ke kalendar telefon anda.',
      today: 'Hari ini', of: 'daripada {n} perkataan', target: 'Sasaran harian (perkataan)', thesisTarget: 'Sasaran tesis keseluruhan (perkataan)', papersToo: 'Kira juga paper jurnal', streak: '{n} hari berturut-turut', streak0: 'Mulakan streak hari ini', best: 'Terbaik: {n} hari',
      left: 'Tulis {n} perkataan lagi untuk capai sasaran hari ini.', met: 'Sasaran hari ini tercapai. Syabas!', week: '7 hari lepas', countNote: 'Dikira daripada pertambahan perkataan dalam tesis dan paper anda hari ini, termasuk teks yang dijana atau diimport.',
      deadlines: 'Tarikh akhir', dTitle: 'Perkara', dTitlePh: 'Contoh: Hantar Bab 2 kepada penyelia', dDate: 'Tarikh', add: 'Tambah', none: 'Belum ada tarikh akhir.', days: '{n} hari lagi', today0: 'Hari ini', tomorrow: 'Esok', past: '{n} hari lepas',
      cal: 'Kalendar', calAll: 'Semua ke kalendar', remove: 'Buang', confirmRemove: 'Buang tarikh akhir ini?',
      reminder: 'Peringatan menulis harian', remTime: 'Masa', remBtn: 'Tambah ke kalendar telefon', remHelp: 'Muat turun fail kalendar, buka, dan pilih Tambah/Simpan. Telefon akan beri notifikasi setiap hari pada masa ini. Peringatan tarikh akhir: sehari dan seminggu sebelum, jam 9 pagi.',
      remSummary: 'Masa menulis tesis ({n} perkataan)', remDesc: 'Buka Talkademic: https://talkademic.vercel.app', dlDesc: 'Tarikh akhir daripada Talkademic', downloaded: 'Fail kalendar dimuat turun. Buka untuk tambah ke kalendar.',
      homeSet: 'Tetapkan sasaran harian dan tarikh akhir', homeOpen: 'Sasaran', needTitle: 'Tulis perkara dan pilih tarikh.', mon: 'Isn,Sel,Rab,Kha,Jum,Sab,Ahd'
    },
    en: {
      title: 'Goals & Reminders', alt: 'Sasaran & Peringatan', sub: 'Set a daily word target, keep a streak and count down to deadlines. Reminders go into your phone calendar.',
      today: 'Today', of: 'of {n} words', target: 'Daily target (words)', thesisTarget: 'Whole-thesis target (words)', papersToo: 'Count journal papers too', streak: '{n}-day streak', streak0: 'Start a streak today', best: 'Best: {n} days',
      left: 'Write {n} more words to reach today\'s target.', met: 'Today\'s target reached. Well done!', week: 'Last 7 days', countNote: 'Counted from the words added to your thesis and papers today, including generated or imported text.',
      deadlines: 'Deadlines', dTitle: 'What', dTitlePh: 'e.g. Send Chapter 2 to supervisor', dDate: 'Date', add: 'Add', none: 'No deadlines yet.', days: '{n} days left', today0: 'Today', tomorrow: 'Tomorrow', past: '{n} days ago',
      cal: 'Calendar', calAll: 'All to calendar', remove: 'Remove', confirmRemove: 'Remove this deadline?',
      reminder: 'Daily writing reminder', remTime: 'Time', remBtn: 'Add to phone calendar', remHelp: 'Download the calendar file, open it and choose Add/Save. Your phone will notify you every day at this time. Deadline reminders: one day and one week before, at 9 a.m.',
      remSummary: 'Thesis writing time ({n} words)', remDesc: 'Open Talkademic: https://talkademic.vercel.app', dlDesc: 'Deadline from Talkademic', downloaded: 'Calendar file downloaded. Open it to add it to your calendar.',
      homeSet: 'Set a daily target and deadlines', homeOpen: 'Goals', needTitle: 'Write what is due and pick a date.', mon: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const fmt = n => Number(n || 0).toLocaleString(lang() === 'en' ? 'en-GB' : 'ms-MY');
  /* replaceChildren turns null into the text "null", so drop empty parts first. */
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'checked', 'min', 'max', 'step'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }

  /* ---------- dates (local time) ---------- */
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseDay = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);

  /* ---------- data ---------- */
  function data() {
    const s = App.state();
    if (!s.goals || typeof s.goals !== 'object') s.goals = {};
    const g = s.goals;
    if (!(g.target > 0)) g.target = 500;
    if (typeof g.papers !== 'boolean') g.papers = true;
    if (!g.log || typeof g.log !== 'object') g.log = {};
    if (!Array.isArray(g.deadlines)) g.deadlines = [];
    if (!/^\d{2}:\d{2}$/.test(g.time || '')) g.time = '21:00';
    if (!(g.thesisTarget > 0)) g.thesisTarget = 80000;
    return g;
  }
  const count = s => (String(s || '').match(/\S+/g) || []).length;
  function totalWords(g) {
    const s = App.state();
    let n = 0;
    for (const ch of s.chapters || []) for (const sec of ch.sections || []) n += count(sec.content);
    if (g.papers) for (const p of s.papers || []) for (const sec of p.sections || []) n += count(sec.content);
    return n;
  }
  /* Today's words = growth of the workspace since the last count before today. Returns true when the log changed. */
  function tick() {
    const g = data();
    const total = totalWords(g);
    const today = dayKey();
    let e = g.log[today];
    let changed = false;
    if (!e) {
      const base = Number.isFinite(g.lastTotal) ? g.lastTotal : total;
      e = g.log[today] = { start: base, words: 0 };
      changed = true;
      const keys = Object.keys(g.log).sort();
      while (keys.length > 120) delete g.log[keys.shift()];
    }
    // Deleting text lowers the starting point so later typing still counts.
    if (total < e.start) { e.start = total; changed = true; }
    const words = Math.max(0, total - e.start);
    if (words !== e.words) { e.words = words; changed = true; }
    if (g.lastTotal !== total) { g.lastTotal = total; changed = true; }
    const met = words >= g.target;
    if (met !== !!e.met) { e.met = met; changed = true; }
    if (changed) App.save();
    return changed;
  }
  function streaks(g) {
    const today = dayKey();
    let cur = 0, k = g.log[today] && g.log[today].met ? today : addDays(today, -1);
    while (g.log[k] && g.log[k].met) { cur++; k = addDays(k, -1); }
    let best = 0, run = 0, prev = '';
    for (const key of Object.keys(g.log).sort()) {
      if (g.log[key].met) { run = prev && daysBetween(prev, key) === 1 && g.log[prev].met ? run + 1 : 1; best = Math.max(best, run); }
      prev = key;
    }
    return { cur, best: Math.max(best, cur) };
  }
  const nextDeadline = g => g.deadlines.filter(d => daysBetween(dayKey(), d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  function when(date) {
    const n = daysBetween(dayKey(), date);
    return n === 0 ? t('today0') : n === 1 ? t('tomorrow') : n > 0 ? t('days', { n: fmt(n) }) : t('past', { n: fmt(-n) });
  }

  /* ---------- calendar files ---------- */
  const icsText = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function fold(line) {
    const out = [];
    let cur = '', bytes = 0;
    for (const ch of line) {
      const b = new TextEncoder().encode(ch).length;
      if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
      cur += ch; bytes += b;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  function calendar(events) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Talkademic//Goals//' + (lang() === 'en' ? 'EN' : 'MS'), 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const ev of events) lines.push(...ev);
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function deadlineEvent(d) {
    const day = d.date.replace(/-/g, '');
    const alarm = (trigger, text) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(text), 'TRIGGER:' + trigger, 'END:VALARM'];
    return ['BEGIN:VEVENT', 'UID:' + d.id + '@talkademic.vercel.app', 'DTSTAMP:' + stamp(), 'DTSTART;VALUE=DATE:' + day, 'DTEND;VALUE=DATE:' + addDays(d.date, 1).replace(/-/g, ''),
      'SUMMARY:' + icsText(d.title), 'DESCRIPTION:' + icsText(t('dlDesc')), 'TRANSP:TRANSPARENT',
      ...alarm('-PT15H', d.title + ' — ' + t('tomorrow')), ...alarm('-P6DT15H', d.title + ' — ' + t('days', { n: 7 })), 'END:VEVENT'];
  }
  function reminderEvent(g) {
    const now = new Date(), [hh, mm] = g.time.split(':').map(Number);
    const first = now.getHours() * 60 + now.getMinutes() < hh * 60 + mm ? dayKey() : addDays(dayKey(), 1);
    const start = first.replace(/-/g, '') + 'T' + g.time.replace(':', '') + '00';
    return ['BEGIN:VEVENT', 'UID:talkademic-daily-writing@talkademic.vercel.app', 'DTSTAMP:' + stamp(), 'DTSTART:' + start, 'DURATION:PT30M', 'RRULE:FREQ=DAILY',
      'SUMMARY:' + icsText(t('remSummary', { n: g.target })), 'DESCRIPTION:' + icsText(t('remDesc')), 'URL:https://talkademic.vercel.app/',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(t('remSummary', { n: g.target })), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'];
  }
  function download(name, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    App.toast(t('downloaded'));
  }
  const safe = s => String(s || 'tarikh-akhir').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'tarikh-akhir';

  /* ---------- views ---------- */
  function ring(words, target, size) {
    const pct = Math.min(1, target ? words / target : 0), r = size / 2 - 7, c = 2 * Math.PI * r;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`); svg.setAttribute('class', 'goal-ring'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="gr-track"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="gr-fill${pct >= 1 ? ' done' : ''}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`;
    return svg;
  }
  function chevron() { const sp = h('span', { class: 'gh-chev', 'aria-hidden': 'true' }); sp.innerHTML = '<svg class="ic"><use href="#ic-arrow"/></svg>'; return sp; }
  function home() {
    const box = $('#homeGoal');
    if (!box) return;
    tick();
    const g = data(), e = g.log[dayKey()] || { words: 0 }, st = streaks(g), next = nextDeadline(g);
    const fresh = !g.touched && !g.deadlines.length;
    fill(box, 
      h('button', { type: 'button', class: 'btn-reset goal-home', onclick: () => shell().go && shell().go('goals'), 'aria-label': t('title') },
        h('span', { class: 'gh-ring' }, ring(e.words, g.target, 64), h('span', { class: 'gh-pct', text: Math.min(100, Math.round(e.words / g.target * 100)) + '%' })),
        h('span', { class: 'gh-text' },
          h('strong', { text: t('today') + ': ' + fmt(e.words) + ' ' }), h('small', { text: t('of', { n: fmt(g.target) }) }),
          h('span', { class: 'gh-meta' }, st.cur ? '🔥 ' + t('streak', { n: st.cur }) : t('streak0')),
          next ? h('span', { class: 'gh-meta gh-due' + (daysBetween(dayKey(), next.date) <= 7 ? ' soon' : '') }, '⏳ ', next.title, ': ', when(next.date)) : null,
          fresh ? h('span', { class: 'gh-cta', text: t('homeSet') }) : null),
        chevron()));
  }

  function render() {
    const root = $('#view-goals');
    if (!root) return;
    tick();
    const g = data(), today = dayKey(), e = g.log[today] || { words: 0 }, st = streaks(g);
    const left = Math.max(0, g.target - e.words);
    const names = t('mon').split(',');
    const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const max = Math.max(g.target, ...week.map(k => (g.log[k] || {}).words || 0)) || 1;
    const titleIn = h('input', { type: 'text', maxLength: 120, placeholder: t('dTitlePh'), 'aria-label': t('dTitle') });
    const dateIn = h('input', { type: 'date', min: today, 'aria-label': t('dDate') });
    const sorted = g.deadlines.slice().sort((a, b) => a.date.localeCompare(b.date));
    fill(root, 
      h('div', { class: 'view-head' }, h('div', {}, h('h1', { id: 'goalsTitle' }, t('title'), ' ', h('small', { text: t('alt') })), h('p', { text: t('sub') }))),
      h('div', { class: 'card goal-today' },
        h('div', { class: 'gt-main' },
          h('div', { class: 'gt-ring' }, ring(e.words, g.target, 132), h('div', { class: 'gt-num' }, h('strong', { text: fmt(e.words) }), h('small', { text: t('of', { n: fmt(g.target) }) }))),
          h('div', { class: 'gt-side' },
            h('p', { class: 'gt-streak' }, st.cur ? '🔥 ' + t('streak', { n: st.cur }) : t('streak0')),
            h('p', { class: 'muted small-note', text: t('best', { n: st.best }) }),
            h('p', { class: 'gt-left', text: left ? t('left', { n: fmt(left) }) : t('met') }))),
        h('div', { class: 'gt-week', role: 'img', 'aria-label': t('week') + ': ' + week.map(k => ((g.log[k] || {}).words || 0)).join(', ') },
          week.map(k => { const w = (g.log[k] || {}).words || 0; return h('div', { class: 'gw-day' + (w >= g.target ? ' met' : '') + (k === today ? ' now' : '') },
            h('span', { class: 'gw-val', text: w ? fmt(w) : '' }),
            h('span', { class: 'gw-bar' }, h('span', { style: 'height:' + Math.round(w / max * 100) + '%' })),
            h('span', { class: 'gw-lbl', text: names[(parseDay(k).getDay() + 6) % 7] })); }),
          h('span', { class: 'gw-target', style: 'bottom:calc(22px + ' + Math.round(g.target / max * 72) + 'px)' })),
        h('div', { class: 'ana-row' },
          h('label', { class: 'form-field' }, h('span', { text: t('target') }), h('input', { type: 'number', min: 50, max: 20000, step: 50, value: g.target, onchange: ev => { const v = Math.round(Number(ev.target.value)); if (v >= 50 && v <= 20000) { g.target = v; g.touched = true; Object.values(g.log).forEach(x => { x.met = x.words >= v; }); App.save(); render(); } } })),
          h('label', { class: 'form-field' }, h('span', { text: t('thesisTarget') }), h('input', { type: 'number', min: 1000, max: 500000, step: 1000, value: g.thesisTarget, onchange: ev => { const v = Math.round(Number(ev.target.value)); if (v >= 1000 && v <= 500000) { g.thesisTarget = v; App.save(); } } }))),
        h('div', { class: 'ana-row' },
          h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: g.papers, onchange: ev => { const before = totalWords(g); g.papers = ev.target.checked; g.touched = true; const after = totalWords(g); if (g.log[today]) g.log[today].start += after - before; g.lastTotal = after; tick(); App.save(); render(); } }), h('span', { text: t('papersToo') }))),
        h('p', { class: 'muted small-note', text: t('countNote') })),
      h('div', { class: 'card' },
        h('div', { class: 'mx-head' }, h('h3', { text: t('deadlines') }), sorted.length > 1 ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => download('Talkademic-tarikh-akhir.ics', calendar(sorted.map(deadlineEvent))), text: '📅 ' + t('calAll') }) : null),
        sorted.length ? h('ul', { class: 'dl-list' }, sorted.map(d => { const n = daysBetween(today, d.date); return h('li', { class: n < 0 ? 'past' : n <= 7 ? 'soon' : '' },
          h('span', { class: 'dl-count' }, h('strong', { text: n < 0 ? '✓' : String(n) }), n >= 0 ? h('small', { text: n === 1 ? (lang() === 'en' ? 'day' : 'hari') : (lang() === 'en' ? 'days' : 'hari') }) : null),
          h('span', { class: 'dl-text' }, h('strong', { text: d.title }), h('small', { text: parseDay(d.date).toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ms-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + when(d.date) })),
          h('button', { type: 'button', class: 'btn btn-outline btn-mini', onclick: () => download('Talkademic-' + safe(d.title) + '.ics', calendar([deadlineEvent(d)])) }, '📅 ', t('cal')),
          h('button', { type: 'button', class: 'btn-reset ref-x', 'aria-label': t('remove') + ': ' + d.title, title: t('remove'), onclick: () => { if (!confirm(t('confirmRemove'))) return; g.deadlines = g.deadlines.filter(x => x !== d); App.save(); render(); } }, '×')); }))
          : h('p', { class: 'muted small-note', text: t('none') }),
        h('form', { class: 'dl-form', onsubmit: ev => {
          ev.preventDefault();
          const title = titleIn.value.trim(), date = dateIn.value;
          if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { App.toast(t('needTitle')); return; }
          g.deadlines.push({ id: App.uid(), title: title.slice(0, 120), date }); g.touched = true; App.save(); render();
        } }, titleIn, dateIn, h('button', { type: 'submit', class: 'btn btn-primary', text: t('add') }))),
      h('div', { class: 'card' },
        h('h3', { text: t('reminder') }),
        h('div', { class: 'tool-row' },
          h('label', { class: 'form-field rem-time' }, h('span', { text: t('remTime') }), h('input', { type: 'time', value: g.time, onchange: ev => { if (/^\d{2}:\d{2}$/.test(ev.target.value)) { g.time = ev.target.value; App.save(); } } })),
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { g.touched = true; App.save(); download('Talkademic-peringatan-menulis.ics', calendar([reminderEvent(g)])); } }, '🔔 ', t('remBtn'))),
        h('p', { class: 'muted small-note', text: t('remHelp') })));
  }

  /* Numbers for the home dashboard. */
  function summary() {
    tick();
    const g = data(), today = dayKey(), st = streaks(g), next = nextDeadline(g);
    return {
      today: (g.log[today] || {}).words || 0, target: g.target, streak: st.cur, best: st.best, thesisTarget: g.thesisTarget,
      week: Array.from({ length: 7 }, (_, i) => { const k = addDays(today, i - 6), e = g.log[k] || {}; return { key: k, words: e.words || 0, met: !!e.met, day: (parseDay(k).getDay() + 6) % 7, now: k === today }; }),
      next: next ? { title: next.title, days: daysBetween(today, next.date), when: when(next.date) } : null
    };
  }
  window.TalkademicGoals = { render, home, tick, summary, streaks, calendar, deadlineEvent, reminderEvent, dayKey };
})();
