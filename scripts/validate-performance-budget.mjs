import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

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

// --- Size ratchet guards ------------------------------------------------
// Scoped to public/images/ specifically (not the wider public/ tree used by
// the reporting above, which also covers unrelated assets like deck slide
// JPEGs) — this is the directory the 2026-09 PNG -> WebP conversion targeted.
// These ceilings are a ratchet, not a target: they were set just above the
// actual measured numbers right after that conversion (7 legacy PNGs -> WebP,
// quality 80, capped at 1600px wide). When public/images legitimately shrinks
// further (more conversions, deletions, etc.), LOWER these constants to match
// the new actual total / largest file. Do not raise them just to make a
// regression pass — optimize the offending image(s) instead.
const publicImagesDirFiles = imageFiles.filter((file) =>
	file.path.startsWith(join('public', 'images') + sep),
);
const TOTAL_IMAGE_BYTES_CEILING = 19_200_000; // ~10% above the ~17.44MB actual total in public/images/ measured right after the WebP conversion.
const SINGLE_IMAGE_BYTES_CAP = 600 * 1024; // 614,400 bytes. Comfortably above ordinary post images; well below the pre-existing >1MB outliers pending a separate owner decision (see CLAUDE.md history).

const totalPublicImageBytes = sum(publicImagesDirFiles);
assert.ok(
	totalPublicImageBytes <= TOTAL_IMAGE_BYTES_CEILING,
	`Public image budget exceeded: public/images/ totals ${formatBytes(totalPublicImageBytes)}, over the ${formatBytes(TOTAL_IMAGE_BYTES_CEILING)} ceiling. Optimize (compress/convert to WebP) or remove images under public/images/ rather than raising this ceiling.`,
);

// Known oversized files awaiting an owner decision, not an excuse to skip the cap.
// All three are unreferenced anywhere in src/ (verified 2026-09-10) and are
// candidates for deletion rather than conversion. Delete the file, then delete
// its line here. Nothing may be added to this list without the same rationale.
const PENDING_REMOVAL = new Set([
	// Unreferenced, but classified UNCERTAIN rather than obsolete on 2026-09-10:
	// the English counterpart of a published Korean asset (its post does not exist
	// yet) and a tall product screenshot. Resolve by publishing, archiving under
	// archive/images/, or deleting -- then remove the line here.
	'public/images/CHAT/chatting-media-en.png',
	'public/images/ZORO/local-desktop.png',
]);

const stillPresentExceptions = [...PENDING_REMOVAL].filter((path) => existsSync(join(root, path)));
if (stillPresentExceptions.length > 0) {
	console.warn(
		`Oversized images pending removal (${stillPresentExceptions.length}): ${stillPresentExceptions.join(', ')}. ` +
			'These are unreferenced; delete them and remove them from PENDING_REMOVAL.',
	);
}

const oversizedByCap = publicImagesDirFiles.filter(
	(file) => file.size > SINGLE_IMAGE_BYTES_CAP && !PENDING_REMOVAL.has(file.path),
);
assert.equal(
	oversizedByCap.length,
	0,
	`Image(s) in public/images/ exceed the per-file cap of ${formatBytes(SINGLE_IMAGE_BYTES_CAP)}: ${oversizedByCap
		.map((file) => `${file.path} (${formatBytes(file.size)})`)
		.join(', ')}. Optimize (compress/resize/convert to WebP) these files rather than raising the cap.`,
);

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
