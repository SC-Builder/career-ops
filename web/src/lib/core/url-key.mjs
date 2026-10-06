/**
 * Canonical posting-URL key — algorithm mirror of the core's `normalizeUrl`
 * in url-key.mjs (root).
 *
 * Plain .mjs (same pattern as normalize-text-key.mjs) so node:test and client
 * bundles can import it without a TS runner or Node-only deps — this file has
 * none, same as the core it mirrors (only the global `URL`).
 *
 * WHY A COPY EXISTS AT ALL: the live core lives in the user's career-ops
 * checkout and is resolved at runtime via careerOpsRoot() — unavailable to the
 * client bundle. Unlike normalize-text-key.mjs's split (a Node-only live
 * loader server-side, this mirror client-side), the URL key here is used to
 * build ONE Set server-side (assembleDedupContext, from data/scan-history.tsv)
 * that the CLIENT then does membership lookups against on each AI-streamed
 * offer (explore-ai.ts's canon()). Server and client MUST key with the exact
 * same function or `known.has(key)` silently stops matching anything — so both
 * sides import this one mirror rather than the server preferring a live-loaded
 * copy that could drift from what the client bundle was built with.
 *
 * Keep the body byte-for-byte aligned with url-key.mjs `normalizeUrl`. The
 * parity test in tests/lib/url-key.test.mjs fails the build if they drift.
 *
 * UNDER-STRIP ON PURPOSE (see the root file's docstring for the full RFC 3986
 * rationale). Never add path/query lowercasing or a broader strip list here:
 * that is exactly the over-normalization that collapsed two different
 * Greenhouse postings (same host+path, distinct `?gh_jid=`) into one dedup
 * key and silently dropped every opening after the first at that employer —
 * the bug this mirror exists to stop reintroducing.
 */

// Query params that identify a click/campaign, never the posting itself. Keep
// this list literal and board-specific, identical to the core's denylist.
const TRACKING_PARAMS = [
  /^utm_/i, /^gh_src$/i, /^fbclid$/i, /^gclid$/i,
  /^mc_cid$/i, /^mc_eid$/i, /^igshid$/i, /^_hsenc$/i, /^_hsmi$/i, /^trk$/i, /^trackingid$/i,
];

// ISO 639-1 two-letter language subtags, identical to the core's allowlist.
// The language subtag is checked against the real list so `en-US` (a locale)
// strips and `EXT_US` (a Workday site name) does not.
const ISO_639_1 = new Set([
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
]);

// `{lang}[-{Script}]-{REGION}`, `-` or `_`. The REGION subtag is REQUIRED: a
// bare `/en/` or `/us/` first segment is ambiguous (Workday's first segment is
// either the locale or the tenant site name) and is never touched.
// ISO 3166-1 alpha-2 region subtags. The second half of the allowlist, and it
// earns its keep on one real shape: `/co-op/jobs/…`. `co` IS a valid ISO 639-1
// code (Corsican), so language-checking alone would read a co-op programme's
// path segment as a locale and strip it. `op` is not an assigned region, so
// checking both subtags refuses it. Same for `/hi-fi/`, `/to-do/` and the rest
// of the two-plus-two English pairs that are not locales.
//
// It narrows the residual rather than closing it: `to-do` survives both checks
// (`to` is Tongan, `do` is the Dominican Republic). No further rule separates
// that from a real locale, so the remaining defence is that a two-letter pair
// like it is not a first path segment any ATS emits. If one ever shows up, it
// goes on a negative list here — it is not something the shape can rule out.
const ISO_3166_1_ALPHA_2 = new Set([
  'ad', 'ae', 'af', 'ag', 'ai', 'al', 'am', 'ao', 'aq', 'ar', 'as', 'at', 'au', 'aw', 'ax', 'az',
  'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj', 'bl', 'bm', 'bn', 'bo', 'bq', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz',
  'ca', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'co', 'cr', 'cu', 'cv', 'cw', 'cx', 'cy', 'cz',
  'de', 'dj', 'dk', 'dm', 'do', 'dz',
  'ec', 'ee', 'eg', 'eh', 'er', 'es', 'et',
  'fi', 'fj', 'fk', 'fm', 'fo', 'fr',
  'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy',
  'hk', 'hm', 'hn', 'hr', 'ht', 'hu',
  'id', 'ie', 'il', 'im', 'in', 'io', 'iq', 'ir', 'is', 'it',
  'je', 'jm', 'jo', 'jp',
  'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kr', 'kw', 'ky', 'kz',
  'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly',
  'ma', 'mc', 'md', 'me', 'mf', 'mg', 'mh', 'mk', 'ml', 'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mx', 'my', 'mz',
  'na', 'nc', 'ne', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz',
  'om',
  'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'ps', 'pt', 'pw', 'py',
  'qa',
  're', 'ro', 'rs', 'ru', 'rw',
  'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sv', 'sx', 'sy', 'sz',
  'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tr', 'tt', 'tv', 'tw', 'tz',
  'ua', 'ug', 'um', 'us', 'uy', 'uz',
  'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu',
  'wf', 'ws',
  'ye', 'yt',
  'za', 'zm', 'zw',
]);

