import { readArtifactSources } from './lib/read-artifact-sources.mjs';
import { buildSeriesIndex } from '../src/utils/artifacts/series.ts';
import { getBlogLanguageFromId, getBlogSlugFromId } from '../src/utils/blog-routing.ts';
import { selectPublishedPosts } from '../src/utils/blog-publishing.ts';

const { blog } = readArtifactSources(process.cwd());
const published = selectPublishedPosts(blog);
const translations = new Map();
for (const post of published) {
	const slug = getBlogSlugFromId(post.id);
	const records = translations.get(slug) ?? [];
	records.push({ lang: getBlogLanguageFromId(post.id), series: post.data.series });
	translations.set(slug, records);
}
const series = buildSeriesIndex(translations);
const unillustrated = published.filter(post => !post.data.heroImage);
const coverReview = unillustrated.map(post => ({
	id: post.id,
	title: post.data.title,
	motif: post.data.editorial?.motif ?? null,
}));
console.log(JSON.stringify({
	published: published.length,
	seriesPosts: published.filter(post => post.data.series).length,
	series: new Set([...series.bySlug.values()].filter(Boolean).map(record => record.id)).size,
	seriesNameConflicts: series.inconsistent,
	generatedCovers: coverReview.filter(cover => cover.motif).length,
	coverReview: coverReview.filter(cover => !cover.motif),
}, null, 2));
