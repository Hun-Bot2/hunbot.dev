/**
 * Canonicalization, content hashing, and dedup-key derivation for the
 * (not-yet-built) private Research OS pipeline.
 *
 * Every function here is pure and does zero I/O — no fetch, no DNS, no
 * filesystem access. That is a hard constraint, not a style preference:
 * these functions run in a dedup loop over an entire corpus and must be
 * deterministic and network-free to be testable at all.
 *
 * Nothing in `src/pages` or `src/components` may import this module. It
 * exists only for the private ingestion pipeline described in
 * docs/decisions/discover-direction.md and docs/decisions/research-item-identity.md.
 *
 * Scope note on redirect resolution: `canonicalizeUrl` deliberately does not
 * follow HTTP redirects (e.g. a shortlink or a tracking redirector landing on
 * the "real" URL). Resolving a redirect requires a network call, which would
 * make this function impure, non-deterministic, and untestable — exactly the
 * failure mode this module exists to avoid. The interface this module
 * exposes is the contract: callers that need redirect resolution must resolve
 * the URL themselves (over the network, with caching/retry as they see fit)
 * and pass the *final* URL in here. `canonicalizeUrl` only normalizes a URL
 * it is given; it never chases one.
 */

import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// canonicalizeUrl
// ---------------------------------------------------------------------------

/**
 * Tracking / analytics query parameters stripped by `canonicalizeUrl`.
 *
 * This is a DENYLIST, not an allowlist, by deliberate decision (see T06 task
 * packet, "Decisions You May Make"). An allowlist would strip any parameter
 * it doesn't recognize — including an arXiv version (`?v=2`) or a paper ID —
 * which destroys identity rather than tracking cruft. A denylist only ever
 * removes parameters we can specifically name and justify below; everything
 * else survives canonicalization untouched.
 *
 * Matching is case-insensitive on the parameter *name* only (marketing tools
 * are inconsistent about casing here) — parameter *values* and the case of
 * any parameter NOT in this list are left exactly as given, because query
 * values and unrecognized parameter names may be meaningful and are not ours
 * to alter.
 *
 * Every entry below is justified individually. Do not add an entry without a
 * comment naming the tool that sets it; do not remove one without checking
 * the same.
 */
const TRACKING_PARAM_DENYLIST: ReadonlySet<string> = new Set([
  // Google Analytics campaign tracking (utm_*, plus Google's "utm_id" GA4
  // variant). Standardized by Google, ubiquitous on shared blog/news links,
  // and by definition describe how a link was shared, never what the
  // resource is.
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',

  // Google Ads / DoubleClick click identifiers.
  'gclid',
  'gclsrc',
  'dclid',

  // Meta (Facebook/Instagram) click identifiers, appended automatically to
  // any link a person shares through those apps.
  'fbclid',
  'igshid',

  // Microsoft Advertising (Bing Ads) click identifier.
  'msclkid',

  // Yandex Direct click identifier.
  'yclid',

  // Twitter/X Ads click identifier.
  'twclid',

  // Generic referrer-tracking parameters used by many blogging platforms and
  // by Twitter/X's own share links. Carry no resource-identifying meaning.
  'ref',
  'ref_src',

  // Mailchimp campaign and recipient identifiers, appended to links inside
  // newsletter emails.
  'mc_cid',
  'mc_eid',

  // HubSpot email tracking parameters.
  '_hsenc',
  '_hsmi',

  // Marketo tracking token.
  'mkt_tok',

  // Vero email marketing tracking parameter.
  'vero_id',

  // Alibaba/Taobao ecosystem tracking parameter, occasionally seen on
  // cross-posted Chinese-language sources in the corpus.
  'spm',
]);

