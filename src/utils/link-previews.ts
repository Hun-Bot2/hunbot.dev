import type { UILanguage } from '../i18n/ui';
import { normalizeSitePath } from './site-path.ts';

// Link previews: the data a hover/focus preview card and the LinkCard component
// show for an on-site target. Pure, so the browser script, the build-time
// endpoint (src/pages/link-previews.json.ts) and LinkCard share one shape.

export type PreviewKind = 'post' | 'explainer' | 'weekly' | 'item' | 'library';

export interface LinkPreview {
	kind: PreviewKind;
	/** Reading time in minutes when the target is an article. */
	readMinutes?: number;
	title: Partial<Record<UILanguage, string>>;
	description: Partial<Record<UILanguage, string>>;
	/** The target's own image, never a generated or borrowed one. */
	image?: string;
}

/** Keyed by `normalizeSitePath(path)`: language-independent. */
export type LinkPreviewMap = Record<string, LinkPreview>;

export interface LinkPreviewPayload {
	/** Localized kind names and the "{n}분" template, so the script holds no UI strings. */
	kinds: Record<PreviewKind, Partial<Record<UILanguage, string>>>;
	minutes: Partial<Record<UILanguage, string>>;
	items: LinkPreviewMap;
}

export const PREVIEWS_URL = '/link-previews.json';

/** The preview of a target path, or null (unpublished targets are simply absent). */
export function lookupPreview(items: LinkPreviewMap, pathname: string): LinkPreview | null {
	return items[normalizeSitePath(pathname)] ?? null;
}

/** Title or description in the reader's language, falling back to Korean, then to anything. */
export function pickLocalized(text: Partial<Record<UILanguage, string>>, lang: UILanguage): string {
	return text[lang] ?? text.ko ?? Object.values(text)[0] ?? '';
}
