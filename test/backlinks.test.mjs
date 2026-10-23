import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBacklinkIndex, excerptAround, extractLinks, getBacklinks, normalizeSitePath } from '../src/utils/backlinks.ts';

const source = (overrides) => ({
	kind: 'post',
	key: 'post:ko/a',
	url: '/ko/blog/devlog/a/',
	title: 'Post A',
	date: '2026-10-01',
	lang: 'ko',
	body: '',
	...overrides,
});

test('normalizeSitePath drops language, query and hash and ends with one slash', () => {
	assert.equal(normalizeSitePath('/ko/blog/x'), '/blog/x/');
	assert.equal(normalizeSitePath('/en/blog/x/?a=1#h'), '/blog/x/');
	assert.equal(normalizeSitePath('/library/item/animista/'), '/library/item/animista/');
});

test('extractLinks finds markdown links and href attributes, not images or code', () => {
	const body = '![img](/a.png) see [one](/ko/blog/x/) and <Term href="/ko/blog/y/">y</Term>\n\n`[no](/ko/blog/z/)`\n\n```\n[no](/ko/blog/w/)\n```';
	assert.deepEqual(extractLinks(body).map((link) => link.href), ['/ko/blog/x/', '/ko/blog/y/']);
});

test('excerptAround returns the plain-text paragraph, cut to about 140 characters', () => {
	const short = 'Before.\n\nI like [this tool](https://tool.example/) a lot.\n\nAfter.';
	assert.equal(excerptAround(short, short.indexOf('[this')), 'I like this tool a lot.');
	const long = `${'가나다라 '.repeat(60)}[링크](https://tool.example/) ${'마바사 '.repeat(60)}`;
	const excerpt = excerptAround(long, long.indexOf('[링크'));
	assert.ok(excerpt.length <= 140 + 2, `excerpt too long: ${excerpt.length}`);
	assert.match(excerpt, /^…/);
	assert.match(excerpt, /…$/);
});

test('a post that links to an on-site page is a backlink of it; unpublished sources are simply not passed', () => {
	const index = buildBacklinkIndex([
		source({ body: 'Read [the weekly note](/ko/library/weekly/3/) first.' }),
		source({ key: 'post:ko/b', title: 'Post B', date: '2026-10-05', body: 'Also <a href="/ko/library/weekly/3/">it</a>.' }),
	]);
	const links = getBacklinks(index, { paths: ['/ko/library/weekly/3/'] }, 'ko');
	assert.deepEqual(links.map((link) => link.title), ['Post B', 'Post A']);
	assert.equal(links[1].url, '/ko/blog/devlog/a/');
});

test('relative links resolve against the source URL', () => {
	const index = buildBacklinkIndex([source({ url: '/ko/blog/devlog/local/two/', body: 'Continues [part one](../one).' })]);
	assert.equal(getBacklinks(index, { paths: ['/ko/blog/devlog/local/one/'] }, 'ko').length, 1);
});

test('a link to an item\'s own website counts for that item, matched by the pick URL key', () => {
	const index = buildBacklinkIndex([
		source({ body: 'I used [Animista](https://www.animista.net/#top) today.' }),
		source({ key: 'post:ko/c', body: 'Unrelated [site](https://other.example/).' }),
	]);
	const links = getBacklinks(index, { externalUrl: 'https://animista.net' }, 'ko');
	assert.equal(links.length, 1);
	assert.equal(links[0].key, 'post:ko/a');
});

test('a page never lists itself, and a source counts once however often it links', () => {
	const index = buildBacklinkIndex([source({ body: '[a](/ko/library/item/x/) and [b](/ko/library/item/x/)' })]);
	assert.equal(getBacklinks(index, { paths: ['/ko/library/item/x/'] }, 'ko').length, 1);
	assert.equal(getBacklinks(index, { selfKey: 'post:ko/a', paths: ['/ko/library/item/x/'] }, 'ko').length, 0);
});

test('a blog post of another language is not listed; ko-only writing is, under the page language', () => {
	const index = buildBacklinkIndex([
		source({ lang: 'en', key: 'post:en/a', url: '/en/blog/devlog/a/', body: '[x](/en/library/item/x/)' }),
		source({ kind: 'explainer', key: 'explainer:e', url: '/{lang}/library/explainers/e/', lang: undefined, body: '[x](/ko/library/item/x/)' }),
	]);
	const forJp = getBacklinks(index, { paths: ['/jp/library/item/x/'] }, 'jp');
	assert.deepEqual(forJp.map((link) => link.url), ['/jp/library/explainers/e/']);
	assert.equal(getBacklinks(index, { paths: ['/en/library/item/x/'] }, 'en').length, 2);
});

test('mailto, anchors and unrelated hosts never match', () => {
	const index = buildBacklinkIndex([source({ body: '[m](mailto:a@b.c) [h](#top) [e](https://elsewhere.example/ko/blog/x/)' })]);
	assert.equal(getBacklinks(index, { paths: ['/ko/blog/x/'] }, 'ko').length, 0);
});
