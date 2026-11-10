// Rules (no AI, no network) mapped onto the concept slots of decision D13:
// definition lists and <Term> → definition, `X의 식:` + $$ + symbol list → formula, question headings → principle,
// plus layer-2 comment cards written as-is.
import type { MdNode, Note, Section } from './note.ts';
import { cardKey, definitionFront, formulaBack, formulaFront, type Card } from './cards.ts';
import { inlineText, jsxAttr, normalizeForKey, sha256, splitSentences } from './text.ts';

export type RuleIssue = { line: number; code: string; message: string };
export type RuleResult = { cards: Card[]; used: Set<string>; issues: RuleIssue[] };

const QUESTION_HEADING = /(\?|？|왜|무엇|어떻게|란\s*$|이란\s*$)/u;

export function isQuestionHeading(heading: string): boolean {
	return QUESTION_HEADING.test(heading);
}

/** The subject of a question heading: `RRF는 왜 …?` → `RRF`. Falls back to the whole heading. */
export function headingSubject(heading: string): string {
	const plain = heading.replace(/^\d+(?:\.\d+)*\.?\s*/u, '').replace(/^(?:왜|어떻게|무엇이|무엇을|무엇)\s+/u, '');
	const m = /^(.+?)(?:은\(는\)|이\(가\)|은|는|이|가|의)\s/u.exec(plain);
	return (m ? m[1] : plain).trim();
}

/** `**term:** text` or `**term**: text` at the start of a list item paragraph. */
export function matchDefinition(paragraph: MdNode): { term: string; definition: string } | null {
	const [first, ...rest] = paragraph.children ?? [];
	if (!first || first.type !== 'strong') return null;
	let term = inlineText(first).trim();
	let remainder = rest.map(inlineText).join('');
	if (term.endsWith(':')) {
		term = term.slice(0, -1).trim();
	} else if (/^\s*:/.test(remainder)) {
		remainder = remainder.replace(/^\s*:/, '');
	} else {
		return null;
	}
	const definition = remainder.replace(/\s*\n\s*/g, ' ').trim();
	if (!term || !definition) return null;
	return { term, definition };
}

function walk(node: MdNode, visit: (n: MdNode) => void): void {
	visit(node);
	for (const child of node.children ?? []) walk(child, visit);
}

export function parseCommentCard(value: string): { id: string | null; q: string; a: string } | { error: string } | null {
	const inner = value.trim().replace(/^\/\*/, '').replace(/\*\/$/, '').trim();
	if (!/^anki\b/.test(inner)) return null;
	const idMatch = /^anki\s+id="([^"]*)"/.exec(inner);
	const id = idMatch ? idMatch[1] : null;
	if (id !== null && !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)) return { error: `invalid id "${id}"` };
	const lines = inner.split(/\r?\n/).slice(1);
	const qIdx = lines.findIndex((l) => /^\s*Q:/.test(l));
	const aIdx = lines.findIndex((l) => /^\s*A:/.test(l));
	if (qIdx === -1 || aIdx === -1 || aIdx < qIdx) return { error: 'needs Q: then A:' };
	if (lines.filter((l) => /^\s*Q:/.test(l)).length > 1 || lines.filter((l) => /^\s*A:/.test(l)).length > 1) return { error: 'duplicate Q: or A:' };
	const q = lines.slice(qIdx, aIdx).join('\n').replace(/^\s*Q:\s*/, '').trim();
	const a = lines.slice(aIdx).join('\n').replace(/^\s*A:\s*/, '').trim();
	if (!q || !a) return { error: 'empty Q or A' };
	return { id, q, a };
}

