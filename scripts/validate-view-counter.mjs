import assert from 'node:assert/strict';

import {
	VIEW_RATE_LIMIT_MAX_REQUESTS,
	VIEW_RATE_LIMIT_WINDOW_SECONDS,
	getPageviewsKey,
	getViewClientId,
	getViewHistoryKey,
	getViewRateLimitKey,
	isValidViewSlug,
} from '../src/utils/view-counter.ts';

assert.equal(isValidViewSlug('ko/devlog/blog/blog_develop_10'), true);
assert.equal(isValidViewSlug('en/research/ai-agents/example'), true);
assert.equal(isValidViewSlug('jp/paper/wmt2025_tagged_span'), true);

for (const unsafeSlug of [
	null,
	'',
	'fr/devlog/example',
	'ko/../secret',
	'ko/devlog?x=1',
	'https://hun-bot.dev/ko/blog/example',
	'ko/devlog/#hash',
	`ko/${'a'.repeat(200)}`,
]) {
	assert.equal(isValidViewSlug(unsafeSlug), false, `${unsafeSlug} should be rejected.`);
}

assert.equal(getPageviewsKey('ko/devlog/blog/blog_develop_10'), 'pageviews:ko/devlog/blog/blog_develop_10');
assert.equal(getViewClientId('203.0.113.7, 198.51.100.1'), '203.0.113.7');
assert.equal(getViewClientId('2001:db8::1, 198.51.100.1'), '2001:db8::1');
assert.equal(getViewClientId('bad/path, 203.0.113.7'), 'unknown-client');
assert.equal(getViewClientId(null), 'unknown-client');

const historyKey = getViewHistoryKey('203.0.113.7, ignored', 'ko/devlog/blog/blog_develop_10');
assert.equal(historyKey, 'history:203.0.113.7:ko/devlog/blog/blog_develop_10');
assert.equal(getViewRateLimitKey('bad/path'), 'ratelimit:views:unknown-client');
assert.ok(VIEW_RATE_LIMIT_WINDOW_SECONDS > 0);
assert.ok(VIEW_RATE_LIMIT_MAX_REQUESTS > 0);

console.log('Validated view counter slug safety, client parsing, and key builders.');
