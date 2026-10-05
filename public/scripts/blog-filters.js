const filterBar = document.querySelector('[data-blog-filters]');
const postList = document.querySelector('[data-blog-posts]');

if (filterBar && postList) {
	// The blog uses the defaults; the Library passes its own facets and key.
	const FILTER_STORAGE_KEY = filterBar.getAttribute('data-storage-key') || 'neural-blog-filters';
	const FACETS = (filterBar.getAttribute('data-facets') || 'category,year,series').split(',');
	const chips = Array.from(filterBar.querySelectorAll('[data-facet][data-value]'));
	const posts = Array.from(postList.querySelectorAll('[data-post-card]'));
	const resultsEl = filterBar.querySelector('[data-filter-results]');
	const resetBtn = filterBar.querySelector('[data-filter-reset]');
	// The one-click clear beside the floating filter button (visible while a filter
	// is active, so it can be cleared with the panel closed) and the button itself.
	const clearBtn = document.querySelector('[data-filter-clear]');
	const triggerEl = document.getElementById('blog-filter-trigger');
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const countEl = document.querySelector('[data-filter-count]');
	const emptyEl = document.querySelector('[data-blog-empty]');
	const resultsTemplate = resultsEl?.getAttribute('data-results-template') ?? '{count}';

	const state = Object.fromEntries(FACETS.map((facet) => [facet, 'all']));

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

	// A chip with a parent (a topic under an area) is offered only while its
	// parent facet is 'all' or that value; picking another parent clears it.
	function applyParents() {
		chips.forEach((chip) => {
			const parentFacet = chip.dataset.parentFacet;
			if (!parentFacet) return;
			const parent = state[parentFacet];
			const offered = parent === 'all' || parent === chip.dataset.parentValue;
			chip.hidden = !offered;
			if (!offered && state[chip.dataset.facet] === chip.dataset.value) state[chip.dataset.facet] = 'all';
		});
	}

	function applyStateToChips() {
		applyParents();
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

	// ---- Rendering ----------------------------------------------------------
	// The DOM always shows `committed` (the set of posts currently visible). A
	// filter change goes from it to the new set in two short fades: removed posts
	// fade out in place, then the new list fades in where it sits (no travel).
	// Plain on purpose (120 / 160 ms, no easing tricks).
	const FADE_OUT_MS = 120;
	const FADE_IN_MS = 160;
	let committed = null;
	let pendingNext = null;
	let runId = 0;

	const sections = Array.from(postList.querySelectorAll('[data-filter-section]'));
	const sectionHead = (section) => section.firstElementChild;
	const inView = (top) => top > -200 && top < window.innerHeight + 200;

	function computeMatches() {
		return new Set(
			posts.filter((post) =>
				FACETS.every((facet) => {
					if (state[facet] === 'all') return true;
					return post.dataset[`post${facet.charAt(0).toUpperCase()}${facet.slice(1)}`] === state[facet];
				}),
			),
		);
	}

	// Set the final visibility of posts and of sections left without posts.
	function commit(matched) {
		posts.forEach((post) => {
			post.hidden = !matched.has(post);
		});
		sections.forEach((section) => {
			section.hidden = !section.querySelector('[data-post-card]:not([hidden])');
		});
		if (emptyEl) emptyEl.hidden = matched.size !== 0;
		committed = matched;
		pendingNext = null;
	}

	function cancelAnimations() {
		posts.forEach((post) => post.getAnimations().forEach((animation) => animation.cancel()));
		sections.forEach((section) => {
			const head = sectionHead(section);
			if (head) head.getAnimations().forEach((animation) => animation.cancel());
		});
	}

	async function transitionTo(next) {
		const id = ++runId;
		// A newer change interrupts a running one: drop its animations and land on
		// the state it was heading for before measuring anything.
		cancelAnimations();
		if (pendingNext) commit(pendingNext);

		const prev = committed;
		if (!prev || reduceMotion.matches) {
			commit(next);
			return;
		}

		const leaving = posts.filter((post) => prev.has(post) && !next.has(post));
		const entering = posts.filter((post) => !prev.has(post) && next.has(post));
		if (leaving.length === 0 && entering.length === 0) return;

		// First: where everything that is visible now sits.
		const heads = sections.filter((section) => !section.hidden).map(sectionHead);
		const before = new Map();
		[...posts.filter((post) => prev.has(post)), ...heads].forEach((el) => {
			before.set(el, el.getBoundingClientRect().top);
		});
		const leavingHeads = sections
			.filter((section) => !section.hidden && !Array.from(section.querySelectorAll('[data-post-card]')).some((post) => next.has(post)))
			.map(sectionHead);

		pendingNext = next;

		// 1) What the filter removes fades out where it stands.
		const fading = [...leaving, ...leavingHeads].filter((el) => inView(before.get(el)));
		if (fading.length) {
			fading.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'ease-out', fill: 'forwards' }));
			// A timer, not `finished`: that promise resolves a frame or two late.
			await new Promise((resolve) => window.setTimeout(resolve, FADE_OUT_MS));
			if (id !== runId) return;
		}

		// 2) Final layout. Nothing travels: a post that ends up somewhere else, and
		// every post the filter restores, simply fades in where it now sits. (Sliding
		// them from their old positions read as the list flying upward, and rows
		// further down covered hundreds of pixels.)
		commit(next);
		// The removed elements are hidden now; drop their held opacity.
		fading.forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));
		const newHeads = sections.filter((section) => !section.hidden).map(sectionHead);
		const appearing = [...posts.filter((post) => next.has(post)), ...newHeads].filter((el) => {
			const was = before.get(el);
			if (was !== undefined && Math.abs(was - el.getBoundingClientRect().top) < 1) return false; // did not move
			return inView(el.getBoundingClientRect().top);
		});
		appearing.forEach((el) => {
			el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_IN_MS, easing: 'ease-out' });
		});
	}

	function render() {
		const next = computeMatches();
		const visible = next.size;

		transitionTo(next);

		if (resultsEl) {
			resultsEl.textContent = resultsTemplate.replace('{count}', String(visible));
		}

		const activeCount = FACETS.filter((facet) => state[facet] !== 'all').length;

		if (resetBtn) {
			resetBtn.hidden = activeCount === 0;
		}

		// Badge on the floating filter button, plus a quiet "filtered" look for it and
		// a one-click clear that works with the panel closed.
		if (countEl) {
			countEl.textContent = String(activeCount);
			countEl.hidden = activeCount === 0;
		}
		if (triggerEl) triggerEl.classList.toggle('is-filtered', activeCount > 0);
		if (clearBtn) clearBtn.hidden = activeCount === 0;
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

	function resetAll() {
		FACETS.forEach((facet) => {
			state[facet] = 'all';
		});
		applyStateToChips();
		syncUrl();
		writeStored();
		render();
	}

	resetBtn?.addEventListener('click', resetAll);
	clearBtn?.addEventListener('click', resetAll);

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
