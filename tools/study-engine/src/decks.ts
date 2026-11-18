// Deck and subject tags for a study note (decision D15, tools/study-engine/decks.yaml).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ENGINE_DIR } from './env.ts';

export type DeckMap = { default: string; folders: Record<string, string>; files: Record<string, string> };

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');
/** The blog's own placeholder tags (src/utils/blog-publishing.ts); never carried into Anki. */
const PLACEHOLDER_TAGS = new Set(['tag', 'tag1', 'tag2']);

export function loadDeckMap(file = path.join(ENGINE_DIR, 'decks.yaml')): DeckMap {
	const raw = YAML.parse(fs.readFileSync(file, 'utf8')) as Partial<DeckMap>;
	return { default: raw.default ?? 'Study::Inbox', folders: raw.folders ?? {}, files: raw.files ?? {} };
}

/** Folders between `<lang>/study/` and the file name. */
export function studyFolders(relPath: string): string[] {
	const m = /^src\/content\/blog\/[a-z]{2}\/study\/(.+)$/.exec(relPath);
	if (!m) return [];
	return m[1].split('/').slice(0, -1);
}

export function resolveDeck(relPath: string, frontmatter: Record<string, unknown> | null, map: DeckMap): string {
	const anki = (frontmatter?.anki ?? {}) as Record<string, unknown>;
	// `Study` alone was the fm-study snippet's default before D15; it means "not chosen", so the folder mapping decides.
	if (typeof anki.deck === 'string' && anki.deck.trim() && anki.deck.trim() !== 'Study') return anki.deck.trim();
	const folders = new Map(Object.entries(map.folders).map(([k, v]) => [norm(k), v]));
	for (const folder of studyFolders(relPath)) {
		const deck = folders.get(norm(folder));
		if (deck) return deck;
	}
	const files = new Map(Object.entries(map.files).map(([k, v]) => [norm(k), v]));
	return files.get(norm(path.basename(relPath))) ?? map.default;
}

/** `subject::<folder>` for every folder under study/, plus the note's own `tags` and `anki.tags`. */
export function noteTags(relPath: string, frontmatter: Record<string, unknown> | null): string[] {
	const clean = (t: string) => t.trim().replace(/\s+/g, '-');
	const subjects = studyFolders(relPath).map((f) => `subject::${clean(f).toLowerCase()}`);
	const anki = (frontmatter?.anki ?? {}) as Record<string, unknown>;
	const own = [...(Array.isArray(frontmatter?.tags) ? frontmatter.tags : []), ...(Array.isArray(anki.tags) ? anki.tags : [])]
		.filter((t): t is string => typeof t === 'string' && t.trim() !== '' && !PLACEHOLDER_TAGS.has(t.trim()))
		.map(clean);
	return [...new Set([...subjects, ...own])];
}
