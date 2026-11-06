const LANG_PREFIX = /^\/(?:ko|jp|en)(?=\/|$)/;

/**
 * An on-site path without language prefix, query or hash, with one trailing
 * slash: the key that backlinks (src/utils/backlinks.ts) and link previews
 * (src/utils/link-previews.ts) match on-site targets by. Pure and tiny, so the
 * browser bundle can import it.
 */
export function normalizeSitePath(path: string): string {
	const withoutLang = path.replace(LANG_PREFIX, '');
	const trimmed = withoutLang.replace(/[?#].*$/, '');
	const rooted = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return rooted.endsWith('/') ? rooted : `${rooted}/`;
}
