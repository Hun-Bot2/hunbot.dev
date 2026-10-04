// Interaction layer for the Living Atlas. The page works without this file:
// the default view renders fully and every mark is a link. With it:
//
// - the Y axis label becomes a selector (`?y=<axis>`): every offered axis is
//   already rendered at build time as its own view, so switching only shows
//   one and hides the others — no layout work, no data fetch;
// - click / Enter on a mark selects it and opens the inspector; activating
//   the selected mark again follows its link (modified clicks always follow);
// - the selection survives switching axes (it is mirrored on every view);
// - the selection's lineage (declared/verified relations, depth ≤ 4) is
//   highlighted and everything else dims, only when a lineage exists;
// - in 'on-demand' edge mode, arcs appear for the hovered/selected artifact;
// - arrow keys move between marks of the visible view (one tab stop for the
//   chart), Esc clears;
// - the selection is mirrored to ?focus=<id> so it can be shared and survives reloads.
//
// All text is written with textContent; nothing from the data is parsed as HTML.

import { getLineage, type RelationLike } from '../../utils/atlas/lineage';

type Item = {
	id: string;
	kind: string;
	domain: string;
	title: string;
	summary: string | null;
	time: string;
	href: string;
	onlyIn: string | null;
	topics: string[];
};

type AtlasData = {
	items: Record<string, Item>;
	relations: RelationLike[];
	axes: Record<string, string>;
	strings: Record<string, string>;
};

type View = {
	id: string;
	element: HTMLElement;
	/** Anchors per lane, in lane order, for arrow-key navigation. */
	lanes: HTMLAnchorElement[][];
	anchors: HTMLAnchorElement[];
};

