// Registry for the public artifact contract
// (contracts/public-artifact/public-artifact.schema.json,
// docs/plans/2026-10-03-explore-living-atlas.md §2). Data, not Zod enums —
// the same pattern as src/data/paperVocabularies.ts and librarySections.ts.
//
// Hun-Bot owns this vocabulary. Research OS adapts its internals to it; this
// file never mirrors a Research OS internal type. Every enum in the JSON
// Schema must equal the ids here — scripts/validate-artifacts.mjs fails the
// build when the two drift.

export const PUBLIC_ARTIFACT_CONTRACT_VERSION = 1;

export const artifactLanguages = ['ko', 'en', 'jp'] as const;
export type ArtifactLanguage = (typeof artifactLanguages)[number];

export const artifactProducers = ['hunbot', 'research-os'] as const;
export type ArtifactProducer = (typeof artifactProducers)[number];

// The five activity domains, in lane order (the loop's own order).
export const artifactDomains = ['learn', 'research', 'build', 'collect', 'create'] as const;
export type ArtifactDomain = (typeof artifactDomains)[number];

export const spanStates = ['planned', 'ongoing', 'paused', 'finished', 'abandoned'] as const;

export type ArtifactKindDefinition = {
	id: string;
	/** Used only when no override or category mapping applies. */
	defaultDomain: ArtifactDomain;
	/** `point` artifacts have no `time.end`; `span` artifacts always carry it (null = ongoing). */
	timeShape: 'point' | 'span';
	states: readonly string[];
	/** Which producers may emit this kind. */
	producers: readonly ArtifactProducer[];
};

export const artifactKinds = [
	// `selected` = an approved card the owner chose but has not yet studied (studiedAt null).
	{ id: 'paper', defaultDomain: 'learn', timeShape: 'point', states: ['selected', 'studied'], producers: ['hunbot', 'research-os'] },
	{ id: 'review', defaultDomain: 'research', timeShape: 'point', states: ['published'], producers: ['hunbot'] },
	// Writing's domain normally comes from src/data/artifactDomains.ts's category map.
	// The fallback is Learn: Create is reserved for genuinely creative artifacts.
	{ id: 'writing', defaultDomain: 'learn', timeShape: 'point', states: ['published'], producers: ['hunbot'] },
	{ id: 'project', defaultDomain: 'build', timeShape: 'span', states: spanStates, producers: ['hunbot'] },
	{ id: 'experiment', defaultDomain: 'research', timeShape: 'span', states: spanStates, producers: ['hunbot'] },
	{ id: 'resource', defaultDomain: 'collect', timeShape: 'point', states: ['published'], producers: ['hunbot', 'research-os'] },
	{ id: 'work', defaultDomain: 'create', timeShape: 'point', states: ['published'], producers: ['hunbot'] },
] as const satisfies readonly ArtifactKindDefinition[];

export type ArtifactKind = (typeof artifactKinds)[number]['id'];

/**
 * The only two ways a relation can be public. There is deliberately no
 * `candidate`, `claimed`, `inferred`, or `proposed` basis: an unverified
 * relation has no representation in the contract, so it cannot be exported
 * by accident (docs/decisions/research-discovery-system.md#Edge-Classes).
 */
export const relationBases = ['declared', 'verified'] as const;
export type RelationBasis = (typeof relationBases)[number];

/** Bases that exist privately and must never cross into the public contract. */
export const unpublishableRelationBases = ['candidate', 'claimed', 'inferred', 'proposed', 'unverified'] as const;

/**
 * Relation names that must never become public lineage edges. `relatedTo` is
 * a candidate edge wearing a verified edge's name
 * (docs/decisions/research-discovery-system.md#The-Relation-Vocabulary-Is-Deliberately-Small).
 * Listed only so the validator can say *why* it rejects them.
 */
export const unpublishableRelationNames = ['relatedTo', 'related_to', 'relatedto', 'related-to'] as const;

