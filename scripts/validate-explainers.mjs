// Validates the `explainers` collection (docs/features/explainers.md): long-form
// Korean commentary on one external paper or article, bot-drafted and
// owner-approved, exported by the private pipeline.
//
// The schema is an ALLOWLIST. A field that is not listed in the tables below is
// rejected, and a handful of names are rejected *by name* with a reason, so the
// failure says what the field was and why it can never be public: quotes from
// the source, model names / costs / token counts, verification-check results,
// private signals. The contract file's own forbidden lists
// (contracts/research-os/research-item.schema.json `x-contract`) apply too; that
// file is vendored byte-for-byte by the private repository, so this validator
// reads it and does not edit it.
//
// Idiom matches scripts/validate-library.mjs: Node built-ins only, JSON
// frontmatter, one flat array of error strings thrown together at the end, the
// repository read from process.cwd() so tests can point it at a fixture
// directory (test/helpers/validator-harness.mjs).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

import { isWellFormedDoi } from '../src/data/identifierSchemes.ts';

const root = process.cwd();
const directory = 'src/content/explainers';

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const shortSlugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;
const arxivPattern = /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Za-z]{2})?\/\d{7})(?:v\d+)?$/;
const imageSrcPattern = /^\/images\/resources\/[a-z0-9-]+\.webp$/;

const sourceLanguages = new Set(['ko', 'en', 'ja']);
const sourceKinds = new Set(['paper', 'article']);
const authorships = new Set(['bot']);
const reviewStatuses = new Set(['draft', 'pending', 'approved', 'rejected']);

// The allowlist: every key an explainer may carry, per object.
const allowed = {
	top: new Set([
		'id',
		'title',
		'dek',
		'canonicalLanguage',
		'publishedAt',
		'updatedAt',
		'source',
		'ids',
		'authorship',
		'review',
		'tags',
		'image',
	]),
	source: new Set(['name', 'url', 'language', 'kind']),
	ids: new Set(['doi', 'arxiv']),
	review: new Set(['status', 'humanReviewed', 'reviewedAt', 'reviewer']),
	image: new Set(['kind', 'src', 'width', 'height', 'label']),
};

// Names that are never valid in an explainer, with the reason shown on failure.
// Matched case-insensitively at any nesting depth.
const forbiddenByReason = [
	{
		reason: 'quotes from the source are not published — an explainer is commentary in its own words',
		names: ['quote', 'quotes', 'quoted', 'quotedtext', 'sourcequote', 'sourcequotes', 'excerpt', 'excerpts', 'passage', 'passages', 'verbatim'],
	},
	{
		reason: 'model names, costs and token counts are pipeline internals',
		names: ['model', 'modelname', 'modelid', 'models', 'llm', 'provider', 'cost', 'costs', 'price', 'tokens', 'tokencount', 'inputtokens', 'outputtokens', 'usage', 'prompt', 'prompts', 'temperature'],
	},
	{
		reason: 'verification-check results are pipeline internals',
		names: ['verification', 'verifications', 'verificationchecks', 'verificationresult', 'verificationresults', 'checks', 'checkresults', 'factcheck', 'factchecks', 'validation', 'validationresults'],
	},
	{
		reason: 'private signals and scores never leave the private pipeline',
		names: ['signals', 'signal', 'privatesignals', 'score', 'scores', 'rank', 'ranking', 'pipeline', 'pipelinestage', 'rights', 'rightsdecision', 'license', 'licensing'],
	},
];

// Contract-level forbidden names (corpus-only, personal-state, removed scores),
// read from the contract so they cannot drift from the machine contract.
const contract = JSON.parse(
	readFileSync(new URL('../contracts/research-os/research-item.schema.json', import.meta.url), 'utf8'),
)['x-contract'];
const contractForbidden = new Map();
for (const name of [
	...contract.forbiddenInPublicProjection.fromT01,
	...contract.forbiddenInPublicProjection.addedByT02,
	...contract.personalStateFieldNames.names,
	...contract.removedScoreFields.names,
]) {
	contractForbidden.set(name.toLowerCase(), 'a private Research OS field that is never part of a public projection');
}
const forbiddenReasons = new Map(contractForbidden);
for (const { reason, names } of forbiddenByReason) {
	for (const name of names) forbiddenReasons.set(name, reason);
}

const entries = readEntries();
const errors = [];

