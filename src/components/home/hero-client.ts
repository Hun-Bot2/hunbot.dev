// Behaviour of the home hero (HomeHero.astro). The timer is the CSS progress
// animation on the active dot: `animationend` advances the slide, and pausing
// is `animation-play-state`, so the bar the reader sees is the clock. Under
// `prefers-reduced-motion: reduce` the global rule removes animations, so
// nothing autoplays; manual controls (dots, arrow keys, swipe) still work.

const SWIPE_DISTANCE = 40;

export function initHero(root: HTMLElement): void {
	const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-slide]'));
	if (slides.length < 2) return;

	const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hero-dot]'));
	const toggle = root.querySelector<HTMLButtonElement>('[data-hero-toggle]');
	const live = root.querySelector<HTMLElement>('[data-hero-slides]');
	const interval = Number(root.dataset.interval) || 7000;
	const labels = JSON.parse(root.dataset.labels ?? '{}') as { pause?: string; play?: string };
	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

	let current = Math.max(
		0,
		slides.findIndex((slide) => slide.hasAttribute('data-active')),
	);
	const hold = { manual: false, hover: false, focus: false, hidden: document.hidden };

	root.style.setProperty('--hero-interval', `${interval}ms`);
	root.dataset.ready = '';

	// The intro/rise animations apply only under data-motion, which is set once a
	// frame has actually been produced (so a stalled timeline never leaves the copy
	// hidden) and the document is visible and motion is allowed.
	function enableMotion(): void {
		if (!motion.matches && !document.hidden) root.dataset.motion = '';
	}

	function syncState(): void {
		const reduced = motion.matches;
		if (reduced) delete root.dataset.motion;
		const paused = hold.manual || hold.hover || hold.focus || hold.hidden;
		if (reduced) root.dataset.reduced = '';
		else delete root.dataset.reduced;
		if (hold.manual) root.dataset.paused = 'manual';
		else if (paused) root.dataset.paused = 'auto';
		else delete root.dataset.paused;
		// Announce slide changes only when the reader is steering (or nothing moves on its own).
		live?.setAttribute('aria-live', paused || reduced ? 'polite' : 'off');
		if (toggle) {
			toggle.setAttribute('aria-label', (hold.manual ? labels.play : labels.pause) ?? '');
			toggle.setAttribute('aria-pressed', String(hold.manual));
		}
	}

	function show(index: number): void {
		const next = (index + slides.length) % slides.length;
		slides.forEach((slide, i) => {
			const active = i === next;
			slide.toggleAttribute('data-active', active);
			slide.toggleAttribute('inert', !active);
		});
		// Re-arm the progress bar even when the same dot is chosen again.
		dots.forEach((dot) => dot.removeAttribute('aria-current'));
		void root.offsetWidth;
		dots[next]?.setAttribute('aria-current', 'true');
		const changed = next !== current;
		current = next;
		// A hidden-at-load document skips the first slide's intro; later changes animate.
		if (changed && !('motion' in root.dataset)) enableMotion();
	}

	dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));

	// The progress fill finishing is the end of a slide's time.
	root.addEventListener('animationend', (event) => {
		if (event.animationName.includes('hero-progress') && !motion.matches) show(current + 1);
	});

	toggle?.addEventListener('click', () => {
		hold.manual = !hold.manual;
		syncState();
	});

	// Pause on hover, on focus anywhere inside, and while the tab is hidden.
	root.addEventListener('pointerenter', (event) => {
		if (event.pointerType === 'mouse') {
			hold.hover = true;
			syncState();
		}
	});
	root.addEventListener('pointerleave', () => {
		hold.hover = false;
		syncState();
	});
	// Keyboard focus only: a mouse click on a dot must not leave the hero paused.
	root.addEventListener('focusin', (event) => {
		if ((event.target as HTMLElement).matches(':focus-visible')) {
			hold.focus = true;
			syncState();
		}
	});
	root.addEventListener('focusout', (event) => {
		if (!root.contains(event.relatedTarget as Node | null)) {
			hold.focus = false;
			syncState();
		}
	});
	document.addEventListener('visibilitychange', () => {
		hold.hidden = document.hidden;
		syncState();
	});
	motion.addEventListener('change', syncState);

	// Arrow keys while focus is inside the hero.
	root.addEventListener('keydown', (event) => {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			show(current + 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			show(current - 1);
		}
	});

	// Swipe on touch and pen (vertical movement stays page scroll: touch-action: pan-y).
	let start: { x: number; y: number } | null = null;
	root.addEventListener('pointerdown', (event) => {
		start = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY };
	});
	root.addEventListener('pointerup', (event) => {
		if (!start) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		start = null;
		if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
	});
	root.addEventListener('pointercancel', () => {
		start = null;
	});

	show(current);
	syncState();
	// Hidden at load: no intro for the first slide (the rAF would fire on first view).
	if (!document.hidden) requestAnimationFrame(enableMotion);
}