const LOCALE_SEGMENT_RE = /^([A-Za-z]{2})(?:[-_][A-Za-z]{4})?[-_](?:([A-Za-z]{2})|[0-9]{3})$/;

/**
 * Drop a leading locale path segment so Workday's `/en-US/{site}/job/...` and
 * `/{site}/job/...` key the same. Mirror of the core's stripLocalePathSegment
 * (see it for why the strip is first-segment-only, allowlist-gated, and
 * requires a surviving segment).
 *
 * @param {URL} url
 */
export function stripLocalePathSegment(url) {
  const segments = url.pathname.split('/');
  if (segments.length < 3 || segments[0] !== '' || !segments[2]) return;
  const match = LOCALE_SEGMENT_RE.exec(segments[1]);
  if (!match) return;
  if (!ISO_639_1.has(match[1].toLowerCase())) return;
  // A numeric region (es-419) has no alpha-2 form to check.
  if (match[2] && !ISO_3166_1_ALPHA_2.has(match[2].toLowerCase())) return;
  segments.splice(1, 1);
  url.pathname = segments.join('/');
}

/**
 * Promote a known identity-bearing SPA fragment into a functional query key
 * before generic URL normalization drops the fragment. Most fragments are
 * presentation-only. The narrow exceptions are recognized `#/job/{id}` and
 * `#/jobs/{id}` routes; MokaHR keeps its established board-specific key.
 *
 * @param {URL} url
 */
export function promoteKnownFragmentIdentity(url) {
  const match = /^#\/jobs?\/([^/?#]+)(?:\?[^#]*)?$/i.exec(url.hash);
  if (!match) return;
  let jobId;
  try { jobId = decodeURIComponent(match[1]); } catch { return; }
  if (!jobId) return;
  if (url.hostname.toLowerCase() === "app.mokahr.com") {
    url.searchParams.append("mokahr_job_id", jobId);
    return;
  }
  url.searchParams.append("_career_ops_fragment_job_id", jobId);
}

/**
 * Reduce a posting URL to a stable comparison key.
 *
 * @param {string} raw - A posting URL (or any string).
 * @returns {string} A normalized key, or '' when there is nothing to key on.
 *   '' means NO KEY — callers must treat it as unknown, never as a value that
 *   can match another ''.
 */
export function normalizeUrl(raw) {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";

  let u;
  try {
    u = new URL(s);
  } catch {
    return "";
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") return "";

  u.protocol = "https:";
  u.hostname = u.hostname.toLowerCase();
  stripLocalePathSegment(u);        // /en-US/{site}/job/… === /{site}/job/…
  promoteKnownFragmentIdentity(u);
  u.hash = "";

  const keep = [];
  for (const [k, v] of u.searchParams.entries()) {
    if (!TRACKING_PARAMS.some((re) => re.test(k))) keep.push([k, v]);
  }
  keep.sort((x, y) => (x[0] !== y[0] ? (x[0] < y[0] ? -1 : 1) : (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0)));
  u.search = "";
  for (const [k, v] of keep) u.searchParams.append(k, v);

  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  return u.toString();
}

export default normalizeUrl;
