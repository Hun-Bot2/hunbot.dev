// Card text (Markdown subset) → safe HTML for Anki fields. Math becomes MathJax delimiters \( \) and \[ \],
// code is escaped inside <pre><code>, and raw HTML in the source is dropped (never passed through).
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

type MathNode = { type: string; value?: string };

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkMath)
	.use(remarkRehype, {
		allowDangerousHtml: false,
		handlers: {
			math: (_state: unknown, node: MathNode) => ({ type: 'element', tagName: 'div', properties: { className: ['math'] }, children: [{ type: 'text', value: `\\[${node.value ?? ''}\\]` }] }),
			inlineMath: (_state: unknown, node: MathNode) => ({ type: 'text', value: `\\(${node.value ?? ''}\\)` }),
		},
	} as never)
	.use(rehypeStringify);

export function markdownToHtml(markdown: string): string {
	return String(processor.processSync(markdown)).trim();
}
