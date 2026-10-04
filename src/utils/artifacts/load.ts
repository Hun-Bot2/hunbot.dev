// The public artifact set for pages (Astro side). Builds Hun-Bot's export with
// the same adapters scripts/validate-artifacts.mjs runs, merges a Research OS
// export when one is committed, and validates the whole set. An invalid set
// fails the build instead of rendering. Pages read artifacts only through
// this function, never from collections directly.

import { getCollection } from 'astro:content';
import { buildHunbotArtifactExport, type HunbotSources } from './adapters.ts';
import type { PublicArtifact, PublicRelation } from './contract.ts';
import { validateArtifactExports } from './validate.ts';

export type PublicArtifactSet = { artifacts: PublicArtifact[]; relations: PublicRelation[] };

let cached: Promise<PublicArtifactSet> | null = null;

export function getPublicArtifactSet(): Promise<PublicArtifactSet> {
	cached ??= load();
	return cached;
}

async function load(): Promise<PublicArtifactSet> {
	const sources = {
		blog: await getCollection('blog'),
		academicReviews: await getCollection('academicReviews'),
		papers: await getCollection('papers'),
		picks: await getCollection('picks'),
		resources: await getCollection('resources'),
		topics: await getCollection('topics'),
	} as unknown as HunbotSources;

	const { export: hunbotExport } = buildHunbotArtifactExport(sources);
	const researchOsExports = Object.entries(
		import.meta.glob('../../data/research-os-export/public-artifacts.json', { eager: true, import: 'default' }),
	).map(([path, value]) => ({ label: path, value }));

	const result = validateArtifactExports(
		[{ label: 'hunbot (adapters)', value: hunbotExport }, ...researchOsExports],
		{ topics: sources.topics },
	);
	if (result.errors.length > 0) {
		throw new Error(`Invalid public artifacts (run npm run artifacts:validate):\n- ${result.errors.join('\n- ')}`);
	}

	return { artifacts: result.artifacts, relations: result.relations };
}
