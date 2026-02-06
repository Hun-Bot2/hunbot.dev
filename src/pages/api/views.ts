import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

// Vercel(Production)은 process.env를, 로컬(Dev)은 import.meta.env를 사용.

const dbUrl = 
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || // Vercel 배포 환경 (우선순위 1)
  import.meta.env.UPSTASH_REDIS_REST_KV_REST_API_URL || // 로컬 환경 (우선순위 2)
  process.env.UPSTASH_REDIS_REST_URL || 
  import.meta.env.UPSTASH_REDIS_REST_URL;

const dbToken = 
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || // Vercel 배포 환경 (우선순위 1)
  import.meta.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || // 로컬 환경 (우선순위 2)
  process.env.UPSTASH_REDIS_REST_TOKEN || 
  import.meta.env.UPSTASH_REDIS_REST_TOKEN;

// 디버깅용 로그 (Vercel 로그에서 확인 가능)
if (!dbUrl || !dbToken) {
  console.error('CRITICAL: Redis Credentials Missing!');
}

const redis = new Redis({
  url: dbUrl,
  token: dbToken,
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) return new Response(JSON.stringify({ error: 'Slug missing' }), { status: 400 });

  try {
    const views = await redis.get<number>(`pageviews:${slug}`) || 0;
    
    return new Response(JSON.stringify({ views }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=0, stale-while-revalidate=60" 
      }
    });
  } catch (error) {
    console.error('Redis Get Error:', error);
    return new Response(JSON.stringify({ error: 'DB Connection Failed' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (!slug) return new Response(JSON.stringify({ error: 'Slug missing' }), { status: 400 });

  try {
    if (isLocalhost) {
      const views = await redis.get<number>(`pageviews:${slug}`) || 0;
      return new Response(JSON.stringify({ views, skipped: true }), { status: 200 });
    }

    const views = await redis.incr(`pageviews:${slug}`);
    
    return new Response(JSON.stringify({ views }), { status: 200 });
  } catch (error) {
    console.error('Redis Incr Error:', error);
    return new Response(JSON.stringify({ error: 'DB Connection Failed' }), { status: 500 });
  }
};