import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

import { isLibrarySectionSlug } from './data/librarySections';
import { isPickKind, isPickTierId } from './data/libraryPolicy';

const slugSafeString = z
	.string()
	.regex(/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/, 'Use lowercase letters, numbers, and hyphens only.');
// Canonical research-item identity
// (docs/decisions/research-item-identity.md#Canonical-Item-Identity): opaque,
// minted once, never derived from mutable metadata. 30 characters fixed
// length — "itm-" plus a 26-character lowercase Crockford-base32 ULID.
const itemIdString = z
	.string()
	.regex(
		/^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$/,
		'itemId must be "itm-" followed by 26 lowercase Crockford-base32 characters.',
	);
const shortSlugString = z
	.string()
	.regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'Use a short lowercase slug.');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
// `picks` frontmatter is plain YAML (unlike resources/papers/topics' JSON
// frontmatter), so an unquoted date like `2026-09-27` arrives already parsed
// into a JS Date by the YAML loader, while a quoted date arrives as a
// string. This preprocessor normalizes either input to a YYYY-MM-DD string
// (UTC) before the usual dateString check runs, so both spellings validate
// and every consumer of a pick's dates always sees the same string shape.
const yamlDateString = z.preprocess((value) => {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	return value;
}, dateString);
const httpUrl = z.string().url().refine((value) => /^https?:\/\//.test(value), {
	message: 'Only http and https URLs are allowed.',
});
const optionalHttpUrl = httpUrl.nullable().default(null);

const libraryStatus = z.enum(['draft', 'pending', 'approved', 'rejected']);
const supportedLibraryLanguage = z.enum(['ko', 'en', 'jp', 'multi', 'unknown']);
const relatedIds = z.array(slugSafeString).default([]);

// Discover Phase 2 facets (docs/decisions/discover-direction.md#Facets and
// #Language-Policy). `canonicalLanguage` is the key the shared
// requested-language -> canonical-language -> any-available resolver in
// src/utils/library.ts reads; it defaults to 'ko' so every existing resource
// and paper keeps today's rendering exactly. `depth` is the one deliberate,
// closed, ordered enum in this file — see shared-context.md §4 — because it
// is a scale used for range filtering, not a taxonomy. `contentType` is
// intentionally a plain string here, not an enum: it is validated against
// the data-file registry in src/data/discoverFacets.ts by
// scripts/validate-library.mjs, never by Zod.
const canonicalLanguage = z.enum(['ko', 'en', 'jp']).default('ko');
const depth = z.enum(['beginner', 'practical', 'engineering', 'research']).optional();
const localizedOneLiner = z.object({
	ko: z.string().min(1).optional(),
	en: z.string().min(1).optional(),
	jp: z.string().min(1).optional(),
});

const resourceSummary = z.object({
	ko: z.string().min(1).optional(),
	en: z.string().min(1).optional(),
	jp: z.string().min(1).optional(),
});

const resourceLicense = z.object({
	code: z.string().nullable().default(null),
	appliesTo: z.string().nullable().default(null),
	attributionRequired: z.boolean().default(false),
	canRepublishAssets: z.boolean().default(false),
	publicPolicy: z.enum([
		'link-and-summary-only',
		'open-source',
		'permissive-reuse',
		'official-docs',
		'unknown',
	]),
	note: z.string().min(1).optional(),
});

const reviewMeta = z.object({
	status: libraryStatus,
	humanReviewed: z.boolean(),
	reviewedAt: dateString.nullable().default(null),
	reviewer: z.string().nullable().default(null),
});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		tags: z.array(z.string()).optional(),
		category: z.string().optional(), // Allow any string for now, we'll normalize in utils
		series: z.string().optional(),
		seriesOrder: z.coerce.number().optional(),
		draft: z.boolean().optional().default(false),
		// Research hub linking (docs/decisions/site-structure.md#Linking-reviews-and-posts-to-paper-cards):
		// `papers` entry `id`s this post is about. Declared here, on the
		// later artifact; a paper card never lists the posts about it.
		// Existence of each id is checked by scripts/validate-blog-content.mjs,
		// not Zod — the id, not itemId, because this is a public-site join
		// between public records.
		papers: z.array(slugSafeString).default([]),
	}),
});

