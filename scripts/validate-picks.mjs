import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
// js-yaml is not a direct dependency of this repo, but it is already
// installed in node_modules as a direct dependency of astro (see astro's
// own package.json), so importing it here for YAML frontmatter parsing adds
// no new dependency.
import yaml from 'js-yaml';

import { isLibrarySectionSlug } from '../src/data/librarySections.ts';
import { isPickKind, isPickTierId } from '../src/data/libraryPolicy.ts';
import { getPickSlug, normalizePickUrl } from '../src/utils/picks.ts';

const root = process.cwd();
const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;
const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const picks = readPicks();
const resources = readResources();
const popularity = readPopularity();

const errors = [];
const warnings = [];

errors.push(...validateUniqueSlugs(picks));

for (const pick of picks) {
	errors.push(...validatePick(pick));
}

errors.push(...validateNoDuplicateUrls(picks));
errors.push(...validateNoResourceDuplicates(picks, resources));
errors.push(...validatePopularityShape(popularity));

for (const pick of picks) {
	if (pick.data.repo && !popularity[pick.data.repo]) {
		warnings.push(`${pick.label} has repo "${pick.data.repo}" with no entry in src/data/popularity.json — run "npm run picks:refresh".`);
	}
}

if (warnings.length > 0) {
	console.warn(`Library picks warnings:\n- ${warnings.join('\n- ')}`);
}

if (errors.length > 0) {
	throw new Error(`Invalid picks content:\n- ${errors.join('\n- ')}`);
}

console.log(`Validated Library picks: ${picks.length} picks, ${Object.keys(popularity).length} popularity entries.`);

function readPicks() {
	const picksRoot = join(root, 'src/content/picks');
	if (!existsSync(picksRoot)) {
		return [];
	}

	return walk(picksRoot)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const label = relative(root, filePath);
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

			if (!match) {
				throw new Error(`${label} is missing frontmatter.`);
			}

			let data;
			try {
				data = yaml.load(match[1]) ?? {};
			} catch (error) {
				throw new Error(`${label} frontmatter must be valid YAML: ${error.message}`);
			}

			return { label, filePath, slug: getPickSlug(filePath), data };
		});
}

function readResources() {
	const resourcesRoot = join(root, 'src/content/resources');
	if (!existsSync(resourcesRoot)) {
		return [];
	}

	return walk(resourcesRoot)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const label = relative(root, filePath);
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

			if (!match) {
				throw new Error(`${label} is missing frontmatter.`);
			}

			let data;
			try {
				data = JSON.parse(match[1]);
			} catch (error) {
				throw new Error(`${label} frontmatter must be valid JSON: ${error.message}`);
			}

			return { label, data };
		});
}

