import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const blogRoot = join(root, 'src/content/blog');
const supportedLanguages = new Set(['ko', 'jp', 'en']);
const requiredFields = ['title', 'description', 'pubDate'];

const errors = [];
const warnings = [];
const files = existsSync(blogRoot)
	? walk(blogRoot).filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
	: [];

// Frontmatter records for the placeholder/duplicate report below, gathered
// alongside the per-file checks so we don't re-read every file.
const frontmatterRecords = [];

for (const filePath of files) {
	const label = relative(root, filePath);
	const language = relative(blogRoot, filePath).split(sep)[0];

	if (!supportedLanguages.has(language)) {
		errors.push(`${label} must live under src/content/blog/{ko,jp,en}/.`);
	}

	const source = readFileSync(filePath, 'utf8');
	const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

	if (!frontmatterMatch) {
		errors.push(`${label} is missing frontmatter.`);
		continue;
	}

	const frontmatter = frontmatterMatch[1];
	const body = source.slice(frontmatterMatch[0].length).trim();

	for (const field of requiredFields) {
		if (!hasField(frontmatter, field)) {
			errors.push(`${label} is missing required frontmatter field "${field}".`);
		}
	}

	if (!body) {
		warnings.push(`${label} has no public body content.`);
	}

	validateDateField(frontmatter, 'pubDate', label);
	validateDateField(frontmatter, 'updatedDate', label);
	validateStringField(frontmatter, 'heroImage', label);
	validateStringField(frontmatter, 'category', label);
	validateStringField(frontmatter, 'series', label);
	validateSeriesOrder(frontmatter, label);
	validateTags(frontmatter, label);

	frontmatterRecords.push({
		label,
		language,
		draft: getField(frontmatter, 'draft') === 'true',
		title: getField(frontmatter, 'title'),
		description: getField(frontmatter, 'description'),
		pubDate: getField(frontmatter, 'pubDate'),
		category: getField(frontmatter, 'category'),
		series: getField(frontmatter, 'series'),
		tags: getField(frontmatter, 'tags'),
	});
}

// Placeholder / duplicate frontmatter report.
// Mirrors getFrontmatterIssues() / excludeDuplicates() in src/utils/blog.ts —
// posts these rules exclude never render, but the backlog should stay visible
// here rather than silently disappearing.
const PLACEHOLDER_DESCRIPTIONS = new Set(['설명 입력', 'Enter description', '説明を入力']);
const PLACEHOLDER_TAGS = new Set(['tag1', 'tag2', 'tag']);
const PLACEHOLDER_CATEGORY = 'category';
const PLACEHOLDER_SERIES = new Set(['series 이름', 'series name']);

const placeholderReport = [];

for (const record of frontmatterRecords) {
	if (record.draft) continue;

	const reasons = [];
	const trimmedDescription = (record.description ?? '').trim();

	if (PLACEHOLDER_DESCRIPTIONS.has(trimmedDescription)) {
		reasons.push('placeholder description');
	}

	if (record.tags && parseTagList(record.tags).some((tag) => PLACEHOLDER_TAGS.has(tag.trim().toLowerCase()))) {
		reasons.push('placeholder tags');
	}

	if (record.category && record.category.trim().toLowerCase() === PLACEHOLDER_CATEGORY) {
		reasons.push('placeholder category');
	}

	if (record.series && PLACEHOLDER_SERIES.has(record.series.trim().toLowerCase())) {
		reasons.push('placeholder series');
	}

	if (reasons.length > 0) {
		placeholderReport.push({ record, reasons });
	}
}

const duplicateCounts = new Map();
for (const record of frontmatterRecords) {
	if (record.draft || !record.title || !record.pubDate) continue;
	const key = `${record.language}::${record.title.trim()}::${record.pubDate.trim()}`;
	duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
}

for (const record of frontmatterRecords) {
	if (record.draft || !record.title || !record.pubDate) continue;
	const key = `${record.language}::${record.title.trim()}::${record.pubDate.trim()}`;
	if (duplicateCounts.get(key) > 1) {
		const existing = placeholderReport.find((entry) => entry.record === record);
		if (existing) {
			existing.reasons.push('duplicate title+pubDate');
		} else {
			placeholderReport.push({ record, reasons: ['duplicate title+pubDate'] });
		}
	}
}

