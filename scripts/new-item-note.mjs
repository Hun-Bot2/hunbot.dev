// `npm run note:new -- <item-id>`: starts a note for one 자료 item
// (docs/content/item-notes.md). The id is a published resource id or a
// non-draft pick slug. Refuses when a note for the item already exists (an
// item-notes file, or a pick with its own Markdown body). Writes
// src/content/item-notes/<id>.md as a DRAFT with an empty placeholder body; the
// validator accepts an empty body only while `draft: true`. Nothing else is
// touched, and nothing is published until the owner writes the note and sets
// `draft: false`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import yaml from 'js-yaml';

import { noteBodyText, parseAbout } from '../src/utils/item-notes.ts';
import { getPickSlug } from '../src/utils/picks.ts';
import { readJsonFrontmatterDirectory, walk } from './lib/read-json-frontmatter.mjs';

const root = process.cwd();
const id = process.argv[2];
const idPattern = /^[a-z0-9][a-z0-9-]*$/;

function fail(message) {
	console.error(`note:new: ${message}`);
	process.exit(1);
}

if (!id || !idPattern.test(id)) fail('usage: npm run note:new -- <item-id>  (a resource id or a pick slug, e.g. animista)');

const resources = readJsonFrontmatterDirectory(root, 'src/content/resources');
const approved = resources.find((entry) => entry.data.id === id && entry.data.status === 'approved' && entry.data.review?.humanReviewed === true);

const picksDirectory = join(root, 'src/content/picks');
const pickFiles = existsSync(picksDirectory) ? walk(picksDirectory).filter((file) => ['.md', '.mdx'].includes(extname(file))) : [];
const pickFile = pickFiles.find((file) => getPickSlug(basename(file)) === id);
let pick = null;
if (pickFile) {
	const match = readFileSync(pickFile, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (match) pick = { data: yaml.load(match[1]) ?? {}, body: match[2] };
}
const publishedPick = pick && pick.data.draft !== true ? pick : null;

if (approved && pick) fail(`"${id}" is both a resource id and a pick slug; fix that first.`);
if (!approved && !publishedPick) fail(`"${id}" is not a published resource id or a non-draft pick slug.`);
const kind = approved ? 'resource' : 'pick';

if (kind === 'pick' && noteBodyText(publishedPick.body) !== '') fail(`pick "${id}" already has its own Markdown body, which is its note.`);

const notesDirectory = join(root, 'src/content/item-notes');
const target = join(notesDirectory, `${id}.md`);
const existing = existsSync(notesDirectory)
	? walk(notesDirectory)
			.filter((file) => ['.md', '.mdx'].includes(extname(file)))
			.find((file) => {
				const match = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
				const about = match ? parseAbout((yaml.load(match[1]) ?? {}).about) : null;
				return about && about.kind === kind && about.id === id;
			})
	: null;
if (existing || existsSync(target)) fail(`a note for "${id}" already exists (${existing ?? target}).`);

const today = new Date().toISOString().slice(0, 10);
mkdirSync(notesDirectory, { recursive: true });
writeFileSync(
	target,
	`---\nabout: ${kind}:${id}\nwrittenAt: '${today}'\ndraft: true\n---\n\n<!-- 여기에 직접 쓴 노트를 적고, 다 쓰면 draft: true 를 지우세요. -->\n`,
);
console.log(`Created ${target.replace(`${root}/`, '')} (draft). Write the note, then remove "draft: true".`);
