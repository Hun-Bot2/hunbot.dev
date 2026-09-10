const FILTER_STORAGE_KEY = 'neural-blog-filters';
const FACETS = ['category', 'year', 'series'];

const filterBar = document.querySelector('[data-blog-filters]');
const postList = document.querySelector('[data-blog-posts]');

if (filterBar && postList) {
	const chips = Array.from(filterBar.querySelectorAll('[data-facet][data-value]'));
	const posts = Array.from(postList.querySelectorAll('[data-post-card]'));
	const resultsEl = filterBar.querySelector('[data-filter-results]');
	const resetBtn = filterBar.querySelector('[data-filter-reset]');
	const emptyEl = document.querySelector('[data-blog-empty]');
	const resultsTemplate = resultsEl?.getAttribute('data-results-template') ?? '{count}';

	const state = { category: 'all', year: 'all', series: 'all' };

	function readStored() {
		try {
			const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	function writeStored() {
		try {
			window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
		} catch {
			/* Private mode or blocked storage: filters still work for this visit. */
		}
	}

	// A value only counts if a chip for it actually exists on this page. Post
	// counts differ per language, so a stored series or year may not be present.
	function isKnownValue(facet, value) {
		if (value === 'all') return true;
		return chips.some((chip) => chip.dataset.facet === facet && chip.dataset.value === value);
	}

	function applyStateToChips() {
		chips.forEach((chip) => {
			const active = state[chip.dataset.facet] === chip.dataset.value;
			chip.classList.toggle('is-active', active);
			chip.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	function syncUrl() {
		const params = new URLSearchParams(window.location.search);
		FACETS.forEach((facet) => {
			if (state[facet] === 'all') {
				params.delete(facet);
			} else {
				params.set(facet, state[facet]);
			}
		});

		const query = params.toString();
		const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
		window.history.replaceState(null, '', next);
	}

	function render() {
		let visible = 0;

		posts.forEach((post) => {
			const matched = FACETS.every((facet) => {
				if (state[facet] === 'all') return true;
				return post.dataset[`post${facet.charAt(0).toUpperCase()}${facet.slice(1)}`] === state[facet];
			});

			post.hidden = !matched;
			if (matched) visible += 1;
		});

		if (resultsEl) {
			resultsEl.textContent = resultsTemplate.replace('{count}', String(visible));
		}

		if (emptyEl) {
			emptyEl.hidden = visible !== 0;
		}

		if (resetBtn) {
			resetBtn.hidden = FACETS.every((facet) => state[facet] === 'all');
		}
	}

	function setFacet(facet, value) {
		state[facet] = value;
		applyStateToChips();
		syncUrl();
		writeStored();
		render();
	}

	chips.forEach((chip) => {
		chip.addEventListener('click', () => {
			const { facet, value } = chip.dataset;
			// Clicking the active chip clears that facet rather than doing nothing.
			setFacet(facet, state[facet] === value ? 'all' : value);
		});
	});

	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			FACETS.forEach((facet) => {
				state[facet] = 'all';
			});
			applyStateToChips();
			syncUrl();
			writeStored();
			render();
		});
	}

	// URL wins over stored preference, so a shared link shows what the sender saw.
	const params = new URLSearchParams(window.location.search);
	const hasUrlState = FACETS.some((facet) => params.has(facet));
	const stored = hasUrlState ? null : readStored();

	FACETS.forEach((facet) => {
		const candidate = hasUrlState ? params.get(facet) : stored?.[facet];
		if (candidate && isKnownValue(facet, candidate)) {
			state[facet] = candidate;
		}
	});

	applyStateToChips();
	render();
}
