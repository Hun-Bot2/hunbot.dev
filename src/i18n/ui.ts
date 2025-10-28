export const languages = {
  ko: '한국어',
  jp: '日本語',
  en: 'English',
};

export const defaultLang = 'ko';

export const ui = {
  ko: {
    'nav.home': '홈',
    'nav.blog': '블로그',
    'nav.about': '소개',
    'nav.archive': '아카이브',
    'footer.copyright': '모든 권리 보유',
    'footer.built-with': '다음으로 제작:',
    'blog.read-more': '더 읽기',
    'blog.all-posts': '모든 글',
    'blog.recent-posts': '최근 글',
    'blog.published': '작성일',
    'blog.updated': '수정일',
    'toc.title': '목차',
  },
  jp: {
    'nav.home': 'ホーム',
    'nav.blog': 'ブログ',
    'nav.about': '私について',
    'nav.archive': 'アーカイブ',
    'footer.copyright': '全著作権所有',
    'footer.built-with': '使用技術:',
    'blog.read-more': '続きを読む',
    'blog.all-posts': 'すべての投稿',
    'blog.recent-posts': '最近の投稿',
    'blog.published': '公開日',
    'blog.updated': '更新日',
    'toc.title': '目次',
  },
  en: {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.archive': 'Archive',
    'footer.copyright': 'All rights reserved',
    'footer.built-with': 'Built with',
    'blog.read-more': 'Read more',
    'blog.all-posts': 'All Posts',
    'blog.recent-posts': 'Recent Posts',
    'blog.published': 'Published',
    'blog.updated': 'Updated',
    'toc.title': 'Table of Contents',
  },
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
