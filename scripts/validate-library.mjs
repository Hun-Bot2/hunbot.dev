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

// Original five — pre-T02, "raw or copied source material" shaped.
const legacyForbiddenFieldNames = new Set([
	'rawhtml',
	'rawpdftext',
	'fullpdftext',
	'largecopiedtext',
	'copiedabstract',
]);

// T02 boundary extension (docs/decisions/research-os-data-contract.md,
// "Validator Invariants, Checkable Today" — this is T10's specification).
// Name lists are read FROM the schema file's `x-contract` block rather than
// retyped here, so they cannot drift from the machine contract the way a
// hand-copied list would (that drift risk is exactly what INV-09, in
// scripts/validate-research-contract.mjs, exists to catch on the contract
// file's own copy of the fromT01 list).
//
// Resolved relative to THIS file's own location (import.meta.url), not
// process.cwd(): the contract file is a fixed repo asset that defines what
// "forbidden" means, not fixture-controlled content — a content fixture
// (test/fixtures/validate-library/*) must not need its own copy of it, the
// same way existing fixtures need no copy of src/data/discoverFacets.ts.
const researchContract = JSON.parse(
	readFileSync(new URL('../contracts/research-os/research-item.schema.json', import.meta.url), 'utf8'),
)['x-contract'];

// `mergedInto` is deliberately EXCLUDED from the corpus-only set and
// enforced separately, papers/resources-only (see validateNoForbiddenFields
// below): the topics collection legitimately carries its own `mergedInto`
// (T03, docs/decisions/discover-direction.md#Taxonomy) and must keep
// validating. Touching this exclusion breaks topic validation.
const MERGED_INTO = 'mergedinto';

// Corpus-only field names (T01 + T02) — INV-01. Forbidden at any nesting
// depth in a papers/resources document.
const corpusOnlyFieldNames = new Set(
	[
		...researchContract.forbiddenInPublicProjection.fromT01,
		...researchContract.forbiddenInPublicProjection.addedByT02,
	]
		.map((name) => name.toLowerCase())
		.filter((name) => name !== MERGED_INTO),
);

// Personal-state / operational field names — INV-02. Never valid in a
// public collection. Kept as its own set (rather than folded into
// corpusOnlyFieldNames) so the failure message can name the correct remedy —
// the private DynamoDB record, not the private corpus repository.
const personalStateOnlyFieldNames = new Set(
	researchContract.personalStateFieldNames.names.map((name) => name.toLowerCase()),
);
// namingHazard guard (research-os-data-contract.md): `readingPriority` is
// deliberately NOT named `priority` because `papers.priority` is a
// legitimate, unrelated editorial field. If that ever collided, every
// approved paper card would start failing this validator — assert it can't.
if (personalStateOnlyFieldNames.has('priority')) {
	throw new Error(
		'personalStateFieldNames must never include "priority" — papers.priority is a legitimate public field. See research-os-data-contract.md\'s namingHazard note.',
	);
}

// Ranking-input fields removed from the schema outright — INV-03. Never a
// source-of-truth field anywhere in public content.
const removedScoreFieldNames = new Set(
	researchContract.removedScoreFields.names.map((name) => name.toLowerCase()),
);

// The full membership check used by validateNoForbiddenFields. `mergedInto`
// stays out of this set (see MERGED_INTO above) and is checked separately,
// only for papers/resources.
const forbiddenFieldNames = new Set([
	...legacyForbiddenFieldNames,
	...corpusOnlyFieldNames,
	...personalStateOnlyFieldNames,
	...removedScoreFieldNames,
]);

// A public collection record is not a private candidate store
// (library-data-model.md). A record that grows past a few KB is the
// empirical signature of corpus data (a raw abstract, pasted source text)
// leaking into public content rather than a human-authored summary, and
// aligns with the cloud ADR's small-record posture (shared-context.md §8).
// Measured against the current largest real record — 2154 bytes total file
// size, src/content/papers/sample-paper-card.md — this threshold gives it
// roughly 4x headroom for legitimate growth (more languages, more topics,
// more external ids) before tripping.
const MAX_RECORD_BYTES = 8192;

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

// Papers/resources get the full forbidden-field check, including
// mergedInto (INV-01's scope — see MERGED_INTO above). Topics get the
// default (mergedInto allowed) so T03's legitimate lifecycle field keeps
// validating.
for (const entry of resources) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label, { allowMergedInto: false }));
	errors.push(...validateCommonId(entry));
	errors.push(...validateResource(entry, topicIndex));
	errors.push(...validateRecordSize(entry));
}

for (const entry of papers) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label, { allowMergedInto: false }));
	errors.push(...validateCommonId(entry));
	errors.push(...validatePaper(entry, topicIndex, resourceIds));
	errors.push(...validateRecordSize(entry));
}

for (const entry of topics) {
	errors.push(...validateNoForbiddenFields(entry.data, entry.label));
	errors.push(...validateCommonId(entry));
	errors.push(...validateTopic(entry));
	errors.push(...validateRecordSize(entry));
}

