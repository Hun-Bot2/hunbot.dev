// Shapes shared by the Explore client and its dev-only bench module.

export type Strings = Record<string, string>;
export type NodeData = {
	id: string;
	kind: string;
	kindLabel: string;
	title: string;
	summary: string | null;
	date: string;
	ts: number;
	href: string;
	external: boolean;
	host: string | null;
	hrefNote: string | null;
	project: string | null;
	haystack: string;
};
export type ProjectData = { key: string; title: string; count: number; first: string; last: string };
export type RelationData = { from: string; to: string; rel: string; out: string; in: string };
export type GraphData = { nodes: NodeData[]; projects: ProjectData[]; relations: RelationData[]; strings: Strings };
export type View = 'graph' | 'list';
export type State = { view: View; node: string | null; project: string | null };
export type Cam = { x: number; y: number; k: number };
