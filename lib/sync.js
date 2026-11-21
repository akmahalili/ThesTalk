'use strict';
/*
 * Sync between devices. The browser encrypts the workspace with a key derived from the sync code
 * (AES-GCM; the code never leaves the device) and sends only the ciphertext and a hashed id.
 * Each push is a new blob sync/<id>/<ms>-<device>.json; the newest is current and the last
 * KEEP versions stay as history. `store` is { list(prefix), put(path, text), read(path), del(paths) }.
 */
const KEEP = 3;
const MAX_DATA = 4200000; // base64 characters, under Vercel's 4.5 MB request limit
const validId = id => /^[a-f0-9]{64}$/.test(String(id || ''));
const deviceSlug = d => String(d || 'device').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'device';

function parsePath(pathname) {
  const m = String(pathname || '').match(/^sync\/([a-f0-9]{64})\/(\d{13})-([a-z0-9-]{1,30})\.json$/);
  return m ? { id: m[1], ms: Number(m[2]), at: new Date(Number(m[2])).toISOString(), device: m[3], pathname } : null;
}
async function versions(store, id) {
  const blobs = await store.list('sync/' + id + '/');
  return blobs.map(b => Object.assign(parsePath(b.pathname) || {}, { size: b.size || 0 })).filter(v => v.ms).sort((a, b) => b.ms - a.ms);
}
async function status(store, id) {
  const [top] = await versions(store, id);
  return top ? { at: top.at, device: top.device, size: top.size } : { at: null };
}
async function pull(store, id) {
  const [top] = await versions(store, id);
  if (!top) return null;
  const body = JSON.parse(await store.read(top.pathname));
  return { at: top.at, device: top.device, data: String(body.data || '') };
}
/* Refuses to overwrite a newer version the caller has not seen, unless force is set. */
async function push(store, id, { data, base, device, force }, now = Date.now()) {
  if (typeof data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(data) || data.length < 40) throw Object.assign(new Error('Sync data is not valid.'), { status: 400 });
  if (data.length > MAX_DATA) throw Object.assign(new Error('The workspace is too large to sync (over 3 MB after compression). Remove old chats or papers and try again.'), { status: 413 });
  const list = await versions(store, id);
  const top = list[0];
  if (top && !force && base !== top.at) return { conflict: true, at: top.at, device: top.device };
  const ms = Math.max(now, top ? top.ms + 1 : 0);
  const slug = deviceSlug(device);
  const pathname = 'sync/' + id + '/' + ms + '-' + slug + '.json';
  await store.put(pathname, JSON.stringify({ v: 1, at: new Date(ms).toISOString(), device: slug, data }));
  const old = list.slice(KEEP - 1).map(v => v.pathname);
  if (old.length) await store.del(old).catch(() => {});
  return { at: new Date(ms).toISOString(), device: slug };
}

module.exports = { KEEP, MAX_DATA, validId, deviceSlug, parsePath, versions, status, pull, push };
