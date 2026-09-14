import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { contentTypeIds } from '../src/data/discoverFacets.ts';
import { isValidVenueId, resolveVenueId } from '../src/data/venues.ts';
import {
	isValidAcceptanceStatus,
	isValidHonor,
	isValidPresentationFormat,
} from '../src/data/paperVocabularies.ts';
import { isValidIdentifierScheme, isWellFormedDoi } from '../src/data/identifierSchemes.ts';
import { buildTopicIndex, isResolvableTopicReference } from './lib/topic-resolution.mjs';

const root = process.cwd();
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const shortSlugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;
// Canonical research-item identity
// (docs/decisions/research-item-identity.md#Canonical-Item-Identity).
const itemIdPattern = /^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$/;
// Discover Phase 2 facets (docs/decisions/discover-direction.md#Facets).
// `depth` is the one deliberate closed enum (shared-context.md §4); it is
// duplicated here (rather than imported) because it is Zod's fixed
// four-value scale, not a cross-referenced registry like contentType.
const depthValues = new Set(['beginner', 'practical', 'engineering', 'research']);
const canonicalLanguages = new Set(['ko', 'en', 'jp']);
const contentTypeRegistry = new Set(contentTypeIds);
const forbiddenFieldNames = new Set([
	'rawhtml',
	'rawpdftext',
	'fullpdftext',
	'largecopiedtext',
	'copiedabstract',
]);
const requiredPaperSummaryFields = ['tldr', 'problem', 'keyIdea', 'whyItMatters', 'limitations', 'readThisIf'];
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
	...validateUniqueItemIds(papers),
];

const resourceIds = new Set(resources.map((entry) => entry.data.id));
// Alias-aware resolution (docs/decisions/discover-direction.md#Taxonomy):
// a topic reference in content may name a current id OR a uniquely-owned
// alias OR resolve through a bounded mergedInto chain to an active topic.
// See scripts/lib/topic-resolution.mjs for why this must not be a plain
// `Set` of current ids — that was the bug this fixes.
const topicIndex = buildTopicIndex(topics);

for (const entry of resources) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validateResource(entry, topicIndex));
}

for (const entry of papers) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validatePaper(entry, topicIndex, resourceIds));
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

// itemId is the canonical research-item identity
// (docs/decisions/research-item-identity.md#Canonical-Item-Identity) — the
// join key between this public projection and the private Research OS
// canonical item and every note anchored to it. A duplicate itemId means two
// public cards claim to be the same work: an editorial problem needing a
// human, and a validator failure rather than a silent merge.
function validateUniqueItemIds(papers) {
	const errors = [];
	const seen = new Map();

	for (const entry of papers) {
		const itemId = entry.data.itemId;
		if (typeof itemId !== 'string') continue;

		if (seen.has(itemId)) {
			errors.push(`papers itemId "${itemId}" is duplicated in ${seen.get(itemId)} and ${entry.label}.`);
		}

		seen.set(itemId, entry.label);
	}

	return errors;
}