const resources = defineCollection({
	loader: glob({ base: './src/content/resources', pattern: '**/*.{md,mdx}' }),
	schema: z
		.object({
			id: slugSafeString,
			title: z.string().min(1),
			url: httpUrl,
			repoUrl: optionalHttpUrl,
			// 'ai-papers' removed: the Library no longer has an ai-papers section
			// (docs/decisions/site-structure.md) — papers live in the `papers`
			// collection, on the Research hub, never as a `resources` section.
			section: z.enum(['design', 'vibe-coding', 'dev-docs', 'useful-feeds', 'library']),
			category: shortSlugString,
			type: z.enum([
				'reference',
				'tool',
				'docs',
				'article',
				'community',
				'feed',
				'design-system',
				'component-library',
				'paper',
				'repo',
				'video',
			]),
			tags: z.array(shortSlugString).default([]),
			language: supportedLibraryLanguage,
			featured: z.boolean().default(false),
			qualityScore: z.number().int().min(1).max(5).default(3),
			freshness: z.enum(['fresh', 'stable', 'aging', 'unknown']).default('unknown'),
			status: libraryStatus,
			summary: resourceSummary,
			license: resourceLicense,
			source: z.object({
				kind: z.enum(['manual', 'ai-assisted', 'imported']).default('manual'),
				firstSeenAt: dateString,
				lastCheckedAt: dateString,
			}),
			review: reviewMeta,
			relatedTopics: relatedIds,
			relatedDecks: relatedIds,
			// Discover Phase 2 facets — all optional or defaulted, see the note
			// above `canonicalLanguage`. Existing resources validate unchanged.
			contentType: z.string().optional(),
			depth,
			publishedAt: dateString.optional(),
			canonicalLanguage,
			whyRelevant: localizedOneLiner.optional(),
		})
		.superRefine((resource, context) => {
			if (resource.status === 'approved' && resource.review.humanReviewed !== true) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['review', 'humanReviewed'],
					message: 'Approved resources must be human reviewed.',
				});
			}

			if (resource.status === 'approved' && !resource.summary[resource.canonicalLanguage]?.trim()) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['summary', resource.canonicalLanguage],
					message: `Approved resources must include a human-reviewed summary in their canonical language (${resource.canonicalLanguage}).`,
				});
			}
		}),
});

const paperSummaryFields = z.object({
	tldr: z.string().min(1).optional(),
	problem: z.string().min(1).optional(),
	keyIdea: z.string().min(1).optional(),
	whyItMatters: z.string().min(1).optional(),
	limitations: z.string().min(1).optional(),
	readThisIf: z.string().min(1).optional(),
});

