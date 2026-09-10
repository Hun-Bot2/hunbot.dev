import { getViewClientId, isValidViewSlug } from './view-counter.ts';

const MAX_FEEDBACK_LENGTH = 1000;
const MIN_FEEDBACK_LENGTH = 2;
const MAX_ENCODED_CLIENT_ID_LENGTH = 160;
// Control characters except tab and newline. Stored feedback is read back in a
// terminal, where escape sequences would otherwise be interpreted.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Feedback is anonymous and never publicly rendered, so abuse cannot be
 * self-correcting through moderation by readers. The limits are therefore
 * deliberately tighter than the view counter's 30 requests per minute.
 */
export const FEEDBACK_RATE_LIMIT_WINDOW_SECONDS = 600;
export const FEEDBACK_RATE_LIMIT_MAX_REQUESTS = 3;
export const FEEDBACK_RETENTION_SECONDS = 60 * 60 * 24 * 90;
export const FEEDBACK_LIST_KEY = 'feedback:inbox';
export const FEEDBACK_MAX_INBOX_ENTRIES = 500;

export { MAX_FEEDBACK_LENGTH, MIN_FEEDBACK_LENGTH };

/**
 * Reuses the post identifier shape already validated for the view counter, so
 * there is one definition of what a valid post reference looks like.
 */
export function isValidFeedbackSlug(slug: string | null): slug is string {
	return isValidViewSlug(slug);
}

/**
 * Normalizes submitted text before storage.
 *
 * Control characters are stripped because the stored value is read back in a
 * terminal, where escape sequences would be interpreted. This is not HTML
 * sanitization and is not a substitute for it: the value must never be rendered
 * as markup anywhere.
 */
export function normalizeFeedbackMessage(message: unknown): string | null {
	if (typeof message !== 'string') return null;

	const cleaned = message
		.replace(/\r\n/g, '\n')
		.replace(CONTROL_CHARACTERS, '')
		.trim();

	if (cleaned.length < MIN_FEEDBACK_LENGTH) return null;
	if (cleaned.length > MAX_FEEDBACK_LENGTH) return null;

	return cleaned;
}

export function getFeedbackRateLimitKey(clientId: string): string {
	return `ratelimit:feedback:${encodeClientId(clientId)}`;
}

export function getFeedbackEntryKey(slug: string, submittedAt: string): string {
	if (!isValidFeedbackSlug(slug)) {
		throw new Error('Invalid feedback slug');
	}

	if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(submittedAt)) {
		throw new Error('Invalid feedback timestamp');
	}

	return `feedback:${slug}:${submittedAt}`;
}

/**
 * The stored record deliberately omits the raw client address. The client id is
 * used for rate limiting in a separate, short-lived key and is never attached to
 * the message itself.
 */
export function buildFeedbackEntry(slug: string, message: string, submittedAt: string) {
	if (!isValidFeedbackSlug(slug)) {
		throw new Error('Invalid feedback slug');
	}

	return {
		slug,
		message,
		submittedAt,
	};
}

function encodeClientId(clientId: string): string {
	return encodeURIComponent(getViewClientId(clientId)).slice(0, MAX_ENCODED_CLIENT_ID_LENGTH);
}
