import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalizeUrl,
  normalizeTitle,
  computeContentHash,
  normalizeExternalIdentifier,
  deriveDedupKey,
  CONTENT_HASH_FIELDS,
} from '../src/utils/canonicalization.ts';

// ---------------------------------------------------------------------------
// canonicalizeUrl
// ---------------------------------------------------------------------------

test('canonicalizeUrl: lowercases scheme and host, preserves path case', () => {
  assert.equal(
    canonicalizeUrl('HTTPS://EXAMPLE.COM/Some/Path'),
    'https://example.com/Some/Path',
  );
});

test('canonicalizeUrl: strips a leading www. label', () => {
  assert.equal(canonicalizeUrl('https://www.example.com/post'), 'https://example.com/post');
});

test('canonicalizeUrl: does not strip a lookalike host that is not exactly "www."', () => {
  // www2.example.com and wwwx.example.com are distinct hosts that may serve
  // different content; only the literal "www." label is a safe strip.
  assert.equal(canonicalizeUrl('https://www2.example.com/'), 'https://www2.example.com/');
  assert.equal(canonicalizeUrl('https://wwwexample.com/'), 'https://wwwexample.com/');
});

test('canonicalizeUrl: strips known tracking parameters', () => {
  const url =
    'https://example.com/post?utm_source=twitter&utm_medium=social&fbclid=abc123&gclid=xyz';
  assert.equal(canonicalizeUrl(url), 'https://example.com/post');
});

test('canonicalizeUrl: preserves meaningful parameters not on the denylist', () => {
  // v=2 (a version) and id/paper-id style params are identity, not tracking.
  assert.equal(
    canonicalizeUrl('https://example.com/paper?v=2&id=123'),
    'https://example.com/paper?id=123&v=2',
  );
});

test('canonicalizeUrl: mixes tracking and meaningful params, keeping only the meaningful ones', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/paper?utm_campaign=x&paperId=42&ref=hn'),
    'https://example.com/paper?paperId=42',
  );
});

test('canonicalizeUrl: sorts surviving parameters regardless of input order', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/x?b=2&a=1&c=3'),
    canonicalizeUrl('https://example.com/x?c=3&a=1&b=2'),
  );
  assert.equal(canonicalizeUrl('https://example.com/x?b=2&a=1&c=3'), 'https://example.com/x?a=1&b=2&c=3');
});

test('canonicalizeUrl: preserves relative order of repeated parameter names', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/x?tag=b&tag=a'),
    'https://example.com/x?tag=b&tag=a',
  );
});

test('canonicalizeUrl: normalizes a trailing slash off a non-root path', () => {
  assert.equal(canonicalizeUrl('https://example.com/post/'), 'https://example.com/post');
});

test('canonicalizeUrl: leaves the bare root path alone', () => {
  assert.equal(canonicalizeUrl('https://example.com/'), 'https://example.com/');
  assert.equal(canonicalizeUrl('https://example.com'), 'https://example.com/');
});

test('canonicalizeUrl: drops the fragment', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/post#section-2'),
    'https://example.com/post',
  );
});

test('canonicalizeUrl: http and https are normalized in case but never unified with each other', () => {
  assert.equal(canonicalizeUrl('HTTP://example.com/post'), 'http://example.com/post');
  assert.equal(canonicalizeUrl('HTTPS://example.com/post'), 'https://example.com/post');
  // Different schemes remain different canonical URLs: without a network
  // round trip this function cannot know whether http and https serve the
  // same resource, so it must not guess.
  assert.notEqual(
    canonicalizeUrl('http://example.com/post'),
    canonicalizeUrl('https://example.com/post'),
  );
});

test('canonicalizeUrl: throws a TypeError on an unparseable URL, synchronously', () => {
  assert.throws(() => canonicalizeUrl('not a url'), TypeError);
});

test('canonicalizeUrl: drops the default port but keeps a non-default one', () => {
  assert.equal(canonicalizeUrl('https://example.com:443/post'), 'https://example.com/post');
  assert.equal(canonicalizeUrl('https://example.com:8443/post'), 'https://example.com:8443/post');
});

test('canonicalizeUrl: arXiv abs/pdf/pdf.pdf forms normalize to the same canonical URL', () => {
  const abs = canonicalizeUrl('https://arxiv.org/abs/2401.12345');
  const pdf = canonicalizeUrl('https://arxiv.org/pdf/2401.12345');
  const pdfWithExt = canonicalizeUrl('https://arxiv.org/pdf/2401.12345.pdf');
  assert.equal(abs, 'https://arxiv.org/abs/2401.12345');
  assert.equal(pdf, abs);
  assert.equal(pdfWithExt, abs);
});

