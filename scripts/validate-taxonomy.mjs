// Validates the topic taxonomy lifecycle fields (parent, order, aliases,
// mergedInto) described in docs/decisions/discover-direction.md#Taxonomy.
//
// The taxonomy is data, not code: this script cross-checks the
// `src/content/topics` collection against itself (and against the topic
// references made by papers/resources) instead of matching a fixed list.
//
// Idiom matches scripts/validate-library.mjs: no dependencies beyond Node
// built-ins, JSON frontmatter, a flat array of collected error strings
// thrown together at the end.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();

const topics = readCollection('topics', 'src/content/topics');
const papers = readCollection('papers', 'src/content/papers');
const resources = readCollection('resources', 'src/content/resources');

const errors = [];

// --- Build lookups: id -> entry, alias -> owning entries -----------------

const topicById = new Map();
for (const entry of topics) {
	const id = entry.data.id;
	if (typeof id !== 'string') continue;

	if (topicById.has(id)) {
		errors.push(`Duplicate topic id "${id}": declared by both ${topicById.get(id).label} and ${entry.label}.`);
		continue;
	}

	topicById.set(id, entry);
}

const aliasOwners = new Map();
for (const entry of topics) {
	const aliases = Array.isArray(entry.data.aliases) ? entry.data.aliases : [];
	const seenOnThisTopic = new Set();

	for (const alias of aliases) {
		if (seenOnThisTopic.has(alias)) {
			errors.push(`${entry.label} declares alias "${alias}" more than once.`);
		}
		seenOnThisTopic.add(alias);

		if (!aliasOwners.has(alias)) {
			aliasOwners.set(alias, []);
		}
		aliasOwners.get(alias).push(entry);
	}
}

for (const [alias, owners] of aliasOwners) {
	if (owners.length > 1) {
		errors.push(
			`Alias "${alias}" is declared by more than one topic: ${owners.map((owner) => owner.label).join(', ')}.`,
		);
	}

	if (topicById.has(alias)) {
		errors.push(`Alias "${alias}" collides with the id of topic ${topicById.get(alias).label}.`);
	}
}

/** Resolves an id or a (uniquely-owned) alias to its topic entry. */
function resolveTopic(idOrAlias) {
	if (topicById.has(idOrAlias)) {
		return topicById.get(idOrAlias);
	}

	const owners = aliasOwners.get(idOrAlias);
	if (owners && owners.length === 1) {
		return owners[0];
	}

	return undefined;
}

// --- parent: must resolve, and must not cycle -----------------------------

for (const entry of topics) {
	const parent = entry.data.parent;
	if (parent === null || typeof parent === 'undefined') continue;

	if (!topicById.has(parent)) {
		errors.push(`${entry.label}.parent references unknown topic id "${parent}". parent must be an existing topic id or null.`);
	}
}

for (const entry of topics) {
	const id = entry.data.id;
	if (typeof id !== 'string') continue;

	const seen = new Set([id]);
	let current = entry.data.parent;
	let guard = 0;

	while (current !== null && typeof current !== 'undefined') {
		guard += 1;
		if (guard > topics.length + 1) {
			errors.push(`${entry.label} has a parent cycle: exceeded maximum depth walking up from "${id}".`);
			break;
		}

		if (seen.has(current)) {
			errors.push(`${entry.label} is part of a parent cycle: reached "${current}" again while walking up from "${id}".`);
			break;
		}
		seen.add(current);

		const next = topicById.get(current);
		if (!next) break; // unresolved parent already reported above

		current = next.data.parent;
	}
}

// --- mergedInto: must resolve, and must not cycle -------------------------

for (const entry of topics) {
	const mergedInto = entry.data.mergedInto;
	if (mergedInto === null || typeof mergedInto === 'undefined') continue;

	if (!topicById.has(mergedInto)) {
		errors.push(`${entry.label}.mergedInto references unknown topic id "${mergedInto}".`);
	}
}

for (const entry of topics) {
	const id = entry.data.id;
	if (typeof id !== 'string') continue;

	const seen = new Set([id]);
	let current = entry.data.mergedInto;
	let guard = 0;

	while (current !== null && typeof current !== 'undefined') {
		guard += 1;
		if (guard > topics.length + 1) {
			errors.push(`${entry.label} has a mergedInto cycle: exceeded maximum depth resolving merges from "${id}".`);
			break;
		}

		if (seen.has(current)) {
			errors.push(`${entry.label} is part of a mergedInto cycle: reached "${current}" again while resolving merges from "${id}".`);
			break;
		}
		seen.add(current);

		const next = topicById.get(current);
		if (!next) break; // unresolved mergedInto already reported above

		current = next.data.mergedInto;
	}
}

// --- archived topics must not have active children ------------------------

for (const entry of topics) {
	if (entry.data.status !== 'archived') continue;

	const id = entry.data.id;
	const activeChildren = topics.filter((child) => child.data.parent === id && child.data.status === 'active');

	for (const child of activeChildren) {
		errors.push(`${entry.label} is archived but has an active child ${child.label} (parent "${id}"). Re-parent or archive the child first.`);
	}
}

// --- item topic references must resolve to active-or-merged nodes --------

/**
 * Walks a topic's mergedInto chain to whatever it ultimately resolves to.
 * Returns the terminal active entry, or null if the chain dead-ends
 * (draft, archived-without-merge) or cycles (already reported above).
 */
function resolveMergeTarget(startEntry) {
	const seen = new Set();
	let current = startEntry;

	while (current) {
		const id = current.data.id;
		if (seen.has(id)) return null;
		seen.add(id);

		if (current.data.status === 'active') return current;

		if (current.data.status === 'archived' && current.data.mergedInto) {
			current = topicById.get(current.data.mergedInto);
			continue;
		}

		return null;
	}

	return null;
}

function validateItemTopicRefs(entry, field) {
	const value = entry.data[field];
	if (!Array.isArray(value)) return;

	for (const topicId of value) {
		const resolved = resolveTopic(topicId);
		if (!resolved) continue; // unknown topic ids are scripts/validate-library.mjs's concern

		if (resolved.data.status === 'active') continue;

		const target = resolveMergeTarget(resolved);
		if (!target) {
			errors.push(
				`${entry.label}.${field} references topic "${topicId}" (${resolved.label}, status "${resolved.data.status}"), which is neither active nor merged into an active topic.`,
			);
		}
	}
}

for (const entry of papers) {
	validateItemTopicRefs(entry, 'topics');
}

for (const entry of resources) {
	validateItemTopicRefs(entry, 'relatedTopics');
}

if (errors.length > 0) {
	throw new Error(`Invalid taxonomy:\n- ${errors.join('\n- ')}`);
}

console.log(`Validated taxonomy: ${topics.length} topics, ${papers.length} papers, ${resources.length} resources checked for topic references.`);

// --- helpers ---------------------------------------------------------------

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
