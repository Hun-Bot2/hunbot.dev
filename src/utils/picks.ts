import { freshnessPolicy, pickTiers, type PickTier, type PickTierId } from '../data/libraryPolicy.ts';

/**
 * GitHub popularity data for repo-backed picks, keyed by "owner/name"
 * exactly as stored in a pick's `repo` field. Source of truth is
 * `src/data/popularity.json`, refreshed by `scripts/refresh-popularity.mjs`
 * (`npm run picks:refresh`). Pure data — no network access happens here.
 */
export type PopularitySnapshot = Record<
	string,
	{ stars: number; createdAt: string; pushedAt: string; fetchedAt: string }
>;

export interface PickTierResult {
	tier: PickTierId;
	/**
	 * `'manual'` when the pick's own `tier` field wins, `'stars'` when a
	 * repo's star count placed it, `'default'` when neither applies (no repo,
	 * or a repo with no popularity snapshot entry yet).
	 */
	source: 'manual' | 'stars' | 'default';
}

/**
 * Resolves the display tier for a pick. A manually authored `tier` always
 * wins (the owner's editorial call is never overridden by a star count).
 * Otherwise, for a repo-backed pick with a popularity snapshot entry, the
 * first tier (highest first, per `tiers`) whose `minStars` the star count
 * satisfies. Otherwise `'discovery'` with source `'default'` — this covers
 * both non-repo picks without a manual tier and repo-backed picks whose repo
 * has not been refreshed yet.
 */
export function computePickTier(
	pick: { tier?: string; repo?: string },
	snapshot: PopularitySnapshot,
	tiers: readonly PickTier[] = pickTiers,
): PickTierResult {
	if (typeof pick.tier === 'string' && tiers.some((tier) => tier.id === pick.tier)) {
		return { tier: pick.tier as PickTierId, source: 'manual' };
	}

	if (pick.repo) {
		const entry = snapshot[pick.repo];
		if (entry) {
			const matched = tiers.find((tier) => entry.stars >= tier.minStars);
			if (matched) {
				return { tier: matched.id as PickTierId, source: 'stars' };
			}
		}
	}

	return { tier: 'discovery', source: 'default' };
}

export interface PickFacts {
	stars: number | null;
	/** The `fetchedAt` date of the popularity snapshot entry `stars` came from, or null. */
	starsAsOf: string | null;
	createdAt: string | null;
	lastActivityAt: string | null;
}

/**
 * Observable facts about a pick, merging its own frontmatter with the
 * GitHub popularity snapshot for repo-backed picks. `createdAt` is when the
 * tool itself was created (not when the owner added it — that is `addedAt`):
 * a manual value wins, otherwise the repo's GitHub `created_at` is used.
 */
export function getPickFacts(
	pick: { createdAt?: string; repo?: string },
	snapshot: PopularitySnapshot,
): PickFacts {
	const entry = pick.repo ? snapshot[pick.repo] : undefined;

	return {
		stars: entry ? entry.stars : null,
		starsAsOf: entry ? entry.fetchedAt : null,
		createdAt: pick.createdAt ?? entry?.createdAt ?? null,
		lastActivityAt: entry ? entry.pushedAt : null,
	};
}

export interface FreshnessBadges {
	/** True when `checkedAt` is strictly older than `checkStaleMonths` ago. */
	needsCheck: boolean;
	/** True when `lastActivityAt` is non-null and strictly older than `activityStaleMonths` ago. */
	stale: boolean;
}

/**
 * Freshness badges for a pick, compared as UTC calendar dates against `now`.
 * `now` is always passed in — pages pass the build date, tests pass a fixed
 * date — so this function never reads the clock itself and stays
 * deterministic.
 */
export function getFreshnessBadges(
	facts: { checkedAt: string; lastActivityAt: string | null },
	now: Date,
	policy: { checkStaleMonths: number; activityStaleMonths: number } = freshnessPolicy,
): FreshnessBadges {
	const checkThreshold = subtractCalendarMonthsUTC(now, policy.checkStaleMonths);
	const activityThreshold = subtractCalendarMonthsUTC(now, policy.activityStaleMonths);

	return {
		needsCheck: facts.checkedAt < checkThreshold,
		stale: facts.lastActivityAt !== null && facts.lastActivityAt < activityThreshold,
	};
}

/**
 * `date` minus `months` calendar months, as a UTC `YYYY-MM-DD` string. Clamps
 * the day when the source day doesn't exist in the target month (e.g. Mar 31
 * minus 1 month lands on Feb 28/29, not Mar 3).
 */
function subtractCalendarMonthsUTC(date: Date, months: number): string {
	const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() - months;
	const targetYear = Math.floor(totalMonths / 12);
	const targetMonth = ((totalMonths % 12) + 12) % 12;
	const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
	const clampedDay = Math.min(date.getUTCDate(), daysInTargetMonth);

	return new Date(Date.UTC(targetYear, targetMonth, clampedDay)).toISOString().slice(0, 10);
}

/**
 * Formats a GitHub star count for display: `999`, `1.2k`, `12.3k`, `71.7k`,
 * `1.2m`. One decimal place, trailing `.0` dropped.
 */
export function formatStarCount(n: number): string {
	const abs = Math.abs(n);

	if (abs < 1000) {
		return String(n);
	}

	const useMillions = abs >= 1_000_000;
	const divisor = useMillions ? 1_000_000 : 1000;
	const suffix = useMillions ? 'm' : 'k';
	const formatted = (n / divisor).toFixed(1).replace(/\.0$/, '');

	return `${formatted}${suffix}`;
}

/**
 * Comparison key for duplicate detection between picks and `resources`
 * entries: lowercase scheme+host, then the scheme is dropped; a leading
 * `www.` is dropped from the host; a trailing slash is dropped from the
 * path; path case, query string, and everything else are kept; the fragment
 * is dropped. Deliberately separate from `src/utils/canonicalization.ts`
 * (that module is vendored byte-for-byte by the private Research OS repo and
 * must not gain an unrelated consumer here) — this is a narrower, Library-
 * picks-only comparison key.
 */
export function normalizePickUrl(url: string): string {
	const parsed = new URL(url);
	let host = parsed.host.toLowerCase();
	if (host.startsWith('www.')) {
		host = host.slice(4);
	}

	let pathname = parsed.pathname;
	if (pathname.length > 1 && pathname.endsWith('/')) {
		pathname = pathname.slice(0, -1);
	}

	return `${host}${pathname}${parsed.search}`;
}

/** The file basename without extension — a pick's slug, e.g. for `picks:check`. */
export function getPickSlug(filePathOrId: string): string {
	const base = filePathOrId.split('/').pop() ?? filePathOrId;
	return base.replace(/\.(md|mdx)$/i, '');
}

/**
 * Counts published picks per section slug. Shared by the Library hub (chip
 * counts across every section) and each pick section page (the same chip
 * row, current section marked active) so the two pages cannot silently
 * disagree about which sections have public content
 * (docs/decisions/site-structure.md#5 — empty sections are hidden, not
 * shown as "0개 / 준비 중").
 */
export function getPickSectionCounts(publishedPicks: readonly { data: { section: string } }[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const pick of publishedPicks) {
		counts.set(pick.data.section, (counts.get(pick.data.section) ?? 0) + 1);
	}
	return counts;
}