const seenIds = new Map();
for (const entry of entries) {
	errors.push(...validateEntry(entry));
	const id = entry.data?.id;
	if (typeof id === 'string') {
		if (seenIds.has(id)) errors.push(`explainers id "${id}" is duplicated in ${seenIds.get(id)} and ${entry.label}.`);
		seenIds.set(id, entry.label);
	}
}

if (errors.length > 0) {
	throw new Error(`Invalid explainers:\n- ${errors.join('\n- ')}`);
}

const published = entries.filter((entry) => entry.data.review?.status === 'approved').length;
console.log(`Validated explainers: ${entries.length} entries, ${published} published.`);

function readEntries() {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
			if (!match) throw new Error(`${relative(root, filePath)} is missing frontmatter.`);
			let data;
			try {
				data = JSON.parse(match[1]);
			} catch (error) {
				throw new Error(`${relative(root, filePath)} frontmatter must be valid JSON: ${error.message}`);
			}
			return {
				filePath,
				label: relative(root, filePath),
				fileId: basename(filePath, extname(filePath)),
				data,
				body: match[2],
			};
		});
}

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(dir, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function isObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function nonEmpty(value) {
	return typeof value === 'string' && value.trim() !== '';
}

function validateEntry(entry) {
	const { data, label } = entry;
	const errors = [];

	if (!isObject(data)) return [`${label} frontmatter must be a JSON object.`];

	errors.push(...validateFieldNames(data, label));

	// id
	if (!nonEmpty(data.id) || !slugPattern.test(data.id)) {
		errors.push(`${label}.id must be slug-safe.`);
	} else if (data.id !== entry.fileId) {
		errors.push(`${label}.id "${data.id}" must equal the file name "${entry.fileId}" (the id is the URL slug).`);
	}

	if (!nonEmpty(data.title)) errors.push(`${label}.title is required.`);
	if (!nonEmpty(data.dek)) {
		errors.push(`${label}.dek is required (one or two sentences, owner-approved).`);
	} else if (data.dek.length > 400) {
		errors.push(`${label}.dek must be 400 characters or fewer.`);
	}

	if (typeof data.canonicalLanguage !== 'undefined' && data.canonicalLanguage !== 'ko') {
		errors.push(`${label}.canonicalLanguage must be "ko" (the only language explainers are written in for now).`);
	}

	if (!dateStringPattern.test(data.publishedAt ?? '')) errors.push(`${label}.publishedAt must be YYYY-MM-DD.`);
	if (typeof data.updatedAt !== 'undefined' && !dateStringPattern.test(data.updatedAt)) {
		errors.push(`${label}.updatedAt must be YYYY-MM-DD when provided.`);
	}

	// source: always named and linked.
	const source = data.source;
	if (!isObject(source)) {
		errors.push(`${label}.source is required: an explainer always names and links its source.`);
	} else {
		if (!isHttpUrl(source.url)) {
			errors.push(`${label}.source.url is required and must be a valid http/https URL.`);
		}
		if (!nonEmpty(source.name)) errors.push(`${label}.source.name is required.`);
		if (!sourceLanguages.has(source.language)) {
			errors.push(`${label}.source.language must be one of: ko, en, ja.`);
		}
		if (!sourceKinds.has(source.kind)) {
			errors.push(`${label}.source.kind must be one of: paper, article.`);
		}
		// A Japanese source is the deliberate differentiator and the case where
		// attribution matters most: it must be named AND linked, so the card's
		// 일본 자료 marker is never backed by an anonymous source.
		if (source.language === 'ja' && (!nonEmpty(source.name) || !isHttpUrl(source.url))) {
			errors.push(`${label} has source.language "ja" but no source attribution (source.name and source.url are both required).`);
		}
	}

	// ids: used only to link a paper card.
	if (typeof data.ids !== 'undefined') {
		if (!isObject(data.ids)) {
			errors.push(`${label}.ids must be an object ({ doi?, arxiv? }).`);
		} else {
			if (typeof data.ids.doi !== 'undefined' && !isWellFormedDoi(data.ids.doi)) {
				errors.push(`${label}.ids.doi "${data.ids.doi}" is not a well-formed DOI.`);
			}
			if (typeof data.ids.arxiv !== 'undefined' && !(typeof data.ids.arxiv === 'string' && arxivPattern.test(data.ids.arxiv))) {
				errors.push(`${label}.ids.arxiv "${data.ids.arxiv}" is not a bare arXiv id (e.g. 2401.01234).`);
			}
		}
	}

	if (!authorships.has(data.authorship)) {
		errors.push(`${label}.authorship must be one of: ${[...authorships].join(', ')}.`);
	}

	// review
	const review = data.review;
	if (!isObject(review)) {
		errors.push(`${label}.review is required.`);
	} else {
		if (!reviewStatuses.has(review.status)) {
			errors.push(`${label}.review.status must be one of: ${[...reviewStatuses].join(', ')}.`);
		}
		if (typeof review.humanReviewed !== 'boolean') {
			errors.push(`${label}.review.humanReviewed must be a boolean.`);
		}
		if (review.reviewedAt !== null && typeof review.reviewedAt !== 'undefined' && !dateStringPattern.test(review.reviewedAt)) {
			errors.push(`${label}.review.reviewedAt must be YYYY-MM-DD or null.`);
		}

		if (review.status === 'approved') {
			// Nothing unreviewed is ever public.
			if (review.humanReviewed !== true) {
				errors.push(`${label} is approved but review.humanReviewed is not true.`);
			}
			if (!dateStringPattern.test(review.reviewedAt ?? '')) {
				errors.push(`${label} is approved but review.reviewedAt is missing (the badge shows the review date).`);
			}
			if (entry.body.trim() === '') {
				errors.push(`${label} is approved but has no body.`);
			}
			// Placeholder Content Is Unpublished (docs/decisions/site-structure.md).
			if (/^\s*TEMP:/i.test(data.title ?? '')) {
				errors.push(`${label} is approved but its title is a TEMP: placeholder — revert it to draft.`);
			}
		}
	}

	// tags: the existing short-slug taxonomy.
	if (typeof data.tags !== 'undefined') {
		if (!Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === 'string' && shortSlugPattern.test(tag))) {
			errors.push(`${label}.tags must be short slug-like strings.`);
		}
	}

	// image: same rules as resources.
	if (typeof data.image !== 'undefined') {
		const image = data.image;
		if (!isObject(image)) {
			errors.push(`${label}.image must be an object.`);
		} else if (image.kind === 'typographic') {
			if (!nonEmpty(image.label)) errors.push(`${label}.image.label is required for a typographic image.`);
		} else if (image.kind === 'og' || image.kind === 'screenshot') {
			if (typeof image.src !== 'string' || !imageSrcPattern.test(image.src)) {
				errors.push(`${label}.image.src must be /images/resources/<name>.webp.`);
			}
			if (!Number.isInteger(image.width) || !Number.isInteger(image.height)) {
				errors.push(`${label}.image.width and height must be integers.`);
			}
		} else {
			errors.push(`${label}.image.kind must be one of: og, screenshot, typographic.`);
		}
	}

	return errors;
}

