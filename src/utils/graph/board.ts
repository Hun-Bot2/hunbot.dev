// Pure layout for the Explore relationship map (docs/plans/2026-10-08-explore-knowledge-graph.md).
// No DOM, no astro:content: the browser measures each card's height at CARD_W and
// passes it in, so the same function runs under `node --test`.
//
// Only records that take part in a declared link are laid out; everything else
// is a plain list outside the graph. There are no project lanes: nothing here is
// grouped by series, tag or category, only by the links themselves.
//
// Each connected component is a layered DAG (longest-path ranks):
//   - an arrow runs from a lower column to a higher one, starts on the source
//     card's right border and ends on the target card's left border;
//   - an arrow that spans several columns passes through a reserved slot in
//     every column it crosses, so it can never run through a card;
//   - an arrow that would point backwards (a cycle in the declared links) goes
//     around underneath the component.
// Components are packed left to right in rows no wider than `maxWidth`.
//
// Everything is deterministic: ordering depends only on dates and ids.

export const CARD_W = 200;
export const GAP_X = 72;
const ROW_GAP = 14;
const SLOT_H = 8;
const SLOT_GAP = 8;
const COMP_GAP_X = 64;
const COMP_GAP_Y = 48;
const BACK_MARGIN = 16;
const BACK_CHANNEL = 24;
const DEFAULT_MAX_WIDTH = 1400;

export type BoardNode = {
	id: string;
	ts: number;
	/** Measured height of the card at CARD_W. */
	h: number;
};
export type BoardEdge = { from: string; to: string };
export type BoardOptions = { maxWidth?: number };

export type Placed = { x: number; y: number; w: number; h: number; col: number };
export type RoutedEdge = { from: string; to: string; d: string; points: [number, number][] };
type Cmd = [string, ...number[]];
type Route = { from: string; to: string; cmds: Cmd[]; points: [number, number][] };
export type Board = {
	width: number;
	height: number;
	placed: Map<string, Placed>;
	edges: RoutedEdge[];
	components: number;
};

/** Longest-path ranks, ignoring DFS back edges so cycles cannot loop. */
export function rankNodes(ids: string[], edges: BoardEdge[]) {
	const sorted = [...ids].sort();
	const out = new Map<string, string[]>(sorted.map((id) => [id, []]));
	for (const edge of edges) out.get(edge.from)!.push(edge.to);
	for (const targets of out.values()) targets.sort();
	const mark = new Map<string, number>();
	const back = new Set<string>();
	const visit = (u: string) => {
		mark.set(u, 1);
		for (const v of out.get(u)!) {
			if (mark.get(v) === 1) back.add(`${u}>${v}`);
			else if (!mark.has(v)) visit(v);
		}
		mark.set(u, 2);
	};
	for (const id of sorted) if (!mark.has(id)) visit(id);
	const indeg = new Map<string, number>(sorted.map((id) => [id, 0]));
	for (const [u, targets] of out) for (const v of targets) if (!back.has(`${u}>${v}`)) indeg.set(v, indeg.get(v)! + 1);
	const rank = new Map<string, number>(sorted.map((id) => [id, 0]));
	const queue = sorted.filter((id) => indeg.get(id) === 0);
	while (queue.length) {
		const u = queue.shift()!;
		for (const v of out.get(u)!) {
			if (back.has(`${u}>${v}`)) continue;
			rank.set(v, Math.max(rank.get(v)!, rank.get(u)! + 1));
			indeg.set(v, indeg.get(v)! - 1);
			if (indeg.get(v) === 0) queue.push(v);
		}
	}
	return { rank };
}

/** A rounded orthogonal polyline as path commands plus its sampled corner points. */
function roundedPath(points: [number, number][], radius: number) {
	const cmds: Cmd[] = [['M', points[0]![0], points[0]![1]]];
	const sampled: [number, number][] = [points[0]!];
	for (let i = 1; i < points.length - 1; i += 1) {
		const [px, py] = points[i - 1]!;
		const [cx, cy] = points[i]!;
		const [nx, ny] = points[i + 1]!;
		const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
		const ux = Math.sign(cx - px);
		const uy = Math.sign(cy - py);
		const vx = Math.sign(nx - cx);
		const vy = Math.sign(ny - cy);
		cmds.push(['L', cx - ux * r, cy - uy * r], ['Q', cx, cy, cx + vx * r, cy + vy * r]);
		sampled.push([cx - ux * r, cy - uy * r], [cx, cy], [cx + vx * r, cy + vy * r]);
	}
	const last = points[points.length - 1]!;
	cmds.push(['L', last[0], last[1]]);
	sampled.push(last);
	return { cmds, points: sampled };
}

