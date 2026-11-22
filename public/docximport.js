/* Talkademic DOCX import: reads a Word .docx on the device (nothing is uploaded) and maps it to a
   journal paper (IMRaD sections, keywords, references) or to thesis chapters and sections.
   A .docx is a zip; entries are inflated with the browser's DecompressionStream. Headings come from
   Word heading styles (any language, via styles.xml and outline levels) or, for unstyled files,
   from short numbered, BAB/CHAPTER, all-caps or all-bold lines. */
(function (root) {
  'use strict';
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const MAX_BYTES = 25 * 1024 * 1024;
  const err = code => Object.assign(new Error(code), { code });

  /* ---------- zip ---------- */
  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') throw err('old-browser');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function unzip(buf, wanted) {
    const dv = new DataView(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw err('not-docx');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const out = {}, dec = new TextDecoder();
    for (let n = 0; n < count && p + 46 <= buf.byteLength; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commLen = dv.getUint16(p + 32, true);
      const localOff = dv.getUint32(p + 42, true);
      const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
      p += 46 + nameLen + extraLen + commLen;
      if (!wanted.includes(name)) continue;
      const start = localOff + 30 + dv.getUint16(localOff + 26, true) + dv.getUint16(localOff + 28, true);
      const data = new Uint8Array(buf, start, csize);
      out[name] = dec.decode(method === 0 ? data : method === 8 ? await inflateRaw(data) : new Uint8Array());
    }
    return out;
  }

  /* ---------- Word XML ---------- */
  const val = el => (el ? el.getAttributeNS(W, 'val') || el.getAttribute('w:val') || '' : '');
  const kids = (el, name) => Array.from(el.childNodes).filter(n => n.nodeType === 1 && n.localName === name);
  const first = (el, name) => el.getElementsByTagNameNS(W, name)[0] || null;

  function readStyles(xml) {
    const map = {};
    if (!xml) return map;
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    for (const st of Array.from(doc.getElementsByTagNameNS(W, 'style'))) {
      const id = st.getAttributeNS(W, 'styleId') || st.getAttribute('w:styleId');
      if (!id) continue;
      const name = val(first(st, 'name')).toLowerCase();
      const ol = first(st, 'outlineLvl');
      const based = val(first(st, 'basedOn'));
      map[id] = { name, outline: ol ? Number(val(ol)) : null, based };
    }
    return map;
  }
  function styleLevel(styles, id) {
    for (let i = 0, cur = id; cur && i < 6; i++) {
      const s = styles[cur];
      const label = ((s && s.name) || cur).toLowerCase();
      if (/^toc|^isi kandungan|table of contents/.test(label)) return 'toc';
      if (/^(title|tajuk)$/.test(label)) return 'title';
      const m = label.match(/(?:heading|tajuk|judul|kop|überschrift|titre|título)\s*(\d)/);
      if (m) return Number(m[1]);
      if (s && s.outline !== null && s.outline < 9) return s.outline + 1;
      cur = s && s.based;
    }
    return 0;
  }
  function runText(node, acc) {
    for (const n of Array.from(node.childNodes)) {
      if (n.nodeType !== 1) continue;
      const ln = n.localName;
      if (ln === 't') acc.push(n.textContent);
      else if (ln === 'tab') acc.push('\t');
      else if (ln === 'br' || ln === 'cr') acc.push('\n');
      else if (ln === 'delText' || ln === 'instrText' || ln === 'del' || ln === 'drawing' || ln === 'pict') continue;
      else runText(n, acc);
    }
    return acc;
  }
  function allBold(p) {
    const runs = Array.from(p.getElementsByTagNameNS(W, 'r')).filter(r => runText(r, []).join('').trim());
    if (!runs.length) return false;
    const pStyleBold = (() => { const rpr = first(p, 'pPr'); const b = rpr && first(rpr, 'b'); return !!b && val(b) !== '0' && val(b) !== 'false'; })();
    return runs.every(r => { const rpr = kids(r, 'rPr')[0]; const b = rpr && kids(rpr, 'b')[0]; return (b && val(b) !== '0' && val(b) !== 'false') || pStyleBold; });
  }

  function parseDocument(xml, styles) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw err('not-docx');
    const body = first(doc, 'body');
    if (!body) throw err('not-docx');
    const blocks = [];
    let title = '';
    const para = p => {
      const text = runText(p, []).join('').replace(/[  ]+/g, ' ').replace(/\t+/g, ' ').trim();
      if (!text) { if (p.getElementsByTagNameNS(W, 'drawing').length || p.getElementsByTagNameNS(W, 'pict').length) blocks.push({ h: 0, text: '', image: true }); return; }
      const ppr = kids(p, 'pPr')[0];
      let level = styleLevel(styles, val(ppr && kids(ppr, 'pStyle')[0]));
      const ol = ppr && kids(ppr, 'outlineLvl')[0];
      if (!level && ol && Number(val(ol)) < 9) level = Number(val(ol)) + 1;
      if (level === 'toc') return;
      if (level === 'title') { if (!title) title = text; return; }
      blocks.push({ h: level || 0, text, bold: !level && allBold(p) });
    };
    for (const n of Array.from(body.childNodes)) {
      if (n.nodeType !== 1) continue;
      if (n.localName === 'p') para(n);
      else if (n.localName === 'tbl') {
        for (const tr of Array.from(n.getElementsByTagNameNS(W, 'tr'))) {
          const all = kids(tr, 'tc').map(tc => runText(tc, []).join(' ').replace(/\s+/g, ' ').trim());
          const cells = all.filter(Boolean);
          if (cells.length) blocks.push({ h: 0, text: cells.join(' | '), table: true, cells: all });
        }
      } else if (n.localName === 'sdt') { // content controls (some templates wrap text in these)
        for (const p of Array.from(n.getElementsByTagNameNS(W, 'p'))) para(p);
      }
    }
    return { title, blocks };
  }

  /* Headings in files that do not use heading styles. */
  const SECTION_WORDS = {
    abstract: ['abstract', 'abstrak', 'ringkasan', 'summary'],
    introduction: ['introduction', 'pengenalan', 'pendahuluan', 'background', 'latar belakang', 'background of the study', 'latar belakang kajian'],
    literature: ['literature review', 'kajian literatur', 'sorotan literatur', 'tinjauan literatur', 'kajian lepas', 'theoretical framework', 'kerangka teori', 'kerangka teoritikal', 'conceptual framework', 'kerangka konseptual', 'hypothesis development', 'pembangunan hipotesis', 'related work', 'literature', 'theoretical background'],
    method: ['methodology', 'method', 'methods', 'research methodology', 'metodologi', 'metodologi kajian', 'kaedah', 'kaedah kajian', 'research design', 'reka bentuk kajian', 'materials and methods', 'research method'],
    results: ['results', 'findings', 'dapatan', 'dapatan kajian', 'keputusan', 'data analysis', 'analisis data', 'results and discussion', 'dapatan dan perbincangan', 'results and findings', 'analysis and results'],
    discussion: ['discussion', 'perbincangan', 'implications', 'implikasi', 'general discussion'],
    conclusion: ['conclusion', 'conclusions', 'kesimpulan', 'rumusan', 'penutup', 'conclusion and recommendations', 'kesimpulan dan cadangan', 'limitations', 'future research', 'limitations and future research', 'cadangan'],
    references: ['references', 'reference', 'bibliography', 'rujukan', 'bibliografi', 'senarai rujukan', 'works cited', 'reference list'],
    skip: ['acknowledgement', 'acknowledgements', 'acknowledgment', 'penghargaan', 'appendix', 'appendices', 'lampiran', 'table of contents', 'contents', 'isi kandungan', 'kandungan', 'list of tables', 'list of figures', 'senarai jadual', 'senarai rajah', 'list of abbreviations', 'senarai singkatan', 'declaration', 'pengakuan', 'funding', 'conflict of interest', 'author contributions']
  };
  const RE_NUM = /^((?:\d+\.)*\d+)\.?\s+(?=\S)/;
  const RE_CHAPTER = /^(bab|chapter)\s+(\d+|[ivxlc]+|satu|dua|tiga|empat|lima|enam|tujuh|one|two|three|four|five|six|seven)\b[\s.:–-]*/i;
  const clean = t => String(t || '').toLowerCase().replace(RE_CHAPTER, '').replace(RE_NUM, '').replace(/^[ivx]+\.\s+/, '').replace(/[.:;,–—\-]+\s*$/, '').replace(/\s+/g, ' ').trim();
  function sectionKey(text) {
    const c = clean(text);
    if (!c || c.split(' ').length > 8) return null;
    for (const [key, words] of Object.entries(SECTION_WORDS)) if (words.includes(c)) return key;
    for (const [key, words] of Object.entries(SECTION_WORDS)) if (words.some(w => w.includes(' ') && c.startsWith(w))) return key;
    return null;
  }
  /* "1.0" and "1" are top level, "2.1" is level 2, "3.1.2" level 3. */
  function depth(n) { const segs = String(n).split('.'); while (segs.length > 1 && segs[segs.length - 1] === '0') segs.pop(); return segs.length; }
  /* Level of an unstyled line that looks like a heading, or 0. */
  function guessLevel(b) {
    const t = b.text;
    if (b.table || t.length > 110 || /[.?!]$/.test(t) && !RE_NUM.test(t)) return 0;
    const words = t.split(/\s+/).length;
    if (words > 12) return 0;
    if (RE_CHAPTER.test(t)) return 1;
    const num = t.match(RE_NUM);
    if (num && words <= 12 && !/[.?!]$/.test(t)) return depth(num[1]);
    if (sectionKey(t)) return 1;
    const letters = t.replace(/[^A-Za-zÀ-ɏ]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase() && words <= 8) return 1;
    if (b.bold && words <= 12) return 2;
    return 0;
  }
  function withLevels(parsed) {
    const blocks = parsed.blocks.filter(b => !b.image);
    const styled = blocks.some(b => b.h);
    return blocks.map(b => ({ ...b, h: b.h || (styled ? (b.bold && b.text.split(/\s+/).length <= 12 && !/[.?!]$/.test(b.text) ? (sectionKey(b.text) ? 1 : 3) : 0) : guessLevel(b)) }));
  }

  /* ---------- references ---------- */
  function parseRef(text) {
    const apa = text.replace(/^\[?\d+[\].)]\s*/, '').trim();
    const ym = apa.match(/\((\d{4})[a-z]?[,)]/) || apa.match(/\b(19\d{2}|20\d{2})\b/);
    const year = ym ? ym[1] : '';
    const head = ym ? apa.slice(0, apa.indexOf(ym[0])) : apa.split('.')[0];
    const authors = head.split(/,|&|\band\b|\bdan\b/).map(s => s.trim()).filter(s => s.length > 1 && !/^([A-Z]\.\s?)+$/.test(s) && !/^[A-Z]\.?(-[A-Z]\.)?$/.test(s)).slice(0, 25);
    const after = ym ? apa.slice(apa.indexOf(ym[0]) + ym[0].length).replace(/^[).\s]+/, '') : '';
    const title = after.split(/\.\s/)[0].slice(0, 400);
    const doi = (apa.match(/10\.\d{4,9}\/[^\s"<>]+/) || [''])[0].replace(/[.,;]+$/, '');
    return { apa: apa.slice(0, 1500), year, authors, title, doi, url: doi ? 'https://doi.org/' + doi : '', source: 'import' };
  }

  /* ---------- mapping ---------- */
  const words = s => (String(s || '').match(/\S+/g) || []).length;

  function toPaper(parsed) {
    const blocks = withLevels(parsed);
    const buckets = { abstract: [], introduction: [], literature: [], method: [], results: [], discussion: [], conclusion: [] };
    const refs = [], front = [];
    let cur = null, keywords = '', recognised = 0, title = parsed.title;
    // Main sections are the highest heading level that names a section (H1 in most files, H2 in some),
    // so a sub-heading such as "3.2 Data analysis" inside Methodology does not start a new section.
    const top = Math.min(...blocks.filter(b => b.h && sectionKey(b.text)).map(b => b.h), 9);
    for (const b of blocks) {
      const text = b.text.trim();
      const kw = text.match(/^(keywords?|kata\s*kunci|kata-kata kunci)\s*[:：\-–]\s*(.+)$/i);
      if (kw) { keywords = kw[2].replace(/\.$/, '').trim(); continue; }
      const inlineAbs = text.match(/^(abstract|abstrak)\s*[:：\-–]\s*(.{40,})$/i);
      if (inlineAbs) { buckets.abstract.push(inlineAbs[2]); recognised++; cur = 'abstract'; continue; }
      if (b.h) {
        const key = sectionKey(text);
        if (key && (b.h <= top || !cur)) { cur = key; recognised++; continue; }
        if (cur && buckets[cur]) buckets[cur].push(text); // sub-heading stays as a line
        else if (!cur) front.push({ text, heading: true });
        continue;
      }
      if (cur === 'references') { if (text.length > 15) refs.push(parseRef(text)); continue; }
      if (cur === 'skip') continue;
      if (!cur) { front.push({ text }); continue; }
      buckets[cur].push(text);
    }
    // Front matter: the first short line is the title; short lines (authors, emails) are left out;
    // long paragraphs are kept at the start of the introduction (or as the abstract if there is none).
    let skipped = 0;
    const longFront = [];
    for (const f of front) {
      if (!title && words(f.text) <= 30) { title = f.text; continue; }
      if (words(f.text) < 25) { skipped++; continue; }
      longFront.push(f.text);
    }
    if (longFront.length) {
      if (!recognised) buckets.introduction.unshift(...longFront);
      else if (!buckets.abstract.length) buckets.abstract.push(longFront.shift()), buckets.introduction.unshift(...longFront);
      else buckets.introduction.unshift(...longFront);
    }
    const sections = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.join('\n\n')]));
    return { title: String(title || '').slice(0, 400), keywords: keywords.slice(0, 400), sections, references: refs, recognised, skipped };
  }

  function toThesis(parsed) {
    const blocks = withLevels(parsed);
    const chapters = [];
    const refs = [];
    let ch = null, sec = null, mode = 'body', skipped = 0;
    const uid = p => p + Math.random().toString(36).slice(2, 9);
    const newChapter = t => { ch = { id: uid('ch'), title: t.slice(0, 200), sections: [] }; chapters.push(ch); sec = null; };
    const newSection = t => { if (!ch) newChapter(t); sec = { id: uid('s'), title: t.slice(0, 200), content: '', history: [] }; ch.sections.push(sec); };
    for (const b of blocks) {
      const text = b.text.trim();
      if (b.h === 1 || (b.h && RE_CHAPTER.test(text))) {
        const key = sectionKey(text);
        if (key === 'references') { mode = 'refs'; continue; }
        if (key === 'skip') { mode = 'skip'; continue; }
        mode = 'body'; newChapter(text); continue;
      }
      if (mode === 'refs') { if (!b.h && text.length > 15) refs.push(parseRef(text)); continue; }
      if (mode === 'skip') { skipped++; continue; }
      if (b.h === 2 || (b.h && ch && !sec)) { newSection(text); continue; }
      if (b.h) { if (!sec) newSection(text); else sec.content += (sec.content ? '\n\n' : '') + text; continue; }
      if (!ch) { if (words(text) < 25) { skipped++; continue; } newChapter(parsed.title || 'Pendahuluan'); }
      if (!sec) newSection(ch.title);
      sec.content += (sec.content ? '\n\n' : '') + text;
    }
    for (const c of chapters) if (!c.sections.length) c.sections.push({ id: uid('s'), title: c.title, content: '', history: [] });
    return { title: parsed.title, chapters, references: refs, skipped };
  }

  async function read(file) {
    if (!file) throw err('empty');
    if (/\.doc$/i.test(file.name || '')) throw err('old-doc');
    if (file.size > MAX_BYTES) throw err('too-large');
    const buf = await file.arrayBuffer();
    const parts = await unzip(buf, ['word/document.xml', 'word/styles.xml']);
    if (!parts['word/document.xml']) throw err('not-docx');
    const parsed = parseDocument(parts['word/document.xml'], readStyles(parts['word/styles.xml']));
    if (!parsed.blocks.some(b => !b.image)) throw err('empty');
    return parsed;
  }

  root.TalkademicDocx = { read, toPaper, toThesis, sectionKey, parseRef, _guessLevel: guessLevel };
})(typeof self !== 'undefined' ? self : this);
