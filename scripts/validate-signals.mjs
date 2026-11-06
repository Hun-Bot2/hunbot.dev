// Validates the `signals` collection (docs/features/signals-and-weekly.md):
// one item that passed the owner's filter, with the owner's verdict and a
// one-line reason. The schema is an ALLOWLIST: a field not listed below is
// rejected, and a few names are rejected *by name* with a reason (quotes from
// the source, model names/costs/token counts, verification-check results,
// private signals and scores, and lineage: "where it led" is declared on the
// later artifact, never on the signal).
//
// Idiom matches scripts/validate-explainers.mjs: Node built-ins only, JSON
// frontmatter, one flat array of error strings thrown together at the end, the
// repository read from process.cwd() so tests can point it at a fixture.

import { checkFieldNames, scanForbiddenDeep } from './lib/forbidden-fields.mjs';
import {
	isDateString,
	isHttpUrl,
	isObject,
	nonEmpty,
	readJsonFrontmatterDirectory,
	validateReview,
} from './lib/read-json-frontmatter.mjs';

const root = process.cwd();
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const shortSlugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;

const sourceLanguages = new Set(['ko', 'en', 'ja']);
const sourceKinds = new Set(['paper', 'article', 'release', 'post']);
const verdicts = new Set(['confirmed', 'doubt', 'try']);
const authorships = new Set(['bot', 'owner']);

const allowed = {
	top: new Set(['id', 'title', 'url', 'source', 'sourceDate', 'keptAt', 'verdict', 'why', 'authorship', 'review', 'tags']),
	source: new Set(['name', 'language', 'kind']),
	review: new Set(['status', 'humanReviewed', 'reviewedAt', 'reviewer']),
};

// Lineage is declared on the later artifact (explainers and posts list the
// signal ids they grew out of); a signal never lists where it led.
const lineageNames = new Set(['lineage', 'ledto', 'led', 'ledby', 'explainers', 'posts', 'related', 'relatedto', 'derived', 'next']);

const entries = readJsonFrontmatterDirectory(root, 'src/content/signals');
const errors = [];
const seen = new Map();

for (const entry of entries) {
	errors.push(...validateEntry(entry));
	const id = entry.data?.id;
	if (typeof id === 'string') {
		if (seen.has(id)) errors.push(`signals id "${id}" is duplicated in ${seen.get(id)} and ${entry.label}.`);
		seen.set(id, entry.label);
	}
}

if (errors.length > 0) throw new Error(`Invalid signals:\n- ${errors.join('\n- ')}`);

const published = entries.filter((entry) => entry.data.review?.status === 'approved').length;
console.log(`Validated signals: ${entries.length} entries, ${published} published.`);

function validateEntry(entry) {
	const { data, label } = entry;
	if (!isObject(data)) return [`${label} frontmatter must be a JSON object.`];
	const errors = [];

	const ctx = { noun: 'a signal', doc: 'docs/features/signals-and-weekly.md' };
	for (const key of Object.keys(data)) {
		if (lineageNames.has(key.toLowerCase())) {
			errors.push(`${label}.${key} is a forbidden field in a signal: where a signal led is declared on the later explainer or post (\`signals\`), never on the signal.`);
		}
	}
	const skip = Object.keys(data).filter((key) => lineageNames.has(key.toLowerCase()));
	errors.push(...checkFieldNames(data, allowed.top, label, { ...ctx, skip }));
	for (const nested of ['source', 'review']) {
		if (isObject(data[nested])) errors.push(...checkFieldNames(data[nested], allowed[nested], `${label}.${nested}`, ctx));
	}
	errors.push(...scanForbiddenDeep(data, label, { noun: ctx.noun }));

	if (!nonEmpty(data.id) || !slugPattern.test(data.id)) {
		errors.push(`${label}.id must be slug-safe.`);
	} else if (data.id !== entry.fileId) {
		errors.push(`${label}.id "${data.id}" must equal the file name "${entry.fileId}".`);
	}

	if (!nonEmpty(data.title)) errors.push(`${label}.title is required.`);
	if (!isHttpUrl(data.url)) errors.push(`${label}.url is required and must be a valid http/https URL (the original).`);

	if (!isObject(data.source)) {
		errors.push(`${label}.source is required: a signal always names where it came from.`);
	} else {
		if (!nonEmpty(data.source.name)) errors.push(`${label}.source.name is required.`);
		if (!sourceLanguages.has(data.source.language)) errors.push(`${label}.source.language must be one of: ko, en, ja.`);
		if (!sourceKinds.has(data.source.kind)) errors.push(`${label}.source.kind must be one of: ${[...sourceKinds].join(', ')}.`);
	}

	if (!isDateString(data.sourceDate)) errors.push(`${label}.sourceDate must be YYYY-MM-DD.`);
	if (!isDateString(data.keptAt)) errors.push(`${label}.keptAt must be YYYY-MM-DD.`);
	if (isDateString(data.sourceDate) && isDateString(data.keptAt) && data.keptAt < data.sourceDate) {
		errors.push(`${label}.keptAt (${data.keptAt}) is before sourceDate (${data.sourceDate}): an item cannot be kept before it appeared.`);
	}

	if (!verdicts.has(data.verdict)) errors.push(`${label}.verdict must be one of: ${[...verdicts].join(', ')}.`);
	if (!nonEmpty(data.why)) {
		errors.push(`${label}.why is required (one line: why it was kept).`);
	} else if (data.why.length > 200 || /\n/.test(data.why)) {
		errors.push(`${label}.why must be one line of at most 200 characters.`);
	}

	if (!authorships.has(data.authorship)) errors.push(`${label}.authorship must be one of: ${[...authorships].join(', ')}.`);

	// The body (a short note) is optional, so it is never required.
	errors.push(...validateReview(data.review, label, null, data.title));

	if (typeof data.tags !== 'undefined') {
		if (!Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === 'string' && shortSlugPattern.test(tag))) {
			errors.push(`${label}.tags must be short slug-like strings.`);
		}
	}

	return errors;
}
