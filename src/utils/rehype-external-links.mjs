import { visit } from 'unist-util-visit';

const INTERNAL_HOSTS = new Set(['hun-bot.dev', 'www.hun-bot.dev']);

function isExternalHref(href) {
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return false;
  try {
    return !INTERNAL_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

export default function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || !isExternalHref(node.properties?.href)) return;

      const existing = node.properties.className;
      const classNames = Array.isArray(existing) ? existing : existing ? [existing] : [];
      node.properties.className = [...classNames, 'external-link'];
      node.properties.target = '_blank';
      node.properties.rel = ['noopener', 'noreferrer'];
    });
  };
}
