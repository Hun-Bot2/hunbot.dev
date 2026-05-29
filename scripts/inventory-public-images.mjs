import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const imageRoot = join(root, 'public/images');
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const warningBytes = 500 * 1024;

if (!existsSync(imageRoot)) {
	console.log('No public/images directory found.');
	process.exit(0);
}

const images = walk(imageRoot)
	.filter((filePath) => imageExtensions.has(extname(filePath).toLowerCase()))
	.map((filePath) => {
		const size = statSync(filePath).size;
		return {
			path: relative(root, filePath),
			size,
		};
	})
	.sort((a, b) => b.size - a.size);

const largeImages = images.filter((image) => image.size >= warningBytes);

console.log(`Scanned ${images.length} public images.`);
console.log(`Images >= ${formatBytes(warningBytes)}: ${largeImages.length}`);

for (const image of largeImages.slice(0, 40)) {
	console.log(`${formatBytes(image.size).padStart(9)}  ${image.path}`);
}

if (largeImages.length > 40) {
	console.log(`...and ${largeImages.length - 40} more.`);
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
