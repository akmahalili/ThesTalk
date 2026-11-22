/* Talkademic "Sambung AI": every user connects the AI with their own free Gemini key (and, if they
   like, a Groq key as a backup), so the free quota is their own. The key stays in this browser and
   is sent only with that user's AI requests. The app owner can still enter the access code. */
(function () {
  'use strict';
  const App = window.ThesTalkApp;
  const shell = () => window.ThesTalkShell || {};
  const lang = () => { if (shell().lang) return shell().lang(); try { return JSON.parse(localStorage.getItem('thestalk_ui_v1') || '{}').lang || 'ms'; } catch (e) { return 'ms'; } };
  const FORMAT = { gemini: /^AIza[0-9A-Za-z_\-]{30,60}$/, groq: /^gsk_[0-9A-Za-z]{20,100}$/ };
  const S = {
    ms: {
      title: 'Sambung AI', intro: 'Talkademic guna AI Gemini percuma. Setiap pengguna guna kunci Gemini sendiri, jadi kuota percuma itu milik akaun Google anda.',
      step1: 'Buka Google AI Studio', step1b: ' dan log masuk dengan akaun Google anda.', step2: 'Tekan "Create API key" (Cipta kunci API).', step3: 'Salin kunci itu (bermula dengan AIza…) dan tampal di bawah.',
      gemini: 'Kunci Gemini anda', show: 'Tunjuk', hide: 'Sorok', groqTitle: 'Pilihan: kunci Groq (sandaran bila had Gemini habis)', groqHelp: 'Buka console.groq.com/keys, cipta kunci (bermula dengan gsk_…) dan tampal di sini.', groq: 'Kunci Groq anda',
      privacy: 'Kunci disimpan dalam peranti ini sahaja. Ia dihantar bersama setiap permintaan AI anda dan tidak disimpan di pelayan.',
      connect: 'Sambung', remove: 'Buang kunci', checking: 'Menyemak kunci…', close: 'Tutup',
      badFormat: 'Kunci Gemini sepatutnya bermula dengan "AIza". Salin sekali lagi dari Google AI Studio.', badGroq: 'Kunci Groq sepatutnya bermula dengan "gsk_".', needOne: 'Tampal kunci Gemini anda dahulu.',
      ok: '✓ AI disambung dengan kunci anda.', invalid: 'Google menolak kunci ini. Salin semula kunci penuh dari Google AI Studio.', invalidGroq: 'Groq menolak kunci ini.', limit: 'Kunci sah, tetapi had percuma hari ini sudah habis. Cuba lagi esok.', unreachable: 'Kunci disimpan, tetapi tidak dapat disemak sekarang. Semak internet.',
      current: 'Disambung dengan kunci anda: {k}', currentOwner: 'Disambung sebagai pemilik app (kod akses).', removed: 'Kunci dibuang dari peranti ini.',
      owner: 'Pemilik app? Masukkan kod akses', code: 'Kod akses', useCode: 'Guna kod', codeOk: '✓ Disambung sebagai pemilik app.', codeBad: 'Kod akses tidak sah.'
    },
    en: {
      title: 'Connect AI', intro: 'Talkademic uses the free Gemini AI. Each user uses their own Gemini key, so the free quota belongs to your own Google account.',
      step1: 'Open Google AI Studio', step1b: ' and sign in with your Google account.', step2: 'Tap "Create API key".', step3: 'Copy the key (it starts with AIza…) and paste it below.',
      gemini: 'Your Gemini key', show: 'Show', hide: 'Hide', groqTitle: 'Optional: a Groq key (backup when the Gemini limit is used up)', groqHelp: 'Open console.groq.com/keys, create a key (it starts with gsk_…) and paste it here.', groq: 'Your Groq key',
      privacy: 'The key is kept on this device only. It is sent with each of your AI requests and is not stored on the server.',
      connect: 'Connect', remove: 'Remove key', checking: 'Checking the key…', close: 'Close',
      badFormat: 'A Gemini key starts with "AIza". Copy it again from Google AI Studio.', badGroq: 'A Groq key starts with "gsk_".', needOne: 'Paste your Gemini key first.',
      ok: '✓ AI connected with your key.', invalid: 'Google rejected this key. Copy the full key again from Google AI Studio.', invalidGroq: 'Groq rejected this key.', limit: 'The key works, but today\'s free limit is used up. Try again tomorrow.', unreachable: 'The key is saved but could not be checked now. Check your internet.',
      current: 'Connected with your key: {k}', currentOwner: 'Connected as the app owner (access code).', removed: 'Key removed from this device.',
      owner: 'App owner? Enter the access code', code: 'Access code', useCode: 'Use code', codeOk: '✓ Connected as the app owner.', codeBad: 'The access code is not valid.'
    }
  };
  const t = (k, v) => { let s = (S[lang()] && S[lang()][k]) || S.ms[k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };
  const mask = k => k ? k.slice(0, 4) + '…' + k.slice(-4) : '';
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (['value', 'disabled', 'hidden', 'open'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }

  let root = null, lastFocus = null;
  function onKey(e) { if (e.key === 'Escape' && root) close(); }
  function close() { document.removeEventListener('keydown', onKey); if (root) root.remove(); root = null; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* gone */ } }

  function keyField(id, label, value, placeholder) {
    const input = h('input', { id, type: 'password', value: value || '', placeholder, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', inputmode: 'text' });
    const toggle = h('button', { type: 'button', class: 'btn-reset ak-show', text: t('show'), 'aria-controls': id, onclick: () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; toggle.textContent = show ? t('hide') : t('show'); } });
    return { input, el: h('label', { class: 'form-field', for: id }, h('span', { text: label }), h('div', { class: 'ak-row' }, input, toggle)) };
  }

  function open() {
    close();
    lastFocus = document.activeElement;
    const keys = App.aiKeys ? App.aiKeys() : {};
    const mode = App.aiMode ? App.aiMode() : null;
    const status = h('p', { class: 'ak-status', role: 'status', 'aria-live': 'polite' });
    const g = keyField('akGemini', t('gemini'), keys.gemini, 'AIza…');
    const q = keyField('akGroq', t('groq'), keys.groq, 'gsk_…');
    const say = (msg, good) => { status.textContent = msg; status.className = 'ak-status ' + (good ? 'good' : 'bad'); };
    const connectBtn = h('button', { type: 'submit', class: 'btn btn-primary', text: t('connect') });
    async function connect(e) {
      e.preventDefault();
      const gemini = g.input.value.trim(), groq = q.input.value.trim();
      if (!gemini && !groq) return say(t('needOne'));
      if (gemini && !FORMAT.gemini.test(gemini)) return say(t('badFormat'));
      if (groq && !FORMAT.groq.test(groq)) return say(t('badGroq'));
      connectBtn.disabled = true; say(t('checking'), true);
      try {
        const r = await App.setAIKeys({ gemini, groq });
        const c = r.check || {};
        // A rejected key is not kept: the previous keys (if any) come back.
        if (c.gemini === 'invalid' || (c.groq === 'invalid' && !gemini)) { await App.setAIKeys(keys); say(c.gemini === 'invalid' ? t('invalid') : t('invalidGroq')); }
        else if (c.gemini === 'limit') say(t('limit'));
        else if (c.gemini === 'unreachable' || c.groq === 'unreachable') say(t('unreachable'));
        else if (r.available) { say(t('ok'), true); App.toast(t('ok')); setTimeout(close, 900); }
        else say(t('invalid'));
      } finally { connectBtn.disabled = false; }
    }
    const code = h('input', { type: 'password', placeholder: t('code'), autocomplete: 'off', 'aria-label': t('code') });
    root = h('div', { class: 'modal-backdrop ak-backdrop', onclick: e => { if (e.target === root) close(); } },
      h('div', { class: 'modal ak-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'akTitle' },
        h('div', { class: 'modal-top' }, h('h2', { id: 'akTitle', text: t('title') }), h('button', { type: 'button', class: 'btn-reset imp-x', 'aria-label': t('close'), text: '✕', onclick: close })),
        mode === 'owner' ? h('p', { class: 'ak-status good', text: t('currentOwner') }) : keys.gemini || keys.groq ? h('p', { class: 'ak-status good', text: t('current', { k: mask(keys.gemini || keys.groq) }) }) : null,
        h('p', { class: 'imp-intro', text: t('intro') }),
        h('ol', { class: 'ak-steps' },
          h('li', {}, h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener', text: t('step1') }), t('step1b')),
          h('li', { text: t('step2') }), h('li', { text: t('step3') })),
        h('form', { class: 'ak-form', onsubmit: connect },
          g.el,
          h('details', { class: 'ak-groq', open: !!keys.groq }, h('summary', { text: t('groqTitle') }), h('p', { class: 'muted small-note' }, h('a', { href: 'https://console.groq.com/keys', target: '_blank', rel: 'noopener', text: 'console.groq.com/keys' }), ' · ', t('groqHelp')), q.el),
          h('p', { class: 'muted small-note', text: t('privacy') }),
          status,
          h('div', { class: 'modal-actions' },
            keys.gemini || keys.groq ? h('button', { type: 'button', class: 'btn btn-outline', text: t('remove'), onclick: async () => { await App.setAIKeys({}); g.input.value = ''; q.input.value = ''; App.toast(t('removed')); close(); } }) : null,
            connectBtn)),
        h('details', { class: 'ak-owner' }, h('summary', { text: t('owner') }),
          h('form', { class: 'sync-join', onsubmit: async e => { e.preventDefault(); const r = await App.setAccessCode(code.value); if (r.available) { App.toast(t('codeOk')); close(); } else say(t('codeBad')); } },
            code, h('button', { type: 'submit', class: 'btn btn-outline', text: t('useCode') })))));
    document.addEventListener('keydown', onKey);
    document.body.append(root);
    setTimeout(() => { if (root) (keys.gemini ? connectBtn : g.input).focus(); }, 30);
  }

  window.TalkademicAIKeys = { open, close };
})();