const papers = defineCollection({
	loader: glob({ base: './src/content/papers', pattern: '**/*.{md,mdx}' }),
	schema: z
		.object({
			id: slugSafeString,
			// The canonical work identity (docs/decisions/research-item-identity.md
			// #Canonical-Item-Identity). Required, not nullable: minting a value
			// for the one existing record costs one file edit today and is
			// unrepeatable once DynamoDB holds items keyed on it. The only join
			// key between this public projection and the private Research OS
			// canonical item and every note anchored to it — see that record's
			// §C3. Never derived from title, URL, or any other mutable field.
			itemId: itemIdString,
			title: z.string().min(1),
			url: httpUrl,
			paperUrl: optionalHttpUrl,
			codeUrl: optionalHttpUrl,
			projectUrl: optionalHttpUrl,
			// A venue registry ID (src/data/venues.ts), not a free string — see
			// docs/decisions/research-discovery-system.md#Venue-Registry. Plain
			// z.string() deliberately: cross-referenced against the registry by
			// scripts/validate-library.mjs, never a Zod enum, matching the
			// contentType pattern in src/data/discoverFacets.ts.
			venue: z.string().min(1).optional(),
			year: z.number().int().min(1900).max(2100).optional(),
			// `decision` (accepted/oral/spotlight/poster/preprint/workshop/
			// rejected/unknown) conflated four independent facts and could not
			// express "accepted AND oral". Replaced per
			// docs/decisions/research-item-identity.md#C2 by the three fields
			// below plus `provenance`. Each of acceptanceStatus/honors/
			// presentationFormat is registry-backed (src/data/paperVocabularies.ts)
			// and cross-checked by scripts/validate-library.mjs — never a Zod
			// enum, because the evidence for the value lists is one sample
			// record. Render sites must call the getXDisplayName() helpers from
			// that data file, never render these raw values — a stored id is
			// never a display value (the rule the venue-pill regression taught).
			acceptanceStatus: slugSafeString.default('unknown'),
			honors: z.array(slugSafeString).max(4).default([]),
			presentationFormat: slugSafeString.nullable().default(null),
			// Drives destructive TTL in the private Research OS. The second
			// deliberate exception to "taxonomies are data, not code" alongside
			// `depth` (shared-context.md §4) — a closed, two-valued structural
			// distinction, not a taxonomy. Never assignable by assertion:
			// scripts/validate-library.mjs rejects
			// "VERIFIED" unless the venue resolves in the registry and the
			// record is human reviewed. See
			// docs/decisions/research-item-identity.md#Status-History-And-Provenance-Tier.
			provenance: z.enum(['VERIFIED', 'RADAR']).default('RADAR'),
			topics: z.array(slugSafeString).default([]),
			priority: z.enum(['high', 'medium', 'low']),
			difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'unknown']),
			status: libraryStatus,
			summary: z.object({
				ko: paperSummaryFields.optional(),
				en: paperSummaryFields.optional(),
				jp: paperSummaryFields.optional(),
			}),
			signals: z.object({
				citationCount: z.number().int().nonnegative().nullable().default(null),
				influentialCitationCount: z.number().int().nonnegative().nullable().default(null),
				// Nullable, default null rather than false — "unavailable" (not yet
				// checked) is never the same fact as "false" (checked; there is
				// none). A boolean defaulting to false reported "not checked" as
				// "no code", the same unavailable-treated-as-zero error the removed
				// composite scores below made at a larger scale. See
				// docs/decisions/research-item-identity.md#C1.
				hasCode: z.boolean().nullable().default(null),
				hasProjectPage: z.boolean().nullable().default(null),
				// topicScore / sourceScore / usefulnessScore / freshnessScore /
				// totalScore removed per C1: ranking inputs, not observations — no
				// measurement procedure for any of them exists anywhere in this
				// repository, and no single composite quality score is a
				// source-of-truth field anywhere in the system. No replacement
				// field and no legacy carriage — see
				// docs/decisions/research-item-identity.md#C1.
			}),
			source: z.object({
				kind: z.enum(['manual', 'ai-assisted', 'imported']).default('manual'),
				// Replaces the fixed openReviewId/semanticScholarId/arxivId columns.
				// A list of typed entries, not a map keyed by scheme, because a
				// work can carry both a preprint DOI and a publisher DOI. `scheme`
				// is cross-referenced against src/data/identifierSchemes.ts by
				// scripts/validate-library.mjs, never a Zod enum. `source` and
				// `fetchedAt` per entry stay on the private canonical item only —
				// this projection carries scheme and value only. See
				// docs/decisions/research-item-identity.md#External-Identifier-Map.
				externalIds: z
					.array(
						z.object({
							scheme: slugSafeString,
							value: z.string().min(1),
						}),
					)
					.max(12)
					.default([])
					.refine(
						(entries) => new Set(entries.map((entry) => `${entry.scheme}:${entry.value}`)).size === entries.length,
						{ message: 'source.externalIds must not contain a duplicate (scheme, value) pair.' },
					),
				firstSeenAt: dateString,
				lastCheckedAt: dateString,
			}),
			review: reviewMeta.extend({
				aiDraftUsed: z.boolean().default(false),
			}),
			relatedResources: relatedIds,
			relatedDecks: relatedIds,
			// Discover Phase 2 facets, the subset applicable to papers — see the
			// note above `canonicalLanguage` on the resources collection.
			depth,
			publishedAt: dateString.optional(),
			canonicalLanguage,
			// A public, dated statement of whether the owner has studied the
			// paper (docs/decisions/research-item-identity.md#C4). Distinct from
			// the private, mutable `readingState` (unread/reading/completed/
			// abandoned, DynamoDB-owned, still forbidden here): `studiedAt` is a
			// deliberate, completed, dated fact, or `null` for a selected paper
			// not yet studied. Source of truth is the study log kept in the
			// private repository; this projection copies it, exactly as it
			// copies every other canonical field — C3's one-directional flow is
			// unchanged.
			studiedAt: dateString.nullable().default(null),
		})
		.superRefine((paper, context) => {
			if (paper.status === 'approved' && paper.review.humanReviewed !== true) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['review', 'humanReviewed'],
					message: 'Approved papers must be human reviewed.',
				});
			}

			// The six-field canonical-language summary is no longer required for
			// an approved card (docs/decisions/research-item-identity.md#C4): a
			// public paper card is a reviewed bibliographic record plus a
			// published study-log statement, not an original review.
			// `review.humanReviewed` now attests the bibliographic record was
			// checked against its authoritative source, not that a summary was
			// written. `summary` stays in the schema, optional.
		}),
});