test('canonicalizeUrl: arXiv version suffix is preserved, not stripped, by URL canonicalization', () => {
  // The version is part of the path-embedded id here; whether v1 and v2
  // collapse to one *work* is a dedup-key decision, not something this
  // function is allowed to decide silently.
  assert.equal(
    canonicalizeUrl('https://arxiv.org/pdf/2401.12345v2.pdf'),
    'https://arxiv.org/abs/2401.12345v2',
  );
  assert.notEqual(
    canonicalizeUrl('https://arxiv.org/abs/2401.12345v1'),
    canonicalizeUrl('https://arxiv.org/abs/2401.12345v2'),
  );
});

// ---------------------------------------------------------------------------
// normalizeTitle
// ---------------------------------------------------------------------------

test('normalizeTitle: case-folds ASCII', () => {
  assert.equal(normalizeTitle('Attention Is All You Need'), normalizeTitle('attention is all you need'));
});

test('normalizeTitle: strips punctuation', () => {
  assert.equal(
    normalizeTitle('Attention Is All You Need!'),
    normalizeTitle('Attention Is All You Need'),
  );
  assert.equal(normalizeTitle('Attention Is All You Need!'), 'attention is all you need');
});

test('normalizeTitle: collapses whitespace left behind by punctuation removal', () => {
  assert.equal(normalizeTitle('foo: bar'), normalizeTitle('foo bar'));
  assert.equal(normalizeTitle('  foo   bar  '), 'foo bar');
});

test('normalizeTitle: does not strip meaningful symbols like the ++ in a language name', () => {
  // \p{P} (punctuation) is stripped, but \p{S} (symbol, which + belongs to)
  // is deliberately left alone so "C++" is not silently reduced to "c".
  assert.equal(normalizeTitle('Learning C++ Safely'), 'learning c++ safely');
});

test('normalizeTitle: Korean precomposed (NFC) and decomposed (NFD) Hangul normalize identically', () => {
  const precomposed = '딥러닝을 활용한 자연어 처리';
  const decomposed = precomposed.normalize('NFD');
  assert.notEqual(precomposed, decomposed, 'test fixture must actually differ at the code-point level');
  assert.equal(normalizeTitle(precomposed), normalizeTitle(decomposed));
});

test('normalizeTitle: Japanese full-width digits/letters normalize to half-width equivalents', () => {
  assert.equal(
    normalizeTitle('AI論文２０２４年版'),
    normalizeTitle('AI論文2024年版'),
  );
});

test('normalizeTitle: Japanese full-width colon (common in JP typography) normalizes like its ASCII form', () => {
  // NFKC maps the full-width colon "：" to ASCII ":", which is then stripped
  // as punctuation the same way an ASCII colon would be.
  assert.equal(
    normalizeTitle('大規模言語モデルの研究:2024年'),
    normalizeTitle('大規模言語モデルの研究：2024年'),
  );
});

test('normalizeTitle: distinct titles remain distinct after normalization', () => {
  assert.notEqual(normalizeTitle('Attention Is All You Need'), normalizeTitle('Deep Residual Learning'));
});

// ---------------------------------------------------------------------------
// computeContentHash
// ---------------------------------------------------------------------------

test('computeContentHash: output matches the v1:sha256:<hex> form', () => {
  const hash = computeContentHash({ title: 'Attention Is All You Need' });
  assert.match(hash, /^v1:sha256:[0-9a-f]{64}$/);
});

test('computeContentHash: identical field sets hash identically', () => {
  const a = computeContentHash({ title: 'A Paper', abstract: 'about things', year: 2024 });
  const b = computeContentHash({ title: 'A Paper', abstract: 'about things', year: 2024 });
  assert.equal(a, b);
});

test('computeContentHash: is stable across key reordering of the input object', () => {
  const a = computeContentHash({ title: 'A Paper', abstract: 'about things', venue: 'ICLR', year: 2024 });
  const b = computeContentHash({ year: 2024, venue: 'ICLR', title: 'A Paper', abstract: 'about things' });
  assert.equal(a, b);
});

test('computeContentHash: a changed content field changes the hash', () => {
  const a = computeContentHash({ title: 'A Paper' });
  const b = computeContentHash({ title: 'A Different Paper' });
  assert.notEqual(a, b);
});

test('computeContentHash: excludes volatile fields such as lastCheckedAt — proof', () => {
  const first = computeContentHash({
    title: 'A Paper',
    abstract: 'about things',
    lastCheckedAt: '2026-01-01',
    fetchedAt: '2026-01-01',
  });
  const later = computeContentHash({
    title: 'A Paper',
    abstract: 'about things',
    lastCheckedAt: '2026-09-14',
    fetchedAt: '2026-09-14T12:00:00Z',
  });
  assert.equal(first, later, 'a re-fetch that only updates timestamps must not change the content hash');
});

test('computeContentHash: an omitted optional field and an explicit null hash identically', () => {
  const omitted = computeContentHash({ title: 'A Paper' });
  const explicitNull = computeContentHash({ title: 'A Paper', abstract: null, venue: null, year: null, authors: null });
  assert.equal(omitted, explicitNull);
});