export function extractRules(note: Note, opts: { headingBaseline: boolean }): RuleResult {
	const cards: Card[] = [];
	const used = new Set<string>();
	const issues: RuleIssue[] = [];
	const seenKeys = new Set<string>();
	const push = (card: Card) => {
		if (seenKeys.has(card.cardKey)) return;
		seenKeys.add(card.cardKey);
		cards.push(card);
		card.units.forEach((u) => used.add(u));
	};
	const base = (section: Section) => ({ sourceId: note.sourceId, section: section.index, heading: section.heading });

	for (const section of note.sections) {
		let commentOrder = 0;
		let previousParagraph: MdNode | null = null;
		for (const [blockIndex, block] of section.blocks.entries()) {
			// Layer 2: comment cards at root level only, written as-is (kept as memorize cards).
			if (block.type === 'mdxFlowExpression') {
				const parsed = parseCommentCard(block.value ?? '');
				if (parsed && 'error' in parsed) {
					issues.push({ line: block.position?.start.line ?? 0, code: 'comment-card', message: parsed.error });
				} else if (parsed) {
					commentOrder += 1;
					const key = parsed.id ? `note:${parsed.id}` : `note:#${section.index}.${commentOrder}`;
					push({ ...base(section), cardKey: key, origin: 'comment-card', type: 'definition', track: 'memorize', concept: parsed.q, front: parsed.q, back: parsed.a, units: [] });
				}
				continue;
			}
			// definition: root-level definition list items.
			if (block.type === 'list') {
				for (const item of block.children ?? []) {
					const para = (item.children ?? []).find((c) => c.type === 'paragraph');
					const def = para ? matchDefinition(para) : null;
					if (!def) continue;
					push({ ...base(section), cardKey: cardKey('definition', def.term), origin: 'rule-definition', type: 'definition', track: 'memorize', concept: def.term, front: definitionFront(def.term), back: def.definition, units: note.nodeUnits.get(item) ?? [] });
				}
			}
			// formula: `X의 식:` + display math, or `X 사용법:` / `X의 코드:` / `X 예시:` + a code block (D13).
			// The list or paragraph right after explains the symbols or the key points.
			if ((block.type === 'math' || block.type === 'code') && previousParagraph) {
				const sentences = splitSentences(inlineText(previousParagraph));
				const last = sentences.at(-1) ?? '';
				const concept =
					block.type === 'math'
						? last.replace(/[:：]\s*$/u, '').replace(/의\s*식\s*(은|이다)?\s*$/u, '').trim()
						: (/^(.+?)(?:의)?\s*(?:코드|사용법|예시|패턴)\s*[:：]\s*$/u.exec(last)?.[1] ?? '').trim();
				const units = note.nodeUnits.get(block) ?? [];
				if (concept && concept.length <= 60 && units.length) {
					const formula = block.value ?? '';
					const next = section.blocks[blockIndex + 1];
					const meaningUnits = next && (next.type === 'list' || next.type === 'paragraph') ? (note.nodeUnits.get(next) ?? (next.children ?? []).flatMap((c) => note.nodeUnits.get(c) ?? [])) : [];
					const meaningLines = meaningUnits.map((id) => note.units.get(id)?.text ?? '').filter(Boolean);
					const kind = block.type === 'code' ? 'code' : 'math';
					const lang = block.type === 'code' ? (block.lang ?? '') : '';
					push({ ...base(section), cardKey: cardKey('formula', concept), origin: 'rule-formula', type: 'formula', track: 'memorize', concept, front: formulaFront(formula, null, kind, lang), back: formulaBack(concept, meaningLines), units: [...units, ...meaningUnits], formula, formulaKind: kind, formulaLang: lang, confusables: [] });
				}
			}
			// definition: <Term term="X">definition</Term> anywhere in the block (links to other posts excluded).
			walk(block, (n) => {
				if ((n.type === 'mdxJsxTextElement' || n.type === 'mdxJsxFlowElement') && n.name === 'Term' && !jsxAttr(n, 'href')) {
					const term = jsxAttr(n, 'term');
					const definition = (n.children ?? []).map(inlineText).join('').replace(/\s+/g, ' ').trim();
					if (term && definition) push({ ...base(section), cardKey: cardKey('definition', term), origin: 'rule-term', type: 'definition', track: 'memorize', concept: term, front: definitionFront(term), back: definition, units: [] });
				}
			});
			previousParagraph = block.type === 'paragraph' ? block : null;
		}
		if (opts.headingBaseline) addPrincipleFromHeading(note, section, push);
	}
	return { cards, used, issues };
}

/** principle: a question heading is the front, the section's first paragraph the back. */
function addPrincipleFromHeading(note: Note, section: Section, push: (card: Card) => void): void {
	if (section.index === 0 || !isQuestionHeading(section.heading)) return;
	const firstPara = section.blocks.find((b) => b.type === 'paragraph');
	const units = firstPara ? (note.nodeUnits.get(firstPara) ?? []) : [];
	if (!units.length) return;
	const back = units.map((id) => `- ${note.units.get(id)?.text ?? ''}`).join('\n');
	const concept = headingSubject(section.heading);
	push({ cardKey: cardKey('principle', concept, sha256(normalizeForKey(section.heading)).slice(0, 8)), sourceId: note.sourceId, origin: 'heading-baseline', type: 'principle', track: 'understand', concept, front: section.heading, back, units, section: section.index, heading: section.heading });
}