const shift = (cmds: Cmd[], dx: number, dy: number): Cmd[] => cmds.map(([c, ...n]) => [c, ...n.map((v, i) => v + (i % 2 === 0 ? dx : dy))] as Cmd);
const serialize = (cmds: Cmd[]) => cmds.map(([c, ...n]) => `${c}${n.map((v) => Math.round(v * 100) / 100).join(' ')}`).join(' ');

type Anchor = [number, number];

/** Cubic from (x1,y1) to (x2,y2) with horizontal tangents; returns the path segment and sampled points. */
function curve(x1: number, y1: number, x2: number, y2: number) {
	const mid = (x1 + x2) / 2;
	const points: Anchor[] = [];
	for (let i = 1; i <= 16; i += 1) {
		const t = i / 16;
		const u = 1 - t;
		points.push([u ** 3 * x1 + 3 * u * u * t * mid + 3 * u * t * t * mid + t ** 3 * x2, u ** 3 * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y2]);
	}
	return { cmd: ['C', mid, y1, mid, y2, x2, y2] as Cmd, points };
}

type Item = { id: string; real: boolean; h: number; col: number; ts: number };
type Chain = { from: string; to: string; items: string[]; back: boolean };
type Laid = {
	ids: string[];
	width: number;
	height: number;
	boxes: Map<string, { x: number; y: number; w: number; h: number; col: number }>;
	edges: Route[];
	ts: number;
};

