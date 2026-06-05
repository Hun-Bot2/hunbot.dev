export type DeckType = 'html' | 'slides' | 'pdf' | 'source';
export type DeckAspectRatio = '16:9' | '4:3';
export type DeckLanguage = 'ko' | 'en' | 'jp' | 'multi' | 'unknown';

export interface DeckMeta {
	id: string;
	title: string;
	description: string;
	language: DeckLanguage;
	type: DeckType;
	aspectRatio: DeckAspectRatio;
	htmlUrl: string | null;
	pdfUrl: string | null;
	pdfPageCount: number | null;
	pptxUrl: string | null;
	sourceAvailable: boolean;
	sourceReviewed: boolean;
	slides: string[];
}

export const HTML_DECK_PREFIX = '/decks-html/';
export const DECK_ASSET_PREFIX = '/decks/';

const DECK_TYPES: DeckType[] = ['html', 'slides', 'pdf', 'source'];
const ASPECT_RATIOS: DeckAspectRatio[] = ['16:9', '4:3'];
const DECK_LANGUAGES: DeckLanguage[] = ['ko', 'en', 'jp', 'multi', 'unknown'];
const DECK_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const LOCAL_PATH_PATTERN = /^\/[A-Za-z0-9._/-]+$/;
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const SLIDE_IMAGE_PATTERN = /\.(svg|png|jpe?g|webp)$/i;

type UrlField = 'htmlUrl' | 'pdfUrl' | 'pptxUrl' | 'slide';

interface LocalPathOptions {
	field: UrlField;
	allowedPrefixes: string[];
	allowedExtensions?: string[];
}

export function isPptxDownloadEnabled(deck: Pick<DeckMeta, 'pptxUrl' | 'sourceAvailable' | 'sourceReviewed'>) {
	return Boolean(deck.pptxUrl && deck.sourceAvailable === true && deck.sourceReviewed === true);
}

export function hasEmbeddableDeckContent(deck: Pick<DeckMeta, 'htmlUrl' | 'slides'>) {
	return Boolean(deck.htmlUrl || deck.slides.length > 0);
}

export function getAspectRatioValue(aspectRatio: DeckAspectRatio) {
	const [width, height] = aspectRatio.split(':').map(Number);
	return `${width} / ${height}`;
}

export function getDeckMetaErrors(deck: unknown, indexLabel = 'deck') {
	const errors: string[] = [];

	if (!deck || typeof deck !== 'object') {
		return [`${indexLabel} must be an object.`];
	}

	const candidate = deck as Partial<DeckMeta>;

	if (!isNonEmptyString(candidate.id)) {
		errors.push(`${indexLabel}.id must be a non-empty string.`);
	} else if (!DECK_ID_PATTERN.test(candidate.id)) {
		errors.push(`${indexLabel}.id "${candidate.id}" must use lowercase letters, numbers, and hyphens only.`);
	}

	if (!isNonEmptyString(candidate.title)) {
		errors.push(`${indexLabel}.title must be a non-empty string.`);
	}

	if (!isNonEmptyString(candidate.description)) {
		errors.push(`${indexLabel}.description must be a non-empty string.`);
	}

	if (!candidate.language || !DECK_LANGUAGES.includes(candidate.language)) {
		errors.push(`${indexLabel}.language must be one of: ${DECK_LANGUAGES.join(', ')}.`);
	}

	if (!candidate.type || !DECK_TYPES.includes(candidate.type)) {
		errors.push(`${indexLabel}.type must be one of: ${DECK_TYPES.join(', ')}.`);
	}

	if (!candidate.aspectRatio || !ASPECT_RATIOS.includes(candidate.aspectRatio)) {
		errors.push(`${indexLabel}.aspectRatio must be one of: ${ASPECT_RATIOS.join(', ')}.`);
	}

	if (
		candidate.pdfPageCount !== null &&
		typeof candidate.pdfPageCount !== 'undefined' &&
		(!Number.isInteger(candidate.pdfPageCount) || candidate.pdfPageCount < 1)
	) {
		errors.push(`${indexLabel}.pdfPageCount must be null or a positive integer.`);
	}

	if (typeof candidate.sourceAvailable !== 'boolean') {
		errors.push(`${indexLabel}.sourceAvailable must be a boolean.`);
	}

	if (typeof candidate.sourceReviewed !== 'boolean') {
		errors.push(`${indexLabel}.sourceReviewed must be a boolean.`);
	}

	if (!Array.isArray(candidate.slides)) {
		errors.push(`${indexLabel}.slides must be an array.`);
	} else {
		candidate.slides.forEach((slide, slideIndex) => {
			errors.push(
				...getLocalAssetPathErrors(slide, `${indexLabel}.slides[${slideIndex}]`, {
					field: 'slide',
					allowedPrefixes: [DECK_ASSET_PREFIX],
				}),
			);

			if (typeof slide === 'string' && !SLIDE_IMAGE_PATTERN.test(slide)) {
				errors.push(`${indexLabel}.slides[${slideIndex}] must point to an SVG, PNG, JPG, JPEG, or WebP image.`);
			}
		});
	}

	errors.push(
		...getOptionalLocalPathErrors(candidate.htmlUrl, `${indexLabel}.htmlUrl`, {
			field: 'htmlUrl',
			allowedPrefixes: [HTML_DECK_PREFIX],
			allowedExtensions: ['.html', '/'],
		}),
		...getOptionalLocalPathErrors(candidate.pdfUrl, `${indexLabel}.pdfUrl`, {
			field: 'pdfUrl',
			allowedPrefixes: [DECK_ASSET_PREFIX],
			allowedExtensions: ['.pdf'],
		}),
		...getOptionalLocalPathErrors(candidate.pptxUrl, `${indexLabel}.pptxUrl`, {
			field: 'pptxUrl',
			allowedPrefixes: [DECK_ASSET_PREFIX],
			allowedExtensions: ['.pptx'],
		}),
	);

	if (candidate.type === 'html' && !candidate.htmlUrl) {
		errors.push(`${indexLabel}.type is "html" but htmlUrl is missing.`);
	}

	if (candidate.type === 'slides' && (!Array.isArray(candidate.slides) || candidate.slides.length === 0)) {
		errors.push(`${indexLabel}.type is "slides" but no slide images are configured.`);
	}

	if (candidate.type === 'pdf' && !candidate.pdfUrl) {
		errors.push(`${indexLabel}.type is "pdf" but pdfUrl is missing.`);
	}

	if (candidate.type === 'source' && !candidate.pptxUrl) {
		errors.push(`${indexLabel}.type is "source" but pptxUrl is missing.`);
	}

	return errors;
}

