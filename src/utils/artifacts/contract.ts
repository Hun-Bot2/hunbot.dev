// TypeScript shape of the public artifact contract. The normative definition
// is contracts/public-artifact/public-artifact.schema.json; the vocabulary is
// src/data/publicArtifactVocabulary.ts. Pure types — no runtime code, no
// astro:content import — so Node scripts and Astro pages share them.

import type {
	ArtifactDomain,
	ArtifactKind,
	ArtifactLanguage,
	ArtifactProducer,
	PipelineStage,
	RelationBasis,
	RelationType,
} from '../../data/publicArtifactVocabulary.ts';

/**
 * Human text by language. `original` holds text whose language is not one of
 * the site languages or is not known (e.g. a paper's source title). At least
 * one key is present. A missing language is absent, never machine-filled.
 */
export type LocalizedText = Partial<Record<ArtifactLanguage | 'original', string>>;

/** `YYYY-MM-DD` or `YYYY-MM`. */
export type ArtifactDate = string;

export type ArtifactTime = {
	start: ArtifactDate;
	/** Present only on span kinds. `null` = ongoing. */
	end?: ArtifactDate | null;
};

/**
 * A series the artifact belongs to. `id` is a language-independent, lowercase
 * lane key; `title` is the series name as written per language. Every
 * artifact of one series carries the same id and the same title.
 */
export type ArtifactSeries = {
	id: string;
	title: LocalizedText;
};

export type PublicArtifact = {
	/** `<kind>:<local id>`, e.g. `writing:devlog/blog/blog_develop_11`. Hun-Bot's id, never an internal one. */
	id: string;
	kind: ArtifactKind;
	/** Always explicit and resolved — consumers never derive it. */
	domain: ArtifactDomain;
	domainsAlso: ArtifactDomain[];
	title: LocalizedText;
	summary: LocalizedText | null;
	time: ArtifactTime;
	state: string;
	/** Active Hun-Bot topic ids, already resolved through aliases and merges. */
	topics: string[];
	/** Internal site paths by language. At least one. */
	href: Partial<Record<ArtifactLanguage, string>>;
	/** The external source (papers, resources). */
	externalUrl: string | null;
	landmark: boolean;
	/** When it entered the public site, `YYYY-MM-DD`. */
	addedAt: string;
	origin: ArtifactProducer;
	/** Opaque producer reference (e.g. a Research OS item id). Never parsed or displayed by Hun-Bot. */
	sourceRef: string | null;
	/**
	 * Optional (contract v1 minor addition): the series this artifact belongs to,
	 * or null / absent when it stands alone. Hun-Bot emits it for blog writing.
	 */
	series?: ArtifactSeries | null;
};

export type PublicRelation = {
	from: string;
	to: string;
	rel: RelationType;
	basis: RelationBasis;
};

export type PublicAggregate = {
	/** `YYYY-MM`. */
	period: string;
	/** A top-level active topic id, or null for all topics. */
	topic: string | null;
	stage: PipelineStage;
	/** null = unknown, which is never the same as 0. */
	count: number | null;
	coverage: 'complete' | 'partial' | 'unknown';
};

/** One producer's output. Hun-Bot's adapters and the Research OS exporter both emit this. */
export type PublicArtifactExport = {
	contractVersion: number;
	producer: ArtifactProducer;
	generatedAt: string;
	artifacts: PublicArtifact[];
	relations: PublicRelation[];
	aggregates: PublicAggregate[];
};
