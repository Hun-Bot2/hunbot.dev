import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { decks } from '../src/data/decks.ts';
import { learningPaths } from '../src/data/learningPaths.ts';
import { learningPathLanguages, normalizeLearningPathRef } from '../src/utils/learning-paths.ts';

const root = process.cwd();
const slugSafe = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const dateString = /^\d{4}-\d{2}-\d{2}$/;
const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.['paths:validate'] ?? '', /validate-learning-paths\.mjs/);
assert.ok(existsSync(join(root, 'src/pages/[lang]/paths.astro')), 'Path index route should exist.');
assert.ok(existsSync(join(root, 'src/pages/[lang]/paths/[path].astro')), 'Path detail route should exist.');

const pathIndexPage = read('src/pages/[lang]/paths.astro');
const pathDetailPage = read('src/pages/[lang]/paths/[path].astro');
assert.match(pathIndexPage, /data-pagefind-body/);
assert.match(pathIndexPage, /data-pagefind-filter="section\[content\]"/);
assert.match(pathDetailPage, /data-pagefind-filter="path\[content\]"/);

const blogIds = new Set(readBlogIds());
const resourceIds = new Set(readJsonFrontmatterIds('src/content/resources'));
const paperIds = new Set(readJsonFrontmatterIds('src/content/papers'));
const topicIds = new Set(readJsonFrontmatterIds('src/content/topics'));
const deckIds = new Set(decks.map((deck) => deck.id));
const seenPathIds = new Set();

for (const path of learningPaths) {
	assert.match(path.id, slugSafe, `Learning path id is not slug-safe: ${path.id}`);
	assert.equal(seenPathIds.has(path.id), false, `Duplicate learning path id: ${path.id}`);
	seenPathIds.add(path.id);

	assert.ok(['draft', 'published', 'archived'].includes(path.status), `${path.id} has invalid status.`);
	assert.match(path.updatedAt, dateString, `${path.id}.updatedAt should use YYYY-MM-DD.`);
	assert.ok(path.title.ko, `${path.id} should include title.ko.`);
	assert.ok(path.description.ko, `${path.id} should include description.ko.`);
	assert.ok(Number.isInteger(path.minimumSteps) && path.minimumSteps >= 1, `${path.id}.minimumSteps must be >= 1.`);
	assert.ok(Array.isArray(path.steps), `${path.id}.steps must be an array.`);

	if (path.status === 'published') {
		assert.ok(path.steps.length >= path.minimumSteps, `${path.id} needs enough authored steps before publication.`);
	}

	for (const topicId of path.topicIds) {
		assert.ok(topicIds.has(topicId), `${path.id} references unknown topic: ${topicId}`);
	}

	for (const resourceId of path.resourceIds) {
		assert.ok(resourceIds.has(resourceId), `${path.id} references unknown resource: ${resourceId}`);
	}

	for (const paperId of path.paperIds) {
		assert.ok(paperIds.has(paperId), `${path.id} references unknown paper: ${paperId}`);
	}

	for (const deckId of path.deckIds) {
		assert.ok(deckIds.has(deckId), `${path.id} references unknown deck: ${deckId}`);
	}

	const seenStepIds = new Set();
	for (const step of path.steps) {
		assert.match(step.id, slugSafe, `${path.id} has invalid step id: ${step.id}`);
		assert.equal(seenStepIds.has(step.id), false, `${path.id} has duplicate step id: ${step.id}`);
		seenStepIds.add(step.id);
		assert.ok(step.title.ko, `${path.id}/${step.id} should include title.ko.`);
		assert.ok(step.note.ko, `${path.id}/${step.id} should include note.ko.`);
		assert.ok(step.fallbackPostId, `${path.id}/${step.id} should include fallbackPostId.`);
		assert.ok(
			blogIds.has(normalizeLearningPathRef(step.fallbackPostId)),
			`${path.id}/${step.id} fallbackPostId does not exist: ${step.fallbackPostId}`,
		);

		for (const lang of learningPathLanguages) {
			const postId = step.postIds[lang];
			if (!postId) continue;
			assert.ok(
				blogIds.has(normalizeLearningPathRef(postId)),
				`${path.id}/${step.id} references unknown ${lang} post: ${postId}`,
			);
		}
	}
}

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	for (const lang of learningPathLanguages) {
		const indexPath = join(outputRoot, lang, 'paths', 'index.html');
		if (!existsSync(indexPath)) continue;

		const html = readFile(indexPath);
		assert.match(html, /data-pagefind-body/);

		for (const path of learningPaths.filter((item) => item.status === 'published')) {
			const detailPath = join(outputRoot, lang, 'paths', path.id, 'index.html');
			assert.ok(existsSync(detailPath), `${relative(root, detailPath)} should exist after build.`);
		}
	}
}

console.log(`Validated ${learningPaths.length} learning path definitions.`);

function read(path) {
	return readFileSync(join(root, path), 'utf8');
}

function readFile(path) {
	return readFileSync(path, 'utf8');
}

function readBlogIds() {
	const blogRoot = join(root, 'src/content/blog');
	if (!existsSync(blogRoot)) return [];

	return walk(blogRoot)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => normalizeLearningPathRef(relative(blogRoot, filePath)));
}

function readJsonFrontmatterIds(directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const source = readFile(filePath);
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			assert.ok(match, `${relative(root, filePath)} is missing frontmatter.`);
			return JSON.parse(match[1]).id;
		});
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}