if (placeholderReport.length > 0) {
	warnings.push(
		`${placeholderReport.length} post(s) excluded from publishing by the frontmatter quality gate ` +
			'(see getAllPosts() in src/utils/blog.ts):\n  ' +
			placeholderReport
				.map(({ record, reasons }) => `${record.label}: ${reasons.join(', ')}`)
				.join('\n  '),
	);
}

// Unpublished-post leak guard.
//
// A post is published only when it is not a draft AND has no placeholder
// frontmatter. `getAllPosts()` in src/utils/blog.ts is the single place that
// applies both. A route reading the collection itself can only reproduce the
// first half, and reproducing half of a definition is what this guard exists to
// prevent.
//
// This previously accepted a route that passed its own `!data.draft` predicate,
// which was too weak twice over: the substring test matched only the bare
// `getCollection('blog')` form and skipped any route that passed arguments, and
// a draft filter alone is not what "published" means. The cost was real —
// src/pages/sitemap.xml.ts and both rss.xml.js routes advertised 15
// quality-gate-excluded posts as live URLs, so the site submitted 404s to search
// engines and shipped dead links to every feed reader (found 2026-09-23).
//
// The rule is now simply: no route reads the blog collection. Use getAllPosts().
const routeFiles = [];
(function collectRoutes(directory) {
	if (!existsSync(directory)) return;

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const entryPath = join(directory, entry.name);

		if (entry.isDirectory()) {
			collectRoutes(entryPath);
			continue;
		}

		if (['.astro', '.ts', '.js'].includes(extname(entry.name))) {
			routeFiles.push(entryPath);
		}
	}
})(join(root, 'src/pages'));

for (const routeFile of routeFiles) {
	const source = readFileSync(routeFile, 'utf8');
	// Matches every call shape — bare, with a predicate, with whitespace or a
	// newline before the argument — because the previous substring test matched
	// exactly one of them and silently skipped the rest.
	if (!/getCollection\(\s*['"`]blog['"`]/.test(source)) continue;

	errors.push(
		`${relative(root, routeFile)} reads the blog collection directly. ` +
			'Use getAllPosts() from src/utils/blog.ts: it is the only place that applies both the draft ' +
			'filter and the placeholder-frontmatter quality gate, and a route applying just one of them ' +
			'publishes links to pages that are never built.',
	);
}

if (errors.length > 0) {
	throw new Error(`Invalid blog content:\n- ${errors.join('\n- ')}`);
}

if (warnings.length > 0) {
	console.warn(`Blog content warnings:\n- ${warnings.join('\n- ')}`);
}

console.log(`Validated blog content frontmatter: ${files.length} files.`);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function getField(frontmatter, fieldName) {
	const match = frontmatter.match(new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s*:\\s*(.+?)\\s*$`, 'm'));
	return match ? stripQuotes(match[1].trim()) : null;
}

function hasField(frontmatter, fieldName) {
	return new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s*:`, 'm').test(frontmatter);
}

function validateDateField(frontmatter, fieldName, label) {
	const value = getField(frontmatter, fieldName);
	if (value && Number.isNaN(Date.parse(value))) {
		errors.push(`${label}.${fieldName} must be parseable as a date.`);
	}
}

function validateStringField(frontmatter, fieldName, label) {
	const value = getField(frontmatter, fieldName);
	if (value !== null && typeof value !== 'string') {
		errors.push(`${label}.${fieldName} must be a string when provided.`);
	}
}

function validateSeriesOrder(frontmatter, label) {
	const value = getField(frontmatter, 'seriesOrder');
	if (value !== null && !/^\d+$/.test(value)) {
		errors.push(`${label}.seriesOrder must be an integer when provided.`);
	}
}

function validateTags(frontmatter, label) {
	const value = getField(frontmatter, 'tags');
	if (value !== null && !(value.startsWith('[') && value.endsWith(']'))) {
		errors.push(`${label}.tags should be an inline array when provided.`);
	}
}

function stripQuotes(value) {
	if (
		(value.startsWith("'") && value.endsWith("'")) ||
		(value.startsWith('"') && value.endsWith('"'))
	) {
		return value.slice(1, -1).trim();
	}

	return value.trim();
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parses a raw `tags: ['a', 'b']` frontmatter value into individual tag strings.
function parseTagList(rawValue) {
	const inner = rawValue.trim().replace(/^\[/, '').replace(/\]$/, '');
	if (!inner.trim()) return [];

	return inner
		.split(',')
		.map((entry) => stripQuotes(entry.trim()))
		.filter((entry) => entry.length > 0);
}