const academicReviews = defineCollection({
	loader: glob({ base: './src/content/academic-reviews', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().min(1),
		pubDate: z.coerce.date(),
		tags: z.array(z.string().min(1)).default([]),
		paper: z.object({
			title: z.string().min(1),
			authors: z.array(z.string().min(1)).min(1),
			venue: z.string().min(1).optional(),
			year: z.coerce.number().int().min(1900).max(2100).optional(),
			url: httpUrl,
		}),
		// Same rule as blog.draft (docs/decisions/site-structure.md): a draft
		// review is excluded from every route, getStaticPaths, the sitemap, and
		// any listing. src/utils/academic-review-routing.ts's
		// getPublishedAcademicReviews() is the single place that applies this —
		// mirroring getAllPosts() being the single definition of "published" for
		// blog posts.
		draft: z.boolean().default(false),
		// Research hub linking (docs/decisions/site-structure.md#Linking-reviews-and-posts-to-paper-cards):
		// declared here, on the later artifact, and derived on the paper card,
		// which never lists its own reviews. Optional — a `papers` entry `id`,
		// not its `itemId`, because this is a public-site join between public
		// records. Existence is checked by scripts/validate-academic-reviews.mjs,
		// not Zod, following the id-reference pattern relatedResources/relatedTopics
		// already use elsewhere in this file.
		paperId: slugSafeString.optional(),
	}),
});

const topics = defineCollection({
	loader: glob({ base: './src/content/topics', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		id: slugSafeString,
		label: z.object({
			ko: z.string().min(1),
			en: z.string().min(1).optional(),
			jp: z.string().min(1).optional(),
		}),
		description: z.object({
			ko: z.string().min(1),
			en: z.string().min(1).optional(),
			jp: z.string().min(1).optional(),
		}),
		positiveKeywords: z.array(z.string().min(1)).default([]),
		negativeKeywords: z.array(z.string().min(1)).default([]),
		// Venue registry IDs (src/data/venues.ts), not free-form strings — see
		// docs/decisions/research-discovery-system.md#Venue-Registry. Plain
		// z.array(z.string()) deliberately: cross-referenced against the
		// registry (with alias resolution) by scripts/validate-library.mjs,
		// never a Zod enum, matching the contentType pattern in
		// src/data/discoverFacets.ts.
		venues: z.array(z.string().min(1)).default([]),
		arxivCategories: z.array(z.string().min(1)).default([]),
		seedPapers: z.array(slugSafeString).default([]),
		reviewPolicy: z.object({
			autoPublish: z.boolean().default(false),
			requireHumanReview: z.boolean().default(true),
		}).default({}),
		status: z.enum(['active', 'draft', 'archived']),
		// Discover Phase 1 taxonomy lifecycle fields (docs/decisions/discover-direction.md#Taxonomy).
		// All additive: existing topic files (e.g. ai-agents.md) validate unchanged.
		parent: slugSafeString.nullable().default(null),
		order: z.number().default(0),
		aliases: z.array(slugSafeString).default([]),
		mergedInto: slugSafeString.nullable().default(null),
	}),
});

// Hand-curated "picks" collection (docs/decisions/site-structure.md).
// Unlike `resources`/`papers`, a pick is written directly by the site owner
// as a short note about a tool, SKILL, site, or reference they actually use
// — it sits outside the research-os projection on purpose: no `itemId`, no
// review/provenance machinery, no AI-assisted drafting flag. Frontmatter is
// plain YAML (not the JSON-frontmatter style `resources`/`papers` use), and
// the Markdown body is that note. A pick's `url` must not duplicate a
// `resources` entry's `url`/`repoUrl` — enforced by scripts/validate-picks.mjs,
// not Zod, because it is a cross-collection check.
const picks = defineCollection({
	loader: glob({ base: './src/content/picks', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().min(1),
		url: httpUrl,
		repo: z
			.string()
			.regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'Use "owner/name".')
			.optional(),
		// Registry-backed, not a Zod enum — matches the section/contentType/
		// venue pattern elsewhere in this file. src/data/librarySections.ts is
		// the source of truth for known sections.
		section: z.string().refine(isLibrarySectionSlug, {
			message: 'section must be a known Library section slug — see src/data/librarySections.ts.',
		}),
		// Registry-backed, not a Zod enum — src/data/libraryPolicy.ts is the
		// source of truth for known kinds.
		kind: z.string().refine(isPickKind, {
			message: 'kind must be one of the known pick kinds — see src/data/libraryPolicy.ts.',
		}),
		// Manual tier override. Optional — most repo-backed picks derive their
		// tier from GitHub stars (src/utils/picks.ts's computePickTier); a
		// non-repo pick (a site, say) has no star count to derive from, so its
		// tier must be set here instead (enforced for non-draft picks by
		// scripts/validate-picks.mjs, not Zod, since it depends on `repo` too).
		tier: z.string().refine(isPickTierId, {
			message: 'tier must be a known pick tier id — see src/data/libraryPolicy.ts.',
		}).optional(),
		createdAt: yamlDateString.optional(),
		addedAt: yamlDateString,
		checkedAt: yamlDateString,
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog, resources, papers, topics, academicReviews, picks };
