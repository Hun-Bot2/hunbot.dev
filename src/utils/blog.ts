import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Get all blog posts sorted by publication date (newest first)
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Normalize category - convert any category to one of our standard categories
 */
export function normalizeCategory(category?: string): string {
  if (!category) return 'misc';
  
  const normalized = category.toLowerCase();
  
  // Map various category names to our standard categories
  if (normalized.includes('ai') || normalized.includes('lifelog') || normalized.includes('논문')) {
    return 'ai';
  }
  if (normalized.includes('dev') || normalized.includes('개발')) {
    return 'devlog';  
  }
  if (normalized.includes('review') || normalized.includes('리뷰')) {
    return 'review';
  }
  
  return 'misc';
}

/**
 * Get posts filtered by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter(post => normalizeCategory(post.data.category) === category);
}

/**
 * Get unique categories from all posts
 */
export async function getCategories(): Promise<string[]> {
  const posts = await getCollection('blog');
  const categories = [...new Set(posts.map(post => normalizeCategory(post.data.category)))];
  return categories.sort();
}

/**
 * Get post slug - use post.id if no custom slug is provided
 */
export function getPostSlug(post: BlogPost): string {
  return post.id;
}

/**
 * Get post URL based on slug
 */
export function getPostUrl(post: BlogPost): string {
  return `/blog/${getPostSlug(post)}/`;
}

/**
 * Estimate word count from content (rough estimation)
 */
export function estimateWordCount(content: string): number {
  return Math.floor(content.length / 5);
}

/**
 * Calculate reading time based on word count (200 words per minute)
 */
export function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'ai': 'AI & Machine Learning',
    'devlog': 'Development Log',
    'review': 'Reviews & Analysis',
    'misc': 'Miscellaneous'
  };
  
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Get category description
 */
export function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'ai': 'Articles about artificial intelligence, machine learning, and data science',
    'devlog': 'Development insights, coding tutorials, and technical progress logs',
    'review': 'Reviews of tools, papers, books, and technical resources',
    'misc': 'Various topics and thoughts that don\'t fit other categories'
  };
  
  return descriptions[category] || `Posts related to ${category}`;
}

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): boolean {
  const validCategories = ['ai', 'devlog', 'review', 'misc'];
  return validCategories.includes(category);
}
