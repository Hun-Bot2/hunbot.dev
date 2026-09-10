const DISMISS_STORAGE_KEY = 'neural-blog-language-suggestion-dismissed';

const banner = document.querySelector('[data-language-suggestion]');
const main = document.querySelector('[data-post-lang]');

if (banner && main) {
	const link = banner.querySelector('[data-language-suggestion-link]');
	const dismissBtn = banner.querySelector('[data-language-suggestion-dismiss]');
	const currentLang = main.getAttribute('data-post-lang');
	const availableLangs = (main.getAttribute('data-available-langs') ?? '')
		.split(',')
		.map((code) => code.trim())
		.filter(Boolean);

	function isDismissed() {
		try {
			return window.localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
		} catch {
			return false;
		}
	}

	function remember() {
		try {
			window.localStorage.setItem(DISMISS_STORAGE_KEY, '1');
		} catch {
			/* Blocked storage: the banner may reappear, which is the harmless direction. */
		}
	}

	// Maps a BCP-47 tag to this site's language segments. Note the segment for
	// Japanese is `jp` while the browser reports `ja`.
	function toSiteLang(tag) {
		const primary = tag.toLowerCase().split('-')[0];
		if (primary === 'ko') return 'ko';
		if (primary === 'ja') return 'jp';
		if (primary === 'en') return 'en';
		return null;
	}

	function preferredLang() {
		const tags = navigator.languages?.length ? navigator.languages : [navigator.language];

		for (const tag of tags) {
			if (!tag) continue;
			const siteLang = toSiteLang(tag);
			// Only the reader's first recognised language counts. Browsers list
			// fallbacks that the reader never chose.
			if (siteLang) return siteLang;
		}

		return null;
	}

	function translatedUrl(targetLang) {
		const segments = window.location.pathname.split('/').filter(Boolean);
		if (segments.length === 0) return null;
		segments[0] = targetLang;
		return `/${segments.join('/')}${window.location.pathname.endsWith('/') ? '/' : ''}`;
	}

	const target = preferredLang();

	// Suggest only a translation that actually exists. Many posts are Korean-only,
	// and pointing at a page that was never written is worse than staying quiet.
	if (
		target &&
		target !== currentLang &&
		availableLangs.includes(target) &&
		!isDismissed() &&
		link &&
		dismissBtn
	) {
		const copy = document.querySelector(`[data-language-suggestion-copy="${target}"]`);
		const href = translatedUrl(target);

		if (copy && href) {
			link.textContent = copy.getAttribute('data-label') ?? '';
			link.setAttribute('href', href);
			link.setAttribute('lang', target === 'jp' ? 'ja' : target);
			dismissBtn.textContent = copy.getAttribute('data-dismiss') ?? '';
			dismissBtn.setAttribute('lang', target === 'jp' ? 'ja' : target);
			banner.hidden = false;

			dismissBtn.addEventListener('click', () => {
				banner.hidden = true;
				remember();
			});

			// Following the suggestion is itself a language choice; do not ask again.
			link.addEventListener('click', remember);
		}
	}
}