// The allowlist plus the by-name rejection. A forbidden name is reported as
// forbidden (with its reason) wherever it sits; any other unlisted name is
// reported as not allowed.
function validateFieldNames(data, label) {
	const errors = [];

	const check = (object, allowedKeys, path) => {
		for (const key of Object.keys(object)) {
			const fullPath = `${path}.${key}`;
			const reason = forbiddenReasons.get(key.toLowerCase());
			if (reason) {
				errors.push(`${fullPath} is a forbidden field in an explainer: ${reason}.`);
			} else if (!allowedKeys.has(key)) {
				errors.push(`${fullPath} is not an allowed explainer field (the schema is an allowlist; see docs/features/explainers.md).`);
			}
		}
	};

	check(data, allowed.top, label);
	for (const nested of ['source', 'ids', 'review', 'image']) {
		if (isObject(data[nested])) check(data[nested], allowed[nested], `${label}.${nested}`);
	}

	// A forbidden name hidden deeper than the allowlisted objects (e.g. inside a
	// value that should be a string) is still caught.
	const scan = (value, path) => {
		if (Array.isArray(value)) {
			value.forEach((item, index) => scan(item, `${path}[${index}]`));
		} else if (isObject(value)) {
			for (const [key, child] of Object.entries(value)) {
				const childPath = `${path}.${key}`;
				const depth = childPath.slice(label.length).split('.').length - 1;
				if (depth >= 3 && forbiddenReasons.has(key.toLowerCase())) {
					errors.push(`${childPath} is a forbidden field in an explainer: ${forbiddenReasons.get(key.toLowerCase())}.`);
				}
				scan(child, childPath);
			}
		}
	};
	scan(data, label);

	return errors;
}
