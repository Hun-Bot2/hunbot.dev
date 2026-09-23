import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION, SUPPORTED_LANGUAGES } from '../../consts';
import { getBlogLanguageFromId, getBlogUrlFromId } from '../../utils/blog-routing';
import { getAllPosts } from '../../utils/blog';

export function getStaticPaths() {
	return SUPPORTED_LANGUAGES.map((lang) => ({
		params: { lang },
	}));
}

export async function GET(context) {
	const lang = context.params.lang;
	if (!SUPPORTED_LANGUAGES.includes(lang)) {
		return new Response('Not found', { status: 404 });
	}

	// See src/pages/rss.xml.js: the draft filter alone is not what published
	// means, and this feed carried 15 dead links out of 52 because of it.
	const posts = await getAllPosts();
	const languagePosts = posts.filter((post) => {
		try {
			return getBlogLanguageFromId(post.id) === lang;
		} catch {
			return false;
		}
	});

	return rss({
		title: `${SITE_TITLE} (${lang})`,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: languagePosts.map((post) => ({
			...post.data,
			link: getBlogUrlFromId(post.id),
		})),
	});
}
