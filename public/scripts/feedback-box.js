const box = document.querySelector('[data-feedback-box]');

if (box) {
	const form = box.querySelector('[data-feedback-form]');
	const textarea = box.querySelector('[data-feedback-message]');
	const submit = box.querySelector('[data-feedback-submit]');
	const status = box.querySelector('[data-feedback-status]');
	const messages = box.querySelector('[data-feedback-messages]');
	const slug = box.getAttribute('data-feedback-slug');

	function say(kind, state) {
		if (!status) return;
		status.textContent = messages?.getAttribute(`data-${kind}`) ?? '';
		status.setAttribute('data-state', state);
		status.hidden = false;
	}

	if (form && textarea && slug) {
		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			const message = textarea.value.trim();
			if (message.length < 2) return;

			if (submit) submit.disabled = true;

			try {
				const response = await fetch('/api/feedback', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ slug, message }),
				});

				if (response.ok) {
					textarea.value = '';
					say('success', 'success');
					return;
				}

				if (response.status === 429) {
					say('rate-limited', 'error');
					return;
				}

				if (response.status === 503) {
					say('unavailable', 'error');
					return;
				}

				say('error', 'error');
			} catch {
				say('error', 'error');
			} finally {
				if (submit) submit.disabled = false;
			}
		});
	}
}
