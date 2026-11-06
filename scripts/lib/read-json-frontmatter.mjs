// Reads a content directory of Markdown files with JSON frontmatter (the shape
// `resources`, `papers`, `explainers`, `signals` and `weeklyNotes` use).
// The repository is `process.cwd()`, so tests can point a validator at a
// fixture directory (test/helpers/validator-harness.mjs).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

export function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(dir, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

export function readJsonFrontmatterDirectory(root, directory) {
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

export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const nonEmpty = (value) => typeof value === 'string' && value.trim() !== '';

export function isHttpUrl(value) {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/** A real calendar date in YYYY-MM-DD form. */
export function isDateString(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

/** Validates the shared `review` block; approved records must be human reviewed and dated. */
export function validateReview(review, label, entryBody, title) {
	const errors = [];
	const statuses = ['draft', 'pending', 'approved', 'rejected'];
	if (!isObject(review)) return [`${label}.review is required.`];
	if (!statuses.includes(review.status)) errors.push(`${label}.review.status must be one of: ${statuses.join(', ')}.`);
	if (typeof review.humanReviewed !== 'boolean') errors.push(`${label}.review.humanReviewed must be a boolean.`);
	if (review.reviewedAt !== null && typeof review.reviewedAt !== 'undefined' && !isDateString(review.reviewedAt)) {
		errors.push(`${label}.review.reviewedAt must be YYYY-MM-DD or null.`);
	}
	if (review.status === 'approved') {
		if (review.humanReviewed !== true) errors.push(`${label} is approved but review.humanReviewed is not true.`);
		if (!isDateString(review.reviewedAt ?? '')) errors.push(`${label} is approved but review.reviewedAt is missing.`);
		if (/^\s*TEMP:/i.test(title ?? '')) errors.push(`${label} is approved but its title is a TEMP: placeholder — revert it to draft.`);
		if (entryBody !== null && entryBody.trim() === '') errors.push(`${label} is approved but has no body.`);
	}
	return errors;
}
