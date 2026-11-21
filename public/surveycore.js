/* Talkademic "Analisis Soal Selidik" core: read a questionnaire CSV (Google Forms, Microsoft Forms,
   SPSS export), sort the columns into demographics and Likert items, group items into constructs,
   and compute what Chapter 4 needs: respondent profile, Cronbach's alpha with item statistics,
   descriptive statistics with levels, normality (skewness, kurtosis) and Pearson correlations.
   It also writes the Results text from the numbers, so nothing is guessed. Browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TalkademicSurveyCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- CSV ---------- */
  function detectDelimiter(text) {
    const head = text.split(/\r?\n/).slice(0, 5).join('\n');
    const count = ch => { let n = 0, q = false; for (const c of head) { if (c === '"') q = !q; else if (!q && c === ch) n++; } return n; };
    const c = { ',': count(','), ';': count(';'), '\t': count('\t') };
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0][1] ? Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] : ',';
  }
  function parseCSV(text, delim) {
    const s = String(text || '').replace(/^﻿/, '');
    const d = delim || detectDelimiter(s);
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === d) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(x => x.trim() !== '')) rows.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some(x => x.trim() !== '')) rows.push(row);
    if (!rows.length) return { headers: [], rows: [] };
    const headers = rows[0].map((h, i) => h.trim() || 'Lajur ' + (i + 1));
    const body = rows.slice(1).map(r => headers.map((_, i) => String(r[i] == null ? '' : r[i]).trim()));
    return { headers, rows: body };
  }

  /* ---------- Likert values ---------- */
  const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const L5 = { 'sangat tidak setuju': 1, 'amat tidak setuju': 1, 'strongly disagree': 1, 'tidak setuju': 2, 'disagree': 2, 'tidak pasti': 3, 'neutral': 3, 'berkecuali': 3, 'neither agree nor disagree': 3, 'tidak pasti neutral': 3, 'agak setuju': 3, 'setuju': 4, 'agree': 4, 'sangat setuju': 5, 'amat setuju': 5, 'strongly agree': 5,
    'sangat tidak puas hati': 1, 'tidak puas hati': 2, 'puas hati': 4, 'sangat puas hati': 5, 'very dissatisfied': 1, 'dissatisfied': 2, 'satisfied': 4, 'very satisfied': 5,
    'tidak pernah': 1, 'jarang': 2, 'kadang kadang': 3, 'kerap': 4, 'sangat kerap': 5, 'never': 1, 'rarely': 2, 'sometimes': 3, 'often': 4, 'always': 5 };
  const L7 = { 'strongly disagree': 1, 'sangat tidak setuju': 1, 'disagree': 2, 'tidak setuju': 2, 'somewhat disagree': 3, 'agak tidak setuju': 3, 'neutral': 4, 'neither agree nor disagree': 4, 'tidak pasti': 4, 'berkecuali': 4, 'somewhat agree': 5, 'agak setuju': 5, 'agree': 6, 'setuju': 6, 'strongly agree': 7, 'sangat setuju': 7 };
  /* "5", "5 - Sangat setuju", "Sangat setuju (5)", "Setuju" → number, or NaN. */
  function likertValue(v, seven) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return NaN;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    const lead = s.match(/^(\d{1,2})\s*[-–.:)=]/) || s.match(/\((\d{1,2})\)\s*$/);
    if (lead) return Number(lead[1]);
    const k = norm(s);
    const map = seven ? L7 : L5;
    return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : NaN;
  }
  const isSeven = rows => rows.some(r => r.some(v => /\b(somewhat|agak tidak setuju)\b/i.test(v)));

  /* ---------- columns ---------- */
  const SKIP = /timestamp|cap masa|^masa$|tarikh|e-?mel|email|alamat e|nama penuh|^nama$|^name$|full name|phone|telefon|no\.? ?(tel|kp|ic)|ic number|consent|persetujuan|signature|tandatangan/i;
  function groupOf(header) {
    const grid = header.match(/^(.*?)\s*\[(.+)\]\s*$/);
    if (grid && grid[1].trim()) return { group: grid[1].trim(), label: grid[2].trim() };
    const code = header.match(/^([A-Za-z]{1,8})[\s_.-]?(\d{1,2})(?=$|[\s:.)\-_])/);
    if (code) return { group: code[1].toUpperCase(), label: header };
    return { group: '', label: header };
  }
  /* Guess what each column is: skip, demo (categories), number (e.g. age), item (Likert) or text. */
  function classify(table) {
    const { headers, rows } = table;
    const seven = isSeven(rows);
    return headers.map((h, i) => {
      const vals = rows.map(r => r[i]).filter(v => v !== '');
      const uniq = new Set(vals.map(v => v.toLowerCase()));
      const g = groupOf(h);
      const base = { i, header: h, group: g.group, label: g.group ? g.label : h.replace(/[?:]+\s*$/, '').trim(), reverse: false };
      if (!vals.length || SKIP.test(h)) return { ...base, type: 'skip' };
      const nums = vals.map(v => likertValue(v, seven));
      const ok = nums.filter(n => Number.isFinite(n));
      const ints = ok.filter(n => Number.isInteger(n) && n >= 0 && n <= 10);
      const allNum = vals.every(v => /^-?\d+(\.\d+)?$/.test(v));
      const likertLike = ints.length > 0 && ok.length >= vals.length * 0.9 && ints.length === ok.length && Math.max(...ints) - Math.min(...ints) <= 10 && new Set(ints).size <= 11;
      const demoish = /umur|\bage\b|usia|tahun|\byear|pendapatan|income|gaji|salary|bilangan|number of|kekerapan|how many|berapa/i.test(h);
      if (likertLike && (!allNum || g.group || !demoish)) return { ...base, type: 'item' };
      if (allNum && uniq.size > 7) return { ...base, type: 'number' };
      if (uniq.size <= 15 && uniq.size <= vals.length * 0.6) return { ...base, type: 'demo' };
      return { ...base, type: 'text' };
    });
  }
  /* Constructs from the guessed groups; items without a group go to one construct per run. */
  function defaultConstructs(cols) {
    const out = [], seen = new Map();
    for (const c of cols) {
      if (c.type !== 'item') continue;
      const key = c.group || '__';
      if (!seen.has(key)) { seen.set(key, 'k' + (out.length + 1)); out.push({ id: seen.get(key), name: c.group || 'Konstruk ' + (out.length + 1) }); }
      c.construct = seen.get(key);
    }
    return out;
  }

  /* ---------- statistics ---------- */
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => a.length ? sum(a) / a.length : NaN;
  function sd(a) { if (a.length < 2) return NaN; const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); }
  const variance = a => sd(a) ** 2;
  function skewness(a) {
    const n = a.length; if (n < 3) return NaN;
    const m = mean(a), s = sd(a); if (!s) return 0;
    return n / ((n - 1) * (n - 2)) * sum(a.map(x => ((x - m) / s) ** 3));
  }
  function kurtosis(a) {
    const n = a.length; if (n < 4) return NaN;
    const m = mean(a), s = sd(a); if (!s) return 0;
    return n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * sum(a.map(x => ((x - m) / s) ** 4)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3));
  }
  function pearson(x, y) {
    const n = x.length; if (n < 3) return NaN;
    const mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
  }
  /* Two-tailed p for Pearson r via Student's t (regularised incomplete beta). */
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015; for (const k of c) ser += k / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pOfR(r, n) {
    if (!Number.isFinite(r) || n < 3) return NaN;
    if (Math.abs(r) >= 1) return 0;
    const df = n - 2, t = r * Math.sqrt(df / (1 - r * r));
    return ibeta(df / (df + t * t), df / 2, 0.5);
  }
  function cronbach(matrix) {
    const k = matrix[0] ? matrix[0].length : 0, n = matrix.length;
    if (k < 2 || n < 3) return NaN;
    const cols = Array.from({ length: k }, (_, j) => matrix.map(r => r[j]));
    const totals = matrix.map(r => sum(r));
    const vt = variance(totals);
    return vt ? k / (k - 1) * (1 - sum(cols.map(variance)) / vt) : NaN;
  }

  /* ---------- the whole analysis ---------- */
  function analyse(table, cols, constructs, opt) {
    const o = opt || {};
    const seven = isSeven(table.rows);
    const scale = o.scale || (seven ? 7 : 5);
    const N = table.rows.length;
    const valueOf = (c, r) => { const v = likertValue(table.rows[r][c.i], seven); return Number.isFinite(v) ? (c.reverse ? scale + 1 - v : v) : NaN; };
    // Respondent profile.
    const demos = cols.filter(c => c.type === 'demo').map(c => {
      const counts = new Map();
      let valid = 0;
      for (const r of table.rows) { const v = r[c.i]; if (!v) continue; valid++; const key = v.replace(/\s+/g, ' '); counts.set(key, (counts.get(key) || 0) + 1); }
      const cats = [...counts.entries()].map(([label, n]) => ({ label, n, pct: valid ? n / valid * 100 : 0 })).sort((a, b) => b.n - a.n);
      return { header: c.label || c.header, valid, missing: N - valid, cats };
    });
    const numbers = cols.filter(c => c.type === 'number').map(c => {
      const a = table.rows.map(r => Number(r[c.i])).filter(Number.isFinite);
      return { header: c.label || c.header, n: a.length, mean: mean(a), sd: sd(a), min: Math.min(...a), max: Math.max(...a) };
    });
    // Items and constructs.
    const items = cols.filter(c => c.type === 'item');
    const itemStats = items.map(c => {
      const a = table.rows.map((_, r) => valueOf(c, r)).filter(Number.isFinite);
      const n = a.length;
      const seSkew = n > 3 ? Math.sqrt(6 * n * (n - 1) / ((n - 2) * (n + 1) * (n + 3))) : NaN;
      return { i: c.i, header: c.header, label: c.label, construct: c.construct, reverse: c.reverse, n, mean: mean(a), sd: sd(a), skew: skewness(a), kurt: kurtosis(a), seSkew, seKurt: n > 5 ? 2 * seSkew * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5))) : NaN };
    });
    const band = (scale - 1) / 3;
    const level = m => !Number.isFinite(m) ? '' : m <= 1 + band + 1e-9 ? 'low' : m <= 1 + 2 * band + 1e-9 ? 'moderate' : 'high';
    const scores = new Map();
    const cons = constructs.map(k => {
      const its = items.filter(c => c.construct === k.id);
      if (!its.length) return null;
      const complete = [];
      table.rows.forEach((_, r) => { const v = its.map(c => valueOf(c, r)); if (v.every(Number.isFinite)) complete.push({ r, v }); });
      const matrix = complete.map(x => x.v);
      const alpha = cronbach(matrix);
      const itemRows = its.map((c, j) => {
        const rest = matrix.map(row => sum(row) - row[j]);
        const others = matrix.map(row => row.filter((_, q) => q !== j));
        return { header: c.header, label: c.label, citc: pearson(matrix.map(row => row[j]), rest), alphaIfDeleted: its.length > 2 ? cronbach(others) : NaN };
      });
      const sc = new Map(complete.map(x => [x.r, mean(x.v)]));
      scores.set(k.id, sc);
      const a = [...sc.values()];
      const m = mean(a);
      return { id: k.id, name: k.name, k: its.length, n: complete.length, alpha, items: itemRows, mean: m, sd: sd(a), level: level(m), skew: skewness(a), kurt: kurtosis(a) };
    }).filter(Boolean);
    // Correlations between construct scores (pairwise complete cases).
    const corr = cons.map(a => cons.map(b => {
      if (a.id === b.id) return { r: 1, p: 0, n: a.n };
      const sa = scores.get(a.id), sb = scores.get(b.id), x = [], y = [];
      for (const [r, v] of sa) if (sb.has(r)) { x.push(v); y.push(sb.get(r)); }
      const r = pearson(x, y);
      return { r, p: pOfR(r, x.length), n: x.length };
    }));
    return { N, scale, seven, demos, numbers, items: itemStats, constructs: cons, corr, cols: { demo: demos.length, item: items.length } };
  }

  /* ---------- numbers as text ---------- */
  const f2 = x => Number.isFinite(x) ? x.toFixed(2) : '–';
  const f3 = x => Number.isFinite(x) ? x.toFixed(3) : '–';
  const f1 = x => Number.isFinite(x) ? x.toFixed(1) : '–';
  /* APA style for r and p: no leading zero. */
  const apa = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace(/^(-?)0\./, '$1.') : '–';
  const pText = p => !Number.isFinite(p) ? '–' : p < 0.001 ? '< .001' : '= ' + apa(p, 3);
  const stars = p => p < 0.01 ? '**' : p < 0.05 ? '*' : '';
  const alphaLevel = a => !Number.isFinite(a) ? 'na' : a >= 0.9 ? 'excellent' : a >= 0.8 ? 'good' : a >= 0.7 ? 'acceptable' : a >= 0.6 ? 'questionable' : a >= 0.5 ? 'poor' : 'unacceptable';
  const strength = r => { const a = Math.abs(r); return a >= 0.5 ? 'strong' : a >= 0.3 ? 'moderate' : a >= 0.1 ? 'weak' : 'negligible'; };

  const W = {
    ms: {
      low: 'rendah', moderate: 'sederhana', high: 'tinggi', excellent: 'sangat baik', good: 'baik', acceptable: 'boleh diterima', questionable: 'boleh dipersoalkan', poor: 'lemah', unacceptable: 'tidak boleh diterima', na: 'tidak dapat dikira',
      strong: 'kuat', weak: 'lemah', negligible: 'sangat lemah', positive: 'positif', negative: 'negatif'
    },
    en: {
      low: 'low', moderate: 'moderate', high: 'high', excellent: 'excellent', good: 'good', acceptable: 'acceptable', questionable: 'questionable', poor: 'poor', unacceptable: 'unacceptable', na: 'not computable',
      strong: 'strong', weak: 'weak', negligible: 'negligible', positive: 'positive', negative: 'negative'
    }
  };

  /* Tables as plain rows (first row = header), for the screen, Excel and copying. */
  function tables(res, lang) {
    const ms = lang !== 'en', w = W[ms ? 'ms' : 'en'];
    const out = [];
    for (const d of res.demos) out.push({ id: 'demo', title: (ms ? 'Profil responden: ' : 'Respondent profile: ') + d.header, rows: [[ms ? 'Kategori' : 'Category', ms ? 'Kekerapan' : 'Frequency', ms ? 'Peratus (%)' : 'Percent (%)'], ...d.cats.map(c => [c.label, String(c.n), f1(c.pct)]), [ms ? 'Jumlah' : 'Total', String(d.valid), '100.0']] });
    if (res.numbers.length) out.push({ id: 'num', title: ms ? 'Pemboleh ubah berangka' : 'Numeric variables', rows: [[ms ? 'Pemboleh ubah' : 'Variable', 'n', 'Minimum', ms ? 'Maksimum' : 'Maximum', ms ? 'Min' : 'Mean', ms ? 'SP' : 'SD'], ...res.numbers.map(x => [x.header, String(x.n), String(x.min), String(x.max), f2(x.mean), f2(x.sd)])] });
    if (res.constructs.length) {
      out.push({ id: 'rel', title: ms ? 'Kebolehpercayaan (alfa Cronbach)' : "Reliability (Cronbach's alpha)", rows: [[ms ? 'Konstruk' : 'Construct', ms ? 'Bil. item' : 'No. of items', 'n', ms ? 'Alfa Cronbach' : "Cronbach's alpha", ms ? 'Tahap' : 'Level'], ...res.constructs.map(c => [c.name, String(c.k), String(c.n), f3(c.alpha), w[alphaLevel(c.alpha)]])] });
      out.push({ id: 'itemrel', title: ms ? 'Statistik item-jumlah' : 'Item-total statistics', rows: [[ms ? 'Konstruk' : 'Construct', 'Item', ms ? 'Korelasi item-jumlah diperbetulkan' : 'Corrected item-total correlation', ms ? 'Alfa jika item dibuang' : "Alpha if item deleted"], ...res.constructs.flatMap(c => c.items.map(it => [c.name, it.label, f3(it.citc), f3(it.alphaIfDeleted)]))] });
      out.push({ id: 'desc', title: ms ? 'Statistik deskriptif konstruk' : 'Descriptive statistics of constructs', rows: [[ms ? 'Konstruk' : 'Construct', 'n', ms ? 'Min' : 'Mean', ms ? 'Sisihan piawai' : 'SD', ms ? 'Tahap' : 'Level'], ...res.constructs.map(c => [c.name, String(c.n), f2(c.mean), f2(c.sd), w[c.level]])] });
      out.push({ id: 'items', title: ms ? 'Statistik deskriptif dan normaliti item' : 'Item descriptive statistics and normality', rows: [[ms ? 'Konstruk' : 'Construct', 'Item', 'n', ms ? 'Min' : 'Mean', ms ? 'SP' : 'SD', ms ? 'Kepencongan' : 'Skewness', ms ? 'Kurtosis' : 'Kurtosis'], ...res.items.map(it => [(res.constructs.find(c => c.id === it.construct) || {}).name || '', it.label + (it.reverse ? ' (R)' : ''), String(it.n), f2(it.mean), f2(it.sd), f3(it.skew), f3(it.kurt)])] });
      if (res.constructs.length > 1) out.push({ id: 'corr', title: ms ? 'Korelasi Pearson antara konstruk' : 'Pearson correlations between constructs', rows: [[ms ? 'Konstruk' : 'Construct', ...res.constructs.map((_, j) => String(j + 1))], ...res.constructs.map((c, i) => [(i + 1) + '. ' + c.name, ...res.corr[i].map((x, j) => j > i ? '' : j === i ? '1' : apa(x.r, 2) + stars(x.p))])], note: ms ? '* p < .05; ** p < .01 (dua hujung)' : '* p < .05; ** p < .01 (two-tailed)' });
    }
    return out;
  }

  /* The Results write-up, built only from the computed numbers. [PERLU RUJUKAN] marks where a method citation belongs. */
  function writeUp(res, lang) {
    const ms = lang !== 'en', w = W[ms ? 'ms' : 'en'], cite = ms ? ' [PERLU RUJUKAN]' : ' [SOURCE NEEDED]';
    const P = [];
    const list = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + (ms ? ' dan ' : ' and ') + arr[arr.length - 1];
    if (res.demos.length || res.numbers.length) {
      P.push(ms ? 'Profil Responden' : 'Respondent Profile');
      const s = [ms ? `Seramai ${res.N} responden telah melengkapkan soal selidik ini.` : `A total of ${res.N} respondents completed the questionnaire.`];
      for (const d of res.demos) {
        if (!d.cats.length) continue;
        const txt = c => `${c.label} (${c.n}, ${f1(c.pct)}%)`;
        const first = d.cats.filter(c => c.n === d.cats[0].n);
        const rest = d.cats.slice(first.length, Math.max(3, first.length + 1)).map(txt);
        const topic = d.header.charAt(0).toLowerCase() + d.header.slice(1);
        const lead = first.length > 1
          ? (ms ? `bilangan responden paling ramai ialah ${list(first.map(txt))}` : `the largest groups were ${list(first.map(txt))}`)
          : first[0].pct > 50 ? (ms ? `majoriti responden ialah ${txt(first[0])}` : `the majority of respondents were ${txt(first[0])}`)
            : (ms ? `kebanyakan responden ialah ${txt(first[0])}` : `most respondents were ${txt(first[0])}`);
        s.push(ms ? `Dari segi ${topic}, ${lead}${rest.length ? ', diikuti oleh ' + list(rest) : ''}.` : `In terms of ${topic}, ${lead}${rest.length ? ', followed by ' + list(rest) : ''}.`);
      }
      for (const x of res.numbers) s.push(ms ? `Bagi ${x.header.charAt(0).toLowerCase() + x.header.slice(1)}, nilai min ialah ${f2(x.mean)} (SP = ${f2(x.sd)}), antara ${x.min} hingga ${x.max}.` : `For ${x.header.charAt(0).toLowerCase() + x.header.slice(1)}, the mean was ${f2(x.mean)} (SD = ${f2(x.sd)}), ranging from ${x.min} to ${x.max}.`);
      P.push(s.join(' '));
    }
    const C = res.constructs;
    if (C.length) {
      P.push(ms ? 'Analisis Kebolehpercayaan' : 'Reliability Analysis');
      const al = C.map(c => c.alpha).filter(Number.isFinite);
      const weak = C.filter(c => Number.isFinite(c.alpha) && c.alpha < 0.7);
      const s = [ms ? `Kebolehpercayaan ketekalan dalaman setiap konstruk diuji menggunakan alfa Cronbach. Nilai alfa adalah antara ${f3(Math.min(...al))} hingga ${f3(Math.max(...al))}.`
        : `The internal consistency reliability of each construct was tested using Cronbach's alpha. Alpha values ranged from ${f3(Math.min(...al))} to ${f3(Math.max(...al))}.`];
      s.push(...C.map(c => ms ? `${c.name} (${c.k} item) mencatat α = ${f3(c.alpha)}, iaitu ${w[alphaLevel(c.alpha)]}.` : `${c.name} (${c.k} items) recorded α = ${f3(c.alpha)}, which is ${w[alphaLevel(c.alpha)]}.`));
      s.push(weak.length
        ? (ms ? `Konstruk ${list(weak.map(c => c.name))} berada di bawah nilai 0.70 yang biasanya disyorkan${cite}, jadi item dengan korelasi item-jumlah yang rendah perlu disemak.` : `${list(weak.map(c => c.name))} fell below the commonly recommended value of 0.70${cite}, so items with low item-total correlations should be reviewed.`)
        : (ms ? `Semua konstruk melepasi nilai 0.70 yang biasanya disyorkan${cite}, menunjukkan ketekalan dalaman yang memuaskan.` : `All constructs exceeded the commonly recommended value of 0.70${cite}, indicating satisfactory internal consistency.`));
      const lowItems = C.flatMap(c => c.items.filter(it => Number.isFinite(it.citc) && it.citc < 0.3).map(it => `${it.label} (${f3(it.citc)})`));
      if (lowItems.length) s.push(ms ? `Item ${list(lowItems)} mempunyai korelasi item-jumlah diperbetulkan di bawah 0.30${cite}.` : `Items ${list(lowItems)} had corrected item-total correlations below 0.30${cite}.`);
      P.push(s.join(' '));

      P.push(ms ? 'Analisis Deskriptif' : 'Descriptive Analysis');
      const band = (res.scale - 1) / 3;
      const b1 = (1 + band).toFixed(2), b2 = (1 + 2 * band).toFixed(2);
      const d = [ms ? `Skor min bagi setiap konstruk ditafsirkan pada skala ${res.scale} mata sebagai rendah (1.00–${b1}), sederhana (${(Number(b1) + 0.01).toFixed(2)}–${b2}) dan tinggi (${(Number(b2) + 0.01).toFixed(2)}–${res.scale.toFixed(2)})${cite}.`
        : `Construct mean scores on the ${res.scale}-point scale were interpreted as low (1.00–${b1}), moderate (${(Number(b1) + 0.01).toFixed(2)}–${b2}) and high (${(Number(b2) + 0.01).toFixed(2)}–${res.scale.toFixed(2)})${cite}.`];
      const sorted = C.slice().sort((a, b) => b.mean - a.mean);
      d.push(...sorted.map(c => ms ? `${c.name} mencatat min ${f2(c.mean)} (SP = ${f2(c.sd)}), pada tahap ${w[c.level]}.` : `${c.name} recorded a mean of ${f2(c.mean)} (SD = ${f2(c.sd)}), at a ${w[c.level]} level.`));
      if (sorted.length > 1) d.push(ms ? `Min tertinggi dicatatkan oleh ${sorted[0].name}, manakala min terendah ialah ${sorted[sorted.length - 1].name}.` : `${sorted[0].name} recorded the highest mean, while ${sorted[sorted.length - 1].name} recorded the lowest.`);
      P.push(d.join(' '));

      P.push(ms ? 'Ujian Normaliti' : 'Normality');
      const sk = res.items.map(i => i.skew).filter(Number.isFinite), ku = res.items.map(i => i.kurt).filter(Number.isFinite);
      const out2 = res.items.filter(i => Math.abs(i.skew) > 2 || Math.abs(i.kurt) > 2);
      const n = [ms ? `Nilai kepencongan item adalah antara ${f3(Math.min(...sk))} hingga ${f3(Math.max(...sk))}, manakala nilai kurtosis adalah antara ${f3(Math.min(...ku))} hingga ${f3(Math.max(...ku))}.`
        : `Item skewness ranged from ${f3(Math.min(...sk))} to ${f3(Math.max(...sk))}, and kurtosis ranged from ${f3(Math.min(...ku))} to ${f3(Math.max(...ku))}.`];
      n.push(out2.length
        ? (ms ? `Item ${list(out2.map(i => i.label))} berada di luar julat ±2${cite}, jadi taburan data tidak sepenuhnya normal.` : `Items ${list(out2.map(i => i.label))} fell outside ±2${cite}, so the data are not fully normally distributed.`)
        : (ms ? `Semua nilai berada dalam julat ±2${cite}, menunjukkan taburan data adalah hampir normal.` : `All values were within ±2${cite}, indicating approximately normal distributions.`));
      P.push(n.join(' '));

      if (C.length > 1) {
        P.push(ms ? 'Analisis Korelasi' : 'Correlation Analysis');
        const pairs = [];
        for (let i = 0; i < C.length; i++) for (let j = 0; j < i; j++) pairs.push({ a: C[j], b: C[i], ...res.corr[i][j] });
        const sig = pairs.filter(p => p.p < 0.05).sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
        const ns = pairs.filter(p => !(p.p < 0.05));
        const c = [ms ? 'Korelasi Pearson digunakan untuk menguji hubungan antara skor min konstruk.' : 'Pearson correlation was used to examine the relationships between construct mean scores.'];
        c.push(...sig.map(p => ms ? `Terdapat hubungan ${w[p.r > 0 ? 'positive' : 'negative']} yang ${w[strength(p.r)]} dan signifikan antara ${p.a.name} dan ${p.b.name}, r(${p.n - 2}) = ${apa(p.r, 2)}, p ${pText(p.p)}.`
          : `There was a significant ${w[strength(p.r)]} ${w[p.r > 0 ? 'positive' : 'negative']} correlation between ${p.a.name} and ${p.b.name}, r(${p.n - 2}) = ${apa(p.r, 2)}, p ${pText(p.p)}.`));
        if (ns.length) c.push(ms ? `Hubungan antara ${list(ns.map(p => p.a.name + ' dan ' + p.b.name))} tidak signifikan (p > .05).` : `The relationships between ${list(ns.map(p => p.a.name + ' and ' + p.b.name))} were not significant (p > .05).`);
        c.push(ms ? `Kekuatan hubungan ditafsir sebagai lemah (.10–.29), sederhana (.30–.49) dan kuat (≥ .50)${cite}.` : `Correlation strength was interpreted as weak (.10–.29), moderate (.30–.49) and strong (≥ .50)${cite}.`);
        P.push(c.join(' '));
      }
    }
    return P.join('\n\n');
  }

  return { parseCSV, detectDelimiter, likertValue, classify, defaultConstructs, analyse, tables, writeUp, groupOf,
    stats: { mean, sd, skewness, kurtosis, pearson, pOfR, cronbach, ibeta }, fmt: { f1, f2, f3, apa, pText }, alphaLevel };
});
