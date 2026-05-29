import { getCollection, type CollectionEntry } from 'astro:content';
import { getBlogLanguageFromId, getBlogSlugFromId, getBlogUrlFromPost } from './blog-routing';
import type { UILanguage } from '../i18n/ui';

export type BlogPost = CollectionEntry<'blog'>;
export const BLOG_PAGE_SIZE = 12;

const CATEGORY_ALIASES: Record<string, 'ai' | 'devlog' | 'review' | 'misc'> = {
  'ai engineering': 'ai',
  'ai-frontier': 'ai',
  'paper': 'ai',
  '공부': 'ai',
  '勉強': 'ai',
  'devlog': 'devlog',
  'add_on_doctor_devlog': 'devlog',
  'algo_bot': 'devlog',
  'app_devlog': 'devlog',
  'autonomous_car': 'devlog',
  'blog_devlog': 'devlog',
  'chatting_system': 'devlog',
  'jp_app_devlog': 'devlog',
  'local_llm_devlog': 'devlog',
  'on-the-block': 'devlog',
  'onpremise_devlog': 'devlog',
  'stock_app_devlog': 'devlog',
  'vsextension_devlog': 'devlog',
  'paper_review': 'review',
  'review': 'review',
  'hackathon': 'review',
  'skku_ai_hackathon': 'review',
  'snu_kossda': 'review',
  'architecture': 'misc',
  'career': 'misc',
  'category': 'misc',
  'contemplation': 'misc',
  'misc': 'misc',
  'retrospective': 'misc',
  'study': 'misc',
  'thoughts': 'misc',
};

/**
 * Get all blog posts sorted by publication date (newest first)
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return sortPostsByDateDesc(posts);
}

export function sortPostsByDateDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function filterPostsByLanguage(posts: BlogPost[], lang: UILanguage): BlogPost[] {
  return posts.filter((post) => {
    try {
      return getBlogLanguageFromId(post.id) === lang;
    } catch {
      return false;
    }
  });
}

export function sortPostsBySeries(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const aOrder = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
  });
}

export function getPostsByLanguage(posts: BlogPost[], lang: UILanguage): BlogPost[] {
  return sortPostsByDateDesc(filterPostsByLanguage(posts, lang));
}

export function getTotalBlogPages(posts: BlogPost[], pageSize = BLOG_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(posts.length / pageSize));
}

export function getPaginatedPosts(posts: BlogPost[], page: number, pageSize = BLOG_PAGE_SIZE): BlogPost[] {
  const start = (page - 1) * pageSize;
  return posts.slice(start, start + pageSize);
}

export function getBlogPageUrl(lang: UILanguage, page: number): string {
  return page <= 1 ? `/${lang}/blog/` : `/${lang}/blog/page/${page}/`;
}

export function getCategoryKey(post: BlogPost): string {
  return post.data.category ?? 'uncategorized';
}

export function getCategoryCounts(posts: BlogPost[]): Map<string, number> {
  return posts.reduce((categoryMap, post) => {
    const category = getCategoryKey(post);
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    return categoryMap;
  }, new Map<string, number>());
}

export function getSeriesPosts(posts: BlogPost[], lang: UILanguage, seriesName: string): BlogPost[] {
  return sortPostsBySeries(
    filterPostsByLanguage(posts, lang).filter((post) => post.data.series === seriesName),
  );
}

/**
 * Normalize category - convert known aliases to grouped category badges.
 */
export function normalizeCategory(category?: string): string {
  if (!category) return 'misc';

  return CATEGORY_ALIASES[category.trim().toLowerCase()] ?? 'misc';
}


/**
 * Get post slug - use post.id if no custom slug is provided
 */
export function getPostSlug(post: BlogPost): string {
  return getBlogSlugFromId(post.id);
}

/**
 * Get post URL based on slug
 */
export function getPostUrl(post: BlogPost): string {
  return getBlogUrlFromPost(post);
}

/**
 * Estimate word count from markdown content
 */
export function estimateWordCount(content: string): number {
  if (!content) return 0;
  
  // Remove markdown formatting and HTML tags
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Remove links but keep text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s가-힣]/g, ' ') // Keep only words and Korean characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (!plainText) return 0;
  
  // Count words (split by whitespace)
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculate reading time based on word count (200 words per minute)
 */
export function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}