/**
 * Canonicalizes a URL for deduplication and identity purposes.
 *
 * Rules applied, in order, each chosen to be safe (never destroys identity)
 * and network-free:
 *
 * 1. Parse with the WHATWG `URL` parser. This already lowercases the scheme
 *    and the hostname per spec — done for us, not re-implemented here.
 * 2. Strip a leading `www.` label from the host, and *only* that exact
 *    label. `www.` is a longstanding convention for "the same site without
 *    the subdomain"; a lookalike like `www2.` or `wwwx.` is a distinct host
 *    that may serve different content, so it is left alone. This is the
 *    "safe" subset of host normalization the task calls for.
 * 3. A host-specific, static rewrite for arxiv.org: `/pdf/<id>[.pdf]` and
 *    `/abs/<id>` are two paths that serve the same paper on the same
 *    hostname — not a redirect, just two static routes to one resource — so
 *    both normalize to `/abs/<id>`. The version suffix (`v2`, etc.) is part
 *    of `<id>` here and is preserved, never stripped: two versions of a
 *    preprint are related but are not asserted to be byte-identical, and
 *    only this function's caller (deriveDedupKey / the identifier index)
 *    gets to decide whether versions collapse to one work.
 * 4. Remove tracking parameters per `TRACKING_PARAM_DENYLIST` above.
 *    Everything not on that list — including a paper ID or a version
 *    number passed as a query parameter — is preserved.
 * 5. Sort the surviving parameters by name so that `?b=2&a=1` and `?a=1&b=2`
 *    canonicalize identically. Parameter order carries no meaning on the
 *    web; alphabetizing makes the output deterministic without needing to
 *    special-case any particular site's convention.
 * 6. Normalize the trailing slash: `/foo/` becomes `/foo`, but the bare root
 *    `/` is left as `/` (there is nothing to strip from it, and an empty
 *    path is not a valid URL path).
 * 7. Drop the fragment (`#...`). Fragments are a client-side scroll target,
 *    never part of a resource's identity.
 *
 * What this function deliberately does NOT do: resolve redirects, unify
 * `http` and `https` (either could be the "real" URL — we do not know without
 * a network round trip), or touch the case of the path or of query values.
 *
 * @throws {TypeError} if `url` is not a parseable absolute URL. This is a
 *   deterministic, synchronous failure — never a network error — because
 *   the WHATWG URL parser used here does no I/O.
 */
export function canonicalizeUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);

  // The URL parser already lowercases parsed.protocol and parsed.hostname.
  let hostname = parsed.hostname;
  if (hostname.startsWith('www.')) {
    hostname = hostname.slice('www.'.length);
  }

  let pathname = parsed.pathname;
  if (hostname === 'arxiv.org') {
    pathname = pathname.replace(/^\/pdf\/([^/]+?)(?:\.pdf)?$/i, '/abs/$1');
  }
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '');
    if (pathname === '') {
      pathname = '/';
    }
  }

  const survivingParams = Array.from(parsed.searchParams.entries())
    .filter(([key]) => !TRACKING_PARAM_DENYLIST.has(key.toLowerCase()))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const query = new URLSearchParams(survivingParams).toString();
  const port = parsed.port ? `:${parsed.port}` : '';

  return `${parsed.protocol}//${hostname}${port}${pathname}${query ? `?${query}` : ''}`;
}

// ---------------------------------------------------------------------------
// normalizeTitle
// ---------------------------------------------------------------------------

/**
 * Normalizes a title for matching/dedup purposes.
 *
 * The blog and paper corpus is Korean, Japanese, and English. A naive
 * `.toLowerCase()` pass is not sufficient for this corpus, for two reasons
 * that have nothing to do with case (CJK scripts don't have case):
 *
 * 1. **Composed vs. decomposed Hangul.** The same Korean text can be encoded
 *    as precomposed syllable blocks (NFC) or as decomposed Jamo sequences
 *    (NFD). These look identical when rendered and are semantically the same
 *    title, but are different code point sequences and would hash/compare as
 *    different strings without normalization.
 * 2. **Full-width vs. half-width forms.** Japanese (and Korean) text
 *    frequently mixes full-width Latin letters/digits/punctuation
 *    (e.g. "２０２４") with ordinary half-width ASCII ("2024") for the same
 *    logical content.
 *
 * `String.prototype.normalize('NFKC')` (Unicode compatibility decomposition
 * followed by canonical composition) resolves both: it unifies composed and
 * decomposed Hangul, and it folds full-width forms to their ASCII
 * equivalents. NFKC is chosen over NFC specifically for the full-width
 * folding, which NFC alone does not do.
 *
 * After NFKC, `.toLowerCase()` case-folds any remaining Latin text. This is
 * safe to run unconditionally: CJK characters have no case and pass through
 * unchanged, and plain `.toLowerCase()` (no locale argument) does not apply
 * the Turkish dotless-I exception that a locale-aware fold might.
 *
 * Punctuation is then stripped via the Unicode "Punctuation" (`\p{P}`)
 * category — deliberately *not* `\p{S}` (Symbol) — so that "Attention Is All
 * You Need!" and "attention is all you need" normalize identically, while a
 * meaningful symbol inside a title (e.g. "C++") is not silently reduced to
 * "C" by treating `+` as strippable punctuation.
 *
 * Finally, runs of whitespace collapse to a single space and the result is
 * trimmed, so punctuation removal that leaves behind a double space (e.g.
 * "foo: bar" -> "foo  bar") doesn't produce a spurious mismatch either.
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// computeContentHash
// ---------------------------------------------------------------------------

/**
 * The exact, explicit set of fields hashed by `computeContentHash`, in the
 * order they are hashed.
 *
 * This list IS the definition of "content" for staleness purposes: change
 * anything in this list and the hash changes; change anything else about an
 * item — including when it was last checked — and the hash must not change.
 *
 * Deliberately excluded, and why: `lastCheckedAt`, `fetchedAt`, `source`,
 * `itemId`, `provenance`, `statusHistory`, `signals`/`signalSheet`, and any
 * other operational or bookkeeping field. Every one of those changes on
 * essentially every re-fetch or re-crawl. Including any of them here would
 * mean every fetch invalidates every stored embedding — the exact failure
 * this function exists to prevent (see docs/decisions/research-item-identity.md,
 * "Content Hash"). `computeContentHash` does not merely avoid *reading* those
 * fields when present on the input; it structurally cannot, because it only
 * ever looks up the keys named here.
 */
