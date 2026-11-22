/* Talkademic sync between phone and laptop, without an account.
   A sync code (16 characters) is created on one device and typed on the other. The code never
   leaves the device: it derives the storage id (SHA-256) and the encryption key (PBKDF2 →
   AES-GCM). The server only ever sees ciphertext. Data: the same contents as a backup file. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (shell().lang ? shell().lang() : 'ms');
  const KEY = 'thestalk_sync_v1';
  const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const S = {
    ms: {
      title: 'Sync telefon ↔ laptop', body: 'Guna satu kod sync pada semua peranti anda. Data disulitkan dalam peranti sebelum dihantar; pelayan tidak dapat membacanya. Tiada akaun diperlukan.',
      create: 'Cipta kod sync', haveCode: 'Ada kod dari peranti lain?', codePh: 'XXXX-XXXX-XXXX-XXXX', join: 'Sambung', badCode: 'Kod tidak sah. Semak semula 16 aksara itu.',
      yourCode: 'Kod sync anda', show: 'Tunjuk', hide: 'Sembunyi', copy: 'Salin kod', copied: 'Kod disalin.', share: 'Kongsi',
      warn: 'Simpan kod ini seperti kata laluan. Sesiapa yang ada kod boleh membaca data anda, dan kod yang hilang tidak boleh dipulihkan.',
      push: 'Hantar sekarang', pull: 'Ambil terkini', auto: 'Sync automatik', autoHelp: 'Hantar perubahan secara automatik, dan ambil versi terkini bila app dibuka.',
      synced: 'Disync: {d}', never: 'Belum disync lagi.', dirty: 'Ada perubahan di peranti ini yang belum dihantar.', clean: 'Peranti ini sama dengan versi terkini.',
      working: 'Sedang sync…', pushed: 'Dihantar. Peranti lain boleh ambil sekarang.', pulled: 'Dikemas kini daripada {dev}.', nothing: 'Belum ada data untuk kod ini. Cipta kod di peranti utama dahulu.',
      conflict: '{dev} menyimpan versi lebih baharu ({d}) sedangkan peranti ini juga ada perubahan. Pilih satu:', useCloud: 'Guna versi {dev}', useLocal: 'Guna versi peranti ini',
      confirmPull: 'Gantikan data dalam peranti ini dengan versi dari {dev} ({d})? Salinan sekarang disimpan untuk Batalkan pemulihan.', confirmJoin: 'Kod ini ada data dari {dev} ({d}). Ambil data itu ke peranti ini? Data sekarang disimpan untuk Batalkan pemulihan.',
      confirmForce: 'Versi peranti ini akan menggantikan versi di awan. Teruskan?', leave: 'Putuskan sync pada peranti ini', confirmLeave: 'Putuskan sync? Data dalam peranti ini kekal. Anda perlukan kod untuk sambung semula.',
      newer: 'Ada versi lebih baharu dari {dev}. Buka Profil → Sync.', notes: 'Gambar slaid dan kod akses AI tidak disync.', fail: 'Sync gagal: {e}', noCrypto: 'Pelayar ini tidak menyokong penyulitan yang diperlukan. Guna Chrome, Safari atau Edge terkini.',
      device: { android: 'telefon Android', iphone: 'iPhone', ipad: 'iPad', windows: 'laptop Windows', mac: 'Mac', linux: 'Linux', device: 'peranti lain' }
    },
    en: {
      title: 'Sync phone ↔ laptop', body: 'Use one sync code on all your devices. Data is encrypted on the device before it is sent; the server cannot read it. No account needed.',
      create: 'Create a sync code', haveCode: 'Have a code from another device?', codePh: 'XXXX-XXXX-XXXX-XXXX', join: 'Connect', badCode: 'That code is not valid. Check the 16 characters again.',
      yourCode: 'Your sync code', show: 'Show', hide: 'Hide', copy: 'Copy code', copied: 'Code copied.', share: 'Share',
      warn: 'Keep this code like a password. Anyone with it can read your data, and a lost code cannot be recovered.',
      push: 'Send now', pull: 'Get latest', auto: 'Automatic sync', autoHelp: 'Send changes automatically, and get the latest version when the app opens.',
      synced: 'Synced: {d}', never: 'Not synced yet.', dirty: 'This device has changes that have not been sent.', clean: 'This device matches the latest version.',
      working: 'Syncing…', pushed: 'Sent. Your other devices can get it now.', pulled: 'Updated from {dev}.', nothing: 'Nothing has been synced with this code yet. Create the code on your main device first.',
      conflict: '{dev} saved a newer version ({d}) while this device also has changes. Choose one:', useCloud: 'Use the {dev} version', useLocal: 'Use this device\'s version',
      confirmPull: 'Replace the data on this device with the version from {dev} ({d})? The current copy is kept for Undo restore.', confirmJoin: 'This code has data from {dev} ({d}). Bring it to this device? The current data is kept for Undo restore.',
      confirmForce: 'This device\'s version will replace the one in the cloud. Continue?', leave: 'Disconnect sync on this device', confirmLeave: 'Disconnect sync? The data on this device stays. You need the code to reconnect.',
      newer: 'A newer version from {dev} is available. Open Profile → Sync.', notes: 'Slide pictures and the AI access code are not synced.', fail: 'Sync failed: {e}', noCrypto: 'This browser lacks the encryption sync needs. Use a recent Chrome, Safari or Edge.',
      device: { android: 'Android phone', iphone: 'iPhone', ipad: 'iPad', windows: 'Windows laptop', mac: 'Mac', linux: 'Linux', device: 'another device' }
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
  const devName = slug => (S[lang()].device[slug] || S[lang()].device.device);
  /* replaceChildren turns null into the text "null", so drop empty parts first. */
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k !== null && k !== undefined && k !== false));
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
  const when = iso => { const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleString(lang() === 'en' ? 'en-GB' : 'ms-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); };

  /* ---------- local sync settings ---------- */
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function write(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage full */ } }
  const device = () => { const u = navigator.userAgent; return /Android/i.test(u) ? 'android' : /iPhone/i.test(u) ? 'iphone' : /iPad/i.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? 'ipad' : /Windows/i.test(u) ? 'windows' : /Mac OS/i.test(u) ? 'mac' : /Linux/i.test(u) ? 'linux' : 'device'; };

  /* ---------- code, id and key ---------- */
  const fmtCode = c => c.match(/.{1,4}/g).join('-');
  function newCode() { const b = crypto.getRandomValues(new Uint8Array(16)); let s = ''; for (const x of b) s += ALPH[x & 31]; return fmtCode(s); }
  function normCode(c) { const s = String(c || '').toUpperCase().replace(/[\s-]+/g, ''); return s.length === 16 && [...s].every(ch => ALPH.includes(ch)) ? fmtCode(s) : ''; }
  const enc = new TextEncoder(), dec = new TextDecoder();
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  let cached = null;
  async function keys(code) {
    if (cached && cached.code === code) return cached;
    const id = hex(await crypto.subtle.digest('SHA-256', enc.encode('talkademic-sync-id-v1:' + code)));
    const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('talkademic-sync-v1'), iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    cached = { code, id, key };
    return cached;
  }
  async function streamBytes(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const MAGIC = [84, 75, 83, 49]; // "TKS1"
  async function seal(text, key) {
    const gz = typeof CompressionStream === 'function';
    const body = gz ? await streamBytes(enc.encode(text), new CompressionStream('gzip')) : enc.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, body));
    const out = new Uint8Array(4 + 1 + 12 + ct.length);
    out.set(MAGIC, 0); out[4] = gz ? 1 : 0; out.set(iv, 5); out.set(ct, 17);
    return b64(out);
  }
  async function open(data, key) {
    const all = unb64(data);
    if (MAGIC.some((b, i) => all[i] !== b)) throw new Error('format');
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(5, 17) }, key, all.subarray(17)));
    return dec.decode(all[4] === 1 ? await streamBytes(plain, new DecompressionStream('gzip')) : plain);
  }
  /* FNV-1a over the saved workspace: tells whether this device changed since the last sync. */
  function hashNow() { const s = JSON.stringify(App.state()); let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(16) + ':' + s.length; }
  const dirty = st => !!st.code && st.hash !== hashNow();

  /* ---------- server calls ---------- */
  async function call(body) {
    const r = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ThesTalk-Access': App.accessCode() }, body: JSON.stringify(body) });
    let d = {};
    try { d = await r.json(); } catch (e) { /* empty */ }
    if (r.status === 409) return Object.assign({ conflict: true }, d);
    if (r.status === 404) return { missing: true };
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    return d;
  }
  let busy = false;
  async function push(force) {
    const st = read();
    if (!st.code || busy) return false;
    busy = true; render();
    try {
      App.persist();
      const k = await keys(st.code);
      const now = new Date();
      const text = JSON.stringify(window.ThesTalkBackup.makeBackup(App.state(), shell().ui ? shell().ui() : {}, shell().prefs ? shell().prefs() : {}, now));
      const hash = hashNow();
      const res = await call({ op: 'push', id: k.id, data: await seal(text, k.key), base: st.at || null, device: device(), force: !!force });
      const cur = read();
      if (res.conflict) { cur.conflict = { at: res.at, device: res.device }; write(cur); return false; }
      Object.assign(cur, { at: res.at, hash, lastSync: new Date().toISOString(), lastDevice: device(), conflict: null }); write(cur);
      return true;
    } finally { busy = false; render(); }
  }
  async function pull({ silent } = {}) {
    const st = read();
    if (!st.code || busy) return false;
    busy = true; render();
    try {
      const k = await keys(st.code);
      const res = await call({ op: 'pull', id: k.id });
      if (res.missing) { App.toast(t('nothing')); return false; }
      if (!silent && !confirm(t('confirmPull', { dev: devName(res.device), d: when(res.at) }))) return false;
      const parsed = window.ThesTalkBackup.parseBackup(await open(res.data, k.key));
      Object.assign(st, { at: res.at, hash: null, rehash: true, lastSync: new Date().toISOString(), lastDevice: res.device, conflict: null }); write(st);
      shell().syncApply(parsed.workspace, parsed.preferences, t('pulled', { dev: devName(res.device) }));
      return true;
    } finally { busy = false; render(); }
  }
  const guard = fn => async (...a) => { try { return await fn(...a); } catch (e) { App.toast(t('fail', { e: e.message === 'format' || e.name === 'OperationError' ? 'kod tidak sepadan dengan data' : e.message || e })); render(); return false; } };

  async function create() {
    if (!window.crypto || !crypto.subtle) { App.toast(t('noCrypto')); return; }
    const st = { code: newCode(), auto: true, reveal: true };
    write(st); render();
    if (await guard(push)(true)) App.toast(t('pushed'));
  }
  async function join(raw) {
    if (!window.crypto || !crypto.subtle) { App.toast(t('noCrypto')); return; }
    const code = normCode(raw);
    if (!code) { App.toast(t('badCode')); return; }
    busy = true; render();
    let res;
    try { const k = await keys(code); res = await call({ op: 'status', id: k.id }); }
    catch (e) { App.toast(t('fail', { e: e.message })); return; }
    finally { busy = false; render(); }
    if (!res.at) { App.toast(t('nothing')); return; }
    if (!confirm(t('confirmJoin', { dev: devName(res.device), d: when(res.at) }))) return;
    write({ code, auto: true });
    await guard(pull)({ silent: true });
  }
  /* On opening the app (and coming back to it): fetch a newer version if this device has no unsent changes. */
  async function check() {
    const st = read();
    if (!st.code || !st.auto || busy || !App.accessCode()) return;
    const k = await keys(st.code);
    const res = await call({ op: 'status', id: k.id });
    if (!res.at || res.at === st.at) { if (dirty(st)) schedule(); return; }
    if (!dirty(st)) { await pull({ silent: true }); return; }
    const cur = read(); cur.conflict = { at: res.at, device: res.device }; write(cur); render();
    App.toast(cap1(t('newer', { dev: devName(res.device) })));
  }
  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { const st = read(); if (st.code && st.auto && !st.conflict && dirty(st)) guard(push)(false); }, 15000); }
  function changed() { const st = read(); if (st.code && st.auto && !st.conflict) schedule(); renderSoon(); }
  let rt = null;
  const renderSoon = () => { clearTimeout(rt); rt = setTimeout(() => { const v = $('#view-settings'); if (v && !v.hidden) render(); }, 600); };

  /* ---------- settings card ---------- */
  function render() {
    const box = $('#syncCard');
    if (!box) return;
    const st = read();
    const head = [h('h2', { text: t('title') }), h('p', { class: 'muted', text: t('body') })];
    if (!st.code) {
      const input = h('input', { type: 'text', placeholder: t('codePh'), autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': t('haveCode'), maxLength: 24 });
      fill(box, ...head,
        h('div', { class: 'tool-row' }, h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: create }, '🔐 ', t('create'))),
        h('p', { class: 'field-label sync-or', text: t('haveCode') }),
        h('form', { class: 'sync-join', onsubmit: e => { e.preventDefault(); join(input.value); } }, input, h('button', { type: 'submit', class: 'btn btn-outline', disabled: busy, text: t('join') })),
        busy ? h('p', { class: 'chat-activity', role: 'status', text: t('working') }) : null,
        h('p', { class: 'muted small-note', text: t('notes') }));
      return;
    }
    const shown = st.reveal ? st.code : st.code.slice(0, 4) + '-••••-••••-' + st.code.slice(-4);
    const status = st.lastSync ? t('synced', { d: when(st.lastSync) }) + (st.lastDevice && st.lastDevice !== device() ? ' · ' + devName(st.lastDevice) : '') : t('never');
    fill(box, ...head,
      h('div', { class: 'sync-code' },
        h('span', { class: 'field-label', text: t('yourCode') }),
        h('code', { class: 'sync-code-text', text: shown }),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => { const s = read(); s.reveal = !s.reveal; write(s); render(); }, text: st.reveal ? t('hide') : t('show') }),
          h('button', { type: 'button', class: 'btn-reset text-action', onclick: async () => { try { await navigator.clipboard.writeText(st.code); } catch (e) { /* older browsers */ } App.toast(t('copied')); }, text: t('copy') }),
          navigator.share ? h('button', { type: 'button', class: 'btn-reset text-action', onclick: () => navigator.share({ title: 'Talkademic', text: st.code }).catch(() => {}), text: t('share') }) : null)),
      h('p', { class: 'muted small-note sync-warn', text: t('warn') }),
      st.conflict ? h('div', { class: 'sync-conflict', role: 'alert' },
        h('p', { text: cap1(t('conflict', { dev: devName(st.conflict.device), d: when(st.conflict.at) })) }),
        h('div', { class: 'tool-row' },
          h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: () => guard(pull)({}) , text: t('useCloud', { dev: devName(st.conflict.device) }) }),
          h('button', { type: 'button', class: 'btn btn-outline', disabled: busy, onclick: async () => { if (confirm(t('confirmForce')) && await guard(push)(true)) App.toast(t('pushed')); }, text: t('useLocal') }))) : null,
      h('p', { class: 'backup-last', 'aria-live': 'polite', text: busy ? t('working') : status }),
      !busy && st.lastSync ? h('p', { class: 'muted small-note', text: dirty(st) ? t('dirty') : t('clean') }) : null,
      h('div', { class: 'tool-row' },
        h('button', { type: 'button', class: 'btn btn-primary', disabled: busy, onclick: async () => { if (await guard(push)(false)) App.toast(t('pushed')); } }, '⬆ ', t('push')),
        h('button', { type: 'button', class: 'btn btn-outline', disabled: busy, onclick: () => guard(pull)({}) }, '⬇ ', t('pull'))),
      h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: st.auto !== false, onchange: e => { const s = read(); s.auto = e.target.checked; write(s); render(); } }), h('span', { text: t('auto') })),
      h('p', { class: 'muted small-note', text: t('autoHelp') + ' ' + t('notes') }),
      h('button', { type: 'button', class: 'btn-reset text-action danger', onclick: () => { if (!confirm(t('confirmLeave'))) return; localStorage.removeItem(KEY); cached = null; render(); }, text: t('leave') }));
  }

  const quiet = fn => async () => { try { await fn(); } catch (e) { /* offline or not set up: try again later */ } };
  window.TalkademicSync = { render, changed, check: quiet(check), push: guard(push), pull: guard(pull), normCode, newCode, seal, open, keys, hashNow };
  // Right after a pull the page reloads: remember the fresh workspace as "in sync".
  (() => { const st = read(); if (st.rehash) { st.hash = hashNow(); delete st.rehash; write(st); } })();
  render();
  setTimeout(() => { window.TalkademicSync.check(); }, 2500);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') window.TalkademicSync.check(); });
})();
