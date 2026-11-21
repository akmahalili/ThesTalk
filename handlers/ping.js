'use strict';
/* POST /api/ping — { wait } → { ok, waited } — a connection check with no AI. With wait (up to 8 s)
   it shows whether a slow answer reaches this device; used to test the kept-alive responses. */
const { json, getBody } = require('../lib/common');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  let wait = 0;
  try { wait = Math.max(0, Math.min(8000, Number(getBody(req, 200).wait) || 0)); } catch (e) { wait = 0; }
  if (wait) await new Promise(r => setTimeout(r, wait));
  return json(res, 200, { ok: true, waited: wait });
};
