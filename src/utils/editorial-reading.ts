import { resolveCoverMotif, type CoverMotif } from './editorial-covers.ts';
import { selectPublishedPosts, type PublishablePost } from './blog-publishing.ts';
import { getBlogLanguageFromId, getBlogSlugFromId, getBlogUrlFromId } from './blog-routing.ts';

type Candidate = PublishablePost & { data: PublishablePost['data'] & { description?: string; heroImage?: string; editorial?: { motif?: CoverMotif } } };
export function resolveEditorialReading(slugs: string[], posts: Candidate[], lang: string, selfId?: string) {
 const published = selectPublishedPosts(posts);
 return [...new Set(slugs)].flatMap(slug => {
  const post = published.find(post => post.id !== selfId && getBlogLanguageFromId(post.id) === lang && getBlogSlugFromId(post.id) === slug);
  return post ? [{ title: post.data.title, url: getBlogUrlFromId(post.id), description: post.data.description ?? '', image: post.data.heroImage, motif: resolveCoverMotif(post.id, post.data.editorial?.motif), relation: lang === 'en' ? 'From this blog' : lang === 'jp' ? 'このブログの記事' : '이 블로그의 글' }] : [];
 }).slice(0,3);
}
