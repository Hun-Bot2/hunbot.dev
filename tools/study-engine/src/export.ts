// Cards → cards.json for the Anki builder (apkg/build_apkg.py). Decisions D4, D6, D7, D13, D15, D16.
import type { Card } from './cards.ts';
import { markdownToHtml } from './render.ts';
import { sha256 } from './text.ts';

export type NoteTypeName = 'StudyEngine Basic v1' | 'StudyEngine Formula v1' | 'StudyEngine Explain v1';

export type ExportNote = {
	guid: string;
	noteType: NoteTypeName;
	deck: string;
	tags: string[];
	fields: { StableId: string; Front: string; Back: string; Source: string };
	sourceId: string;
};

export type ExportFile = { version: 1; createdAt: string; sources: string[]; notes: ExportNote[] };

export function noteTypeOf(card: Card): NoteTypeName {
	if (card.type === 'formula') return 'StudyEngine Formula v1';
	if (card.track === 'understand') return 'StudyEngine Explain v1';
	return 'StudyEngine Basic v1';
}

/** Stable Anki GUID from the note's opaque source id and the card key (concept-based, D13). */
export function guidOf(card: Card): string {
	return 'se' + sha256(`${card.sourceId}|${card.cardKey}`).slice(0, 20);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toExportNote(card: Card, ctx: { deck: string; tags: string[]; title: string }): ExportNote {
	const guid = guidOf(card);
	const tags = [...new Set(['study-engine', `study::${card.track}`, `slot::${card.type}`, ...ctx.tags])];
	const source = card.heading && card.heading !== ctx.title ? `${ctx.title} › ${card.heading}` : ctx.title;
	return {
		guid,
		noteType: noteTypeOf(card),
		deck: ctx.deck,
		tags,
		fields: { StableId: guid, Front: markdownToHtml(card.front), Back: markdownToHtml(card.back), Source: escapeHtml(source) },
		sourceId: card.sourceId,
	};
}
