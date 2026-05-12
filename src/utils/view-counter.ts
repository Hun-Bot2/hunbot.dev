const MAX_VIEW_SLUG_LENGTH = 180;
const VIEW_SLUG_PATTERN = /^(ko|jp|en)\/[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*$/u;

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

  return `history:${encodeURIComponent(clientId).slice(0, 160)}:${slug}`;
}