export function validateDeckCollection(decks: unknown) {
	const errors: string[] = [];

	if (!Array.isArray(decks)) {
		return ['Deck metadata must be an array.'];
	}

	const seenIds = new Set<string>();

	decks.forEach((deck, index) => {
		const indexLabel = `decks[${index}]`;
		errors.push(...getDeckMetaErrors(deck, indexLabel));

		if (deck && typeof deck === 'object') {
			const id = (deck as Partial<DeckMeta>).id;
			if (typeof id === 'string') {
				if (seenIds.has(id)) {
					errors.push(`${indexLabel}.id "${id}" is duplicated.`);
				}
				seenIds.add(id);
			}
		}
	});

	return errors;
}

export function assertValidDeckMeta(deck: unknown, indexLabel = 'deck') {
	const errors = getDeckMetaErrors(deck, indexLabel);

	if (errors.length > 0) {
		throw new Error(`Invalid deck metadata:\n- ${errors.join('\n- ')}`);
	}
}

export function assertValidDeckCollection(decks: unknown) {
	const errors = validateDeckCollection(decks);

	if (errors.length > 0) {
		throw new Error(`Invalid deck metadata:\n- ${errors.join('\n- ')}`);
	}
}

export function isSafeLocalAssetPath(value: unknown, options: LocalPathOptions) {
	return getLocalAssetPathErrors(value, 'path', options).length === 0;
}

function getOptionalLocalPathErrors(value: unknown, label: string, options: LocalPathOptions) {
	if (value === null || typeof value === 'undefined') {
		return [];
	}

	return getLocalAssetPathErrors(value, label, options);
}

function getLocalAssetPathErrors(value: unknown, label: string, options: LocalPathOptions) {
	const errors: string[] = [];

	if (!isNonEmptyString(value)) {
		return [`${label} must be a non-empty string when provided.`];
	}

	const path = value.trim();

	if (path !== value) {
		errors.push(`${label} must not include leading or trailing whitespace.`);
	}

	if (URL_SCHEME_PATTERN.test(path) || path.startsWith('//')) {
		errors.push(`${label} must be a local site path, not a remote or scheme-based URL.`);
	}

	if (!path.startsWith('/')) {
		errors.push(`${label} must start with "/".`);
	}

	if (path.includes('\\')) {
		errors.push(`${label} must use forward slashes only.`);
	}

	if (path.includes('?') || path.includes('#')) {
		errors.push(`${label} must not include query strings or fragments.`);
	}

	let decoded = path;
	try {
		decoded = decodeURIComponent(path);
	} catch {
		errors.push(`${label} must not include invalid percent-encoded characters.`);
	}

	if (decoded.split('/').includes('..')) {
		errors.push(`${label} must not include path traversal segments.`);
	}

	if (!LOCAL_PATH_PATTERN.test(path)) {
		errors.push(`${label} contains characters outside the safe local asset path set.`);
	}

	if (!options.allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
		errors.push(`${label} must start with one of: ${options.allowedPrefixes.join(', ')}.`);
	}

	if (options.allowedExtensions && !options.allowedExtensions.some((extension) => path.endsWith(extension))) {
		errors.push(`${label} must end with one of: ${options.allowedExtensions.join(', ')}.`);
	}

	return errors;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}