function layoutComponent(nodes: BoardNode[], edges: BoardEdge[]): Laid {
	const { rank } = rankNodes(nodes.map((node) => node.id), edges);
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const items = new Map<string, Item>();
	for (const node of nodes) items.set(node.id, { id: node.id, real: true, h: node.h, col: rank.get(node.id)!, ts: node.ts });

	// One chain per edge: the source, a slot in every column the edge crosses, the target.
	const chains: Chain[] = [];
	for (const edge of [...edges].sort((a, b) => `${a.from}>${a.to}`.localeCompare(`${b.from}>${b.to}`))) {
		const a = rank.get(edge.from)!;
		const b = rank.get(edge.to)!;
		if (b <= a) {
			chains.push({ from: edge.from, to: edge.to, items: [edge.from, edge.to], back: true });
			continue;
		}
		const chain = [edge.from];
		for (let col = a + 1; col < b; col += 1) {
			const id = `~${edge.from}>${edge.to}@${col}`;
			items.set(id, { id, real: false, h: SLOT_H, col, ts: nodeById.get(edge.from)!.ts });
			chain.push(id);
		}
		chain.push(edge.to);
		chains.push({ from: edge.from, to: edge.to, items: chain, back: false });
	}

	const cols = Math.max(...[...items.values()].map((item) => item.col)) + 1;
	const neighbours = new Map<string, string[]>([...items.keys()].map((id) => [id, []]));
	for (const chain of chains) {
		if (chain.back) continue;
		for (let i = 0; i + 1 < chain.items.length; i += 1) {
			neighbours.get(chain.items[i]!)!.push(chain.items[i + 1]!);
			neighbours.get(chain.items[i + 1]!)!.push(chain.items[i]!);
		}
	}
	for (const chain of chains) {
		if (!chain.back) continue;
		neighbours.get(chain.from)!.push(chain.to);
		neighbours.get(chain.to)!.push(chain.from);
	}

	// Column order: date, then barycentre sweeps to reduce crossings.
	const columns: string[][] = Array.from({ length: cols }, () => []);
	for (const item of [...items.values()].sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id))) columns[item.col]!.push(item.id);
	const indexOf = new Map<string, number>();
	const reindex = () => columns.forEach((column) => column.forEach((id, index) => indexOf.set(id, index)));
	reindex();
	const sweep = (col: number, side: -1 | 1) => {
		const key = (id: string) => {
			const near = neighbours.get(id)!.filter((other) => items.get(other)!.col === col + side);
			return near.length ? near.reduce((sum, other) => sum + indexOf.get(other)!, 0) / near.length : indexOf.get(id)!;
		};
		columns[col] = [...columns[col]!].sort((a, b) => key(a) - key(b) || indexOf.get(a)! - indexOf.get(b)!);
		columns[col]!.forEach((id, index) => indexOf.set(id, index));
	};
	for (let pass = 0; pass < 4; pass += 1) {
		for (let col = 1; col < cols; col += 1) sweep(col, -1);
		for (let col = cols - 2; col >= 0; col -= 1) sweep(col, 1);
	}

	// Vertical positions (centres): stack each column, centre it, then pull items toward their neighbours.
	const cy = new Map<string, number>();
	const gapBetween = (a: string, b: string) => (items.get(a)!.real && items.get(b)!.real ? ROW_GAP : SLOT_GAP);
	const stack = (column: string[]) => {
		let y = 0;
		column.forEach((id, index) => {
			const item = items.get(id)!;
			if (index > 0) y += gapBetween(column[index - 1]!, id);
			cy.set(id, y + item.h / 2);
			y += item.h;
		});
		return y;
	};
	const heights = columns.map(stack);
	const tallest = Math.max(...heights);
	columns.forEach((column, col) => {
		const shift = (tallest - heights[col]!) / 2;
		for (const id of column) cy.set(id, cy.get(id)! + shift);
	});
	const settle = (col: number, from: -1 | 1) => {
		const column = columns[col]!;
		const desired = column.map((id) => {
			const near = neighbours.get(id)!.filter((other) => items.get(other)!.col === col + from);
			return near.length ? near.reduce((sum, other) => sum + cy.get(other)!, 0) / near.length : cy.get(id)!;
		});
		const pos: number[] = [];
		column.forEach((id, index) => {
			const item = items.get(id)!;
			if (index === 0) pos.push(desired[0]!);
			else {
				const prev = items.get(column[index - 1]!)!;
				pos.push(Math.max(desired[index]!, pos[index - 1]! + prev.h / 2 + gapBetween(column[index - 1]!, id) + item.h / 2));
			}
		});
		const drift = desired.reduce((sum, want, index) => sum + (want - pos[index]!), 0) / column.length;
		column.forEach((id, index) => cy.set(id, pos[index]! + drift));
	};
	for (let pass = 0; pass < 6; pass += 1) {
		for (let col = 1; col < cols; col += 1) settle(col, -1);
		for (let col = cols - 2; col >= 0; col -= 1) settle(col, 1);
	}
	let top = Infinity;
	let bottom = -Infinity;
	for (const [id, item] of items) {
		top = Math.min(top, cy.get(id)! - item.h / 2);
		bottom = Math.max(bottom, cy.get(id)! + item.h / 2);
	}

	const boxes = new Map<string, { x: number; y: number; w: number; h: number; col: number }>();
	const colX = (col: number) => col * (CARD_W + GAP_X);
	for (const item of items.values()) boxes.set(item.id, { x: colX(item.col), y: cy.get(item.id)! - item.h / 2 - top, w: CARD_W, h: item.h, col: item.col });
	const bodyHeight = bottom - top;

	// Attachment points: arrows that meet at one border are spread along it, ordered by where they come from / go to.
	const outs = new Map<string, Chain[]>();
	const ins = new Map<string, Chain[]>();
	for (const chain of chains) {
		outs.set(chain.from, [...(outs.get(chain.from) ?? []), chain]);
		ins.set(chain.to, [...(ins.get(chain.to) ?? []), chain]);
	}
	const spread = (map: Map<string, Chain[]>, pick: (chain: Chain) => string) => {
		const result = new Map<Chain, number>();
		for (const [id, list] of map) {
			const box = boxes.get(id)!;
			const ordered = [...list].sort((a, b) => cy.get(pick(a))! - cy.get(pick(b))! || `${a.from}>${a.to}`.localeCompare(`${b.from}>${b.to}`));
			ordered.forEach((chain, index) => result.set(chain, box.y + (box.h * (index + 1)) / (ordered.length + 1)));
		}
		return result;
	};
	const startY = spread(outs, (chain) => chain.items[1]!);
	const endY = spread(ins, (chain) => chain.items[chain.items.length - 2]!);

	const routed: Route[] = [];
	let backIndex = 0;
	for (const chain of chains) {
		const a = boxes.get(chain.from)!;
		const b = boxes.get(chain.to)!;
		const x1 = a.x + a.w;
		const y1 = startY.get(chain)!;
		const x2 = b.x;
		const y2 = endY.get(chain)!;
		if (chain.back) {
			const channel = bodyHeight + BACK_CHANNEL + backIndex * 8;
			backIndex += 1;
			const leave = x1 + BACK_MARGIN;
			const enter = x2 - BACK_MARGIN;
			routed.push({ from: chain.from, to: chain.to, ...roundedPath([[x1, y1], [leave, y1], [leave, channel], [enter, channel], [enter, y2], [x2, y2]], 10) });
			continue;
		}
		const cmds: Cmd[] = [['M', x1, y1]];
		const points: Anchor[] = [[x1, y1]];
		let px = x1;
		let py = y1;
		for (const id of chain.items.slice(1, -1)) {
			const slot = boxes.get(id)!;
			const sy = slot.y + slot.h / 2;
			const seg = curve(px, py, slot.x, sy);
			cmds.push(seg.cmd, ['L', slot.x + slot.w, sy]);
			points.push(...seg.points, [slot.x + slot.w, sy]);
			px = slot.x + slot.w;
			py = sy;
		}
		const last = curve(px, py, x2, y2);
		cmds.push(last.cmd);
		points.push(...last.points);
		routed.push({ from: chain.from, to: chain.to, cmds, points });
	}

	// Back arrows leave through the margin: reserve it on both sides and the channel below.
	const hasBack = chains.some((chain) => chain.back);
	const pad = hasBack ? BACK_MARGIN : 0;
	const width = cols * CARD_W + (cols - 1) * GAP_X;
	const height = bodyHeight + (hasBack ? BACK_CHANNEL + backIndex * 8 : 0);
	if (pad > 0) {
		for (const box of boxes.values()) box.x += pad;
		for (const edge of routed) {
			edge.points = edge.points.map(([x, y]) => [x + pad, y]);
			edge.cmds = shift(edge.cmds, pad, 0);
		}
	}
	return {
		ids: nodes.map((node) => node.id),
		width: width + pad * 2,
		height,
		boxes: new Map([...boxes].filter(([id]) => nodeById.has(id))),
		edges: routed,
		ts: Math.min(...nodes.map((node) => node.ts)),
	};
}

