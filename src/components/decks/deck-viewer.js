const deckSelector = '[data-slides][data-deck-id]';

function initDeckViewer(deck) {
	if (deck.dataset.deckViewerReady === 'true') return;

	let slides;
	try {
		slides = JSON.parse(deck.dataset.slides || '[]');
	} catch {
		return;
	}

	if (!Array.isArray(slides) || slides.length === 0) return;

	deck.dataset.deckViewerReady = 'true';

	const title = deck.dataset.title || 'Presentation';
	const image = deck.querySelector('[data-deck-image]');
	const counter = deck.querySelector('[data-deck-counter]');
	const previousButton = deck.querySelector('[data-deck-prev]');
	const nextButton = deck.querySelector('[data-deck-next]');
	const fullscreenButton = deck.querySelector('[data-deck-fullscreen]');
	const viewport = deck.querySelector('[data-deck-viewport]') || deck;
	const preloaded = new Set();
	let currentIndex = 0;
	let touchStartX = null;
	let touchStartY = null;

	function preloadAround(index) {
		[index - 1, index, index + 1].forEach((slideIndex) => {
			if (slideIndex < 0 || slideIndex >= slides.length || preloaded.has(slideIndex)) return;

			const preloadImage = new Image();
			preloadImage.src = slides[slideIndex];
			preloaded.add(slideIndex);
		});
	}

	function render(index) {
		currentIndex = Math.min(Math.max(index, 0), slides.length - 1);

		if (image) {
			image.src = slides[currentIndex];
			image.alt = `${title} slide ${currentIndex + 1} of ${slides.length}`;
		}

		if (counter) {
			counter.textContent = `${currentIndex + 1} / ${slides.length}`;
		}

		if (previousButton) {
			previousButton.disabled = currentIndex === 0;
		}

		if (nextButton) {
			nextButton.disabled = currentIndex === slides.length - 1;
		}

		preloadAround(currentIndex);
	}

	function showPrevious() {
		render(currentIndex - 1);
	}

	function showNext() {
		render(currentIndex + 1);
	}

	previousButton?.addEventListener('click', showPrevious);
	nextButton?.addEventListener('click', showNext);

	deck.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			showPrevious();
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			showNext();
		}
	});

	viewport.addEventListener(
		'touchstart',
		(event) => {
			const touch = event.changedTouches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		},
		{ passive: true },
	);

	viewport.addEventListener(
		'touchend',
		(event) => {
			if (touchStartX === null || touchStartY === null) return;

			const touch = event.changedTouches[0];
			const deltaX = touch.clientX - touchStartX;
			const deltaY = touch.clientY - touchStartY;

			touchStartX = null;
			touchStartY = null;

			if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;

			if (deltaX < 0) {
				showNext();
			} else {
				showPrevious();
			}
		},
		{ passive: true },
	);

	if (fullscreenButton && document.fullscreenEnabled) {
		fullscreenButton.addEventListener('click', () => {
			if (document.fullscreenElement) {
				document.exitFullscreen();
				return;
			}

			viewport.requestFullscreen?.();
		});
	} else {
		fullscreenButton?.remove();
	}

	render(0);
}

function initAllDeckViewers() {
	document.querySelectorAll(deckSelector).forEach(initDeckViewer);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initAllDeckViewers, { once: true });
} else {
	initAllDeckViewers();
}
