import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDeploymentKeyNamespace,
  getPageviewsKey,
  getViewHistoryKey,
  isValidViewSlug,
} from '../src/utils/view-counter.ts';

test('accepts generated blog content ids used as view slugs', () => {
  assert.equal(isValidViewSlug('ko/devlog/BLOG/Blog_Develop_10'), true);
  assert.equal(isValidViewSlug('jp/contemplation/After_interview'), true);
  assert.equal(isValidViewSlug('en/notes/how2make_resume'), true);
  assert.equal(isValidViewSlug('ko/tech/공부'), true);
});

test('rejects malformed or unsafe view slugs', () => {
  assert.equal(isValidViewSlug(null), false);
  assert.equal(isValidViewSlug(''), false);
  assert.equal(isValidViewSlug('/ko/devlog/BLOG/Blog_Develop_10'), false);
  assert.equal(isValidViewSlug('ko'), false);
  assert.equal(isValidViewSlug('ko/'), false);
  assert.equal(isValidViewSlug('fr/devlog/post'), false);
  assert.equal(isValidViewSlug('ko/devlog/../post'), false);
  assert.equal(isValidViewSlug('ko/devlog/post?x=1'), false);
  assert.equal(isValidViewSlug('ko/devlog/post#section'), false);
  assert.equal(isValidViewSlug('ko/devlog/post:extra'), false);
  assert.equal(isValidViewSlug('ko/devlog/post name'), false);
});

test('builds Redis keys only for valid slugs', () => {
  assert.equal(
    getPageviewsKey('ko/devlog/BLOG/Blog_Develop_10'),
    'pageviews:ko/devlog/BLOG/Blog_Develop_10'
  );
  assert.equal(
    getViewHistoryKey('2001:db8::1', 'ko/devlog/BLOG/Blog_Develop_10'),
    'history:2001%3Adb8%3A%3A1:ko/devlog/BLOG/Blog_Develop_10'
  );

  assert.throws(() => getPageviewsKey('ko/devlog/post:extra'), /Invalid view slug/);
  assert.throws(() => getViewHistoryKey('127.0.0.1', 'ko/devlog/post name'), /Invalid view slug/);
});

test('production and non-Vercel environments keep the historical key prefixes', () => {
  // If this ever changes, every stored pageview count is orphaned in Redis with no
  // migration and no error — the counter would silently restart from zero on the live site.
  assert.equal(getDeploymentKeyNamespace('production'), '');
  assert.equal(getDeploymentKeyNamespace(undefined), '');
});

test('every other deployment environment gets its own namespace', () => {
  assert.equal(getDeploymentKeyNamespace('preview'), 'preview:');
  assert.equal(getDeploymentKeyNamespace('development'), 'development:');
  // An environment Vercel has not introduced yet still gets isolated rather than
  // falling through to production's keyspace.
  assert.equal(getDeploymentKeyNamespace('staging'), 'staging:');
});

test('a preview deployment cannot produce a key production reads', () => {
  const slug = 'ko/devlog/BLOG/Blog_Develop_10';
  const clientId = '2001:db8::1';

  // The env argument is threaded in rather than mutating process.env, so the assertion
  // holds regardless of where the test runs.
  const preview = (key) => `${getDeploymentKeyNamespace('preview')}${key}`;
  const production = (key) => `${getDeploymentKeyNamespace('production')}${key}`;

  for (const key of [
    `pageviews:${slug}`,
    `history:2001%3Adb8%3A%3A1:${slug}`,
    `ratelimit:views:2001%3Adb8%3A%3A1`,
    'feedback:inbox',
    `ratelimit:feedback:2001%3Adb8%3A%3A1`,
  ]) {
    assert.notEqual(preview(key), production(key));
    assert.ok(preview(key).startsWith('preview:'));
  }

  // And the real builders agree with that model on the default (test) environment.
  assert.equal(getPageviewsKey(slug), `pageviews:${slug}`);
  assert.equal(getViewHistoryKey(clientId, slug), `history:2001%3Adb8%3A%3A1:${slug}`);
});