function validateResource(entry, topicIndex) {
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

	const canonicalLanguage = data.canonicalLanguage ?? 'ko';

	if (data.status === 'approved') {
		if (data.review?.humanReviewed !== true) {
			errors.push(`${entry.label} is approved but review.humanReviewed is not true.`);
		}

		if (!data.summary?.[canonicalLanguage]?.trim()) {
			errors.push(`${entry.label} is approved but summary.${canonicalLanguage} (its canonical language) is missing.`);
		}
	}

	errors.push(...validateDiscoverFacets(entry, data, { includeContentType: true }));

	if (Array.isArray(data.relatedTopics)) {
		for (const topicId of data.relatedTopics) {
			if (!isResolvableTopicReference(topicId, topicIndex)) {
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

// Venue registry cross-reference (docs/decisions/research-discovery-system.md
// #Venue-Registry), shared by papers.venue and topics.venues. Accepts only
// the canonical registry id — a value that resolves solely via an alias
// (e.g. legacy "ICLR") is rejected with a message naming the canonical id to
// use instead, rather than silently accepted, because the point of this
// migration is that content stores the canonical id, and aliases exist for
// matching other systems' spellings during ingestion, not for permissive
// content authoring.
function validateVenueReference(value, label) {
	if (isValidVenueId(value)) {
		return [];
	}

	const canonical = resolveVenueId(value);
	if (canonical) {
		return [`${label} references venue "${value}", which is an alias, not a registry id. Use "${canonical}" instead — see src/data/venues.ts.`];
	}

	return [`${label} references unknown venue "${value}". Add it to src/data/venues.ts or fix the reference.`];
}

// Discover Phase 2 facet checks shared by resources and papers
// (docs/decisions/discover-direction.md#Facets). Zod (src/content.config.ts)
// enforces the same rules at build time; this script duplicates them because
// it validates raw frontmatter directly, without going through Zod, so its
// fixtures (test/fixtures/validate-library/) can exercise this script alone.
function validateDiscoverFacets(entry, data, { includeContentType }) {
	const errors = [];

	if (includeContentType && typeof data.contentType !== 'undefined' && !contentTypeRegistry.has(data.contentType)) {
		errors.push(
			`${entry.label}.contentType "${data.contentType}" is not a recognized content type. Add it to src/data/discoverFacets.ts.`,
		);
	}

	if (typeof data.depth !== 'undefined' && !depthValues.has(data.depth)) {
		errors.push(`${entry.label}.depth "${data.depth}" must be one of: ${[...depthValues].join(', ')}.`);
	}

	if (typeof data.canonicalLanguage !== 'undefined' && !canonicalLanguages.has(data.canonicalLanguage)) {
		errors.push(
			`${entry.label}.canonicalLanguage "${data.canonicalLanguage}" must be one of: ${[...canonicalLanguages].join(', ')}.`,
		);
	}

	if (typeof data.publishedAt !== 'undefined' && !dateStringPattern.test(data.publishedAt)) {
		errors.push(`${entry.label}.publishedAt must be in YYYY-MM-DD format.`);
	}

	return errors;
}

function validatePaper(entry, topicIndex, resourceIds) {
	const { data } = entry;
	const errors = [];

	// Canonical item identity
	// (docs/decisions/research-item-identity.md#Canonical-Item-Identity).
	// Required — a missing or malformed itemId leaves this card with no join
	// key to the private Research OS item and no anchor for any note.
	if (typeof data.itemId !== 'string' || !itemIdPattern.test(data.itemId)) {
		errors.push(
			`${entry.label}.itemId is required and must match "itm-" followed by 26 lowercase Crockford-base32 characters (got ${JSON.stringify(data.itemId)}).`,
		);
	}

	for (const field of ['url', 'paperUrl', 'codeUrl', 'projectUrl']) {
		const value = data[field];
		if (value !== null && typeof value !== 'undefined' && !isHttpUrl(value)) {
			errors.push(`${entry.label}.${field} must be null or a valid http/https URL.`);
		}
	}

	if (typeof data.year !== 'undefined' && (!Number.isInteger(data.year) || data.year < 1900 || data.year > 2100)) {
		errors.push(`${entry.label}.year must be a valid year when provided.`);
	}

	if (typeof data.venue !== 'undefined') {
		errors.push(...validateVenueReference(data.venue, `${entry.label}.venue`));
	}

	// C2 split (docs/decisions/research-item-identity.md#C2): acceptanceStatus,
	// honors, and presentationFormat replace the conflated legacy `decision`
	// enum and are each independently registry-backed
	// (src/data/paperVocabularies.ts) — never a Zod enum.
	if (typeof data.acceptanceStatus !== 'undefined' && !isValidAcceptanceStatus(data.acceptanceStatus)) {
		errors.push(
			`${entry.label}.acceptanceStatus "${data.acceptanceStatus}" is not a recognized acceptance status. Add it to src/data/paperVocabularies.ts.`,
		);
	}

	if (typeof data.honors !== 'undefined') {
		if (!Array.isArray(data.honors)) {
			errors.push(`${entry.label}.honors must be an array.`);
		} else {
			for (const honor of data.honors) {
				if (!isValidHonor(honor)) {
					errors.push(
						`${entry.label}.honors contains "${honor}", which is not a recognized honor. Add it to src/data/paperVocabularies.ts, or use acceptanceStatus if this is an acceptance fact rather than an honor.`,
					);
				}
			}
		}
	}

	if (
		data.presentationFormat !== null &&
		typeof data.presentationFormat !== 'undefined' &&
		!isValidPresentationFormat(data.presentationFormat)
	) {
		errors.push(
			`${entry.label}.presentationFormat "${data.presentationFormat}" is not a recognized presentation format. Add it to src/data/paperVocabularies.ts.`,
		);
	}

	// Provenance tier (docs/decisions/research-item-identity.md
	// #Status-History-And-Provenance-Tier): drives destructive TTL in the
	// private Research OS, so it must never be assignable by assertion.
	// "VERIFIED" requires both a human reviewer and an authoritative registry
	// venue — the public-projection proxy for "a statusHistory entry from an
	// authoritative source", since statusHistory itself is private-only.
	if (data.provenance === 'VERIFIED') {
		if (data.review?.humanReviewed !== true) {
			errors.push(
				`${entry.label} has provenance "VERIFIED" but review.humanReviewed is not true. VERIFIED is not assignable by assertion.`,
			);
		}

		if (typeof data.venue === 'undefined' || !isValidVenueId(data.venue)) {
			errors.push(
				`${entry.label} has provenance "VERIFIED" but venue "${data.venue}" does not resolve to a venue registry id. VERIFIED requires an authoritative registry venue — see src/data/venues.ts.`,
			);
		}
	}

	if (Array.isArray(data.source?.externalIds)) {
		const seenPairs = new Set();
		for (const [index, entryId] of data.source.externalIds.entries()) {
			const label = `${entry.label}.source.externalIds[${index}]`;
			const scheme = entryId?.scheme;
			const value = entryId?.value;

			if (!isValidIdentifierScheme(scheme)) {
				errors.push(`${label}.scheme "${scheme}" is not a recognized identifier scheme. Add it to src/data/identifierSchemes.ts.`);
			}

			if (scheme === 'doi' && !isWellFormedDoi(value)) {
				errors.push(`${label}.value "${value}" is not a well-formed DOI (expected "10.<registrant>/<suffix>").`);
			}

			const pairKey = `${scheme}:${value}`;
			if (seenPairs.has(pairKey)) {
				errors.push(`${entry.label}.source.externalIds contains a duplicate (scheme, value) pair: ${pairKey}.`);
			}
			seenPairs.add(pairKey);
		}
	}

	if (!Array.isArray(data.topics) || data.topics.length === 0) {
		errors.push(`${entry.label}.topics must include at least one topic id when possible.`);
	} else {
		for (const topicId of data.topics) {
			if (!isResolvableTopicReference(topicId, topicIndex)) {
				errors.push(`${entry.label}.topics references unknown topic "${topicId}".`);
			}
		}
	}

	const canonicalLanguage = data.canonicalLanguage ?? 'ko';

	if (data.status === 'approved') {
		if (data.review?.humanReviewed !== true) {
			errors.push(`${entry.label} is approved but review.humanReviewed is not true.`);
		}

		for (const field of requiredPaperSummaryFields) {
			if (!data.summary?.[canonicalLanguage]?.[field]?.trim()) {
				errors.push(`${entry.label} is approved but summary.${canonicalLanguage}.${field} is missing.`);
			}
		}
	}

	if (data.review?.aiDraftUsed === true && data.review?.humanReviewed !== true) {
		errors.push(`${entry.label} used an AI draft but is not human reviewed.`);
	}

	errors.push(...validateDiscoverFacets(entry, data, { includeContentType: false }));

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

	if (Array.isArray(data.venues)) {
		for (const venueId of data.venues) {
			errors.push(...validateVenueReference(venueId, `${entry.label}.venues`));
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
