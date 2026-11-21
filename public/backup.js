/* Talkademic backup files: build one from the workspace and read one back safely.
   Works in the browser (window.ThesTalkBackup) and in Node tests (module.exports). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ThesTalkBackup = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KIND = 'thestalk-backup';
  const FORMAT = 1;
  const MAX_BYTES = 15 * 1024 * 1024;
  /* UI settings worth carrying to another device. The AI access code is never included. */
  const UI_FIELDS = ['lang', 'theme', 'name', 'mode', 'academicOpen', 'autoSpeak', 'voiceAutoSend', 'ai'];

  function backupError(code) { return Object.assign(new Error(code), { code }); }
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const words = text => (String(text || '').trim().match(/\S+/g) || []).length;

  function pickUI(ui) {
    const out = {};
    if (isObj(ui)) UI_FIELDS.forEach(k => { if (ui[k] !== undefined) out[k] = ui[k]; });
    return out;
  }

  function summary(ws) {
    let w = 0;
    ws.chapters.forEach(ch => (ch.sections || []).forEach(s => { w += words(s.content); }));
    return {
      title: String((ws.project && ws.project.title) || ''),
      chapters: ws.chapters.length,
      words: w,
      references: (ws.references || []).length,
      messages: (ws.messages || []).length + (ws.casualMessages || []).length
    };
  }

  function makeBackup(workspace, ui, preferences, now) {
    return {
      app: 'Talkademic',
      kind: KIND,
      format: FORMAT,
      exportedAt: (now || new Date()).toISOString(),
      data: { workspace, ui: pickUI(ui), preferences: isObj(preferences) ? preferences : {} }
    };
  }

  /* Same shape the app itself accepts when it loads from storage. */
  function validWorkspace(ws) {
    if (!isObj(ws) || ws.version !== 1 || !isObj(ws.project)) return false;
    if (!Array.isArray(ws.chapters) || !ws.chapters.length) return false;
    return ws.chapters.every(ch => isObj(ch) && typeof ch.id === 'string' && typeof ch.title === 'string' && Array.isArray(ch.sections) && ch.sections.length &&
      ch.sections.every(s => isObj(s) && typeof s.id === 'string' && typeof s.title === 'string'));
  }

  function normalise(ws) {
    const out = Object.assign({}, ws);
    ['messages', 'casualMessages', 'references'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
    out.chapters = ws.chapters.map(ch => Object.assign({}, ch, {
      sections: ch.sections.map(s => Object.assign({}, s, { content: typeof s.content === 'string' ? s.content : '', history: Array.isArray(s.history) ? s.history : [] }))
    }));
    const ch = out.chapters.find(c => c.id === out.activeChapter) || out.chapters[0];
    out.activeChapter = ch.id;
    if (!ch.sections.some(s => s.id === out.activeSection)) out.activeSection = ch.sections[0].id;
    return out;
  }

  /* Accepts a Talkademic backup file, or a raw workspace copied from storage. */
  function parseBackup(text) {
    if (typeof text !== 'string' || !text.trim()) throw backupError('empty');
    if (text.length > MAX_BYTES) throw backupError('too-large');
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw backupError('not-json'); }
    let ws, ui = {}, preferences = {}, exportedAt = null;
    if (isObj(obj) && obj.kind === KIND) {
      if (typeof obj.format !== 'number' || obj.format > FORMAT) throw backupError('newer-format');
      ws = obj.data && obj.data.workspace;
      ui = pickUI(obj.data && obj.data.ui);
      preferences = isObj(obj.data && obj.data.preferences) ? obj.data.preferences : {};
      exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : null;
    } else {
      ws = obj;
    }
    if (!validWorkspace(ws)) throw backupError('not-thestalk');
    const workspace = normalise(ws);
    return { workspace, ui, preferences, exportedAt, summary: summary(workspace) };
  }

  function backupFilename(title, now) {
    const d = now || new Date();
    const date = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    const slug = String(title || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'Talkademic-backup-' + (slug ? slug + '-' : '') + date + '.json';
  }

  return { KIND, FORMAT, makeBackup, parseBackup, backupFilename, summary, validWorkspace };
});
