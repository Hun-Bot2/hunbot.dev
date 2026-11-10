// Reads one note: raw hash, frontmatter, MDX/Markdown AST, sections and numbered units.
// Parsing only — imports, expressions and components are never executed.
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import YAML from 'yaml';
import { inlineText, sha256, splitSentences } from './text.ts';

export type Pos = { start: { line: number; offset: number }; end: { line: number; offset: number } };
export type MdNode = {
	type: string;
	value?: string;
	lang?: string | null;
	depth?: number;
	children?: MdNode[];
	name?: string | null;
	attributes?: Array<{ type: string; name?: string; value?: unknown }>;
	position?: Pos;
};

export type UnitKind = 'S' | 'C' | 'M';
export type Unit = {
	id: string;
	kind: UnitKind;
	text: string;
	lang?: string;
	section: number;
	/** Offsets into the whole file (frontmatter included). Sentence units carry their block's span in Phase 0. */
	start: number;
	end: number;
	line: number;
};
export type Section = { index: number; heading: string; depth: number; headingPath: string[]; units: string[]; blocks: MdNode[] };

export type Note = {
	file: string;
	relPath: string;
	sourceId: string;
	documentHash: string;
	isMdx: boolean;
	frontmatter: Record<string, unknown> | null;
	title: string;
	sections: Section[];
	units: Map<string, Unit>;
	/** Block node → unit IDs created from it (rules use this to find evidence). */
	nodeUnits: Map<MdNode, string[]>;
	parseError: string | null;
};

export const CARD_BREAK = /^\s*\/\*\s*card-break\s*\*\/\s*$/;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function splitFrontmatter(text: string): { data: Record<string, unknown> | null; body: string; bodyOffset: number; bodyLine: number } {
	const m = FRONTMATTER.exec(text);
	if (!m) return { data: null, body: text, bodyOffset: 0, bodyLine: 0 };
	let data: Record<string, unknown> | null = null;
	try {
		const parsed = YAML.parse(m[1]);
		data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
	} catch {
		data = null;
	}
	const consumed = m[0];
	return { data, body: text.slice(consumed.length), bodyOffset: consumed.length, bodyLine: consumed.split('\n').length - 1 };
}

export function parseMarkdown(body: string, isMdx: boolean): MdNode {
	// GFM (tables, strikethrough, autolinks) is on by default in Astro, so the blog parses it; match that.
	const processor = isMdx ? unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkMdx) : unified().use(remarkParse).use(remarkGfm).use(remarkMath);
	return processor.parse(body) as unknown as MdNode;
}

export function readNote(file: string, root: string): Note {
	const raw = fs.readFileSync(file);
	let text = raw.toString('utf8');
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
	const relPath = path.relative(root, file).split(path.sep).join('/');
	const isMdx = file.endsWith('.mdx');
	const { data, body, bodyOffset, bodyLine } = splitFrontmatter(text);
	const fmTitle = typeof data?.title === 'string' ? data.title : null;
	const note: Note = {
		file,
		relPath,
		// Opaque: derived from the relative path, never the absolute path (Phase 0; a DB-issued UUID later).
		sourceId: 'src-' + sha256(relPath).slice(0, 16),
		documentHash: sha256(raw),
		isMdx,
		frontmatter: data,
		title: fmTitle ?? path.basename(file).replace(/\.mdx?$/, ''),
		sections: [],
		units: new Map(),
		nodeUnits: new Map(),
		parseError: null,
	};
	let tree: MdNode;
	try {
		tree = parseMarkdown(body, isMdx);
	} catch (error) {
		note.parseError = error instanceof Error ? error.message.split('\n')[0] : String(error);
		return note;
	}
	buildSections(note, tree, bodyOffset, bodyLine);
	return note;
}

