import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(read('package.json'));
const packageScripts = packageJson.scripts ?? {};
const dependencies = {
	...packageJson.dependencies,
	...packageJson.devDependencies,
};

assert.match(packageScripts['product:validate'] ?? '', /validate-product-boundaries\.mjs/);

const forbiddenDependencyPatterns = [
	/stripe/i,
	/paddle/i,
	/polar/i,
	/lemon-?squeezy/i,
	/clerk/i,
	/next-?auth/i,
	/auth0/i,
	/supabase/i,
	/resend/i,
	/mailchimp/i,
	/convertkit/i,
	/buttondown/i,
];

for (const dependencyName of Object.keys(dependencies)) {
	for (const pattern of forbiddenDependencyPatterns) {
		assert.doesNotMatch(dependencyName, pattern, `${dependencyName} needs an approved product separation plan.`);
	}
}

// Approved API routes. Adding to this list is the approval gate described in
// docs/decisions/product-boundaries.md - widen it only alongside a written
// carve-out in that document, never to make a build pass.
const APPROVED_API_ROUTES = ['src/pages/api/feedback.ts', 'src/pages/api/views.ts'];
const apiRoutes = listFiles('src/pages/api').map((filePath) => relative(root, filePath)).sort();
assert.deepEqual(apiRoutes, APPROVED_API_ROUTES, 'Only approved API routes may exist.');

// Anonymous feedback is private by construction. If it is ever rendered into a
// page, it becomes public anonymous comments, which need their own plan.
const feedbackRoute = read('src/pages/api/feedback.ts');
assert.doesNotMatch(feedbackRoute, /export const GET/, 'Feedback must not be readable over HTTP.');
assert.match(feedbackRoute, /Cache-Control': 'no-store/);
assert.doesNotMatch(feedbackRoute, /console\.error\([^)]*error/);

const feedbackComponents = listFiles('src/components').concat(listFiles('src/layouts'));
for (const componentPath of feedbackComponents) {
	const source = readFileSync(componentPath, 'utf8');
	assert.doesNotMatch(
		source,
		/set:html[^\n]*feedback/i,
		`${relative(root, componentPath)} must not render stored feedback as markup.`,
	);
}

const routeFiles = listFiles('src/pages').map((filePath) => relative(root, filePath));
const forbiddenRouteSegments = new Set([
	'account',
	'accounts',
	'billing',
	'checkout',
	'login',
	'newsletter',
	'pricing',
	'pro',
	'signin',
	'signup',
	'subscribe',
	'team',
	'teams',
]);

for (const routeFile of routeFiles) {
	const segments = routeFile.split(sep);
	for (const segment of segments) {
		const normalized = segment.replace(/\.(astro|js|ts|md|mdx)$/i, '').toLowerCase();
		assert.equal(
			forbiddenRouteSegments.has(normalized),
			false,
			`${routeFile} looks like productized UI and needs an approved separation plan.`,
		);
	}
}

for (const privatePath of [
	'src/content/candidates',
	'src/content/private',
	'src/content/review-queue',
	'src/content/leads',
	'src/content/customers',
]) {
	assert.equal(existsSync(join(root, privatePath)), false, `${privatePath} should not exist in the public repo.`);
}

const boundaryDoc = read('docs/decisions/product-boundaries.md');
assert.match(boundaryDoc, /personal trust asset/);
assert.match(boundaryDoc, /Do not add these to the personal blog/);

const decisionRecord = read('docs/decisions/monetization.md');
assert.match(decisionRecord, /No monetization implementation approved/);
assert.match(decisionRecord, /Explicitly Deferred/);

console.log('Validated product separation boundaries and absence of payment/auth/newsletter product creep.');

function read(path) {
	return readFileSync(join(root, path), 'utf8');
}

function listFiles(directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory).filter((filePath) => ['.astro', '.js', '.ts'].includes(extname(filePath)));
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}
