import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
// js-yaml is not a direct dependency of this repo, but it is already
// installed in node_modules as a direct dependency of astro (see astro's
// own package.json), so importing it here for YAML frontmatter parsing adds
// no new dependency.
import yaml from 'js-yaml';

const root = process.cwd();
const picksRoot = join(root, 'src/content/picks');
const popularityPath = join(root, 'src/data/popularity.json');

const repos = collectReferencedRepos();
const previousSnapshot = readPreviousSnapshot();

const nextSnapshot = {};
let failureCount = 0;
let successCount = 0;

for (const repo of [...repos].sort()) {
	const result = await fetchRepoPopularity(repo);

	if (result.ok) {
		nextSnapshot[repo] = result.entry;
		successCount += 1;

		if (result.renamedTo && result.renamedTo !== repo) {
			console.warn(`[picks:refresh] "${repo}" has been renamed on GitHub. Update the pick's repo to "${result.renamedTo}".`);
		}
	} else {
		failureCount += 1;
		console.error(`[picks:refresh] failed to refresh "${repo}": ${result.reason}`);

		if (previousSnapshot[repo]) {
			nextSnapshot[repo] = previousSnapshot[repo];
			console.error(`[picks:refresh] keeping previous entry for "${repo}" (fetched ${previousSnapshot[repo].fetchedAt}).`);
		}
	}
}

const prunedKeys = Object.keys(previousSnapshot).filter((key) => !repos.has(key));
for (const key of prunedKeys) {
	console.log(`[picks:refresh] pruning "${key}" — no pick references it anymore.`);
}

writePopularity(nextSnapshot);

console.log(
	`[picks:refresh] refreshed ${repos.size} repo(s): ${successCount} ok, ${failureCount} failed, ${prunedKeys.length} pruned.`,
);

if (failureCount > 0) {
	process.exit(1);
}

function collectReferencedRepos() {
	const repos = new Set();
	if (!existsSync(picksRoot)) {
		return repos;
	}

	for (const filePath of walk(picksRoot)) {
		if (!['.md', '.mdx'].includes(extname(filePath))) continue;

		const source = readFileSync(filePath, 'utf8');
		const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!match) continue;

		const data = yaml.load(match[1]) ?? {};
		if (typeof data.repo === 'string' && data.repo.trim() !== '') {
			repos.add(data.repo.trim());
		}
	}

	return repos;
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function readPreviousSnapshot() {
	if (!existsSync(popularityPath)) {
		return {};
	}

	try {
		return JSON.parse(readFileSync(popularityPath, 'utf8'));
	} catch (error) {
		console.error(`[picks:refresh] could not parse existing ${relative(root, popularityPath)}: ${error.message}`);
		return {};
	}
}

async function fetchRepoPopularity(repo) {
	const headers = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'hun-bot-blog-picks-refresh',
	};

	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	let response;
	try {
		response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
	} catch (error) {
		return { ok: false, reason: `network error (${error.message})` };
	}

	if (!response.ok) {
		return { ok: false, reason: `GitHub API returned ${response.status} ${response.statusText}` };
	}

	let body;
	try {
		body = await response.json();
	} catch (error) {
		return { ok: false, reason: `could not parse GitHub API response (${error.message})` };
	}

	if (
		typeof body.stargazers_count !== 'number' ||
		typeof body.created_at !== 'string' ||
		typeof body.pushed_at !== 'string'
	) {
		return { ok: false, reason: 'GitHub API response was missing expected fields' };
	}

	return {
		ok: true,
		renamedTo: typeof body.full_name === 'string' ? body.full_name : undefined,
		entry: {
			stars: body.stargazers_count,
			createdAt: body.created_at.slice(0, 10),
			pushedAt: body.pushed_at.slice(0, 10),
			fetchedAt: todayLocalDateString(),
		},
	};
}

function writePopularity(snapshot) {
	const sorted = {};
	for (const key of Object.keys(snapshot).sort()) {
		sorted[key] = snapshot[key];
	}

	writeFileSync(popularityPath, `${JSON.stringify(sorted, null, 2)}\n`);
}

function todayLocalDateString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
