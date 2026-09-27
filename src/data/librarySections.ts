// Library "picks" section registry.
//
// Picks are data, not code: a section is a plain object here, never a Zod
// enum or a hard-coded union. `src/content.config.ts`'s `picks` collection
// stores a section slug and cross-checks it against `isLibrarySectionSlug`
// (never a Zod enum), matching the pattern src/data/discoverFacets.ts and
// src/data/venues.ts already establish for other registries in this repo.
//
// This replaces the hard-coded section list a later block will use to wire
// up Library pages — this file only defines the data.

export interface LibrarySection {
	/** Canonical, stable, lowercase, slug-safe. Never reused once written. */
	slug: string;
	label: {
		ko: string;
		en: string;
		jp: string;
	};
	/**
	 * One-line UI copy describing what external resources this section
	 * collects. Always about the resources the section curates, never about
	 * the site owner's own work.
	 */
	description: {
		ko: string;
		en: string;
		jp: string;
	};
}

export const librarySections = [
	{
		slug: 'design',
		label: { ko: '디자인', en: 'Design', jp: 'デザイン' },
		description: {
			ko: '참고할 만한 외부 디자인 자료와 레퍼런스를 모아둡니다.',
			en: 'External design resources and references worth revisiting.',
			jp: '参考になる外部のデザイン資料とリファレンスを集めます。',
		},
	},
	{
		slug: 'vibe-coding',
		label: { ko: '바이브 코딩', en: 'Vibe Coding', jp: 'バイブコーディング' },
		description: {
			ko: 'AI와 함께 코딩할 때 쓰는 SKILL, 에이전트 설정, 도구를 모아둡니다.',
			en: 'SKILLs, agent configs, and tools for coding with AI.',
			jp: 'AIと一緒にコーディングする際のSKILL、エージェント設定、ツールを集めます。',
		},
	},
	{
		slug: 'dev-docs',
		label: { ko: '개발 문서', en: 'Developer Docs', jp: '開発ドキュメント' },
		description: {
			ko: '개발하다 막힐 때 바로 열어보는 외부 공식 문서를 모아둡니다.',
			en: 'External official documentation worth opening when stuck.',
			jp: '開発で行き詰まったときに開く外部の公式ドキュメントを集めます。',
		},
	},
	{
		slug: 'video',
		label: { ko: '영상', en: 'Video', jp: '映像' },
		description: {
			ko: '영상을 만들 때 참고하는 외부 도구와 레퍼런스를 모아둡니다.',
			en: 'Tools and references for making videos.',
			jp: '映像制作の際に参考にする外部ツールとリファレンスを集めます。',
		},
	},
	{
		slug: 'touchdesigner',
		label: { ko: 'TouchDesigner', en: 'TouchDesigner', jp: 'TouchDesigner' },
		description: {
			ko: 'TouchDesigner 작업에 참고하는 외부 자료를 모아둡니다.',
			en: 'External references worth keeping for TouchDesigner work.',
			jp: 'TouchDesignerの作業で参考にする外部資料を集めます。',
		},
	},
	{
		slug: 'art',
		label: { ko: '아트', en: 'Art', jp: 'アート' },
		description: {
			ko: '영감을 주는 외부 아트 작업과 아티스트 자료를 모아둡니다.',
			en: 'External art work and artist references worth revisiting.',
			jp: 'インスピレーションを与える外部のアート作品とアーティスト資料を集めます。',
		},
	},
	{
		slug: 'digital-music',
		label: { ko: '디지털 음악', en: 'Digital Music', jp: 'デジタル音楽' },
		description: {
			ko: '디지털 음악 제작에 참고하는 외부 도구와 자료를 모아둡니다.',
			en: 'External tools and references for making digital music.',
			jp: 'デジタル音楽制作で参考にする外部ツールと資料を集めます。',
		},
	},
] as const satisfies readonly LibrarySection[];

export type LibrarySectionSlug = (typeof librarySections)[number]['slug'];

export const librarySectionSlugs: readonly string[] = librarySections.map((section) => section.slug);

export function isLibrarySectionSlug(value: unknown): value is LibrarySectionSlug {
	return typeof value === 'string' && librarySectionSlugs.includes(value);
}

const seenSlugs = new Set<string>();
for (const section of librarySections) {
	if (seenSlugs.has(section.slug)) {
		throw new Error(`Invalid librarySections registry: duplicate slug "${section.slug}".`);
	}
	seenSlugs.add(section.slug);
}
