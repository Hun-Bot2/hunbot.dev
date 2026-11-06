// Split reader for an explainer (src/layouts/ExplainerPost.astro). A link in the
// body to #claim-n scrolls the source pane to that entry of the claims ledger
// and flashes it once. Reader-initiated only; no motion on load. Without this
// script the link still works: the browser scrolls the pane to the anchor.
const source = document.querySelector('[data-reader-source]');

if (source) {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const desktop = window.matchMedia('(min-width: 1100px)');
	let flashTimer = 0;

	function flash(target) {
		window.clearTimeout(flashTimer);
		target.classList.remove('is-flash');
		// Restart the animation when the same entry is chosen twice in a row.
		void target.offsetWidth;
		target.classList.add('is-flash');
		flashTimer = window.setTimeout(() => target.classList.remove('is-flash'), 1500);
	}

	function reveal(target) {
		if (desktop.matches) {
			// The panes scroll on their own: move the source pane, not the page.
			const top = target.getBoundingClientRect().top - source.getBoundingClientRect().top + source.scrollTop - 24;
			source.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
			target.focus({ preventScroll: true });
		} else {
			target.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
			target.focus({ preventScroll: true });
		}
		flash(target);
	}

	document.addEventListener('click', (event) => {
		const link = event.target instanceof Element ? event.target.closest('a[href^="#claim-"]') : null;
		if (!link) return;
		const target = document.getElementById(link.getAttribute('href').slice(1));
		if (!target || !source.contains(target)) return;
		event.preventDefault();
		reveal(target);
		window.history.replaceState(null, '', link.getAttribute('href'));
	});
}
