import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

export const config = {
  runtime: 'edge'
};

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
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
    console.error(error); // 에러 로그 출력 (디버깅용)
    return new Response(JSON.stringify({ error: 'DB Error' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (!slug) return new Response(JSON.stringify({ error: 'Slug missing' }), { status: 400 });

  try {
    if (isLocalhost) {
      // 로컬에서는 조회수 증가 없이 값만 가져오기 (테스트용)
      const views = await redis.get<number>(`pageviews:${slug}`) || 0;
      return new Response(JSON.stringify({ views, skipped: true }), { status: 200 });
    }

    const views = await redis.incr(`pageviews:${slug}`);
    return new Response(JSON.stringify({ views }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'DB Error' }), { status: 500 });
  }
};