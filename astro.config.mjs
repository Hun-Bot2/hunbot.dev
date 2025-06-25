import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://hunbot.dev',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
      drafts: true,
    }),
    sitemap(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    drafts: true,
    shikiConfig: {
      theme: 'github-dark-dimmed',
      langs: ['python', 'r', 'javascript', 'sql', 'bash', 'typescript'],
      wrap: true,
    },
  },
});