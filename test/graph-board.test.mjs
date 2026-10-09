// Tests for the Explore relationship map's pure modules: board layout
// (src/utils/graph/board.ts), inspector placement (place.ts) and display
// helpers (display.ts), plus a smoke test over the real content. The layout takes measured card heights as input,
// so these run without a browser.
import assert from 'node:assert/strict';
import test from 'node:test';

import { readArtifactSources } from '../scripts/lib/read-artifact-sources.mjs';
import { buildHunbotArtifactExport } from '../src/utils/artifacts/adapters.ts';
import { CARD_W, layoutBoard, rankNodes } from '../src/utils/graph/board.ts';
import { placeAtCorner, placeFloating } from '../src/utils/graph/place.ts';
import { formatArtifactTime, resolveHref, resolveText } from '../src/utils/graph/display.ts';
import { repoRoot } from './helpers/contract-fixture.mjs';

const node = (id, ts, h = 56) => ({ id, ts, h });

const overlaps = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
const inside = (p, box) => p[0] > box.x + 0.5 && p[0] < box.x + box.w - 0.5 && p[1] > box.y + 0.5 && p[1] < box.y + box.h - 0.5;

/** Points along an edge, including the straight stretches between sampled points. */
function* along(points) {
	for (let i = 0; i + 1 < points.length; i += 1) {
		for (let step = 0; step < 8; step += 1) {
			const t = step / 8;
			yield [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t];
		}
	}
	yield points[points.length - 1];
}

function assertSound(board) {
	const boxes = [...board.placed.entries()];
	for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) assert.ok(!overlaps(boxes[i][1], boxes[j][1]), `cards ${boxes[i][0]} and ${boxes[j][0]} overlap`);
	for (const [id, box] of boxes) assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= board.width + 0.5 && box.y + box.h <= board.height + 0.5, `card ${id} is inside the board`);
	for (const edge of board.edges) {
		const from = board.placed.get(edge.from);
		const to = board.placed.get(edge.to);
		const start = edge.points[0];
		const end = edge.points[edge.points.length - 1];
		assert.ok(Math.abs(start[0] - (from.x + from.w)) < 1 && start[1] >= from.y && start[1] <= from.y + from.h, `edge ${edge.from} starts on the source's right border`);
		assert.ok(Math.abs(end[0] - to.x) < 1 && end[1] >= to.y && end[1] <= to.y + to.h, `edge ${edge.from}>${edge.to} ends on the target's left border`);
		for (const point of along(edge.points)) for (const [id, box] of boxes) assert.ok(!inside(point, box), `edge ${edge.from}>${edge.to} crosses card ${id}`);
		for (const point of edge.points) assert.ok(point[0] >= -0.5 && point[1] >= -0.5 && point[0] <= board.width + 0.5 && point[1] <= board.height + 0.5, `edge ${edge.from}>${edge.to} stays inside the board`);
	}
}

test('rankNodes: longest path, cycles do not loop', () => {
	const { rank } = rankNodes(['a', 'b', 'c', 'd'], [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'a', to: 'c' }, { from: 'c', to: 'a' }]);
	assert.equal(rank.get('a'), 0);
	assert.equal(rank.get('b'), 1);
	assert.equal(rank.get('c'), 2);
	assert.equal(rank.get('d'), 0);
});

test('layoutBoard: one link is a straight arrow from the earlier card to the later one', () => {
	const edges = [{ from: 'a', to: 'b' }];
	const board = layoutBoard([node('a', 2), node('b', 3)], edges);
	assert.equal(board.edges.length, 1);
	assert.equal(board.components, 1);
	assert.ok(board.placed.get('a').x < board.placed.get('b').x, 'the arrow runs left to right');
	assert.ok(Math.abs(board.edges[0].points[0][1] - board.edges[0].points.at(-1)[1]) < 1, 'same-height cards give a level arrow');
	assertSound(board);
});

test('layoutBoard: the board is exactly the linked cards, no empty margin or containers', () => {
	const board = layoutBoard([node('a', 2), node('b', 3)], [{ from: 'a', to: 'b' }]);
	assert.equal(board.width, 2 * CARD_W + 72);
	assert.equal(board.height, 56);
	assert.equal(Math.min(...[...board.placed.values()].map((box) => box.x)), 0);
	assert.equal(Math.min(...[...board.placed.values()].map((box) => box.y)), 0);
});

test('layoutBoard: a long link passes through a free slot in every column it crosses', () => {
	const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
	const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'a', to: 'c' }, { from: 'c', to: 'd' }, { from: 'a', to: 'f' }, { from: 'd', to: 'e' }, { from: 'b', to: 'e' }];
	assertSound(layoutBoard(ids.map((id, i) => node(id, i, 40 + i * 9)), edges));
});

test('layoutBoard: arrows meeting at one border are spread along it', () => {
	const edges = [{ from: 'a', to: 'c' }, { from: 'b', to: 'c' }, { from: 'd', to: 'c' }];
	const board = layoutBoard(['a', 'b', 'c', 'd'].map((id, i) => node(id, i)), edges);
	assert.equal(new Set(board.edges.map((edge) => Math.round(edge.points.at(-1)[1]))).size, 3, 'three arrowheads on three different heights');
	assertSound(board);
});

test('layoutBoard: a cycle in the declared links stays sound (the backward arrow goes around)', () => {
	const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }];
	const board = layoutBoard(['a', 'b', 'c'].map((id, i) => node(id, i)), edges);
	assert.equal(board.edges.length, 3);
	assertSound(board);
});

