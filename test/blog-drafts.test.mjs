import test from 'node:test';
import assert from 'node:assert/strict';
import { draftMetadata } from '../src/loaders/blog.ts';

test('metadata-free notes are always drafts, with a stable placeholder date', () => {
	const result = draftMetadata('ko/study/new-note', {});
	assert.equal(result.draft, true);
	assert.equal(result.title, 'new-note');
	assert.equal(result.pubDate.toISOString(), '1970-01-01T00:00:00.000Z');
});

test('existing and incomplete frontmatter is preserved for schema validation', () => {
	for (const data of [{ title: 'Incomplete' }, { title: 'Astra', draft: true }, { draft: false }]) {
		assert.equal(draftMetadata('ko/study/astra', data), data);
	}
});
