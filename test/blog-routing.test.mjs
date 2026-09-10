import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getBlogLanguageFromId,
  getBlogSlugFromId,
  getBlogUrlFromId,
} from '../src/utils/blog-routing.ts';

// Content ids keep their on-disk casing; generated URLs are lowercased so a
// rename that only changes case cannot silently produce a second URL.
test('builds localized blog URLs from content ids', () => {
  assert.equal(
    getBlogUrlFromId('ko/devlog/BLOG/Blog_Develop_10'),
    '/ko/blog/devlog/blog/blog_develop_10/'
  );
  assert.equal(
    getBlogUrlFromId('jp/contemplation/After_interview'),
    '/jp/blog/contemplation/after_interview/'
  );
  assert.equal(
    getBlogUrlFromId('en/notes/how2make_resume'),
    '/en/blog/notes/how2make_resume/'
  );
});

test('extracts language and slug from nested content ids', () => {
  assert.equal(getBlogLanguageFromId('ko/tech/CHAT/Chatting-System01'), 'ko');
  // Slugs are lowercased so generated URLs are case-stable; the built site
  // serves /ko/blog/technical_note/chat/chatting-system01/.
  assert.equal(getBlogSlugFromId('ko/tech/CHAT/Chatting-System01'), 'tech/chat/chatting-system01');
});

test('rejects content ids without a supported language prefix', () => {
  assert.throws(() => getBlogUrlFromId('devlog/BLOG/Blog_Develop_10'), /Invalid blog content id/);
  assert.throws(() => getBlogUrlFromId('ko'), /Invalid blog content id/);
  assert.throws(() => getBlogUrlFromId('ko/'), /Invalid blog content id/);
});
