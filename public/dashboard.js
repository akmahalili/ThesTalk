/* Talkademic home dashboard ("Pusat Kawalan"): a chapter dial (one arc per chapter, filled
   against the thesis word target), today's ring, live status (AI, sync, backup), key numbers,
   the last seven days and the nearest deadline. Pure SVG + DOM, rebuilt after each save. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      label: 'Pusat kawalan penulisan', cont: 'Sambung menulis', complete: 'siap', of: 'daripada {n}', words: 'perkataan',
      today: 'Hari ini', streak: 'Streak', days: 'hari', refs: 'Rujukan', papers: 'Paper', week: '7 hari', target: 'sasaran {n}/hari',
      aiOn: '{p} dalam talian', aiOff: 'AI belum aktif', syncOn: 'Sync {d}', syncOff: 'Sync tiada', bkOk: 'Backup {d}', bkNever: 'Belum backup',
      due: 'T−{n}', dueToday: 'Hari ini', goals: 'Sasaran', ch: 'B{n}', chapters: 'Bab', dayNames: 'I,S,R,K,J,S,A', ago: '{n} hari lalu', justNow: 'hari ini'
    },
    en: {
      label: 'Writing control centre', cont: 'Continue writing', complete: 'done', of: 'of {n}', words: 'words',
      today: 'Today', streak: 'Streak', days: 'days', refs: 'References', papers: 'Papers', week: '7 days', target: 'target {n}/day',
      aiOn: '{p} online', aiOff: 'AI not connected', syncOn: 'Synced {d}', syncOff: 'Sync off', bkOk: 'Backup {d}', bkNever: 'No backup yet',
      due: 'T−{n}', dueToday: 'Today', goals: 'Goals', ch: 'C{n}', chapters: 'Chapters', dayNames: 'M,T,W,T,F,S,S', ago: '{n} days ago', justNow: 'today'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const fmt = n => Number(n || 0).toLocaleString(lang() === 'en' ? 'en-GB' : 'ms-MY');
  const NS = 'http://www.w3.org/2000/svg';
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  function s(tag, attrs) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v)); return el; }
  const count = x => (String(x || '').match(/\S+/g) || []).length;

  /* Share of the thesis each chapter usually takes (five-chapter thesis); otherwise equal shares. */
  const WEIGHTS5 = [0.12, 0.28, 0.18, 0.22, 0.20];
  const COLORS = ['#a47bff', '#8a5cff', '#6f63ff', '#5b7cfa', '#4a8df5', '#7c8bff', '#b08cff', '#9a6bff'];
  const PAPER_COLORS = ['#22c7d6', '#2fb7a0', '#38bdf8', '#14b8a6'];
  const PAPER_TARGET = 8000;

  const pt = (cx, cy, r, a) => [cx + r * Math.cos((a - 90) * Math.PI / 180), cy + r * Math.sin((a - 90) * Math.PI / 180)];
  function arc(cx, cy, r, a0, a1) {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  let animated = false;
  function dial(chs, total, target, today, daily) {
    const C = 120, svg = s('svg', { viewBox: '0 0 240 240', class: 'dash-dial' + (animated ? '' : ' anim'), role: 'img', 'aria-label': fmt(total) + ' / ' + fmt(target) + ' ' + t('words') });
    // Bezel: 60 ticks, every fifth one longer.
    const ticks = s('g', { class: 'dd-ticks' });
    for (let i = 0; i < 60; i++) { const a = i * 6, [x0, y0] = pt(C, C, i % 5 ? 113 : 110, a), [x1, y1] = pt(C, C, 116, a); ticks.append(s('line', { x1: x0.toFixed(2), y1: y0.toFixed(2), x2: x1.toFixed(2), y2: y1.toFixed(2) })); }
    svg.append(ticks);
    // Today's ring.
    const dp = Math.min(1, daily ? today / daily : 0);
    svg.append(s('circle', { cx: C, cy: C, r: 102, class: 'dd-today-track' }));
    if (dp > 0) svg.append(s('path', { d: dp >= 1 ? arc(C, C, 102, 0, 359.99) : arc(C, C, 102, 0, 360 * dp), class: 'dd-today' + (dp >= 1 ? ' met' : ''), pathLength: 100 }));
    // One arc per chapter.
    const gap = chs.length > 1 ? 4 : 0, span = 360 / chs.length;
    chs.forEach((c, i) => {
      const a0 = i * span + gap / 2, a1 = (i + 1) * span - gap / 2;
      svg.append(s('path', { d: arc(C, C, 84, a0, a1), class: 'dd-seg-track' }));
      const p = Math.min(1, c.target ? c.words / c.target : 0);
      if (p > 0.002) svg.append(s('path', { d: arc(C, C, 84, a0, a0 + (a1 - a0) * p), class: 'dd-seg', stroke: 'currentColor', pathLength: 100, style: 'color:' + c.color + ';animation-delay:' + (i * 90) + 'ms' }));
      const [lx, ly] = pt(C, C, 64, (a0 + a1) / 2);
      const tag = s('text', { x: lx.toFixed(1), y: (ly + 3.2).toFixed(1), class: 'dd-seg-label' }); tag.textContent = c.paper ? 'P' + c.paper : t('ch', { n: i + 1 }); svg.append(tag);
    });
    // Centre read-out.
    const pct = target ? Math.min(999, Math.round(total / target * 100)) : 0;
    const big = s('text', { x: C, y: C - 2, class: 'dd-big' }); big.textContent = fmt(total);
    const sub = s('text', { x: C, y: C + 18, class: 'dd-sub' }); sub.textContent = t('of', { n: fmt(target) });
    const pc = s('text', { x: C, y: C + 40, class: 'dd-pct' }); pc.textContent = pct + '% ' + t('complete');
    svg.append(big, sub, pc);
    return svg;
  }

  function spark(week, daily) {
    const max = Math.max(daily, ...week.map(d => d.words)) || 1, W = 168, H = 46, bw = 16, gapx = (W - bw * 7) / 6;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H + 14}`, class: 'dash-spark', role: 'img', 'aria-label': t('week') + ': ' + week.map(d => d.words).join(', ') });
    const names = t('dayNames').split(',');
    week.forEach((d, i) => {
      const x = i * (bw + gapx), hh = Math.max(2, Math.round(d.words / max * H));
      svg.append(s('rect', { x, y: 0, width: bw, height: H, rx: 4, class: 'ds-track' }));
      svg.append(s('rect', { x, y: H - hh, width: bw, height: hh, rx: 4, class: 'ds-bar' + (d.met ? ' met' : '') + (d.now ? ' now' : '') }));
      const l = s('text', { x: x + bw / 2, y: H + 12, class: 'ds-lbl' + (d.now ? ' now' : '') }); l.textContent = names[d.day]; svg.append(l);
    });
    const ty = (H - Math.round(daily / max * H)).toFixed(1);
    svg.append(s('line', { x1: 0, x2: W, y1: ty, y2: ty, class: 'ds-target' }));
    return svg;
  }

  function ago(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days < 1) return d.toLocaleTimeString(lang() === 'en' ? 'en-GB' : 'ms-MY', { hour: 'numeric', minute: '2-digit' });
    return t('ago', { n: days });
  }
  function chip(state, text, onclick) {
    return h(onclick ? 'button' : 'span', { type: onclick ? 'button' : null, class: 'dash-chip ' + state + (onclick ? ' btn-reset' : ''), onclick }, h('i', { 'aria-hidden': 'true' }), text);
  }

  function render() {
    const box = $('#homeDash');
    if (!box) return;
    const st = App.state();
    const G = window.TalkademicGoals ? window.TalkademicGoals.summary() : { today: 0, target: 500, streak: 0, thesisTarget: 80000, week: [], next: null };
    const chs = (st.chapters || []).map((c, i, all) => {
      const words = (c.sections || []).reduce((n, x) => n + count(x.content), 0);
      const share = all.length === 5 ? WEIGHTS5[i] : 1 / all.length;
      return { title: c.title, words, target: Math.round(G.thesisTarget * share), color: COLORS[i % COLORS.length] };
    });
    // Journal papers count too: each is one more arc (typical article length as its target).
    (st.papers || []).slice(0, 4).forEach((pp, j) => {
      const words = (pp.sections || []).reduce((n, x) => n + count(x.content), 0);
      chs.push({ title: (pp.title || '').trim() || 'Paper', words, target: PAPER_TARGET, color: PAPER_COLORS[j % PAPER_COLORS.length], paper: j + 1 });
    });
    const total = chs.reduce((n, c) => n + c.words, 0);
    const goal = chs.reduce((n, c) => n + c.target, 0);
    const ui = shell().ui ? shell().ui() : {};
    let sync = {};
    try { sync = JSON.parse(localStorage.getItem('thestalk_sync_v1') || '{}') || {}; } catch (e) { sync = {}; }
    const ai = App.aiAvailable && App.aiAvailable();
    const prov = (shell().aiChoice && shell().aiChoice()) || (App.defaultProvider && App.defaultProvider()) || 'gemini';
    const provName = { gemini: 'Gemini', claude: 'Claude', openai: 'ChatGPT' }[prov] || 'AI';
    const papers = (st.papers || []).length, refs = (st.references || []).length;
    const short = (st.project && st.project.title) || '—';

    const kpi = (label, value, extra, onclick) => h('button', { type: 'button', class: 'btn-reset dash-kpi', onclick }, h('span', { class: 'dk-label', text: label }), h('span', { class: 'dk-value' }, value), extra || null);
    const todayPct = Math.min(100, G.target ? Math.round(G.today / G.target * 100) : 0);
    fill(box,
      h('div', { class: 'dash-head' },
        h('div', { class: 'dash-title' }, h('span', { class: 'dash-kicker' }, h('i', { class: 'dash-pulse', 'aria-hidden': 'true' }), t('label')), h('strong', { text: short }))),
      h('div', { class: 'dash-status' },
        chip(ai ? 'on' : 'off', ai ? t('aiOn', { p: provName }) : t('aiOff'), ai ? null : () => shell().go && shell().go('settings')),
        chip(sync.code ? (sync.conflict ? 'warn' : 'on') : 'idle', sync.code && sync.lastSync ? t('syncOn', { d: ago(sync.lastSync) }) : t('syncOff'), () => shell().go && shell().go('settings')),
        chip(ui.lastBackup ? 'idle' : 'warn', ui.lastBackup ? t('bkOk', { d: ago(ui.lastBackup) }) : t('bkNever'), () => shell().go && shell().go('settings'))),
      h('div', { class: 'dash-body' },
        h('div', { class: 'dash-dial-wrap' }, dial(chs, total, goal, G.today, G.target),
          h('ol', { class: 'dash-legend' }, chs.map((c, i) => h('li', {}, h('i', { style: 'background:' + c.color, 'aria-hidden': 'true' }), h('span', { class: 'dl-n', text: c.paper ? 'P' + c.paper : t('ch', { n: i + 1 }) }), h('span', { class: 'dl-name', text: String(c.title).replace(/^(Chapter|Bab)\s*\d+\s*[:.]\s*/i, '') }), h('span', { class: 'dl-w', text: fmt(c.words) }))))),
        h('div', { class: 'dash-side' },
          h('div', { class: 'dash-kpis' },
            kpi(t('today'), [h('b', { text: fmt(G.today) }), h('small', { text: ' / ' + fmt(G.target) })], h('span', { class: 'dk-bar' }, h('span', { style: 'width:' + todayPct + '%' })), () => shell().go('goals')),
            kpi(t('streak'), [h('b', { text: String(G.streak) }), h('small', { text: ' ' + t('days') })], G.streak ? h('span', { class: 'dk-flame', 'aria-hidden': 'true', text: '🔥' }) : null, () => shell().go('goals')),
            kpi(t('refs'), h('b', { text: fmt(refs) }), null, () => shell().go('library')),
            kpi(t('papers'), h('b', { text: fmt(papers) }), null, () => shell().go('papers'))),
          h('button', { type: 'button', class: 'btn-reset dash-week', onclick: () => shell().go('goals') },
            h('span', { class: 'dk-label' }, t('week'), h('small', { text: ' · ' + t('target', { n: fmt(G.target) }) })), spark(G.week, G.target)),
          G.next ? h('button', { type: 'button', class: 'btn-reset dash-due' + (G.next.days <= 7 ? ' soon' : ''), onclick: () => shell().go('goals') },
            h('span', { class: 'dd-t', text: G.next.days === 0 ? t('dueToday') : t('due', { n: G.next.days }) }), h('span', { class: 'dd-what', text: G.next.title })) : null,
          h('button', { type: 'button', class: 'btn btn-primary dash-cta', 'data-go': 'academic', 'data-focus': 'thesis' }, t('cont'), ' ', svgIcon('ic-arrow')))));
    animated = true;
  }
  function svgIcon(id) { const sv = s('svg', { class: 'ic', 'aria-hidden': 'true' }); const u = s('use', { href: '#' + id }); sv.append(u); return sv; }
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));

  window.TalkademicDashboard = { render, arc };
})();
