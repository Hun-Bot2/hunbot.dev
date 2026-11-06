// Validates the `weeklyNotes` collection (docs/features/signals-and-weekly.md):
// the owner's conclusions for one week, published on the web and in RSS only.
// An allowlist like `signals`; the week's signals are derived from their
// `keptAt` dates, so a note never lists them.

import { checkFieldNames, scanForbiddenDeep } from './lib/forbidden-fields.mjs';
import {
	isDateString,
	isObject,
	nonEmpty,
	readJsonFrontmatterDirectory,
	validateReview,
} from './lib/read-json-frontmatter.mjs';

const root = process.cwd();
const shortSlugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const authorships = new Set(['bot', 'owner']);

const allowed = {
	top: new Set(['issue', 'title', 'dek', 'weekOf', 'publishedAt', 'resolved', 'openQuestions', 'authorship', 'review', 'tags']),
	resolved: new Set(['question', 'outcome']),
	review: new Set(['status', 'humanReviewed', 'reviewedAt', 'reviewer']),
};

// The week's signals are derived, never listed.
const derivedNames = new Set(['signals', 'signalids', 'entries', 'items']);

const entries = readJsonFrontmatterDirectory(root, 'src/content/weekly-notes');
const errors = [];
const seen = new Map();

for (const entry of entries) {
	errors.push(...validateEntry(entry));
	const issue = entry.data?.issue;
	if (Number.isInteger(issue)) {
		if (seen.has(issue)) errors.push(`weekly note issue ${issue} is duplicated in ${seen.get(issue)} and ${entry.label}.`);
		seen.set(issue, entry.label);
	}
}

if (errors.length > 0) throw new Error(`Invalid weekly notes:\n- ${errors.join('\n- ')}`);

const published = entries.filter((entry) => entry.data.review?.status === 'approved').length;
console.log(`Validated weekly notes: ${entries.length} entries, ${published} published.`);

function validateEntry(entry) {
	const { data, label } = entry;
	if (!isObject(data)) return [`${label} frontmatter must be a JSON object.`];
	const errors = [];

	const ctx = { noun: 'a weekly note', doc: 'docs/features/signals-and-weekly.md' };
	const derived = Object.keys(data).filter((key) => derivedNames.has(key.toLowerCase()));
	for (const key of derived) {
		errors.push(`${label}.${key} is a forbidden field in a weekly note: the week's signals are derived from their keptAt dates, never listed.`);
	}
	errors.push(...checkFieldNames(data, allowed.top, label, { ...ctx, skip: derived }));
	if (isObject(data.review)) errors.push(...checkFieldNames(data.review, allowed.review, `${label}.review`, ctx));
	if (Array.isArray(data.resolved)) {
		data.resolved.forEach((item, index) => {
			if (isObject(item)) errors.push(...checkFieldNames(item, allowed.resolved, `${label}.resolved[${index}]`, ctx));
		});
	}
	errors.push(...scanForbiddenDeep(data, label, { noun: ctx.noun }));

	if (!Number.isInteger(data.issue) || data.issue < 1) {
		errors.push(`${label}.issue must be a positive integer.`);
	} else if (String(data.issue) !== entry.fileId) {
		errors.push(`${label}.issue ${data.issue} must equal the file name "${entry.fileId}" (e.g. 1.md).`);
	}

	if (!nonEmpty(data.title)) errors.push(`${label}.title is required.`);
	if (!nonEmpty(data.dek)) {
		errors.push(`${label}.dek is required.`);
	} else if (data.dek.length > 400) {
		errors.push(`${label}.dek must be 400 characters or fewer.`);
	}

	if (!isDateString(data.weekOf)) {
		errors.push(`${label}.weekOf must be YYYY-MM-DD.`);
	} else if (new Date(`${data.weekOf}T00:00:00Z`).getUTCDay() !== 1) {
		errors.push(`${label}.weekOf ${data.weekOf} must be a Monday (the week runs weekOf through weekOf + 6 days).`);
	}
	if (!isDateString(data.publishedAt)) {
		errors.push(`${label}.publishedAt must be YYYY-MM-DD.`);
	} else if (isDateString(data.weekOf) && data.publishedAt < data.weekOf) {
		errors.push(`${label}.publishedAt (${data.publishedAt}) is before weekOf (${data.weekOf}).`);
	}

	if (typeof data.resolved !== 'undefined') {
		if (!Array.isArray(data.resolved)) {
			errors.push(`${label}.resolved must be an array of { question, outcome }.`);
		} else {
			data.resolved.forEach((item, index) => {
				if (!isObject(item) || !nonEmpty(item.question) || !nonEmpty(item.outcome)) {
					errors.push(`${label}.resolved[${index}] must be { question, outcome }, both non-empty strings.`);
				}
			});
		}
	}
	if (typeof data.openQuestions !== 'undefined') {
		if (!Array.isArray(data.openQuestions) || !data.openQuestions.every(nonEmpty)) {
			errors.push(`${label}.openQuestions must be an array of non-empty strings.`);
		}
	}

	if (!authorships.has(data.authorship)) errors.push(`${label}.authorship must be one of: ${[...authorships].join(', ')}.`);
	errors.push(...validateReview(data.review, label, entry.body, data.title));

	if (typeof data.tags !== 'undefined') {
		if (!Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === 'string' && shortSlugPattern.test(tag))) {
			errors.push(`${label}.tags must be short slug-like strings.`);
		}
	}

	return errors;
}
