import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { getViewClientId } from '../../utils/view-counter';
import {
	FEEDBACK_LIST_KEY,
	FEEDBACK_MAX_INBOX_ENTRIES,
	FEEDBACK_RATE_LIMIT_MAX_REQUESTS,
	FEEDBACK_RATE_LIMIT_WINDOW_SECONDS,
	FEEDBACK_RETENTION_SECONDS,
	buildFeedbackEntry,
	getFeedbackEntryKey,
	getFeedbackRateLimitKey,
	isValidFeedbackSlug,
	normalizeFeedbackMessage,
} from '../../utils/feedback';

export const prerender = false;

const FEEDBACK_UNAVAILABLE_RESPONSE = {
	error: 'Feedback unavailable',
};

const MAX_REQUEST_BYTES = 4096;

const redisConfig = getRedisConfig();
const redis = redisConfig ? new Redis(redisConfig) : null;

/**
 * Accepts short anonymous notes about a post.
 *
 * Submissions are never rendered publicly — they are read only by the site owner
 * through scripts/read-feedback.mjs. That is what keeps this endpoint free of the
 * moderation queue, HTML sanitizer and captcha that public anonymous comments
 * would require. Do not add a GET handler or render stored text as markup.
 */
export const POST: APIRoute = async ({ request }) => {
	if (!redis) return feedbackUnavailable();

	const contentLength = Number(request.headers.get('content-length') ?? '0');
	if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
		return jsonResponse({ error: 'Payload too large' }, 413);
	}

	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid payload' }, 400);
	}

	const body = (payload ?? {}) as Record<string, unknown>;
	const slug = typeof body.slug === 'string' ? body.slug : null;

	if (!isValidFeedbackSlug(slug)) {
		return jsonResponse({ error: 'Invalid slug' }, 400);
	}

	const message = normalizeFeedbackMessage(body.message);

	if (!message) {
		return jsonResponse({ error: 'Invalid message' }, 400);
	}

	try {
		const clientId = getViewClientId(request.headers.get('x-forwarded-for'));
		const rateLimitKey = getFeedbackRateLimitKey(clientId);
		const requestCount = await redis.incr(rateLimitKey);

		if (requestCount === 1) {
			await redis.expire(rateLimitKey, FEEDBACK_RATE_LIMIT_WINDOW_SECONDS);
		}

		if (requestCount > FEEDBACK_RATE_LIMIT_MAX_REQUESTS) {
			return jsonResponse({ error: 'Too many submissions' }, 429, {
				'Retry-After': String(FEEDBACK_RATE_LIMIT_WINDOW_SECONDS),
			});
		}

		const submittedAt = new Date().toISOString();
		const entryKey = getFeedbackEntryKey(slug, submittedAt);
		const entry = buildFeedbackEntry(slug, message, submittedAt);

		await redis.set(entryKey, JSON.stringify(entry), { ex: FEEDBACK_RETENTION_SECONDS });
		await redis.lpush(FEEDBACK_LIST_KEY, entryKey);
		await redis.ltrim(FEEDBACK_LIST_KEY, 0, FEEDBACK_MAX_INBOX_ENTRIES - 1);

		return jsonResponse({ received: true }, 201);
	} catch {
		console.error('Feedback submission failed.');
		return jsonResponse({ error: 'Submission failed' }, 500);
	}
};

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			...extraHeaders,
		},
	});
}

function feedbackUnavailable() {
	return new Response(JSON.stringify(FEEDBACK_UNAVAILABLE_RESPONSE), {
		status: 503,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
}

function getRedisConfig() {
	const url = cleanEnv(
		process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
			import.meta.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
			process.env.UPSTASH_REDIS_REST_URL ||
			import.meta.env.UPSTASH_REDIS_REST_URL,
	);
	const token = cleanEnv(
		process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
			import.meta.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
			process.env.UPSTASH_REDIS_REST_TOKEN ||
			import.meta.env.UPSTASH_REDIS_REST_TOKEN,
	);

	if (!url || !token) return null;
	return { url, token };
}

function cleanEnv(value: string | undefined) {
	const cleaned = value?.trim();
	return cleaned ? cleaned : undefined;
}
