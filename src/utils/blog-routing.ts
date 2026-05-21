export const BLOG_LANGUAGES = ['ko', 'jp', 'en'] as const;

export type BlogLanguage = (typeof BLOG_LANGUAGES)[number];

type BlogPostLike = {
  id: string;
  filePath?: string;
};

function normalizeBlogId(postId: string): string {
  const normalized = postId
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.(md|mdx)$/i, '')
    .toLowerCase();

  if (!normalized) {
    throw new Error(`Invalid blog content id: ${postId}`);
  }

  return normalized;
}

function normalizeLanguage(lang: string | null | undefined, context: string): BlogLanguage {
  if (isBlogLanguage(lang)) {
    return lang;
  }

  throw new Error(`Invalid blog language for ${context}: ${String(lang)}`);
}

export function isBlogLanguage(value: unknown): value is BlogLanguage {
  return typeof value === 'string' && BLOG_LANGUAGES.includes(value as BlogLanguage);
}

export function getBlogLanguageFromId(
  postId: string,
  fallbackLang?: string | null,
): BlogLanguage {
  const [lang] = normalizeBlogId(postId).split('/');
  if (isBlogLanguage(lang)) {
    return lang;
  }

  if (fallbackLang !== undefined && fallbackLang !== null) {
    return normalizeLanguage(fallbackLang, `fallback for ${postId}`);
  }

  throw new Error(`Invalid blog content id: ${postId}`);
}

export function getBlogSlugFromId(postId: string): string {
  const segments = normalizeBlogId(postId).split('/');
  const slugSegments = isBlogLanguage(segments[0]) ? segments.slice(1) : segments;
  const slug = slugSegments.join('/');
  if (!slug) {
    throw new Error(`Invalid blog content id: ${postId}`);
  }

  return slug;
}

export function getBlogLanguageFromRouteParam(lang: string | null | undefined): BlogLanguage {
  return normalizeLanguage(lang, 'route param');
}

export function getBlogLanguageFromContentPath(contentPath: string): BlogLanguage {
  const segments = contentPath
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);

  for (let index = 0; index < segments.length - 1; index += 1) {
    if (segments[index] === 'blog' && isBlogLanguage(segments[index + 1])) {
      return segments[index + 1];
    }
  }

  throw new Error(`Invalid blog content path: ${contentPath}`);
}

export function getBlogLanguageFromPost(post: BlogPostLike): BlogLanguage {
  try {
    return getBlogLanguageFromId(post.id);
  } catch (error) {
    if (post.filePath) {
      return getBlogLanguageFromContentPath(post.filePath);
    }

    throw error;
  }
}

export function getBlogUrlFromId(postId: string, fallbackLang?: string | null): string {
  const lang = getBlogLanguageFromId(postId, fallbackLang);
  const slug = getBlogSlugFromId(postId);
  return `/${lang}/blog/${slug}/`;
}

export function getBlogUrlFromPost(post: BlogPostLike): string {
  return getBlogUrlFromId(post.id, getBlogLanguageFromPost(post));
}
