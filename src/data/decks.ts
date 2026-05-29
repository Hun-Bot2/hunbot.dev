import {
	assertValidDeckCollection,
	type DeckMeta,
} from '../lib/decks/validateDeckMeta.ts';

export const decks: DeckMeta[] = [
	{
		id: 'sample-deck',
		title: 'Sample Presentation',
		description: 'A tiny sample presentation used to test presentation embeds.',
		type: 'html',
		aspectRatio: '16:9',
		htmlUrl: '/decks-html/sample-deck/index.html',
		pdfUrl: null,
		pptxUrl: null,
		sourceAvailable: false,
		sourceReviewed: false,
		slides: [],
	},
	{
		id: 'sample-slide-deck',
		title: 'Sample Slide Deck',
		description: 'A tiny sample image-based deck.',
		type: 'slides',
		aspectRatio: '16:9',
		htmlUrl: null,
		pdfUrl: null,
		pptxUrl: null,
		sourceAvailable: false,
		sourceReviewed: false,
		slides: [
			'/decks/sample-slide-deck/slides/001.svg',
			'/decks/sample-slide-deck/slides/002.svg',
			'/decks/sample-slide-deck/slides/003.svg',
		],
	},
];

assertValidDeckCollection(decks);

export function getDeckById(deckId: string) {
	return decks.find((deck) => deck.id === deckId);
}
