// Where the floating inspector goes: beside the selected card, inside the
// workspace, and never over the card or any other card. Pure (no DOM), so it
// runs under `node --test`. All rectangles are in the workspace's own pixels.

export type Rect = { x: number; y: number; w: number; h: number };
export type Spot = { x: number; y: number; side: 'right' | 'left' | 'below' | 'above'; /** No card is covered. */ clear: boolean };

const overlapArea = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Tries right, left, below, above of `anchor` (in that order) and returns the first spot that covers none of
 * `obstacles` and stays inside `bounds`; otherwise the least bad one with `clear: false`, so the caller can
 * move the camera and ask again.
 */
export function placeFloating(anchor: Rect, size: { w: number; h: number }, bounds: { w: number; h: number }, obstacles: Rect[], options: { gap?: number; margin?: number } = {}): Spot {
	const gap = options.gap ?? 14;
	const margin = options.margin ?? 12;
	const centreX = anchor.x + anchor.w / 2 - size.w / 2;
	const centreY = anchor.y + anchor.h / 2 - size.h / 2;
	const candidates: Spot[] = [
		{ side: 'right', x: anchor.x + anchor.w + gap, y: clamp(centreY, margin, bounds.h - margin - size.h), clear: false },
		{ side: 'left', x: anchor.x - gap - size.w, y: clamp(centreY, margin, bounds.h - margin - size.h), clear: false },
		{ side: 'below', x: clamp(centreX, margin, bounds.w - margin - size.w), y: anchor.y + anchor.h + gap, clear: false },
		{ side: 'above', x: clamp(centreX, margin, bounds.w - margin - size.w), y: anchor.y - gap - size.h, clear: false },
	];
	let best: { spot: Spot; cost: number } | null = null;
	for (const spot of candidates) {
		const box = { x: spot.x, y: spot.y, w: size.w, h: size.h };
		const outside = box.x < margin - 0.5 || box.y < margin - 0.5 || box.x + box.w > bounds.w - margin + 0.5 || box.y + box.h > bounds.h - margin + 0.5;
		const covered = obstacles.reduce((sum, rect) => sum + overlapArea(box, rect), 0);
		if (!outside && covered === 0) return { ...spot, clear: true };
		const cost = covered + (outside ? 1e9 : 0);
		if (!best || cost < best.cost) best = { spot, cost };
	}
	return { ...best!.spot, x: clamp(best!.spot.x, margin, bounds.w - margin - size.w), y: clamp(best!.spot.y, margin, bounds.h - margin - size.h), clear: false };
}

/** For a record with no card to sit beside: the first corner of the workspace that covers no card (top right first). */
export function placeAtCorner(size: { w: number; h: number }, bounds: { w: number; h: number }, obstacles: Rect[], margin = 12): { x: number; y: number; clear: boolean } {
	const right = Math.max(margin, bounds.w - size.w - margin);
	const bottom = Math.max(margin, bounds.h - size.h - margin);
	const corners = [{ x: right, y: margin }, { x: margin, y: margin }, { x: right, y: bottom }, { x: margin, y: bottom }];
	for (const corner of corners) {
		const box = { ...corner, w: size.w, h: size.h };
		if (obstacles.every((rect) => overlapArea(box, rect) === 0)) return { ...corner, clear: true };
	}
	return { ...corners[0]!, clear: false };
}
