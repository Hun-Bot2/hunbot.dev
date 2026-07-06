import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const blogRoot = join(root, 'src/content/blog');
const academicReviewRoot = join(root, 'src/content/academic-reviews');
const libraryRoots = {
	resources: join(root, 'src/content/resources'),
	papers: join(root, 'src/content/papers'),
	topics: join(root, 'src/content/topics'),
};

const blogFiles = existsSync(blogRoot)
	? walk(blogRoot).filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
	: [];
const academicReviewFiles = existsSync(academicReviewRoot)
	? walk(academicReviewRoot).filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
	: [];

const blogSummary = {
	total: blogFiles.length,
	byLanguage: new Map(),
	byCategory: new Map(),
	emptyBodies: [],
	missingDescriptions: [],
	duplicateTitles: [],
};
const titlesByLanguage = new Map();
const academicReviewSummary = {
	total: academicReviewFiles.length,
	byLanguage: new Map(),
	emptyBodies: [],
};

for (const filePath of blogFiles) {
	const relativePath = relative(blogRoot, filePath);
	const language = relativePath.split(sep)[0] || 'unknown';
	const source = readFileSync(filePath, 'utf8');
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
	const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
	const category = getField(frontmatter, 'category') || 'uncategorized';
	const title = getField(frontmatter, 'title') || '';
	const description = getField(frontmatter, 'description') || '';

	increment(blogSummary.byLanguage, language);
	increment(blogSummary.byCategory, `${language}:${category}`);

	if (!body) {
		blogSummary.emptyBodies.push(relative(root, filePath));
	}

	if (!description.trim()) {
		blogSummary.missingDescriptions.push(relative(root, filePath));
	}

	if (title) {
		const titleKey = `${language}:${title}`;
		const firstPath = titlesByLanguage.get(titleKey);
		if (firstPath) {
			blogSummary.duplicateTitles.push([firstPath, relative(root, filePath)]);
		} else {
			titlesByLanguage.set(titleKey, relative(root, filePath));
		}
	}
}

for (const filePath of academicReviewFiles) {
	const relativePath = relative(academicReviewRoot, filePath);
	const language = relativePath.split(sep)[0] || 'unknown';
	const source = readFileSync(filePath, 'utf8');
	const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();

	increment(academicReviewSummary.byLanguage, language);

	if (!body) {
		academicReviewSummary.emptyBodies.push(relative(root, filePath));
	}
}

const librarySummary = Object.fromEntries(
	Object.entries(libraryRoots).map(([name, directory]) => [name, summarizeJsonFrontmatterCollection(directory)]),
);

printBlogSummary(blogSummary);
printAcademicReviewSummary(academicReviewSummary);
printLibrarySummary(librarySummary);

function summarizeJsonFrontmatterCollection(directory) {
	if (!existsSync(directory)) {
		return { total: 0, byStatus: new Map() };
	}

	const files = walk(directory).filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)));
	const byStatus = new Map();

	for (const filePath of files) {
		const source = readFileSync(filePath, 'utf8');
		const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!match) {
			increment(byStatus, 'missing-frontmatter');
			continue;
		}

		try {
			const data = JSON.parse(match[1]);
			increment(byStatus, data.status || 'unknown');
		} catch {
			increment(byStatus, 'invalid-json');
		}
	}

	return { total: files.length, byStatus };
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function increment(map, key) {
	map.set(key, (map.get(key) ?? 0) + 1);
}

function getField(frontmatter, fieldName) {
	const match = frontmatter.match(new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s*:\\s*(.+?)\\s*$`, 'm'));
	return match ? stripQuotes(match[1].trim()) : '';
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

function printBlogSummary(summary) {
	console.log(`Blog files: ${summary.total}`);
	console.log(`By language: ${formatMap(summary.byLanguage)}`);
	console.log(`Top categories: ${formatMap(summary.byCategory, 12)}`);
	console.log(`Empty bodies: ${summary.emptyBodies.length}`);
	console.log(`Missing descriptions: ${summary.missingDescriptions.length}`);
	console.log(`Duplicate titles within a language: ${summary.duplicateTitles.length}`);

	if (summary.emptyBodies.length > 0) {
		console.log(`Empty body samples: ${summary.emptyBodies.slice(0, 8).join(', ')}`);
	}
}

function printAcademicReviewSummary(summary) {
	console.log(`Academic review files: ${summary.total}`);
	console.log(`Academic reviews by language: ${formatMap(summary.byLanguage)}`);
	console.log(`Academic review empty bodies: ${summary.emptyBodies.length}`);

	if (summary.emptyBodies.length > 0) {
		console.log(`Academic review empty body samples: ${summary.emptyBodies.slice(0, 8).join(', ')}`);
	}
}

function printLibrarySummary(summary) {
	for (const [collection, data] of Object.entries(summary)) {
		console.log(`${collection}: ${data.total} files (${formatMap(data.byStatus)})`);
	}
}

function formatMap(map, limit = Number.POSITIVE_INFINITY) {
	const entries = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	const visibleEntries = entries.slice(0, limit);
	return visibleEntries.map(([key, value]) => `${key}=${value}`).join(', ') || 'none';
}
