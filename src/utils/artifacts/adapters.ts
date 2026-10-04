// Adapters: existing Hun-Bot collections → public artifact contract
// (docs/plans/2026-10-03-explore-living-atlas.md §2).
//
// Pure functions over plain `{ id, data }` entries — the shape getCollection()
// returns and the shape scripts/lib/read-artifact-sources.mjs reproduces for
// Node scripts — so the site and the validators build the identical set.
//
// Each adapter applies its collection's existing definition of "published"
// (getAllPosts' rules, getPublishedAcademicReviews, isApprovedPaper,
// isApprovedResource, picks' draft flag). Nothing unpublished becomes an
// artifact, and a relation to something unpublished is withheld and reported,
// never emitted dangling.

import { buildTopicIndex, resolveToActiveTopicId } from '../../../scripts/lib/topic-resolution.mjs';
import { artifactDomainOverrides, blogCategoryDomains } from '../../data/artifactDomains.ts';
import {
	PUBLIC_ARTIFACT_CONTRACT_VERSION,
	artifactLanguages,
	getArtifactKind,
	isArtifactLanguage,
	type ArtifactDomain,
	type ArtifactKind,
	type ArtifactLanguage,
} from '../../data/publicArtifactVocabulary.ts';
import {
	getAcademicReviewLanguageFromId,
	getAcademicReviewSlugFromId,
	getAcademicReviewUrlFromId,
} from '../academic-review-routing.ts';
import { selectPublishedPosts } from '../blog-publishing.ts';
import { getPaperUrl } from '../library.ts';
import { buildSeriesIndex, type InconsistentSeries } from './series.ts';
import { getBlogLanguageFromId, getBlogSlugFromId, getBlogUrlFromId } from '../blog-routing.ts';
import type { ArtifactSeries, LocalizedText, PublicArtifact, PublicArtifactExport, PublicRelation } from './contract.ts';

// ---------------------------------------------------------------------------
// Source entry shapes (the fields adapters read; extra fields are ignored)
// ---------------------------------------------------------------------------

type Entry<D> = { id: string; data: D };
type DateLike = Date | string;

export type BlogSource = Entry<{
	title: string;
	description?: string;
	pubDate: Date;
	tags?: string[];
	category?: string;
	series?: string;
	draft?: boolean;
	papers?: string[];
}>;

export type AcademicReviewSource = Entry<{
	title: string;
	pubDate: Date;
	draft?: boolean;
	paperId?: string;
}>;

export type PaperSource = Entry<{
	id: string;
	itemId: string;
	title: string;
	url: string;
	topics?: string[];
	status: string;
	review: { humanReviewed: boolean; reviewedAt?: string | null };
	source: { firstSeenAt: string };
	summary?: Partial<Record<ArtifactLanguage, { tldr?: string }>>;
	studiedAt?: string | null;
}>;

export type PickSource = Entry<{
	title: string;
	url: string;
	section: string;
	addedAt: DateLike;
	draft?: boolean;
}>;

export type ResourceSource = Entry<{
	id: string;
	title: string;
	url: string;
	status: string;
	review: { humanReviewed: boolean };
	summary?: Partial<Record<ArtifactLanguage, string>>;
	relatedTopics?: string[];
	publishedAt?: string;
	source: { firstSeenAt: string };
}>;

export type TopicSource = Entry<{
	id: string;
	status: string;
	parent?: string | null;
	aliases?: string[];
	mergedInto?: string | null;
}>;

export type HunbotSources = {
	blog: BlogSource[];
	academicReviews: AcademicReviewSource[];
	papers: PaperSource[];
	picks: PickSource[];
	resources: ResourceSource[];
	topics: TopicSource[];
};

// ---------------------------------------------------------------------------
// Report: what the adapters decided, for review — never part of the contract
// ---------------------------------------------------------------------------

export type DomainBasis = 'explicit' | 'override' | 'category' | 'kind-default';

