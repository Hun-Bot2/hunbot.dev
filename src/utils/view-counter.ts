const MAX_VIEW_SLUG_LENGTH = 180;
const MAX_CLIENT_ID_LENGTH = 96;
const MAX_ENCODED_CLIENT_ID_LENGTH = 160;
const VIEW_SLUG_PATTERN = /^(ko|jp|en)\/[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*$/u;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_PATTERN = /^[0-9a-f:]{2,45}$/i;

export const VIEW_RATE_LIMIT_WINDOW_SECONDS = 60;
export const VIEW_RATE_LIMIT_MAX_REQUESTS = 30;

export function isValidViewSlug(slug: string | null): slug is string {
  return Boolean(
    slug &&
    slug.length <= MAX_VIEW_SLUG_LENGTH &&
    VIEW_SLUG_PATTERN.test(slug)
  );
}

export function getPageviewsKey(slug: string): string {
  if (!isValidViewSlug(slug)) {
    throw new Error('Invalid view slug');
  }

  return `pageviews:${slug}`;
}

export function getViewHistoryKey(clientId: string, slug: string): string {
  if (!isValidViewSlug(slug)) {
    throw new Error('Invalid view slug');
  }

  return `history:${encodeClientId(clientId)}:${slug}`;
}

export function getViewRateLimitKey(clientId: string): string {
  return `ratelimit:views:${encodeClientId(clientId)}`;
}

export function getViewClientId(forwardedFor: string | null): string {
  const candidate = forwardedFor?.split(',')[0]?.trim() ?? '';

  if (isIpLike(candidate)) {
    return candidate.slice(0, MAX_CLIENT_ID_LENGTH);
  }

  return 'unknown-client';
}

function encodeClientId(clientId: string): string {
  return encodeURIComponent(getViewClientId(clientId)).slice(0, MAX_ENCODED_CLIENT_ID_LENGTH);
}

function isIpLike(value: string): boolean {
  if (!value || value.length > MAX_CLIENT_ID_LENGTH || /[\s/?#\\]/.test(value)) {
    return false;
  }

  if (IPV4_PATTERN.test(value)) {
    return value.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
  }

  return value.includes(':') && IPV6_PATTERN.test(value);
}
