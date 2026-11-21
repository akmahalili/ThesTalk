/* Talkademic slide themes. Each theme is a palette, PowerPoint-safe fonts and its own decorations
   for every layout. build() draws a whole deck with PptxGenJS; the in-app preview uses the same
   theme names (data-theme) with matching CSS in theme-tech.css. */
(function (root) {
  'use strict';
  const W = 10, H = 5.625;

  const THEMES = {
    klasik: {
      name: 'Klasik', en: 'Classic',
      bg: 'FFFFFF', ink: '1B1435', muted: '6B6390', accent: '7C4DFF', accent2: '5B7CFA', soft: 'F1ECFF', soft2: 'E3D9FF', line: 'DDD5F7',
      dark: '24165E', onDark: 'FFFFFF', onDarkSub: 'D9D0FF', head: 'Calibri', body: 'Calibri', bullet: '25A0', cards: ['F6F3FF', 'F1ECFF'], cardInk: '7C4DFF'
    },
    galeri: {
      name: 'Galeri', en: 'Gallery',
      bg: 'F5F2EC', ink: '1E1E1E', muted: '6E6A62', accent: 'E4572E', accent2: '2F5D62', soft: 'EAE4D8', soft2: 'DDD5C6', line: 'CFC6B5',
      dark: '1E1E1E', onDark: 'F5F2EC', onDarkSub: 'C9C2B4', head: 'Georgia', body: 'Gill Sans MT', bullet: '2014', cards: ['F5F2EC', 'F5F2EC'], cardInk: 'E4572E', serif: true
    },
    bilik: {
      name: 'Bilik Gelap', en: 'Darkroom',
      bg: '141110', ink: 'F1E9DA', muted: 'A8998A', accent: 'D7261E', accent2: 'F2A33A', soft: '221C19', soft2: '2E2622', line: '3A312C',
      dark: '0A0807', onDark: 'F1E9DA', onDarkSub: 'C9B9A3', head: 'Georgia', body: 'Trebuchet MS', bullet: '25A0', cards: ['221C19', '1B1615'], cardInk: 'F2A33A', serif: true, italic: true, mono: 'Courier New'
    },
    tropika: {
      name: 'Tropika', en: 'Tropical',
      bg: 'FFF8EC', ink: '183A37', muted: '5E6B68', accent: 'D7263D', accent2: '0E7C7B', accent3: 'F6AE2D', soft: 'FDE9C9', soft2: 'F9D99B', line: 'EAD8B6',
      dark: '0E7C7B', onDark: 'FFF8EC', onDarkSub: 'D5F0EC', head: 'Century Gothic', body: 'Century Gothic', bullet: '25CF', cards: ['0E7C7B', 'F6AE2D', 'D7263D', '183A37'], cardInk: 'FFFFFF', bold: true
    },
    neon: {
      name: 'Neon', en: 'Neon',
      bg: '0B1026', ink: 'E8ECFF', muted: '8B93C7', accent: '22D3EE', accent2: 'E879F9', soft: '141B3D', soft2: '1C2550', line: '2A3570',
      dark: '060915', onDark: 'FFFFFF', onDarkSub: 'A8B1E8', head: 'Century Gothic', body: 'Century Gothic', bullet: '25B8', cards: ['141B3D', '141B3D'], cardInk: '22D3EE', mono: 'Courier New', bold: true
    },
    pastel: {
      name: 'Pastel', en: 'Pastel',
      bg: 'FFFDF9', ink: '2B2540', muted: '6F6886', accent: 'FF7A59', accent2: '7C6CF2', soft: 'FFE7DA', soft2: 'D9F3EA', soft3: 'E8E1FF', line: 'EEE6F5',
      dark: '2B2540', onDark: 'FFFDF9', onDarkSub: 'D8D2EA', head: 'Century Gothic', body: 'Century Gothic', bullet: '25CF', cards: ['FFE7DA', 'D9F3EA', 'E8E1FF', 'FFF1C9'], cardInk: '2B2540', bold: true
    }
  };
  const ORDER = Object.keys(THEMES);

  const sizeFor = (text, steps) => { const L = String(text || '').length; for (const [max, size] of steps) if (L <= max) return size; return steps[steps.length - 1][1]; };
  const clean = a => (Array.isArray(a) ? a : []).filter(x => String(x || '').trim());

  function build(pres, deck, ctx) {
    const T = THEMES[deck.theme] || THEMES.klasik;
    const { pics = {}, refs = [], t = k => k, niceDate = x => x } = ctx || {};
    const SH = pres.ShapeType;
    const noLine = { type: 'none' };
    const rect = (s, x, y, w, h, color, extra) => s.addShape(SH.rect, Object.assign({ x, y, w, h, fill: { color }, line: noLine }, extra || {}));
    const circle = (s, x, y, d, color, transparency) => s.addShape(SH.ellipse, { x, y, w: d, h: d, fill: { color, transparency: transparency || 0 }, line: noLine });
    const text = (s, str, o) => s.addText(str, Object.assign({ fontFace: T.body, color: T.ink, margin: 0, isTextBox: true, valign: 'top' }, o));
    const head = (s, str, o) => text(s, str, Object.assign({ fontFace: T.head, bold: !T.serif || !!T.bold, italic: !!T.italic }, o));
    const total = deck.slides.length;
    const shortTitle = String(deck.title || '').slice(0, 70);

    /* ---------- theme decorations ---------- */
    function sprockets(s, y) {
      rect(s, 0, y, W, 0.42, '0A0807');
      for (let x = 0.15; x < W; x += 0.34) s.addShape(SH.roundRect, { x, y: y + 0.12, w: 0.18, h: 0.18, fill: { color: '2B2522' }, line: noLine, rectRadius: 0.03 });
    }
    function grid(s) {
      for (let x = 0.625; x < W; x += 0.625) s.addShape(SH.line, { x, y: 0, w: 0, h: H, line: { color: '1C2550', width: 0.5 } });
      for (let y = 0.625; y < H; y += 0.625) s.addShape(SH.line, { x: 0, y, w: W, h: 0, line: { color: '1C2550', width: 0.5 } });
    }
    function brackets(s, color) {
      const L = 0.32, wd = 1.5;
      [[0.3, 0.3, 1, 1], [W - 0.3, 0.3, -1, 1], [0.3, H - 0.3, 1, -1], [W - 0.3, H - 0.3, -1, -1]].forEach(([x, y, dx, dy]) => {
        s.addShape(SH.line, { x: Math.min(x, x + dx * L), y, w: L, h: 0, line: { color, width: wd } });
        s.addShape(SH.line, { x, y: Math.min(y, y + dy * L), w: 0, h: L, line: { color, width: wd } });
      });
    }
    function background(s, kind) {
      const darkKind = kind === 'title' || kind === 'end';
      if (deck.theme === 'tropika') {
        if (darkKind) { s.background = { color: T.accent2 }; circle(s, 6.1, 1.1, 5.4, T.accent3); circle(s, 8.7, 0.35, 1.0, T.accent); circle(s, -0.7, 4.4, 1.6, 'FFF8EC', 85); }
        else if (kind === 'section') { s.background = { color: T.accent3 }; circle(s, -1.6, 2.6, 4.4, T.accent2); circle(s, 8.8, 0.5, 0.7, T.accent); }
        else { s.background = { color: T.bg }; rect(s, 0, 0, 0.18, H, T.accent2); }
        return;
      }
      if (deck.theme === 'bilik') {
        s.background = { color: darkKind || kind === 'section' ? T.dark : T.bg };
        if (darkKind || kind === 'section') { sprockets(s, 0); sprockets(s, H - 0.42); }
        if (darkKind) circle(s, 7.4, -1.6, 4.2, T.accent, 78);
        return;
      }
      if (deck.theme === 'neon') {
        s.background = { color: darkKind ? T.dark : T.bg };
        grid(s);
        if (darkKind || kind === 'section') brackets(s, T.accent);
        if (darkKind) { circle(s, 6.8, -2.2, 5.2, T.accent2, 85); circle(s, -1.8, 3.4, 4.0, T.accent, 88); }
        return;
      }
      if (deck.theme === 'pastel') {
        s.background = { color: kind === 'section' ? T.soft2 : T.bg };
        if (darkKind) { circle(s, 6.6, -1.3, 4.6, T.soft3); circle(s, -1.1, 3.3, 3.2, T.soft); circle(s, 8.6, 4.3, 0.9, T.soft2); }
        else if (kind === 'section') { circle(s, 7.2, 2.4, 4.2, T.soft); circle(s, 0.5, 0.4, 0.5, T.accent2, 20); }
        else { circle(s, 8.9, -0.6, 1.6, T.soft3); }
        return;
      }
      if (deck.theme === 'galeri') {
        s.background = { color: kind === 'section' ? T.dark : T.bg };
        return;
      }
      // klasik
      s.background = { color: darkKind ? T.dark : kind === 'section' ? T.soft : T.bg };
    }
    function footer(s, n, onDark) {
      const col = onDark ? T.onDarkSub : T.muted;
      if (deck.theme === 'galeri') { text(s, '— ' + n + ' —', { x: W / 2 - 0.6, y: H - 0.42, w: 1.2, h: 0.25, fontFace: T.head, fontSize: 10, color: col, align: 'center' }); return; }
      if (deck.theme === 'bilik') { text(s, '▸ ' + String(n).padStart(2, '0') + 'A   TALKADEMIC 400', { x: 0.5, y: H - 0.38, w: 4, h: 0.25, fontFace: T.mono, fontSize: 8, color: T.accent2, charSpacing: 2 }); return; }
      if (deck.theme === 'neon') { text(s, String(n).padStart(2, '0') + ' / ' + String(total).padStart(2, '0'), { x: W - 1.6, y: H - 0.4, w: 1.1, h: 0.25, fontFace: T.mono, fontSize: 9, color: T.accent, align: 'right' }); return; }
      if (deck.theme === 'tropika') { circle(s, W - 0.78, H - 0.6, 0.38, T.accent); text(s, String(n), { x: W - 0.78, y: H - 0.6, w: 0.38, h: 0.38, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' }); return; }
      if (deck.theme === 'pastel') { s.addShape(SH.roundRect, { x: W - 1.0, y: H - 0.5, w: 0.55, h: 0.28, fill: { color: T.soft3 }, line: noLine, rectRadius: 0.14 }); text(s, String(n), { x: W - 1.0, y: H - 0.5, w: 0.55, h: 0.28, fontSize: 10, bold: true, color: T.ink, align: 'center', valign: 'middle' }); return; }
      text(s, shortTitle, { x: 0.5, y: H - 0.38, w: 6.5, h: 0.25, fontSize: 9, color: col, fit: 'shrink' });
      text(s, String(n), { x: W - 1, y: H - 0.38, w: 0.5, h: 0.25, fontSize: 9, color: col, align: 'right' });
    }
    function heading(s, str, w, n) {
      const x = deck.theme === 'tropika' ? 0.6 : 0.5;
      const size = sizeFor(str, [[40, 26], [60, 24], [90, 21], [999, 19]]);
      if (deck.theme === 'neon') text(s, String(n).padStart(2, '0') + ' //', { x, y: 0.28, w: 2, h: 0.25, fontFace: T.mono, fontSize: 10, color: T.accent });
      if (deck.theme === 'bilik') text(s, 'FRAME ' + String(n).padStart(2, '0') + 'A', { x, y: 0.28, w: 2.5, h: 0.25, fontFace: T.mono, fontSize: 8, color: T.accent2, charSpacing: 3 });
      if (deck.theme === 'tropika') circle(s, x, 0.62, 0.22, T.accent);
      head(s, str || '', { x: deck.theme === 'tropika' ? x + 0.34 : x, y: 0.42, w: (w || W - 1) - (deck.theme === 'tropika' ? 0.34 : 0), h: 0.75, fontSize: size, valign: 'bottom', color: deck.theme === 'tropika' ? T.accent2 : T.ink, fit: 'shrink' });
      if (deck.theme === 'galeri') rect(s, x, 1.26, 0.9, 0.025, T.accent);
      else if (deck.theme === 'pastel') s.addShape(SH.roundRect, { x, y: 1.22, w: 0.8, h: 0.1, fill: { color: T.accent }, line: noLine, rectRadius: 0.05 });
      else if (deck.theme === 'neon') { rect(s, x, 1.24, 0.5, 0.05, T.accent); rect(s, x + 0.55, 1.24, 0.2, 0.05, T.accent2); }
      else if (deck.theme === 'bilik') rect(s, x, 1.24, 0.35, 0.05, T.accent);
      else if (deck.theme !== 'tropika') rect(s, x, 1.18, 0.6, 0.06, T.accent);
    }
    function picture(s, sl, x, y, w, h, opt) {
      const o = opt || {};
      if (deck.theme === 'galeri' && !o.bleed) { rect(s, x, y, w, h, 'FFFFFF', { line: { color: T.line, width: 0.75 } }); x += 0.22; y += 0.22; w -= 0.44; h -= 0.62; }
      if (pics[sl.id]) s.addImage({ data: pics[sl.id], x, y, w, h, sizing: { type: 'cover', w, h }, rounding: !!o.round, altText: sl.imageHint || sl.title || '' });
      else {
        if (o.round) circle(s, x, y, Math.min(w, h), T.soft2);
        else rect(s, x, y, w, h, T.soft, { line: { color: T.soft2, width: 1.5, dashType: 'dash' } });
        text(s, [{ text: t('placeholder'), options: { bold: true, breakLine: true } }, { text: sl.imageHint || '', options: { fontSize: 11 } }], { x: x + 0.3, y, w: w - 0.6, h, fontSize: 13, color: T.muted, align: 'center', valign: 'middle' });
      }
      if (deck.theme === 'galeri' && !o.bleed && sl.imageHint) text(s, sl.imageHint, { x, y: y + h + 0.08, w, h: 0.3, fontSize: 9, italic: true, color: T.muted });
    }
    const card = j => {
      const fill = T.cards[j % T.cards.length];
      const solid = deck.theme === 'tropika';
      return { fill, value: solid ? 'FFFFFF' : T.cardInk, label: solid ? 'FFFFFF' : T.muted, line: deck.theme === 'galeri' ? T.line : deck.theme === 'neon' ? T.accent : deck.theme === 'bilik' ? T.line : null };
    };

    /* ---------- layouts ---------- */
    function cover(s, sl, kind) {
      const pic = !!pics[sl.id] || (deck.theme === 'galeri' && kind === 'title') || (deck.theme === 'tropika' && kind === 'title' && !!pics[sl.id]);
      const onDark = !['galeri', 'pastel'].includes(deck.theme);
      const col = onDark ? T.onDark : T.ink, sub = onDark ? T.onDarkSub : T.muted;
      let tx = 0.8, tw = pic ? 5.2 : W - 1.6;
      const topPad = deck.theme === 'bilik' ? 0.5 : 0;
      if (deck.theme === 'tropika') { tw = 5.2; if (pics[sl.id]) picture(s, sl, 6.55, 1.55, 3.6, 3.6, { round: true }); }
      else if (deck.theme === 'galeri' && kind === 'title') {
        if (pics[sl.id]) picture(s, sl, 5.9, 0.55, 3.6, 4.2);
        else { rect(s, 5.9, 0.55, 3.6, 4.5, T.dark); rect(s, 6.25, 0.9, 0.3, 0.3, T.accent); }
      } else if (pics[sl.id]) picture(s, sl, W * 0.6, topPad, W * 0.4, H - topPad * 2, { bleed: true });
      if (deck.theme === 'klasik') { if (!pics[sl.id]) circle(s, W - 2.2, -1.2, 3.2, T.accent, 70); rect(s, 0.6, 1.35, 0.08, 1.9, '0FB5CF'); tx = 0.9; }
      if (deck.theme === 'neon') text(s, '// ' + (kind === 'end' ? 'Q&A' : String(deck.kindLabel || 'TALKADEMIC').toUpperCase()), { x: tx, y: 1.0, w: tw, h: 0.3, fontFace: T.mono, fontSize: 11, color: T.accent });
      if (deck.theme === 'galeri') { text(s, kind === 'end' ? '' : String(deck.kindLabel || ''), { x: tx, y: 1.0, w: tw, h: 0.3, fontSize: 11, color: T.accent }); rect(s, tx, 1.36, 1.2, 0.02, T.accent); }
      const title = sl.title || (kind === 'end' ? t('thanks') : deck.title);
      head(s, title, { x: tx, y: 1.45, w: tw, h: 1.7, fontSize: kind === 'end' ? 44 : sizeFor(title, [[40, 36], [70, 31], [110, 27], [999, 23]]), color: col, valign: 'bottom', fit: 'shrink' });
      if (sl.subtitle) text(s, sl.subtitle, { x: tx, y: 3.25, w: tw, h: 0.75, fontSize: 15, color: sub, fit: 'shrink' });
      const by = [deck.presenter, kind === 'title' ? niceDate(deck.date) : ''].filter(Boolean).join('   ·   ');
      if (by) {
        if (deck.theme === 'galeri') { rect(s, tx, H - 1.15, 3.4, 0.55, 'FFFFFF', { line: { color: T.line, width: 0.75 } }); text(s, by, { x: tx + 0.15, y: H - 1.15, w: 3.1, h: 0.55, fontSize: 10.5, color: T.ink, valign: 'middle' }); }
        else text(s, by, { x: tx, y: H - (deck.theme === 'bilik' ? 1.15 : 0.95), w: tw, h: 0.35, fontSize: 12, color: sub, fontFace: deck.theme === 'neon' ? T.mono : T.body });
      }
      if (deck.theme === 'bilik') text(s, '▸ TALKADEMIC 400   ' + (kind === 'end' ? 'END' : '1A'), { x: 0.3, y: 0.45, w: 5, h: 0.2, fontFace: T.mono, fontSize: 7.5, color: T.accent2, charSpacing: 3 });
    }
    function section(s, sl, n) {
      const pic = !!pics[sl.id];
      const tw = pic ? W * 0.58 : W;
      if (pic) picture(s, sl, tw, deck.theme === 'bilik' ? 0.42 : 0, W - tw, deck.theme === 'bilik' ? H - 0.84 : H, { bleed: true });
      const onDark = ['galeri', 'bilik', 'neon'].includes(deck.theme);
      if (deck.theme === 'bilik') text(s, String(n).padStart(2, '0'), { x: tw - 3.0, y: 2.7, w: 2.6, h: 2.3, fontFace: T.head, fontSize: 120, color: '19140F', align: 'right', valign: 'bottom' });
      if (deck.theme === 'galeri') rect(s, 0.75, 1.32, 0.18, 0.18, T.accent);
      const kx = deck.theme === 'galeri' ? 1.05 : deck.theme === 'tropika' ? 3.1 : 0.75;
      text(s, sl.title || '', { x: kx, y: 1.25, w: tw - kx - 0.6, h: 0.35, fontSize: 14, bold: true, color: deck.theme === 'tropika' ? T.accent2 : deck.theme === 'bilik' ? T.accent2 : T.accent, fontFace: deck.theme === 'neon' || deck.theme === 'bilik' ? T.mono : T.body, charSpacing: deck.theme === 'neon' ? 2 : 0 });
      if (deck.theme === 'neon') rect(s, 0.75, 1.75, 0.06, 2.3, T.accent);
      const len = String(sl.statement || '').length * (pic ? 1.5 : 1);
      const sx = deck.theme === 'neon' ? 1.0 : deck.theme === 'tropika' ? 3.1 : 0.75;
      head(s, sl.statement || '', { x: sx, y: 1.7, w: tw - sx - 0.75, h: 2.6, fontSize: len > 140 ? 22 : len > 90 ? 26 : 30, color: onDark ? T.onDark : T.ink, fit: 'shrink' });
      footer(s, n, onDark);
    }
    function bullets(s, sl, n) {
      const pic = !!pics[sl.id];
      const flip = pic && n % 2 === 0 && deck.theme !== 'galeri';
      const tw = pic ? 5.3 : W - 1;
      const x0 = flip ? W - tw - 0.5 : 0.5;
      if (pic) picture(s, sl, flip ? 0 : 6.1, deck.theme === 'galeri' ? 0.6 : 0, W - 6.1 - (deck.theme === 'galeri' ? 0.4 : 0), deck.theme === 'galeri' ? 4.4 : H, { bleed: deck.theme !== 'galeri' });
      const items = clean(sl.bullets);
      const sizeTL = items.join(' ').length * (pic ? 1.6 : 1);
      // The heading follows the text column, which swaps sides on every other picture slide.
      headingAt(s, sl.title, flip ? x0 : 0.5, tw, n);
      if (deck.theme === 'pastel') s.addShape(SH.roundRect, { x: x0 - 0.15, y: 1.45, w: tw + 0.3, h: H - 2.1, fill: { color: 'FFFFFF' }, line: { color: T.line, width: 1 }, rectRadius: 0.2 });
      text(s, items.map((b, k) => ({ text: b, options: { bullet: { code: T.bullet }, breakLine: k < items.length - 1 } })),
        { x: x0 + (deck.theme === 'pastel' ? 0.15 : 0), y: deck.theme === 'pastel' ? 1.65 : 1.55, w: tw - (deck.theme === 'pastel' ? 0.3 : 0), h: H - 2.3, fontSize: sizeTL > 320 ? 14 : sizeTL > 220 ? 16 : items.length > 4 ? 17 : 19, color: T.ink, paraSpaceAfter: 10, fit: 'shrink' });
      footer(s, n);
    }
    function headingAt(s, str, x, w, n) {
      if (x === 0.5 || deck.theme === 'tropika') { heading(s, str, w, n); return; }
      // mirrored layout: draw the heading at the right-hand text column
      const size = sizeFor(str, [[40, 26], [60, 24], [90, 21], [999, 19]]);
      head(s, str || '', { x, y: 0.42, w, h: 0.75, fontSize: size, valign: 'bottom', fit: 'shrink' });
      rect(s, x, 1.2, 0.6, 0.05, T.accent);
    }
    function stats(s, sl, n) {
      heading(s, sl.title, null, n);
      const k = sl.stats.length, gap = 0.3, cw = (W - 1 - gap * (k - 1)) / k;
      sl.stats.forEach((x, j) => {
        const cx = 0.5 + j * (cw + gap), c = card(j);
        if (deck.theme === 'galeri') rect(s, cx, 1.75, cw, 0.03, T.ink);
        else s.addShape(SH.roundRect, { x: cx, y: 1.6, w: cw, h: 2.9, fill: { color: c.fill }, line: c.line ? { color: c.line, width: 1 } : noLine, rectRadius: deck.theme === 'pastel' ? 0.25 : 0.12 });
        text(s, x.value, { x: cx + 0.15, y: 1.9, w: cw - 0.3, h: 1.3, fontFace: deck.theme === 'neon' ? T.mono : T.head, fontSize: k > 3 ? 36 : 46, bold: true, color: c.value, align: deck.theme === 'galeri' ? 'left' : 'center', valign: 'middle', fit: 'shrink' });
        text(s, x.label, { x: cx + 0.15, y: 3.25, w: cw - 0.3, h: 1.0, fontSize: 14, color: c.label, align: deck.theme === 'galeri' ? 'left' : 'center', fit: 'shrink' });
      });
      footer(s, n);
    }
    function compare(s, sl, n) {
      heading(s, sl.title, null, n);
      ['left', 'right'].forEach((side, j) => {
        const cx = 0.5 + j * 4.6, x = sl[side];
        const fill = deck.theme === 'tropika' ? (j ? T.accent2 : 'FFFFFF') : j ? T.soft : (deck.theme === 'bilik' || deck.theme === 'neon' ? T.soft : 'FFFFFF');
        const ink = deck.theme === 'tropika' && j ? 'FFFFFF' : T.ink;
        s.addShape(SH.roundRect, { x: cx, y: 1.5, w: 4.4, h: 3.4, fill: { color: fill }, line: { color: j ? T.accent : T.line, width: 1 }, rectRadius: deck.theme === 'pastel' ? 0.25 : 0.12 });
        head(s, x.heading || '', { x: cx + 0.3, y: 1.7, w: 3.8, h: 0.5, fontSize: 17, color: deck.theme === 'tropika' && j ? T.accent3 : j ? T.accent : ink, fit: 'shrink', valign: 'middle' });
        const items = clean(x.bullets);
        text(s, items.map((b, q) => ({ text: b, options: { bullet: { code: T.bullet }, breakLine: q < items.length - 1 } })), { x: cx + 0.3, y: 2.3, w: 3.8, h: 2.4, fontSize: 15, color: ink, paraSpaceAfter: 8, fit: 'shrink' });
      });
      footer(s, n);
    }
    function framework(s, sl, n, levels) {
      heading(s, sl.title, null, n);
      const cols = levels(sl), area = { x: 0.6, y: 1.55, w: W - 1.2, h: H - 2.2 };
      const bw = Math.min(2.4, (area.w - (cols.length - 1) * 0.9) / cols.length), bh = 0.78;
      const pos = {};
      cols.forEach((col, ci) => {
        const x = cols.length === 1 ? area.x + (area.w - bw) / 2 : area.x + ci * ((area.w - bw) / (cols.length - 1));
        col.forEach((idx, ri) => { pos[idx] = { x, y: area.y + (ri + 1) * (area.h / (col.length + 1)) - bh / 2 }; });
      });
      sl.links.forEach(l => {
        const a = pos[l.f], b = pos[l.t];
        if (!a || !b) return;
        const x1 = a.x + bw, y1 = a.y + bh / 2, x2 = b.x, y2 = b.y + bh / 2;
        if (x2 <= x1) return;
        s.addShape(SH.line, { x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.max(Math.abs(y2 - y1), 0.001), flipV: y2 < y1, line: { color: T.accent2, width: 1.75, endArrowType: 'triangle' } });
        if (l.label) text(s, l.label, { x: (x1 + x2) / 2 - 0.3, y: (y1 + y2) / 2 - 0.16, w: 0.6, h: 0.3, fontSize: 10, bold: true, color: T.accent, align: 'center', valign: 'middle', fill: { color: T.bg } });
      });
      sl.nodes.forEach((name, idx) => {
        const p = pos[idx]; if (!p) return;
        const c = card(idx);
        const fill = deck.theme === 'tropika' ? c.fill : T.soft;
        s.addShape(SH.roundRect, { x: p.x, y: p.y, w: bw, h: bh, fill: { color: fill }, line: { color: T.accent, width: 1.25 }, rectRadius: 0.1 });
        text(s, name, { x: p.x + 0.08, y: p.y, w: bw - 0.16, h: bh, fontSize: 13, bold: true, color: deck.theme === 'tropika' ? 'FFFFFF' : T.ink, align: 'center', valign: 'middle', fit: 'shrink' });
      });
      footer(s, n);
    }
    function steps(s, sl, n) {
      heading(s, sl.title, null, n);
      const k = sl.steps.length, cy = 2.35, d = 0.62;
      const bwStep = Math.min(2.2, (W - 1) / k);
      const x0 = 0.5 + bwStep / 2, x1 = W - 0.5 - bwStep / 2;
      const gapx = k > 1 ? (x1 - x0) / (k - 1) : 0;
      s.addShape(SH.line, { x: x0, y: cy, w: x1 - x0, h: 0, line: { color: T.line, width: 2.5 } });
      sl.steps.forEach((st, j) => {
        const cx = x0 + j * gapx, c = card(j);
        const fill = deck.theme === 'tropika' || deck.theme === 'pastel' ? c.fill : T.accent;
        circle(s, cx - d / 2, cy - d / 2, d, fill);
        text(s, String(j + 1), { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fontSize: 18, bold: true, align: 'center', valign: 'middle', color: deck.theme === 'pastel' ? T.ink : deck.theme === 'neon' ? T.bg : 'FFFFFF', fontFace: deck.theme === 'neon' ? T.mono : T.head });
        const bw = bwStep;
        head(s, st.label, { x: cx - bw / 2, y: cy + 0.48, w: bw, h: 0.5, fontSize: 14, align: 'center', color: T.ink, fit: 'shrink' });
        if (st.text) text(s, st.text, { x: cx - bw / 2, y: cy + 0.98, w: bw, h: 1.2, fontSize: 11.5, color: T.muted, align: 'center', fit: 'shrink' });
      });
      footer(s, n);
    }
    function quote(s, sl, n) {
      const onDark = deck.theme === 'bilik' || deck.theme === 'neon';
      if (deck.theme === 'galeri') rect(s, 0.85, 1.75, 0.03, 2.7, T.accent);
      text(s, '“', { x: 0.55, y: 0.2, w: 1.5, h: 1.6, fontFace: 'Georgia', fontSize: 120, color: T.accent, bold: true });
      const len = String(sl.quote || '').length;
      text(s, sl.quote || '', { x: 1.2, y: 1.35, w: W - 2.3, h: 2.6, fontFace: T.serif ? T.head : 'Georgia', italic: true, fontSize: len > 200 ? 20 : len > 120 ? 24 : 28, color: onDark ? T.onDark : T.ink, fit: 'shrink' });
      if (sl.source) text(s, '— ' + sl.source, { x: 1.2, y: 4.05, w: W - 2.3, h: 0.4, fontSize: 13, color: deck.theme === 'tropika' ? T.accent2 : T.accent, bold: true });
      footer(s, n, onDark);
    }
    function image(s, sl, n) {
      picture(s, sl, 0, 0, W, H, { bleed: true });
      const band = deck.theme === 'tropika' ? T.accent2 : deck.theme === 'pastel' ? T.ink : deck.theme === 'galeri' ? T.dark : T.dark;
      rect(s, 0, H - 1.45, W, 1.45, band, { fill: { color: band, transparency: 12 } });
      if (deck.theme === 'tropika') rect(s, 0, H - 1.45, W, 0.07, T.accent3);
      if (deck.theme === 'neon') rect(s, 0, H - 1.45, W, 0.04, T.accent);
      head(s, sl.title || '', { x: 0.5, y: H - 1.35, w: W - 1, h: 0.55, fontSize: 22, color: 'FFFFFF', fit: 'shrink', valign: 'middle' });
      if (sl.caption) text(s, sl.caption, { x: 0.5, y: H - 0.8, w: W - 1.6, h: 0.5, fontSize: 13, color: 'E8E4F2', fit: 'shrink' });
      text(s, String(n), { x: W - 1, y: H - 0.38, w: 0.5, h: 0.25, fontSize: 9, color: 'E8E4F2', align: 'right' });
    }
    function references(list, perSlide) {
      for (let k = 0; k < list.length; k += perSlide) {
        const s = pres.addSlide();
        background(s, 'content');
        heading(s, t('refs') + (list.length > perSlide ? ' (' + (k / perSlide + 1) + ')' : ''), null, '');
        text(s, list.slice(k, k + perSlide).map((r, j, arr) => ({ text: r.apa, options: { breakLine: j < arr.length - 1 } })), { x: 0.6, y: 1.5, w: W - 1.2, h: H - 2.1, fontSize: 11, color: T.ink, paraSpaceAfter: 6, fit: 'shrink' });
      }
    }

    pres.theme = { headFontFace: T.head, bodyFontFace: T.body };
    let refsDone = !refs.length;
    deck.slides.forEach((sl, i) => {
      if (!refsDone && sl.layout === 'end' && i === deck.slides.length - 1) { references(refs, 7); refsDone = true; }
      const s = pres.addSlide();
      const n = i + 1;
      if (sl.notes) s.addNotes(sl.notes);
      const kind = sl.layout === 'title' || sl.layout === 'end' ? sl.layout : sl.layout === 'section' ? 'section' : 'content';
      background(s, kind);
      if (sl.layout === 'title' || sl.layout === 'end') cover(s, sl, sl.layout);
      else if (sl.layout === 'section') section(s, sl, n);
      else if (sl.layout === 'image') image(s, sl, n);
      else if (sl.layout === 'stats') stats(s, sl, n);
      else if (sl.layout === 'compare') compare(s, sl, n);
      else if (sl.layout === 'framework') framework(s, sl, n, ctx.levels);
      else if (sl.layout === 'steps') steps(s, sl, n);
      else if (sl.layout === 'quote') quote(s, sl, n);
      else bullets(s, sl, n);
    });
    if (!refsDone) references(refs, 7);
  }

  const api = { THEMES, ORDER, build };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicSlideThemes = api;
})(typeof window !== 'undefined' ? window : globalThis);
