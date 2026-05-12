import assert from 'node:assert/strict';
import test from 'node:test';
import {
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