function buildSections(note: Note, tree: MdNode, bodyOffset: number, bodyLine: number): void {
	const counters: Record<UnitKind, number> = { S: 0, C: 0, M: 0 };
	const path: string[] = [];
	let current: Section = { index: 0, heading: note.title, depth: 1, headingPath: [note.title], units: [], blocks: [] };
	note.sections.push(current);

	const addUnit = (kind: UnitKind, text: string, node: MdNode, lang?: string) => {
		counters[kind] += 1;
		const id = `${kind}${counters[kind]}`;
		const start = (node.position?.start.offset ?? 0) + bodyOffset;
		const end = (node.position?.end.offset ?? 0) + bodyOffset;
		const line = (node.position?.start.line ?? 0) + bodyLine;
		note.units.set(id, { id, kind, text, lang, section: current.index, start, end, line });
		current.units.push(id);
		const list = note.nodeUnits.get(node) ?? [];
		list.push(id);
		note.nodeUnits.set(node, list);
	};

	const visitBlock = (node: MdNode): void => {
		switch (node.type) {
			case 'paragraph':
				for (const sentence of splitSentences(inlineText(node))) addUnit('S', sentence, node);
				return;
			case 'list':
				for (const item of node.children ?? []) visitListItem(item);
				return;
			case 'code':
				addUnit('C', node.value ?? '', node, node.lang ?? undefined);
				return;
			case 'math':
				addUnit('M', node.value ?? '', node);
				return;
			case 'blockquote':
			case 'mdxJsxFlowElement':
				for (const child of node.children ?? []) visitBlock(child);
				return;
			case 'table': {
				// One unit per body row, written as "header: value · header: value" so a back reads as a sentence.
				const [header, ...rows] = node.children ?? [];
				const names = (header?.children ?? []).map((cell) => inlineText(cell).trim());
				for (const row of rows) {
					const cells = (row.children ?? []).map((cell) => inlineText(cell).trim());
					const parts = cells.map((v, i) => (v ? (names[i] ? `${names[i]}: ${v}` : v) : '')).filter(Boolean);
					if (parts.length) addUnit('S', parts.join(' · '), row);
				}
				return;
			}
			default:
				return; // thematicBreak, html, mdxjsEsm, mdxFlowExpression (comments) carry no units
		}
	};

	const visitListItem = (item: MdNode): void => {
		const own = (item.children ?? []).filter((c) => c.type === 'paragraph');
		const text = own.map((p) => inlineText(p)).join(' ').replace(/\s*\n\s*/g, ' ').trim();
		if (text) addUnit('S', text, item);
		for (const child of item.children ?? []) {
			if (child.type !== 'paragraph') visitBlock(child);
		}
	};

	for (const node of tree.children ?? []) {
		if (node.type === 'heading') {
			const depth = node.depth ?? 2;
			const heading = inlineText(node).trim();
			path.length = Math.max(0, depth - 1);
			path[depth - 1] = heading;
			current = { index: note.sections.length, heading, depth, headingPath: path.filter(Boolean), units: [], blocks: [] };
			note.sections.push(current);
			continue;
		}
		if (node.type === 'mdxFlowExpression' && CARD_BREAK.test(node.value ?? '')) {
			current = { index: note.sections.length, heading: current.heading, depth: current.depth, headingPath: [...current.headingPath], units: [], blocks: [] };
			note.sections.push(current);
			continue;
		}
		current.blocks.push(node);
		visitBlock(node);
	}
}

/** Decision D11: only study notes are sources (`src/content/blog/<lang>/study/**`). Devlogs and other folders never are. */
export const STUDY_SOURCE = /^src\/content\/blog\/[a-z]{2}\/study\//;
export const DEFAULT_SOURCE = 'src/content/blog/ko/study';

export function isStudySource(relPath: string): boolean {
	return STUDY_SOURCE.test(relPath);
}

/** Notes under the given paths (files or directories), .md and .mdx only, hidden folders skipped. */
export function collectFiles(inputs: string[]): string[] {
	const out: string[] = [];
	const walk = (p: string) => {
		const stat = fs.statSync(p);
		if (stat.isDirectory()) {
			for (const entry of fs.readdirSync(p)) {
				if (entry.startsWith('.') || entry === 'node_modules') continue;
				walk(path.join(p, entry));
			}
		} else if (/\.mdx?$/.test(p)) {
			out.push(path.resolve(p));
		}
	};
	for (const input of inputs) walk(input);
	return out.sort();
}
