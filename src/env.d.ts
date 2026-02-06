/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly UPSTASH_REDIS_REST_URL?: string;
	readonly UPSTASH_REDIS_REST_TOKEN?: string;
	readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
	readonly PUBLIC_GISCUS_ENABLED?: string;
	readonly PUBLIC_GISCUS_REPO?: string;
	readonly PUBLIC_GISCUS_REPO_ID?: string;
	readonly PUBLIC_GISCUS_CATEGORY?: string;
	readonly PUBLIC_GISCUS_CATEGORY_ID?: string;
	readonly PUBLIC_GISCUS_MAPPING?: string;
	readonly PUBLIC_GISCUS_STRICT?: string;
	readonly PUBLIC_GISCUS_REACTIONS_ENABLED?: string;
	readonly PUBLIC_GISCUS_EMIT_METADATA?: string;
	readonly PUBLIC_GISCUS_INPUT_POSITION?: string;
	readonly PUBLIC_GISCUS_THEME?: string;
	readonly PUBLIC_GISCUS_LANG?: string;
	readonly PUBLIC_GISCUS_LOADING?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
