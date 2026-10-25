// Validates the `itemNotes` collection (docs/content/item-notes.md): the owner's
// own commentary on one 자료 item. `about` must resolve, an item has at most one
// note, the body is not empty, a published note carries no TEMP: placeholder,
// and the automatable copying guardrail: the note may not repeat a 40+ character
// run of the item's delivered `summary`.

import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import yaml from 'js-yaml';

import { findPageIdCollisions, longestSharedRun, noteBodyText, parseAbout } from '../src/utils/item-notes.ts';
import { getPickSlug } from '../src/utils/picks.ts';
import { isDateString, isObject, readJsonFrontmatterDirectory, walk } from './lib/read-json-frontmatter.mjs';

const root = process.cwd();
const allowed = new Set(['about', 'writtenAt', 'updatedAt', 'draft', 'tags']);
const slugPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const copyRunLength = 40;

const notes = readYamlDirectory('src/content/item-notes');
const picks = readYamlDirectory('src/content/picks');
const resources = readJsonFrontmatterDirectory(root, 'src/content/resources');

const resourceById = new Map(resources.map((entry) => [entry.data.id, entry]));
const pickBySlug = new Map(picks.map((entry) => [getPickSlug(entry.filePath), entry]));
const errors = [];

for (const slug of findPageIdCollisions([...resourceById.keys()], [...pickBySlug.keys()])) {
	errors.push(`"${slug}" is both a resource id and a pick slug: /library/item/${slug}/ would be ambiguous.`);
}

const noteFor = new Map();
for (const note of notes) {
	errors.push(...validateNote(note));
	const ref = parseAbout(note.data.about);
	if (!ref) continue;
	const key = `${ref.kind}:${ref.id}`;
	if (noteFor.has(key)) errors.push(`${note.label}: ${key} already has a note in ${noteFor.get(key)} (at most one note per item).`);
	noteFor.set(key, note.label);
	if (ref.kind === 'pick') {
		const pick = pickBySlug.get(ref.id);
		if (pick && noteBodyText(pick.body) !== '') {
			errors.push(`${note.label}: pick "${ref.id}" already has its own Markdown body, which is its note (one note per item).`);
		}
	}
}

for (const pick of picks) {
	// A pick's own body is its note: the same guardrails apply to it.
	if (noteBodyText(pick.body) === '' || pick.data.draft === true) continue;
	if (/\bTEMP:/.test(pick.body)) errors.push(`${pick.label}: a published pick note may not contain TEMP:.`);
}

if (errors.length > 0) throw new Error(`Invalid item notes:\n- ${errors.join('\n- ')}`);

const published = notes.filter((note) => note.data.draft !== true).length;
console.log(`Validated item notes: ${notes.length} notes, ${published} published.`);

function validateNote(note) {
	const { data, label } = note;
	if (!isObject(data)) return [`${label} frontmatter must be a YAML mapping.`];
	const errors = [];

	for (const key of Object.keys(data)) {
		if (!allowed.has(key)) errors.push(`${label}.${key} is not an allowed item-note field (allowed: ${[...allowed].join(', ')}).`);
	}

	const ref = parseAbout(data.about);
	let item = null;
	if (!ref) {
		errors.push(`${label}.about must be "resource:<id>" or "pick:<slug>".`);
	} else if (ref.kind === 'resource') {
		item = resourceById.get(ref.id) ?? null;
		if (!item) errors.push(`${label}.about "${data.about}" does not match any resource id.`);
		else if (data.draft !== true && !(item.data.status === 'approved' && item.data.review?.humanReviewed === true)) {
			errors.push(`${label}.about "${data.about}" is not a published resource, so a non-draft note cannot be about it.`);
		}
	} else {
		item = pickBySlug.get(ref.id) ?? null;
		if (!item) errors.push(`${label}.about "${data.about}" does not match any pick slug.`);
		else if (data.draft !== true && item.data.draft === true) {
			errors.push(`${label}.about "${data.about}" is a draft pick, so a non-draft note cannot be about it.`);
		}
	}

	const dateOf = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value);
	const writtenAt = dateOf(data.writtenAt);
	const updatedAt = dateOf(data.updatedAt);
	if (!isDateString(writtenAt)) errors.push(`${label}.writtenAt must be YYYY-MM-DD.`);
	if (typeof data.updatedAt !== 'undefined') {
		if (!isDateString(updatedAt)) errors.push(`${label}.updatedAt must be YYYY-MM-DD.`);
		else if (isDateString(writtenAt) && updatedAt < writtenAt) errors.push(`${label}.updatedAt (${updatedAt}) is before writtenAt (${writtenAt}).`);
	}
	if (typeof data.draft !== 'undefined' && typeof data.draft !== 'boolean') errors.push(`${label}.draft must be true or false.`);
	if (typeof data.tags !== 'undefined' && (!Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === 'string' && slugPattern.test(tag)))) {
		errors.push(`${label}.tags must be short slug-like strings.`);
	}

	// A draft may hold only the placeholder comment `npm run note:new` writes; a published note needs text.
	if (data.draft !== true && noteBodyText(note.body) === '') errors.push(`${label}: the note body is empty (a note is its body; only a draft may be a placeholder).`);
	if (data.draft !== true && /\bTEMP:/.test(note.body)) errors.push(`${label}: a published note may not contain TEMP:.`);

	// Copying guardrail: the delivered summary is the item's own text.
	if (item && ref?.kind === 'resource' && isObject(item.data.summary)) {
		for (const [language, summary] of Object.entries(item.data.summary)) {
			if (typeof summary !== 'string') continue;
			const run = longestSharedRun(note.body, summary, copyRunLength);
			if (run >= copyRunLength) {
				errors.push(`${label}: the note repeats ${run} characters of the item's ${language} summary; write it in your own words (docs/content/item-notes.md).`);
			}
		}
	}
	return errors;
}

function readYamlDirectory(directory) {
	const full = join(root, directory);
	if (!existsSync(full)) return [];
	return walk(full)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const label = relative(root, filePath);
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
			if (!match) throw new Error(`${label} is missing frontmatter.`);
			let data;
			try {
				data = yaml.load(match[1]) ?? {};
			} catch (error) {
				throw new Error(`${label} frontmatter must be valid YAML: ${error.message}`);
			}
			return { filePath, label, fileId: basename(filePath, extname(filePath)), data, body: match[2] };
		});
}
