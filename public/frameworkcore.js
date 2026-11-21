/* Talkademic "Kerangka Konseptual" core: clean a framework, number its hypotheses and draw it as SVG.
   A framework has constructs (IV, mediator, moderator, DV, control) with optional dimensions,
   direct paths (H1…Hk, positive or negative), and moderations of a path. The same SVG is shown
   in the app, saved as PNG, and placed in the Word file. Works in the browser and in Node (tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicFrameworkCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ROLES = ['iv', 'med', 'mod', 'dv', 'ctrl'];
  const str = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  let seq = 0;
  const newId = p => p + Date.now().toString(36).slice(-5) + (seq++).toString(36);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function empty() { return { theory: '', mediation: true, constructs: [], paths: [], mods: [] }; }

  /* A clean copy: known roles, unique ids, paths and moderations that point at real things. */
  function normalize(fw) {
    const f = fw && typeof fw === 'object' ? fw : {};
    const out = { theory: str(f.theory, 160), mediation: f.mediation !== false, constructs: [], paths: [], mods: [] };
    const ids = new Set();
    for (const c of Array.isArray(f.constructs) ? f.constructs : []) {
      if (!c || typeof c !== 'object') continue;
      let id = str(c.id, 40) || newId('c');
      while (ids.has(id)) id = newId('c');
      ids.add(id);
      const items = Array.isArray(c.items) ? c.items : String(c.items || '').split('\n');
      out.constructs.push({ id, name: str(c.name, 80), role: ROLES.includes(c.role) ? c.role : 'iv', items: items.map(x => str(x, 80)).filter(Boolean).slice(0, 8) });
    }
    const named = new Set(out.constructs.filter(c => c.name).map(c => c.id));
    const pids = new Set(), pairs = new Set();
    for (const p of Array.isArray(f.paths) ? f.paths : []) {
      if (!p || !named.has(p.from) || !named.has(p.to) || p.from === p.to || pairs.has(p.from + '>' + p.to)) continue;
      let id = str(p.id, 40) || newId('p');
      while (pids.has(id)) id = newId('p');
      pids.add(id); pairs.add(p.from + '>' + p.to);
      out.paths.push({ id, from: p.from, to: p.to, sign: p.sign === '-' ? '-' : '+' });
    }
    const seen = new Set();
    for (const m of Array.isArray(f.mods) ? f.mods : []) {
      if (!m || !named.has(m.by) || !pids.has(m.path) || seen.has(m.by + '@' + m.path)) continue;
      const p = out.paths.find(x => x.id === m.path);
      if (p.from === m.by || p.to === m.by) continue;
      seen.add(m.by + '@' + m.path);
      out.mods.push({ id: str(m.id, 40) || newId('m'), by: m.by, path: m.path });
    }
    return out;
  }

  /* H1…Hn: direct paths first, then mediation (X → M → Y, when switched on), then moderation. */
  function hypotheses(fw, lang) {
    const f = normalize(fw), ms = lang !== 'en';
    const name = id => (f.constructs.find(c => c.id === id) || {}).name || '?';
    const out = [];
    const add = (o) => { o.tag = 'H' + (out.length + 1); out.push(o); };
    for (const p of f.paths) {
      const neg = p.sign === '-';
      add({ kind: 'direct', path: p.id, text: ms
        ? `${name(p.from)} mempunyai pengaruh ${neg ? 'negatif' : 'positif'} yang signifikan terhadap ${name(p.to)}.`
        : `${name(p.from)} has a significant ${neg ? 'negative' : 'positive'} effect on ${name(p.to)}.` });
    }
    if (f.mediation) {
      for (const m of f.constructs.filter(c => c.role === 'med' && c.name)) {
        for (const a of f.paths.filter(p => p.to === m.id)) {
          for (const b of f.paths.filter(p => p.from === m.id && p.to !== a.from)) {
            add({ kind: 'mediation', via: m.id, text: ms
              ? `${m.name} menjadi pengantara hubungan antara ${name(a.from)} dan ${name(b.to)}.`
              : `${m.name} mediates the relationship between ${name(a.from)} and ${name(b.to)}.` });
          }
        }
      }
    }
    for (const m of f.mods) {
      const p = f.paths.find(x => x.id === m.path);
      add({ kind: 'moderation', mod: m.id, text: ms
        ? `${name(m.by)} menyederhanakan hubungan antara ${name(p.from)} dan ${name(p.to)}.`
        : `${name(m.by)} moderates the relationship between ${name(p.from)} and ${name(p.to)}.` });
    }
    return out;
  }

  /* Rough text width (no canvas in Node): average glyph ≈ 0.55 em for the fonts used. */
  function wrap(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
      while (cur.length > maxChars + 4) { lines.push(cur.slice(0, maxChars)); cur = cur.slice(maxChars); }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  const STYLES = {
    thesis: { bg: '#ffffff', text: '#000000', line: '#000000', label: '#000000', font: "'Times New Roman', Times, serif", fills: {}, strokes: {}, radius: 0, sw: 1.6 },
    colour: { bg: '#ffffff', text: '#1d1b2f', line: '#3d3a56', label: '#4c3fd1', font: "'Trebuchet MS', 'Segoe UI', Roboto, Arial, sans-serif",
      fills: { iv: '#eaefff', med: '#fff2dc', mod: '#e3f6ee', dv: '#fde8f0', ctrl: '#f3f2f7' },
      strokes: { iv: '#4c5fd5', med: '#d08400', mod: '#17905f', dv: '#c2185b', ctrl: '#8a879c' }, radius: 12, sw: 2 }
  };

  /* Place every box: IV | mediator | DV columns, moderators on top, controls below, theory last. */
  function layout(fw) {
    const f = normalize(fw);
    const W = 1000, gapY = 46;
    const cs = f.constructs.filter(c => c.name);
    const col = { iv: [], med: [], dv: [] }, top = [], bottom = [];
    for (const c of cs) (c.role === 'mod' ? top : c.role === 'ctrl' ? bottom : col[c.role]).push(c);
    const active = ['iv', 'med', 'dv'].filter(k => col[k].length);
    const boxW = active.length >= 3 ? 230 : active.length === 2 ? 270 : 320;
    const centres = active.length >= 3 ? [140, 500, 860] : active.length === 2 ? [185, 815] : [500];
    const size = (c, w) => {
      const name = wrap(c.name, Math.floor((w - 26) / (17 * 0.55)));
      const items = c.items.flatMap(it => wrap('• ' + it, Math.floor((w - 26) / (14 * 0.52))));
      return { name, items, w, h: 22 + name.length * 21 + (items.length ? 10 + items.length * 18 : 0) };
    };
    const boxes = new Map();
    const modW = 210;
    const modH = Math.max(0, ...top.map(c => size(c, modW).h));
    const topH = top.length ? Math.max(150, modH + 74) : 24;
    const heights = active.map(k => col[k].reduce((s, c) => s + size(c, boxW).h, 0) + gapY * (col[k].length - 1));
    const mainH = Math.max(0, ...heights);
    active.forEach((k, i) => {
      let y = topH + (mainH - heights[i]) / 2;
      for (const c of col[k]) { const s = size(c, boxW); boxes.set(c.id, { c, ...s, x: centres[i] - boxW / 2, y }); y += s.h + gapY; }
    });
    // Moderators sit above the middle of the path they moderate.
    const want = top.map((c, i) => {
      const m = f.mods.find(x => x.by === c.id);
      const p = m && f.paths.find(x => x.id === m.path);
      const a = p && boxes.get(p.from), b = p && boxes.get(p.to);
      const x = a && b ? (a.x + a.w / 2 + b.x + b.w / 2) / 2 : (W / (top.length + 1)) * (i + 1);
      return { c, x };
    }).sort((a, b) => a.x - b.x);
    let last = -Infinity;
    for (const t of want) { t.x = Math.max(t.x, last + modW + 24, modW / 2 + 10); last = t.x; }
    const over = last + modW / 2 + 10 - W;
    if (over > 0) for (const t of want) t.x -= over;
    for (const t of want) { const s = size(t.c, modW); boxes.set(t.c.id, { c: t.c, ...s, x: t.x - modW / 2, y: topH - 74 - s.h }); }
    // Controls in a row below.
    let y = topH + mainH + (bottom.length ? 70 : 0);
    const ctrlW = 200;
    bottom.forEach((c, i) => { const s = size(c, ctrlW); const cx = (W / (bottom.length + 1)) * (i + 1); boxes.set(c.id, { c, ...s, x: cx - ctrlW / 2, y }); });
    if (bottom.length) y += Math.max(...bottom.map(c => boxes.get(c.id).h));
    return { f, boxes, W, H: y, active };
  }

  function svg(fw, opt) {
    const o = opt || {};
    const st = STYLES[o.style] || STYLES.thesis, ms = o.lang !== 'en';
    const L = layout(fw), f = L.f, B = L.boxes;
    if (B.size < 1) return { svg: '', width: 0, height: 0, empty: true };
    const hyp = hypotheses(f, o.lang);
    const tagOfPath = id => (hyp.find(x => x.path === id) || {}).tag || '';
    const tagOfMod = id => (hyp.find(x => x.mod === id) || {}).tag || '';
    const parts = [];
    const fontAttr = `font-family="${esc(st.font)}"`;
    // Edge anchors: spread several edges along a box side so arrows do not meet in one point.
    const sideOf = new Map();
    const pathGeo = f.paths.map(p => {
      const a = B.get(p.from), b = B.get(p.to);
      const ac = a.x + a.w / 2, bc = b.x + b.w / 2;
      const dir = bc - ac > 20 ? 'r' : ac - bc > 20 ? 'l' : (b.y > a.y ? 'd' : 'u');
      return { p, a, b, dir };
    });
    const slot = (box, side, key, order) => { const k = box.c.id + side; if (!sideOf.has(k)) sideOf.set(k, []); sideOf.get(k).push({ key, order }); };
    const hits = (x1, y1, x2, y2, skip) => {
      for (const bx of B.values()) {
        if (skip.includes(bx)) continue;
        for (let s = 1; s < 40; s++) {
          const x = x1 + (x2 - x1) * s / 40, y = y1 + (y2 - y1) * s / 40;
          if (x > bx.x - 8 && x < bx.x + bx.w + 8 && y > bx.y - 8 && y < bx.y + bx.h + 8) return bx;
        }
      }
      return null;
    };
    const anchor = (box, side, key) => {
      const list = (sideOf.get(box.c.id + side) || []).slice().sort((x, y) => x.order - y.order);
      const i = list.findIndex(x => x.key === key), n = list.length;
      const t = n > 1 ? 0.25 + 0.5 * (i / (n - 1)) : 0.5;
      if (side === 'R') return [box.x + box.w, box.y + box.h * t];
      if (side === 'L') return [box.x, box.y + box.h * t];
      if (side === 'D') return [box.x + box.w * t, box.y + box.h];
      return [box.x + box.w * t, box.y];
    };
    /* Two passes: route once, then give arrows that bend round a box the outer anchor
       (top when bending above, bottom when below) so they do not cross their neighbours. */
    const route = bends => {
      sideOf.clear();
      for (const g of pathGeo) {
        const out = { r: 'R', l: 'L', d: 'D', u: 'U' }[g.dir], inn = { r: 'L', l: 'R', d: 'U', u: 'D' }[g.dir];
        const bend = (bends.get(g.p.id) || 0) * 1e6;
        slot(g.a, out, g.p.id + 'o', g.b.y + g.b.h / 2 + bend);
        slot(g.b, inn, g.p.id + 'i', g.a.y + g.a.h / 2 + bend);
      }
      return pathGeo.map(g => {
        const sides = { r: ['R', 'L'], l: ['L', 'R'], d: ['D', 'U'], u: ['U', 'D'] }[g.dir];
        const [x1, y1] = anchor(g.a, sides[0], g.p.id + 'o'), [x2, y2] = anchor(g.b, sides[1], g.p.id + 'i');
        const block = hits(x1, y1, x2, y2, [g.a, g.b]);
        let cx = null, cy = null, side = 0;
        if (block) {
          side = (bends.get(g.p.id) || ((y1 + y2) / 2 >= block.y + block.h / 2 ? 1 : -1));
          const passY = side > 0 ? block.y + block.h + 26 : block.y - 26;
          cx = (x1 + x2) / 2; cy = 2 * passY - (y1 + y2) / 2;
        }
        const at = t => cx === null ? [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
          : [(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2];
        return { g, x1, y1, x2, y2, cx, cy, at, side };
      });
    };
    const first = route(new Map());
    const edges = route(new Map(first.filter(e => e.side).map(e => [e.g.p.id, e.side])));
    // Defs: one arrowhead per colour in use.
    parts.push(`<defs><marker id="ah" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${st.line}"/></marker></defs>`);
    parts.push(`<rect width="100%" height="100%" fill="${st.bg}"/>`);
    const line = (d, dashed) => `<path d="${d}" fill="none" stroke="${st.line}" stroke-width="${st.sw}"${dashed ? ' stroke-dasharray="7 5"' : ''} marker-end="url(#ah)"/>`;
    for (const e of edges) parts.push(line(e.cx === null ? `M${r(e.x1)},${r(e.y1)} L${r(e.x2)},${r(e.y2)}` : `M${r(e.x1)},${r(e.y1)} Q${r(e.cx)},${r(e.cy)} ${r(e.x2)},${r(e.y2)}`));
    // Moderation arrows: from the moderator down to the middle of the path.
    const modLabels = [];
    for (const m of f.mods) {
      const e = edges.find(x => x.g.p.id === m.path), mb = B.get(m.by);
      if (!e || !mb) continue;
      const [px, py] = e.at(0.5), sx = mb.x + mb.w / 2, sy = mb.y + mb.h;
      parts.push(line(`M${r(sx)},${r(sy)} L${r(px)},${r(py - 3)}`));
      modLabels.push({ x: sx + (px - sx) * 0.45 + 8, y: sy + (py - sy) * 0.45, tag: tagOfMod(m.id) });
    }
    // Controls: dashed arrows to each DV.
    const dvs = [...B.values()].filter(b => b.c.role === 'dv');
    for (const cb of [...B.values()].filter(b => b.c.role === 'ctrl')) for (const d of dvs) parts.push(line(`M${r(cb.x + cb.w / 2)},${r(cb.y)} L${r(d.x + d.w / 2)},${r(d.y + d.h + 2)}`, true));
    // Boxes.
    for (const b of B.values()) {
      const role = b.c.role, fill = st.fills[role] || st.bg, stroke = st.strokes[role] || st.line;
      parts.push(`<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="${st.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${st.sw}"${role === 'ctrl' ? ' stroke-dasharray="7 5"' : ''}/>`);
      let ty = b.y + 11 + 17;
      for (const ln of b.name) { parts.push(`<text x="${r(b.x + b.w / 2)}" y="${r(ty)}" text-anchor="middle" font-size="17" font-weight="bold" fill="${st.text}" ${fontAttr}>${esc(ln)}</text>`); ty += 21; }
      if (b.items.length) {
        parts.push(`<line x1="${r(b.x + 12)}" y1="${r(ty - 9)}" x2="${r(b.x + b.w - 12)}" y2="${r(ty - 9)}" stroke="${stroke}" stroke-width="0.8" opacity="0.6"/>`);
        ty += 8;
        for (const ln of b.items) { parts.push(`<text x="${r(b.x + 13)}" y="${r(ty)}" font-size="14" fill="${st.text}" ${fontAttr}>${esc(ln)}</text>`); ty += 18; }
      }
    }
    // Hypothesis labels on top of the lines.
    const label = (x, y, text) => {
      if (!text) return;
      const w = text.length * 9 + 12;
      parts.push(`<rect x="${r(x - w / 2)}" y="${r(y - 12)}" width="${r(w)}" height="22" rx="${st.radius ? 11 : 0}" fill="${st.bg}"/>`);
      parts.push(`<text x="${r(x)}" y="${r(y + 4)}" text-anchor="middle" font-size="15" font-weight="bold" fill="${st.label}" ${fontAttr}>${esc(text)}</text>`);
    };
    for (const e of edges) {
      const t = f.mods.some(m => m.path === e.g.p.id) ? 0.28 : 0.42;
      const [x, y] = e.at(e.cx === null ? t : 0.5);
      label(x, y, tagOfPath(e.g.p.id) + (e.g.p.sign === '-' ? ' (−)' : ''));
    }
    for (const m of modLabels) label(m.x + 14, m.y, m.tag);
    // Bends may run past the boxes: grow the picture to fit them.
    let minY = 0, maxY = L.H;
    for (const e of edges) if (e.cx !== null) { const y = e.at(0.5)[1]; minY = Math.min(minY, y - 16); maxY = Math.max(maxY, y + 14); }
    // Underpinning theory.
    let H = maxY + 28;
    if (f.theory) {
      const lines = wrap((ms ? 'Teori asas: ' : 'Underpinning theory: ') + f.theory, 95);
      H += 10;
      parts.push(`<line x1="40" y1="${r(H - 14)}" x2="${L.W - 40}" y2="${r(H - 14)}" stroke="${st.line}" stroke-width="0.8" opacity="0.5"/>`);
      for (const ln of lines) { H += 20; parts.push(`<text x="${L.W / 2}" y="${r(H)}" text-anchor="middle" font-size="15" font-style="italic" fill="${st.text}" ${fontAttr}>${esc(ln)}</text>`); }
      H += 18;
    }
    const top = Math.floor(minY), height = Math.ceil(H - top);
    parts[1] = `<rect x="0" y="${top}" width="${L.W}" height="${height}" fill="${st.bg}"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${L.W} ${height}" width="${L.W}" height="${height}">${parts.join('')}</svg>`, width: L.W, height };
  }
  function r(n) { return Math.round(n * 10) / 10; }

  /* A thesis-ready block of text: figure marker, caption and the hypotheses. */
  const FIGURE_LINE = /^\s*\[(?:Rajah|Figure)\s*:\s*(?:Kerangka Konseptual|Conceptual Framework)\]\s*$/i;
  function thesisText(fw, lang, figNo) {
    const ms = lang !== 'en', f = normalize(fw);
    const hy = hypotheses(f, lang);
    const lines = [ms ? '[Rajah: Kerangka Konseptual]' : '[Figure: Conceptual Framework]',
      (ms ? 'Rajah ' : 'Figure ') + (figNo || '2.1') + ': ' + (ms ? 'Kerangka konseptual kajian' : 'Conceptual framework of the study') + (f.theory ? (ms ? ' berdasarkan ' : ' based on ') + f.theory : '')];
    if (hy.length) {
      lines.push('', ms ? 'Berdasarkan kerangka konseptual di atas, hipotesis kajian ini adalah seperti berikut:' : 'Based on the conceptual framework above, the hypotheses of this study are:');
      for (const x of hy) lines.push(x.tag + ': ' + x.text);
    }
    return lines.join('\n');
  }

  /* Short version for a slide: up to six constructs and their arrows. */
  function forSlide(fw) {
    const f = normalize(fw);
    const hy = hypotheses(f, 'en');
    const keep = f.constructs.filter(c => c.name && c.role !== 'ctrl').slice(0, 6);
    const idx = id => keep.findIndex(c => c.id === id);
    const links = [];
    for (const p of f.paths) if (idx(p.from) >= 0 && idx(p.to) >= 0) links.push({ f: idx(p.from), t: idx(p.to), label: (hy.find(x => x.path === p.id) || {}).tag || '' });
    for (const m of f.mods) { const p = f.paths.find(x => x.id === m.path); if (idx(m.by) >= 0 && idx(p.to) >= 0) links.push({ f: idx(m.by), t: idx(p.to), label: (hy.find(x => x.mod === m.id) || {}).tag || '' }); }
    return keep.length >= 2 ? { nodes: keep.map(c => c.name), links } : null;
  }

  return { ROLES, empty, normalize, hypotheses, layout, svg, thesisText, forSlide, FIGURE_LINE, newId, wrap };
});