export type RelationTimeRule =
	/** No ordering constraint. */
	| 'none'
	/** The source starts no later than the target ends (or its point date; ongoing spans have no end). */
	| 'source-before-target-end'
	/** The target starts no earlier than the source starts. */
	| 'target-after-source-start';

export type RelationTypeDefinition = {
	id: string;
	from: readonly ArtifactKind[];
	to: readonly ArtifactKind[];
	/** Authoring convention: which side's source file declares it (the later artifact). */
	declaredOn: 'from' | 'to' | 'producer';
	bases: readonly RelationBasis[];
	/** For `verified` relations: which producers may attest them. */
	verifiedBy: readonly ArtifactProducer[];
	timeRule: RelationTimeRule;
};

export const relationTypes = [
	{
		id: 'informed',
		from: ['paper', 'resource', 'writing', 'review'],
		to: ['project', 'experiment', 'writing', 'work'],
		declaredOn: 'to',
		bases: ['declared'],
		verifiedBy: [],
		timeRule: 'source-before-target-end',
	},
	{
		// The brief's "resource usedBy project", stored in the forward direction.
		id: 'uses',
		from: ['project', 'experiment', 'work'],
		to: ['resource'],
		declaredOn: 'from',
		bases: ['declared'],
		verifiedBy: [],
		timeRule: 'none',
	},
	{
		id: 'developedInto',
		from: ['project', 'experiment'],
		to: ['project', 'experiment'],
		declaredOn: 'to',
		bases: ['declared'],
		verifiedBy: [],
		timeRule: 'target-after-source-start',
	},
	{
		id: 'resultedIn',
		from: ['project', 'experiment'],
		to: ['writing', 'work'],
		declaredOn: 'to',
		bases: ['declared'],
		verifiedBy: [],
		timeRule: 'target-after-source-start',
	},
	{
		// Exposition can come after or before the thing explained, so no time rule.
		id: 'explains',
		from: ['writing', 'review'],
		to: ['project', 'experiment', 'paper', 'work'],
		declaredOn: 'from',
		bases: ['declared'],
		verifiedBy: [],
		timeRule: 'none',
	},
	{
		// Bibliographic only: never hand-declared, only attested by Research OS.
		id: 'cites',
		from: ['paper'],
		to: ['paper'],
		declaredOn: 'producer',
		bases: ['verified'],
		verifiedBy: ['research-os'],
		timeRule: 'none',
	},
] as const satisfies readonly RelationTypeDefinition[];

export type RelationType = (typeof relationTypes)[number]['id'];

/**
 * Research OS reading-pipeline stages, in funnel order. Extensible: adding a
 * stage here is a minor (additive) contract change. Consumers ignore stages
 * they do not know, with a warning.
 */
export const pipelineStages = ['discovered', 'selected', 'reviewed', 'used'] as const;
export type PipelineStage = (typeof pipelineStages)[number];

export const aggregateCoverages = ['complete', 'partial', 'unknown'] as const;

/**
 * Aggregates are published at top-level topic granularity only (topics whose
 * `parent` is null). The contract's `topic` field is a plain topic id so a
 * deeper level can be allowed later by changing this one value, without a
 * contract change.
 */
export const aggregateTopicDepth = 'top-level' as const;

export function getArtifactKind(id: string): ArtifactKindDefinition | undefined {
	return (artifactKinds as readonly ArtifactKindDefinition[]).find((kind) => kind.id === id);
}

export function getRelationType(id: string): RelationTypeDefinition | undefined {
	return (relationTypes as readonly RelationTypeDefinition[]).find((relation) => relation.id === id);
}

export function isArtifactDomain(value: unknown): value is ArtifactDomain {
	return typeof value === 'string' && (artifactDomains as readonly string[]).includes(value);
}

export function isArtifactLanguage(value: unknown): value is ArtifactLanguage {
	return typeof value === 'string' && (artifactLanguages as readonly string[]).includes(value);
}
