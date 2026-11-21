'use strict';
const { json, configured, validCode, available, provider } = require('../lib/common');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const on = configured() && validCode(req);
  const keys = available();
  return json(res, 200, {
    aiEnabled: on,
    chatEnabled: on,
    transcriptionEnabled: on && !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
    referencesEnabled: on,
    referencesKey: on && !!process.env.OPENALEX_API_KEY,
    // Which AIs the owner has switched on (no secrets, only true/false), and the default.
    providers: on ? keys : { gemini: false, claude: false, openai: false },
    defaultProvider: on ? provider() : null,
    configured: configured()
  });
};