export const CONTENT_HASH_FIELDS = ['title', 'abstract', 'authors', 'venue', 'year'] as const;

type ContentHashField = (typeof CONTENT_HASH_FIELDS)[number];

/**
 * Input to `computeContentHash`. Callers may pass the full canonical item —
 * only the keys in `CONTENT_HASH_FIELDS` are ever read; every other key
 * (volatile or not) is ignored.
 */
export type ContentHashInput = { [K in ContentHashField]?: unknown } & Record<string, unknown>;

/**
 * Computes a stable content hash over the explicit field subset defined by
 * `CONTENT_HASH_FIELDS`.
 *
 * Output form: `v1:sha256:<hex>`. Both the hash algorithm and a *definition
 * version* are encoded in the value itself, per
 * docs/decisions/research-item-identity.md ("Content Hash"): if the hashed
 * field set (`CONTENT_HASH_FIELDS`) ever changes, the version prefix must
 * bump too, so a hash computed under an old definition stays interpretable
 * as "old-version hash" rather than silently comparing equal or unequal to a
 * new-version one for the wrong reason.
 *
 * Two properties are guaranteed and tested:
 *
 * - **Stable across field reordering.** The hash is computed from an array
 *   of `[fieldName, value]` pairs built by iterating `CONTENT_HASH_FIELDS`
 *   in its own fixed order — never from `Object.keys(fields)` — so the key
 *   order of the object a caller happens to pass in is irrelevant.
 * - **Insensitive to volatile fields.** A field not listed in
 *   `CONTENT_HASH_FIELDS` (e.g. `lastCheckedAt`) is never read, so its
 *   presence, absence, or value cannot affect the hash. A missing optional
 *   field and an explicit `null` are also treated identically (both become
 *   `null` in the hashed payload), so "field omitted" and "field explicitly
 *   cleared" hash the same way.
 */
export function computeContentHash(fields: ContentHashInput): string {
  const canonicalPairs = CONTENT_HASH_FIELDS.map(
    (key) => [key, fields[key] ?? null] as const,
  );
  const payload = JSON.stringify(canonicalPairs);
  const digest = createHash('sha256').update(payload, 'utf8').digest('hex');
  return `v1:sha256:${digest}`;
}

// ---------------------------------------------------------------------------
// normalizeExternalIdentifier
// ---------------------------------------------------------------------------

/**
 * Per-scheme normalization for an external identifier, applied before it is
 * written to the identifier index and before it is looked up — the same
 * rule both times, per docs/decisions/research-item-identity.md ("External
 * Identifier Map"): "normalization is part of the scheme definition, applied
 * before storage and before index lookup." An unnormalized identifier is a
 * silent dedup failure (two spellings of the same DOI never colliding in the
 * index).
 *
 * This function is exported beyond the four functions named in the T06 task
 * packet's Implementation Steps, because `deriveDedupKey` cannot combine
 * "identifiers per T01" (per the task's own wording) without per-scheme
 * normalization existing somewhere, and docs/decisions/research-item-identity.md
 * explicitly assigns that table to T06 ("The full normalization table is
 * T06's to write and test"). It is flagged as a fifth export in this task's
 * handoff rather than added silently.
 *
 * Only `doi` and `arxiv` have corpus-evidenced normalization rules today
 * (both are named explicitly in research-item-identity.md's External
 * Identifier Map section). Every other scheme in T01's initial registry
 * (`openreview`, `dblp`, `openalex`, `semanticscholar`, `acmdl`, `ieee`) gets
 * a conservative trim+lowercase default — the same "thin evidence, don't
 * over-specify" posture research-item-identity.md itself takes for C2's
 * acceptance-status vocabulary. A scheme-specific rule belongs here the
 * first time real data shows it is needed, not speculatively.
 */
