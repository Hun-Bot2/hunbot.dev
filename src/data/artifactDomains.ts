// Where a public artifact's domain (its Explore lane) comes from. The adapters
// in src/utils/artifacts/adapters.ts resolve every artifact's domain in this
// order, and always emit the resolved value explicitly:
//
//   1. an explicit `domain` on the item itself (new collections only — the
//      existing blog/papers/picks schemas have no such field),
//   2. `artifactDomainOverrides` below, keyed by public artifact id,
//   3. for writing, `blogCategoryDomains` below (keyed by raw `category`,
//      trimmed and lowercased),
//   4. the kind's `defaultDomain` in src/data/publicArtifactVocabulary.ts
//      (writing → learn).
//
// Create is reserved for genuinely creative artifacts — creative coding,
// visual experiments, artwork. Reflective or general writing is not Create;
// it defaults to Learn until an override in `artifactDomainOverrides` says
// otherwise for a specific post.
//
// Category → domain lives here and nowhere else: posts never carry their own
// domain metadata. `scripts/validate-artifacts.mjs --print` lists any
// published category that falls through to step 4, so a new category is
// visible the first time it appears.

import type { ArtifactDomain } from './publicArtifactVocabulary.ts';

export const blogCategoryDomains: Readonly<Record<string, ArtifactDomain>> = {
	// Build — devlogs, competitions, engineering notes about things being built
	devlog: 'build',
	blog_devlog: 'build',
	'on-the-block': 'build',
	algo_bot: 'build',
	local_llm_devlog: 'build',
	chatting_system: 'build',
	app_devlog: 'build',
	jp_app_devlog: 'build',
	stock_app_devlog: 'build',
	vsextension_devlog: 'build',
	onpremise_devlog: 'build',
	autonomous_car: 'build',
	add_on_doctor_devlog: 'build',
	ai_competition_devlog: 'build',
	hackathon: 'build',
	skku_ai_hackathon: 'build',
	snu_kossda: 'build',
	kaggle: 'build',
	architecture: 'build',
	'pub-sub': 'build',
	'db-race-condition': 'build',

	// Research — paper reviews
	paper_review: 'research',
	paper: 'research',

	// Learn — study notes and technical explainers
	공부: 'learn',
	勉強: 'learn',
	study: 'learn',
	'technical-note': 'learn',
	'ai engineering': 'learn',
	'ai-frontier': 'learn',
	'three.js': 'learn',

	// Reflective and general writing — Learn as the migration fallback (owner decision
	// 2026-10-04). Correct individual posts with artifactDomainOverrides.
	thoughts: 'learn',
	contemplation: 'learn',
	retrospective: 'learn',
	career: 'learn',
	misc: 'learn',
};

/** Per-item exceptions, keyed by public artifact id (e.g. "writing:devlog/foo"). */
export const artifactDomainOverrides: Readonly<Record<string, ArtifactDomain>> = {};
