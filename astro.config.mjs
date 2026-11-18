import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import remarkCjkFriendly from 'remark-cjk-friendly';
import rehypeKatex from 'rehype-katex';
import vercel from '@astrojs/vercel';
import remarkLocalizedBlogLinks from './src/utils/remark-localized-blog-links.mjs';
import remarkEditorialComponents from './src/utils/remark-editorial-components.mjs';
import rehypeExternalLinks from './src/utils/rehype-external-links.mjs';

const remarkPlugins = [remarkLocalizedBlogLinks, remarkCjkFriendly, remarkMath];
const rehypePlugins = [rehypeExternalLinks, [rehypeKatex, { strict: false }]];

export default defineConfig({
  site: 'https://hun-bot.dev',

  // The dev toolbar floats over the bottom of every page in `astro dev`.
  devToolbar: { enabled: false },

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
    {
      name: 'local-draft-preview',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command !== 'dev') return;
          injectRoute({ pattern: '/__drafts/editorial', entrypoint: './src/dev/editorial-demo.astro' });
          injectRoute({ pattern: '/__drafts', entrypoint: './src/dev/draft-index.astro' });
          injectRoute({ pattern: '/__drafts/[...id]', entrypoint: './src/dev/draft-post.astro' });
        },
      },
    },
    mdx({
      remarkPlugins: [...remarkPlugins, remarkEditorialComponents],
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
