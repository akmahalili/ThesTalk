'use strict';
/*
 * Scholarly source provider: OpenAlex (https://openalex.org).
 * Returns real, citable works with abstracts so the writer can only cite
 * papers that actually exist. Swap this module to change providers.
 *
 * Env:
 *   OPENALEX_API_KEY  free key from https://openalex.org/settings/api (strongly recommended;
 *                     keyless calls share a tiny daily budget per IP address)
 *   OPENALEX_EMAIL    optional contact email sent as `mailto`
 */
const BASE = 'https://api.openalex.org/works';
const SELECT = 'id,doi,display_name,publication_year,authorships,primary_location,cited_by_count,biblio,abstract_inverted_index,type';

function sourceError(message, status) {
  return Object.assign(new Error(message), { status });
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function rebuildAbstract(inv) {
  if (!inv || typeof inv !== 'object') return '';
  const words = [];
  for (const [word, positions] of Object.entries(inv)) {
    if (!Array.isArray(positions)) continue;
    for (const p of positions) if (Number.isInteger(p) && p >= 0 && p < 6000) words[p] = word;
  }
  return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function toPaper(w) {
  if (!w || !w.display_name) return null;
  const src = w.primary_location && w.primary_location.source;
  const b = w.biblio || {};
  const first = b.first_page ? String(b.first_page) : '';
  const last = b.last_page ? String(b.last_page) : '';
  return {
    id: String(w.id || w.doi || w.display_name),
    title: stripTags(w.display_name),
    doi: typeof w.doi === 'string' ? w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : '',
    year: w.publication_year ? String(w.publication_year) : '',
    authors: (w.authorships || []).map(a => a && a.author && a.author.display_name).filter(Boolean).map(stripTags).slice(0, 25),
    venue: src && src.display_name ? stripTags(src.display_name) : '',
    volume: b.volume ? String(b.volume) : '',
    issue: b.issue ? String(b.issue) : '',
    pages: first ? (last && last !== first ? first + '–' + last : first) : '',
    cites: Number(w.cited_by_count) || 0,
    type: String(w.type || ''),
    openalex: typeof w.id === 'string' ? w.id : '',
    abstract: rebuildAbstract(w.abstract_inverted_index)
  };
}

async function timedFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw sourceError('Reference search timed out.', 504);
    throw sourceError('Reference search is unreachable right now.', 502);
  } finally {
    clearTimeout(timer);
  }
}

function buildUrl(query, { recent, strict, perPage }) {
  const p = new URLSearchParams();
  p.set('search', query);
  const filters = ['has_abstract:true'];
  if (strict) filters.push('type:article|review');
  if (recent) filters.push('publication_year:>2014');
  p.set('filter', filters.join(','));
  p.set('select', SELECT);
  p.set('per_page', String(perPage));
  if (process.env.OPENALEX_EMAIL) p.set('mailto', process.env.OPENALEX_EMAIL);
  return BASE + '?' + p.toString();
}

async function searchWorks(query, { recent = false, perPage = 8 } = {}) {
  const q = String(query || '').trim().slice(0, 200);
  if (!q) return [];
  const headers = { Accept: 'application/json', 'User-Agent': 'Talkademic/0.4 (academic writing assistant)' };
  if (process.env.OPENALEX_API_KEY) headers.Authorization = 'Bearer ' + process.env.OPENALEX_API_KEY;
  let r = await timedFetch(buildUrl(q, { recent, strict: true, perPage }), { headers }, 10000);
  // If a filter is rejected, retry once with the minimum filter set.
  if (r.status === 400) r = await timedFetch(buildUrl(q, { recent, strict: false, perPage }), { headers }, 10000);
  if (r.status === 429) {
    throw sourceError(process.env.OPENALEX_API_KEY
      ? 'The OpenAlex daily allowance for this API key is used up. Try again after 8 a.m. Malaysia time.'
      : 'Reference search needs a free OpenAlex API key. The app owner should set OPENALEX_API_KEY in Vercel.', 429);
  }
  if (r.status === 401 || r.status === 403) throw sourceError('OpenAlex rejected the API key. Check OPENALEX_API_KEY in Vercel.', 502);
  if (!r.ok) throw sourceError('Reference search failed (' + r.status + ').', 502);
  let data;
  try { data = await r.json(); } catch (_) { throw sourceError('Reference search returned an unreadable answer.', 502); }
  return (Array.isArray(data && data.results) ? data.results : []).map(toPaper).filter(Boolean);
}


/* Look up one work: by DOI first, then by exact-ish title. Returns null when no confident match. */
const words = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
function titleMatch(a, b) {
  const x = new Set(words(a)), y = new Set(words(b));
  if (!x.size || !y.size) return 0;
  let both = 0;
  x.forEach(w => { if (y.has(w)) both++; });
  return both / Math.max(x.size, y.size);
}
async function findWork({ doi, title } = {}) {
  const headers = { Accept: 'application/json', 'User-Agent': 'Talkademic/1.7 (academic writing assistant)' };
  if (process.env.OPENALEX_API_KEY) headers.Authorization = 'Bearer ' + process.env.OPENALEX_API_KEY;
  const clean = String(doi || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').replace(/[.,;)\]]+$/, '');
  if (/^10\.\d{4,9}\/\S+$/.test(clean)) {
    const r = await timedFetch(BASE + '/doi:' + encodeURIComponent(clean) + '?select=' + SELECT, { headers }, 9000);
    if (r.ok) {
      const p = toPaper(await r.json().catch(() => null));
      if (p && (!title || titleMatch(title, p.title) >= 0.5)) return p;
    } else if (r.status === 429) throw sourceError('The OpenAlex daily allowance is used up.', 429);
  }
  const t = String(title || '').trim().slice(0, 250);
  if (words(t).length < 3) return null;
  const q = new URLSearchParams({ filter: 'title.search:' + t.replace(/[,|:]/g, ' '), select: SELECT, per_page: '5' });
  const r = await timedFetch(BASE + '?' + q.toString(), { headers }, 9000);
  if (r.status === 429) throw sourceError('The OpenAlex daily allowance is used up.', 429);
  if (!r.ok) return null;
  const data = await r.json().catch(() => null);
  const best = (Array.isArray(data && data.results) ? data.results : []).map(toPaper).filter(Boolean)
    .map(p => ({ p, m: titleMatch(t, p.title) })).sort((a, b) => b.m - a.m)[0];
  return best && best.m >= 0.8 ? best.p : null;
}

module.exports = { searchWorks, findWork, titleMatch, toPaper, rebuildAbstract, provider: 'OpenAlex' };
