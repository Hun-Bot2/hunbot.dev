import { useTranslations, type UILanguage } from '../i18n/ui';
import { librarySections } from '../data/librarySections';

/** Display label for a Library item's kind facet (tool / repo / site / skill / reference). */
export function getLibraryKindLabel(kind: string, lang: UILanguage): string {
	return useTranslations(lang)(`library.pick.kind.${kind}` as Parameters<ReturnType<typeof useTranslations>>[0]);
}

/**
 * Display label for a Library item's topic facet: a pick section's localized
 * label, otherwise the resource tag itself (English kebab-case, kept in
 * English like the item names), with spaces for hyphens.
 */
export function getLibraryTopicLabel(topic: string, lang: UILanguage): string {
	const section = librarySections.find((item) => item.slug === topic);
	return section?.label[lang] ?? topic.replaceAll('-', ' ');
}
