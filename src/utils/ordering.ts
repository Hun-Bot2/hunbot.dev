/**
 * Deterministic ordering helpers.
 *
 * Build output must not depend on the order `getCollection()` happens to return
 * entries in. When it does, two builds of identical source produce different
 * HTML — which makes diffing rendered output useless, and diffing rendered
 * output is how a real regression was caught (`docs/plans/research-os-pre-aws/readiness-audit.md`, N4).
 *
 * The rule: **every comparator used for display must be a total order.** A
 * comparator that returns 0 for two distinct entries leaves their relative order
 * to `Array.prototype.sort`, and from there to input order.
 *
 * `stableBy` enforces that in one place rather than asking four call sites to
 * remember a tiebreak. Implementing the same invariant independently in several
 * places is how the alias-resolution bug (N5) happened.
 */

interface HasId {
	readonly id: string;
}

/**
 * Compares ids by Unicode code point, deliberately **not** `localeCompare`.
 *
 * `localeCompare` without an explicit locale depends on the runtime's ICU data,
 * so it can order the same two strings differently on two machines — precisely
 * the class of difference this module exists to remove. Ids are ASCII slugs, so
 * code-point order is also the intuitive order.
 */
export function compareIds(a: string, b: string): number {
	if (a === b) return 0;
	return a < b ? -1 : 1;
}

/**
 * Wraps a comparator so that entries it considers equal fall back to id order.
 *
 * Note this fixes *ties*, not the primary key. A primary comparison built on
 * `localeCompare` can still vary across ICU versions; that is a separate concern
 * and is left alone here, because changing it would change how Korean and
 * Japanese titles sort for readers.
 */
export function stableBy<T extends HasId>(compare: (a: T, b: T) => number): (a: T, b: T) => number {
	return (a, b) => {
		const primary = compare(a, b);
		return primary !== 0 ? primary : compareIds(a.id, b.id);
	};
}

/** Sorts a copy, never the input, with a guaranteed total order. */
export function sortStable<T extends HasId>(items: readonly T[], compare: (a: T, b: T) => number): T[] {
	return [...items].sort(stableBy(compare));
}
