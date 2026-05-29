import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const shortSlugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const forbiddenFieldNames = new Set([
	'rawhtml',
	'rawpdftext',
	'fullpdftext',
	'largecopiedtext',
	'copiedabstract',
]);
const requiredPaperKoSummaryFields = ['tldr', 'problem', 'keyIdea', 'whyItMatters', 'limitations', 'readThisIf'];
const resourcePublicPolicies = new Set([
	'link-and-summary-only',
	'open-source',
	'permissive-reuse',
	'official-docs',
	'unknown',
]);

const resources = readCollection('resources', 'src/content/resources');
const papers = readCollection('papers', 'src/content/papers');
const topics = readCollection('topics', 'src/content/topics');

const errors = [
	...validateUniqueIds(resources, 'resources'),
	...validateUniqueIds(papers, 'papers'),
	...validateUniqueIds(topics, 'topics'),
];

const resourceIds = new Set(resources.map((entry) => entry.data.id));
const topicIds = new Set(topics.map((entry) => entry.data.id));

for (const entry of resources) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validateResource(entry, topicIds));
}

for (const entry of papers) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validatePaper(entry, topicIds, resourceIds));
}

for (const entry of topics) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validateTopic(entry));
}

if (errors.length > 0) {
	throw new Error(`Invalid Library content:\n- ${errors.join('\n- ')}`);
}

console.log(
	`Validated Library content: ${resources.length} resources, ${papers.length} papers, ${topics.length} topics.`,
);

function readCollection(name, directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) {
		return [];
	}

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const source = readFileSync(filePath, 'utf8');
			return {
				collection: name,
				filePath,
				label: relative(root, filePath),
				data: parseJsonFrontmatter(source, filePath),
			};
		});
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function parseJsonFrontmatter(source, filePath) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		throw new Error(`${relative(root, filePath)} is missing frontmatter.`);
	}

	try {
		return JSON.parse(match[1]);
	} catch (error) {
		throw new Error(`${relative(root, filePath)} frontmatter must be valid JSON: ${error.message}`);
	}
}

function validateUniqueIds(entries, collectionName) {
	const errors = [];
	const seen = new Map();

	for (const entry of entries) {
		const id = entry.data.id;
		if (!id) continue;

		if (seen.has(id)) {
			errors.push(`${collectionName} id "${id}" is duplicated in ${seen.get(id)} and ${entry.label}.`);
		}

		seen.set(id, entry.label);
	}

	return errors;
}

function validateCommonId(entry) {
	if (!isSlugSafe(entry.data.id)) {
		return [`${entry.label}.id must be slug-safe.`];
	}

	return [];
}

function validateResource(entry, topicIds) {
	const { data } = entry;
	const errors = [];

	if (!isHttpUrl(data.url)) {
		errors.push(`${entry.label}.url must be a valid http/https URL.`);
	}

	if (data.repoUrl !== null && typeof data.repoUrl !== 'undefined' && !isHttpUrl(data.repoUrl)) {
		errors.push(`${entry.label}.repoUrl must be null or a valid http/https URL.`);
	}

	if (!Array.isArray(data.tags) || !data.tags.every((tag) => shortSlugPattern.test(tag))) {
		errors.push(`${entry.label}.tags must be short slug-like strings.`);
	}

	if (!data.license || typeof data.license !== 'object') {
		errors.push(`${entry.label}.license metadata is required.`);
	} else {
		if (!resourcePublicPolicies.has(data.license.publicPolicy)) {
			errors.push(`${entry.label}.license.publicPolicy must be a supported policy.`);
		}

		if (typeof data.license.canRepublishAssets !== 'undefined' && typeof data.license.canRepublishAssets !== 'boolean') {
			errors.push(`${entry.label}.license.canRepublishAssets must be a boolean when provided.`);
		}
	}

	if (data.status === 'approved') {
		if (data.review?.humanReviewed !== true) {
			errors.push(`${entry.label} is approved but review.humanReviewed is not true.`);
		}

		if (!data.summary?.ko?.trim()) {
			errors.push(`${entry.label} is approved but summary.ko is missing.`);
		}
	}

	if (Array.isArray(data.relatedTopics)) {
		for (const topicId of data.relatedTopics) {
			if (!topicIds.has(topicId)) {
				errors.push(`${entry.label}.relatedTopics references unknown topic "${topicId}".`);
			}
		}
	}

	if (Array.isArray(data.relatedDecks)) {
		for (const deckId of data.relatedDecks) {
			if (!isSlugSafe(deckId)) {
				errors.push(`${entry.label}.relatedDecks contains unsafe deck id "${deckId}".`);
			}
		}
	}

	return errors;
}

