/*
 * Shared behaviour for the small floating controls (language globe, TOC trigger,
 * blog filter): pointer-event dragging with viewport clamping, optional
 * sessionStorage persistence, and popover placement beside the trigger.
 * Imported by the component scripts, so Astro bundles it; nothing here is inline.
 */

const MARGIN = 8;

/** Controls stay below the sticky header, so a drag never parks one underneath it. */
function topInset() {
	const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
	return (Number.isFinite(header) ? header : 0) + MARGIN;
}

type Point = { x: number; y: number };

export type Draggable = {
	/** True from the end of a drag until the click that follows it has been swallowed. */
	wasDragged: () => boolean;
	/** Re-clamp into the viewport (also runs on window resize). */
	clampNow: () => void;
};

function readPoint(key: string): Point | null {
	try {
		const raw = window.sessionStorage.getItem(key);
		if (!raw) return null;
		const point = JSON.parse(raw) as Point;
		return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
	} catch {
		return null;
	}
}

function writePoint(key: string, point: Point) {
	try {
		window.sessionStorage.setItem(key, JSON.stringify(point));
	} catch {
		/* Blocked storage: the control just returns to its default spot next visit. */
	}
}

/**
 * Make a fixed-position element draggable. The first drag converts its CSS
 * anchor (right/bottom/etc.) into explicit left/top pixels. A move under 4px
 * is still a click; a real drag swallows the click that follows it.
 */
export function makeDraggable(
	el: HTMLElement,
	options: { storageKey?: string; onMove?: () => void; handle?: HTMLElement } = {},
): Draggable {
	let dragging = false;
	let moved = false;
	let swallowClick = false;
	let start = { px: 0, py: 0, left: 0, top: 0 };

	const place = (left: number, top: number) => {
		const maxLeft = Math.max(MARGIN, window.innerWidth - el.offsetWidth - MARGIN);
		const maxTop = Math.max(MARGIN, window.innerHeight - el.offsetHeight - MARGIN);
		const next = {
			x: Math.min(maxLeft, Math.max(MARGIN, left)),
			y: Math.min(Math.max(maxTop, topInset()), Math.max(topInset(), top)),
		};
		el.style.left = `${next.x}px`;
		el.style.top = `${next.y}px`;
		el.style.right = 'auto';
		el.style.bottom = 'auto';
		return next;
	};

	let placed = false;
	const clampNow = () => {
		if (!placed) return;
		const rect = el.getBoundingClientRect();
		place(rect.left, rect.top);
		options.onMove?.();
	};

	if (options.storageKey) {
		const saved = readPoint(options.storageKey);
		if (saved) {
			place(saved.x, saved.y);
			placed = true;
		}
	}

	const handle = options.handle ?? el;
	handle.style.touchAction = 'none';

	// Move/up are tracked on the document, not the element and not via pointer
	// capture: capturing on pointerdown retargets the click that follows to `el`
	// itself, so a wrapper's inner button never saw it (the blog filter trigger did
	// nothing), while element-level listeners lose a fast drag that outruns the element.
	const onMove = (event: PointerEvent) => {
		if (!dragging) return;
		const dx = event.clientX - start.px;
		const dy = event.clientY - start.py;
		if (!moved && Math.hypot(dx, dy) < 4) return;
		moved = true;
		placed = true;
		el.classList.add('is-dragging');
		place(start.left + dx, start.top + dy);
		options.onMove?.();
	};

	const end = () => {
		document.removeEventListener('pointermove', onMove);
		document.removeEventListener('pointerup', end);
		document.removeEventListener('pointercancel', end);
		if (!dragging) return;
		dragging = false;
		el.classList.remove('is-dragging');
		if (moved) {
			swallowClick = true;
			// A drag released over the element normally fires click; clear the flag if it doesn't.
			window.setTimeout(() => {
				swallowClick = false;
			}, 0);
			if (options.storageKey) {
				const rect = el.getBoundingClientRect();
				writePoint(options.storageKey, { x: rect.left, y: rect.top });
			}
		}
	};

	handle.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		const rect = el.getBoundingClientRect();
		dragging = true;
		moved = false;
		start = { px: event.clientX, py: event.clientY, left: rect.left, top: rect.top };
		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', end);
		document.addEventListener('pointercancel', end);
	});

	// Document capture phase: neither the control's own click handler nor an
	// outside-click handler (the click after a drag can land on a common ancestor,
	// not on `el`) ever sees the click that ends a drag.
	document.addEventListener(
		'click',
		(event) => {
			if (swallowClick) {
				swallowClick = false;
				event.stopImmediatePropagation();
				event.preventDefault();
			}
		},
		true,
	);

	window.addEventListener('resize', clampNow);

	return { wasDragged: () => swallowClick, clampNow };
}

/**
 * Position a fixed popover next to its trigger: below it when there is room
 * (otherwise above), aligned to whichever edge keeps it on screen.
 */
export function placePopover(trigger: HTMLElement, panel: HTMLElement) {
	const rect = trigger.getBoundingClientRect();
	const gap = 6;
	const width = panel.offsetWidth;
	const height = panel.offsetHeight;

	const roomBelow = window.innerHeight - rect.bottom - gap - MARGIN;
	const roomAbove = rect.top - gap - MARGIN;
	const below = roomBelow >= Math.min(height, 200) || roomBelow >= roomAbove;
	const top = below ? rect.bottom + gap : Math.max(MARGIN, rect.top - gap - height);

	// Prefer the edge that opens towards the middle of the screen.
	const opensRight = rect.left + width <= window.innerWidth - MARGIN && rect.left < window.innerWidth / 2;
	const left = opensRight ? rect.left : rect.right - width;

	panel.style.left = `${Math.max(MARGIN, Math.min(window.innerWidth - width - MARGIN, left))}px`;
	panel.style.top = `${top}px`;
	panel.style.right = 'auto';
	panel.style.bottom = 'auto';
	// Available height so a tall panel scrolls internally instead of leaving the viewport.
	panel.style.maxHeight = `${Math.max(120, (below ? roomBelow : roomAbove) - 0)}px`;
}

export function clearPopoverPlacement(panel: HTMLElement) {
	for (const prop of ['left', 'top', 'right', 'bottom', 'maxHeight']) {
		panel.style.removeProperty(prop === 'maxHeight' ? 'max-height' : prop);
	}
}
