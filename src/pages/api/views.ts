import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import {
  VIEW_RATE_LIMIT_MAX_REQUESTS,
  VIEW_RATE_LIMIT_WINDOW_SECONDS,
  getPageviewsKey,
  getViewClientId,
  getViewHistoryKey,
  getViewRateLimitKey,
  isValidViewSlug,
} from '../../utils/view-counter';

export const prerender = false;

const VIEW_COUNTER_UNAVAILABLE_RESPONSE = {
  error: 'View counter unavailable',
};

const redisConfig = getRedisConfig();
const redis = redisConfig ? new Redis(redisConfig) : null;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) return new Response(JSON.stringify({ error: 'Slug missing' }), { status: 400 });
  if (!isValidViewSlug(slug)) return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
  if (!redis) return viewCounterUnavailable();

  try {
    const views = await redis.get<number>(getPageviewsKey(slug)) || 0;
    
    return new Response(JSON.stringify({ views }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=0, stale-while-revalidate=60" 
      }
    });
  } catch {
    console.error('View counter read failed.');
    return new Response(JSON.stringify({ error: 'DB Connection Failed' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (!slug) return new Response(JSON.stringify({ error: 'Slug missing' }), { status: 400 });
  if (!isValidViewSlug(slug)) return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
  if (!redis) return viewCounterUnavailable();

  try {
    if (isLocalhost) {
      const views = await redis.get<number>(getPageviewsKey(slug)) || 0;
      return new Response(JSON.stringify({ views, skipped: true }), { status: 200 });
    }

    const clientId = getViewClientId(request.headers.get('x-forwarded-for'));
    const rateLimitKey = getViewRateLimitKey(clientId);
    const requestCount = await redis.incr(rateLimitKey);

    if (requestCount === 1) {
      await redis.expire(rateLimitKey, VIEW_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (requestCount > VIEW_RATE_LIMIT_MAX_REQUESTS) {
      return new Response(JSON.stringify({ error: 'Too many view updates' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(VIEW_RATE_LIMIT_WINDOW_SECONDS),
        },
      });
    }

    const historyKey = getViewHistoryKey(clientId, slug);

    const isNewView = await redis.set(historyKey, '1', { nx: true, ex: 3600 });

    if (!isNewView) {
      const views = await redis.get<number>(getPageviewsKey(slug)) || 0;
      return new Response(JSON.stringify({ views, duplicated: true }), { status: 200 });
    }

    const views = await redis.incr(getPageviewsKey(slug));
    
    return new Response(JSON.stringify({ views }), { status: 200 });
  } catch {
    console.error('View counter update failed.');
    return new Response(JSON.stringify({ error: 'DB Connection Failed' }), { status: 500 });
  }
};

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

function viewCounterUnavailable() {
  return new Response(JSON.stringify(VIEW_COUNTER_UNAVAILABLE_RESPONSE), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