test('layoutBoard: separate groups are packed in rows no wider than maxWidth', () => {
	const nodes = [];
	const edges = [];
	for (let i = 0; i < 6; i += 1) {
		nodes.push(node(`a${i}`, i * 2), node(`b${i}`, i * 2 + 1));
		edges.push({ from: `a${i}`, to: `b${i}` });
	}
	const wide = layoutBoard(nodes, edges, { maxWidth: 1400 });
	assert.equal(wide.components, 6);
	assert.ok(wide.width <= 1400);
	assert.ok(wide.height > 56, 'wraps onto more than one row');
	assertSound(wide);
	const narrow = layoutBoard(nodes, edges, { maxWidth: 600 });
	assert.ok(narrow.height > wide.height);
	assertSound(narrow);
});

test('layoutBoard: random graphs (long links, fans, cycles) never overlap or cross a card', () => {
	let seed = 20261009;
	const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
	for (let round = 0; round < 40; round += 1) {
		const count = 6 + Math.floor(random() * 40);
		const nodes = Array.from({ length: count }, (_, i) => node(`n${i}`, i, 36 + Math.floor(random() * 5) * 14));
		const edges = [];
		const links = Math.floor(count * (0.6 + random() * 1.2));
		for (let i = 0; i < links; i += 1) {
			let a = Math.floor(random() * count);
			let b = Math.floor(random() * count);
			// Mostly forward in time, occasionally backwards so cycles occur.
			if (random() < 0.85 && b < a) [b, a] = [a, b];
			if (a !== b) edges.push({ from: `n${a}`, to: `n${b}` });
		}
		const touched = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
		const board = layoutBoard(nodes.filter((n) => touched.has(n.id)), edges, { maxWidth: 900 + Math.floor(random() * 900) });
		assertSound(board);
	}
});

test('layoutBoard: is deterministic and ignores the order of its input', () => {
	const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'x', to: 'y' }];
	const nodes = ['a', 'b', 'c', 'x', 'y'].map((id, i) => node(id, i));
	const one = layoutBoard(nodes, edges);
	const two = layoutBoard([...nodes].reverse(), [...edges].reverse());
	assert.deepEqual([...one.placed.entries()].sort(), [...two.placed.entries()].sort());
	assert.deepEqual(one.edges.map((e) => e.d).sort(), two.edges.map((e) => e.d).sort());
});

test('layoutBoard: card width is the shared constant', () => {
	const board = layoutBoard([node('a', 1)], []);
	assert.equal(board.placed.get('a').w, CARD_W);
});

test('placeFloating: sits beside the anchor, never over it or over other cards', () => {
	const bounds = { w: 900, h: 500 };
	const size = { w: 340, h: 300 };
	const anchor = { x: 380, y: 200, w: 140, h: 60 };
	const other = { x: 620, y: 200, w: 140, h: 60 };
	const spot = placeFloating(anchor, size, bounds, [anchor, other]);
	assert.equal(spot.clear, true);
	const box = { x: spot.x, y: spot.y, w: size.w, h: size.h };
	assert.ok(!overlaps(box, anchor) && !overlaps(box, other));
	assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= bounds.w && box.y + box.h <= bounds.h, 'stays inside the workspace');
});

test('placeFloating: reports when nothing fits so the caller can make room', () => {
	const spot = placeFloating({ x: 100, y: 100, w: 300, h: 300 }, { w: 340, h: 300 }, { w: 500, h: 500 }, [{ x: 100, y: 100, w: 300, h: 300 }]);
	assert.equal(spot.clear, false);
});

test('placeAtCorner: takes the first corner that covers no card', () => {
	const size = { w: 300, h: 200 };
	const bounds = { w: 900, h: 500 };
	assert.deepEqual(placeAtCorner(size, bounds, []), { x: 588, y: 12, clear: true });
	const spot = placeAtCorner(size, bounds, [{ x: 600, y: 40, w: 100, h: 60 }]);
	assert.deepEqual([spot.x, spot.y, spot.clear], [12, 12, true], 'top left when the top right is taken');
	const none = placeAtCorner(size, { w: 700, h: 300 }, [{ x: 0, y: 0, w: 700, h: 300 }]);
	assert.equal(none.clear, false);
});

test('display helpers: text and link fall back to another language', () => {
	assert.equal(resolveText({ ko: '안녕' }, 'en').text, '안녕');
	assert.equal(resolveText(null, 'ko'), null);
	assert.deepEqual(resolveHref({ href: { ko: '/ko/x/' } }, 'jp'), { href: '/ko/x/', lang: 'ko' });
	assert.equal(formatArtifactTime({ time: { start: '2026-02-06' } }, 'ongoing'), '2026.02.06');
	assert.equal(formatArtifactTime({ time: { start: '2025-03', end: null } }, 'ongoing'), '2025.03 → ongoing');
});

test('real content: the board holds exactly the linked articles and routes the declared link', () => {
	const { export: contract } = buildHunbotArtifactExport(readArtifactSources(repoRoot));
	const edges = contract.relations.filter((relation) => relation.rel === 'informed').map((relation) => ({ from: relation.from, to: relation.to }));
	const touched = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
	const nodes = contract.artifacts.filter((artifact) => touched.has(artifact.id)).map((artifact) => node(artifact.id, Date.parse(artifact.time.start)));
	const board = layoutBoard(nodes, edges);
	assert.equal(board.placed.size, touched.size, 'every linked record is on the board, and nothing else');
	assert.ok(touched.size >= 2);
	assertSound(board);
});
