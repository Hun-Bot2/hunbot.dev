import { getCollection, type CollectionEntry } from 'astro:content';
import { getBlogLanguageFromId, getBlogSlugFromId, getBlogUrlFromPost } from './blog-routing';
import type { UILanguage } from '../i18n/ui';

export type BlogPost = CollectionEntry<'blog'>;

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
  'contemplation': 'misc',
  'misc': 'misc',
  'retrospective': 'misc',
  'study': 'misc',
  'thoughts': 'misc',
};

// Template frontmatter left over from copy-pasting a new post. These values are
// structurally valid per the Zod schema (a string is a string, an array of
// strings is an array of strings) but are never real content.
const PLACEHOLDER_DESCRIPTIONS = new Set(['설명 입력', 'Enter description', '説明を入力']);
const PLACEHOLDER_TAGS = new Set(['tag1', 'tag2', 'tag']);
const PLACEHOLDER_CATEGORY = 'category';
const PLACEHOLDER_SERIES = new Set(['series 이름', 'series name']);

/**
 * List the reasons a post's frontmatter looks like unedited template content,
 * rather than real values. An empty array means the frontmatter is clean.
 */
export function getFrontmatterIssues(post: BlogPost): string[] {
  const issues: string[] = [];
  const { description, tags, category, series } = post.data;

  // Only exact template strings count. A short description is a style choice,
  // not a defect: gating on length hid real posts whose descriptions were simply
  // terse. Use `draft: true` to hold back a stub.
  const trimmedDescription = description?.trim() ?? '';
  if (PLACEHOLDER_DESCRIPTIONS.has(trimmedDescription)) {
    issues.push('placeholder description');
  }

  if (tags?.some((tag) => PLACEHOLDER_TAGS.has(tag.trim().toLowerCase()))) {
    issues.push('placeholder tags');
  }

  if (category?.trim().toLowerCase() === PLACEHOLDER_CATEGORY) {
    issues.push('placeholder category');
  }

  if (series && PLACEHOLDER_SERIES.has(series.trim().toLowerCase())) {
    issues.push('placeholder series');
  }

  return issues;
}

/**
 * A post is publishable when it is not a draft and its frontmatter contains
 * no template placeholder values.
 */
export function isPublishable(post: BlogPost): boolean {
  return !post.data.draft && getFrontmatterIssues(post).length === 0;
}

function getDuplicateKey(post: BlogPost): string | null {
  let language: string;
  try {
    language = getBlogLanguageFromId(post.id);
  } catch {
    return null;
  }

  return `${language}::${post.data.title.trim()}::${post.data.pubDate.toISOString().slice(0, 10)}`;
}

/**
 * Same language + same title + same pubDate is always a mistake (a copy-pasted
 * post that was never renamed), never a legitimate case. Excludes every copy,
 * not just the extras.
 */
export function excludeDuplicates(posts: BlogPost[]): BlogPost[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const key = getDuplicateKey(post);
    if (key === null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return posts.filter((post) => {
    const key = getDuplicateKey(post);
    return key === null || counts.get(key) === 1;
  });
}

/**
 * Get all blog posts sorted by publication date (newest first).
 *
 * A post is excluded when it is a draft, when its frontmatter is unedited
 * template content (see `getFrontmatterIssues`), or when it duplicates another
 * post's language + title + pubDate. `getCollection`'s predicate only has
 * access to a single entry at a time, so duplicate detection runs after the
 * collection is loaded, once the full list is available.
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const withoutPlaceholders = posts.filter((post) => isPublishable(post));
  const withoutDuplicates = excludeDuplicates(withoutPlaceholders);
  return sortPostsByDateDesc(withoutDuplicates);
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

/**
 * Count posts per normalized category bucket (`ai`, `devlog`, `review`, `misc`).
 *
 * `getCategoryCounts` counts raw frontmatter values, of which there are currently
 * ~21 across ~50 posts. Filter controls need the four display buckets instead, so
 * they stay legible and match `CategoryBadge`.
 */
export function getNormalizedCategoryCounts(posts: BlogPost[]): Map<string, number> {
  return posts.reduce((categoryMap, post) => {
    const category = normalizeCategory(post.data.category);
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    return categoryMap;
  }, new Map<string, number>());
}

/**
 * Publication years present in the given posts, newest first.
 */
export function getPostYears(posts: BlogPost[]): number[] {
  const years = new Set(posts.map((post) => post.data.pubDate.getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Series that actually group posts together.
 *
 * Single-post series are excluded: they add filter controls that never narrow
 * anything, which is what made series grouping unusable as a primary axis.
 */
export function getMultiPostSeries(posts: BlogPost[]): { name: string; count: number }[] {
  const seriesMap = posts.reduce((map, post) => {
    const series = post.data.series?.trim();
    if (!series) return map;
    map.set(series, (map.get(series) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return Array.from(seriesMap.entries())
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
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
