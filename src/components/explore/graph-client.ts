// Explore — the relationship map, browser side.
//
// Default view: a map of the records that take part in a declared link, and
// nothing else. Direction reads left → right and never changes with the
// selection. Records without a declared link are not drawn; they stay
// reachable through search and the list view. Selecting a card opens a floating inspector beside it.
// Secondary view: project cards (the earlier browse-by-project mode).
//
// Layout is deterministic (no simulation) and computed from measured card
// heights, so cards cannot overlap and edges are routed only through free
// channels. Docs: docs/plans/2026-10-08-explore-knowledge-graph.md.

import { CARD_W, GAP_X, layoutBoard, type Board } from '../../utils/graph/board';
import { placeAtCorner, placeFloating, type Rect } from '../../utils/graph/place';

import type { Cam, GraphData, NodeData, ProjectData, RelationData, State, View } from './graph-types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ENTRY_LIMIT = 8;
const MOVE_MS = 280;
/** Past this many links, unselected ones are drawn as thin grey lines without arrowheads. */
const MAX_EDGES = 40;
/** The overview never magnifies past this; below FLOOR it stops shrinking to fit and the visitor pans instead. */
const FIT_MAX = 0.875;
const FIT_FLOOR = 0.5;
/** A selection and its neighbours are framed together only while that stays this large (relative to the overview, within 0.3–0.45). */
const focusFloor = (fit: number) => Math.max(0.3, Math.min(0.45, fit * 0.7));
const ZOOM_MAX = 3;
/** Top strip of the workspace kept free for the mode switch and search (below the floating language button on wide screens). */
const bandOf = (narrow: boolean) => (narrow ? 52 : 84);
/** Below this width the inspector is a bottom sheet instead of floating beside the card. Keep in sync with graph.css. */
const NARROW = '(max-width: 820px)';

