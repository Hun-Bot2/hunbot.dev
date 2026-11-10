// Concept slots, card types, tracks, front templates and back assembly (decision D13, contracts.md).
import type { Note, Unit } from './note.ts';
import { hasBatchim, normalizeForKey, particle, sha256 } from './text.ts';

/** The five slots of a concept (D13). One slot gives one card. */
export const SLOT_TYPES = ['definition', 'principle', 'formula', 'compare', 'limitation'] as const;
export type CardType = (typeof SLOT_TYPES)[number];
export type Track = 'memorize' | 'understand';
export type Origin = 'rule-definition' | 'rule-term' | 'rule-formula' | 'comment-card' | 'heading-baseline' | 'llm';

export function trackOf(type: CardType): Track {
	return type === 'definition' || type === 'formula' ? 'memorize' : 'understand';
}

export type Card = {
	cardKey: string;
	sourceId: string;
	origin: Origin;
	type: CardType;
	track: Track;
	/** Concept the card belongs to; scoring matches it against reference concepts. */
	concept: string;
	front: string;
	back: string;
	units: string[];
	section: number;
	heading: string;
	/** Formula cards only: names the model listed as easily confused with this concept. */
	confusables?: string[];
	/** Formula cards only: the formula or code, kept to rebuild the front when choices are attached. */
	formula?: string;
	/** Formula cards only: `math` (display math) or `code` (a code pattern such as Promise or async/await). */
	formulaKind?: 'math' | 'code';
	formulaLang?: string;
};

export const conceptKey = (name: string) => normalizeForKey(name).replace(/\s+/g, '-');

export function cardKey(type: CardType, concept: string, extra = ''): string {
	const base = `${type === 'definition' ? 'def' : type}:${conceptKey(concept)}`;
	return extra ? `${base}:${extra}` : base;
}

/** `{term}란?` with the right particle; non-Hangul endings get `(이)란`. */
export function definitionFront(term: string): string {
	const b = hasBatchim(term);
	const p = b === null ? '(이)란' : b ? '이란' : '란';
	return `${term}${p}?`;
}

export function principleFront(concept: string, question: string): string {
	const q = question.trim().replace(/[?？]\s*$/u, '');
	return `${concept}${particle(concept, '은', '는')} ${q}? 설명하라.`;
}

export function compareFront(a: string, b: string, axis: string | null): string {
	return axis ? `${a}${particle(a, '과', '와')} ${b}: ${axis}의 trade-off를 설명하라.` : `${a}${particle(a, '과', '와')} ${b}의 관계·차이를 설명하라.`;
}

export function limitationFront(concept: string, ledTo: string | null): string {
	return ledTo ? `${concept}의 한계는? 그 한계에서 나온 기술은?` : `${concept}의 한계는?`;
}

const CIRCLED = ['①', '②', '③', '④'];

/** Recognition front (D13): a formula or a code pattern, with choices when there are at least two. */
export function formulaFront(formula: string, choices: string[] | null, kind: 'math' | 'code' = 'math', lang = ''): string {
	const shown = kind === 'code' ? '```' + lang + '\n' + formula + '\n```' : `$$\n${formula}\n$$`;
	const what = kind === 'code' ? '이 코드는' : '이 식은';
	if (!choices || choices.length < 2) return `${shown}\n${what} 무엇인가?`;
	const options = choices.slice(0, 4).map((c, i) => `${CIRCLED[i]} ${c}`).join('  ');
	return `${shown}\n${what} 어떤 기법인가?\n${options}`;
}

export function formulaBack(concept: string, symbolLines: string[]): string {
	return [`**${concept}**`, ...symbolLines.map((l) => (l.startsWith('- ') ? l : `- ${l}`))].join('\n');
}

export function unitMarkdown(unit: Unit): string {
	if (unit.kind === 'C') return '```' + (unit.lang ?? '') + '\n' + unit.text + '\n```';
	if (unit.kind === 'M') return '$$\n' + unit.text + '\n$$';
	return unit.text;
}

/** Back = the note's own units, in note order; understand cards read as key points. */
export function backFromUnits(note: Note, ids: string[], track: Track): string {
	const units = ids.map((id) => note.units.get(id)).filter((u): u is Unit => Boolean(u));
	units.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id, undefined, { numeric: true }));
	if (track === 'understand' && units.length > 1) return units.map((u) => (u.kind === 'S' ? `- ${u.text}` : unitMarkdown(u))).join('\n');
	return units.map(unitMarkdown).join('\n');
}

/**
 * Attach multiple-choice options to every formula card (D13). Distractors are other formula concepts from the same
 * run, in a stable hash order; the card's own confusables fill the gap when there are fewer than three.
 */
export function attachFormulaChoices(cards: Card[]): void {
	const formulas = cards.filter((c) => c.type === 'formula' && c.formula);
	for (const card of formulas) {
		// Distractors come from the same kind: formulas against formulas, code against code.
		const kind = card.formulaKind ?? 'math';
		const names = [...new Set(formulas.filter((c) => (c.formulaKind ?? 'math') === kind).map((c) => c.concept))];
		const own = normalizeForKey(card.concept);
		const others = names.filter((n) => normalizeForKey(n) !== own).sort((a, b) => sha256(card.cardKey + a).localeCompare(sha256(card.cardKey + b)));
		const extra = (card.confusables ?? []).filter((n) => normalizeForKey(n) !== own && !others.some((o) => normalizeForKey(o) === normalizeForKey(n)));
		const distractors = [...others, ...extra].slice(0, 3);
		if (!distractors.length) {
			card.front = formulaFront(card.formula as string, null, kind, card.formulaLang);
			continue;
		}
		const options = [card.concept, ...distractors].sort((a, b) => sha256(card.cardKey + '#' + a).localeCompare(sha256(card.cardKey + '#' + b)));
		card.front = formulaFront(card.formula as string, options, kind, card.formulaLang);
	}
}
