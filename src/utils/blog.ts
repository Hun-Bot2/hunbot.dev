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

