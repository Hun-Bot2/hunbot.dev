import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readText('package.json'));
const publicRoot = join(root, 'public');
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const warningBytes = {
	image: 500 * 1024,
	asset: 5 * 1024 * 1024,
	pagefind: 8 * 1024 * 1024,
};
const forbiddenPublicExtensions = new Set(['.env', '.key', '.pem', '.p12', '.pfx']);

assert.match(packageJson.scripts?.['perf:budget'] ?? '', /validate-performance-budget\.mjs/);

const publicFiles = existsSync(publicRoot)
	? walk(publicRoot).filter((filePath) => !filePath.endsWith('.DS_Store')).map(toFileRecord)
	: [];
const imageFiles = publicFiles.filter((file) => imageExtensions.has(file.extension));
const oversizedImages = imageFiles.filter((file) => file.size >= warningBytes.image);
const oversizedAssets = publicFiles.filter((file) => file.size >= warningBytes.asset);
const forbiddenFiles = publicFiles.filter((file) => forbiddenPublicExtensions.has(file.extension));

assert.equal(
	forbiddenFiles.length,
	0,
	`Do not publish private-looking files in public/: ${forbiddenFiles.map((file) => file.path).join(', ')}`,
);

console.log(`Public files: ${publicFiles.length} (${formatBytes(sum(publicFiles))})`);
console.log(`Public images: ${imageFiles.length} (${formatBytes(sum(imageFiles))})`);
console.log(`Images >= ${formatBytes(warningBytes.image)}: ${oversizedImages.length}`);
for (const file of oversizedImages.slice(0, 12)) {
	console.log(`  ${formatBytes(file.size).padStart(9)}  ${file.path}`);
}

console.log(`Public assets >= ${formatBytes(warningBytes.asset)}: ${oversizedAssets.length}`);
for (const file of oversizedAssets.slice(0, 8)) {
	console.log(`  ${formatBytes(file.size).padStart(9)}  ${file.path}`);
}

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	const outputFiles = walk(outputRoot).map(toFileRecord);
	const htmlCount = outputFiles.filter((file) => file.extension === '.html').length;
	const pagefindFiles = outputFiles.filter((file) => file.path.includes('/pagefind/'));
	const pagefindSize = sum(pagefindFiles);

	console.log(`${relative(root, outputRoot)} HTML files: ${htmlCount}`);
	console.log(`${relative(root, outputRoot)} Pagefind size: ${formatBytes(pagefindSize)}`);
	if (pagefindSize >= warningBytes.pagefind) {
		console.warn(
			`Pagefind output is above ${formatBytes(warningBytes.pagefind)}. Review indexing scope before adding more public datasets.`,
		);
	}
}

console.log('Validated performance/media budget inventory.');

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

function toFileRecord(filePath) {
	return {
		path: relative(root, filePath),
		size: statSync(filePath).size,
		extension: extname(filePath).toLowerCase(),
	};
}

function sum(files) {
	return files.reduce((total, file) => total + file.size, 0);
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
