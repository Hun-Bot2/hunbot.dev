// Validation of public artifact exports against the contract
// (contracts/public-artifact/public-artifact.schema.json). Hand-written
// structural checks with no JSON Schema library, matching the decision in
// scripts/validate-research-contract.mjs: dependency-free so it runs on every
// push. Inputs are `unknown` because a Research OS export is untrusted JSON.
//
// Pure: no filesystem, no astro:content. scripts/validate-artifacts.mjs reads
// the files; the tests call these functions directly.

import { buildTopicIndex } from '../../../scripts/lib/topic-resolution.mjs';
import {
	PUBLIC_ARTIFACT_CONTRACT_VERSION,
	aggregateCoverages,
	artifactDomains,
	artifactKinds,
	artifactLanguages,
	artifactProducers,
	getArtifactKind,
	getRelationType,
	isArtifactDomain,
	isArtifactLanguage,
	pipelineStages,
	relationBases,
	relationTypes,
	unpublishableRelationBases,
	unpublishableRelationNames,
	type RelationTimeRule,
} from '../../data/publicArtifactVocabulary.ts';
import type { PublicAggregate, PublicArtifact, PublicRelation } from './contract.ts';

type TopicLike = { id: string; data: { id: string; status: string; parent?: string | null; aliases?: string[]; mergedInto?: string | null } };

export type ArtifactValidationResult = {
	errors: string[];
	warnings: string[];
	artifacts: PublicArtifact[];
	relations: PublicRelation[];
	aggregates: PublicAggregate[];
};

