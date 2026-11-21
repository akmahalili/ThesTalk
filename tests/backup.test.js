'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../public/backup');

const workspace = () => ({
  version: 1,
  project: { title: 'Imej Produk dalam E-Dagang Malaysia', language: 'Bahasa Melayu', citation: 'APA 7' },
  chapters: [
    { id: 'ch1', title: 'Chapter 1: Introduction', sections: [{ id: 'ch1s1', title: '1.1 Background', content: 'Gambar produk penting kepada pembeli.', history: [] }] },
    { id: 'ch2', title: 'Chapter 2: Literature', sections: [{ id: 'ch2s1', title: '2.1 Theory', content: 'Teori komunikasi.', history: [] }] }
  ],
  messages: [{ id: 'm1', role: 'user', text: 'idea' }],
  casualMessages: [],
  references: [{ n: 1, apa: 'Lee, A. (2020). Title. Journal, 1(2), 3–4.' }],
  activeChapter: 'ch2', activeSection: 'ch2s1'
});

test('backup round-trips the workspace and safe UI settings', () => {
  const ui = { lang: 'ms', theme: 'dark', name: 'Kema', ai: 'gemini', onboarded: true, lastBackup: 'x' };
  const file = B.makeBackup(workspace(), ui, { autoDraft: true }, new Date('2026-11-21T01:50:00Z'));
  assert.equal(file.kind, 'thestalk-backup');
  assert.equal(file.exportedAt, '2026-11-21T01:50:00.000Z');
  const text = JSON.stringify(file);
  const back = B.parseBackup(text);
  assert.deepEqual(back.workspace.chapters, workspace().chapters);
  assert.deepEqual(back.ui, { lang: 'ms', theme: 'dark', name: 'Kema', ai: 'gemini' });
  assert.deepEqual(back.preferences, { autoDraft: true });
  assert.deepEqual(back.summary, { title: 'Imej Produk dalam E-Dagang Malaysia', chapters: 2, words: 7, references: 1, messages: 1 });
});

test('backup never contains the AI access code', () => {
  const text = JSON.stringify(B.makeBackup(workspace(), { lang: 'en', accessCode: 'secret-code-123' }, {}));
  assert.ok(!text.includes('secret-code-123'));
});

test('a raw workspace (copied from storage) is accepted too', () => {
  const back = B.parseBackup(JSON.stringify(workspace()));
  assert.equal(back.summary.chapters, 2);
  assert.equal(back.exportedAt, null);
});

test('missing lists and a stale active section are repaired', () => {
  const ws = workspace();
  delete ws.references; delete ws.casualMessages; ws.activeSection = 'gone';
  ws.chapters[1].sections[0].content = undefined;
  const back = B.parseBackup(JSON.stringify(ws));
  assert.deepEqual(back.workspace.references, []);
  assert.deepEqual(back.workspace.casualMessages, []);
  assert.equal(back.workspace.activeSection, 'ch2s1');
  assert.equal(back.workspace.chapters[1].sections[0].content, '');
});

test('wrong files are refused with a clear code', () => {
  const code = text => { try { B.parseBackup(text); return 'ok'; } catch (e) { return e.code; } };
  assert.equal(code(''), 'empty');
  assert.equal(code('hello'), 'not-json');
  assert.equal(code('{"name":"something else"}'), 'not-thestalk');
  assert.equal(code(JSON.stringify({ ...workspace(), chapters: [] })), 'not-thestalk');
  assert.equal(code(JSON.stringify({ kind: 'thestalk-backup', format: 99, data: { workspace: workspace() } })), 'newer-format');
});

test('file name has the date and a safe version of the title', () => {
  assert.equal(B.backupFilename('Imej Produk: E-Dagang (Malaysia)', new Date(2026, 10, 21)), 'ThesTalk-backup-Imej-Produk-E-Dagang-Malaysia-2026-11-21.json');
  assert.equal(B.backupFilename('', new Date(2026, 0, 5)), 'ThesTalk-backup-2026-01-05.json');
});
