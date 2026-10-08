// Dev/test only: loaded by graph-client.ts when the URL has ?bench. Exposes window.__kg for geometry checks
// and builds invented graphs for stress tests. Not part of the page's normal JavaScript.
import type { Cam, GraphData, RelationData, State } from './graph-types';

type Context = {
	go: (next: Partial<State>) => void;
	settle: () => void;
	camera: () => Cam & { goal: Cam; fitK: number };
	world: HTMLElement;
	viewport: HTMLElement;
	detail: HTMLElement;
};

export function install({ go, settle, camera, world, viewport, detail }: Context) {
	const box = (el: Element) => {
		const r = el.getBoundingClientRect();
		return { x: r.left, y: r.top, w: r.width, h: r.height };
	};
	(window as unknown as Record<string, unknown>).__kg = {
		go,
		// A hidden pane pauses animation frames: finish any camera move at once.
		settle,
		geometry: () => ({
			nodes: [...world.querySelectorAll<HTMLElement>('.kg-gnode')].map((el) => ({ id: el.dataset.id!, x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })),
			edges: [...world.querySelectorAll<SVGPathElement>('path.kg-edge')].map((path) => ({ from: path.dataset.from!, to: path.dataset.to!, d: path.getAttribute('d')!, length: path.getTotalLength(), points: Array.from({ length: 41 }, (_, i) => { const p = path.getPointAtLength((path.getTotalLength() * i) / 40); return [p.x, p.y]; }) })),
			board: { w: world.offsetWidth, h: world.offsetHeight },
			camera: camera(),
			// On-screen rectangles, for clipping / overlap checks.
			screen: {
				viewport: box(viewport),
				detail: detail.hidden ? null : box(detail),
				cards: [...world.querySelectorAll<HTMLElement>('.kg-gnode')].map((el) => ({ id: el.dataset.id!, ...box(el) })),
			},
		}),
	};
}

// N invented records and links (never shipped data).
export function withSyntheticGraph(data: GraphData, count: number): GraphData {
	const writing = data.nodes.filter((node) => node.kind === 'writing').sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
	const nodes = Array.from({ length: count }, (_, i) => ({ ...writing[i % writing.length]!, id: `s${i}`, title: `${writing[i % writing.length]!.title} ${i}`, ts: writing[i % writing.length]!.ts + i }));
	const relations: RelationData[] = [];
	const add = (i: number, j: number) => j < nodes.length && relations.push({ from: `s${i}`, to: `s${j}`, rel: 'informed', out: '', in: '' });
	// Groups of 2-7 records: a chain, a branch, a long link, and now and then a link into the previous group.
	const sizes = [2, 3, 5, 4, 7, 2, 3, 6];
	let start = 0;
	for (let g = 0; start < nodes.length; g += 1) {
		const size = Math.min(sizes[g % sizes.length]!, nodes.length - start);
		if (size < 2) break;
		for (let i = start; i + 1 < start + size; i += 1) add(i, i + 1);
		if (size >= 4) add(start, start + 2);
		if (size >= 5) add(start + 1, start + size - 1);
		if (g % 4 === 3 && start > 0) add(start - 1, start + 1);
		start += size;
	}
	return { ...data, nodes, relations, projects: data.projects };
}

