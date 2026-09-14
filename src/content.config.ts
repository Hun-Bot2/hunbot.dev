import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const slugSafeString = z
	.string()
	.regex(/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/, 'Use lowercase letters, numbers, and hyphens only.');
const shortSlugString = z
	.string()
	.regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'Use a short lowercase slug.');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
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
			section: z.enum(['design', 'vibe-coding', 'dev-docs', 'ai-papers', 'useful-feeds', 'library']),
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
			decision: z.enum(['accepted', 'oral', 'spotlight', 'poster', 'preprint', 'workshop', 'rejected', 'unknown']),
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
				hasCode: z.boolean().default(false),
				hasProjectPage: z.boolean().default(false),
				topicScore: z.number().min(0).max(5).nullable().default(null),
				sourceScore: z.number().min(0).max(5).nullable().default(null),
				usefulnessScore: z.number().min(0).max(5).nullable().default(null),
				freshnessScore: z.number().min(0).max(5).nullable().default(null),
				totalScore: z.number().min(0).max(20).nullable().default(null),
			}),
			source: z.object({
				kind: z.enum(['manual', 'ai-assisted', 'imported']).default('manual'),
				openReviewId: z.string().nullable().default(null),
				semanticScholarId: z.string().nullable().default(null),
				arxivId: z.string().nullable().default(null),
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
		})
		.superRefine((paper, context) => {
			if (paper.status === 'approved' && paper.review.humanReviewed !== true) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['review', 'humanReviewed'],
					message: 'Approved papers must be human reviewed.',
				});
			}

			if (paper.status === 'approved') {
				const canonicalSummary = paper.summary[paper.canonicalLanguage];
				for (const field of ['tldr', 'problem', 'keyIdea', 'whyItMatters', 'limitations', 'readThisIf'] as const) {
					if (!canonicalSummary?.[field]?.trim()) {
						context.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['summary', paper.canonicalLanguage, field],
							message: `Approved papers must include summary.${paper.canonicalLanguage}.${field}.`,
						});
					}
				}
			}
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

export const collections = { blog, resources, papers, topics, academicReviews };