function readPopularity() {
	const popularityPath = join(root, 'src/data/popularity.json');
	if (!existsSync(popularityPath)) {
		return {};
	}

	try {
		return JSON.parse(readFileSync(popularityPath, 'utf8'));
	} catch (error) {
		throw new Error(`src/data/popularity.json must be valid JSON: ${error.message}`);
	}
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function validateUniqueSlugs(picks) {
	const errors = [];
	const seen = new Map();

	for (const pick of picks) {
		if (seen.has(pick.slug)) {
			errors.push(`picks slug "${pick.slug}" is duplicated in ${seen.get(pick.slug)} and ${pick.label} — picks:check relies on unique slugs.`);
		}
		seen.set(pick.slug, pick.label);
	}

	return errors;
}

function validatePick(pick) {
	const { data, label } = pick;
	const errors = [];

	if (typeof data.title !== 'string' || data.title.trim() === '') {
		errors.push(`${label}.title is required.`);
	}

	if (!isHttpUrl(data.url)) {
		errors.push(`${label}.url must be a valid http/https URL.`);
	}

	if (typeof data.repo !== 'undefined' && data.repo !== null && !repoPattern.test(data.repo)) {
		errors.push(`${label}.repo must match "owner/name".`);
	}

	if (!isLibrarySectionSlug(data.section)) {
		errors.push(`${label}.section "${data.section}" is not a known Library section. Add it to src/data/librarySections.ts.`);
	}

	if (!isPickKind(data.kind)) {
		errors.push(`${label}.kind "${data.kind}" is not a recognized pick kind. Add it to src/data/libraryPolicy.ts.`);
	}

	const hasTier = typeof data.tier !== 'undefined' && data.tier !== null;
	if (hasTier && !isPickTierId(data.tier)) {
		errors.push(`${label}.tier "${data.tier}" is not a recognized tier id. Add it to src/data/libraryPolicy.ts.`);
	}

	if (!validateDateField(data.addedAt)) {
		errors.push(`${label}.addedAt is required and must be YYYY-MM-DD (or a YAML date).`);
	}

	if (!validateDateField(data.checkedAt)) {
		errors.push(`${label}.checkedAt is required and must be YYYY-MM-DD (or a YAML date).`);
	}

	if (typeof data.createdAt !== 'undefined' && data.createdAt !== null && !validateDateField(data.createdAt)) {
		errors.push(`${label}.createdAt must be YYYY-MM-DD (or a YAML date) when provided.`);
	}

	const isDraft = data.draft === true;
	const hasRepo = typeof data.repo === 'string' && data.repo.trim() !== '';
	if (!isDraft && !hasRepo && !hasTier) {
		errors.push(`${label} has no repo, so it needs a manual "tier" (sites are tiered manually) — or set draft: true.`);
	}

	return errors;
}

function validateNoDuplicateUrls(picks) {
	const errors = [];
	const seen = new Map();

	for (const pick of picks) {
		let key;
		try {
			key = normalizePickUrl(pick.data.url);
		} catch {
			continue; // already reported by validatePick's isHttpUrl check
		}

		if (seen.has(key)) {
			errors.push(`${pick.label}.url normalizes the same as ${seen.get(key)} — picks must not duplicate each other.`);
		} else {
			seen.set(key, pick.label);
		}
	}

	return errors;
}

function validateNoResourceDuplicates(picks, resources) {
	const errors = [];
	const resourceUrlKeys = new Map();

	for (const resource of resources) {
		for (const url of [resource.data.url, resource.data.repoUrl]) {
			if (typeof url !== 'string') continue;
			try {
				resourceUrlKeys.set(normalizePickUrl(url), resource.label);
			} catch {
				// Malformed resource URLs are library:validate's concern, not ours.
			}
		}
	}

	for (const pick of picks) {
		let key;
		try {
			key = normalizePickUrl(pick.data.url);
		} catch {
			continue;
		}

		if (resourceUrlKeys.has(key)) {
			errors.push(`${pick.label}.url duplicates ${resourceUrlKeys.get(key)} in src/content/resources/ (${pick.data.url}).`);
		}
	}

	return errors;
}

function validatePopularityShape(popularity) {
	if (typeof popularity !== 'object' || popularity === null || Array.isArray(popularity)) {
		return ['src/data/popularity.json must be a JSON object.'];
	}

	const errors = [];

	for (const [key, value] of Object.entries(popularity)) {
		const label = `src/data/popularity.json["${key}"]`;

		if (!repoPattern.test(key)) {
			errors.push(`${label} key must match "owner/name".`);
		}

		if (typeof value !== 'object' || value === null) {
			errors.push(`${label} must be an object.`);
			continue;
		}

		if (!Number.isInteger(value.stars) || value.stars < 0) {
			errors.push(`${label}.stars must be a non-negative integer.`);
		}

		for (const field of ['createdAt', 'pushedAt', 'fetchedAt']) {
			if (typeof value[field] !== 'string' || !dateStringPattern.test(value[field])) {
				errors.push(`${label}.${field} must be YYYY-MM-DD.`);
			}
		}
	}

	return errors;
}

// Accepts both a YAML-parsed Date (unquoted frontmatter date) and a
// YYYY-MM-DD string (quoted frontmatter date) — the same two shapes
// src/content.config.ts's yamlDateString preprocessor normalizes.
function validateDateField(value) {
	if (value instanceof Date) {
		return !Number.isNaN(value.getTime());
	}

	return typeof value === 'string' && dateStringPattern.test(value);
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