function validatePaper(entry, topicIds, resourceIds) {
	const { data } = entry;
	const errors = [];

	for (const field of ['url', 'paperUrl', 'codeUrl', 'projectUrl']) {
		const value = data[field];
		if (value !== null && typeof value !== 'undefined' && !isHttpUrl(value)) {
			errors.push(`${entry.label}.${field} must be null or a valid http/https URL.`);
		}
	}

	if (typeof data.year !== 'undefined' && (!Number.isInteger(data.year) || data.year < 1900 || data.year > 2100)) {
		errors.push(`${entry.label}.year must be a valid year when provided.`);
	}

	if (!Array.isArray(data.topics) || data.topics.length === 0) {
		errors.push(`${entry.label}.topics must include at least one topic id when possible.`);
	} else {
		for (const topicId of data.topics) {
			if (!topicIds.has(topicId)) {
				errors.push(`${entry.label}.topics references unknown topic "${topicId}".`);
			}
		}
	}

	if (data.status === 'approved') {
		if (data.review?.humanReviewed !== true) {
			errors.push(`${entry.label} is approved but review.humanReviewed is not true.`);
		}

		for (const field of requiredPaperKoSummaryFields) {
			if (!data.summary?.ko?.[field]?.trim()) {
				errors.push(`${entry.label} is approved but summary.ko.${field} is missing.`);
			}
		}
	}

	if (data.review?.aiDraftUsed === true && data.review?.humanReviewed !== true) {
		errors.push(`${entry.label} used an AI draft but is not human reviewed.`);
	}

	if (Array.isArray(data.relatedResources)) {
		for (const resourceId of data.relatedResources) {
			if (!resourceIds.has(resourceId)) {
				errors.push(`${entry.label}.relatedResources references unknown resource "${resourceId}".`);
			}
		}
	}

	if (Array.isArray(data.relatedDecks)) {
		for (const deckId of data.relatedDecks) {
			if (!isSlugSafe(deckId)) {
				errors.push(`${entry.label}.relatedDecks contains unsafe deck id "${deckId}".`);
			}
		}
	}

	return errors;
}

function validateTopic(entry) {
	const { data } = entry;
	const errors = [];

	if (!data.label?.ko?.trim()) {
		errors.push(`${entry.label}.label.ko is required.`);
	}

	if (!data.description?.ko?.trim()) {
		errors.push(`${entry.label}.description.ko is required.`);
	}

	for (const field of ['positiveKeywords', 'negativeKeywords', 'venues', 'arxivCategories', 'seedPapers']) {
		if (!Array.isArray(data[field])) {
			errors.push(`${entry.label}.${field} must be an array.`);
		}
	}

	if (data.reviewPolicy?.autoPublish === true) {
		errors.push(`${entry.label}.reviewPolicy.autoPublish must stay false for the public Library workflow.`);
	}

	if (data.reviewPolicy?.requireHumanReview === false) {
		errors.push(`${entry.label}.reviewPolicy.requireHumanReview must stay true.`);
	}

	return errors;
}

function validateNoForbiddenFields(value, path) {
	const errors = [];

	if (!value || typeof value !== 'object') {
		return errors;
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			errors.push(...validateNoForbiddenFields(item, `${path}[${index}]`));
		});
		return errors;
	}

	for (const [key, child] of Object.entries(value)) {
		if (forbiddenFieldNames.has(key.toLowerCase())) {
			errors.push(`${path}.${key} is forbidden in public Library content.`);
		}

		errors.push(...validateNoForbiddenFields(child, `${path}.${key}`));
	}

	return errors;
}

function isSlugSafe(value) {
	return typeof value === 'string' && slugPattern.test(value);
}

function isHttpUrl(value) {
	if (typeof value !== 'string') return false;

	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}
