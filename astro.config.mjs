import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://hun-bot.dev', //
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'jp', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        [rehypeKatex, { strict: false }] // 한글 수식(Unicode) 경고 해결
      ],
      drafts: true,
    }),
    sitemap(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex, { strict: false }] // .md 파일에서도 동일하게 적용
    ],
    drafts: true,
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langs: ['python', 'r', 'javascript', 'sql', 'bash', 'typescript'],
      wrap: true,
    },
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex, { strict: false }] // .md 파일에서도 동일하게 적용
    ],
    drafts: true,
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langs: ['python', 'r', 'javascript', 'sql', 'bash', 'typescript'],
      wrap: true,
    },
  },
});