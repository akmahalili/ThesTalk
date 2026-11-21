'use strict';
/* One Vercel function serves every /api/<name> route, because the free Hobby plan allows only
   12 functions per deployment. Each route's code lives in handlers/<name>.js and is loaded on
   first use; the static require calls let Vercel bundle every handler. */
const { json } = require('../lib/common');
const { keepAlive } = require('../lib/keepalive');
const ROUTES = {
  analysis: () => require('../handlers/analysis'),
  audit: () => require('../handlers/audit'),
  chat: () => require('../handlers/chat'),
  cite: () => require('../handlers/cite'),
  convert: () => require('../handlers/convert'),
  draft: () => require('../handlers/draft'),
  framework: () => require('../handlers/framework'),
  journals: () => require('../handlers/journals'),
  matrix: () => require('../handlers/matrix'),
  paper: () => require('../handlers/paper'),
  ping: () => require('../handlers/ping'),
  similarity: () => require('../handlers/similarity'),
  slides: () => require('../handlers/slides'),
  status: () => require('../handlers/status'),
  survey: () => require('../handlers/survey'),
  sync: () => require('../handlers/sync'),
  transcribe: () => require('../handlers/transcribe'),
  viva: () => require('../handlers/viva'),
};

function routeName(req) {
  const q = req.query && req.query.route;
  if (typeof q === 'string' && q) return q;
  const path = String(req.url || '').split('?')[0];
  const m = path.match(/\/api\/([a-z]+)\/?$/i);
  return m ? m[1] : '';
}

module.exports = async function handler(req, res) {
  const name = routeName(req);
  if (!Object.prototype.hasOwnProperty.call(ROUTES, name)) return json(res, 404, { error: 'Not found.' });
  const stop = keepAlive(req, res);
  try {
    return await ROUTES[name]()(req, res);
  } catch (e) {
    // Never leave a kept-alive response open.
    if (!res.writableEnded) json(res, 500, { error: 'Server error.' });
  } finally {
    stop();
  }
};
module.exports.ROUTES = Object.keys(ROUTES);