// INV-03: removed ranking-input fields must never reappear in the Zod
// schema either — a symptom invisible to a check that only reads content
// files (nothing uses them yet, but a schema-level reappearance would be a
// silent regression no content fixture could catch).
errors.push(...validateRemovedScoreFieldsAbsentFromSchema());

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
				byteLength: Buffer.byteLength(source, 'utf8'),
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

// Recursive walker — unchanged in structure from the original five-name
// version. Extended in what it will report, not how it recurses:
//   - `options.allowMergedInto` (default true) gates the papers/resources-
//     only `mergedInto` check (INV-01's scope note); topics callers omit
//     `options` and keep today's behavior.
//   - messages now distinguish corpus-shaped from personal-state-shaped
//     names, because the remedies differ (move to the private corpus repo
//     vs. move to DynamoDB) — see fieldForbiddenReason.
function validateNoForbiddenFields(value, path, options = {}) {
	const { allowMergedInto = true } = options;
	const errors = [];

	if (!value || typeof value !== 'object') {
		return errors;
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			errors.push(...validateNoForbiddenFields(item, `${path}[${index}]`, options));
		});
		return errors;
	}

	for (const [key, child] of Object.entries(value)) {
		const lower = key.toLowerCase();

		if (forbiddenFieldNames.has(lower)) {
			errors.push(`${path}.${key} is forbidden in public Library content${fieldForbiddenReason(lower)}`);
		} else if (!allowMergedInto && lower === MERGED_INTO) {
			errors.push(
				`${path}.${key} is forbidden in public Library content — it is corpus-only data (docs/decisions/research-os-data-contract.md, INV-01): mergedInto belongs only to the private Research OS canonical item on papers/resources. (The topics collection carries its own, unrelated mergedInto — see docs/decisions/discover-direction.md#Taxonomy.)`,
			);
		}

		errors.push(...validateNoForbiddenFields(child, `${path}.${key}`, options));
	}

	return errors;
}

// Distinct wording per category — the remedy differs (delete vs. move to the
// private corpus repo vs. move to DynamoDB), so the message must say which.
// Returns a string starting with a space so it appends cleanly onto the
// "is forbidden in public Library content" prefix above (empty suffix for
// the original five, which keep their original, unqualified message).
function fieldForbiddenReason(lowerKey) {
	if (legacyForbiddenFieldNames.has(lowerKey)) {
		return '.';
	}

	if (removedScoreFieldNames.has(lowerKey)) {
		return ' — it is a removed ranking-input field (docs/decisions/research-os-data-contract.md, INV-03) and must never reappear as a source-of-truth field.';
	}

	if (personalStateOnlyFieldNames.has(lowerKey)) {
		return ' — it is personal-state data (docs/decisions/research-os-data-contract.md, INV-02) and belongs only in the private Research OS DynamoDB record, never in a public collection.';
	}

	// corpusOnlyFieldNames — the remaining, and largest, category.
	return ' — it is corpus-only data (docs/decisions/research-os-data-contract.md, INV-01) and belongs only in the private Research OS canonical item, never in the public projection.';
}

// Record-size guard. Not part of T02's invariant list — a T10-local addition
// (see this task's packet, "Decisions You May Make") aligned with the cloud
// ADR's small-record posture. Applies to all three Library collections: none
// of them is a candidate store.
function validateRecordSize(entry) {
	if (entry.byteLength <= MAX_RECORD_BYTES) {
		return [];
	}

	return [
		`${entry.label} is ${entry.byteLength} bytes, over the ${MAX_RECORD_BYTES}-byte public-collection record guard. A record this large is usually a sign that corpus data (raw text, a full abstract, copied source material) has leaked into public content — see docs/decisions/research-os-data-contract.md and docs/features/library-data-model.md#what-not-to-store.`,
	];
}

// INV-03's schema-file half: `x-contract.removedScoreFields` (topicScore,
// sourceScore, usefulnessScore, freshnessScore, totalScore) must never
// reappear as an actual declared field in src/content.config.ts, not just
// absent from content. Matches the name only when followed by `:` (a real
// object-shape key), so it does not fire on the removal comment that already
// names all five in prose.
function validateRemovedScoreFieldsAbsentFromSchema() {
	const schemaConfigPath = join(root, 'src/content.config.ts');
	// Tolerate a fixture directory that doesn't include this file — fixtures
	// deliberately mirror only the minimal repo-root-relative slice the case
	// under test needs (test/fixtures/README.md). In the real repo root this
	// file always exists, so the check still runs there.
	if (!existsSync(schemaConfigPath)) {
		return [];
	}

	const schemaSource = readFileSync(schemaConfigPath, 'utf8');
	const errors = [];

	for (const rawName of researchContract.removedScoreFields.names) {
		const keyPattern = new RegExp(`(^|[^A-Za-z0-9_$])${rawName}\\s*:`, 'm');
		if (keyPattern.test(schemaSource)) {
			errors.push(
				`src/content.config.ts declares a field named "${rawName}", which is a removed ranking-input field (docs/decisions/research-os-data-contract.md, INV-03) and must never reappear in the schema.`,
			);
		}
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