export type AdapterReport = {
	domainBasis: Record<DomainBasis, number>;
	/** Published blog categories with no entry in blogCategoryDomains, with post counts. */
	unmappedCategories: Record<string, number>;
	/** Declared links that were not emitted, with the reason. */
	withheldRelations: { from: string; to: string; rel: string; reason: string }[];
	/** Topic references on published items that do not resolve to an active topic. */
	unresolvedTopics: { artifact: string; topic: string }[];
	/** Override keys that match no published artifact. */
	unusedOverrides: string[];
	/** Series spelled more than one way in one language (see series.ts); linked, but worth fixing in frontmatter. */
	inconsistentSeries: InconsistentSeries[];
};

// ---------------------------------------------------------------------------
// Domain resolution
// ---------------------------------------------------------------------------

/**
 * explicit item field → per-id override → (writing) category map → kind default.
 * Always returns a concrete domain; the emitted artifact carries it explicitly.
 */
export function resolveArtifactDomain(
	input: {
		id: string;
		kind: ArtifactKind;
		explicit?: ArtifactDomain | null;
		category?: string | null;
	},
	tables: {
		overrides: Readonly<Record<string, ArtifactDomain>>;
		categories: Readonly<Record<string, ArtifactDomain>>;
	} = { overrides: artifactDomainOverrides, categories: blogCategoryDomains },
): { domain: ArtifactDomain; basis: DomainBasis } {
	if (input.explicit) return { domain: input.explicit, basis: 'explicit' };

	const override = tables.overrides[input.id];
	if (override) return { domain: override, basis: 'override' };

	if (input.kind === 'writing' && input.category) {
		const mapped = tables.categories[normalizeCategoryKey(input.category)];
		if (mapped) return { domain: mapped, basis: 'category' };
	}

	const kind = getArtifactKind(input.kind);
	if (!kind) throw new Error(`Unknown artifact kind "${input.kind}".`);
	return { domain: kind.defaultDomain, basis: 'kind-default' };
}