const ARTIFACT_REQUIRED = [
	'id', 'kind', 'domain', 'domainsAlso', 'title', 'summary', 'time', 'state', 'topics',
	'href', 'externalUrl', 'landmark', 'addedAt', 'origin', 'sourceRef',
];
// Additive, optional fields (minor contract revisions): consumers that predate them ignore them.
const ARTIFACT_OPTIONAL = ['series'];
const ARTIFACT_FIELDS = [...ARTIFACT_REQUIRED, ...ARTIFACT_OPTIONAL];
const SERIES_ID = /^[^\s:?#A-Z]{1,120}$/u;
const RELATION_FIELDS = ['from', 'to', 'rel', 'basis'];
const AGGREGATE_FIELDS = ['period', 'topic', 'stage', 'count', 'coverage'];
const EXPORT_FIELDS = ['contractVersion', 'producer', 'generatedAt', 'artifacts', 'relations', 'aggregates'];
const TEXT_KEYS = [...artifactLanguages, 'original'];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const FRAGMENT = /^[A-Za-z][A-Za-z0-9_-]*$/;
// Local part of an artifact id: lowercase, no whitespace, no `:`/`?`/`#`,
// no leading or trailing `/`. Unicode letters are allowed because blog slugs
// are Korean/Japanese file names.
const LOCAL_ID = /^(?!\/)[^\s:?#A-Z]{1,200}(?<!\/)$/u;

/**
 * Validates one or more producer exports as a single public set: artifact ids
 * must be unique across producers, and a relation may point at an artifact
 * from another producer.
 */
export function validateArtifactExports(
	exports: { label: string; value: unknown }[],
	options: { topics: TopicLike[] },
): ArtifactValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const topicIndex = buildTopicIndex(options.topics.map((entry) => ({ label: entry.id, data: entry.data })));

	const artifacts: PublicArtifact[] = [];
	const relationsWithProducer: { relation: PublicRelation; producer: string; label: string }[] = [];
	const aggregates: PublicAggregate[] = [];
	const owners = new Map<string, string>();
	const seriesTitles = new Map<string, { title: string; owner: string }>();

	for (const { label, value } of exports) {
		if (!isRecord(value)) {
			errors.push(`${label}: export must be a JSON object.`);
			continue;
		}

		errors.push(...unknownFields(value, EXPORT_FIELDS, label));

		if (value.contractVersion !== PUBLIC_ARTIFACT_CONTRACT_VERSION) {
			errors.push(
				`${label}: contractVersion ${JSON.stringify(value.contractVersion)} is not supported (this build reads contract version ${PUBLIC_ARTIFACT_CONTRACT_VERSION}).`,
			);
			continue;
		}

		const producer = value.producer;
		if (!oneOf(producer, artifactProducers)) {
			errors.push(`${label}: producer must be one of ${artifactProducers.join(', ')}.`);
			continue;
		}

		if (typeof value.generatedAt !== 'string' || Number.isNaN(Date.parse(value.generatedAt))) {
			errors.push(`${label}: generatedAt must be an ISO timestamp.`);
		}

		for (const field of ['artifacts', 'relations', 'aggregates']) {
			if (!Array.isArray(value[field])) errors.push(`${label}: ${field} must be an array.`);
		}

		for (const [index, raw] of asArray(value.artifacts).entries()) {
			const where = `${label} artifacts[${index}]${isRecord(raw) && typeof raw.id === 'string' ? ` (${raw.id})` : ''}`;
			const problems = checkArtifact(raw, producer, topicIndex);
			errors.push(...problems.map((problem) => `${where}: ${problem}`));
			if (problems.length > 0 || !isRecord(raw)) continue;

			const artifact = raw as PublicArtifact;
			const owner = owners.get(artifact.id);
			if (owner) {
				errors.push(`${where}: duplicate artifact id — already emitted by ${owner}.`);
				continue;
			}
			owners.set(artifact.id, label);
			artifacts.push(artifact);

			// One series, one id, one title: lane labels must not depend on which artifact is read.
			if (artifact.series) {
				const title = JSON.stringify(Object.entries(artifact.series.title).sort());
				const known = seriesTitles.get(artifact.series.id);
				if (known && known.title !== title) {
					errors.push(`${where}: series "${artifact.series.id}" has a different title here than on ${known.owner}.`);
				} else if (!known) {
					seriesTitles.set(artifact.series.id, { title, owner: artifact.id });
				}
			}
		}

		for (const [index, raw] of asArray(value.relations).entries()) {
			const where = `${label} relations[${index}]`;
			const problems = checkRelationShape(raw, producer);
			errors.push(...problems.map((problem) => `${where}: ${problem}`));
			if (problems.length === 0) relationsWithProducer.push({ relation: raw as PublicRelation, producer, label: where });
		}

		for (const [index, raw] of asArray(value.aggregates).entries()) {
			const where = `${label} aggregates[${index}]`;
			const result = checkAggregate(raw, topicIndex);
			errors.push(...result.errors.map((problem) => `${where}: ${problem}`));
			warnings.push(...result.warnings.map((problem) => `${where}: ${problem}`));
			if (result.errors.length === 0 && result.warnings.length === 0) aggregates.push(raw as PublicAggregate);
		}
	}

	// Relation endpoints, kind pairs, time order — need the merged artifact set.
	const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
	const relations: PublicRelation[] = [];
	const seenRelations = new Set<string>();

	for (const { relation, label } of relationsWithProducer) {
		const problems = checkRelationAgainstSet(relation, byId);
		const key = `${relation.from}|${relation.rel}|${relation.to}`;
		if (problems.length === 0 && seenRelations.has(key)) problems.push('duplicate relation.');
		errors.push(...problems.map((problem) => `${label} (${relation.from} -${relation.rel}-> ${relation.to}): ${problem}`));
		if (problems.length === 0) {
			seenRelations.add(key);
			relations.push(relation);
		}
	}

	const seenCells = new Set<string>();
	for (const aggregate of aggregates) {
		const key = `${aggregate.period}|${aggregate.topic}|${aggregate.stage}`;
		if (seenCells.has(key)) errors.push(`aggregate ${key}: duplicate (period, topic, stage) cell.`);
		seenCells.add(key);
	}

	return { errors, warnings, artifacts, relations, aggregates };
}

// ---------------------------------------------------------------------------
// artifacts
// ---------------------------------------------------------------------------

function checkArtifact(raw: unknown, producer: string, topicIndex: ReturnType<typeof buildTopicIndex>): string[] {
	if (!isRecord(raw)) return ['artifact must be an object.'];
	const problems = unknownFields(raw, ARTIFACT_FIELDS, 'artifact');

	const kind = typeof raw.kind === 'string' ? getArtifactKind(raw.kind) : undefined;
	if (!kind) {
		problems.push(`kind ${JSON.stringify(raw.kind)} is not one of ${artifactKinds.map((entry) => entry.id).join(', ')}.`);
		return problems;
	}

	if (typeof raw.id !== 'string') {
		problems.push('id must be a string.');
	} else {
		const [prefix, ...rest] = raw.id.split(':');
		const local = rest.join(':');
		if (prefix !== kind.id || rest.length !== 1 || !LOCAL_ID.test(local)) {
			problems.push(`id must be "${kind.id}:<local id>" with a lowercase local id (no spaces, ":", "?", "#", or edge slashes).`);
		}
	}

	if (raw.origin !== producer) problems.push(`origin ${JSON.stringify(raw.origin)} must equal the export's producer "${producer}".`);
	if (!kind.producers.includes(producer as never)) problems.push(`producer "${producer}" may not emit kind "${kind.id}".`);

	if (!isArtifactDomain(raw.domain)) {
		problems.push(`domain must be an explicit, resolved domain (${artifactDomains.join(', ')}); got ${JSON.stringify(raw.domain)}.`);
	}
	if (!Array.isArray(raw.domainsAlso) || !raw.domainsAlso.every(isArtifactDomain)) {
		problems.push('domainsAlso must be an array of domains.');
	} else if ((raw.domainsAlso as string[]).includes(raw.domain as string) || new Set(raw.domainsAlso).size !== raw.domainsAlso.length) {
		problems.push('domainsAlso must not repeat the primary domain or itself.');
	}

	problems.push(...checkText(raw.title, 'title', true));
	if (raw.summary !== null) problems.push(...checkText(raw.summary, 'summary', true));

	problems.push(...checkTime(raw.time, kind.timeShape));
	if (typeof raw.state !== 'string' || !kind.states.includes(raw.state)) {
		problems.push(`state ${JSON.stringify(raw.state)} is not valid for ${kind.id} (${kind.states.join(', ')}).`);
	}

	if (!Array.isArray(raw.topics)) {
		problems.push('topics must be an array.');
	} else {
		for (const topic of raw.topics) {
			const entry = typeof topic === 'string' ? topicIndex.topicById.get(topic) : undefined;
			if (!entry || entry.data.status !== 'active') {
				problems.push(`topic ${JSON.stringify(topic)} is not an active topic id (emit resolved ids, not aliases or archived topics).`);
			}
		}
		if (new Set(raw.topics).size !== raw.topics.length) problems.push('topics must not repeat.');
	}

	if (!isRecord(raw.href) || Object.keys(raw.href).length === 0) {
		problems.push('href must map at least one language to an internal path.');
	} else {
		for (const [lang, href] of Object.entries(raw.href)) {
			if (!isArtifactLanguage(lang)) {
				problems.push(`href has unknown language "${lang}".`);
				continue;
			}
			const [path, fragment, ...extra] = typeof href === 'string' ? href.split('#') : [];
			const validPath = typeof path === 'string' && path.startsWith(`/${lang}/`) && path.endsWith('/') && !path.includes('//');
			const validFragment = fragment === undefined || FRAGMENT.test(fragment);
			if (!validPath || !validFragment || extra.length > 0) {
				problems.push(`href.${lang} must be an internal path starting with "/${lang}/" and ending with "/", optionally followed by "#<anchor>".`);
			}
		}
	}

	if (raw.externalUrl !== null && !(typeof raw.externalUrl === 'string' && /^https?:\/\/\S+$/.test(raw.externalUrl))) {
		problems.push('externalUrl must be an http(s) URL or null.');
	}
	if (typeof raw.landmark !== 'boolean') problems.push('landmark must be a boolean.');
	if (!isDay(raw.addedAt)) problems.push('addedAt must be a valid YYYY-MM-DD date.');
	if (raw.sourceRef !== null && !(typeof raw.sourceRef === 'string' && raw.sourceRef.length > 0 && raw.sourceRef.length <= 128)) {
		problems.push('sourceRef must be null or an opaque string of at most 128 characters.');
	}

	if ('series' in raw && raw.series !== null) {
		if (!isRecord(raw.series)) {
			problems.push('series must be null or { id, title }.');
		} else {
			problems.push(...unknownFields(raw.series, ['id', 'title'], 'series'));
			if (typeof raw.series.id !== 'string' || !SERIES_ID.test(raw.series.id)) {
				problems.push('series.id must be a lowercase lane key with no spaces, ":", "?", or "#".');
			}
			problems.push(...checkText(raw.series.title, 'series.title', true));
		}
	}

	return problems;
}

function checkText(value: unknown, field: string, required: boolean): string[] {
	if (!isRecord(value)) return required ? [`${field} must be an object of text by language.`] : [];
	const problems: string[] = [];
	const keys = Object.keys(value);
	if (keys.length === 0) problems.push(`${field} must contain at least one language.`);
	for (const key of keys) {
		if (!TEXT_KEYS.includes(key)) problems.push(`${field} has unknown key "${key}" (allowed: ${TEXT_KEYS.join(', ')}).`);
		else if (typeof value[key] !== 'string' || !(value[key] as string).trim()) problems.push(`${field}.${key} must be non-empty text.`);
	}
	return problems;
}

function checkTime(value: unknown, shape: 'point' | 'span'): string[] {
	if (!isRecord(value)) return ['time must be an object.'];
	const problems = unknownFields(value, ['start', 'end'], 'time');
	if (!isArtifactDate(value.start)) problems.push('time.start must be YYYY-MM-DD or YYYY-MM.');

	if (shape === 'point') {
		if ('end' in value) problems.push('time.end is only allowed on span kinds.');
	} else if (!('end' in value)) {
		problems.push('time.end is required on span kinds (null = ongoing).');
	} else if (value.end !== null) {
		if (!isArtifactDate(value.end)) problems.push('time.end must be YYYY-MM-DD, YYYY-MM, or null.');
		else if (isArtifactDate(value.start) && compareDates(value.end, value.start) < 0) problems.push('time.end is before time.start.');
	}
	return problems;
}

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

function checkRelationShape(raw: unknown, producer: string): string[] {
	if (!isRecord(raw)) return ['relation must be an object.'];
	const problems = unknownFields(raw, RELATION_FIELDS, 'relation');

	if (typeof raw.from !== 'string' || typeof raw.to !== 'string') problems.push('from and to must be artifact ids.');

	const rel = raw.rel;
	const relationType = typeof rel === 'string' ? getRelationType(rel) : undefined;
	if (typeof rel === 'string' && isUnpublishableRelationName(rel)) {
		problems.push(
			`relation "${rel}" is never public: unverified relatedness does not become a lineage edge. Use a declared relation (${relationTypes.map((entry) => entry.id).join(', ')}) or a verified "cites".`,
		);
		return problems;
	}
	if (!relationType) {
		problems.push(`unknown relation ${JSON.stringify(rel)} (allowed: ${relationTypes.map((entry) => entry.id).join(', ')}).`);
		return problems;
	}

	const basis = raw.basis;
	if (typeof basis === 'string' && (unpublishableRelationBases as readonly string[]).includes(basis)) {
		problems.push(`basis "${basis}" is never public: only ${relationBases.join(' or ')} relations cross into the public contract.`);
		return problems;
	}
	if (!oneOf(basis, relationBases)) {
		problems.push(`basis ${JSON.stringify(basis)} must be one of ${relationBases.join(', ')}.`);
		return problems;
	}
	if (!relationType.bases.includes(basis)) {
		problems.push(`"${relationType.id}" relations must be ${relationType.bases.join(' or ')}, not ${basis}.`);
	}
	if (basis === 'verified' && !relationType.verifiedBy.includes(producer as never)) {
		problems.push(`producer "${producer}" cannot attest a verified "${relationType.id}" relation.`);
	}

	return problems;
}

function checkRelationAgainstSet(relation: PublicRelation, byId: Map<string, PublicArtifact>): string[] {
	const problems: string[] = [];
	const from = byId.get(relation.from);
	const to = byId.get(relation.to);
	if (!from) problems.push(`from "${relation.from}" is not a public artifact.`);
	if (!to) problems.push(`to "${relation.to}" is not a public artifact.`);
	if (!from || !to) return problems;

	if (relation.from === relation.to) problems.push('a relation cannot point at its own artifact.');

	const type = getRelationType(relation.rel)!;
	if (!type.from.includes(from.kind)) problems.push(`"${type.id}" cannot start at a ${from.kind} (allowed: ${type.from.join(', ')}).`);
	if (!type.to.includes(to.kind)) problems.push(`"${type.id}" cannot end at a ${to.kind} (allowed: ${type.to.join(', ')}).`);

	const timeProblem = checkTimeRule(type.timeRule, from, to);
	if (timeProblem) problems.push(timeProblem);
	return problems;
}

function checkTimeRule(rule: RelationTimeRule, from: PublicArtifact, to: PublicArtifact): string | null {
	if (rule === 'source-before-target-end') {
		const targetEnd = to.time.end === undefined ? to.time.start : to.time.end;
		if (targetEnd !== null && compareDates(from.time.start, targetEnd) > 0) {
			return `time order: ${from.id} (${from.time.start}) starts after ${to.id} ended (${targetEnd}).`;
		}
	}
	if (rule === 'target-after-source-start' && compareDates(to.time.start, from.time.start) < 0) {
		return `time order: ${to.id} (${to.time.start}) starts before ${from.id} (${from.time.start}).`;
	}
	return null;
}

// ---------------------------------------------------------------------------
// aggregates
// ---------------------------------------------------------------------------

function checkAggregate(raw: unknown, topicIndex: ReturnType<typeof buildTopicIndex>): { errors: string[]; warnings: string[] } {
	if (!isRecord(raw)) return { errors: ['aggregate must be an object.'], warnings: [] };
	const errors = unknownFields(raw, AGGREGATE_FIELDS, 'aggregate');
	const warnings: string[] = [];

	if (typeof raw.period !== 'string' || !MONTH.test(raw.period) || !isArtifactDate(raw.period)) errors.push('period must be YYYY-MM.');

	if (raw.topic !== null) {
		const entry = typeof raw.topic === 'string' ? topicIndex.topicById.get(raw.topic) : undefined;
		if (!entry || entry.data.status !== 'active') {
			errors.push(`topic ${JSON.stringify(raw.topic)} is not an active topic id.`);
		} else if (entry.data.parent) {
			errors.push(`topic "${raw.topic}" is not top-level: aggregates are published for top-level topics only (or null for all topics).`);
		}
	}

	if (!oneOf(raw.stage, pipelineStages)) {
		// Additive stages are allowed by the contract; this build ignores ones it does not know.
		warnings.push(`stage ${JSON.stringify(raw.stage)} is not known to this build and is ignored.`);
	}

	if (raw.count !== null && !(Number.isInteger(raw.count) && (raw.count as number) >= 0)) {
		errors.push('count must be a non-negative integer, or null for unknown.');
	}
	if (!oneOf(raw.coverage, aggregateCoverages)) errors.push(`coverage must be one of ${aggregateCoverages.join(', ')}.`);
	if (raw.count === null && raw.coverage === 'complete') errors.push('a null (unknown) count cannot have complete coverage.');

	return { errors, warnings };
}

// ---------------------------------------------------------------------------
// schema ⇄ vocabulary drift
// ---------------------------------------------------------------------------

/**
 * The JSON Schema is the normative contract document; the vocabulary file is
 * what code reads. They must list the same values.
 */
export function checkSchemaMatchesVocabulary(schema: unknown): string[] {
	if (!isRecord(schema) || !isRecord(schema.$defs)) return ['schema must have $defs.'];
	const defs = schema.$defs as Record<string, any>;
	const errors: string[] = [];
	const expect = (label: string, actual: unknown, expected: readonly unknown[]) => {
		const actualList = Array.isArray(actual) ? [...actual].sort() : actual;
		if (JSON.stringify(actualList) !== JSON.stringify([...expected].sort())) {
			errors.push(`schema ${label} is ${JSON.stringify(actual)}, vocabulary has ${JSON.stringify(expected)}.`);
		}
	};

	const xContract = (schema as Record<string, any>)['x-contract'];
	if (xContract?.version !== PUBLIC_ARTIFACT_CONTRACT_VERSION) {
		errors.push(`schema x-contract.version ${JSON.stringify(xContract?.version)} ≠ PUBLIC_ARTIFACT_CONTRACT_VERSION ${PUBLIC_ARTIFACT_CONTRACT_VERSION}.`);
	}
	expect('$defs.export.properties.contractVersion.const', [defs.export?.properties?.contractVersion?.const], [PUBLIC_ARTIFACT_CONTRACT_VERSION]);
	expect('$defs.producer.enum', defs.producer?.enum, artifactProducers);
	expect('$defs.domain.enum', defs.domain?.enum, artifactDomains);
	expect('$defs.artifact.properties.kind.enum', defs.artifact?.properties?.kind?.enum, artifactKinds.map((entry) => entry.id));
	for (const kind of artifactKinds) {
		expect(`$defs.artifact.properties.kind.x-producers.${kind.id}`, defs.artifact?.properties?.kind?.['x-producers']?.[kind.id], kind.producers);
	}
	expect('$defs.relation.properties.rel.enum', defs.relation?.properties?.rel?.enum, relationTypes.map((entry) => entry.id));
	expect('$defs.relation.properties.basis.enum', defs.relation?.properties?.basis?.enum, relationBases);
	expect('$defs.aggregate.properties.coverage.enum', defs.aggregate?.properties?.coverage?.enum, aggregateCoverages);
	expect('$defs.aggregate.properties.stage.examples', defs.aggregate?.properties?.stage?.examples, pipelineStages);
	expect('$defs.localizedText.propertyNames.enum', defs.localizedText?.propertyNames?.enum, TEXT_KEYS);
	expect('$defs.artifact.required', defs.artifact?.required, ARTIFACT_REQUIRED);
	expect('$defs.artifact.properties (keys)', Object.keys(defs.artifact?.properties ?? {}), ARTIFACT_FIELDS);
	expect('$defs.relation.required', defs.relation?.required, RELATION_FIELDS);
	expect('$defs.aggregate.required', defs.aggregate?.required, AGGREGATE_FIELDS);

	// The only place an unverified relation name or basis may appear is the
	// documentary `x-never` list on $defs.relation.
	const { 'x-never': _never, ...relationWithoutNever } = defs.relation ?? {};
	const searchable = JSON.stringify({ ...defs, relation: relationWithoutNever });
	for (const forbidden of [...unpublishableRelationNames, ...unpublishableRelationBases]) {
		if (searchable.includes(`"${forbidden}"`)) {
			errors.push(`schema contains the value "${forbidden}" — unverified relations must have no representation in the contract.`);
		}
	}
	return errors;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function isUnpublishableRelationName(rel: string): boolean {
	const normalize = (name: string) => name.toLowerCase().replace(/[-_]/g, '');
	return unpublishableRelationNames.some((name) => normalize(name) === normalize(rel));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
	return typeof value === 'string' && (options as readonly string[]).includes(value);
}

function unknownFields(value: Record<string, unknown>, allowed: string[], label: string): string[] {
	return Object.keys(value)
		.filter((key) => !allowed.includes(key))
		.map((key) => `${label} has unknown field "${key}" (the contract is closed; add fields through a contract version).`);
}

function isDay(value: unknown): value is string {
	return typeof value === 'string' && DAY.test(value) && isArtifactDate(value);
}

/** YYYY-MM-DD or YYYY-MM, and a real calendar date. */
export function isArtifactDate(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	const full = MONTH.test(value) ? `${value}-01` : value;
	if (!DAY.test(full)) return false;
	const parsed = new Date(`${full}T00:00:00Z`);
	return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === full;
}

/** Compares at the coarser of the two precisions, so "2025-03" equals "2025-03-14". */
export function compareDates(a: string, b: string): number {
	const length = Math.min(a.length, b.length);
	const left = a.slice(0, length);
	const right = b.slice(0, length);
	return left < right ? -1 : left > right ? 1 : 0;
}
