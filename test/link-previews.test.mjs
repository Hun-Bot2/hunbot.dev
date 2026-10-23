import assert from 'node:assert/strict';
import test from 'node:test';

import { lookupPreview, pickLocalized } from '../src/utils/link-previews.ts';

const items = {
	'/blog/x/': { kind: 'post', title: { ko: '글', en: 'Post' }, description: { ko: '설명' } },
	'/library/explainers/e/': { kind: 'explainer', title: { ko: '해설' }, description: { ko: '요약' } },
};

test('lookupPreview matches a target in any language and ignores query and hash', () => {
	assert.equal(lookupPreview(items, '/en/blog/x/?a=1#h')?.kind, 'post');
	assert.equal(lookupPreview(items, '/jp/library/explainers/e')?.kind, 'explainer');
});

test('an unpublished or unknown target has no preview', () => {
	assert.equal(lookupPreview(items, '/ko/blog/draft-post/'), null);
});

test('pickLocalized falls back to Korean, then to anything', () => {
	assert.equal(pickLocalized(items['/blog/x/'].title, 'en'), 'Post');
	assert.equal(pickLocalized(items['/blog/x/'].title, 'jp'), '글');
	assert.equal(pickLocalized({ en: 'Only' }, 'jp'), 'Only');
	assert.equal(pickLocalized({}, 'ko'), '');
});
