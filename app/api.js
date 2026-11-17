// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Every response is kept in an in-memory cache keyed by URL. A re-fetch sends the
// stored ETag as If-None-Match and reuses the cached body when the API answers
// 304, so repeat visits and route changes stay cheap (the API's ETags are bound
// to the minute, so a body is never reused past the minute it was fetched in).

export const ORIGIN = 'https://make.fun';
const API = `${ORIGIN}/api`;

const cache = new Map(); // url -> { etag, body }

/** An API path or relative URL made absolute (avatars and images come back as '/api/...' paths). */
export function absolute(path) {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : ORIGIN + (path.startsWith('/') ? path : `/${path}`);
}

async function get(path) {
  const url = API + path;
  const hit = cache.get(url);
  const headers = {};
  if (hit?.etag) headers['If-None-Match'] = hit.etag;
  const res = await fetch(url, { headers });
  if (res.status === 304 && hit) return hit.body;
  if (!res.ok) {
    let message = `make.fun API answered ${res.status}`;
    try {
      const body = await res.json();
      const detail = body?.error?.[0]?.message ?? body?.message;
      if (detail) message = detail;
    } catch { /* keep the status message */ }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  const body = await res.json();
  cache.set(url, { etag: res.headers.get('etag'), body });
  return body;
}

/** The competitions still marked open (activity=times keeps the payload lean). */
export const getCompetitions = () => get('/competitions?status=open&activity=times');

/** One competition in full, by its slug. */
export const getCompetition = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A competition's leaderboard: { rank_key, columns, entries } with entries in rank order. */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile, by handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
