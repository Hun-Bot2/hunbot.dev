import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllPosts } from '../utils/blog';
import { SITE_URL, SUPPORTED_LANGUAGES } from '../consts';
import { getBlogUrlFromId } from '../utils/blog-routing';
import { getAcademicReviewUrlFromId, getPublishedAcademicReviews } from '../utils/academic-review-routing';
import { librarySections as pickLibrarySections } from '../data/librarySections';
import { getPickSectionCounts } from '../utils/picks';
import { learningPaths } from '../data/learningPaths';
import { getLearningPathUrl, getPublishedLearningPaths } from '../utils/learning-paths';
import { decks } from '../data/decks';
import { getTopicsWithLinkedPapers } from '../utils/research';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ?? new URL(SITE_URL);
  // Submitting a URL that 404s teaches search engines to trust this sitemap
  // less. The draft filter alone let 15 quality-gate-excluded posts through,
  // each of them a page that is never built. getAllPosts() is the single
  // definition of published.
  const posts = await getAllPosts();
  // getPublishedAcademicReviews() is the single definition of "published" for
  // reviews (docs/decisions/site-structure.md), the same rule getAllPosts()
  // is for blog posts — a draft review must never be advertised as a live URL.
  const academicReviews = getPublishedAcademicReviews(await getCollection('academicReviews'));
  const allPapers = await getCollection('papers');
  const allTopics = await getCollection('topics');
  // Topic pages are generated only for active topics with at least one linked
  // approved paper (docs/decisions/site-structure.md#Topic-pages) — the same
  // gate src/pages/[lang]/research/topics/[topic].astro's getStaticPaths uses,
  // so the sitemap never advertises a URL that build did not actually produce.
  const topicsWithPapers = getTopicsWithLinkedPapers(allTopics, allPapers);
  // Library picks (docs/decisions/site-structure.md#3,#5): a pick section
  // page is advertised only once it has at least one published pick, the
  // same "no thin pages" rule the topic pages above already follow. Design/
  // vibe-coding/dev-docs still render at zero picks — they must not
  // 404 (src/pages/[lang]/library/[section].astro) — but are not linked from
  // the sitemap until they carry real content.
  const allPicks = await getCollection('picks');
  const publishedPicks = allPicks.filter((pick) => pick.data.draft !== true);
  const pickSectionCounts = getPickSectionCounts(publishedPicks);
  const sectionsWithPicks = pickLibrarySections.filter((section) => (pickSectionCounts.get(section.slug) ?? 0) > 0);
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
  // Research hub replaces the retired /{lang}/reviews/ index
  // (docs/decisions/site-structure.md) — reviews now live at /{lang}/research/,
  // topic pages are generated (and listed here) only for topics that
  // actually have at least one linked paper, and decks now live at
  // /{lang}/research/decks/ (#2). The old Library decks path permanently
  // redirects there (vercel.json) and is not listed here.
  const listedDeckCount = decks.filter((deck) => deck.placement === 'paper' || deck.placement === 'project').length;
  const researchPages = SUPPORTED_LANGUAGES.flatMap((lang) => [
    `/${lang}/research/`,
    ...(listedDeckCount > 0 ? [`/${lang}/research/decks/`] : []),
    ...topicsWithPapers.map(({ topic }) => `/${lang}/research/topics/${topic.data.id}/`),
  ]);
  const staticPages = [
    '/',
    ...SUPPORTED_LANGUAGES.flatMap((lang) => [
      `/${lang}/`,
      `/${lang}/blog/`,
      `/${lang}/blog/categories/`,
      `/${lang}/library/`,
      `/${lang}/library/useful-feeds/`,
      // Explore / Living Atlas (docs/plans/2026-10-03-explore-living-atlas.md §4.1).
      `/${lang}/explore/`,
      ...sectionsWithPicks.map((section) => `/${lang}/library/${section.slug}/`),
      `/${lang}/search/`,
    ]),
    ...learningPathPages,
    ...researchPages,
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  ${staticPages.map((path) => `
  <url>
    <loc>${new URL(path, siteUrl).href}</loc>
    <lastmod>${listingLastmod}</lastmod>
    <changefreq>${path.includes('/library/') || path.includes('/paths/') || path.includes('/research/') ? 'monthly' : 'weekly'}</changefreq>
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
