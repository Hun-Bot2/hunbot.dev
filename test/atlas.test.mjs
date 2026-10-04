// Tests for the Living Atlas's pure modules: layout (src/utils/atlas/layout.ts),
// edge visibility policy (edge-policy.ts), lineage (lineage.ts), and display
// helpers (display.ts), plus a smoke test over the real content.
import assert from 'node:assert/strict';
import test from 'node:test';

import { readArtifactSources } from '../scripts/lib/read-artifact-sources.mjs';
import { atlasLayoutConfig } from '../src/data/atlasPolicy.ts';
import { buildHunbotArtifactExport } from '../src/utils/artifacts/adapters.ts';
import { formatArtifactTime, resolveHref, resolveText } from '../src/utils/atlas/display.ts';
import { STANDALONE_LANE, UNASSIGNED_LANE, activityAxis, getOfferedAxes, resolveAxis, seriesAxis, topicAxis, typeAxis } from '../src/utils/atlas/dimensions.ts';
import { getLegendOptionals } from '../src/utils/atlas/legend.ts';
import { decideEdgeVisibility } from '../src/utils/atlas/edge-policy.ts';
import { computeAtlasLayout } from '../src/utils/atlas/layout.ts';
import { getLineage } from '../src/utils/atlas/lineage.ts';
import { repoRoot } from './helpers/contract-fixture.mjs';

const NOW = new Date('2026-10-04T12:00:00Z');

function artifact(id, overrides = {}) {
	return {
		id,
		kind: 'writing',
		domain: 'build',
		domainsAlso: [],
		title: { ko: id },
		summary: null,
		time: { start: '2026-01-10' },
		state: 'published',
		topics: [],
		href: { ko: `/ko/blog/${id.split(':')[1]}/` },
		externalUrl: null,
		landmark: false,
		addedAt: '2026-01-10',
		origin: 'hunbot',
		sourceRef: null,
		...overrides,
	};
}

const layoutOf = (artifacts, relations = []) => computeAtlasLayout(artifacts, relations, { now: NOW });
const markOf = (layout, id) => layout.lanes.flatMap((lane) => lane.marks).find((mark) => mark.id === id);

// ---------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------

test('layout: five fixed lanes in loop order, empty lanes kept with one row', () => {
	const layout = layoutOf([artifact('writing:a')]);
	assert.deepEqual(layout.lanes.map((lane) => lane.key), ['learn', 'research', 'build', 'collect', 'create']);
	assert.equal(layout.axisId, 'activity');
	const learn = layout.lanes[0];
	assert.equal(learn.count, 0);
	assert.equal(learn.rows, 1);
	assert.equal(learn.height, atlasLayoutConfig.rowHeight + atlasLayoutConfig.lanePadding * 2);
	// Lanes stack without gaps.
	for (let i = 1; i < layout.lanes.length; i += 1) {
		assert.equal(layout.lanes[i].top, layout.lanes[i - 1].top + layout.lanes[i - 1].height);
	}
	assert.equal(layout.height, layout.lanes.at(-1).top + layout.lanes.at(-1).height);
});

test('layout: the axis spans at least minMonths and ends at now', () => {
	const layout = layoutOf([artifact('writing:a', { time: { start: '2026-09-01' }, addedAt: '2026-09-01' })]);
	const months = (new Date(layout.axis.end) - new Date(layout.axis.start)) / (30.44 * 86_400_000);
	assert.ok(months >= atlasLayoutConfig.minMonths, `axis spans ${months.toFixed(1)} months`);
	assert.ok(layout.axis.nowX > 950 && layout.axis.nowX < 1000, `now sits near the right edge (${layout.axis.nowX})`);
	assert.equal(layout.axis.now, '2026-10-04');
});