export function normalizeCategoryKey(category: string): string {
	return category.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Build the Hun-Bot export
// ---------------------------------------------------------------------------

export function buildHunbotArtifactExport(
	sources: HunbotSources,
	options: { generatedAt?: string } = {},
): { export: PublicArtifactExport; report: AdapterReport } {
	const report: AdapterReport = {
		domainBasis: { explicit: 0, override: 0, category: 0, 'kind-default': 0 },
		unmappedCategories: {},
		withheldRelations: [],
		unresolvedTopics: [],
		unusedOverrides: [],
		inconsistentSeries: [],
	};
	const topicIndex = buildTopicIndex(sources.topics.map((entry) => ({ label: entry.id, data: entry.data })));
	const blogGroups = groupPublishedPosts(sources.blog);
	const series = buildSeriesIndex(
		new Map([...blogGroups].map(([slug, posts]) => [slug, posts.map((post) => ({ lang: getBlogLanguageFromId(post.id) as ArtifactLanguage, series: post.data.series }))])),
	);
	report.inconsistentSeries = series.inconsistent;
	const context: AdapterContext = { report, topicIndex, series: series.bySlug };

	const artifacts: PublicArtifact[] = [];
	const pending: PendingRelation[] = [];

	for (const result of [
		...adaptBlogPosts(sources.blog, context),
		...adaptAcademicReviews(sources.academicReviews, context),
		...adaptPapers(sources.papers, context),
		...adaptPicks(sources.picks, context),
		...adaptResources(sources.resources, context),
	]) {
		artifacts.push(result.artifact);
		pending.push(...result.relations);
	}

	const publicIds = new Set(artifacts.map((artifact) => artifact.id));
	const relations: PublicRelation[] = [];
	const seen = new Set<string>();

	for (const relation of pending) {
		const missing = [relation.from, relation.to].find((id) => !publicIds.has(id));
		if (missing) {
			report.withheldRelations.push({
				...relation,
				reason: `${missing} is not a published artifact (draft, unapproved, or unknown)`,
			});
			continue;
		}

		const key = `${relation.from}|${relation.rel}|${relation.to}`;
		if (seen.has(key)) continue;
		seen.add(key);
		relations.push({ ...relation, basis: 'declared' });
	}

	report.unusedOverrides = Object.keys(artifactDomainOverrides).filter((id) => !publicIds.has(id));

	return {
		export: {
			contractVersion: PUBLIC_ARTIFACT_CONTRACT_VERSION,
			producer: 'hunbot',
			generatedAt: options.generatedAt ?? new Date().toISOString(),
			artifacts: artifacts.sort((a, b) => compareStrings(a.id, b.id)),
			relations: relations.sort((a, b) =>
				compareStrings(`${a.from}|${a.rel}|${a.to}`, `${b.from}|${b.rel}|${b.to}`),
			),
			aggregates: [],
		},
		report,
	};
}

type AdapterContext = {
	report: AdapterReport;
	topicIndex: ReturnType<typeof buildTopicIndex>;
	/** Series of every published post slug (see series.ts). */
	series: Map<string, ArtifactSeries | null>;
};

/** Published blog posts grouped by slug; translations of one post share a group. */
function groupPublishedPosts(posts: BlogSource[]): Map<string, BlogSource[]> {
	return groupBy(selectPublishedPosts(posts), (post) => getBlogSlugFromId(post.id));
}

type PendingRelation = Omit<PublicRelation, 'basis'>;
type AdapterResult = { artifact: PublicArtifact; relations: PendingRelation[] };

// ---------------------------------------------------------------------------
// blog → writing (translations sharing a slug become one artifact)
// ---------------------------------------------------------------------------

export function adaptBlogPosts(posts: BlogSource[], context: AdapterContext): AdapterResult[] {
	const groups = groupPublishedPosts(posts);

	return [...groups].map(([slug, translations]) => {
		const byLang = indexByLanguage(translations, (post) => getBlogLanguageFromId(post.id));
		const canonical = pickCanonical(byLang);
		const id = `writing:${slug}`;
		const category = canonical.data.category?.trim() || null;
		const domain = resolveDomain(context, { id, kind: 'writing', category });

		if (domain.basis === 'kind-default' && category) {
			const key = normalizeCategoryKey(category);
			context.report.unmappedCategories[key] = (context.report.unmappedCategories[key] ?? 0) + 1;
		}

		const paperIds = new Set(translations.flatMap((post) => post.data.papers ?? []));

		return {
			artifact: {
				id,
				kind: 'writing',
				domain: domain.domain,
				domainsAlso: [],
				title: localized(byLang, (post) => post.data.title),
				summary: nonEmpty(localized(byLang, (post) => post.data.description)),
				time: { start: toIsoDate(canonical.data.pubDate) },
				state: 'published',
				topics: [],
				href: hrefs(byLang, (post) => getBlogUrlFromId(post.id)),
				externalUrl: null,
				landmark: false,
				addedAt: toIsoDate(canonical.data.pubDate),
				origin: 'hunbot',
				sourceRef: null,
				series: context.series.get(slug) ?? null,
			},
			relations: [...paperIds].map((paperId) => ({ from: id, to: `paper:${paperId}`, rel: 'explains' as const })),
		};
	});
}

// ---------------------------------------------------------------------------
// academicReviews → review
// ---------------------------------------------------------------------------

export function adaptAcademicReviews(reviews: AcademicReviewSource[], context: AdapterContext): AdapterResult[] {
	const published = reviews.filter((review) => !review.data.draft);
	const groups = groupBy(published, (review) => getAcademicReviewSlugFromId(review.id));

	return [...groups].map(([slug, translations]) => {
		const byLang = indexByLanguage(translations, (review) => getAcademicReviewLanguageFromId(review.id));
		const canonical = pickCanonical(byLang);
		const id = `review:${slug}`;
		const domain = resolveDomain(context, { id, kind: 'review' });
		const paperIds = new Set(translations.map((review) => review.data.paperId).filter(isString));

		return {
			artifact: {
				id,
				kind: 'review',
				domain: domain.domain,
				domainsAlso: [],
				title: localized(byLang, (review) => review.data.title),
				summary: null,
				time: { start: toIsoDate(canonical.data.pubDate) },
				state: 'published',
				topics: [],
				href: hrefs(byLang, (review) => getAcademicReviewUrlFromId(review.id)),
				externalUrl: null,
				landmark: false,
				addedAt: toIsoDate(canonical.data.pubDate),
				origin: 'hunbot',
				sourceRef: null,
			},
			relations: [...paperIds].map((paperId) => ({ from: id, to: `paper:${paperId}`, rel: 'explains' as const })),
		};
	});
}

// ---------------------------------------------------------------------------
// papers → paper (approved + human-reviewed cards only)
// ---------------------------------------------------------------------------

export function adaptPapers(papers: PaperSource[], context: AdapterContext): AdapterResult[] {
	return papers
		.filter((paper) => paper.data.status === 'approved' && paper.data.review.humanReviewed === true)
		.map((paper) => {
			const id = `paper:${paper.data.id}`;
			const listedAt = paper.data.review.reviewedAt ?? paper.data.source.firstSeenAt;
			const summary: LocalizedText = {};
			for (const lang of artifactLanguages) {
				const tldr = paper.data.summary?.[lang]?.tldr?.trim();
				if (tldr) summary[lang] = tldr;
			}

			return {
				artifact: {
					id,
					kind: 'paper',
					domain: resolveDomain(context, { id, kind: 'paper' }).domain,
					domainsAlso: [],
					title: { original: paper.data.title },
					summary: nonEmpty(summary),
					// Studied papers sit at their study date; a selected-but-unstudied
					// card sits at the date it was listed.
					time: { start: paper.data.studiedAt ?? listedAt },
					state: paper.data.studiedAt ? 'studied' : 'selected',
					topics: resolveTopics(context, id, paper.data.topics ?? []),
					// Paper cards have no page of their own: link to the row's anchor on the Research hub.
					href: everyLanguage((lang) => getPaperUrl(lang, paper.data.id)),
					externalUrl: paper.data.url,
					landmark: false,
					addedAt: listedAt,
					origin: 'hunbot',
					// The Research OS join key travels opaquely; Hun-Bot never reads it.
					sourceRef: paper.data.itemId,
				},
				relations: [],
			};
		});
}

// ---------------------------------------------------------------------------
// picks → resource (Library 외부 링크)
// ---------------------------------------------------------------------------

export function adaptPicks(picks: PickSource[], context: AdapterContext): AdapterResult[] {
	return picks
		.filter((pick) => !pick.data.draft)
		.map((pick) => {
			const slug = pick.id.split('/').pop() ?? pick.id;
			const id = `resource:${slug}`;
			const addedAt = toIsoDate(pick.data.addedAt);

			return {
				artifact: {
					id,
					kind: 'resource',
					domain: resolveDomain(context, { id, kind: 'resource' }).domain,
					domainsAlso: [],
					title: { original: pick.data.title },
					// The owner's note is the Markdown body, not frontmatter; it is not
					// summarized or truncated here.
					summary: null,
					time: { start: addedAt },
					state: 'published',
					topics: [],
					href: everyLanguage((lang) => `/${lang}/library/${pick.data.section}/`),
					externalUrl: pick.data.url,
					landmark: false,
					addedAt,
					origin: 'hunbot',
					sourceRef: null,
				},
				relations: [],
			};
		});
}

// ---------------------------------------------------------------------------
// resources → resource (Library Useful Feeds; approved + human-reviewed only)
// ---------------------------------------------------------------------------

export function adaptResources(resources: ResourceSource[], context: AdapterContext): AdapterResult[] {
	return resources
		.filter((resource) => resource.data.status === 'approved' && resource.data.review.humanReviewed === true)
		.map((resource) => {
			const id = `resource:${resource.data.id}`;
			const summary: LocalizedText = {};
			for (const lang of artifactLanguages) {
				const text = resource.data.summary?.[lang]?.trim();
				if (text) summary[lang] = text;
			}

			return {
				artifact: {
					id,
					kind: 'resource',
					domain: resolveDomain(context, { id, kind: 'resource' }).domain,
					domainsAlso: [],
					title: { original: resource.data.title },
					summary: nonEmpty(summary),
					time: { start: resource.data.publishedAt ?? resource.data.source.firstSeenAt },
					state: 'published',
					topics: resolveTopics(context, id, resource.data.relatedTopics ?? []),
					href: everyLanguage((lang) => `/${lang}/library/useful-feeds/`),
					externalUrl: resource.data.url,
					landmark: false,
					addedAt: resource.data.source.firstSeenAt,
					origin: 'hunbot',
					sourceRef: null,
				},
				relations: [],
			};
		});
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function resolveDomain(
	context: AdapterContext,
	input: Parameters<typeof resolveArtifactDomain>[0],
): ReturnType<typeof resolveArtifactDomain> {
	const resolved = resolveArtifactDomain(input);
	context.report.domainBasis[resolved.basis] += 1;
	return resolved;
}

function resolveTopics(context: AdapterContext, artifactId: string, references: string[]): string[] {
	const resolved: string[] = [];
	for (const reference of references) {
		const topicId = resolveToActiveTopicId(reference, context.topicIndex);
		if (topicId === null) {
			context.report.unresolvedTopics.push({ artifact: artifactId, topic: reference });
		} else if (!resolved.includes(topicId)) {
			resolved.push(topicId);
		}
	}
	return resolved;
}

export function toIsoDate(value: DateLike): string {
	if (value instanceof Date) {
		if (Number.isNaN(value.valueOf())) throw new Error('Invalid date.');
		return value.toISOString().slice(0, 10);
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	throw new Error(`Expected a YYYY-MM-DD date, got "${value}".`);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const groupKey = key(item);
		groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
	}
	return groups;
}

function indexByLanguage<T>(items: T[], language: (item: T) => string): Map<ArtifactLanguage, T> {
	const byLang = new Map<ArtifactLanguage, T>();
	for (const item of items) {
		const lang = language(item);
		if (isArtifactLanguage(lang)) byLang.set(lang, item);
	}
	return byLang;
}

/** Korean is the primary language; translations follow. */
function pickCanonical<T>(byLang: Map<ArtifactLanguage, T>): T {
	for (const lang of ['ko', 'en', 'jp'] as const) {
		const entry = byLang.get(lang);
		if (entry) return entry;
	}
	throw new Error('Empty translation group.');
}

function localized<T>(byLang: Map<ArtifactLanguage, T>, text: (item: T) => string | undefined): LocalizedText {
	const result: LocalizedText = {};
	for (const [lang, item] of byLang) {
		const value = text(item)?.trim();
		if (value) result[lang] = value;
	}
	return result;
}

function hrefs<T>(byLang: Map<ArtifactLanguage, T>, href: (item: T) => string): Partial<Record<ArtifactLanguage, string>> {
	const result: Partial<Record<ArtifactLanguage, string>> = {};
	for (const [lang, item] of byLang) result[lang] = href(item);
	return result;
}

function everyLanguage(href: (lang: ArtifactLanguage) => string): Partial<Record<ArtifactLanguage, string>> {
	return Object.fromEntries(artifactLanguages.map((lang) => [lang, href(lang)]));
}

function nonEmpty(text: LocalizedText): LocalizedText | null {
	return Object.keys(text).length > 0 ? text : null;
}

function isString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

function compareStrings(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}
