import { clearPopoverPlacement, placePopover } from '../utils/floating';
import { PREVIEWS_URL, lookupPreview, pickLocalized, type LinkPreviewPayload } from '../utils/link-previews';
import type { UILanguage } from '../i18n/ui';

// Reader-initiated link previews (docs/decisions/site-structure.md, Revision
// 2026-10-23b): an internal link inside article text shows a small card on
// hover (after 300ms) or keyboard focus, on devices that can hover. Nothing
// loads until the first hover or focus; external links are untouched.

const DELAY_MS = 300;

if (window.matchMedia('(hover: hover)').matches) {
	const lang = ((document.documentElement.lang || 'ko') as UILanguage);
	let payload: Promise<LinkPreviewPayload | null> | null = null;
	let card: HTMLElement | null = null;
	let current: HTMLAnchorElement | null = null;
	let timer: number | undefined;
	let token = 0;

	const load = () => {
		payload ??= fetch(PREVIEWS_URL, { headers: { Accept: 'application/json' } })
			.then((response) => (response.ok ? (response.json() as Promise<LinkPreviewPayload>) : null))
			.catch(() => null);
		return payload;
	};

	const previewTarget = (event: Event): HTMLAnchorElement | null => {
		const target = event.target;
		if (!(target instanceof Element)) return null;
		const link = target.closest<HTMLAnchorElement>('.prose a[href]');
		if (!link || link.target === '_blank' || link.classList.contains('external-link')) return null;
		const url = new URL(link.href, window.location.href);
		if (url.origin !== window.location.origin) return null;
		if (url.pathname === window.location.pathname) return null;
		return link;
	};

	const hide = () => {
		window.clearTimeout(timer);
		token += 1;
		if (current) current.removeAttribute('aria-describedby');
		current = null;
		if (card) {
			card.hidden = true;
			clearPopoverPlacement(card);
		}
	};

	const element = (tag: string, className: string, text?: string) => {
		const node = document.createElement(tag);
		node.className = className;
		if (text) node.textContent = text;
		return node;
	};

	const show = async (link: HTMLAnchorElement) => {
		const mine = ++token;
		const data = await load();
		if (!data || mine !== token) return;
		const preview = lookupPreview(data.items, new URL(link.href, window.location.href).pathname);
		if (!preview) return;

		if (!card) {
			card = element('div', 'link-preview');
			card.id = 'link-preview';
			card.setAttribute('role', 'tooltip');
			card.hidden = true;
			document.body.append(card);
		}
		card.replaceChildren();

		const meta = [pickLocalized(data.kinds[preview.kind] ?? {}, lang)];
		if (preview.readMinutes) meta.push(pickLocalized(data.minutes, lang).replace('{n}', String(preview.readMinutes)));
		card.append(element('p', 'link-preview-meta', meta.filter(Boolean).join(' · ')));
		const title = element('p', 'link-preview-title', pickLocalized(preview.title, lang));
		card.append(title);
		const description = pickLocalized(preview.description, lang);
		if (description) card.append(element('p', 'link-preview-desc', description));
		if (preview.image) {
			const image = document.createElement('img');
			image.className = 'link-preview-image';
			image.src = preview.image;
			image.alt = '';
			image.decoding = 'async';
			card.append(image);
		}

		current = link;
		link.setAttribute('aria-describedby', card.id);
		card.hidden = false;
		placePopover(link, card);
	};

	const schedule = (event: Event) => {
		const link = previewTarget(event);
		if (!link || link === current) return;
		hide();
		timer = window.setTimeout(() => void show(link), DELAY_MS);
	};

	document.addEventListener('pointerover', schedule);
	document.addEventListener('focusin', schedule);
	document.addEventListener('pointerout', (event) => {
		const link = previewTarget(event);
		if (link && !link.contains(event.relatedTarget as Node | null)) hide();
	});
	document.addEventListener('focusout', (event) => {
		if (previewTarget(event)) hide();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') hide();
	});
	window.addEventListener('scroll', hide, { passive: true });
}
