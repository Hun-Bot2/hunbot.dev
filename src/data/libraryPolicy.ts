// Policy data for the Library "picks" collection: tier thresholds, kinds,
// freshness windows, and display limits. Data, not code — same registry
// pattern as src/data/librarySections.ts, src/data/discoverFacets.ts, and
// src/data/venues.ts: never a Zod enum, cross-checked by
// scripts/validate-picks.mjs and src/content.config.ts's `picks` schema.

export interface PickTier {
	/** Canonical, stable, lowercase, slug-safe. Never reused once written. */
	id: string;
	label: {
		ko: string;
		en: string;
		jp: string;
	};
	/** Minimum GitHub star count a repo-backed pick needs to reach this tier. */
	minStars: number;
}

// Ordered highest first: computePickTier (src/utils/picks.ts) walks this
// array in order and takes the first tier whose minStars a pick's star
// count satisfies. '발굴' ("hidden gems") is not a lower rank than the
// others — it is the tier for repos too new or too niche to have
// accumulated stars yet, not a judgment on quality.
export const pickTiers: readonly PickTier[] = [
	{ id: 'essential', label: { ko: '필수', en: 'Essential', jp: '定番' }, minStars: 10000 },
	{ id: 'popular', label: { ko: '인기', en: 'Popular', jp: '人気' }, minStars: 1000 },
	{ id: 'discovery', label: { ko: '발굴', en: 'Hidden gems', jp: '掘り出し物' }, minStars: 0 },
] as const;

export type PickTierId = (typeof pickTiers)[number]['id'];

export const pickTierIds: readonly string[] = pickTiers.map((tier) => tier.id);

export function isPickTierId(value: unknown): value is PickTierId {
	return typeof value === 'string' && pickTierIds.includes(value);
}

export const pickKinds = ['skill', 'tool', 'site', 'reference'] as const;

export type PickKind = (typeof pickKinds)[number];

export function isPickKind(value: unknown): value is PickKind {
	return typeof value === 'string' && (pickKinds as readonly string[]).includes(value);
}

// How long a pick can go unchecked, or a backing repo unpushed-to, before it
// is flagged stale in the UI (src/utils/picks.ts's getFreshnessBadges).
export const freshnessPolicy = {
	checkStaleMonths: 6,
	activityStaleMonths: 12,
} as const;

// Size of the homepage/Library "최근 추가" (recently added) strip.
export const recentPicksLimit = 6;

const seenTierIds = new Set<string>();
for (const tier of pickTiers) {
	if (seenTierIds.has(tier.id)) {
		throw new Error(`Invalid pickTiers registry: duplicate id "${tier.id}".`);
	}
	seenTierIds.add(tier.id);
}
