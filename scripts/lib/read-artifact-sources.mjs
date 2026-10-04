// Reads the Hun-Bot collections the public-artifact adapters consume, from
// disk, in the same `{ id, filePath, data }` shape Astro's getCollection()
// returns — so scripts/validate-artifacts.mjs runs the real adapters
// (src/utils/artifacts/adapters.ts) without an Astro build.
//
// Two things must match Astro exactly, because they become public URLs:
//
// - Entry ids. Astro's glob loader uses `data.slug` when present, otherwise
//   each path segment through github-slugger, joined with "/", with a trailing
//   "/index" removed (astro/dist/content/loaders/glob.js generateIdDefault).
//   github-slugger is already installed as an Astro dependency.
// - Dates. The blog/review schemas coerce `pubDate` with z.coerce.date(), and
//   YAML turns an unquoted date into a Date; both become Date objects here.
//
// Frontmatter is parsed with js-yaml for every collection (JSON frontmatter is
// valid YAML), matching scripts/validate-picks.mjs.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { slug as githubSlug } from 'github-slugger';
import yaml from 'js-yaml';

const CONTENT_EXTENSIONS = new Set(['.md', '.mdx']);

/**
 * @param {string} root - repository root (process.cwd() in validators)
 */
export function readArtifactSources(root) {
	return {
		blog: readCollection(root, 'src/content/blog').map((entry) => ({
			...entry,
			data: {
				...entry.data,
				pubDate: coerceDate(entry.data.pubDate, entry.filePath),
				draft: entry.data.draft === true,
				papers: Array.isArray(entry.data.papers) ? entry.data.papers : [],
			},
		})),
		academicReviews: readCollection(root, 'src/content/academic-reviews').map((entry) => ({
			...entry,
			data: { ...entry.data, pubDate: coerceDate(entry.data.pubDate, entry.filePath), draft: entry.data.draft === true },
		})),
		papers: readCollection(root, 'src/content/papers'),
		picks: readCollection(root, 'src/content/picks').map((entry) => ({
			...entry,
			data: { ...entry.data, draft: entry.data.draft === true },
		})),
		resources: readCollection(root, 'src/content/resources'),
		topics: readCollection(root, 'src/content/topics'),
	};
}

/** Astro glob-loader id for a file path relative to the collection base. */
export function astroEntryId(relativePath, data = {}) {
	if (typeof data.slug === 'string' && data.slug) return data.slug;
	const withoutExtension = relativePath.slice(0, relativePath.length - extname(relativePath).length);
	return withoutExtension
		.split(sep)
		.join('/')
		.split('/')
		.map((segment) => githubSlug(segment))
		.join('/')
		.replace(/\/index$/, '');
}

function readCollection(root, base) {
	const directory = join(root, base);
	if (!existsSync(directory)) return [];

	return walk(directory)
		.filter((filePath) => CONTENT_EXTENSIONS.has(extname(filePath)))
		.map((filePath) => {
			const label = relative(root, filePath);
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			if (!match) throw new Error(`${label} is missing frontmatter.`);

			let data;
			try {
				data = yaml.load(match[1]) ?? {};
			} catch (error) {
				throw new Error(`${label} frontmatter could not be parsed: ${error.message}`);
			}

			return { id: astroEntryId(relative(directory, filePath), data), filePath: label, data };
		});
}

function coerceDate(value, label) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.valueOf())) throw new Error(`${label} has an invalid pubDate: ${String(value)}`);
	return date;
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}
