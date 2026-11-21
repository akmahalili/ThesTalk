'use strict';
/* Keeps a long AI request's connection alive. Phones and some networks drop a request that gets no
   bytes back for a while ("Failed to fetch"), and the long AI answers (Analisis Data, Analisis Soal
   Selidik, papers, slides) can take 20–50 s. When the app asks for it (header X-Talkademic-Wait: 1)
   and the handler has not answered within a few seconds, the response starts as 200 JSON and a space
   is sent every few seconds; JSON.parse ignores leading spaces. The handler's real status then goes
   into the body as "_status", which the app reads. Quick answers keep their normal status. */

const START_MS = 2500, EVERY_MS = 4000;

function keepAlive(req, res, opt) {
  const o = Object.assign({ start: START_MS, every: EVERY_MS }, opt || {});
  if (req.method !== 'POST' || String(req.headers && req.headers['x-talkademic-wait'] || '') !== '1') return () => {};
  const setHeader = res.setHeader.bind(res), end = res.end.bind(res);
  let streaming = false, finished = false, timer = null;
  const tick = () => { try { if (!finished && !res.writableEnded) res.write(' '); } catch (e) { /* client gone */ } };
  const begin = () => {
    if (finished || res.headersSent || res.writableEnded) return;
    streaming = true;
    res.statusCode = 200;
    setHeader('Content-Type', 'application/json; charset=utf-8');
    setHeader('Cache-Control', 'no-store');
    setHeader('X-Content-Type-Options', 'nosniff');
    setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    tick();
    timer = setInterval(tick, o.every);
  };
  const first = setTimeout(begin, o.start);
  const stop = () => { finished = true; clearTimeout(first); clearInterval(timer); };
  // Headers set after streaming started are ignored (they are already on the wire).
  res.setHeader = (k, v) => (streaming ? res : setHeader(k, v));
  res.end = (body, ...rest) => {
    const wanted = res.statusCode;
    stop();
    if (!streaming) return end(body, ...rest);
    let out = body == null ? '' : String(body);
    if (wanted && wanted !== 200) {
      try { const d = JSON.parse(out || '{}'); out = JSON.stringify(Object.assign(d && typeof d === 'object' && !Array.isArray(d) ? d : { result: d }, { _status: wanted })); }
      catch (e) { out = JSON.stringify({ error: 'Server error.', _status: wanted }); }
    }
    return end(out);
  };
  res.on && res.on('close', stop);
  return stop;
}

module.exports = { keepAlive, START_MS, EVERY_MS };
