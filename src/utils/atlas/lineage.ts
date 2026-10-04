// Lineage traversal over public relations: everything upstream that fed an
// artifact and everything downstream it led to, depth-capped
// (docs/plans/2026-10-03-explore-living-atlas.md §1.4). Pure and tiny so the
// Explore client script bundles it directly.

export type RelationLike = { from: string; to: string; rel: string };

export type Lineage = {
	upstream: Set<string>;
	downstream: Set<string>;
	/** Keys (`from|rel|to`) of every relation on a lineage path. */
	relations: Set<string>;
};

export function relationKey(relation: RelationLike): string {
	return `${relation.from}|${relation.rel}|${relation.to}`;
}

export function getLineage(relations: readonly RelationLike[], id: string, maxDepth = 4): Lineage {
	const outgoing = new Map<string, RelationLike[]>();
	const incoming = new Map<string, RelationLike[]>();
	for (const relation of relations) {
		outgoing.set(relation.from, [...(outgoing.get(relation.from) ?? []), relation]);
		incoming.set(relation.to, [...(incoming.get(relation.to) ?? []), relation]);
	}

	const lineage: Lineage = { upstream: new Set(), downstream: new Set(), relations: new Set() };
	walk(id, incoming, 'from', lineage.upstream, lineage.relations, maxDepth);
	walk(id, outgoing, 'to', lineage.downstream, lineage.relations, maxDepth);
	lineage.upstream.delete(id);
	lineage.downstream.delete(id);
	return lineage;
}

function walk(
	start: string,
	edges: Map<string, RelationLike[]>,
	next: 'from' | 'to',
	visited: Set<string>,
	relationKeys: Set<string>,
	maxDepth: number,
): void {
	let frontier = [start];
	for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
		const following: string[] = [];
		for (const node of frontier) {
			for (const relation of edges.get(node) ?? []) {
				relationKeys.add(relationKey(relation));
				const neighbour = relation[next];
				if (!visited.has(neighbour) && neighbour !== start) {
					visited.add(neighbour);
					following.push(neighbour);
				}
			}
		}
		frontier = following;
	}
}
