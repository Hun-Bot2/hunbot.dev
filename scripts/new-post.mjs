import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { BLOG_LANGUAGES } from '../src/utils/blog-routing.ts';

const [lang, slug, extra] = process.argv.slice(2);
if (extra || !BLOG_LANGUAGES.includes(lang) || !slug ||
	!slug.split('/').every(segment => /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(segment))) {
	console.error('Usage: npm run post:new -- <ko|jp|en> <folder/post-slug>');
	process.exit(1);
}

const base = resolve('src/content/blog', lang, slug);
if (existsSync(base + '.md')) {
	console.error('Post already exists: ' + relative(process.cwd(), base + '.md'));
	process.exit(1);
}
const path = base + '.mdx';
try {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, '', { flag: 'wx' });
} catch (error) {
	if (error.code !== 'EEXIST') throw error;
	console.error('Post already exists: ' + relative(process.cwd(), path));
	process.exit(1);
}
console.log(relative(process.cwd(), path));
console.log('/__drafts/' + lang + '/' + slug.replace(/\/index$/, '') + '/');
