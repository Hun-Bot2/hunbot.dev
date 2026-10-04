// Build-time layout for the Living Atlas (docs/plans/2026-10-03-explore-living-atlas.md
// §4–§5). Pure: public artifacts and relations in, positions out. The page
// renders this as HTML/SVG; the client never runs a layout algorithm.
//
// Encoding: x = date (linear time), lane = the chosen categorical axis
// (src/utils/atlas/dimensions.ts; the default is the activity domain), row
// inside a lane = collision avoidance only. Spans (project, experiment)
// run from start to end, or to "now" when ongoing.

import { atlasLayoutConfig, type AtlasLayoutConfig } from '../../data/atlasPolicy.ts';
import { getArtifactKind } from '../../data/publicArtifactVocabulary.ts';
import type { PublicArtifact, PublicRelation } from '../artifacts/contract.ts';
import { activityAxis, type CategoryAxis } from './dimensions.ts';
import { decideEdgeVisibility, type EdgeVisibility } from './edge-policy.ts';

const DAY_MS = 86_400_000;

export type AtlasMark = {
	id: string;
	kind: PublicArtifact['kind'];
	/** The lane this mark sits in. A multi-valued axis can place one artifact in several lanes. */
	laneKey: string;
	/** Track units, 0..trackWidth. */
	x: number;
	/** Span end in track units; undefined for point kinds. */
	x2?: number;
	ongoing: boolean;
	row: number;
	/** px from the top of the lanes block. */
	y: number;
	/** Finished/published = filled; in progress = outline. */
	filled: boolean;
	recent: boolean;
	/** Where the hover label sits relative to the mark, so it never leaves the track. */
	labelAlign: 'start' | 'center' | 'end';
	/** Date of the mark, as written in the artifact (YYYY-MM-DD or YYYY-MM). */
	start: string;
	end: string | null | undefined;
};

export type AtlasLane = {
	key: string;
	count: number;
	rows: number;
	/** px from the top of the lanes block. */
	top: number;
	height: number;
	marks: AtlasMark[];
};

export type AtlasTick = { x: number; label: string; year: boolean };

export type AtlasArc = {
	from: string;
	to: string;
	rel: string;
	/** SVG path in (track units, px). */
	d: string;
	forward: boolean;
};

export type AtlasLayout = {
	axisId: string;
	config: AtlasLayoutConfig;
	axis: { start: string; end: string; now: string; nowX: number };
	ticks: AtlasTick[];
	lanes: AtlasLane[];
	height: number;
	arcs: AtlasArc[];
	edgeVisibility: EdgeVisibility;
	growth: {
		artifacts: number;
		relations: number;
		since: string | null;
		lastAdded: string | null;
		recent: number;
	};
};

export function computeAtlasLayout(
	artifacts: readonly PublicArtifact[],
	relations: readonly PublicRelation[],
	options: { now: Date; axis?: CategoryAxis; config?: AtlasLayoutConfig },
): AtlasLayout {
	const config = options.config ?? { ...atlasLayoutConfig };
	const axis = options.axis ?? activityAxis;
	const now = startOfDay(options.now);
	const nowIso = isoDay(now);

	// Axis: first artifact (or minMonths before now) to now, padded at both ends.
	const earliest = artifacts.reduce<Date | null>((min, artifact) => {
		const date = parseArtifactDate(artifact.time.start);
		return min === null || date < min ? date : min;
	}, null);
	const minStart = addMonths(startOfMonth(now), -config.minMonths);
	const rawStart = earliest && earliest < minStart ? startOfMonth(earliest) : minStart;
	const span = now.getTime() - rawStart.getTime();
	const axisStart = new Date(rawStart.getTime() - span * config.edgePadding);
	const axisEnd = new Date(now.getTime() + span * config.edgePadding);
	const toX = (date: Date) =>
		((date.getTime() - axisStart.getTime()) / (axisEnd.getTime() - axisStart.getTime())) * config.trackWidth;

	// Marks per lane, with greedy row packing.
	const lanes: AtlasLane[] = [];
	let top = 0;
	for (const key of axis.lanes(artifacts)) {
		const members = artifacts
			.filter((artifact) => axis.lanesOf(artifact).includes(key))
			.map((artifact) => toMark(artifact, key, toX, now, config))
			.sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : 1));

		const rowEnds: number[] = [];
		for (const mark of members) {
			let row = rowEnds.findIndex((end) => end + config.minGap <= mark.x);
			if (row === -1) {
				if (rowEnds.length < config.maxRows) {
					row = rowEnds.length;
					rowEnds.push(0);
				} else {
					row = rowEnds.indexOf(Math.min(...rowEnds));
				}
			}
			rowEnds[row] = mark.x2 ?? mark.x;
			mark.row = row;
		}

		const rows = Math.max(1, rowEnds.length);
		const height = rows * config.rowHeight + config.lanePadding * 2;
		for (const mark of members) {
			mark.y = top + config.lanePadding + mark.row * config.rowHeight + config.rowHeight / 2;
		}
		lanes.push({ key, count: members.length, rows, top, height, marks: members });
		top += height;
	}

	// An artifact in several lanes anchors its arcs at its first mark.
	const markById = new Map<string, AtlasMark>();
	for (const mark of lanes.flatMap((lane) => lane.marks)) {
		if (!markById.has(mark.id)) markById.set(mark.id, mark);
	}
	const arcs = relations.flatMap((relation) => {
		const from = markById.get(relation.from);
		const to = markById.get(relation.to);
		return from && to ? [{ ...relation, ...arcGeometry(from, to) }] : [];
	});
	const edgeVisibility = decideEdgeVisibility(
		arcs.map((arc) => {
			const from = markById.get(arc.from)!;
			const to = markById.get(arc.to)!;
			const mid = new Date(axisStart.getTime() + (((from.x + to.x) / 2) / config.trackWidth) * (axisEnd.getTime() - axisStart.getTime()));
			return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, midMonth: isoDay(mid).slice(0, 7) };
		}),
		config.trackWidth,
	);

	const starts = artifacts.map((artifact) => artifact.time.start).sort();
	const added = artifacts.map((artifact) => artifact.addedAt).sort();

	return {
		axisId: axis.id,
		config,
		axis: { start: isoDay(axisStart), end: isoDay(axisEnd), now: nowIso, nowX: toX(now) },
		ticks: computeTicks(axisStart, axisEnd, toX),
		lanes,
		height: top,
		arcs,
		edgeVisibility,
		growth: {
			artifacts: artifacts.length,
			relations: relations.length,
			since: starts[0] ?? null,
			lastAdded: added.at(-1) ?? null,
			recent: lanes.reduce((total, lane) => total + lane.marks.filter((mark) => mark.recent).length, 0),
		},
	};
}

