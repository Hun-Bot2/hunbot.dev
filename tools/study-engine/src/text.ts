// Plain-text helpers: inline text extraction, sentence splitting, Korean particles.
import { createHash } from 'node:crypto';

type Node = { type: string; value?: string; children?: Node[]; name?: string | null; attributes?: Array<{ type: string; name?: string; value?: unknown }> };

export function sha256(input: string | Buffer): string {
	return createHash('sha256').update(input).digest('hex');
}

export function jsxAttr(node: Node, name: string): string | undefined {
	const attr = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
	return typeof attr?.value === 'string' ? attr.value : undefined;
}

/** Visible text of an inline subtree. Images and JSX-only content are dropped; `<Term term="X">` keeps X. */
export function inlineText(node: Node): string {
	switch (node.type) {
		case 'text':
			return node.value ?? '';
		case 'inlineCode':
			return '`' + (node.value ?? '') + '`';
		case 'inlineMath':
			return '$' + (node.value ?? '') + '$';
		case 'break':
			return '\n';
		case 'image':
		case 'imageReference':
		case 'mdxTextExpression':
		case 'html':
			return '';
		case 'mdxJsxTextElement': {
			const term = jsxAttr(node, 'term');
			if (term) return term;
			return (node.children ?? []).map(inlineText).join('');
		}
		default:
			return (node.children ?? []).map(inlineText).join('');
	}
}

/** Split text into sentences: after . ! ? 。 … followed by whitespace, and at line breaks. */
export function splitSentences(text: string): string[] {
	return text
		.split(/\n+|(?<=[.!?。…])\s+/u)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

// How a final Latin letter or digit is read in Korean decides the particle: R (알), L (엘), M (엠), N (엔) end in a
// consonant; A (에이), F (에프), S (에스), T (티) … do not. Lowercase words follow their usual reading: -n, -m, -l, -ng
// end in a consonant (token 토큰, model 모델), most others do not (dense 덴스, softmax 소프트맥스).
const UPPER_WITH_BATCHIM = new Set(['L', 'M', 'N', 'R']);
const DIGIT_WITH_BATCHIM = new Set(['0', '1', '3', '6', '7', '8']);

/** True / false for a final consonant (batchim) as the word is read in Korean; null when it cannot be told. */
export function hasBatchim(word: string): boolean | null {
	const stripped = word.replace(/\s*\([^)]*\)\s*$/u, '').replace(/[\s'"`’”.,!?:;]+$/u, '');
	const ch = stripped.slice(-1);
	const code = ch.codePointAt(0) ?? 0;
	if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
	if (/[0-9]/.test(ch)) return DIGIT_WITH_BATCHIM.has(ch);
	if (/[A-Z]/.test(ch)) {
		const lastWord = /[A-Za-z]+$/.exec(stripped)?.[0] ?? ch;
		// An all-caps run is an acronym read letter by letter; a capitalised word falls through to the word rule.
		if (lastWord === lastWord.toUpperCase()) return UPPER_WITH_BATCHIM.has(ch);
	}
	if (/[a-zA-Z]/.test(ch)) {
		const w = stripped.toLowerCase();
		return /(ng|[nml])$/.test(w);
	}
	return null;
}

/** Pick a particle pair such as ['은', '는'] for `word`; non-Hangul endings get the combined form `은(는)`. */
export function particle(word: string, withBatchim: string, withoutBatchim: string): string {
	const b = hasBatchim(word);
	if (b === null) return `${withBatchim}(${withoutBatchim})`;
	return b ? withBatchim : withoutBatchim;
}

export function normalizeForKey(text: string): string {
	return text.normalize('NFC').replace(/\s+/gu, ' ').trim().toLowerCase();
}
