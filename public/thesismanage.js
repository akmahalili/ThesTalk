/* Talkademic: rename, delete, move and merge chapters and sections of the thesis.
   Quick buttons for the open chapter and section, and "Urus bab & seksyen", a list of every chapter
   and section where titles can be edited, items moved up or down or into another chapter, chapters
   merged into the one above and anything deleted. Changes in the list apply only on Save. Every
   change can be undone from the bar that appears afterwards. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const S = {
    ms: {
      renameCh: '✎ Namakan bab', deleteCh: '🗑 Padam bab', manage: '⚙ Urus bab & seksyen', renameSec: 'Namakan semula seksyen', deleteSec: 'Padam seksyen',
      askCh: 'Nama bab:', askSec: 'Nama seksyen:',
      confirmCh: 'Padam "{t}"? ({s} seksyen, {w} perkataan)', confirmSec: 'Padam seksyen "{t}"? ({w} perkataan)', lastSec: 'Ini seksyen terakhir dalam bab ini, jadi seluruh bab "{t}" akan dipadam. Teruskan?',
      onlyOne: 'Tesis perlu sekurang-kurangnya satu bab dan satu seksyen. Kosongkan teks seksyen ini sahaja?',
      nothing: 'Tiada apa lagi untuk dipadam: tesis sudah kosong. Bab kosong ini kekal sebagai tempat menulis dan akan diganti bila anda import tesis, guna templat atau tambah bab.', templated: 'Templat 5 bab digunakan.',
      deletedCh: 'Bab dipadam.', deletedSec: 'Seksyen dipadam.', renamed: 'Nama ditukar.', cleared: 'Teks seksyen dikosongkan.', undo: 'Batal', undone: 'Dikembalikan.', saved: 'Perubahan disimpan.',
      title: 'Urus bab & seksyen', help: 'Tukar nama, susun, pindah atau padam. Tiada apa berubah sehingga anda tekan Simpan.',
      up: 'Naik', down: 'Turun', del: 'Padam', restore: 'Kembalikan', merge: 'Gabung ke bab atas', moveTo: 'Pindah ke bab…', words: '{n} perkataan', sections: '{n} seksyen',
      gone: 'Akan dipadam', save: 'Simpan perubahan', cancel: 'Batal', addCh: '＋ Bab baharu', newCh: 'Bab baharu', newSec: 'Seksyen baharu', addSec: '＋ Seksyen',
      summary: '{c} bab · {s} seksyen dipadam', empty: 'Semua bab dipadam. Satu bab kosong akan dicipta.'
    },
    en: {
      renameCh: '✎ Rename chapter', deleteCh: '🗑 Delete chapter', manage: '⚙ Manage chapters & sections', renameSec: 'Rename section', deleteSec: 'Delete section',
      askCh: 'Chapter name:', askSec: 'Section name:',
      confirmCh: 'Delete "{t}"? ({s} sections, {w} words)', confirmSec: 'Delete the section "{t}"? ({w} words)', lastSec: 'This is the last section in this chapter, so the whole chapter "{t}" will be deleted. Continue?',
      onlyOne: 'The thesis needs at least one chapter and one section. Clear the text of this section instead?',
      nothing: 'Nothing left to delete: the thesis is already empty. This empty chapter stays as a place to write and is replaced when you import a thesis, use the template or add a chapter.', templated: 'The 5-chapter template is in place.',
      deletedCh: 'Chapter deleted.', deletedSec: 'Section deleted.', renamed: 'Renamed.', cleared: 'Section text cleared.', undo: 'Undo', undone: 'Restored.', saved: 'Changes saved.',
      title: 'Manage chapters & sections', help: 'Rename, reorder, move or delete. Nothing changes until you press Save.',
      up: 'Move up', down: 'Move down', del: 'Delete', restore: 'Restore', merge: 'Merge into the chapter above', moveTo: 'Move to chapter…', words: '{n} words', sections: '{n} sections',
      gone: 'Will be deleted', save: 'Save changes', cancel: 'Cancel', addCh: '＋ New chapter', newCh: 'New chapter', newSec: 'New section', addSec: '＋ Section',
      summary: '{c} chapters · {s} sections deleted', empty: 'All chapters deleted. One empty chapter will be created.'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const chWords = ch => ch.sections.reduce((a, s) => a + words(s.content), 0);
  const clone = o => JSON.parse(JSON.stringify(o));
  const $ = s => document.querySelector(s);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'checked'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }

  /* ---------- applying a change, with an undo bar ---------- */
  let bar = null, barTimer = null;
  function commit(next, message) {
    App.persist();
    const before = clone(App.state());
    if (!App.replaceState(next)) { App.toast(shell().t ? shell().t('imp.err.storage') : 'Storage full'); return false; }
    shell().refresh && shell().refresh();
    showUndo(message, () => { App.replaceState(before); shell().refresh && shell().refresh(); App.toast(t('undone')); });
    return true;
  }
  function showUndo(message, undo) {
    if (bar) bar.remove();
    clearTimeout(barTimer);
    bar = h('div', { class: 'undo-bar', role: 'status' }, h('span', { text: message }),
      h('button', { type: 'button', class: 'btn-reset undo-btn', text: t('undo'), onclick: () => { hideUndo(); undo(); } }));
    document.body.append(bar);
    barTimer = setTimeout(hideUndo, 8000);
  }
  function hideUndo() { clearTimeout(barTimer); if (bar) bar.remove(); bar = null; }

  /* ---------- quick actions on the open chapter and section ---------- */
  function renameChapter() {
    const s = App.state(), ch = App.chapter();
    const name = prompt(t('askCh'), ch.title);
    if (!name || !name.trim() || name.trim() === ch.title) return;
    const next = clone(s);
    next.chapters.find(c => c.id === ch.id).title = name.trim().slice(0, 200);
    commit(next, t('renamed'));
  }
  function deleteChapter() {
    const s = App.state(), ch = App.chapter();
    if (s.chapters.length < 2) return clearInstead();
    if (!confirm(t('confirmCh', { t: ch.title, s: ch.sections.length, w: chWords(ch) }))) return;
    const next = clone(s);
    const i = next.chapters.findIndex(c => c.id === ch.id);
    next.chapters.splice(i, 1);
    const open = next.chapters[Math.min(i, next.chapters.length - 1)];
    next.activeChapter = open.id; next.activeSection = open.sections[0].id;
    commit(next, t('deletedCh'));
  }
  function renameSection() {
    const s = App.state(), sec = App.section();
    const name = prompt(t('askSec'), sec.title);
    if (!name || !name.trim() || name.trim() === sec.title) return;
    const next = clone(s);
    next.chapters.find(c => c.id === s.activeChapter || c.sections.some(x => x.id === sec.id)).sections.find(x => x.id === sec.id).title = name.trim().slice(0, 200);
    commit(next, t('renamed'));
  }
  function deleteSection() {
    const s = App.state(), ch = App.chapter(), sec = App.section();
    if (ch.sections.length < 2) {
      if (s.chapters.length < 2) return clearInstead();
      if (!confirm(t('lastSec', { t: ch.title }))) return;
      const next = clone(s);
      const i = next.chapters.findIndex(c => c.id === ch.id);
      next.chapters.splice(i, 1);
      const open = next.chapters[Math.min(i, next.chapters.length - 1)];
      next.activeChapter = open.id; next.activeSection = open.sections[0].id;
      return commit(next, t('deletedCh'));
    }
    if (!confirm(t('confirmSec', { t: sec.title, w: words(sec.content) }))) return;
    const next = clone(s);
    const c = next.chapters.find(x => x.id === ch.id);
    const i = c.sections.findIndex(x => x.id === sec.id);
    c.sections.splice(i, 1);
    next.activeChapter = c.id; next.activeSection = c.sections[Math.min(i, c.sections.length - 1)].id;
    commit(next, t('deletedSec'));
  }
  function clearInstead() {
    const s = App.state(), sec = App.section();
    if (!words(sec.content)) { App.toast(t('nothing')); return; }
    if (!confirm(t('onlyOne'))) return;
    const next = clone(s);
    next.chapters.forEach(c => c.sections.forEach(x => { if (x.id === sec.id) x.content = ''; }));
    commit(next, t('cleared'));
  }

  /* ---------- "Urus bab & seksyen" ---------- */
  let root = null, draft = null, lastFocus = null, expanded = new Set();
  function open() {
    App.persist();
    close();
    lastFocus = document.activeElement;
    expanded = new Set([App.state().activeChapter]);
    draft = clone(App.state().chapters).map(c => Object.assign(c, { gone: false, sections: c.sections.map(x => Object.assign(x, { gone: false })) }));
    const body = h('div', { class: 'mg-body' });
    root = h('div', { class: 'modal-backdrop mg-backdrop', onclick: e => { if (e.target === root) close(); } },
      h('div', { class: 'modal mg-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mgTitle' },
        h('div', { class: 'modal-top' }, h('div', {}, h('h2', { id: 'mgTitle', text: t('title') }), h('p', { class: 'muted small-note', text: t('help') })), h('button', { type: 'button', class: 'btn-reset imp-x', 'aria-label': t('cancel'), text: '✕', onclick: close })),
        body,
        h('div', { class: 'modal-actions mg-actions' },
          h('button', { type: 'button', class: 'btn btn-outline', text: t('cancel'), onclick: close }),
          h('button', { type: 'button', class: 'btn btn-primary', text: t('save'), onclick: save }))));
    document.addEventListener('keydown', onKey);
    document.body.append(root);
    paint();
    setTimeout(() => { const f = root && root.querySelector('input'); if (f) f.focus(); }, 30);
  }
  function onKey(e) { if (e.key === 'Escape' && root) close(); }
  function close() {
    document.removeEventListener('keydown', onKey);
    if (root) root.remove();
    root = null; draft = null;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* gone */ }
  }
  const icon = (label, text, onclick, disabled, cls) => h('button', { type: 'button', class: 'btn-reset mg-icon' + (cls ? ' ' + cls : ''), 'aria-label': label, title: label, text, disabled, onclick });
  function move(list, i, d) { const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; }

  function paint(focusKey) {
    const body = root.querySelector('.mg-body');
    const live = draft.filter(c => !c.gone);
    body.replaceChildren(...draft.map((c, ci) => {
      const card = h('div', { class: 'mg-ch' + (c.gone ? ' gone' : '') },
        h('div', { class: 'mg-row mg-ch-row' },
          h('input', { type: 'text', class: 'mg-title', value: c.title, 'aria-label': t('askCh'), disabled: c.gone, 'data-key': 'c' + c.id, oninput: e => { c.title = e.target.value; } }),
          c.gone ? h('span', { class: 'mg-w', text: t('gone') }) : h('button', { type: 'button', class: 'btn-reset mg-toggle', 'aria-expanded': String(expanded.has(c.id)), onclick: () => { expanded.has(c.id) ? expanded.delete(c.id) : expanded.add(c.id); paint('c' + c.id); },
            text: (expanded.has(c.id) ? '▾ ' : '▸ ') + t('sections', { n: c.sections.filter(x => !x.gone).length }) + ' · ' + t('words', { n: chWords({ sections: c.sections.filter(x => !x.gone) }) }) }),
          h('div', { class: 'mg-tools' },
            icon(t('up'), '↑', () => { move(draft, ci, -1); paint('c' + c.id); }, c.gone || ci === 0),
            icon(t('down'), '↓', () => { move(draft, ci, 1); paint('c' + c.id); }, c.gone || ci === draft.length - 1),
            icon(t('merge'), '⤒', () => {
              const above = draft.slice(0, ci).reverse().find(x => !x.gone);
              if (!above) return;
              above.sections.push(...c.sections.filter(x => !x.gone));
              draft.splice(ci, 1); expanded.add(above.id); paint('c' + above.id);
            }, c.gone || !draft.slice(0, ci).some(x => !x.gone)),
            c.gone ? icon(t('restore'), '↺', () => { c.gone = false; paint('c' + c.id); }, false, 'restore') : icon(t('del'), '🗑', () => { c.gone = true; paint(); }, false, 'danger'))),
        c.gone || !expanded.has(c.id) ? null : h('ul', { class: 'mg-secs' }, c.sections.map((x, si) => h('li', { class: 'mg-row mg-sec' + (x.gone ? ' gone' : '') },
          h('input', { type: 'text', class: 'mg-title', value: x.title, 'aria-label': t('askSec'), disabled: x.gone, 'data-key': 's' + x.id, oninput: e => { x.title = e.target.value; } }),
          h('span', { class: 'mg-w', text: x.gone ? t('gone') : t('words', { n: words(x.content) }) }),
          h('div', { class: 'mg-tools' },
            icon(t('up'), '↑', () => { move(c.sections, si, -1); paint('s' + x.id); }, x.gone || si === 0),
            icon(t('down'), '↓', () => { move(c.sections, si, 1); paint('s' + x.id); }, x.gone || si === c.sections.length - 1),
            live.length > 1 && !x.gone ? h('select', { class: 'mg-move', 'aria-label': t('moveTo'), onchange: e => {
              const to = draft.find(d => d.id === e.target.value);
              if (!to) return;
              c.sections.splice(si, 1); to.sections.push(x); expanded.add(to.id); paint('s' + x.id);
            } }, h('option', { value: '', text: t('moveTo') }), live.filter(d => d.id !== c.id).map(d => h('option', { value: d.id, text: d.title.slice(0, 50) }))) : null,
            x.gone ? icon(t('restore'), '↺', () => { x.gone = false; paint('s' + x.id); }, false, 'restore') : icon(t('del'), '🗑', () => { x.gone = true; paint(); }, false, 'danger'))))),
        c.gone || !expanded.has(c.id) ? null : h('button', { type: 'button', class: 'btn-reset text-action mg-add', text: t('addSec'), onclick: () => { const id = App.uid(); c.sections.push({ id, title: t('newSec'), content: '', history: [], gone: false }); paint('s' + id); } }));
      return card;
    }), h('button', { type: 'button', class: 'btn btn-outline mg-addch', text: t('addCh'), onclick: () => { const id = App.uid(); draft.push({ id, title: t('newCh'), sections: [{ id: App.uid(), title: t('newSec'), content: '', history: [], gone: false }], gone: false }); expanded.add(id); paint('c' + id); } }));
    const goneC = draft.filter(c => c.gone).length, goneS = draft.filter(c => !c.gone).reduce((a, c) => a + c.sections.filter(x => x.gone).length, 0);
    if (goneC || goneS) body.append(h('p', { class: 'imp-warn', text: (live.length ? '' : t('empty') + ' ') + t('summary', { c: goneC, s: goneS }) }));
    if (focusKey) { const el = body.querySelector(`[data-key="${focusKey}"]`); if (el) { el.scrollIntoView({ block: 'nearest' }); } }
  }

  function save() {
    const s = App.state();
    let chapters = draft.filter(c => !c.gone).map(c => ({ id: c.id, title: String(c.title || '').trim().slice(0, 200) || t('newCh'), sections: c.sections.filter(x => !x.gone).map(x => ({ id: x.id, title: String(x.title || '').trim().slice(0, 200) || t('newSec'), content: x.content || '', history: x.history || [] })) })).filter(c => c.sections.length);
    if (!chapters.length) chapters = [{ id: App.uid(), title: (lang() === 'en' ? 'Chapter 1: ' : 'Bab 1: ') + t('newCh'), sections: [{ id: App.uid(), title: '1.1 ' + t('newSec'), content: '', history: [] }] }];
    const next = Object.assign(clone(s), { chapters });
    const keepCh = chapters.find(c => c.id === s.activeChapter) || chapters[0];
    next.activeChapter = keepCh.id;
    next.activeSection = (keepCh.sections.find(x => x.id === s.activeSection) || keepCh.sections[0]).id;
    close();
    commit(next, t('saved'));
  }

  /* ---------- an empty thesis: import, or start from the template ---------- */
  function isEmpty() { const s = App.state(); return s.chapters.length === 1 && s.chapters[0].sections.length <= 1 && !chWords(s.chapters[0]); }
  function syncEmpty() { const el = document.getElementById('emptyThesis'); if (el) el.hidden = !isEmpty(); }
  function useTemplate() {
    if (!isEmpty() || !App.template) return;
    const next = clone(App.state());
    next.chapters = App.template();
    next.activeChapter = next.chapters[0].id; next.activeSection = next.chapters[0].sections[0].id;
    commit(next, t('templated'));
  }

  /* ---------- buttons ---------- */
  function wire() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('renameChapter', renameChapter); on('deleteChapter', deleteChapter); on('manageThesis', open); on('manageThesisTop', open);
    on('renameSection', renameSection); on('deleteSection', deleteSection);
    on('emptyTemplate', useTemplate); on('emptyImport', () => window.TalkademicThesisImport && window.TalkademicThesisImport.open());
    // The editor redraws the chapter line on every change: keep the empty-thesis card in step.
    const meta = document.getElementById('documentMeta');
    if (meta && window.MutationObserver) new MutationObserver(syncEmpty).observe(meta, { childList: true, characterData: true, subtree: true });
    syncEmpty();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  window.TalkademicThesisManage = { open, close, renameChapter, deleteChapter, renameSection, deleteSection };
})();