function toMark(artifact: PublicArtifact, laneKey: string, toX: (date: Date) => number, now: Date, config: AtlasLayoutConfig): AtlasMark {
	const kind = getArtifactKind(artifact.kind);
	const isSpan = kind?.timeShape === 'span';
	const x = toX(parseArtifactDate(artifact.time.start, 'mid'));
	const ongoing = isSpan && artifact.time.end === null;
	const x2 = isSpan ? (ongoing ? toX(now) : toX(parseArtifactDate(artifact.time.end as string, 'mid'))) : undefined;
	const added = parseArtifactDate(artifact.addedAt);
	const anchor = x2 === undefined ? x : (x + x2) / 2;

	return {
		id: artifact.id,
		kind: artifact.kind,
		laneKey,
		x,
		x2: x2 === undefined ? undefined : Math.max(x2, x),
		ongoing,
		row: 0,
		y: 0,
		filled: !['planned', 'ongoing', 'paused', 'selected'].includes(artifact.state),
		recent: now.getTime() - added.getTime() <= config.recentDays * DAY_MS && added.getTime() <= now.getTime(),
		labelAlign: anchor < config.trackWidth * 0.2 ? 'start' : anchor > config.trackWidth * 0.8 ? 'end' : 'center',
		start: artifact.time.start,
		end: artifact.time.end,
	};
}

/**
 * Forward-in-time links arc above the marks, backward ones (an explanation
 * written before the thing it explains finished) arc below.
 */
export function arcGeometry(from: { x: number; y: number }, to: { x: number; y: number }): { d: string; forward: boolean } {
	const forward = to.x >= from.x;
	const lift = Math.min(64, Math.abs(to.x - from.x) * 0.25 + 12);
	const controlY = forward ? Math.min(from.y, to.y) - lift : Math.max(from.y, to.y) + lift;
	const round = (value: number) => Math.round(value * 10) / 10;
	return {
		d: `M${round(from.x)} ${round(from.y)} Q${round((from.x + to.x) / 2)} ${round(controlY)} ${round(to.x)} ${round(to.y)}`,
		forward,
	};
}

/** Quarter ticks; January shows the year. Years only when the span is long. */
function computeTicks(start: Date, end: Date, toX: (date: Date) => number): AtlasTick[] {
	const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
	const step = months > 48 ? 12 : 3;
	const ticks: AtlasTick[] = [];
	let cursor = startOfMonth(start);
	if (cursor < start) cursor = addMonths(cursor, 1);
	while (cursor <= end) {
		const month = cursor.getUTCMonth();
		if (month % step === 0) {
			const year = month === 0;
			ticks.push({
				x: toX(cursor),
				label: year ? String(cursor.getUTCFullYear()) : `${cursor.getUTCFullYear()}.${String(month + 1).padStart(2, '0')}`,
				year,
			});
		}
		cursor = addMonths(cursor, 1);
	}
	return ticks;
}

/** `YYYY-MM-DD` or `YYYY-MM` → UTC date. A month-precision date sits mid-month when `mid` is asked for. */
export function parseArtifactDate(value: string, position: 'start' | 'mid' = 'start'): Date {
	if (/^\d{4}-\d{2}$/.test(value)) {
		return new Date(`${value}-${position === 'mid' ? '15' : '01'}T00:00:00Z`);
	}
	return new Date(`${value}T00:00:00Z`);
}

function startOfDay(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonth(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function isoDay(date: Date): string {
	return date.toISOString().slice(0, 10);
}
