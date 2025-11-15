// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Hun-Bot's Devlog";
export const SITE_DESCRIPTION =
	'Hun-Bot의 기술 블로그입니다. AI, 소프트웨어 개발, 글쓰기';
export const SITE_URL = 'https://hun-bot.dev';

export const SUPPORTED_LANGUAGES = ['ko', 'jp', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_HREF_MAP: Record<SupportedLanguage, string> = {
	ko: 'ko-KR',
	jp: 'ja-JP',
	en: 'en-US',
};

export const AUTHOR = 'Hun-Bot';
export const AUTHOR_EMAIL = 'surtrcode@gmail.com';
export const SOCIAL_LINKS = {
	github: 'https://github.com/Hun-Bot2',
	linkedin: 'https://www.linkedin.com/in/hunbot-dev/',
};

export const SITE_AUTHOR = {
	name: 'Hun-Bot',
	summary: '발자취',
};

export const GOOGLE_SITE_VERIFICATION = import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '';

export const GISCUS_CONFIG = {
	repo: import.meta.env.PUBLIC_GISCUS_REPO ?? 'Hun-Bot2/hunbot.dev',
	repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? '',
	category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? '',
	categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? '',
	mapping: import.meta.env.PUBLIC_GISCUS_MAPPING ?? 'pathname',
	strict: import.meta.env.PUBLIC_GISCUS_STRICT ?? '0',
	reactionsEnabled: import.meta.env.PUBLIC_GISCUS_REACTIONS_ENABLED ?? '1',
	emitMetadata: import.meta.env.PUBLIC_GISCUS_EMIT_METADATA ?? '0',
	inputPosition: import.meta.env.PUBLIC_GISCUS_INPUT_POSITION ?? 'bottom',
	theme: import.meta.env.PUBLIC_GISCUS_THEME ?? 'preferred_color_scheme',
	lang: import.meta.env.PUBLIC_GISCUS_LANG ?? 'ko',
	loading: import.meta.env.PUBLIC_GISCUS_LOADING ?? 'lazy',
	enabled: import.meta.env.PUBLIC_GISCUS_ENABLED !== 'false',
};
