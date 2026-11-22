/* Talkademic "Import Tesis": arranges an imported thesis by topic. Input is a list of blocks
   ({ h: heading level or 0, text, bold?, table?, cells?, image? }) from a Word file, a PDF or pasted
   text; output is the app's thesis: chapters (with their topic: introduction, literature review,
   methodology, findings, discussion, conclusion), sections, the preliminary pages that go to
   "Format Tesis Universiti" (abstract, abstrak, acknowledgement, abbreviations, author's profile)
   and the reference list. Pages the app makes itself (contents, lists, declarations, approval) and
   appendices are left out and counted. Pure functions: also used by the tests in Node. */
(function (root) {
  'use strict';

  /* ---------- words that name things ---------- */
  const NUMWORD = { satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9, sepuluh: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const RE_CHAPTER = /^(?:bab|chapter)\s+(\d{1,2}|[ivx]{1,5}|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh|one|two|three|four|five|six|seven|eight|nine|ten)\b[\s.:–—-]*/i;
  const RE_NUM = /^((?:\d+\.)*\d+)\.?\s+(?=\S)/;
  const RE_TOC_ENTRY = /(?:\.{4,}|…{2,}|(?:\s\.){3,}|\s{3,}|\t)\s*(?:\d{1,3}|[ivxlc]{1,6})\s*$/i;
  const FRONT = {
    abbr: ['list of abbreviations', 'abbreviations', 'list of abbreviations and symbols', 'list of symbols and abbreviations', 'list of acronyms', 'senarai singkatan', 'singkatan', 'senarai singkatan dan simbol', 'senarai simbol dan singkatan', 'senarai akronim'],
    abstract: ['abstract'],
    abstrak: ['abstrak'],
    ack: ['acknowledgement', 'acknowledgements', 'acknowledgment', 'acknowledgments', 'penghargaan', 'appreciation', 'penghargaan dan terima kasih'],
    profile: ["author's profile", 'author profile', 'biodata', 'biodata pengarang', 'biodata of student', 'biodata of the author', 'profil pengarang', 'list of publications', 'senarai penerbitan', 'curriculum vitae', 'vita'],
    refs: ['references', 'reference', 'bibliography', 'rujukan', 'bibliografi', 'senarai rujukan', 'reference list', 'works cited'],
    skip: ['table of contents', 'contents', 'isi kandungan', 'kandungan', 'senarai kandungan', 'list of tables', 'list of figures', 'list of plates', 'list of appendices', 'list of symbols', 'list of charts', 'senarai jadual', 'senarai rajah', 'senarai lampiran', 'senarai plat', 'senarai simbol', 'declaration', "author's declaration", "candidate's declaration", "student's declaration", 'declaration of originality', 'original literary work declaration', 'declaration of thesis', 'perakuan', 'pengakuan', 'perakuan pelajar', 'pengakuan pelajar', 'approval', 'approval page', 'pengesahan', 'confirmation by panel of examiners', 'pengesahan panel pemeriksa', 'certification', 'dedication', 'dedikasi', 'copyright', 'hak cipta', 'permission to use', 'kebenaran mengguna', 'title page', 'halaman tajuk']
  };
  const FRONT_PREFIX = { appendix: ['appendix', 'appendices', 'lampiran'], skip: ['list of ', 'senarai jadual', 'senarai rajah', 'declaration of', 'perakuan '] };
  const TOPICS = ['intro', 'literature', 'method', 'results', 'discussion', 'conclusion'];
  const TOPIC_TITLES = [
    ['results', ['results and discussion', 'findings and discussion', 'dapatan dan perbincangan', 'analysis and discussion', 'keputusan dan perbincangan']],
    ['conclusion', ['conclusion', 'conclusions', 'kesimpulan', 'rumusan', 'penutup', 'summary and conclusion', 'summary, conclusion', 'conclusion and recommendation', 'kesimpulan dan cadangan', 'recommendations', 'cadangan', 'implications']],
    ['discussion', ['discussion', 'perbincangan']],
    ['intro', ['introduction', 'pengenalan', 'pendahuluan', 'background of the study', 'latar belakang kajian', 'research background']],
    ['literature', ['literature review', 'review of literature', 'review of the literature', 'kajian literatur', 'sorotan literatur', 'tinjauan literatur', 'kajian lepas', 'theoretical framework', 'kerangka teori', 'theoretical background', 'related studies', 'related work', 'literature']],
    ['method', ['research methodology', 'methodology', 'metodologi', 'metodologi kajian', 'research method', 'research methods', 'method', 'methods', 'kaedah kajian', 'kaedah penyelidikan', 'reka bentuk kajian', 'research design', 'materials and methods']],
    ['results', ['findings', 'results', 'dapatan', 'dapatan kajian', 'keputusan', 'data analysis', 'analisis data', 'analysis of data', 'data analysis and findings', 'results and findings', 'analysis and results', 'findings and analysis']]
  ];
  const SECTION_HINTS = {
    intro: ['background', 'latar belakang', 'problem statement', 'pernyataan masalah', 'objective', 'objektif', 'research question', 'persoalan kajian', 'soalan kajian', 'significance', 'kepentingan', 'scope', 'skop', 'definition', 'definisi', 'organisation of the thesis', 'organization of the thesis', 'struktur tesis', 'motivation'],
    literature: ['theory', 'teori', 'previous studies', 'kajian lepas', 'past studies', 'literature', 'concept', 'konsep', 'theoretical', 'research gap', 'jurang', 'hypothesis development', 'pembangunan hipotesis', 'review'],
    method: ['design', 'reka bentuk', 'population', 'populasi', 'sampling', 'persampelan', 'sample size', 'saiz sampel', 'instrument', 'instrumen', 'questionnaire', 'soal selidik', 'pilot', 'rintis', 'data collection', 'pengumpulan data', 'procedure', 'prosedur', 'measurement', 'pengukuran', 'validity', 'kesahan', 'ethic', 'etika', 'data analysis technique', 'teknik analisis'],
    results: ['demographic', 'demografi', 'respondent', 'responden', 'descriptive', 'deskriptif', 'measurement model', 'structural model', 'hypothesis testing', 'pengujian hipotesis', 'findings', 'dapatan', 'results', 'keputusan', 'response rate', 'kadar respons', 'normality', 'kenormalan'],
    discussion: ['discussion', 'perbincangan'],
    conclusion: ['summary', 'ringkasan', 'rumusan', 'conclusion', 'kesimpulan', 'recommendation', 'cadangan', 'implication', 'implikasi', 'limitation', 'batasan', 'future research', 'kajian akan datang', 'contribution', 'sumbangan']
  };
  const LABEL = {
    ms: { chapter: 'Bab', intro: 'Pengenalan', literature: 'Kajian Literatur', method: 'Metodologi Kajian', results: 'Dapatan Kajian', discussion: 'Perbincangan', conclusion: 'Kesimpulan dan Cadangan', other: 'Bab', opening: 'Pengenalan', unsorted: 'Belum disusun', image: '[Gambar daripada fail asal: masukkan semula dalam Word]' },
    en: { chapter: 'Chapter', intro: 'Introduction', literature: 'Literature Review', method: 'Research Methodology', results: 'Findings', discussion: 'Discussion', conclusion: 'Conclusion and Recommendations', other: 'Chapter', opening: 'Introduction', unsorted: 'Not yet arranged', image: '[Image from the original file: insert it again in Word]' }
  };

  /* ---------- small helpers ---------- */
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const squash = s => String(s || '').replace(/[   ]/g, ' ').replace(/[ \t]+/g, ' ').trim();
  const clean = t => squash(t).toLowerCase().replace(/[’`]/g, "'").replace(RE_CHAPTER, '').replace(RE_NUM, '').replace(/^[ivx]+\.\s+/, '').replace(/^[a-z]\)\s+/, '').replace(/[.:;,–—\-]+\s*$/, '').replace(/\s+/g, ' ').trim();
  function romanToInt(r) { const v = { i: 1, v: 5, x: 10, l: 50, c: 100 }; let n = 0; const s = r.toLowerCase(); for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; n += a < b ? -a : a; } return n; }
  function chapterNumber(text) {
    const m = squash(text).match(RE_CHAPTER);
    if (!m) return 0;
    const k = m[1].toLowerCase();
    return /^\d+$/.test(k) ? Number(k) : NUMWORD[k] || romanToInt(k);
  }
  function frontKey(text) {
    if (RE_NUM.test(squash(text))) return null; // "5.2 Summary" is a section, not a preliminary page
    const c = clean(text);
    if (!c || words(c) > 9) return null;
    for (const [k, list] of Object.entries(FRONT)) if (list.includes(c)) return k;
    for (const [k, list] of Object.entries(FRONT_PREFIX)) if (list.some(p => c === p.trim() || c.startsWith(p.endsWith(' ') ? p : p + ' '))) return k;
    return null;
  }
  function topicOf(text) {
    const c = clean(text);
    if (!c) return null;
    for (const [topic, list] of TOPIC_TITLES) if (list.some(w => c === w || (w.includes(' ') && c.includes(w)) || c.startsWith(w + ' '))) return topic;
    return null;
  }
  function topicFromSections(titles) {
    const votes = Object.fromEntries(TOPICS.map(t => [t, 0]));
    for (const raw of titles) {
      const c = clean(raw);
      for (const [topic, hints] of Object.entries(SECTION_HINTS)) if (hints.some(h => c.includes(h))) votes[topic]++;
    }
    let best = null, n = 0;
    for (const t of TOPICS) if (votes[t] > n) { best = t; n = votes[t]; }
    return n >= 2 || (n === 1 && titles.length <= 2) ? best : null;
  }
  const ACRONYMS = new Set(['pls', 'sem', 'pls-sem', 'cb-sem', 'spss', 'amos', 'ict', 'ai', 'sme', 'smes', 'tam', 'utaut', 'utaut2', 'tpb', 'tra', 's-o-r', 'sor', 'b2c', 'c2c', 'b2b', 'it', 'kpi', 'roi', 'ux', 'ui', 'ar', 'vr', 'iot', 'covid-19', 'stem', 'tvet', 'sdg', 'sdgs', 'ngo', 'gdp', 'cfa', 'efa', 'anova', 'mba', 'phd', 'uitm', 'ukm', 'upm', 'usm', 'utm', 'um']);
  const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'from', 'dan', 'di', 'ke', 'dari', 'dalam', 'untuk', 'bagi', 'yang', 'terhadap', 'atau', 'pada', 'oleh', 'serta']);
  /* "LITERATURE REVIEW" → "Literature Review"; mixed-case titles are left alone; short tokens such as SEM, PLS stay in capitals. */
  function titleCase(t) {
    const s = squash(t);
    const letters = s.replace(/[^A-Za-zÀ-ɏ]/g, '');
    if (!letters || letters !== letters.toUpperCase()) return s;
    return s.toLowerCase().split(' ').map((w, i, all) => {
      const bare = w.replace(/[^a-zà-ɏ0-9-]/g, '');
      if (ACRONYMS.has(bare)) return w.toUpperCase().replace('UITM', 'UiTM');
      if (i > 0 && SMALL.has(bare) && !/[:–—]$/.test(all[i - 1])) return w;
      if (/\d/.test(w)) return w.toUpperCase();
      if (bare.length >= 2 && bare.length <= 3 && !/[aeiouy]/.test(bare)) return w.toUpperCase();
      return w.split('-').map(part => part.replace(/^([^a-zà-ɏ]*)([a-zà-ɏ])/, (m, a, b) => a + b.toUpperCase())).join('-');
    }).join(' ');
  }
  function detectLang(blocks) {
    const sample = blocks.filter(b => !b.h).slice(0, 400).map(b => b.text).join(' ').toLowerCase();
    const count = re => (sample.match(re) || []).length;
    const ms = count(/\b(yang|dan|untuk|kajian|ini|dalam|adalah|kepada|dengan|tersebut)\b/g);
    const en = count(/\b(the|and|of|to|is|that|this|study|with|which)\b/g);
    return ms > en ? 'ms' : 'en';
  }

  /* A heading-like line in a file without heading styles (PDF, pasted text, plain Word files). */
  function looksLikeHeading(b) {
    if (b.h) return true;
    const t = squash(b.text);
    if (!t || b.table || t.length > 140) return false;
    const n = words(t);
    if (n > 14) return false;
    if (RE_CHAPTER.test(t)) return true;
    if (frontKey(t)) return true;
    const endsSentence = /[.?!,;]$/.test(t);
    if (RE_NUM.test(t) && !endsSentence && n <= 14) return true;
    const letters = t.replace(/[^A-Za-zÀ-ɏ]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase() && n <= 10 && !endsSentence) return true;
    if (b.bold && n <= 12 && !endsSentence) return true;
    if (b.big && n <= 15 && !endsSentence) return true;
    return false;
  }
  /* "1.2" → 2 levels; "1.0" → 1; "3.1.2" → 3. */
  function depth(num) { const segs = String(num).split('.'); while (segs.length > 1 && segs[segs.length - 1] === '0') segs.pop(); return segs.length; }

  /* Lines of a contents page ("1.1 Background ......... 3") and running page numbers. */
  const isTocEntry = t => RE_TOC_ENTRY.test(t) && words(t) <= 25;
  const isPageNumber = t => /^\s*(?:page\s+)?(?:\d{1,3}|[ivxlc]{1,6})\s*$/i.test(t);

  /* ---------- preparing blocks ---------- */
  function prepare(blocks) {
    const out = [];
    for (const b0 of blocks || []) {
      const b = Object.assign({}, b0);
      if (b.image) { out.push(b); continue; }
      if (Array.isArray(b.cells) && b.cells.length) { b.text = b.cells.map(c => squash(c).replace(/\t/g, ' ')).join('\t'); b.table = true; out.push(b); continue; }
      const parts = String(b.text || '').split(/\n+/).map(squash).filter(Boolean);
      if (!parts.length) continue;
      if (parts.length > 1 && (b.h || looksLikeHeading({ text: parts[0] })) && RE_CHAPTER.test(parts[0]) && !squash(parts[0]).replace(RE_CHAPTER, '')) b.text = parts[0] + ': ' + parts.slice(1).join(' ');
      else b.text = parts.join(' ');
      out.push(b);
    }
    return out;
  }

  /* Which blocks start chapters: "CHAPTER n" lines if the file has them, otherwise the top heading level. */
  function chapterStarts(blocks) {
    const heads = blocks.map((b, i) => ({ b, i })).filter(x => looksLikeHeading(x.b) && !frontKey(x.b.text) && !isTocEntry(x.b.text));
    const byWord = heads.filter(x => RE_CHAPTER.test(squash(x.b.text)));
    if (byWord.length) return new Set(byWord.map(x => x.i));
    const styled = heads.filter(x => x.b.h === 1);
    if (styled.length >= 2) return new Set(styled.map(x => x.i));
    const numbered = heads.filter(x => { const m = squash(x.b.text).match(RE_NUM); return m && depth(m[1]) === 1; });
    if (numbered.length >= 2) return new Set(numbered.map(x => x.i));
    const topical = heads.filter(x => topicOf(x.b.text) && words(x.b.text) <= 8);
    if (topical.length >= 2) {
      const top = Math.min(...topical.map(x => x.b.h || 9));
      return new Set(topical.filter(x => (x.b.h || 9) === top).map(x => x.i));
    }
    return new Set();
  }

  /* ---------- the main pass ---------- */
  function organize(input, opt) {
    const o = opt || {};
    const blocks = prepare(input && input.blocks);
    const lang = o.lang || detectLang(blocks);
    const L = LABEL[lang] || LABEL.en;
    const parseRef = o.parseRef || defaultParseRef;
    const starts = chapterStarts(blocks);
    const styled = blocks.some(b => b.h >= 2);
    const chapters = [], refs = [], pieces = [];
    const front = { abstract: [], abstrak: [], ack: [], abbr: [], profile: [], keywords: '', kataKunci: '' };
    const skipped = { contents: 0, frontPages: 0, appendix: 0, titlePage: 0 };
    let mode = 'start', ch = null, sec = null, refBuf = '', images = 0;
    let titleGuess = squash(input && input.title);
    const uid = () => Math.random().toString(36).slice(2, 9);
    const newChapter = (raw, num, loose) => { ch = { id: 'ch' + uid(), raw, num, sections: [], loose: !!loose }; chapters.push(ch); sec = null; };
    const newSection = title => { sec = { id: 's' + uid(), title: squash(title).slice(0, 200), parts: [] }; ch.sections.push(sec); };
    // Every piece of the body, in order, for the AI's grouping; table rows stay together.
    const keep = (text, table) => {
      const last = pieces[pieces.length - 1];
      if (table && last && last.table && last.open) last.text += '\n' + text; else pieces.push({ text, table: !!table, open: !!table });
      if (!table && last) last.open = false;
    };
    const add = (part) => { if (!sec) newSection(L.opening); sec.parts.push(part); keep(part.text, part.table); };
    const flushRef = () => { const r = squash(refBuf); refBuf = ''; if (r.length > 15) refs.push(parseRef(r)); };
    const titleWords = /universit|faculty|fakulti|college|kolej|institute|institut|thesis|tesis|dissertation|disertasi|submitted|dikemukakan|fulfilment|memenuhi/i;
    const loneChapter = t => RE_CHAPTER.test(t) && !squash(t.replace(RE_CHAPTER, ''));

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i], text = b.table ? String(b.text).split('\t').map(squash).join('\t') : squash(b.text);
      if (b.image) { if ((mode === 'body' || mode === 'loose') && ch) { add({ text: L.image }); images++; } continue; }
      if (!text) continue;
      if (isPageNumber(text) && !b.table) continue;
      const heading = !b.table && looksLikeHeading(b);
      if (heading && isTocEntry(text)) { skipped.contents++; continue; }
      if (mode === 'contents' && !b.table && (isTocEntry(text) || (/\s(\d{1,3}|[ivxlc]{1,6})$/i.test(text) && !loneChapter(text)))) { skipped.contents++; continue; }

      if (heading) {
        const key = frontKey(text);
        if (key) {
          if (mode === 'refs') flushRef();
          mode = key === 'skip' ? (/content|kandungan|list of|senarai/.test(clean(text)) ? 'contents' : 'skip') : key === 'appendix' ? 'appendix' : key === 'refs' ? 'refs' : 'front:' + key;
          continue;
        }
        if (starts.has(i)) {
          if (mode === 'refs') flushRef();
          // "CHAPTER 1" alone, with the title on the next heading line.
          let title = text;
          if (loneChapter(title)) {
            const nx = blocks[i + 1];
            if (nx && !nx.table && !nx.image && looksLikeHeading(nx) && !RE_NUM.test(squash(nx.text)) && !starts.has(i + 1) && !frontKey(nx.text)) { title = title + ': ' + squash(nx.text); i++; }
          }
          newChapter(title, chapterNumber(title), false);
          mode = 'body';
          continue;
        }
        if (mode === 'start' && !starts.size) {
          // No chapters in the file: numbered or topic headings start the loose part.
          if (RE_NUM.test(text) || topicOf(text)) mode = 'loose';
          else { if (!titleGuess && words(text) >= 4 && !titleWords.test(text)) titleGuess = text; skipped.titlePage++; continue; }
        }
        if ((mode === 'body' || mode === 'loose') ) {
          if (!ch) newChapter('', 0, true);
          const num = text.match(RE_NUM);
          let isSection;
          if (num) {
            const segs = num[1].split('.');
            // "1. Product images" in Chapter 2 is a list item, not a heading.
            if (segs.length === 1 && !b.h && ch.num && Number(segs[0]) !== ch.num) { add({ text }); continue; }
            isSection = depth(num[1]) <= 2;
          } else isSection = b.h ? b.h <= 2 : (!styled && /^[A-ZÀ-Ý]/.test(text));
          if (isSection) newSection(text); else add({ text, sub: true });
          continue;
        }
        if (mode === 'start') { if (!titleGuess && words(text) >= 4 && !titleWords.test(text)) titleGuess = text; skipped.titlePage++; }
        continue;
      }

      // Paragraphs.
      if (mode === 'refs') {
        // A new reference starts with an author surname (or a number); PDF lines of one entry are joined.
        const startsNew = /^(\[?\d+[\].)]\s+|[A-ZÀ-Ý][A-Za-zÀ-ÿ'’\-]+,\s*(?:[A-Z]\.|[A-Z][a-z]+)|[A-ZÀ-Ý][A-Za-zÀ-ÿ&.,'’\- ]{2,80}\(\d{4})/.test(text);
        if (b.line && refBuf && !startsNew) refBuf += (/[A-Za-z]-$/.test(refBuf) ? '' : ' ') + text;
        else { flushRef(); refBuf = text; }
        continue;
      }
      if (mode.startsWith('front:')) {
        const key = mode.slice(6);
        const kw = text.match(/^(keywords?|kata\s*kunci|kata-kata kunci)\s*[:：\-–]\s*(.+)$/i);
        if (kw) { if (/kata/i.test(kw[1])) front.kataKunci = kw[2].replace(/\.$/, '').trim(); else front.keywords = kw[2].replace(/\.$/, '').trim(); continue; }
        if (key === 'abbr') { const row = abbrRow(b, text); if (row) front.abbr.push(row); continue; }
        // Title, name, date and signature lines on these pages (and UPM's abstract header) are not the text.
        if ((key === 'abstract' || key === 'abstrak') && (words(text) < 12 || /^(abstract of (the )?thesis|abstrak tesis|chairman|pengerusi|faculty|fakulti)\b/i.test(text))) continue;
        if (key === 'ack' && words(text) < 6) continue;
        front[key].push(text);
        continue;
      }
      if (mode === 'contents' || mode === 'skip') { skipped[mode === 'contents' ? 'contents' : 'frontPages']++; continue; }
      if (mode === 'appendix') { skipped.appendix++; continue; }
      if (mode === 'start') {
        // Long paragraphs before any heading, in a file with no chapters, are the thesis itself.
        if (!starts.size && (words(text) >= 25 || (words(text) >= 10 && /[.?!]$/.test(text)))) mode = 'loose';
        else { if (!titleGuess && words(text) >= 4 && words(text) <= 40 && !titleWords.test(text)) titleGuess = text; skipped.titlePage++; continue; }
      }
      if (mode === 'loose' || mode === 'body') {
        if (!ch) newChapter('', 0, true);
        add({ text, table: !!b.table });
      }
    }
    flushRef();
    const paragraphs = pieces.map(p => p.text);

    /* Chapter titles and topics. */
    let seq = 0;
    const out = chapters.map(c => {
      seq = c.num || seq + 1;
      const rawTitle = squash(c.raw.replace(RE_CHAPTER, '').replace(/^[:.\-–—\s]+/, '').replace(RE_NUM, ''));
      const topic = topicOf(rawTitle) || topicFromSections(c.sections.map(s => s.title));
      const name = rawTitle ? titleCase(rawTitle) : topic ? L[topic] : c.loose ? L.unsorted : L.other + ' ' + seq;
      const sections = c.sections.length ? c.sections : [{ id: 's' + uid(), title: c.loose ? L.unsorted : name, parts: [] }];
      return {
        id: c.id, topic: topic || 'other', loose: !!c.loose,
        title: `${L.chapter} ${seq}: ${name}`,
        sections: sections.map(s => ({ id: s.id, title: titleCase(s.title), content: joinParts(s.parts), history: [] }))
      };
    });
    const sectionsN = out.reduce((a, c) => a + c.sections.length, 0);
    const wordsN = out.reduce((a, c) => a + c.sections.reduce((b, s) => b + words(s.content), 0), 0);
    return {
      lang, title: titleGuess ? titleCase(titleGuess).slice(0, 300) : '',
      chapters: out,
      front: {
        abstract: front.abstract.join('\n\n'), abstrak: front.abstrak.join('\n\n'), ack: front.ack.join('\n\n'),
        abbreviations: front.abbr.join('\n'), profile: front.profile.join('\n\n'), keywords: front.keywords, kataKunci: front.kataKunci
      },
      references: dedupeRefs(refs),
      skipped, paragraphs,
      stats: { chapters: out.length, sections: sectionsN, words: wordsN, refs: refs.length, images, tables: pieces.filter(p => p.table).length },
      needsAI: !out.length || (out.length === 1 && out[0].loose) || (out.length <= 1 && wordsN > 3000)
    };
  }

  function joinParts(parts) {
    let s = '';
    parts.forEach((p, i) => { s += (i ? (p.table && parts[i - 1].table ? '\n' : '\n\n') : '') + p.text; });
    return s;
  }
  function abbrRow(b, text) {
    if (b.table || /\t/.test(text)) { const c = text.split('\t').map(squash).filter(Boolean); return c.length >= 2 ? c[0] + ' = ' + c.slice(1).join(' ') : null; }
    const m = text.match(/^([A-Za-z0-9&\-./()α-ωΑ-Ω²³]{1,20})\s*(?:=|:|–|—|-|\s{2,})\s*(.{3,200})$/) || text.match(/^([A-Z][A-Za-z0-9&\-./]{1,14})\s+([A-Z].{3,200})$/);
    return m ? squash(m[1]) + ' = ' + squash(m[2]) : null;
  }
  function dedupeRefs(list) {
    const seen = new Set();
    return list.filter(r => { const k = String(r.apa || '').toLowerCase().replace(/\s+/g, ' '); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }
  function defaultParseRef(text) {
    const apa = text.replace(/^\[?\d+[\].)]\s*/, '').trim();
    const ym = apa.match(/\((\d{4})[a-z]?[,)]/) || apa.match(/\b(19\d{2}|20\d{2})\b/);
    const doi = (apa.match(/10\.\d{4,9}\/[^\s"<>]+/) || [''])[0].replace(/[.,;]+$/, '');
    return { apa: apa.slice(0, 1500), year: ym ? ym[1] : '', authors: [], title: '', doi, url: doi ? 'https://doi.org/' + doi : '' };
  }

  /* ---------- PDF and pasted text to blocks ---------- */
  /* pages: [[{ text, size, y, x }]] — lines in reading order with font size, baseline and left edge (from pdf.js).
     A paragraph ends at extra space, a short last line, an indented first line, a list item or a table row
     (cells are separated by tabs). Running headers, footers and page numbers are dropped. */
  function pdfBlocks(pages) {
    const norm = t => squash(t).toLowerCase().replace(/\d+/g, '#');
    const seenOn = new Map();
    pages.forEach((lines, p) => {
      const edge = lines.filter((l, i) => i < 2 || i >= lines.length - 2);
      for (const l of edge) { const k = norm(l.text); if (k.length > 3) seenOn.set(k, (seenOn.get(k) || new Set()).add(p)); }
    });
    const running = new Set([...seenOn].filter(([, s]) => s.size >= 3 && s.size >= pages.length * 0.3).map(([k]) => k));
    const sizes = {}, lefts = {}, gaps = [];
    for (const lines of pages) {
      lines.forEach((l, i) => {
        const s = Math.round((l.size || 0) * 2) / 2; sizes[s] = (sizes[s] || 0) + String(l.text).length;
        if (l.x != null) { const x = Math.round(l.x / 3) * 3; lefts[x] = (lefts[x] || 0) + 1; }
        if (i && l.y != null && lines[i - 1].y != null) { const dy = Math.abs(lines[i - 1].y - l.y); if (dy > 0) gaps.push(dy); }
      });
    }
    const top = obj => Number(Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
    const body = top(sizes) || 11, left = top(lefts);
    gaps.sort((a, b) => a - b);
    const lineGap = gaps.length ? gaps[Math.floor(gaps.length * 0.3)] : 0;
    const lens = pages.flat().map(l => squash(l.text).length).filter(n => n > 20).sort((a, b) => a - b);
    const full = lens.length ? lens[Math.floor(lens.length * 0.85)] : 80;
    const out = [];
    let cur = null;
    const flush = () => { if (cur) { delete cur.lastLen; out.push(cur); } cur = null; };
    pages.forEach(lines => {
      let lastY = null;
      lines.forEach((l, i) => {
        const raw = String(l.text || '');
        const text = squash(raw);
        if (!text) return;
        const edge = i < 2 || i >= lines.length - 2;
        if (edge && (isPageNumber(text) || running.has(norm(text)))) return;
        const big = (l.size || body) >= body * 1.12;
        const dy = lastY == null || l.y == null ? 0 : Math.abs(lastY - l.y);
        lastY = l.y;
        if (raw.includes('\t')) { flush(); const cells = raw.split('\t').map(squash); out.push({ h: 0, text: cells.join('\t'), cells, line: true }); return; }
        const cand = { text, big, line: true };
        const continuing = cur && !/[.?!:;"”)]$/.test(cur.text) && cur.lastLen >= full * 0.75;
        if (looksLikeHeading(cand) && !(continuing && !big && !RE_CHAPTER.test(text) && !frontKey(text))) {
          flush();
          const num = text.match(RE_NUM);
          out.push({ h: RE_CHAPTER.test(text) ? 1 : num ? Math.min(3, depth(num[1])) : big ? 1 : 2, text, line: true });
          return;
        }
        const indented = l.x != null && left && l.x - left > (l.size || body) * 0.9;
        const listItem = /^(\(?[a-z0-9]{1,3}[.)]|[•▪●◦\-–])\s+/i.test(text);
        const refStart = /^[A-ZÀ-Ý][A-Za-zÀ-ÿ'’\-]+,\s*(?:[A-Z]\.\s*)+/.test(text) && /\((?:19|20)\d{2}[a-z]?\)/.test(text);
        const hyphen = cur && /[A-Za-zÀ-ÿ]-$/.test(cur.text);
        const newPara = !cur || (lineGap && dy > lineGap * 1.45) || (!hyphen && cur.lastLen < full * 0.75) || listItem || (refStart && !indented) ||
          (indented && /[.?!:"”)]$/.test(cur.text));
        if (newPara) { flush(); cur = { h: 0, text, line: true, lastLen: text.length }; }
        else { cur.text = /[A-Za-zÀ-ÿ]-$/.test(cur.text) && /^[a-zà-ÿ]/.test(text) ? cur.text.slice(0, -1) + text : cur.text + ' ' + text; cur.lastLen = text.length; }
      });
    });
    flush();
    return out;
  }
  /* Pasted or .txt/.md text: blank lines separate paragraphs; "#"-headings and heading-like lines stand alone;
     tab-separated lines are table rows. */
  function textBlocks(text) {
    const out = [];
    for (const chunk of String(text || '').replace(/\r/g, '').split(/\n\s*\n/)) {
      const lines = chunk.split('\n').map(x => x.replace(/\s+$/, '')).filter(x => x.trim());
      let para = [];
      const flush = () => { if (para.length) out.push({ h: 0, text: para.join(' ') }); para = []; };
      for (const raw of lines) {
        const md = raw.match(/^(#{1,6})\s+(.+)$/);
        if (md) { flush(); out.push({ h: Math.min(3, md[1].length), text: md[2].trim() }); continue; }
        if (raw.includes('\t')) { flush(); out.push({ h: 0, text: raw, cells: raw.split('\t') }); continue; }
        const line = raw.trim();
        if (looksLikeHeading({ text: line }) && (lines.length === 1 || !para.length || /[.?!:]$/.test(para[para.length - 1]))) { flush(); out.push({ h: 0, text: line, line: true }); continue; }
        para.push(line);
      }
      flush();
    }
    return out;
  }

  /* ---------- the AI's grouping, applied to the full paragraphs ---------- */
  /* plan: { chapters: [{ title, sections: [{ title, paragraphs: [indices] }] }] } from /api/organize. Every paragraph
     ends up somewhere: any the AI did not place go into a last "not yet arranged" section, in their order. */
  function applyPlan(plan, paragraphs, lang) {
    const L = LABEL[lang] || LABEL.en;
    const used = new Set();
    const chapters = [];
    (plan && Array.isArray(plan.chapters) ? plan.chapters : []).forEach((c, ci) => {
      const sections = [];
      (Array.isArray(c.sections) ? c.sections : []).forEach(s => {
        const idx = (Array.isArray(s.paragraphs) ? s.paragraphs : []).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < paragraphs.length && !used.has(n)).sort((a, b) => a - b);
        idx.forEach(n => used.add(n));
        if (idx.length) sections.push({ id: 's' + Math.random().toString(36).slice(2, 9), title: squash(s.title).slice(0, 200) || L.opening, content: idx.map(n => paragraphs[n]).join('\n\n'), history: [] });
      });
      if (!sections.length) return;
      const n = chapters.length + 1;
      const name = squash(String(c.title || '').replace(RE_CHAPTER, '').replace(/^[:.\-–—\s]+/, '')) || L.other + ' ' + n;
      chapters.push({ id: 'ch' + Math.random().toString(36).slice(2, 9), topic: topicOf(name) || topicFromSections(sections.map(s => s.title)) || 'other', title: `${L.chapter} ${n}: ${titleCase(name)}`, sections });
    });
    const rest = paragraphs.map((p, i) => i).filter(i => !used.has(i));
    if (rest.length) {
      const sec = { id: 's' + Math.random().toString(36).slice(2, 9), title: L.unsorted, content: rest.map(n => paragraphs[n]).join('\n\n'), history: [] };
      if (chapters.length) chapters[chapters.length - 1].sections.push(sec);
      else chapters.push({ id: 'ch' + Math.random().toString(36).slice(2, 9), topic: 'other', title: `${L.chapter} 1: ${L.unsorted}`, sections: [sec] });
    }
    return { chapters, unplaced: rest.length };
  }

  const api = { organize, pdfBlocks, textBlocks, applyPlan, topicOf, topicFromSections, frontKey, chapterNumber, titleCase, LABEL, TOPICS, _looksLikeHeading: looksLikeHeading };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TalkademicThesisOrganize = api;
})(typeof self !== 'undefined' ? self : this);
