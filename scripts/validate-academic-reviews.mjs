import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const reviewRoot = join(root, 'src/content/academic-reviews');
const supportedLanguages = new Set(['ko', 'jp', 'en']);
const errors = [];
const warnings = [];
const files = existsSync(reviewRoot)
	? walk(reviewRoot).filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
	: [];

for (const filePath of files) {
	const label = relative(root, filePath);
	const language = relative(reviewRoot, filePath).split(sep)[0];

	if (!supportedLanguages.has(language)) {
		errors.push(`${label} must live under src/content/academic-reviews/{ko,jp,en}/.`);
	}

	const source = readFileSync(filePath, 'utf8');
	const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

	if (!frontmatterMatch) {
		errors.push(`${label} is missing frontmatter.`);
		continue;
	}

	const frontmatter = frontmatterMatch[1];
	const body = source.slice(frontmatterMatch[0].length).trim();

	for (const field of ['title', 'pubDate', 'paper']) {
		if (!hasField(frontmatter, field)) {
			errors.push(`${label} is missing required frontmatter field "${field}".`);
		}
	}

	for (const field of ['title', 'authors', 'url']) {
		if (!hasNestedPaperField(frontmatter, field)) {
			errors.push(`${label}.paper is missing required field "${field}".`);
		}
	}

	const paperUrl = getNestedPaperScalar(frontmatter, 'url');
	if (paperUrl && !isHttpUrl(stripQuotes(paperUrl))) {
		errors.push(`${label}.paper.url must be a valid http/https URL.`);
	}

	const pubDate = getField(frontmatter, 'pubDate');
	if (pubDate && Number.isNaN(Date.parse(stripQuotes(pubDate)))) {
		errors.push(`${label}.pubDate must be parseable as a date.`);
	}

	const year = getNestedPaperScalar(frontmatter, 'year');
	if (year && !/^\d{4}$/.test(stripQuotes(year))) {
		errors.push(`${label}.paper.year must be a four-digit year when provided.`);
	}

	const tags = getField(frontmatter, 'tags');
	if (tags && !tags.includes('[') && !/^\s*tags:\s*\r?\n\s+-\s+/m.test(frontmatter)) {
		errors.push(`${label}.tags must be an inline or block YAML array when provided.`);
	}

	if (!body) {
		warnings.push(`${label} has no public body content.`);
	}
}

if (errors.length > 0) {
	throw new Error(`Invalid academic reviews:\n- ${errors.join('\n- ')}`);
}

if (warnings.length > 0) {
	console.warn(`Academic review warnings:\n- ${warnings.join('\n- ')}`);
}

console.log(`Validated academic review frontmatter: ${files.length} files.`);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function hasField(frontmatter, fieldName) {
	return new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s*:`, 'm').test(frontmatter);
}

function getField(frontmatter, fieldName) {
	const match = frontmatter.match(new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s*:\\s*(.+?)\\s*$`, 'm'));
	return match?.[1]?.trim() ?? '';
}

function hasNestedPaperField(frontmatter, fieldName) {
	return new RegExp(`^\\s{2,}${escapeRegExp(fieldName)}\\s*:`, 'm').test(frontmatter);
}

function getNestedPaperScalar(frontmatter, fieldName) {
	const match = frontmatter.match(new RegExp(`^\\s{2,}${escapeRegExp(fieldName)}\\s*:\\s*(.+?)\\s*$`, 'm'));
	return match?.[1]?.trim() ?? '';
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

function isHttpUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
