import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getBlogUrlFromId } from '../utils/blog-routing';
import { getAllPosts } from '../utils/blog';

export async function GET(context) {
	// getAllPosts(), not a draft filter. A post is published only when it is not
	// a draft AND has no placeholder frontmatter; the draft filter alone catches
	// half of that, and this feed shipped 15 links to pages that were never built.
	const posts = await getAllPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: getBlogUrlFromId(post.id),
		})),
	});
}
