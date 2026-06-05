import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import vercel from '@astrojs/vercel';
import remarkLocalizedBlogLinks from './src/utils/remark-localized-blog-links.mjs';

const remarkPlugins = [remarkLocalizedBlogLinks, remarkMath];
const rehypePlugins = [[rehypeKatex, { strict: false }]];

export default defineConfig({
  site: 'https://hun-bot.dev',
  
  adapter: vercel({
    webAnalytics: { enabled: false } 
  }),
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'jp', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx({
      remarkPlugins,
      rehypePlugins,
      drafts: true,
    }),
    sitemap(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins,
    rehypePlugins,
    drafts: true,
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langs: ['python', 'r', 'javascript', 'sql', 'bash', 'typescript'],
      wrap: true,
    },
  }
});
