import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { decks } from '../src/data/decks.ts';
import { mediaCompanions } from '../src/data/mediaCompanions.ts';

const root = process.cwd();
const slugSafe = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const dateString = /^\d{4}-\d{2}-\d{2}$/;
const statuses = new Set(['idea', 'draft', 'review', 'published', 'archived']);
const artifactStatuses = new Set(['not-planned', 'planned', 'draft', 'reviewed', 'published']);
const languages = new Set(['ko', 'jp', 'en', 'multi']);
const forbiddenFieldNames = new Set(['rawtranscript', 'rawhtml', 'fulltranscript', 'largecopiedtext']);

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['media:validate'] ?? '', /validate-media-companions\.mjs/);
assert.ok(existsSync(join(root, 'src/data/mediaCompanions.ts')), 'Static media companion metadata file is required.');

const blogIds = new Set(readBlogIds());
const resourceIds = new Set(readJsonFrontmatterIds('src/content/resources'));
const paperIds = new Set(readJsonFrontmatterIds('src/content/papers'));
const topicIds = new Set(readJsonFrontmatterIds('src/content/topics'));
const deckIds = new Set(decks.map((deck) => deck.id));
const seenIds = new Set();

for (const companion of mediaCompanions) {
	assert.match(companion.id, slugSafe, `Media companion id is not slug-safe: ${companion.id}`);
	assert.equal(seenIds.has(companion.id), false, `Duplicate media companion id: ${companion.id}`);
	seenIds.add(companion.id);

	assert.ok(statuses.has(companion.status), `${companion.id}.status is invalid.`);
	assert.ok(languages.has(companion.language), `${companion.id}.language is invalid.`);
	assert.match(companion.updatedAt, dateString, `${companion.id}.updatedAt should use YYYY-MM-DD.`);
	assert.ok(companion.title.ko, `${companion.id}.title.ko is required.`);
	assert.ok(companion.description.ko, `${companion.id}.description.ko is required.`);
	assertNoForbiddenFields(companion, companion.id);

	if (companion.videoUrl !== null) {
		assert.ok(isAllowedVideoUrl(companion.videoUrl), `${companion.id}.videoUrl must be a YouTube http/https URL.`);
	}

	if (companion.companionPostId !== null) {
		assert.ok(blogIds.has(normalizeBlogId(companion.companionPostId)), `${companion.id} references unknown companion post.`);
	}

	for (const [artifactName, artifactStatus] of Object.entries(companion.artifacts)) {
		assert.ok(artifactStatuses.has(artifactStatus), `${companion.id}.artifacts.${artifactName} is invalid.`);
	}

	for (const resourceId of companion.resourceIds) {
		assert.ok(resourceIds.has(resourceId), `${companion.id} references unknown resource: ${resourceId}`);
	}

	for (const paperId of companion.paperIds) {
		assert.ok(paperIds.has(paperId), `${companion.id} references unknown paper: ${paperId}`);
	}

	for (const topicId of companion.topicIds) {
		assert.ok(topicIds.has(topicId), `${companion.id} references unknown topic: ${topicId}`);
	}

	for (const deckId of companion.deckIds) {
		assert.ok(deckIds.has(deckId), `${companion.id} references unknown deck: ${deckId}`);
	}

	if (companion.status === 'published') {
		assert.equal(companion.review.humanReviewed, true, `${companion.id} is published but not human reviewed.`);
		assert.ok(companion.companionPostId, `${companion.id} must link a companion post before publication.`);
		assert.equal(companion.artifacts.blogPost, 'published', `${companion.id} must publish its blog artifact first.`);
	}

	if (companion.review.aiDraftUsed === true) {
		assert.equal(
			companion.review.humanReviewed,
			true,
			`${companion.id} used an AI draft but has not been human reviewed.`,
		);
	}
}

console.log(`Validated ${mediaCompanions.length} static media companion definitions.`);

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
		.map((filePath) => normalizeBlogId(relative(blogRoot, filePath)));
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

function normalizeBlogId(value) {
	return value.replace(/\.(md|mdx)$/i, '').toLowerCase();
}

function isAllowedVideoUrl(value) {
	try {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol)) return false;
		return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname);
	} catch {
		return false;
	}
}

function assertNoForbiddenFields(value, path) {
	if (!value || typeof value !== 'object') return;

	if (Array.isArray(value)) {
		value.forEach((item, index) => assertNoForbiddenFields(item, `${path}[${index}]`));
		return;
	}

	for (const [key, child] of Object.entries(value)) {
		assert.equal(
			forbiddenFieldNames.has(key.toLowerCase()),
			false,
			`${path}.${key} is forbidden in public media companion metadata.`,
		);
		assertNoForbiddenFields(child, `${path}.${key}`);
	}
}
