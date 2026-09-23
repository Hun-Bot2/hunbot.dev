import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllPosts } from '../utils/blog';
import { SITE_URL, SUPPORTED_LANGUAGES } from '../consts';
import { getBlogUrlFromId } from '../utils/blog-routing';
import { getAcademicReviewUrlFromId } from '../utils/academic-review-routing';
import { getLibrarySectionPath, librarySections } from '../utils/library';
import { learningPaths } from '../data/learningPaths';
import { getLearningPathUrl, getPublishedLearningPaths } from '../utils/learning-paths';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ?? new URL(SITE_URL);
  // Submitting a URL that 404s teaches search engines to trust this sitemap
  // less. The draft filter alone let 15 quality-gate-excluded posts through,
  // each of them a page that is never built. getAllPosts() is the single
  // definition of published.
  const posts = await getAllPosts();
  const academicReviews = await getCollection('academicReviews');
  // `lastmod` for listing pages is derived from the newest content they can
  // show, NOT from the build clock.
  //
  // `new Date()` made every build claim that every static page had just changed.
  // That is false — a rebuild with no content change modifies nothing — and
  // search engines discount a lastmod they find unreliable, so the inaccuracy
  // costs the signal it was meant to provide. It also made the sitemap the only
  // build artifact that differed between two builds of identical source.
  //
  // Date precision, not milliseconds: a listing page changes on the day new
  // content lands, and a timestamp implies a precision this value does not have.
  const contentDates = [
    ...posts.map((post) => post.data.updatedDate ?? post.data.pubDate),
    ...academicReviews.map((review) => review.data.pubDate),
  ].map((date) => date.valueOf());
  const newestContent = contentDates.length > 0 ? new Date(Math.max(...contentDates)) : new Date(0);
  const listingLastmod = newestContent.toISOString().slice(0, 10);
  const learningPathPages = SUPPORTED_LANGUAGES.flatMap((lang) => [
    `/${lang}/paths/`,
    ...getPublishedLearningPaths(learningPaths).map((path) => getLearningPathUrl(lang, path.id)),
  ]);
  const staticPages = [
    '/',
    ...SUPPORTED_LANGUAGES.flatMap((lang) => [
      `/${lang}/`,
      `/${lang}/blog/`,
      `/${lang}/blog/categories/`,
      `/${lang}/blog/tags/`,
      `/${lang}/reviews/`,
      `/${lang}/library/`,
      `/${lang}/search/`,
      ...librarySections.map((section) => getLibrarySectionPath(lang, section.id)),
    ]),
    ...learningPathPages,
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  ${staticPages.map((path) => `
  <url>
    <loc>${new URL(path, siteUrl).href}</loc>
    <lastmod>${listingLastmod}</lastmod>
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
