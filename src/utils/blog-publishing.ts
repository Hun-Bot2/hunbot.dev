// The rules that decide whether a blog post is published, with no
// `astro:content` import, so plain Node scripts (the public-artifact adapters
// in src/utils/artifacts/ and scripts/validate-artifacts.mjs) apply exactly
// the same definition of "published" as getAllPosts() in ./blog.ts, which
// re-exports everything here. Moved out of blog.ts unchanged on 2026-10-04.
import { getBlogLanguageFromId } from './blog-routing.ts';

/** The subset of a blog collection entry these rules read. */
export type PublishablePost = {
  id: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    tags?: string[];
    category?: string;
    series?: string;
    draft?: boolean;
  };
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
export function getFrontmatterIssues(post: PublishablePost): string[] {
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
export function isPublishable(post: PublishablePost): boolean {
  return !post.data.draft && getFrontmatterIssues(post).length === 0;
}

function getDuplicateKey(post: PublishablePost): string | null {
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
export function excludeDuplicates<T extends PublishablePost>(posts: T[]): T[] {
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
 * Drafts, placeholder frontmatter, and duplicates removed — the same set
 * getAllPosts() returns, before sorting.
 */
export function selectPublishedPosts<T extends PublishablePost>(posts: T[]): T[] {
  return excludeDuplicates(posts.filter((post) => isPublishable(post)));
}
