export const BLOG_LANGUAGES = ['ko', 'jp', 'en'] as const;

export type BlogLanguage = (typeof BLOG_LANGUAGES)[number];

export function getBlogLanguageFromId(postId: string): BlogLanguage {
  const [lang] = postId.split('/');
  if (BLOG_LANGUAGES.includes(lang as BlogLanguage)) {
    return lang as BlogLanguage;
  }

  throw new Error(`Invalid blog content id: ${postId}`);
}

export function getBlogSlugFromId(postId: string): string {
  const [, ...slugSegments] = postId.split('/');
  const slug = slugSegments.join('/');
  if (!slug) {
    throw new Error(`Invalid blog content id: ${postId}`);
  }

  getBlogLanguageFromId(postId);
  return slug;
}

export function getBlogUrlFromId(postId: string): string {
  const lang = getBlogLanguageFromId(postId);
  const slug = getBlogSlugFromId(postId);
  return `/${lang}/blog/${slug}/`;
}
