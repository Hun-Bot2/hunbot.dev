// Display helpers for public artifacts on a localized page. Pure.
//
// Explore shows every public artifact on every language's page (the work's
// timeline does not change with the reader's language). When an artifact has
// no version in the page language, the title and link fall back to the
// original, and the link says which language it opens in.

import type { ArtifactLanguage } from '../../data/publicArtifactVocabulary.ts';
import type { LocalizedText, PublicArtifact } from '../artifacts/contract.ts';

const FALLBACK_ORDER: readonly ArtifactLanguage[] = ['ko', 'en', 'jp'];

export function resolveText(text: LocalizedText | null, lang: ArtifactLanguage): { text: string; lang: ArtifactLanguage | null } | null {
	if (!text) return null;
	if (text[lang]) return { text: text[lang]!, lang };
	if (text.original) return { text: text.original, lang: null };
	for (const fallback of FALLBACK_ORDER) {
		if (text[fallback]) return { text: text[fallback]!, lang: fallback };
	}
	return null;
}

export function resolveHref(artifact: PublicArtifact, lang: ArtifactLanguage): { href: string; lang: ArtifactLanguage } {
	if (artifact.href[lang]) return { href: artifact.href[lang]!, lang };
	for (const fallback of FALLBACK_ORDER) {
		if (artifact.href[fallback]) return { href: artifact.href[fallback]!, lang: fallback };
	}
	throw new Error(`${artifact.id} has no href.`);
}

/** `2026-02-06` → `2026.02.06`, `2025-03` → `2025.03`. */
export function formatArtifactDate(value: string): string {
	return value.replaceAll('-', '.');
}

/** Points: the date. Spans: `start → end`, or `start → {ongoing}`. */
export function formatArtifactTime(artifact: PublicArtifact, ongoingLabel: string): string {
	const start = formatArtifactDate(artifact.time.start);
	if (artifact.time.end === undefined) return start;
	return `${start} → ${artifact.time.end === null ? ongoingLabel : formatArtifactDate(artifact.time.end)}`;
}
