// Pure display helpers for list pages (docs/plans/2026-10-03-atelier-redesign.md §5.4, §6).

/**
 * FNV-1a, 32-bit. Stable across builds and platforms, so a post keeps the same
 * thumbnail variant on every page and every deploy.
 */
export function hashString(seed: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < seed.length; i++) {
		hash ^= seed.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/** Picks one entry of `variants`, deterministically from `seed`. */
export function pickVariant<T>(seed: string, variants: readonly T[]): T {
	return variants[hashString(seed) % variants.length];
}

/**
 * `YYYY.MM.DD` in UTC. Frontmatter dates are calendar dates parsed as UTC
 * midnight, so reading them in the build machine's zone could shift the day.
 */
export function formatPostDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}.${month}.${day}`;
}
