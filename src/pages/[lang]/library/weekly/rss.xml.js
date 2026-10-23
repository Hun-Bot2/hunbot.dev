import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SUPPORTED_LANGUAGES } from '../../../../consts';
import { ui } from '../../../../i18n/ui';
import { getPublishedWeeklyNotes, getWeeklyUrl } from '../../../../utils/weekly';

// /{lang}/library/weekly/rss.xml — the weekly notes feed (docs/features/signals-and-weekly.md).
// Web and RSS are the only ways a weekly note is delivered: no email, no signup.
// The text is Korean on every language's feed (the notes are written in Korean);
// each feed links to the page of its own language. Built only while at least
// one note is published, like the pages it points at.

export async function getStaticPaths() {
	const published = getPublishedWeeklyNotes(await getCollection('weeklyNotes'));
	return published.length > 0 ? SUPPORTED_LANGUAGES.map((lang) => ({ params: { lang } })) : [];
}

export async function GET(context) {
	const lang = context.params.lang;
	const notes = getPublishedWeeklyNotes(await getCollection('weeklyNotes'));
	const label = ui[lang]?.['weekly.title'] ?? ui.ko['weekly.title'];

	return rss({
		title: `${SITE_TITLE} - ${label}`,
		description: ui[lang]?.['weekly.description'] ?? ui.ko['weekly.description'],
		site: context.site,
		items: notes.map((note) => ({
			title: `${ui.ko['weekly.issue'].replace('{n}', String(note.data.issue))} ${note.data.title}`,
			description: note.data.dek,
			pubDate: new Date(note.data.publishedAt),
			link: getWeeklyUrl(lang, note.data.issue),
		})),
	});
}
