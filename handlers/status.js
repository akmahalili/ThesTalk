'use strict';
const { json, configured, validCode, available, provider, PROVIDERS, userMode, hasKey, serverHas, _keyFor } = require('../lib/common');

async function verifyKeys() {
  const out = {};
  for (const [p, url] of [['gemini', 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1'], ['groq', 'https://api.groq.com/openai/v1/models']]) {
    const key = _keyFor(p);
    if (!key) continue;
    try {
      const headers = p === 'gemini' ? { 'x-goog-api-key': key } : { Authorization: 'Bearer ' + key };
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      out[p] = r.ok ? 'ok' : r.status === 429 ? 'limit' : 'invalid';
    } catch (e) { out[p] = 'unreachable'; }
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const own = userMode();
  const on = own || (configured() && validCode(req));
  const keys = available();
  // ?verify=1 when a student connects their own key: one cheap call that lists models (no AI quota used).
  let keyCheck = null;
  if (own && /[?&]verify=1\b/.test(req.url || '')) keyCheck = await verifyKeys();
  return json(res, 200, {
    aiEnabled: on,
    chatEnabled: on,
    mode: own ? 'own-key' : on ? 'owner' : null,
    keyCheck,
    transcriptionEnabled: on && (hasKey('gemini') || (!own && serverHas('openai'))),
    referencesEnabled: on,
    referencesKey: on && !!process.env.OPENALEX_API_KEY,
    // Which AIs the owner has switched on (no secrets, only true/false), and the default.
    providers: on ? keys : Object.fromEntries(PROVIDERS.map(p => [p, false])),
    defaultProvider: on ? provider() : null,
    configured: configured()
  });
};
