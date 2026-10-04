// Edge visibility policy for the Living Atlas (decision D16): decides whether
// relations are drawn in the default state ('all') or only for the hovered
// or selected artifact ('on-demand').
//
// Link count alone does not determine clutter: ten links bunched into one
// month are worse than thirty spread over three years. The policy therefore
// looks at the geometry of the visible arcs: how much ink they lay down,
// how often their spans cross, and how they bunch in time. Thresholds live in
// src/data/atlasPolicy.ts. This is the one place the decision is made;
// rendering only reads the result.

import { atlasEdgePolicyConfig, type AtlasEdgePolicyConfig } from '../../data/atlasPolicy.ts';

export type EdgeGeometry = {
	/** Track x of both ends, and their vertical positions in px. */
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	/** Month of the arc's midpoint, `YYYY-MM`. */
	midMonth: string;
};

export type EdgeVisibility = {
	mode: 'all' | 'on-demand';
	metrics: { count: number; inkRatio: number; crossings: number; burst: number };
	/** Which limits were exceeded; empty when mode is 'all'. Rendered as a data attribute for tuning. */
	exceeded: string[];
};

export function decideEdgeVisibility(
	edges: readonly EdgeGeometry[],
	trackWidth: number,
	config: AtlasEdgePolicyConfig = atlasEdgePolicyConfig,
): EdgeVisibility {
	const ink = edges.reduce((total, edge) => total + Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1), 0);
	const metrics = {
		count: edges.length,
		inkRatio: trackWidth > 0 ? ink / trackWidth : 0,
		crossings: countCrossings(edges),
		burst: peakPerMonth(edges),
	};

	const exceeded = [
		metrics.inkRatio > config.maxInkRatio ? 'ink' : null,
		metrics.crossings > config.maxCrossings ? 'crossings' : null,
		metrics.burst > config.maxBurst ? 'burst' : null,
	].filter((reason): reason is string => reason !== null);

	return { mode: exceeded.length === 0 ? 'all' : 'on-demand', metrics, exceeded };
}

/**
 * Two arcs drawn on the same side cross when their x-intervals interleave
 * (a < c < b < d). Counted pairwise, stopping once the result can no longer
 * change the decision.
 */
function countCrossings(edges: readonly EdgeGeometry[]): number {
	const spans = edges.map((edge) => [Math.min(edge.x1, edge.x2), Math.max(edge.x1, edge.x2)] as const);
	let crossings = 0;
	for (let i = 0; i < spans.length; i += 1) {
		for (let j = i + 1; j < spans.length; j += 1) {
			const [a, b] = spans[i];
			const [c, d] = spans[j];
			if ((a < c && c < b && b < d) || (c < a && a < d && d < b)) crossings += 1;
		}
		if (crossings > 10_000) break;
	}
	return crossings;
}

function peakPerMonth(edges: readonly EdgeGeometry[]): number {
	const counts = new Map<string, number>();
	for (const edge of edges) counts.set(edge.midMonth, (counts.get(edge.midMonth) ?? 0) + 1);
	return Math.max(0, ...counts.values());
}
