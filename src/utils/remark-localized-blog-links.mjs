import { visit } from 'unist-util-visit';

const SUPPORTED_LOCALES = ['ko', 'jp', 'en'];
const BLOG_LINK_PATTERN = new RegExp(
  `^/(${SUPPORTED_LOCALES.join('|')})(/blog/[^?#]*)(\\?[^#]*)?(#.*)?$`
);

function inferLocaleFromPath(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/\/src\/content\/blog\/(ko|jp|en)\//);
  return match?.[1] ?? null;
}

export default function remarkLocalizedBlogLinks() {
  return (tree, file) => {
    const locale = inferLocaleFromPath(file?.path);
    if (!locale) return;

    visit(tree, 'link', (node) => {
      const originalUrl = node?.url;
      if (typeof originalUrl !== 'string') return;

      const match = originalUrl.match(BLOG_LINK_PATTERN);
      if (!match) return;

      const [, , blogPath, query = '', hash = ''] = match;
      node.url = `/${locale}${blogPath}${query}${hash}`;
    });
  };
}