export function initAtlas(root: HTMLElement): void {
	const dataElement = root.querySelector('#atlas-data');
	if (!dataElement?.textContent) return;
	const data = JSON.parse(dataElement.textContent) as AtlasData;

	const inspector = root.querySelector<HTMLElement>('[data-atlas-inspector]')!;
	const live = root.querySelector<HTMLElement>('[data-atlas-live]')!;
	const slot = (name: string) => inspector.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

	const views: View[] = [...root.querySelectorAll<HTMLElement>('[data-atlas-view]')].map((element) => {
		const lanes = [...element.querySelectorAll<HTMLOListElement>('.atlas-marks')].map((list) => [
			...list.querySelectorAll<HTMLAnchorElement>('a[data-artifact-id]'),
		]);
		return { id: element.dataset.atlasView!, element, lanes, anchors: lanes.flat() };
	});
	if (views.length === 0) return;
	let active = views.find((view) => !view.element.hidden) ?? views[0];

	// An artifact can have a mark in every view (and in several lanes of one).
	const anchorsById = new Map<string, HTMLAnchorElement[]>();
	for (const anchor of views.flatMap((view) => view.anchors)) {
		const id = anchor.dataset.artifactId!;
		anchorsById.set(id, [...(anchorsById.get(id) ?? []), anchor]);
	}
	const arcs = [...root.querySelectorAll<SVGPathElement>('.atlas-arc')];
	const anchorIn = (view: View, id: string) => view.anchors.find((anchor) => anchor.dataset.artifactId === id);
	const idOf = (target: EventTarget | null) =>
		(target as Element | null)?.closest<HTMLAnchorElement>('a[data-artifact-id]')?.dataset.artifactId ?? null;

	let selected: string | null = null;

	// One tab stop for the whole visible chart; arrows move within it.
	const setTabStop = (anchor: HTMLAnchorElement | undefined) => {
		for (const view of views) for (const other of view.anchors) other.tabIndex = other === anchor ? 0 : -1;
	};
	const resetTabStop = () => setTabStop((selected && anchorIn(active, selected)) || active.anchors[0]);

	const setHovered = (id: string | null) => {
		for (const arc of arcs) {
			arc.toggleAttribute('data-hover', id !== null && (arc.dataset.from === id || arc.dataset.to === id));
		}
	};

	const select = (id: string, options: { focus?: boolean; announce?: boolean } = {}) => {
		const item = data.items[id];
		if (!item || !anchorsById.has(id)) return;
		selected = id;

		const lineage = getLineage(data.relations, id);
		const inLineage = new Set([...lineage.upstream, ...lineage.downstream]);
		root.toggleAttribute('data-lineage-active', inLineage.size > 0);
		for (const [otherId, anchors] of anchorsById) {
			for (const other of anchors) {
				const mark = other.parentElement!;
				mark.toggleAttribute('data-selected', otherId === id);
				mark.toggleAttribute('data-in-lineage', otherId === id || inLineage.has(otherId));
				if (otherId === id) other.setAttribute('aria-current', 'true');
				else other.removeAttribute('aria-current');
			}
		}
		for (const arc of arcs) arc.toggleAttribute('data-active', lineage.relations.has(arc.dataset.key!));

		fillInspector(item);
		inspector.hidden = false;
		const anchor = anchorIn(active, id);
		setTabStop(anchor);
		if (options.focus) anchor?.focus();
		if (options.announce !== false) live.textContent = `${item.title}, ${item.kind}, ${item.domain}, ${item.time}`;
		writeParams({ focus: id });
	};

	const clear = () => {
		if (selected === null) return;
		const anchor = anchorIn(active, selected);
		selected = null;
		root.removeAttribute('data-lineage-active');
		for (const anchors of anchorsById.values()) {
			for (const other of anchors) {
				other.parentElement!.removeAttribute('data-selected');
				other.parentElement!.removeAttribute('data-in-lineage');
				other.removeAttribute('aria-current');
			}
		}
		for (const arc of arcs) arc.removeAttribute('data-active');
		inspector.hidden = true;
		live.textContent = '';
		writeParams({ focus: null });
		anchor?.focus();
	};

	const fillInspector = (item: Item) => {
		slot('eyebrow').textContent = `${item.kind} · ${item.domain} · ${item.time}`;
		slot('title').textContent = item.title;
		slot('summary').textContent = item.summary ?? '';
		slot('summary').hidden = !item.summary;

		const topics = slot('topics');
		topics.replaceChildren(...item.topics.map((topic) => element('span', 'chip', topic)));
		topics.hidden = item.topics.length === 0;

		const links = slot('links');
		const groups = new Map<string, string[]>();
		for (const relation of data.relations) {
			if (relation.from === item.id) push(groups, `${relation.rel}.out`, relation.to);
			if (relation.to === item.id) push(groups, `${relation.rel}.in`, relation.from);
		}
		if (groups.size === 0) {
			links.replaceChildren(element('p', 'atlas-inspector-empty', data.strings.noLinks));
		} else {
			links.replaceChildren(
				...[...groups].map(([key, ids]) => {
					const group = element('div', 'atlas-inspector-group');
					group.append(element('p', 'atlas-inspector-verb', data.strings[`rel.${key}`] ?? key));
					const list = element('ul', 'atlas-inspector-related');
					for (const relatedId of ids) {
						const related = data.items[relatedId];
						if (!related) continue;
						const button = element('button', 'atlas-inspector-related-button', related.title);
						button.type = 'button';
						button.addEventListener('click', () => select(relatedId, { focus: true }));
						const entry = element('li');
						entry.append(button);
						list.append(entry);
					}
					group.append(list);
					return group;
				}),
			);
		}

		const open = slot('open') as HTMLAnchorElement;
		open.href = item.href;
		slot('only-in').textContent = item.onlyIn ?? '';
	};

	// ── Axis selector ────────────────────────────────────────────

	const axisButton = root.querySelector<HTMLButtonElement>('[data-atlas-axis-button]');
	const axisMenu = root.querySelector<HTMLElement>('[data-atlas-axis-menu]');
	const axisOptions = axisMenu ? [...axisMenu.querySelectorAll<HTMLButtonElement>('[data-axis]')] : [];

	const setView = (id: string, options: { announce?: boolean } = {}) => {
		const next = views.find((view) => view.id === id);
		if (!next) return;
		active = next;
		for (const view of views) view.element.hidden = view !== next;
		for (const legend of root.querySelectorAll<HTMLElement>('[data-legend-view]')) legend.hidden = legend.dataset.legendView !== id;
		for (const option of axisOptions) option.setAttribute('aria-checked', String(option.dataset.axis === id));
		const name = root.querySelector('[data-atlas-axis-name]');
		if (name) name.textContent = data.axes[id] ?? id;
		resetTabStop();
		if (options.announce !== false) live.textContent = data.strings.announceAxis.replace('{axis}', data.axes[id] ?? id);
		writeParams({ y: id === views[0].id ? null : id });
	};

	const menuOpen = () => axisMenu !== null && !axisMenu.hidden;
	const openMenu = () => {
		if (!axisMenu || !axisButton) return;
		axisMenu.hidden = false;
		axisButton.setAttribute('aria-expanded', 'true');
		(axisOptions.find((option) => option.getAttribute('aria-checked') === 'true') ?? axisOptions[0])?.focus();
	};
	const closeMenu = (refocus: boolean) => {
		if (!axisMenu || !axisButton || axisMenu.hidden) return;
		axisMenu.hidden = true;
		axisButton.setAttribute('aria-expanded', 'false');
		if (refocus) axisButton.focus();
	};

	if (axisButton && axisMenu) {
		axisButton.addEventListener('click', () => (menuOpen() ? closeMenu(true) : openMenu()));
		axisButton.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				openMenu();
			}
		});
		for (const option of axisOptions) {
			option.addEventListener('click', () => {
				setView(option.dataset.axis!);
				closeMenu(true);
			});
		}
		axisMenu.addEventListener('keydown', (event) => {
			const index = axisOptions.indexOf(document.activeElement as HTMLButtonElement);
			let target: HTMLButtonElement | undefined;
			if (event.key === 'ArrowDown') target = axisOptions[(index + 1) % axisOptions.length];
			else if (event.key === 'ArrowUp') target = axisOptions[(index - 1 + axisOptions.length) % axisOptions.length];
			else if (event.key === 'Home') target = axisOptions[0];
			else if (event.key === 'End') target = axisOptions[axisOptions.length - 1];
			else if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation(); // do not also clear the selection
				closeMenu(true);
				return;
			} else if (event.key === 'Tab') {
				closeMenu(false);
				return;
			} else return;
			event.preventDefault();
			target?.focus();
		});
		document.addEventListener('pointerdown', (event) => {
			if (menuOpen() && !axisMenu.contains(event.target as Node) && !axisButton.contains(event.target as Node)) closeMenu(false);
		});
	}

	// ── Marks ────────────────────────────────────────────────────

	root.addEventListener('click', (event) => {
		const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[data-artifact-id]');
		if (!anchor || !root.contains(anchor)) return;
		const mouse = event as MouseEvent;
		if (mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
		const id = anchor.dataset.artifactId!;
		if (selected === id) return; // second activation follows the link
		event.preventDefault();
		select(id, { focus: true });
	});

	root.querySelector('[data-atlas-clear]')?.addEventListener('click', clear);

	root.addEventListener('pointerover', (event) => setHovered(idOf(event.target)));
	root.addEventListener('pointerleave', () => setHovered(null));
	root.addEventListener('focusin', (event) => setHovered(idOf(event.target)));

	root.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && selected !== null) {
			event.preventDefault();
			clear();
			return;
		}

		const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[data-artifact-id]');
		if (!anchor) return;
		const laneIndex = active.lanes.findIndex((lane) => lane.includes(anchor));
		if (laneIndex === -1) return;
		const lane = active.lanes[laneIndex];
		const index = lane.indexOf(anchor);
		let target: HTMLAnchorElement | undefined;

		switch (event.key) {
			case 'ArrowRight':
				target = lane[index + 1];
				break;
			case 'ArrowLeft':
				target = lane[index - 1];
				break;
			case 'Home':
				target = lane[0];
				break;
			case 'End':
				target = lane[lane.length - 1];
				break;
			case 'ArrowDown':
			case 'ArrowUp': {
				const step = event.key === 'ArrowDown' ? 1 : -1;
				const x = Number(anchor.parentElement!.dataset.x);
				for (let next = laneIndex + step; next >= 0 && next < active.lanes.length; next += step) {
					if (active.lanes[next].length > 0) {
						target = nearest(active.lanes[next], x);
						break;
					}
				}
				break;
			}
			default:
				return;
		}

		event.preventDefault();
		if (target) {
			setTabStop(target);
			target.focus();
		}
	});

	// Enable the controls, then restore a shared or reloaded view and selection.
	root.setAttribute('data-js', '');
	const params = new URLSearchParams(window.location.search);
	const initialView = params.get('y');
	if (initialView && views.some((view) => view.id === initialView)) setView(initialView, { announce: false });
	else resetTabStop();
	const initial = params.get('focus');
	if (initial && anchorsById.has(initial)) select(initial, { announce: false });
}

function nearest(lane: HTMLAnchorElement[], x: number): HTMLAnchorElement {
	return lane.reduce((best, anchor) =>
		Math.abs(Number(anchor.parentElement!.dataset.x) - x) < Math.abs(Number(best.parentElement!.dataset.x) - x) ? anchor : best,
	);
}

function writeParams(changes: { focus?: string | null; y?: string | null }): void {
	const url = new URL(window.location.href);
	for (const [key, value] of Object.entries(changes)) {
		if (value === null || value === undefined) url.searchParams.delete(key);
		else url.searchParams.set(key, value);
	}
	window.history.replaceState(window.history.state, '', url);
}

function push(groups: Map<string, string[]>, key: string, id: string): void {
	groups.set(key, [...(groups.get(key) ?? []), id]);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}
