// Tunables for the Living Atlas (/{lang}/explore/,
// docs/plans/2026-10-03-explore-living-atlas.md §4–§5). Data, not logic:
// src/utils/atlas/layout.ts and edge-policy.ts read these values, so the
// atlas can be tuned from real usage without touching rendering code.

export const atlasLayoutConfig = {
	/** Track coordinate width. Marks are placed in these units and rendered as percentages. */
	trackWidth: 1000,
	/** Vertical distance between stacked rows inside a lane, px. */
	rowHeight: 24,
	/** Space above the first and below the last row of a lane, px. */
	lanePadding: 10,
	/**
	 * Minimum horizontal distance between two marks sharing a row, track units.
	 * This is also each mark's exclusive pointer target width (see atlas.css):
	 * 28 units is 24px at the full 980px page width, the WCAG 2.2 minimum
	 * target size. Collisions are resolved by adding rows, never by moving a
	 * mark sideways, so x stays an exact date.
	 */
	minGap: 28,
	/**
	 * Rows a lane may grow to before marks start sharing rows (and overlap).
	 * Set high enough that real data never reaches it: the lane grows to fit
	 * the data, the data is never spread or squeezed to fit the lane.
	 */
	maxRows: 16,
	/** The time axis always spans at least this many months, so sparse data is not stretched. */
	minMonths: 12,
	/** Empty margin at each end of the axis, as a fraction of the span. */
	edgePadding: 0.025,
	/** An artifact added within this many days of the build is marked "recently added". */
	recentDays: 30,
} as const;

/**
 * When relations are drawn by default rather than only on hover/selection.
 * None of these is a semantic rule on its own; together they estimate
 * clutter from the geometry of the visible links (decision D16). Tune them
 * from real usage.
 */
export const atlasEdgePolicyConfig = {
	/** Total arc length allowed, as a multiple of the track width. */
	maxInkRatio: 3,
	/** Pairs of arcs whose spans cross each other. */
	maxCrossings: 12,
	/** Arcs whose midpoints fall in the same month. */
	maxBurst: 6,
} as const;

export type AtlasLayoutConfig = { -readonly [K in keyof typeof atlasLayoutConfig]: number };
export type AtlasEdgePolicyConfig = { -readonly [K in keyof typeof atlasEdgePolicyConfig]: number };