export function normalizeExternalIdentifier(scheme: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  switch (scheme.trim().toLowerCase()) {
    case 'doi':
      // DOIs are case-insensitive per the DOI Handbook and commonly arrive
      // as a full resolver URL rather than a bare DOI; strip the resolver
      // prefix so "10.1000/xyz" and "https://doi.org/10.1000/xyz" collide in
      // the identifier index the way they should.
      return trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();

    case 'arxiv':
      // Stored without the version suffix: v1 and v2 of the same preprint
      // are the same work, and the version is recorded separately (in
      // statusHistory / the raw identifier), not folded into the identity
      // key. Also strips a leading "arXiv:" label some sources prepend.
      return trimmed.replace(/^arxiv:/i, '').replace(/v\d+$/i, '').toLowerCase();

    case 'url':
      // Reuse the same URL canonicalization used for an item's primary
      // canonical URL, so an identical landing page normalizes the same way
      // no matter which field it arrived through.
      return canonicalizeUrl(trimmed);

    default:
      return trimmed.toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// deriveDedupKey
// ---------------------------------------------------------------------------

/** A strong or weak external identifier attached to an incoming record. */
export interface ExternalIdentifierInput {
  scheme: string;
  value: string;
}

/**
 * Input to `deriveDedupKey`: whatever an incoming record (paper, repo, blog
 * post) is able to supply. Every field is optional because, per
 * docs/decisions/research-item-identity.md, "an item with only an arXiv ID —
 * or with no external identifier at all, only a canonical URL — is a
 * complete, fully-keyed item."
 */
export interface DedupKeyInput {
  url?: string | null;
  title?: string | null;
  externalIds?: ReadonlyArray<ExternalIdentifierInput>;
}

/**
 * Derives the set of identifier-index lookup keys for an incoming record.
 *
 * **This produces lookup keys for the `(scheme, normalized value) -> itemId`
 * identifier index defined in docs/decisions/research-item-identity.md
 * ("Resolution: How An Incoming Record Finds Its Item") — it does NOT
 * produce, mint, or stand in for an `itemId`.** The item ID is opaque, minted
 * once, and lives only in the private canonical item; this function has no
 * access to it and makes no claim about it. Each string this function
 * returns is one candidate `(scheme, value)` pair, serialized as
 * `"<scheme>:<normalized value>"`, that the caller looks up against that
 * index. Zero, one, or several matching `itemId`s coming back is exactly the
 * three-way branch ("no match" / "one match" / "two or more distinct
 * matches") that record describes — this function only produces the keys to
 * look up, never resolves them.
 *
 * Included, in order of how they are combined (URL, then title, then
 * identifiers — matching the task's own description):
 *
 * - `url:<canonicalized url>` when a `url` is given. Per T01, a canonicalized
 *   URL is a valid index entry but is explicitly **not strong** — a landing
 *   page can be shared by an abstract page and its PDF, or by two distinct
 *   works sharing one project page — so a match on this key alone must never
 *   trigger an automatic merge upstream; it only narrows candidates.
 * - `title:<normalized title>` when a `title` is given, via `normalizeTitle`.
 *   Also not strong, for the same reason (title collisions happen).
 * - `<scheme>:<normalized value>` for every entry in `externalIds`, via
 *   `normalizeExternalIdentifier`. Whether a given scheme counts as *strong*
 *   for merge purposes is the scheme registry's concern (data, per
 *   shared-context.md §4), not this function's — this function only
 *   normalizes and formats the key.
 *
 * A record missing a piece (no title, no external IDs, just a URL) simply
 * contributes fewer keys — this never throws for that reason. An
 * unparseable `url` is likewise skipped rather than thrown: one bad URL on
 * one incoming record must not abort dedup for the whole batch.
 *
 * Returned as a **sorted, deduplicated array** so two calls describing the
 * same record in a different field order produce byte-identical output.
 */
export function deriveDedupKey(item: DedupKeyInput): string[] {
  const keys = new Set<string>();

  if (item.url) {
    try {
      keys.add(`url:${canonicalizeUrl(item.url)}`);
    } catch {
      // Not this function's job to validate URLs; an unusable one just
      // contributes no key rather than failing the whole derivation.
    }
  }

  if (item.title) {
    const normalized = normalizeTitle(item.title);
    if (normalized) {
      keys.add(`title:${normalized}`);
    }
  }

  for (const { scheme, value } of item.externalIds ?? []) {
    const normalizedValue = normalizeExternalIdentifier(scheme, value);
    if (normalizedValue) {
      keys.add(`${scheme.trim().toLowerCase()}:${normalizedValue}`);
    }
  }

  return Array.from(keys).sort();
}
