// Axis encoding for the Living Atlas (docs/plans/2026-10-03-explore-living-atlas.md §4.12).
//
// The Atlas is a mapping { x, y } over public artifacts. Only mappings that
// are semantically valid for the public artifact contract exist; this is a
// registry, not a chart builder.
//
//   x: 'time' (a continuous axis; today the only valid x)
//   y: a categorical axis — each artifact belongs to one or more *lanes*
//
// A categorical axis is pure data: which lanes exist for an artifact set (in
// display order, including empty lanes for fixed vocabularies, so absence is
// shown truthfully), and which lane(s) an artifact belongs to. Adding a
// mapping means adding an entry here; layout, markup, and interaction read
// the registry and need no change.
//
// What does NOT qualify as an axis: a field the contract does not carry, or a
// field whose meaning differs by kind. (Language availability was rejected:
// paper and resource hrefs list every language's hub page whether or not the
// artifact is translated.) A categorical x — e.g. Topic × Type — needs a
// grid layout of stacked marks rather than a time axis, and is not built yet.

import { artifactDomains, artifactKinds } from '../../data/publicArtifactVocabulary.ts';
import type { PublicArtifact } from '../artifacts/contract.ts';

export const UNASSIGNED_LANE = '__unassigned';
/** The lane for artifacts that belong to no series. */
export const STANDALONE_LANE = '__standalone';

export type CategoryAxis = {
	id: string;
	/** Lane keys in display order for this artifact set. */
	lanes(artifacts: readonly PublicArtifact[]): string[];
	/**
	 * Lane(s) an artifact belongs to. Single-valued axes return one key.
	 * A multi-valued axis (topics) returns several: the artifact appears as a
	 * mark in each lane, counts per lane are memberships, and every total
	 * elsewhere stays a count of distinct artifacts.
	 */
	lanesOf(artifact: PublicArtifact): string[];
	/** Whether the axis tells the visitor anything for this artifact set. */
	offered(artifacts: readonly PublicArtifact[]): boolean;
};

export const timeAxisId = 'time' as const;

/** Learn / Research / Build / Collect / Create — the default, always offered. */
export const activityAxis: CategoryAxis = {
	id: 'activity',
	lanes: () => [...artifactDomains],
	lanesOf: (artifact) => [artifact.domain],
	offered: () => true,
};

/**
 * Blog series (the post's own `series` metadata, linked across translations
 * by src/utils/artifacts/series.ts). Lanes are the series that exist, ordered
 * by when each began (a cascade of work starting over time), plus a
 * "standalone" lane for artifacts that belong to no series. Offered once at
 * least one series actually groups more than one artifact.
 */
export const seriesAxis: CategoryAxis = {
	id: 'series',
	lanes(artifacts) {
		const began = new Map<string, string>();
		for (const artifact of artifacts) {
			if (!artifact.series) continue;
			const known = began.get(artifact.series.id);
			if (known === undefined || artifact.time.start < known) began.set(artifact.series.id, artifact.time.start);
		}
		const lanes = [...began.keys()].sort((a, b) => (began.get(a)! < began.get(b)! ? -1 : began.get(a)! > began.get(b)! ? 1 : a < b ? -1 : 1));
		return artifacts.some((artifact) => !artifact.series) ? [...lanes, STANDALONE_LANE] : lanes;
	},
	lanesOf: (artifact) => (artifact.series ? [artifact.series.id] : [STANDALONE_LANE]),
	offered(artifacts) {
		const sizes = new Map<string, number>();
		for (const artifact of artifacts) {
			if (artifact.series) sizes.set(artifact.series.id, (sizes.get(artifact.series.id) ?? 0) + 1);
		}
		return [...sizes.values()].some((size) => size > 1);
	},
};

/**
 * Artifact kind (paper, review, writing, project, experiment, resource,
 * work). A fixed vocabulary, so kinds with no artifact yet show as empty
 * lanes. Implemented but hidden until the data holds more than one kind:
 * while every artifact is writing it would be a single lane that says
 * nothing the page does not already.
 */
export const typeAxis: CategoryAxis = {
	id: 'type',
	lanes: () => artifactKinds.map((kind) => kind.id),
	lanesOf: (artifact) => [artifact.kind],
	offered: (artifacts) => new Set(artifacts.map((artifact) => artifact.kind)).size > 1,
};

/**
 * Published topic ids. Lanes are derived from the data (most artifacts first,
 * then id), plus an "unassigned" lane when some artifacts carry no topic.
 * Offered only once at least one public artifact has a topic: today none do
 * (blog posts carry tags, not topics), so it stays out of the selector until
 * papers or resources with topics are published. Topics are shown as
 * published; rolling sub-topics up to a top-level topic needs the taxonomy,
 * which the contract does not carry.
 */
export const topicAxis: CategoryAxis = {
	id: 'topic',
	lanes(artifacts) {
		const counts = new Map<string, number>();
		for (const artifact of artifacts) {
			for (const topic of artifact.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
		}
		const lanes = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || (a < b ? -1 : 1));
		return artifacts.some((artifact) => artifact.topics.length === 0) ? [...lanes, UNASSIGNED_LANE] : lanes;
	},
	lanesOf: (artifact) => (artifact.topics.length > 0 ? artifact.topics : [UNASSIGNED_LANE]),
	offered: (artifacts) => artifacts.some((artifact) => artifact.topics.length > 0),
};

/** Every categorical y axis, in selector order. The first is the default. */
export const categoryAxes: readonly CategoryAxis[] = [activityAxis, seriesAxis, typeAxis, topicAxis];
export const defaultCategoryAxis = activityAxis;

/** The y axes worth showing for this artifact set, default first. */
export function getOfferedAxes(artifacts: readonly PublicArtifact[]): CategoryAxis[] {
	return categoryAxes.filter((axis) => axis.offered(artifacts));
}

/** A requested axis id (e.g. from `?y=`), or the default when it is unknown or not offered. */
export function resolveAxis(id: string | null | undefined, artifacts: readonly PublicArtifact[]): CategoryAxis {
	return getOfferedAxes(artifacts).find((axis) => axis.id === id) ?? defaultCategoryAxis;
}
