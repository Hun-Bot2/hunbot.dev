#!/usr/bin/env node
/**
 * Reads anonymous feedback from Redis and prints it locally.
 *
 * Deliberately a local script rather than a web route: feedback is private, and
 * an admin page would need authentication, which the product boundaries do not
 * allow. Run with `node scripts/read-feedback.mjs [limit]`.
 */
import { Redis } from '@upstash/redis';
import { FEEDBACK_LIST_KEY } from '../src/utils/feedback.ts';

const limit = Number(process.argv[2] ?? 50);
const url = cleanEnv(
	process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
);
const token = cleanEnv(
	process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
);

if (!url || !token) {
	console.error(
		'Redis credentials are not set. Export UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN first.',
	);
	process.exit(1);
}

const redis = new Redis({ url, token });
const keys = await redis.lrange(FEEDBACK_LIST_KEY, 0, Math.max(0, limit - 1));

if (keys.length === 0) {
	console.log('No feedback stored.');
	process.exit(0);
}

let shown = 0;

for (const key of keys) {
	const raw = await redis.get(key);
	if (!raw) continue;

	const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;

	console.log('---');
	console.log(`post:      ${entry.slug}`);
	console.log(`submitted: ${entry.submittedAt}`);
	console.log(entry.message);

	shown += 1;
}

console.log('---');
console.log(`${shown} entries (${keys.length} keys listed, expired entries skipped).`);

function cleanEnv(value) {
	const cleaned = value?.trim();
	return cleaned ? cleaned : undefined;
}
