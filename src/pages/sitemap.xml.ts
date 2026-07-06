import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, SUPPORTED_LANGUAGES } from '../consts';
import { getBlogUrlFromId } from '../utils/blog-routing';
import { getBlogPageUrl, getPostsByLanguage, getTotalBlogPages } from '../utils/blog';
import { getAcademicReviewUrlFromId } from '../utils/academic-review-routing';
import { getLibrarySectionPath, librarySections } from '../utils/library';
import { learningPaths } from '../data/learningPaths';
import { getLearningPathUrl, getPublishedLearningPaths } from '../utils/learning-paths';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ?? new URL(SITE_URL);
  const posts = await getCollection('blog');
  const academicReviews = await getCollection('academicReviews');
  const now = new Date().toISOString();
  const blogPaginationPages = SUPPORTED_LANGUAGES.flatMap((lang) => {
    const totalPages = getTotalBlogPages(getPostsByLanguage(posts, lang));
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      getBlogPageUrl(lang, index + 2),
    );
  });
  const learningPathPages = SUPPORTED_LANGUAGES.flatMap((lang) => [
    `/${lang}/paths/`,
    ...getPublishedLearningPaths(learningPaths).map((path) => getLearningPathUrl(lang, path.id)),
  ]);
  const staticPages = [
    '/',
    '/about/',
    ...SUPPORTED_LANGUAGES.flatMap((lang) => [
      `/${lang}/`,
      `/${lang}/about/`,
      `/${lang}/blog/`,
      `/${lang}/blog/categories/`,
      `/${lang}/blog/tags/`,
      `/${lang}/reviews/`,
      `/${lang}/library/`,
      `/${lang}/search/`,
      ...librarySections.map((section) => getLibrarySectionPath(lang, section.id)),
    ]),
    ...blogPaginationPages,
    ...learningPathPages,
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  ${staticPages.map((path) => `
  <url>
    <loc>${new URL(path, siteUrl).href}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${path.includes('/library/') || path.includes('/paths/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${path === '/' ? '1.0' : path.endsWith('/blog/') ? '0.9' : '0.7'}</priority>
  </url>`).join('')}
  
  <!-- Blog posts -->
  ${posts.map(post => `
  <url>
    <loc>${new URL(getBlogUrlFromId(post.id), siteUrl).href}</loc>
    <lastmod>${post.data.updatedDate?.toISOString() || post.data.pubDate.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Academic reviews -->
  ${academicReviews.map(review => `
  <url>
    <loc>${new URL(getAcademicReviewUrlFromId(review.id), siteUrl).href}</loc>
    <lastmod>${review.data.pubDate.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