function init(root: HTMLElement, data: GraphData) {
	const S = data.strings;
	const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
	const stage = q('[data-kg-stage]');
	const viewport = q('[data-kg-viewport]');
	const world = q('[data-kg-board]');
	const detail = q('[data-kg-detail]');
	const zoomBox = q('.kg-zoom');
	const controlsBox = q('[data-kg-controls]');
	const listBody = q('[data-kg-listbody]');
	const filtersBox = q('[data-kg-filters]');
	const listMap = q('[data-kg-map]');
	const crumbs = q('[data-kg-crumbs]');
	const live = q('[data-kg-live]');
	const searchInput = q<HTMLInputElement>('[data-kg-search]');
	const searchList = q('[data-kg-results]');
	const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-kg-mode]')];
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const narrowQuery = window.matchMedia(NARROW);

	root.classList.add('kg--ready');

	// ------------------------------------------------------------ data
	const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
	const projectByKey = new Map(data.projects.map((project) => [project.key, project]));
	const membersOf = new Map<string, NodeData[]>();
	for (const node of data.nodes) if (node.project) membersOf.set(node.project, [...(membersOf.get(node.project) ?? []), node]);
	for (const members of membersOf.values()) members.sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));

	// Stored relation (from → to) is the only truth about direction. `out`/`in` are
	// wordings for the two ends and never swap which node an arrow starts at.
	const relations = data.relations.filter((relation) => nodeById.has(relation.from) && nodeById.has(relation.to));
	const relationsOf = (id: string) => relations.filter((relation) => relation.from === id || relation.to === id);

	const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
	function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
		const el = document.createElement(tag);
		if (cls) el.className = cls;
		if (text !== undefined) el.textContent = text;
		return el;
	}
	const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) => {
		const el = document.createElementNS(SVG_NS, tag);
		for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
		return el;
	};

	// ------------------------------------------------------------ state + URL
	let state: State = { view: 'graph', node: null, project: null };
	const hiddenRels = new Set<string>();
	let showAll = false;

	function readUrl(): State {
		const params = new URLSearchParams(location.search);
		const focus = params.get('focus');
		const project = params.get('project');
		return {
			view: params.get('view') === 'list' ? 'list' : 'graph',
			node: focus && nodeById.has(focus) ? focus : null,
			project: project && projectByKey.has(project) ? project : null,
		};
	}
	function urlFor(next: State): string {
		const params = new URLSearchParams(location.search);
		for (const key of ['view', 'focus', 'project']) params.delete(key);
		if (next.view === 'list') params.set('view', 'list');
		if (next.node) params.set('focus', next.node);
		if (next.view === 'list' && next.project) params.set('project', next.project);
		const query = params.toString();
		return `${location.pathname}${query ? `?${query}` : ''}`;
	}
	/** Move to a new state, record it in the browser history, and render. */
	function go(next: State, options: { replace?: boolean; focusKey?: string } = {}) {
		const changed = next.view !== state.view || next.node !== state.node || next.project !== state.project;
		state = next;
		if (changed || options.replace) {
			if (options.replace) history.replaceState(null, '', urlFor(next));
			else history.pushState(null, '', urlFor(next));
		}
		render(options.focusKey);
	}
	window.addEventListener('popstate', () => {
		state = readUrl();
		render();
	});

	// ================================================================== GRAPH MODE
	type DNode = { id: string; title: string; meta: string; ts: number };
	type DEdge = { from: string; to: string };
	type Display = { nodes: DNode[]; edges: DEdge[]; relTypes: Map<string, string> };

	/** Only records that take part in a declared link are drawn; every other record goes to the list below. */
	function buildDisplay(): Display {
		const relTypes = new Map<string, string>();
		for (const relation of relations) relTypes.set(relation.rel, relation.out);
		const edges = new Map<string, DEdge>();
		const connected = new Set<string>();
		for (const relation of relations) {
			if (hiddenRels.has(relation.rel) || relation.from === relation.to) continue;
			edges.set(`${relation.from}>${relation.to}`, { from: relation.from, to: relation.to });
			connected.add(relation.from);
			connected.add(relation.to);
		}
		const nodes = data.nodes
			.filter((node) => connected.has(node.id))
			.map((node) => ({
				id: node.id,
				title: node.title,
				ts: node.ts,
				meta: [node.kind === 'writing' ? '' : node.kindLabel, node.date, node.project ? (projectByKey.get(node.project)?.title ?? '') : ''].filter(Boolean).join(' · '),
			}));
		return { nodes, edges: [...edges.values()], relTypes };
	}

	// ---- camera (a canvas: the world is a fixed-size board; the visitor pans and zooms it)
	const cam: Cam = { x: 0, y: 0, k: 1 };
	let goal: Cam = { ...cam };
	let fitK = 1;
	let userMoved = false;
	let camTween: number | null = null;
	let board: Board | null = null;
	let built = false;
	let lastFocus: string | null | undefined;
	let restoreCam: Cam | null = null;
	let cardEls = new Map<string, HTMLButtonElement>();
	let drawn: { from: string; to: string; el: SVGPathElement }[] = [];
	let heights = new Map<string, number>();
	let keyboardOpen = false;
	let emptyGraph = false;

	const vsize = () => ({ w: viewport.clientWidth, h: viewport.clientHeight });
	const isNarrow = () => narrowQuery.matches;
	const band = () => bandOf(isNarrow());
	const fitPad = () => (isNarrow() ? 16 : 40);
	const rectOf = (box: { x: number; y: number; w: number; h: number }, c: Cam): Rect => ({ x: c.x + box.x * c.k, y: c.y + box.y * c.k, w: box.w * c.k, h: box.h * c.k });

	function applyCam() {
		world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`;
	}
	/** The whole connected graph, centred, at a readable size; a graph too large for that starts at its top left and is panned. */
	function fitCam(): Cam {
		const { w, h: full } = vsize();
		const h = full - band();
		if (!board) return { x: 0, y: 0, k: 1 };
		const pad = fitPad();
		const raw = Math.min((w - 2 * pad) / board.width, (h - 2 * pad) / board.height);
		fitK = Math.min(FIT_MAX, Math.max(0.05, raw));
		if (raw < FIT_FLOOR) return { k: FIT_FLOOR, x: pad, y: band() + pad };
		const k = Math.min(raw, FIT_MAX);
		return { k, x: (w - board.width * k) / 2, y: band() + (h - board.height * k) / 2 };
	}
	function moveCam(target: Cam, animate: boolean) {
		if (camTween !== null) cancelAnimationFrame(camTween);
		camTween = null;
		goal = { ...target };
		if (!animate || reduceMotion) {
			Object.assign(cam, target);
			applyCam();
			return;
		}
		const from = { ...cam };
		const start = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / MOVE_MS);
			const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
			cam.k = Math.exp(Math.log(from.k) + (Math.log(target.k) - Math.log(from.k)) * e);
			cam.x = from.x + (target.x - from.x) * e;
			cam.y = from.y + (target.y - from.y) * e;
			applyCam();
			camTween = t < 1 ? requestAnimationFrame(step) : null;
		};
		camTween = requestAnimationFrame(step);
	}
	function fitAll(animate: boolean) {
		userMoved = false;
		restoreCam = null;
		moveCam(fitCam(), animate);
	}
	/** The visitor moved the canvas: from now on the camera is theirs. */
	function touchedByUser() {
		userMoved = true;
		restoreCam = null;
	}
	function zoomBy(factor: number, cx?: number, cy?: number) {
		const { w, h } = vsize();
		const px = cx ?? w / 2;
		const py = cy ?? h / 2;
		const k = Math.min(ZOOM_MAX, Math.max(Math.min(fitK, 1) * 0.6, goal.k * factor));
		const f = k / goal.k;
		moveCam({ k, x: px - (px - goal.x) * f, y: py - (py - goal.y) * f }, false);
		touchedByUser();
	}
	function panBy(dx: number, dy: number) {
		moveCam({ k: goal.k, x: goal.x + dx, y: goal.y + dy }, false);
		touchedByUser();
	}
	/** The graph's height follows its content (never a big empty box), within what the screen allows. */
	const maxWorkspaceHeight = () => Math.min(Math.round(window.innerHeight * (isNarrow() ? 0.7 : 0.8)), 820);
	function sizeWorkspace() {
		if (!board) return;
		const minH = isNarrow() ? 440 : 400;
		const want = Math.round(board.height * FIT_MAX + fitPad() * 2 + 24 + band());
		viewport.style.height = `${Math.min(maxWorkspaceHeight(), Math.max(minH, want))}px`;
	}

	// Pointer input: drag to pan, two fingers / ctrl+wheel to pinch, wheel to zoom.
	const pointers = new Map<number, { x: number; y: number }>();
	let dragMoved = 0;
	let pinchDistance = 0;
	viewport.addEventListener('pointerdown', (event) => {
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		dragMoved = 0;
		if (camTween !== null) {
			cancelAnimationFrame(camTween);
			camTween = null;
			goal = { ...cam };
		}
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
		}
		const move = (e: PointerEvent) => {
			const prev = pointers.get(e.pointerId);
			if (!prev) return;
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (pointers.size === 2) {
				const [a, b] = [...pointers.values()];
				const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
				const rect = viewport.getBoundingClientRect();
				if (pinchDistance > 0) zoomBy(d / pinchDistance, (a!.x + b!.x) / 2 - rect.left, (a!.y + b!.y) / 2 - rect.top);
				pinchDistance = d;
				dragMoved += 10;
				return;
			}
			dragMoved += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
			if (dragMoved > 4) {
				viewport.classList.add('is-panning');
				panBy(e.clientX - prev.x, e.clientY - prev.y);
			}
		};
		const up = (e: PointerEvent) => {
			pointers.delete(e.pointerId);
			pinchDistance = 0;
			if (pointers.size === 0) {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
				viewport.classList.remove('is-panning');
			}
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
	});
	// A drag that started on a card must not also click it.
	viewport.addEventListener(
		'click',
		(event) => {
			if (dragMoved > 4) {
				event.stopPropagation();
				event.preventDefault();
				dragMoved = 0;
			}
		},
		true,
	);
	viewport.addEventListener(
		'wheel',
		(event) => {
			event.preventDefault();
			const rect = viewport.getBoundingClientRect();
			zoomBy(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)), event.clientX - rect.left, event.clientY - rect.top);
		},
		{ passive: false },
	);
	viewport.addEventListener('keydown', (event) => {
		if (event.target !== viewport) return;
		const keys: Record<string, () => void> = {
			'+': () => zoomBy(1.25),
			'=': () => zoomBy(1.25),
			'-': () => zoomBy(0.8),
			'0': resetView,
			ArrowLeft: () => panBy(60, 0),
			ArrowRight: () => panBy(-60, 0),
			ArrowUp: () => panBy(0, 60),
			ArrowDown: () => panBy(0, -60),
		};
		const handler = keys[event.key];
		if (handler) {
			event.preventDefault();
			handler();
		}
	});
	// Keyboard focus on a card brings it into view.
	viewport.addEventListener('focusin', (event) => {
		const el = (event.target as HTMLElement).closest<HTMLElement>('.kg-gnode');
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const area = viewport.getBoundingClientRect();
		const margin = 24;
		if (rect.left < area.left + margin || rect.right > area.right - margin || rect.top < area.top + margin || rect.bottom > area.bottom - margin) {
			panBy(area.left + area.width / 2 - (rect.left + rect.width / 2), area.top + area.height / 2 - (rect.top + rect.height / 2));
		}
	});
	/** Reset: no selection, whole graph in view. */
	function resetView() {
		if (state.node) go({ view: 'graph', node: null, project: null });
		fitAll(true);
	}
	for (const button of root.querySelectorAll<HTMLButtonElement>('[data-kg-zoom]')) {
		button.addEventListener('click', () => {
			const action = button.dataset.kgZoom;
			if (action === 'in') zoomBy(1.3);
			else if (action === 'out') zoomBy(1 / 1.3);
			else resetView();
		});
	}

	// ---- building the graph (only when the set of drawn records changes, never on a selection)
	function buildGraph() {
		const display = buildDisplay();
		renderFilters(display);
		world.replaceChildren();
		cardEls = new Map();
		drawn = [];
		board = null;
		built = true;
		const empty = display.nodes.length === 0;
		q('[data-kg-empty]').hidden = !empty;
		emptyGraph = empty;
		zoomBox.hidden = empty;
		if (empty) {
			viewport.style.height = isNarrow() ? '16rem' : '14rem';
			return;
		}

		// Cards are created at their final width so the real heights can be measured, then laid out.
		for (const node of display.nodes) {
			const button = h('button', 'kg-node kg-gnode');
			button.type = 'button';
			button.dataset.id = node.id;
			button.style.width = `${CARD_W}px`;
			button.append(h('span', 'kg-node-title', node.title), h('span', 'kg-node-meta', node.meta));
			world.append(button);
			cardEls.set(node.id, button);
		}
		heights = new Map([...cardEls].map(([id, el]) => [id, el.offsetHeight]));
		// Separate groups wrap into rows; try a few row widths and keep the one that shows the whole graph largest in this workspace.
		const pad = fitPad();
		const { w: vw } = vsize();
		const layoutNodes = display.nodes.map((node) => ({ id: node.id, ts: node.ts, h: heights.get(node.id)! }));
		let bestK = -1;
		for (let width = 2 * CARD_W + GAP_X; width < 8000; width = Math.round(width * 1.25)) {
			const candidate = layoutBoard(layoutNodes, display.edges, { maxWidth: width });
			const k = Math.min(FIT_MAX, (vw - 2 * pad) / candidate.width, (maxWorkspaceHeight() - band() - 2 * pad) / candidate.height);
			if (k > bestK + 1e-6) {
				board = candidate;
				bestK = k;
			}
			if (candidate.width < width) break;
		}
		board = board!;
		world.style.width = `${board.width}px`;
		world.style.height = `${board.height}px`;
		sizeWorkspace();
		const dense = display.edges.length > MAX_EDGES;
		world.classList.toggle('kg-board--dense', dense);

		// Reading order for the keyboard: left to right, top to bottom.
		const order = [...board.placed].sort((a, b) => a[1].x - b[1].x || a[1].y - b[1].y);
		for (const [id, box] of order) {
			const el = cardEls.get(id)!;
			el.style.left = `${box.x}px`;
			el.style.top = `${box.y}px`;
			world.append(el);
		}

		// Edges: each starts on the source card's right border and ends on the target card's left border (arrow tip).
		const edgeLayer = svg('svg', { class: 'kg-edges', width: String(board.width), height: String(board.height), viewBox: `0 0 ${board.width} ${board.height}`, 'aria-hidden': 'true' });
		const defs = svg('defs');
		const marker = svg('marker', { id: 'kg-arrow', viewBox: '0 0 8 8', refX: '8', refY: '4', markerWidth: '8', markerHeight: '8', orient: 'auto' });
		marker.append(svg('path', { d: 'M0 0 L8 4 L0 8 z', class: 'kg-arrow-head' }));
		defs.append(marker);
		edgeLayer.append(defs);
		world.prepend(edgeLayer);
		for (const edge of board.edges) {
			const path = svg('path', { d: edge.d, class: 'kg-edge', 'marker-end': 'url(#kg-arrow)' });
			path.dataset.from = edge.from;
			path.dataset.to = edge.to;
			edgeLayer.append(path);
			drawn.push({ from: edge.from, to: edge.to, el: path });
		}
	}
	world.addEventListener('click', (event) => {
		const el = (event.target as HTMLElement).closest<HTMLElement>('.kg-gnode');
		if (!el) return;
		// detail 0 = activated from the keyboard: focus moves into the inspector.
		keyboardOpen = (event as MouseEvent).detail === 0;
		go({ view: 'graph', node: state.node === el.dataset.id ? null : el.dataset.id!, project: null });
	});

	function renderFilters(display: Display) {
		filtersBox.replaceChildren();
		if (display.relTypes.size < 2) {
			filtersBox.hidden = true;
			return;
		}
		filtersBox.hidden = false;
		filtersBox.append(h('span', 'kg-filter-label', S['graph.rel.filter']));
		for (const [rel, verb] of display.relTypes) {
			const chip = h('button', 'kg-chip', verb);
			chip.type = 'button';
			chip.setAttribute('aria-pressed', String(!hiddenRels.has(rel)));
			chip.addEventListener('click', () => {
				if (hiddenRels.has(rel)) hiddenRels.delete(rel);
				else hiddenRels.add(rel);
				built = false;
				userMoved = false;
				render();
			});
			filtersBox.append(chip);
		}
	}

	/** Focus: highlight the selection's direct links; everything else goes quiet. Never changes layout or direction. */
	function applyFocus() {
		const id = state.node && cardEls.has(state.node) ? state.node : null;
		const neighbours = new Set<string>();
		if (id) for (const edge of drawn) {
			if (edge.from === id) neighbours.add(edge.to);
			if (edge.to === id) neighbours.add(edge.from);
		}
		for (const [cardId, el] of cardEls) {
			el.classList.toggle('is-selected', cardId === id);
			el.classList.toggle('is-neighbour', neighbours.has(cardId));
			el.classList.toggle('is-dim', id !== null && cardId !== id && !neighbours.has(cardId));
			if (cardId === id) el.setAttribute('aria-current', 'true');
			else el.removeAttribute('aria-current');
		}
		for (const edge of drawn) {
			const incident = id !== null && (edge.from === id || edge.to === id);
			edge.el.classList.toggle('is-active', incident);
			edge.el.classList.toggle('is-quiet', id !== null && !incident);
		}
	}

	// ---- the floating inspector
	function renderDetail() {
		detail.replaceChildren();
		const id = state.node;
		if (!id || state.view !== 'graph') {
			detail.hidden = true;
			return;
		}
		const node = nodeById.get(id)!;
		detail.hidden = false;
		detail.setAttribute('aria-labelledby', 'kg-detail-title');
		const head = h('div', 'kg-detail-head');
		head.append(h('p', 'kg-eyebrow', `${node.kindLabel} · ${node.date}`));
		const clear = h('button', 'kg-clear', `× ${S['graph.clear']}`);
		clear.type = 'button';
		clear.addEventListener('click', () => go({ view: 'graph', node: null, project: null }));
		head.append(clear);
		const title = h('h2', 'kg-card-title', node.title);
		title.id = 'kg-detail-title';
		detail.append(head, title);
		if (node.summary) detail.append(h('p', 'kg-summary', node.summary));

		const open = h('a', 'kg-open', `${S['graph.open']} →`);
		open.href = node.href;
		if (node.external) open.rel = 'noopener noreferrer';
		const openRow = h('p', 'kg-open-row');
		openRow.append(open);
		if (node.host) openRow.append(h('span', 'kg-meta', node.host));
		detail.append(openRow);
		if (node.hrefNote) detail.append(h('p', 'kg-note', node.hrefNote));
		if (node.project) {
			const source = h('dl', 'kg-source');
			source.append(h('dt', undefined, S['graph.source.project']), h('dd', undefined, projectByKey.get(node.project)?.title ?? node.project));
			detail.append(source);
		}

		const links = relationsOf(id);
		detail.append(h('h3', 'kg-side-title', S['graph.detail.links']));
		if (links.length === 0) detail.append(h('p', 'kg-empty', S['graph.links.none']));
		else {
			const ul = h('ul', 'kg-link-rows');
			for (const relation of links) {
				const li = h('li', 'kg-link-row');
				const from = nodeById.get(relation.from)!;
				const to = nodeById.get(relation.to)!;
				// Always from → to, exactly as stored; the selection only decides which end is plain text.
				const end = (other: NodeData) => {
					if (other.id === id) return h('strong', 'kg-link-self', other.title);
					const button = h('button', 'kg-rel', other.title);
					button.type = 'button';
					button.addEventListener('click', () => go({ view: state.view, node: other.id, project: null }));
					return button;
				};
				li.append(end(from), h('span', 'kg-link-arrow', ' → '), end(to));
				ul.append(li);
			}
			detail.append(ul);
		}
	}

	/**
	 * Frame some cards inside an area of the workspace (screen pixels). If they cannot all fit at a readable size,
	 * the first one (the selection) is framed alone and its neighbours are left to a pan. Null: nothing to frame.
	 */
	function frame(ids: string[], area: Rect, maxK: number): Cam | null {
		const boxesOf = (list: string[]) => list.map((id) => board?.placed.get(id)).filter((box): box is NonNullable<typeof box> => Boolean(box));
		const fit = (boxes: ReturnType<typeof boxesOf>, cap: number, floor: number): Cam | null => {
			if (boxes.length === 0) return null;
			const x0 = Math.min(...boxes.map((b) => b.x));
			const y0 = Math.min(...boxes.map((b) => b.y));
			const x1 = Math.max(...boxes.map((b) => b.x + b.w));
			const y1 = Math.max(...boxes.map((b) => b.y + b.h));
			const m = 24;
			const k = Math.min(cap, Math.max(floor, Math.min((area.w - 2 * m) / (x1 - x0), (area.h - 2 * m) / (y1 - y0))));
			return { k, x: area.x + (area.w - (x1 - x0) * k) / 2 - x0 * k, y: area.y + (area.h - (y1 - y0) * k) / 2 - y0 * k };
		};
		const all = fit(boxesOf(ids), maxK, 0);
		const floor = focusFloor(fitK);
		if (all && all.k >= floor) return all;
		return fit(boxesOf(ids.slice(0, 1)), Math.max(floor, Math.min(maxK, 1.2)), floor);
	}
	const within = (rects: Rect[], area: Rect, margin = 8) => rects.every((r) => r.x >= area.x + margin - 0.5 && r.y >= area.y + margin - 0.5 && r.x + r.w <= area.x + area.w - margin + 0.5 && r.y + r.h <= area.y + area.h - margin + 0.5);
	function clusterIds(): string[] {
		const id = state.node;
		if (!id || !cardEls.has(id)) return [];
		const ids = new Set([id]);
		for (const edge of drawn) {
			if (edge.from === id) ids.add(edge.to);
			if (edge.to === id) ids.add(edge.from);
		}
		return [...ids];
	}
	/** The camera moves for a selection only when it has to: the selection and its neighbours must stay in view, clear of the inspector. */
	function adjustCamera(next: Cam | null, animate: boolean) {
		if (!next) return;
		if (!restoreCam) restoreCam = { ...goal };
		moveCam(next, animate);
	}
	function placeInspector(animate: boolean) {
		if (state.view !== 'graph' || detail.hidden || !state.node) return;
		const { w, h: full } = vsize();
		const h = full;
		// The controls (top right) and zoom (bottom right) are not free space for the panel.
		const origin = stage.getBoundingClientRect();
		const chrome = [...controlsBox.children, zoomBox].filter((el) => !(el as HTMLElement).hidden).map((el) => {
			const r = el.getBoundingClientRect();
			return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
		});
		const below = { x: 0, y: band(), w, h: full - band() };
		const size = { w: detail.offsetWidth, h: detail.offsetHeight };
		const box = board?.placed.get(state.node);
		if (!board || !box) {
			// A record with no declared link (reached through search or a link) has no card to sit beside: use a free corner.
			if (isNarrow()) {
				detail.style.left = '';
				detail.style.top = '';
				return;
			}
			const corner = (c: Cam) => placeAtCorner(size, { w, h }, [...(board ? [...board.placed.values()].map((b) => rectOf(b, c)) : []), ...chrome]);
			let spot = corner(goal);
			if (!spot.clear && board) {
				// Every corner is taken: slide the whole graph aside, as far as it still fits readably.
				const area = { x: 0, y: band(), w: w - size.w - 28, h: full - band() };
				adjustCamera(frame([...board.placed.keys()], area, restoreCam?.k ?? goal.k), animate);
				spot = placeAtCorner(size, { w, h }, chrome, 12);
			}
			detail.style.left = `${spot.x}px`;
			detail.style.top = `${spot.y}px`;
			return;
		}
		const ids = clusterIds();
		const rects = (c: Cam) => ids.map((id) => rectOf(board!.placed.get(id)!, c));
		if (isNarrow()) {
			// Bottom sheet (CSS): keep the selection and its neighbours in the part of the workspace above it.
			detail.style.left = '';
			detail.style.top = '';
			const area = { x: 0, y: band(), w, h: Math.max(120, full - size.h - 8 - band()) };
			if (!within(rects(goal), area)) adjustCamera(frame(ids, area, restoreCam?.k ?? goal.k), animate);
			return;
		}
		const everyCard = () => [...board!.placed.values()];
		const spotFor = (c: Cam) => placeFloating(rectOf(box, c), size, { w, h }, [...everyCard().map((b) => rectOf(b, c)), ...chrome]);
		let spot = spotFor(goal);
		if (!spot.clear || !within(rects(goal), below)) {
			// No free place beside the card: move the camera so the card and its neighbours sit on one side, the panel on the other.
			const panel = size.w + 28;
			// The panel goes on the side with fewer neighbours (ties: away from the screen centre).
			const sideCount = (sign: number) => ids.filter((id) => id !== state.node && Math.sign(board!.placed.get(id)!.x - box.x) === sign).length;
			const [left, right] = [sideCount(-1), sideCount(1)];
			const panelLeft = left === right ? rectOf(box, goal).x + rectOf(box, goal).w / 2 > w / 2 : right > left;
			const area = panelLeft ? { x: panel, y: band(), w: w - panel, h: full - band() } : { x: 0, y: band(), w: w - panel, h: full - band() };
			const next = frame(ids, area, restoreCam?.k ?? goal.k);
			adjustCamera(next, animate);
			const at = next ?? goal;
			// After the move only the selection and its neighbours matter; other cards may sit behind the panel.
			spot = placeFloating(rectOf(box, at), size, { w, h }, [...rects(at), ...chrome]);
			if (!spot.clear) {
				const anchor = rectOf(box, at);
				spot = { side: panelLeft ? 'left' : 'right', clear: true, x: panelLeft ? 12 : Math.max(12, w - size.w - 12), y: Math.min(Math.max(band(), anchor.y + anchor.h / 2 - size.h / 2), Math.max(band(), h - size.h - 12)) };
			}
		}
		detail.style.left = `${spot.x}px`;
		detail.style.top = `${spot.y}px`;
	}
	/** Leaving the selection puts the camera back where the visitor had it, if only the selection moved it. */
	function closeInspector(animate: boolean) {
		if (restoreCam) moveCam(restoreCam, animate);
		restoreCam = null;
	}

	// ================================================================== LIST MODE (secondary)
	type Link = { other: NodeData; verb: string };
	const linksOf = new Map<string, Link[]>();
	for (const relation of relations) {
		const from = nodeById.get(relation.from)!;
		const to = nodeById.get(relation.to)!;
		linksOf.set(from.id, [...(linksOf.get(from.id) ?? []), { other: to, verb: '→' }]);
		linksOf.set(to.id, [...(linksOf.get(to.id) ?? []), { other: from, verb: '←' }]);
	}
	function nodeButton(key: string, title: string, meta: string, cls: string, onClick: () => void): HTMLButtonElement {
		const button = h('button', `kg-node ${cls}`);
		button.type = 'button';
		button.dataset.key = key;
		button.append(h('span', 'kg-node-title', title), h('span', 'kg-node-meta', meta));
		button.addEventListener('click', onClick);
		return button;
	}
	const openListNode = (node: NodeData) => go({ view: 'list', project: node.project, node: node.id }, { focusKey: node.project ? `n:${node.id}` : 'focus' });

	function listOverview(): HTMLElement {
		const wrap = h('div', 'kg-overview');
		const visible = showAll ? data.projects : data.projects.slice(0, ENTRY_LIMIT);
		const entries = h('ul', 'kg-entries');
		for (const project of visible) {
			const li = h('li');
			const meta = `${fill(S['graph.articles.count']!, { n: project.count })} · ${project.first === project.last ? project.first : `${project.first} – ${project.last}`}`;
			const button = nodeButton(`p:${project.key}`, project.title, meta, 'kg-node--project', () => go({ view: 'list', project: project.key, node: null }, { focusKey: `p:${project.key}` }));
			button.append(h('span', 'kg-node-open', S['graph.expand-hint']));
			li.append(button);
			entries.append(li);
		}
		wrap.append(entries);
		if (data.projects.length > ENTRY_LIMIT) {
			const more = h('button', 'kg-more', showAll ? S['graph.less'] : fill(S['graph.more']!, { n: data.projects.length - ENTRY_LIMIT }));
			more.type = 'button';
			more.addEventListener('click', () => {
				showAll = !showAll;
				render();
			});
			wrap.append(more);
		}
		const loose = data.nodes.filter((node) => node.kind === 'writing' && !node.project).length;
		const other = data.nodes.filter((node) => node.kind !== 'writing').length;
		wrap.append(h('p', 'kg-unlisted', fill(S['graph.unlisted']!, { a: loose, b: other })));
		return wrap;
	}
	function listRail(): HTMLElement {
		const nav = h('nav', 'kg-rail');
		const rootButton = h('button', 'kg-rail-item kg-rail-item--root', `← ${S['graph.root']}`);
		rootButton.type = 'button';
		rootButton.addEventListener('click', () => go({ view: 'list', project: null, node: null }));
		nav.append(rootButton);
		const others = data.projects.filter((project) => project.key !== state.project).slice(0, ENTRY_LIMIT);
		if (others.length > 0) {
			nav.append(h('h3', 'kg-rail-title', S['graph.other-projects']));
			const ul = h('ul', 'kg-rail-list');
			for (const project of others) {
				const li = h('li');
				const button = h('button', 'kg-rail-item', project.title);
				button.type = 'button';
				button.dataset.key = `p:${project.key}`;
				button.addEventListener('click', () => go({ view: 'list', project: project.key, node: null }, { focusKey: `p:${project.key}` }));
				li.append(button);
				ul.append(li);
			}
			nav.append(ul);
		}
		return nav;
	}
	function listCard(node: NodeData): HTMLElement {
		const card = h('article', 'kg-card');
		card.dataset.key = 'focus';
		card.append(h('p', 'kg-eyebrow', `${node.kindLabel} · ${node.date}`), h('h2', 'kg-card-title', node.title));
		if (node.summary) card.append(h('p', 'kg-summary', node.summary));
		const open = h('a', 'kg-open', `${S['graph.open']} →`);
		open.href = node.href;
		if (node.external) open.rel = 'noopener noreferrer';
		card.append(open);
		if (node.hrefNote) card.append(h('p', 'kg-note', node.hrefNote));
		return card;
	}
	function listLinks(node: NodeData): HTMLElement {
		const section = h('section', 'kg-links');
		section.append(h('h3', 'kg-side-title', S['graph.links']));
		const links = [...(linksOf.get(node.id) ?? [])].sort((a, b) => a.verb.localeCompare(b.verb) || a.other.title.localeCompare(b.other.title));
		if (links.length === 0) {
			section.append(h('p', 'kg-empty', S['graph.links.none']));
			return section;
		}
		const ul = h('ul', 'kg-link-list');
		for (const link of links) {
			const li = h('li');
			li.append(h('span', 'kg-verb', link.verb), nodeButton(`r:${link.other.id}`, link.other.title, `${link.other.kindLabel} · ${link.other.date}`, 'kg-node--article', () => openListNode(link.other)));
			ul.append(li);
		}
		section.append(ul);
		return section;
	}
	function listConcepts(): HTMLElement {
		const section = h('section', 'kg-concepts');
		section.append(h('h3', 'kg-side-title', S['graph.concepts']), h('p', 'kg-empty', S['graph.concepts.empty']));
		return section;
	}
	function listProject(): HTMLElement {
		const project = projectByKey.get(state.project!)!;
		const members = membersOf.get(project.key) ?? [];
		const layout = h('div', 'kg-layout');
		layout.append(listRail());
		const main = h('div', 'kg-main');
		main.append(nodeButton(`p:${project.key}`, project.title, fill(S['graph.articles.count']!, { n: project.count }), 'kg-node--project kg-node--head' + (state.node ? '' : ' is-selected'), () => go({ view: 'list', project: project.key, node: null })));
		const ol = h('ol', 'kg-articles');
		for (const member of members) {
			const li = h('li');
			const selected = state.node === member.id;
			const button = nodeButton(`n:${member.id}`, member.title, `${member.kindLabel} · ${member.date}`, 'kg-node--article' + (selected ? ' is-selected' : state.node ? ' is-dim' : ''), () => openListNode(member));
			if (selected) button.setAttribute('aria-current', 'true');
			li.append(button);
			ol.append(li);
		}
		main.append(ol);
		layout.append(main);
		const side = h('aside', 'kg-side');
		const selectedNode = state.node ? nodeById.get(state.node) : null;
		if (selectedNode) side.append(listCard(selectedNode), listLinks(selectedNode));
		side.append(listConcepts());
		layout.append(side);
		return layout;
	}
	function listNode(): HTMLElement {
		const node = nodeById.get(state.node!)!;
		const layout = h('div', 'kg-layout kg-layout--node');
		layout.append(listRail());
		const main = h('div', 'kg-main');
		main.append(listCard(node));
		layout.append(main);
		const side = h('aside', 'kg-side');
		side.append(listLinks(node), listConcepts());
		layout.append(side);
		return layout;
	}
	function renderCrumbs() {
		crumbs.replaceChildren();
		const trail: { label: string; to: State }[] = [{ label: S['graph.root']!, to: { view: 'list', project: null, node: null } }];
		if (state.project && projectByKey.has(state.project)) trail.push({ label: projectByKey.get(state.project)!.title, to: { view: 'list', project: state.project, node: null } });
		if (state.node && nodeById.has(state.node)) trail.push({ label: nodeById.get(state.node)!.title, to: state });
		trail.forEach((item, index) => {
			const last = index === trail.length - 1;
			if (index > 0) crumbs.append(h('span', 'kg-sep', '›'));
			if (last) {
				const current = h('span', 'kg-crumb is-current', item.label);
				current.setAttribute('aria-current', 'page');
				crumbs.append(current);
			} else {
				const button = h('button', 'kg-crumb', item.label);
				button.type = 'button';
				button.addEventListener('click', () => go(item.to));
				crumbs.append(button);
			}
		});
	}
	function measureList(): Map<string, DOMRect> {
		const rects = new Map<string, DOMRect>();
		for (const el of listBody.querySelectorAll<HTMLElement>('[data-key]')) rects.set(el.dataset.key!, el.getBoundingClientRect());
		return rects;
	}
	function renderList(focusKey?: string) {
		const before = measureList();
		const view = state.node && !(state.project && projectByKey.has(state.project)) ? listNode() : state.project ? listProject() : listOverview();
		listBody.replaceChildren(view);
		renderCrumbs();
		if (!reduceMotion) {
			const settled = [...listBody.querySelectorAll<HTMLElement>('[data-key]')].map((el) => [el, el.getBoundingClientRect()] as const);
			for (const [el, now] of settled) {
				const old = before.get(el.dataset.key!);
				if (old) {
					const dx = old.left - now.left;
					const dy = old.top - now.top;
					if (Math.abs(dx) + Math.abs(dy) > 2) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: MOVE_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
				} else el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
			}
		}
		if (focusKey) listBody.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
	}

	// ================================================================== shared render
	function render(focusKey?: string) {
		const isGraph = state.view === 'graph';
		viewport.hidden = !isGraph;
		listMap.hidden = isGraph;
		crumbs.hidden = isGraph;
		zoomBox.hidden = !isGraph || emptyGraph;
		stage.style.height = isGraph ? '' : `${maxWorkspaceHeight()}px`;
		for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.kgMode === state.view));
		if (isGraph) {
			const rebuilt = !built;
			if (rebuilt) {
				buildGraph();
				if (!userMoved) fitAll(false);
			}
			applyFocus();
			renderDetail();
			if (state.node !== lastFocus || rebuilt) {
				const before = lastFocus;
				const first = lastFocus === undefined;
				lastFocus = state.node;
				if (state.node) {
					placeInspector(!first && !rebuilt);
					if (keyboardOpen) detail.focus({ preventScroll: true });
					if (!cardEls.has(state.node)) stage.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
				} else if (before) closeInspector(true);
			}
			keyboardOpen = false;
			live.textContent = state.node ? fill(S['graph.announce.node']!, { title: nodeById.get(state.node)!.title, n: relationsOf(state.node).length }) : S['graph.announce.overview']!;
		} else {
			filtersBox.hidden = true;
			detail.hidden = true;
			lastFocus = undefined;
			closeInspector(false);
			renderList(focusKey);
			live.textContent = state.node ? nodeById.get(state.node)!.title : S['graph.announce.overview']!;
		}
	}

	for (const button of modeButtons) button.addEventListener('click', () => go({ view: button.dataset.kgMode as View, node: null, project: null }));

	// The world does not depend on the container width, so a resize only moves the camera (and the inspector).
	let lastSize = '';
	new ResizeObserver(() => {
		if (state.view !== 'graph' || !board) return;
		const w = viewport.clientWidth;
		const h = viewport.clientHeight;
		const size = `${w}x${h}`;
		if (size === lastSize) return;
		const [pw, ph] = lastSize ? lastSize.split('x').map(Number) : [w, h];
		lastSize = size;
		if (userMoved) moveCam({ k: goal.k, x: goal.x + (w - pw!) / 2, y: goal.y + (h - ph!) / 2 }, false);
		else if (!state.node) fitAll(false);
		placeInspector(false);
	}).observe(viewport);
	let resizeFrame = 0;
	const onViewportChange = () => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(() => {
			if (state.view !== 'graph') return;
			sizeWorkspace();
			placeInspector(false);
		});
	};
	window.addEventListener('resize', onViewportChange);
	narrowQuery.addEventListener('change', onViewportChange);
	// Late web fonts change card heights: if any did, the board is laid out once more.
	void document.fonts?.ready.then(() => {
		if (state.view !== 'graph' || !built || !board) return;
		if ([...cardEls].some(([id, el]) => el.offsetHeight !== heights.get(id))) {
			built = false;
			render();
		}
	});

	// ------------------------------------------------------------ search (every record, linked or not)
	let results: NodeData[] = [];
	let active = -1;
	function runSearch() {
		const query = searchInput.value.trim().toLowerCase();
		searchList.replaceChildren();
		active = -1;
		results = query ? data.nodes.filter((node) => node.haystack.includes(query)).slice(0, 8) : [];
		searchInput.setAttribute('aria-expanded', String(query.length > 0));
		if (!query) return;
		if (results.length === 0) {
			searchList.append(Object.assign(h('li', 'kg-result kg-result--none'), { textContent: S['graph.search.none'] }));
			return;
		}
		results.forEach((node, index) => {
			const li = h('li', 'kg-result');
			li.id = `kg-result-${index}`;
			li.setAttribute('role', 'option');
			li.append(h('span', undefined, node.title), h('span', 'kg-meta', `${node.kindLabel} · ${node.date}`));
			li.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				choose(node);
			});
			searchList.append(li);
		});
	}
	function choose(node: NodeData) {
		searchInput.value = '';
		runSearch();
		if (state.view === 'list') openListNode(node);
		else go({ view: 'graph', node: node.id, project: null });
	}
	function setActive(next: number) {
		active = next;
		[...searchList.children].forEach((child, index) => child.classList.toggle('is-active', index === active));
		searchInput.setAttribute('aria-activedescendant', active >= 0 ? `kg-result-${active}` : '');
	}
	searchInput.addEventListener('input', runSearch);
	searchInput.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActive(Math.min(results.length - 1, active + 1));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActive(Math.max(0, active - 1));
		} else if (event.key === 'Enter' && results.length > 0) {
			event.preventDefault();
			choose(results[Math.max(0, active)]!);
		} else if (event.key === 'Escape') {
			searchInput.value = '';
			runSearch();
		}
	});
	// Escape closes the inspector (anywhere on the page), or steps back one level in the list view.
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape' || event.defaultPrevented || event.target === searchInput) return;
		if (state.view === 'graph' && state.node) {
			const previous = state.node;
			const hadFocus = detail.contains(document.activeElement);
			go({ view: 'graph', node: null, project: null });
			if (hadFocus) cardEls.get(previous)?.focus({ preventScroll: true });
		} else if (!root.contains(document.activeElement)) return;
		else if (state.view === 'list' && state.node) go({ view: 'list', project: state.project, node: null });
		else if (state.view === 'list' && state.project) go({ view: 'list', project: null, node: null });
	});
	// A click outside the inspector, the cards and the controls closes it (a drag on the canvas does not count as a click).
	document.addEventListener('click', (event) => {
		if (state.view !== 'graph' || !state.node) return;
		const target = event.target as Element | null;
		if (!target?.isConnected || target.closest('.kg-detail, .kg-gnode, .kg-zoom, .kg-controls, .kg-chip')) return;
		go({ view: 'graph', node: null, project: null });
	});

	// ------------------------------------------------------------ start
	state = readUrl();
	render();

	// Test/measurement hook (?bench): lives in its own module, fetched only when asked for.
	if (new URLSearchParams(location.search).has('bench')) {
		void import('./graph-bench').then((bench) =>
			bench.install({
				go: (next) => go({ view: 'graph', node: null, project: null, ...next }, { replace: true }),
				settle: () => {
					if (camTween !== null) cancelAnimationFrame(camTween);
					camTween = null;
					Object.assign(cam, goal);
					applyCam();
				},
				camera: () => ({ ...cam, goal: { ...goal }, fitK }),
				world,
				viewport,
				detail,
			}),
		);
	}
}

const kgRoot = document.querySelector<HTMLElement>('[data-kg]');
if (kgRoot) {
	const data = JSON.parse(kgRoot.querySelector('[data-kg-data]')!.textContent!) as GraphData;
	const params = new URLSearchParams(location.search);
	if (params.has('bench') && params.has('synthetic')) {
		// ?bench&synthetic=N: N invented records and links, for stress tests (never shipped data).
		const count = Number.parseInt(params.get('synthetic') ?? '', 10);
		void import('./graph-bench').then((bench) => init(kgRoot, bench.withSyntheticGraph(data, Number.isNaN(count) ? 49 : count)));
	} else init(kgRoot, data);
}