test('layout: x follows the date; month precision sits mid-month', () => {
	const layout = layoutOf([
		artifact('writing:early', { time: { start: '2025-11-01' } }),
		artifact('writing:late', { time: { start: '2026-06-01' } }),
		artifact('project:p', { kind: 'project', time: { start: '2026-03', end: '2026-05' }, state: 'finished' }),
		artifact('writing:mar15', { time: { start: '2026-03-15' } }),
	]);
	assert.ok(markOf(layout, 'writing:early').x < markOf(layout, 'writing:late').x);
	assert.ok(Math.abs(markOf(layout, 'project:p').x - markOf(layout, 'writing:mar15').x) < 0.01);
});

test('layout: spans run to their end, or to now when ongoing (outline)', () => {
	const layout = layoutOf([
		artifact('project:done', { kind: 'project', time: { start: '2026-01', end: '2026-04' }, state: 'finished' }),
		artifact('project:open', { kind: 'project', time: { start: '2026-02', end: null }, state: 'ongoing' }),
		artifact('writing:w'),
	]);
	const done = markOf(layout, 'project:done');
	const open = markOf(layout, 'project:open');
	assert.ok(done.x2 > done.x && done.filled && !done.ongoing);
	assert.ok(Math.abs(open.x2 - layout.axis.nowX) < 0.01 && open.ongoing && !open.filled);
	assert.equal(markOf(layout, 'writing:w').x2, undefined, 'points have no x2');
});

test('layout: collision rows separate close marks only; the lane grows to fit, up to maxRows', () => {
	const sameDay = Array.from({ length: 9 }, (_, i) => artifact(`writing:same-${i}`));
	const far = artifact('writing:far', { time: { start: '2025-06-01' } });
	const layout = layoutOf([...sameDay, far]);
	const rows = sameDay.map((entry) => markOf(layout, entry.id).row);
	assert.equal(new Set(rows).size, 9, 'nine marks on one day get nine rows: nothing overlaps and nothing is moved sideways');
	assert.equal(markOf(layout, 'writing:far').row, 0);
	const build = layout.lanes.find((lane) => lane.key === 'build');
	assert.equal(build.rows, 9);
	for (const mark of build.marks) {
		assert.ok(mark.y > build.top && mark.y < build.top + build.height, 'mark y sits inside its lane');
	}
});

test('layout: past maxRows marks share rows instead of the lane growing without bound', () => {
	const crowd = Array.from({ length: atlasLayoutConfig.maxRows + 3 }, (_, i) => artifact(`writing:crowd-${i}`));
	const layout = layoutOf(crowd);
	assert.equal(layout.lanes.find((lane) => lane.key === 'build').rows, atlasLayoutConfig.maxRows);
});

test('layout: the same artifacts in a different axis keep their x and only change lanes', () => {
	const artifacts = [
		artifact('writing:w', { time: { start: '2026-02-01' } }),
		artifact('paper:p', { kind: 'paper', domain: 'learn', time: { start: '2026-03-01' }, state: 'studied' }),
	];
	const byActivity = layoutOf(artifacts);
	const byType = computeAtlasLayout(artifacts, [], { now: NOW, axis: typeAxis });
	assert.equal(byType.axisId, 'type');
	assert.deepEqual(byType.lanes.map((lane) => lane.key), ['paper', 'review', 'writing', 'project', 'experiment', 'resource', 'work']);
	assert.equal(markOf(byType, 'writing:w').x, markOf(byActivity, 'writing:w').x);
	assert.equal(markOf(byType, 'writing:w').laneKey, 'writing');
	assert.equal(markOf(byActivity, 'writing:w').laneKey, 'build');
	assert.deepEqual(byType.lanes.map((lane) => lane.count), [1, 0, 1, 0, 0, 0, 0], 'empty kinds stay as truthful empty lanes');
	assert.deepEqual(byType.axis, byActivity.axis);
	assert.deepEqual(byType.ticks, byActivity.ticks);
});

