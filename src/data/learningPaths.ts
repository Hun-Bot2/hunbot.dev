import type { UILanguage } from '../i18n/ui';

export type LocalizedPathText = Partial<Record<UILanguage, string>>;

export type LearningPathStatus = 'draft' | 'published' | 'archived';

export type LearningPathStep = {
	id: string;
	title: LocalizedPathText;
	note: LocalizedPathText;
	postIds: Partial<Record<UILanguage, string>>;
	fallbackPostId: string;
};

export type LearningPath = {
	id: string;
	status: LearningPathStatus;
	title: LocalizedPathText;
	description: LocalizedPathText;
	updatedAt: string;
	minimumSteps: number;
	topicIds: string[];
	resourceIds: string[];
	paperIds: string[];
	deckIds: string[];
	steps: LearningPathStep[];
};

export const learningPaths: LearningPath[] = [
	{
		id: 'blog-knowledge-hub',
		status: 'published',
		title: {
			ko: '블로그를 지식 허브로 키우는 경로',
			en: 'Growing the blog into a knowledge hub',
			jp: 'ブログをナレッジハブへ育てる道筋',
		},
		description: {
			ko: '개인 기술 블로그를 정적이고 검색 가능한 AI-native 지식 허브로 확장하는 과정입니다.',
			en: 'A path about extending a personal tech blog into a static, searchable AI-native knowledge hub.',
			jp: '個人技術ブログを静的で検索可能なAI-nativeナレッジハブへ広げる過程です。',
		},
		updatedAt: '2026-05-29',
		minimumSteps: 2,
		topicIds: ['ai-agents'],
		resourceIds: ['sample-dev-docs-resource', 'sample-vibe-coding-resource'],
		paperIds: [],
		deckIds: ['sample-deck'],
		steps: [
			{
				id: 'site-foundation',
				title: {
					ko: '블로그 기반 만들기',
					en: 'Build the blog foundation',
					jp: 'ブログの基盤を作る',
				},
				note: {
					ko: '정적 블로그의 구조와 기록 방식을 먼저 정리합니다.',
					en: 'Start by shaping the static blog structure and publishing workflow.',
					jp: 'まず静的ブログの構造と公開ワークフローを整えます。',
				},
				postIds: {
					ko: 'ko/devlog/blog/blog_develop_01',
					en: 'en/devlog/blog/blog_develop_01',
				},
				fallbackPostId: 'ko/devlog/blog/blog_develop_01',
			},
			{
				id: 'searchable-knowledge',
				title: {
					ko: '검색 가능한 지식 구조로 확장하기',
					en: 'Move toward a searchable knowledge structure',
					jp: '検索可能な知識構造へ広げる',
				},
				note: {
					ko: '글, 라이브러리, 발표 자료를 다시 찾기 쉬운 구조로 연결합니다.',
					en: 'Connect posts, Library resources, and presentation material so they are easy to revisit.',
					jp: '記事、ライブラリ、発表資料を再訪しやすい構造でつなげます。',
				},
				postIds: {
					ko: 'ko/devlog/blog/blog_develop_07',
					en: 'en/devlog/blog/blog_develop_07',
				},
				fallbackPostId: 'ko/devlog/blog/blog_develop_07',
			},
		],
	},
];
