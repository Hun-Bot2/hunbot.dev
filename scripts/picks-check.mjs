import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const root = process.cwd();
const picksRoot = join(root, 'src/content/picks');

const slug = process.argv[2];
if (!slug) {
	console.error('Usage: npm run picks:check -- <slug>');
	process.exit(1);
}

if (!existsSync(picksRoot)) {
	console.error(`No pick found with slug "${slug}" — src/content/picks/ does not exist.`);
	process.exit(1);
}

const matches = walk(picksRoot).filter(
	(filePath) => ['.md', '.mdx'].includes(extname(filePath)) && basename(filePath, extname(filePath)) === slug,
);

if (matches.length === 0) {
	console.error(`No pick found with slug "${slug}" under src/content/picks/.`);
	process.exit(1);
}

if (matches.length > 1) {
	console.error(
		`Multiple picks match slug "${slug}":\n` + matches.map((filePath) => `  - ${relative(root, filePath)}`).join('\n'),
	);
	process.exit(1);
}

const filePath = matches[0];
const label = relative(root, filePath);
const source = readFileSync(filePath, 'utf8');
const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

if (!frontmatterMatch) {
	console.error(`${label} is missing frontmatter.`);
	process.exit(1);
}

const frontmatter = frontmatterMatch[1];
const today = todayLocalDateString();
const newLine = `checkedAt: '${today}'`;
const checkedAtLinePattern = /^checkedAt:.*$/m;

let updatedFrontmatter;
let message;

if (checkedAtLinePattern.test(frontmatter)) {
	const existingLine = frontmatter.match(checkedAtLinePattern)[0];

	if (existingLine === newLine) {
		console.log(`${label}: checkedAt is already '${today}'; no change.`);
		process.exit(0);
	}

	updatedFrontmatter = frontmatter.replace(checkedAtLinePattern, newLine);
	message = `${label}: checkedAt ${existingLine.replace(/^checkedAt:\s*/, '')} -> '${today}'`;
} else {
	const addedAtLinePattern = /^addedAt:.*$/m;

	if (!addedAtLinePattern.test(frontmatter)) {
		console.error(`${label} has neither "checkedAt" nor "addedAt" in its frontmatter; cannot insert checkedAt.`);
		process.exit(1);
	}

	updatedFrontmatter = frontmatter.replace(addedAtLinePattern, (line) => `${line}\n${newLine}`);
	message = `${label}: inserted checkedAt '${today}'`;
}

// Splice the updated frontmatter back in by offset rather than
// String.replace on the whole source, so nothing outside the frontmatter
// block is ever touched, byte for byte.
const frontmatterStart = source.indexOf(frontmatter, frontmatterMatch.index);
const frontmatterEnd = frontmatterStart + frontmatter.length;
const updatedSource = source.slice(0, frontmatterStart) + updatedFrontmatter + source.slice(frontmatterEnd);

writeFileSync(filePath, updatedSource);
console.log(message);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function todayLocalDateString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
