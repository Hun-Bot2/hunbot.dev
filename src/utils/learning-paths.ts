import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import type { LearningPath, LearningPathStep, LocalizedPathText } from '../data/learningPaths';
import {
	getBlogLanguageFromPost,
	getBlogUrlFromPost,
	type BlogLanguage,
} from './blog-routing.ts';

export type BlogEntry = CollectionEntry<'blog'>;

export type ResolvedLearningPathStep = {
	step: LearningPathStep;
	post: BlogEntry;
	postLanguage: BlogLanguage;
	url: string;
	isLanguageFallback: boolean;
};

export const learningPathLanguages = ['ko', 'jp', 'en'] as const satisfies readonly UILanguage[];

export function normalizeLearningPathRef(value: string): string {
	return value
		.trim()
		.replace(/\\/g, '/')
		.replace(/^\/+|\/+$/g, '')
		.replace(/\.(md|mdx)$/i, '')
		.toLowerCase();
}

export function getLocalizedPathText(value: LocalizedPathText, lang: UILanguage): string {
	return value[lang] ?? value.ko ?? value.en ?? value.jp ?? '';
}

export function getLearningPathUrl(lang: UILanguage, pathId: string): string {
	return `/${lang}/paths/${pathId}/`;
}

export function isPublishedLearningPath(path: LearningPath): boolean {
	return path.status === 'published';
}

export function getPublishedLearningPaths(paths: LearningPath[]): LearningPath[] {
	return paths.filter(isPublishedLearningPath);
}

export function buildBlogPostMap(posts: BlogEntry[]): Map<string, BlogEntry> {
	return new Map(posts.map((post) => [normalizeLearningPathRef(post.id), post]));
}

export function resolveLearningPathStep(
	step: LearningPathStep,
	postMap: Map<string, BlogEntry>,
	lang: UILanguage,
): ResolvedLearningPathStep | null {
	const candidateIds = [
		step.postIds[lang],
		step.fallbackPostId,
		step.postIds.ko,
		step.postIds.en,
		step.postIds.jp,
	].filter((value): value is string => Boolean(value));
	const uniqueCandidateIds = [...new Set(candidateIds.map(normalizeLearningPathRef))];

	for (const candidateId of uniqueCandidateIds) {
		const post = postMap.get(candidateId);
		if (!post) continue;

		const postLanguage = getBlogLanguageFromPost(post);
		return {
			step,
			post,
			postLanguage,
			url: getBlogUrlFromPost(post),
			isLanguageFallback: postLanguage !== lang,
		};
	}

	return null;
}

export function resolveLearningPathSteps(
	path: LearningPath,
	posts: BlogEntry[],
	lang: UILanguage,
): ResolvedLearningPathStep[] {
	const postMap = buildBlogPostMap(posts);
	return path.steps
		.map((step) => resolveLearningPathStep(step, postMap, lang))
		.filter((step): step is ResolvedLearningPathStep => Boolean(step));
}

export function getVisibleLearningPaths(
	paths: LearningPath[],
	posts: BlogEntry[],
	lang: UILanguage,
): LearningPath[] {
	return getPublishedLearningPaths(paths).filter((path) => {
		const minimumSteps = Math.max(1, path.minimumSteps);
		return resolveLearningPathSteps(path, posts, lang).length >= minimumSteps;
	});
}
