const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
	menuToggle.addEventListener('click', () => {
		mobileMenu.classList.toggle('hidden');
	});

	document.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof Node)) return;

		if (!menuToggle.contains(target) && !mobileMenu.contains(target)) {
			mobileMenu.classList.add('hidden');
		}
	});
}
