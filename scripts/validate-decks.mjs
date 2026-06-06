import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { decks } from '../src/data/decks.ts';
import {
	assertValidDeckCollection,
	getDeckMetaErrors,
	isPptxDownloadEnabled,
} from '../src/lib/decks/validateDeckMeta.ts';

const root = process.cwd();
const imagePattern = /\.(svg|png|jpe?g|webp)$/i;

assertValidDeckCollection(decks);

for (const deck of decks) {
	for (const assetPath of [deck.htmlUrl, deck.pdfUrl, deck.pptxUrl, ...deck.slides].filter(Boolean)) {
		assert.ok(existsSync(toPublicPath(assetPath)), `${deck.id} asset is missing: ${assetPath}`);
	}

	if (deck.slides.length > 0) {
		const slideDirs = new Set(deck.slides.map((slide) => dirname(slide)));

		for (const slideDir of slideDirs) {
			const fileNames = readdirSync(toPublicPath(slideDir)).filter((fileName) => imagePattern.test(fileName));
			const declaredSlidesInDir = deck.slides.filter((slide) => dirname(slide) === slideDir);

			assert.equal(
				fileNames.length,
				declaredSlidesInDir.length,
				`${deck.id} slide count should match image files in ${slideDir}`,
			);
		}
	}
}

const validBaseDeck = {
	id: 'fixture-deck',
	title: 'Fixture Deck',
	description: 'A validation fixture.',
	language: 'en',
	type: 'html',
	aspectRatio: '16:9',
	htmlUrl: '/decks-html/fixture-deck/index.html',
	pdfUrl: null,
	pdfPageCount: null,
	pptxUrl: null,
	sourceAvailable: false,
	sourceReviewed: false,
	slides: [],
};

assert.deepEqual(getDeckMetaErrors(validBaseDeck), []);

const unsafeUrls = [
	'https://example.com/deck.html',
	'http://example.com/deck.html',
	'javascript:alert(1)',
	'data:text/html;base64,PGgxPkRlY2s8L2gxPg==',
	'blob:https://example.com/1234',
	'//example.com/deck.html',
	'/decks-html/../secret/index.html',
	'/decks-html/%2e%2e/secret/index.html',
];

for (const unsafeUrl of unsafeUrls) {
	assertInvalid({ ...validBaseDeck, htmlUrl: unsafeUrl }, `htmlUrl should reject ${unsafeUrl}`);
	assertInvalid(
		{
			...validBaseDeck,
			type: 'pdf',
			htmlUrl: null,
			pdfUrl: unsafeUrl.replace(/\.html$/, '.pdf'),
		},
		`pdfUrl should reject ${unsafeUrl}`,
	);
	assertInvalid(
		{
			...validBaseDeck,
			type: 'source',
			htmlUrl: null,
			pptxUrl: unsafeUrl.replace(/\.html$/, '.pptx'),
			sourceAvailable: true,
			sourceReviewed: true,
		},
		`pptxUrl should reject ${unsafeUrl}`,
	);
	assertInvalid(
		{
			...validBaseDeck,
			type: 'slides',
			htmlUrl: null,
			slides: [unsafeUrl.replace(/\.html$/, '.svg')],
		},
		`slide path should reject ${unsafeUrl}`,
	);
}

assertInvalid({ ...validBaseDeck, id: '../bad' }, 'deck IDs should reject path-like values');
assertInvalid({ ...validBaseDeck, language: 'kr' }, 'deck language must use supported language codes');
assertInvalid({ ...validBaseDeck, pdfPageCount: 0 }, 'pdfPageCount must be positive when provided');
assertInvalid({ ...validBaseDeck, htmlUrl: '/decks/fixture-deck/index.html' }, 'htmlUrl must use /decks-html/');
assertInvalid(
	{ ...validBaseDeck, type: 'pdf', htmlUrl: null, pdfUrl: '/decks-html/fixture-deck/fixture-deck.pdf' },
	'pdfUrl must use /decks/',
);
assertInvalid(
	{ ...validBaseDeck, type: 'slides', htmlUrl: null, slides: ['/decks/fixture-deck/slides/001.txt'] },
	'slides must be image files',
);

assert.equal(
	isPptxDownloadEnabled({
		pptxUrl: '/decks/source-deck/source-deck.pptx',
		sourceAvailable: true,
		sourceReviewed: false,
	}),
	false,
);
assert.equal(
	isPptxDownloadEnabled({
		pptxUrl: '/decks/source-deck/source-deck.pptx',
		sourceAvailable: true,
		sourceReviewed: true,
	}),
	true,
);

function assertInvalid(deck, message) {
	assert.notEqual(getDeckMetaErrors(deck).length, 0, message);
}

function toPublicPath(assetPath) {
	return join(root, 'public', assetPath.slice(1));
}

console.log(`Validated ${decks.length} deck metadata entries and unsafe URL fixtures.`);
