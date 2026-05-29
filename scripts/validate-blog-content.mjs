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