test('layout: recently added, label alignment near the edges, ticks, growth', () => {
	const layout = layoutOf([
		artifact('writing:old', { time: { start: '2025-06-25' }, addedAt: '2025-06-25' }),
		artifact('writing:new', { time: { start: '2026-10-02' }, addedAt: '2026-10-02' }),
		artifact('writing:mid', { time: { start: '2026-02-01' }, addedAt: '2026-02-01' }),
	]);
	assert.equal(markOf(layout, 'writing:new').recent, true);
	assert.equal(markOf(layout, 'writing:old').recent, false);
	assert.equal(markOf(layout, 'writing:old').labelAlign, 'start');
	assert.equal(markOf(layout, 'writing:new').labelAlign, 'end');
	assert.equal(markOf(layout, 'writing:mid').labelAlign, 'center');

	assert.ok(layout.ticks.some((tick) => tick.year && tick.label === '2026'));
	assert.ok(layout.ticks.some((tick) => !tick.year && tick.label === '2026.04'));
	assert.ok(layout.ticks.every((tick, i, all) => i === 0 || tick.x > all[i - 1].x));

	assert.deepEqual(layout.growth, { artifacts: 3, relations: 0, since: '2025-06-25', lastAdded: '2026-10-02', recent: 1 });
});

test('layout: relations become arcs (forward above, backward below); none today means none drawn', () => {
	const paper = artifact('paper:p', { kind: 'paper', domain: 'learn', time: { start: '2026-01-01' }, state: 'studied' });
	const post = artifact('writing:w', { time: { start: '2026-05-01' } });
	const forward = layoutOf([paper, post], [{ from: 'paper:p', to: 'writing:w', rel: 'informed', basis: 'declared' }]);
	assert.equal(forward.arcs.length, 1);
	assert.equal(forward.arcs[0].forward, true);
	assert.match(forward.arcs[0].d, /^M[\d.]+ [\d.]+ Q[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);

	const backward = layoutOf([paper, post], [{ from: 'writing:w', to: 'paper:p', rel: 'explains', basis: 'declared' }]);
	assert.equal(backward.arcs[0].forward, false);

	const empty = layoutOf([paper, post], []);
	assert.deepEqual(empty.arcs, []);
	assert.equal(empty.edgeVisibility.mode, 'all');
	assert.equal(empty.edgeVisibility.metrics.count, 0);
});

// ---------------------------------------------------------------------------
// edge visibility policy
// ---------------------------------------------------------------------------

const edge = (x1, x2, midMonth = '2026-01', y1 = 50, y2 = 150) => ({ x1, y1, x2, y2, midMonth });

test('edge policy: link count alone does not hide links', () => {
	// 30 short, non-crossing links spread over 30 months stay visible.
	const spread = Array.from({ length: 30 }, (_, i) => edge(i * 30, i * 30 + 10, `20${24 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`, 50, 52));
	assert.equal(decideEdgeVisibility(spread, 1000).mode, 'all');
});

test('edge policy: crossings, bunching in time, or ink switch to on-demand', () => {
	const crossing = Array.from({ length: 8 }, (_, i) => edge(i * 20, 500 + i * 20, `2025-${String(i + 1).padStart(2, '0')}`, 50, 52));
	const result = decideEdgeVisibility(crossing, 1000);
	assert.equal(result.mode, 'on-demand');
	assert.ok(result.exceeded.includes('crossings'));

	const burst = Array.from({ length: 7 }, (_, i) => edge(i * 100, i * 100 + 5, '2026-03', 50, 52));
	assert.deepEqual(decideEdgeVisibility(burst, 1000).exceeded, ['burst']);

	const long = Array.from({ length: 4 }, (_, i) => edge(0, 900, `2025-0${i + 1}`, i, 300 + i));
	assert.ok(decideEdgeVisibility(long, 1000).exceeded.includes('ink'));
});

test('edge policy: thresholds come from config, not from the code', () => {
	const burst = Array.from({ length: 7 }, (_, i) => edge(i * 100, i * 100 + 5, '2026-03', 50, 52));
	assert.equal(decideEdgeVisibility(burst, 1000, { maxInkRatio: 3, maxCrossings: 12, maxBurst: 10 }).mode, 'all');
});

// ---------------------------------------------------------------------------
// lineage
// ---------------------------------------------------------------------------

test('lineage: upstream and downstream, depth-capped, cycle-safe', () => {
	const relations = [
		{ from: 'paper:a', to: 'project:b', rel: 'informed' },
		{ from: 'project:b', to: 'experiment:c', rel: 'developedInto' },
		{ from: 'experiment:c', to: 'writing:d', rel: 'resultedIn' },
		{ from: 'writing:d', to: 'paper:a', rel: 'explains' },
	];
	const lineage = getLineage(relations, 'project:b');
	assert.deepEqual([...lineage.upstream].sort(), ['experiment:c', 'paper:a', 'writing:d']);
	assert.deepEqual([...lineage.downstream].sort(), ['experiment:c', 'paper:a', 'writing:d']);

	const shallow = getLineage(relations, 'project:b', 1);
	assert.deepEqual([...shallow.upstream], ['paper:a']);
	assert.deepEqual([...shallow.downstream], ['experiment:c']);
	assert.equal(shallow.relations.size, 2);

	const none = getLineage([], 'writing:x');
	assert.equal(none.upstream.size + none.downstream.size + none.relations.size, 0);
});

// ---------------------------------------------------------------------------
// display
// ---------------------------------------------------------------------------

test('display: page language first, then original, then ko/en/jp', () => {
	assert.deepEqual(resolveText({ ko: '가', en: 'A' }, 'en'), { text: 'A', lang: 'en' });
	assert.deepEqual(resolveText({ original: 'Paper', ko: '논문' }, 'en'), { text: 'Paper', lang: null });
	assert.deepEqual(resolveText({ jp: 'あ', en: 'A' }, 'ko'), { text: 'A', lang: 'en' });
	assert.equal(resolveText(null, 'ko'), null);

	const post = artifact('writing:x', { href: { ko: '/ko/blog/x/', jp: '/jp/blog/x/' } });
	assert.deepEqual(resolveHref(post, 'jp'), { href: '/jp/blog/x/', lang: 'jp' });
	assert.deepEqual(resolveHref(post, 'en'), { href: '/ko/blog/x/', lang: 'ko' });

	assert.equal(formatArtifactTime(post, 'ongoing'), '2026.01.10');
	assert.equal(formatArtifactTime(artifact('project:p', { kind: 'project', time: { start: '2026-03', end: null } }), 'ongoing'), '2026.03 → ongoing');
});

// ---------------------------------------------------------------------------
// real content
// ---------------------------------------------------------------------------

test('real content: every public artifact is placed exactly once, inside the track', () => {
	const { export: result } = buildHunbotArtifactExport(readArtifactSources(repoRoot));
	const layout = computeAtlasLayout(result.artifacts, result.relations, { now: NOW });
	const marks = layout.lanes.flatMap((lane) => lane.marks);

	assert.equal(marks.length, result.artifacts.length);
	assert.equal(new Set(marks.map((mark) => mark.id)).size, marks.length);
	for (const mark of marks) {
		assert.ok(mark.x >= 0 && mark.x <= atlasLayoutConfig.trackWidth, `${mark.id} x=${mark.x}`);
	}
	assert.equal(layout.arcs.length, result.relations.length, 'no relation is invented or dropped');
});

// ---------------------------------------------------------------------------
// axis registry
// ---------------------------------------------------------------------------

const series = (id, title = { ko: id }) => ({ id, title });

test('axes: activity is always offered, first; unknown or unavailable requests fall back to it', () => {
	const artifacts = [artifact('writing:a')];
	assert.deepEqual(getOfferedAxes(artifacts).map((axis) => axis.id), ['activity']);
	assert.equal(resolveAxis('type', artifacts).id, 'activity', 'type is not offered while every artifact is writing');
	assert.equal(resolveAxis('nonsense', artifacts).id, 'activity');
	assert.equal(resolveAxis(null, artifacts).id, 'activity');
});

test('axes: type stays implemented but hidden until more than one artifact kind exists', () => {
	const writingOnly = [artifact('writing:a'), artifact('writing:b')];
	assert.equal(typeAxis.offered(writingOnly), false);

	const mixed = [...writingOnly, artifact('paper:p', { kind: 'paper', domain: 'learn', state: 'studied' })];
	assert.equal(typeAxis.offered(mixed), true);
	assert.deepEqual(getOfferedAxes(mixed).map((axis) => axis.id), ['activity', 'type']);
	assert.equal(resolveAxis('type', mixed).id, 'type');

	// The implementation is intact while hidden: it still lays out when asked directly.
	assert.deepEqual(
		computeAtlasLayout(writingOnly, [], { now: NOW, axis: typeAxis }).lanes.map((lane) => lane.count),
		[0, 0, 2, 0, 0, 0, 0],
	);
});

test('axes: series is offered once a series groups more than one artifact', () => {
	const singletons = [artifact('writing:a', { series: series('x') }), artifact('writing:b', { series: series('y') }), artifact('writing:c')];
	assert.equal(seriesAxis.offered(singletons), false, 'only one-post series: nothing is grouped');
	assert.equal(seriesAxis.offered([artifact('writing:a')]), false, 'no series at all');

	const grouped = [artifact('writing:a', { series: series('x') }), artifact('writing:b', { series: series('x') })];
	assert.equal(seriesAxis.offered(grouped), true);
	assert.deepEqual(getOfferedAxes(grouped).map((axis) => axis.id), ['activity', 'series']);
});

test('axes: series lanes run in the order each series began, standalone last; standalone only when needed', () => {
	const artifacts = [
		artifact('writing:late-1', { series: series('late'), time: { start: '2026-05-01' } }),
		artifact('writing:early-1', { series: series('early'), time: { start: '2025-08-10' } }),
		artifact('writing:late-2', { series: series('late'), time: { start: '2025-12-01' } }),
		artifact('writing:solo'),
	];
	// "late" began 2025-12 (its earliest post), after "early" began 2025-08.
	assert.deepEqual(seriesAxis.lanes(artifacts), ['early', 'late', STANDALONE_LANE]);
	assert.deepEqual(seriesAxis.lanesOf(artifacts[3]), [STANDALONE_LANE]);
	assert.deepEqual(seriesAxis.lanesOf(artifacts[0]), ['late']);
	assert.deepEqual(seriesAxis.lanes(artifacts.slice(0, 3)), ['early', 'late'], 'no standalone lane when every artifact has a series');

	const layout = computeAtlasLayout(artifacts, [], { now: NOW, axis: seriesAxis });
	assert.deepEqual(layout.lanes.map((lane) => [lane.key, lane.count]), [['early', 1], ['late', 2], [STANDALONE_LANE, 1]]);
	assert.equal(layout.growth.artifacts, 4);
});

test('axes: the series view keeps every mark at the same x as the default view', () => {
	const artifacts = [artifact('writing:a', { series: series('s'), time: { start: '2026-02-03' } }), artifact('writing:b', { time: { start: '2026-04-09' } })];
	const bySeries = computeAtlasLayout(artifacts, [], { now: NOW, axis: seriesAxis });
	const byActivity = layoutOf(artifacts);
	for (const id of ['writing:a', 'writing:b']) assert.equal(markOf(bySeries, id).x, markOf(byActivity, id).x);
});

test('axes: topic stays dormant until an artifact has a topic', () => {
	const noTopics = [artifact('writing:a'), artifact('writing:b')];
	assert.equal(topicAxis.offered(noTopics), false);
	assert.equal(resolveAxis('topic', noTopics).id, 'activity', 'a requested but unavailable axis falls back to the default');

	const withTopic = [...noTopics, artifact('paper:p', { kind: 'paper', domain: 'learn', topics: ['asr'] })];
	assert.deepEqual(getOfferedAxes(withTopic).map((axis) => axis.id), ['activity', 'type', 'topic']);
});

test('axes: topic lanes come from the data, most artifacts first, with an unassigned lane', () => {
	const artifacts = [
		artifact('paper:a', { kind: 'paper', domain: 'learn', topics: ['asr', 'speech-ai'] }),
		artifact('paper:b', { kind: 'paper', domain: 'learn', topics: ['asr'] }),
		artifact('writing:c'),
	];
	assert.deepEqual(topicAxis.lanes(artifacts), ['asr', 'speech-ai', UNASSIGNED_LANE]);
	assert.deepEqual(topicAxis.lanesOf(artifacts[2]), [UNASSIGNED_LANE]);

	// No artifact lacks a topic → no unassigned lane.
	assert.deepEqual(topicAxis.lanes(artifacts.slice(0, 2)), ['asr', 'speech-ai']);
});

test('axes: a multi-valued axis shows an artifact in every lane, counts per lane, distinct totals', () => {
	const artifacts = [
		artifact('paper:a', { kind: 'paper', domain: 'learn', topics: ['asr', 'speech-ai'] }),
		artifact('paper:b', { kind: 'paper', domain: 'learn', topics: ['asr'] }),
	];
	const layout = computeAtlasLayout(artifacts, [], { now: NOW, axis: topicAxis });
	assert.deepEqual(layout.lanes.map((lane) => [lane.key, lane.count]), [['asr', 2], ['speech-ai', 1]]);
	assert.equal(layout.growth.artifacts, 2, 'totals count distinct artifacts, not memberships');
	assert.equal(layout.lanes.flatMap((lane) => lane.marks).filter((mark) => mark.id === 'paper:a').length, 2);
});

test('real content: Activity and Series are offered; Type only once more than one kind is published', () => {
	const { export: result } = buildHunbotArtifactExport(readArtifactSources(repoRoot));
	const kinds = new Set(result.artifacts.map((artifact) => artifact.kind));
	const offered = getOfferedAxes(result.artifacts).map((axis) => axis.id);
	assert.deepEqual(
		offered.filter((id) => id !== 'type'),
		['activity', 'series'],
		'none has a topic, so Topic is dormant',
	);
	assert.equal(offered.includes('type'), kinds.size > 1, 'Type is offered exactly when artifacts of more than one kind are published');

	const bySeries = computeAtlasLayout(result.artifacts, result.relations, { now: NOW, axis: seriesAxis });
	assert.equal(bySeries.lanes.at(-1).key, STANDALONE_LANE);
	assert.equal(bySeries.lanes.reduce((total, lane) => total + lane.count, 0), result.artifacts.length, 'a post is in exactly one series lane');
	assert.equal(bySeries.lanes.at(-1).count, result.artifacts.filter((artifact) => !artifact.series).length);

	// Every view places every artifact exactly once and never shares a row between overlapping
	// marks, except in a lane that hit maxRows: there the layout stacks onto the emptiest row by
	// design (layout.ts), e.g. many Library resources published on one day.
	const activity = computeAtlasLayout(result.artifacts, result.relations, { now: NOW, axis: activityAxis });
	for (const layout of [activity, bySeries]) {
		for (const lane of layout.lanes) {
			if (lane.rows >= atlasLayoutConfig.maxRows) continue;
			const byRow = Map.groupBy(lane.marks, (mark) => mark.row);
			for (const marks of byRow.values()) {
				const sorted = [...marks].sort((a, b) => a.x - b.x);
				for (let i = 1; i < sorted.length; i += 1) {
					const previous = sorted[i - 1];
					assert.ok(sorted[i].x - (previous.x2 ?? previous.x) >= atlasLayoutConfig.minGap - 1e-9, `${layout.axisId}/${lane.key}: ${previous.id} and ${sorted[i].id} overlap`);
				}
			}
		}
	}
});

// ---------------------------------------------------------------------------
// legend
// ---------------------------------------------------------------------------

test('legend: only relations and types are optional, and only when currently meaningful', () => {
	assert.deepEqual(getLegendOptionals({ relationCount: 0, kindCount: 1 }), [], 'today: nothing beyond the three standing explanations');
	assert.deepEqual(getLegendOptionals({ relationCount: 3, kindCount: 1 }), ['relations']);
	assert.deepEqual(getLegendOptionals({ relationCount: 0, kindCount: 3 }), ['types']);
	assert.deepEqual(getLegendOptionals({ relationCount: 3, kindCount: 3 }), ['relations', 'types']);
});
