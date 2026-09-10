import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, SUPPORTED_LANGUAGES } from '../../consts';
import { getBlogLanguageFromId, getBlogUrlFromId } from '../../utils/blog-routing';

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

	const posts = await getCollection('blog', ({ data }) => !data.draft);
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