test('computeContentHash: only reads fields named in CONTENT_HASH_FIELDS', () => {
  assert.deepEqual([...CONTENT_HASH_FIELDS], ['title', 'abstract', 'authors', 'venue', 'year']);
});

// ---------------------------------------------------------------------------
// normalizeExternalIdentifier
// ---------------------------------------------------------------------------

test('normalizeExternalIdentifier: doi strips the resolver prefix and lowercases', () => {
  assert.equal(normalizeExternalIdentifier('doi', 'https://doi.org/10.1000/XYZ123'), '10.1000/xyz123');
  assert.equal(normalizeExternalIdentifier('doi', '10.1000/XYZ123'), '10.1000/xyz123');
});

test('normalizeExternalIdentifier: arxiv strips version suffix and an "arXiv:" label', () => {
  assert.equal(normalizeExternalIdentifier('arxiv', '2401.12345v2'), '2401.12345');
  assert.equal(normalizeExternalIdentifier('arxiv', 'arXiv:2401.12345v1'), '2401.12345');
  assert.equal(normalizeExternalIdentifier('arxiv', '2401.12345'), '2401.12345');
});

test('normalizeExternalIdentifier: url scheme reuses canonicalizeUrl', () => {
  assert.equal(
    normalizeExternalIdentifier('url', 'HTTPS://WWW.Example.com/Post/?utm_source=x'),
    'https://example.com/Post',
  );
});

test('normalizeExternalIdentifier: unlisted schemes get a conservative trim+lowercase default', () => {
  assert.equal(normalizeExternalIdentifier('dblp', '  Conf/ICLR/Foo2024  '), 'conf/iclr/foo2024');
  assert.equal(normalizeExternalIdentifier('openalex', 'W123456789'), 'w123456789');
});

// ---------------------------------------------------------------------------
// deriveDedupKey
// ---------------------------------------------------------------------------

test('deriveDedupKey: combines url, title, and external identifiers into sorted keys', () => {
  const keys = deriveDedupKey({
    url: 'https://arxiv.org/abs/2401.12345',
    title: 'Attention Is All You Need',
    externalIds: [{ scheme: 'arxiv', value: '2401.12345' }],
  });
  assert.deepEqual(
    keys,
    [
      'arxiv:2401.12345',
      'title:attention is all you need',
      'url:https://arxiv.org/abs/2401.12345',
    ].sort(),
  );
});

test('deriveDedupKey: a record with only a URL still produces a complete key set', () => {
  const keys = deriveDedupKey({ url: 'https://example.com/some-project' });
  assert.deepEqual(keys, ['url:https://example.com/some-project']);
});

test('deriveDedupKey: an unparseable url is skipped instead of throwing', () => {
  const keys = deriveDedupKey({ url: 'not a url', title: 'A Paper' });
  assert.deepEqual(keys, ['title:a paper']);
});

test('deriveDedupKey: is stable regardless of the order fields are supplied in', () => {
  const a = deriveDedupKey({
    url: 'https://example.com/x',
    title: 'A Paper',
    externalIds: [{ scheme: 'doi', value: '10.1/abc' }],
  });
  const b = deriveDedupKey({
    externalIds: [{ scheme: 'doi', value: '10.1/abc' }],
    title: 'A Paper',
    url: 'https://example.com/x',
  });
  assert.deepEqual(a, b);
});

test('deriveDedupKey: a paper record and a repo record sharing an arXiv id share an index key', () => {
  // This is the "same work as paper and repo" case: a paper's landing page
  // and a GitHub repo for the same work have unrelated URLs and unrelated
  // titles, but if the repo's README-derived record also carries the
  // paper's arXiv id as an external identifier, the two records must
  // produce at least one overlapping lookup key — the mechanism by which
  // the identifier index would resolve them to the same itemId.
  const paperRecord = deriveDedupKey({
    url: 'https://arxiv.org/abs/2401.12345',
    title: 'A Great Paper About Transformers',
    externalIds: [{ scheme: 'arxiv', value: '2401.12345v2' }],
  });
  const repoRecord = deriveDedupKey({
    url: 'https://github.com/some-org/some-repo',
    title: 'some-org/some-repo',
    externalIds: [{ scheme: 'arxiv', value: '2401.12345' }],
  });

  const overlap = paperRecord.filter((key) => repoRecord.includes(key));
  assert.deepEqual(overlap, ['arxiv:2401.12345']);
});

test('deriveDedupKey: two arXiv versions of the same preprint share the arxiv identifier key', () => {
  const v1 = deriveDedupKey({ externalIds: [{ scheme: 'arxiv', value: '2401.12345v1' }] });
  const v2 = deriveDedupKey({ externalIds: [{ scheme: 'arxiv', value: '2401.12345v2' }] });
  assert.deepEqual(v1, v2);
});
