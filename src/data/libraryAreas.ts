// Library areas: the coarse first filter on /{lang}/library/ (분야), above the
// per-tag 주제 filter. Data, not an enum: an item's area is the first of its
// tags (resource `category` first, then `tags`) or its pick section that is
// listed here; anything unlisted falls into `other`. A new tag exported from
// research-os lands in `other` until it is added below
// (scripts/validate-library-page.mjs warns about it).
import type { UILanguage } from '../i18n/ui';

export interface LibraryArea {
	id: string;
	label: Record<UILanguage, string>;
	/** Resource tags and pick section slugs that belong to this area. */
	topics: string[];
}

export const libraryAreas: LibraryArea[] = [
	{
		id: 'design',
		label: { ko: '디자인', jp: 'デザイン', en: 'Design' },
		topics: ['design-inspiration', 'typography', 'color', 'ui-patterns', 'design'],
	},
	{
		id: 'code',
		label: { ko: '코드·프론트엔드', jp: 'コード・フロントエンド', en: 'Code & Frontend' },
		topics: ['css-snippets', 'css-animation', 'css-generator', 'svg-generator', 'frontend-design', 'dev-docs'],
	},
	{
		id: 'ai-engineering',
		label: { ko: 'AI 엔지니어링', jp: 'AIエンジニアリング', en: 'AI Engineering' },
		topics: ['agent-skills', 'agent-context', 'context-compression', 'llm-gateway', 'model-routing', 'vibe-coding'],
	},
	{
		id: 'data-viz',
		label: { ko: '데이터 시각화', jp: 'データ可視化', en: 'Data Visualization' },
		topics: ['data-visualization'],
	},
	{
		id: 'learning',
		label: { ko: '배움·생각 도구', jp: '学び・思考ツール', en: 'Learning & Thinking' },
		topics: ['explorable-explanations', 'tools-for-thought'],
	},
	{
		id: 'creative',
		label: { ko: '창작', jp: '創作', en: 'Creative' },
		topics: ['video', 'touchdesigner', 'art', 'digital-music'],
	},
];

export const otherLibraryArea: LibraryArea = {
	id: 'other',
	label: { ko: '기타', jp: 'その他', en: 'Other' },
	topics: [],
};

const areaByTopic = new Map(libraryAreas.flatMap((area) => area.topics.map((topic) => [topic, area.id] as const)));

export function getLibraryAreaId(topics: readonly string[]): string {
	for (const topic of topics) {
		const area = areaByTopic.get(topic);
		if (area) return area;
	}
	return otherLibraryArea.id;
}

export function getLibraryArea(id: string): LibraryArea {
	return libraryAreas.find((area) => area.id === id) ?? otherLibraryArea;
}
