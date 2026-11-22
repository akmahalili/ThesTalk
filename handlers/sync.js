'use strict';
/* POST /api/sync — { op: "status" | "pull" | "push", id, data?, base?, device?, force? }
   Stores only encrypted workspaces (see lib/sync.js) in the project's private Vercel Blob store. */
const { json, protect, getBody, fail, userMode } = require('../lib/common');
const Y = require('../lib/sync');

function blobStore() {
  const B = require('@vercel/blob');
  return {
    async list(prefix) {
      const out = [];
      let cursor;
      do { const r = await B.list({ prefix, cursor, limit: 100 }); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
      return out;
    },
    put: (pathname, text) => B.put(pathname, text, { access: 'private', addRandomSuffix: false, contentType: 'application/json' }),
    async read(pathname) {
      const r = await B.get(pathname, { access: 'private', useCache: false });
      if (!r || !r.stream) throw Object.assign(new Error('The synced copy could not be read.'), { status: 502 });
      return new Response(r.stream).text();
    },
    del: paths => B.del(paths)
  };
}

async function handler(req, res) {
  if (!protect(req, res)) return;
  // Cloud sync uses the owner's storage: not available with a student's own AI key.
  if (userMode()) return json(res, 403, { error: 'Cloud sync is only for the app owner. Use Export DOCX or Backup in Profile to keep a copy.', ownerOnly: true });
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN && !handler.store) return json(res, 503, { error: 'Sync is not set up on this server yet.' });
    const data = getBody(req, Y.MAX_DATA + 2000);
    if (!Y.validId(data.id)) return json(res, 400, { error: 'Invalid sync id.' });
    const store = handler.store || blobStore();
    if (data.op === 'status') return json(res, 200, await Y.status(store, data.id));
    if (data.op === 'pull') {
      const out = await Y.pull(store, data.id);
      return out ? json(res, 200, out) : json(res, 404, { error: 'Nothing has been synced with this code yet.' });
    }
    if (data.op === 'push') {
      const out = await Y.push(store, data.id, { data: data.data, base: data.base || null, device: data.device, force: data.force === true });
      return out.conflict ? json(res, 409, { error: 'conflict', at: out.at, device: out.device }) : json(res, 200, out);
    }
    return json(res, 400, { error: 'Unknown sync operation.' });
  } catch (e) {
    if (!e.status && !(e instanceof SyntaxError)) { console.error('sync', e && e.message); return json(res, 502, { error: 'Sync storage is unavailable right now. Try again in a minute.' }); }
    return fail(res, e);
  }
}
module.exports = handler;
