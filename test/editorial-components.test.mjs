import assert from 'node:assert/strict';
import test from 'node:test';
import { compile } from '@mdx-js/mdx';
import remarkEditorialComponents from '../src/utils/remark-editorial-components.mjs';

function compileAt(path, value) {
	return compile({ path, value }, { remarkPlugins: [remarkEditorialComponents] }).then(String);
}

test('blog MDX can use editorial components without imports', async () => {
	const output = await compileAt('/repo/src/content/blog/ko/study/draft.mdx', '<Compare labelA="A" labelB="B" />');
	assert.match(output, /import Compare from "[^"]+\/components\/editorial\/Compare\.astro"/);
	assert.doesNotMatch(output, /import FolderTree/);
});

test('explicit MDX bindings and non-blog MDX are left alone', async () => {
	const custom = await compileAt('/repo/src/content/blog/en/study/draft.mdx', "import Compare from './custom.astro';\n\n<Compare />");
	assert.match(custom, /import Compare from '.\/custom\.astro'/);
	assert.doesNotMatch(custom, /components\/editorial\/Compare\.astro/);
	const review = await compileAt('/repo/src/content/academic-reviews/ko/example.mdx', '<Compare />');
	assert.doesNotMatch(review, /components\/editorial\/Compare\.astro/);
});
