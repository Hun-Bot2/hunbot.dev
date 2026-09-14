// Shared topic-reference resolution: id -> uniquely-owned alias -> a bounded
// mergedInto chain terminating at an active topic.
//
// Why this exists: scripts/validate-taxonomy.mjs already implements exactly
// this resolution (its local `resolveTopic` / `resolveMergeTarget`), because
// the taxonomy lifecycle (docs/decisions/discover-direction.md#Taxonomy)
// guarantees that renaming a topic (id changes, old id becomes an alias) or
// merging one (status: archived + mergedInto) never breaks a stored item
// reference. scripts/validate-library.mjs used to check a paper's `topics`
// or a resource's `relatedTopics` against a raw `Set` of current topic ids
// only — ignoring aliases and merges entirely — which meant the two
// validators disagreed about what a valid topic reference is the moment a
// topic was ever renamed or merged. This module is the fix: one resolution
// implementation, importable by both scripts, so they cannot silently drift
// apart again.
//
// Current status: scripts/validate-library.mjs imports this module.
// scripts/validate-taxonomy.mjs still carries its own local copy of the same
// resolution logic (predates this module and was not touched here — it is
// not this task's file to restructure). A future cleanup can point it at
// this module too; until then, treat this file as the source of truth for
// the *resolution* semantics and validate-taxonomy.mjs as also owning the
// taxonomy's own shape checks (duplicate ids, ambiguous aliases, cycles),
// which this module deliberately does not repeat.
//
// NOTE ON VENUES — do not "fix" the venue check to match this one. Venue
// references (src/data/venues.ts, validateVenueReference in
// validate-library.mjs) deliberately REJECT an alias-only match: the venue
// migration was a one-time normalization to canonical ids, aliases exist
// only to match other systems' historical spellings during ingestion, and
// there is no venue rename/merge lifecycle guarantee to preserve. Topics are
// different: they carry an explicit promise that a rename or merge never
// breaks a stored reference. Same repository, two intentionally different
// semantics for two different kinds of registry.

/**
 * @typedef {{ label: string, data: Record<string, unknown> }} TopicEntry
 */

/**
 * Builds id/alias lookups over a topics collection.
 *
 * @param {TopicEntry[]} topics
 */
export function buildTopicIndex(topics) {
	const topicById = new Map();
	for (const entry of topics) {
		const id = entry.data.id;
		if (typeof id !== 'string' || topicById.has(id)) continue;
		topicById.set(id, entry);
	}

	const aliasOwners = new Map();
	for (const entry of topics) {
		const aliases = Array.isArray(entry.data.aliases) ? entry.data.aliases : [];
		for (const alias of aliases) {
			if (!aliasOwners.has(alias)) {
				aliasOwners.set(alias, []);
			}
			aliasOwners.get(alias).push(entry);
		}
	}

	/** Resolves an id or a uniquely-owned alias to its topic entry. */
	function resolveTopic(idOrAlias) {
		if (topicById.has(idOrAlias)) {
			return topicById.get(idOrAlias);
		}

		const owners = aliasOwners.get(idOrAlias);
		return owners && owners.length === 1 ? owners[0] : undefined;
	}

	/**
	 * Walks a topic's mergedInto chain to whatever it ultimately resolves to.
	 * Returns the terminal active entry, or null if the chain dead-ends
	 * (draft, archived-without-merge) or cycles.
	 */
	function resolveMergeTarget(startEntry) {
		const seen = new Set();
		let current = startEntry;

		while (current) {
			const id = current.data.id;
			if (seen.has(id)) return null;
			seen.add(id);

			if (current.data.status === 'active') return current;

			if (current.data.status === 'archived' && current.data.mergedInto) {
				current = topicById.get(current.data.mergedInto);
				continue;
			}

			return null;
		}

		return null;
	}

	return { topicById, aliasOwners, resolveTopic, resolveMergeTarget };
}

/**
 * Whether a stored topic reference (an id or alias written into a paper's
 * `topics` or a resource's `relatedTopics`) still points at something real:
 * true if it resolves — directly, or through a bounded mergedInto chain —
 * to an active topic. Does not validate the taxonomy's own shape (duplicate
 * ids, ambiguous aliases, cycles); that stays scripts/validate-taxonomy.mjs's
 * concern.
 *
 * @param {string} idOrAlias
 * @param {ReturnType<typeof buildTopicIndex>} index
 */
export function isResolvableTopicReference(idOrAlias, index) {
	const resolved = index.resolveTopic(idOrAlias);
	if (!resolved) return false;
	if (resolved.data.status === 'active') return true;
	return Boolean(index.resolveMergeTarget(resolved));
}