export function layoutBoard(nodes: BoardNode[], edges: BoardEdge[], options: BoardOptions = {}): Board {
	const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
	const known = new Set(nodes.map((node) => node.id));
	const unique = new Map<string, BoardEdge>();
	for (const edge of edges) if (edge.from !== edge.to && known.has(edge.from) && known.has(edge.to)) unique.set(`${edge.from}>${edge.to}`, edge);
	const clean = [...unique.values()];

	// Connected components (undirected).
	const parent = new Map<string, string>(nodes.map((node) => [node.id, node.id]));
	const find = (x: string): string => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!));
	for (const edge of clean) parent.set(find(edge.from), find(edge.to));
	const groups = new Map<string, BoardNode[]>();
	for (const node of nodes) groups.set(find(node.id), [...(groups.get(find(node.id)) ?? []), node]);
	const laid: Laid[] = [...groups.values()]
		.filter((group) => group.length > 0)
		.map((group) => {
			const ids = new Set(group.map((node) => node.id));
			if (group.length === 1) return { ids: [group[0]!.id], width: CARD_W, height: group[0]!.h, boxes: new Map([[group[0]!.id, { x: 0, y: 0, w: CARD_W, h: group[0]!.h, col: 0 }]]), edges: [], ts: group[0]!.ts };
			return layoutComponent(group, clean.filter((edge) => ids.has(edge.from) && ids.has(edge.to)));
		})
		.sort((a, b) => b.ids.length - a.ids.length || a.ts - b.ts || [...a.ids].sort()[0]!.localeCompare([...b.ids].sort()[0]!));

	// Shelf packing: rows left to right, never wider than maxWidth (unless one component is).
	const placed = new Map<string, Placed>();
	const routed: RoutedEdge[] = [];
	let x = 0;
	let y = 0;
	let rowHeight = 0;
	let width = 0;
	for (const comp of laid) {
		if (x > 0 && x + comp.width > maxWidth) {
			x = 0;
			y += rowHeight + COMP_GAP_Y;
			rowHeight = 0;
		}
		for (const [id, box] of comp.boxes) placed.set(id, { x: x + box.x, y: y + box.y, w: box.w, h: box.h, col: box.col });
		for (const edge of comp.edges) {
			routed.push({
				from: edge.from,
				to: edge.to,
				points: edge.points.map(([px, py]) => [px + x, py + y] as [number, number]),
				d: serialize(shift(edge.cmds, x, y)),
			});
		}
		width = Math.max(width, x + comp.width);
		rowHeight = Math.max(rowHeight, comp.height);
		x += comp.width + COMP_GAP_X;
	}
	return { width, height: laid.length ? y + rowHeight : 0, placed, edges: routed, components: laid.length };
}
