import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, posix, relative, resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readText('package.json'));
const outputRoots = ['dist/client', '.vercel/output/static']
	.map((path) => join(root, path))
	.filter((path) => existsSync(path));
const ignoredSchemes = /^(https?:|mailto:|tel:|data:|blob:|javascript:)/i;
const ignoredPrefixes = ['/api/'];
const attributePattern = /\s(?:href|src)=["']([^"']+)["']/gi;

assert.match(packageJson.scripts?.['links:validate'] ?? '', /validate-internal-links\.mjs/);
assert.ok(outputRoots.length > 0, 'Run a build before validating internal links.');

let checkedLinks = 0;
const failures = [];

for (const outputRoot of outputRoots) {
	const htmlFiles = walk(outputRoot).filter((filePath) => extname(filePath).toLowerCase() === '.html');

	for (const htmlFile of htmlFiles) {
		const html = readFileSync(htmlFile, 'utf8');
		const sourceRoute = toRoutePath(outputRoot, htmlFile);
		const sourceBaseRoute = sourceRoute.endsWith('/') ? sourceRoute : `${posix.dirname(sourceRoute)}/`;

		for (const match of html.matchAll(attributePattern)) {
			const rawValue = match[1]?.trim();
			if (!rawValue || shouldIgnore(rawValue)) continue;

			const normalizedValue = stripHashAndQuery(rawValue);
			if (!normalizedValue || normalizedValue === '/') {
				checkedLinks += 1;
				continue;
			}

			const routePath = normalizedValue.startsWith('/')
				? normalizedValue
				: normalizeRoutePath(`${sourceBaseRoute}${normalizedValue}`);

			if (ignoredPrefixes.some((prefix) => routePath.startsWith(prefix))) continue;

			checkedLinks += 1;
			if (!routeExists(outputRoot, routePath)) {
				failures.push(`${relative(root, htmlFile)} -> ${rawValue}`);
			}
		}
	}
}

assert.equal(
	failures.length,
	0,
	`Broken internal links found:\n${failures.slice(0, 80).join('\n')}${failures.length > 80 ? `\n...and ${failures.length - 80} more` : ''}`,
);

console.log(`Validated ${checkedLinks} internal links across ${outputRoots.length} build output roots.`);

function readText(path) {
	const fullPath = join(root, path);
	assert.ok(existsSync(fullPath), `${path} should exist.`);
	return readFileSync(fullPath, 'utf8');
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function shouldIgnore(value) {
	return (
		value.startsWith('#') ||
		value.startsWith('//') ||
		ignoredSchemes.test(value)
	);
}

function stripHashAndQuery(value) {
	return value.split('#')[0].split('?')[0];
}

function normalizeRoutePath(value) {
	const normalized = posix.normalize(value.startsWith('/') ? value : `/${value}`);
	if (normalized === '/') return '/';
	return value.endsWith('/') ? `${normalized.replace(/\/$/, '')}/` : normalized;
}

function toRoutePath(outputRoot, htmlFile) {
	const relativePath = relative(outputRoot, htmlFile).replace(/\\/g, '/');
	if (relativePath === 'index.html') return '/';
	if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
	return `/${relativePath}`;
}

function routeExists(outputRoot, routePath) {
	const decodedRoute = safeDecode(routePath);
	const candidates = [];

	for (const candidateRoute of new Set([routePath, decodedRoute])) {
		const cleanRoute = candidateRoute.replace(/^\/+/, '');
		const fullPath = resolve(outputRoot, cleanRoute);
		if (!fullPath.startsWith(outputRoot)) continue;

		candidates.push(fullPath);
		if (candidateRoute.endsWith('/')) {
			candidates.push(join(fullPath, 'index.html'));
		} else if (!extname(candidateRoute)) {
			candidates.push(join(fullPath, 'index.html'));
			candidates.push(`${fullPath}.html`);
		}
	}

	return candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

function safeDecode(value) {
	try {
		return decodeURI(value);
	} catch {
		return value;
	}
}
