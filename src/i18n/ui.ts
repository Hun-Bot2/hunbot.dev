export const languages = {
  ko: '한국어',
  jp: '日本語',
  en: 'English',
} as const;

export const defaultLang = 'ko' as const;
export type UILanguage = keyof typeof languages;

export const ui = {
  ko: {
    'nav.home': '홈',
    'nav.blog': '블로그',
    'nav.about': '소개',
    'nav.tags': '태그',
    'nav.archive': '아카이브',
    'footer.copyright': '모든 권리 보유',
    'footer.built-with': '다음으로 제작:',
    'blog.read-more': '더 읽기',
    'blog.all-posts': '모든 글',
    'blog.recent-posts': '최근 글',
    'blog.no-posts': '아직 작성된 글이 없습니다.',
    'blog.tags-title': '태그 모음',
    'blog.tags-description': '모든 글에서 사용한 태그를 빠르게 확인하세요.',
    'blog.no-tags': '아직 등록된 태그가 없습니다.',
    'blog.tag-count': '글 {count}개',
    'blog.published': '작성일',
    'blog.updated': '수정일',
    'blog.views': '조회수',
    'blog.views-loading': '집계 중...',
    'blog.views-error': '집계 실패',
    'toc.title': '목차',
    'toc.toggle': '목차 토글',

    'about.title': '소개',
    'about.description': 'Hun Bot의 소개 페이지입니다.',
    'about.greeting': '안녕하세요, 남정훈입니다! 👋',
    'about.intro':
    'LLM 파이프라인, 컴퓨터 비전, Go/Python 기반 백엔드를 다루는 AI & 백엔드 개발자입니다.\n'+ 
    '최근에는 3D 인터랙티브 포트폴리오, 한국어 문법 교정용 VSCode 확장, 해커톤을 위해 제작한 Go 기반 프로덕션 백엔드, TypeScript 기반 성장 그래프 시각화 도구 등을 만들었습니다.\n'+
    '새로운 기술을 탐색하는 과정을 즐기며, 단순한 성과나 고소득보다 ‘지속 가능하고 즐거운 개발자 삶’을 더 중요하게 생각합니다.'
  
    ,
    'about.connect': 'Connect with me',

    'about.education': 'Education',
    'about.university': '성균관대학교 (Sungkyunkwan University)',
    'about.major': '컴퓨터교육과 / 뇌인지과학(자기설계융합전공)',
    'about.status': '재학 중',
    'about.university-desc':
      '컴퓨터교육과에서 프로그래밍과 소프트웨어 개발 기초를, 뇌인지과학에서 AI · 데이터 · 3D Vision을 공부하며 “사람이 쓰는 AI 서비스”를 만드는 관점을 기르고 있습니다.',

    'about.tech-stack': 'Tech Stack & Interests',

    'about.frontend': 'Frontend / 3D Web',
    'about.frontend-desc':
      'Three.js로 3D 웹 경험을 만들고, React와 TypeScript로 인터랙티브한 UI와 데이터 시각화를 구현합니다.',

    'about.backend': 'Backend / Infra',
    'about.backend-desc':
      'Go와 FastAPI로 웹 API를 만들고, PostgreSQL · Supabase · Docker를 사용해 배포와 운영까지 고려한 백엔드 환경을 구성합니다.',

    'about.ai': 'AI & 3D Vision',
    'about.ai-desc':
      'LLM 파이프라인과 컴퓨터 비전(포즈 추정, 이미지 처리), 3D Vision을 웹 · 백엔드와 연결해, 데모를 넘어서 실제로 쓸 수 있는 AI 기능을 구현합니다.',

    'about.hci': 'Interactive Systems',
    'about.hci-desc':
      '데이터와 사용자 행동을 바탕으로 3D 인터랙션과 시각화를 설계해, “살아 있는” 인터페이스를 만드는 일을 좋아합니다.',

    'about.contact': 'Get in Touch',
    'about.contact-desc':
      '편하게 연락주세요!',
    'about.contact-desc2': '새로운 프로젝트나 협업 기회를 항상 열어두고 있습니다.',
    'about.send-email': '이메일 보내기',

    'about.stats.role': '현재 역할',
    'about.stats.role.value': '엔지니어를 꿈꾸는 학생',
    'about.stats.location': 'Base',
    'about.stats.location.value': '서울 · 대한민국',
    'about.stats.focus': '관심 주제',
    'about.stats.focus.value': 'LLM, 컴퓨터 비전, 3D 웹, 백엔드 개발',
    'about.stats.languages': '사용 언어',
    'about.stats.languages.value': '한국어 · 日本語 · English',

    'about.timeline.title': 'Path Highlights',
    'about.timeline.0.title': '성균관대학교 컴퓨터교육 · 뇌인지과학',
    'about.timeline.0.period': '2024 - 현재',
    'about.timeline.0.body':
      '소프트웨어 관련 과목을 들으며 실제 서비스로 이어질 수 있는 프로젝트를 만들고 있습니다.',
    'about.timeline.1.title': 'Bareun 기반 VSCode Extension 제작',
    'about.timeline.1.period': '2025-11',
    'about.timeline.1.body':
      '한국어 문법 검수를 자동화하기 위해 Bareun AI API와 VSCode 확장을 직접 설계하고 출시했습니다.\n' +
      '현재도 제 글쓰기와 개발 워크플로에서 실제로 사용 중입니다.',
    'about.timeline.2.title': 'Hun-Bot.dev 다국어 블로그 운영',
    'about.timeline.2.period': '2025- 현재',
    'about.timeline.2.body':
      'AI, 개발 로그,글쓰기 회고를 한국어 · 일본어 · 영어로 정리하며, 코드뿐 아니라 문제 정의와 시행착오까지 함께 공유합니다.',

    'about.features.title': '더 읽어보기',
    'about.features.note.title': 'Study Log',
    'about.features.note.description':
      '학교에서 배운 내용들 및 스스로 공부하는 내용을 총 정리하기로 마음먹고 시작한 Github Page입니다.',
    'about.features.github.title': 'Portfolio',
    'about.features.github.description':
      '개인 프로젝트와 각종 활동들을 정리한 포트폴리오 사이트입니다.',
    'about.features.view-more': '자세히 보기',
  },

  jp: {
    'nav.home': 'ホーム',
    'nav.blog': 'ブログ',
    'nav.about': '私について',
    'nav.tags': 'タグ',
    'nav.archive': 'アーカイブ',
    'footer.copyright': '全著作権所有',
    'footer.built-with': '使用技術:',
    'blog.read-more': '続きを読む',
    'blog.all-posts': 'すべての投稿',
    'blog.recent-posts': '最近の投稿',
    'blog.no-posts': 'まだ投稿がありません。',
    'blog.tags-title': 'タグ一覧',
    'blog.tags-description': '投稿で使われているタグをまとめて確認できます。',
    'blog.no-tags': 'まだタグがありません。',
    'blog.tag-count': '{count}件',
    'blog.published': '公開日',
    'blog.updated': '更新日',
    'blog.views': '閲覧数',
    'blog.views-loading': '集計中...',
    'blog.views-error': '取得失敗',
    'toc.title': '目次',
    'toc.toggle': '目次を開く',

    'about.title': '私について',
    'about.description': 'Hun-Botの紹介ページです。',
    'about.greeting': 'こんにちは、ナム・ジョンフンです！ 👋',
    'about.intro':
      'LLM パイプライン、コンピュータビジョン、Go/Python を用いたバックエンド開発に取り組む AI × バックエンドエンジニアです。\n' +
      '最近は、3D インタラクティブポートフォリオ、韓国語文法を補助する VSCode 拡張、ハッカソン向けの Go 製プロダクションバックエンド、TypeScript で構築した成長グラフ可視化ツールなどを開発してきました。\n' +
      '新しい技術を探求することを楽しみつつ、高収入を追うだけではなく「継続的で楽しく働けるエンジニアとしての人生」を大切にしています。',

    'about.connect': 'つながる',

    'about.education': '学歴',
    'about.university': '成均館大学校 (Sungkyunkwan University)',
    'about.major': 'コンピュータ教育学科 / 知能情報融合専攻（自己設計複合専攻）',
    'about.status': '在学中',
    'about.university-desc':
      'コンピュータ教育学科でプログラミングとソフトウェア開発の基礎を学びつつ、知能情報融合専攻で AI・データ・3D Vision を学び、「人が使えるAIサービス」をつくる視点を育てています。',

    'about.tech-stack': '技術スタック & 興味',

    'about.frontend': 'フロントエンド / 3D Web',
    'about.frontend-desc':
      'Three.js で 3D Web 体験をつくり、React と TypeScript でインタラクティブな UI やデータビジュアライゼーションを実装しています。',

    'about.backend': 'バックエンド / インフラ',
    'about.backend-desc':
      'Go と FastAPI で Web API を開発し、PostgreSQL・Supabase・Docker を使って、デプロイと運用を意識したバックエンド環境を構築しています。',

    'about.ai': 'AI & 3D Vision',
    'about.ai-desc':
      'LLM パイプラインやコンピュータビジョン（ポーズ推定・画像処理）、3D Vision を Web / バックエンドとつなぎ、「デモで終わらない」AI 機能の実装に取り組んでいます。',

    'about.hci': 'インタラクティブシステム',
    'about.hci-desc':
      'ユーザー行動やデータをもとに 3D インタラクションやビジュアライゼーションを設計し、「生きているように感じる」インターフェースを目指しています。',

    'about.contact': 'お問い合わせ',
    'about.contact-desc':
      'AI、コンピュータビジョン、3D Web、Go / バックエンド開発について話したい方は、ぜひお気軽にご連絡ください！',
    'about.contact-desc2': '新しいプロジェクトやコラボレーションの機会をいつでも歓迎しています。',
    'about.send-email': 'メールを送る',

    'about.stats.role': '現在の役割',
    'about.stats.role.value': 'AI × バックエンドエンジニア',
    'about.stats.location': '拠点',
    'about.stats.location.value': 'ソウル / 韓国',
    'about.stats.focus': '注力分野',
    'about.stats.focus.value': 'LLM、コンピュータビジョン、3D Web、バックエンド開発',
    'about.stats.languages': '使用言語',
    'about.stats.languages.value': '韓国語・日本語・英語',

    'about.timeline.title': 'これまでの歩み',
    'about.timeline.0.title': '成均館大学 コンピュータ教育学科・知能情報融合専攻',
    'about.timeline.0.period': '2024 - 現在',
    'about.timeline.0.body':
      'プログラミング、ソフトウェア工学、AI関連科目を学びながら、授業で終わらない実サービス志向のプロジェクトに取り組んでいます。',
    'about.timeline.1.title': 'Bareun 連携 VSCode 拡張の開発',
    'about.timeline.1.period': '2025-11',
    'about.timeline.1.body':
      '韓国語文法チェックを自動化するために Bareun AI API を活用し、VSCode 拡張機能を設計・開発しました。\n' +
      '現在も執筆・開発ワークフローで実際に使用しています。',
    'about.timeline.2.title': 'Hun-Bot.dev 多言語ブログの運営',
    'about.timeline.2.period': '2025 - 現在',
    'about.timeline.2.body':
      'AI、開発ログ、文章の振り返りを韓・日・英の3言語でまとめ、コードだけでなく課題設定や試行錯誤のプロセスまで共有しています。',

    'about.features.title': '関連リンク',
    'about.features.note.title': 'note: リサーチとエッセイ',
    'about.features.note.description':
      'noteでは、実験ログやインサイトを物語形式で整理し、ブログだけでは書ききれない背景や思考プロセスを共有しています。',
    'about.features.github.title': 'GitHub プロフィール',
    'about.features.github.description':
      'AI・バックエンド・3D 関連の取り組みや、使っているツールチェーン・自動化ワークフローをまとめた README です。',
    'about.features.view-more': '読む',
  },

  en: {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.tags': 'Tags',
    'nav.archive': 'Archive',
    'footer.copyright': 'All rights reserved',
    'footer.built-with': 'Built with',
    'blog.read-more': 'Read more',
    'blog.all-posts': 'All Posts',
    'blog.recent-posts': 'Recent Posts',
    'blog.no-posts': 'No posts yet.',
    'blog.tags-title': 'Tags',
    'blog.tags-description': 'Browse every tag used across posts.',
    'blog.no-tags': 'No tags have been added yet.',
    'blog.tag-count': '{count} posts',
    'blog.published': 'Published',
    'blog.updated': 'Updated',
    'blog.views': 'Views',
    'blog.views-loading': 'Counting...',
    'blog.views-error': 'Unavailable',
    'toc.title': 'Table of Contents',
    'toc.toggle': 'Toggle table of contents',

    'about.title': 'About',
    'about.description': 'About Hun-Bot',
    'about.greeting': "Hi, I'm Jeonghun Nam! 👋",
    'about.intro':
      'I am an AI & Backend Engineer working across LLM pipelines, Computer Vision, and Go/Python backend systems.\n' +
      'My recent work includes a 3D interactive portfolio, a Korean grammar VSCode extension, a production-ready Go backend for a hackathon, and a TypeScript growth-graph visualizer.\n' +
      'I enjoy exploring new technologies and value a joyful, sustainable career over simply chasing the highest possible income.',
    'about.connect': 'Connect with me',

    'about.education': 'Education',
    'about.university': 'Sungkyunkwan University',
    'about.major': 'Computer Education & Intelligent Information Convergence (Interdisciplinary Major)',
    'about.status': 'Currently Enrolled',
    'about.university-desc':
      'Studying programming, software engineering, and AI-related topics while exploring data and 3D vision, with a focus on turning ideas into AI-powered services people can actually use.',

    'about.tech-stack': 'Tech Stack & Interests',

    'about.frontend': 'Frontend / 3D Web',
    'about.frontend-desc':
      'Building 3D web experiences with Three.js and crafting interactive UIs and data visualizations with React and TypeScript.',

    'about.backend': 'Backend / Infrastructure',
    'about.backend-desc':
      'Building web APIs with Go and FastAPI, and using PostgreSQL, Supabase, and Docker to run them in reliable, production-like environments.',

    'about.ai': 'AI & 3D Vision',
    'about.ai-desc':
      'Connecting LLM pipelines, computer vision (pose estimation, image processing), and 3D vision to real web and backend systems so they become usable products—not just demos.',

    'about.hci': 'Interactive Systems',
    'about.hci-desc':
      'Designing interfaces that feel “alive” through 3D interaction and data-driven visual feedback, with a focus on how people actually use tools.',

    'about.contact': 'Get in Touch',
    'about.contact-desc':
      'Feel free to reach out if you want to talk about AI, computer vision, 3D web, or Go/backend development!',
    'about.contact-desc2': "I'm open to new projects and collaboration opportunities.",
    'about.send-email': 'Send Email',

    'about.stats.role': 'Current Role',
    'about.stats.role.value': 'AI & Backend Engineer',
    'about.stats.location': 'Based in',
    'about.stats.location.value': 'Seoul, South Korea',
    'about.stats.focus': 'Focus areas',
    'about.stats.focus.value': 'LLMs, computer vision, 3D web, backend development',
    'about.stats.languages': 'Working languages',
    'about.stats.languages.value': 'Korean · Japanese · English',

    'about.timeline.title': 'Highlights',
    'about.timeline.0.title': 'SKKU — Computer Education & Intelligent Information Convergence',
    'about.timeline.0.period': '2024 - Present',
    'about.timeline.0.body':
      'Studying programming, software engineering, and AI-related courses while working on projects that aim to grow into real, usable services rather than class assignments.',
    'about.timeline.1.title': 'Bareun-powered VSCode Extension Development',
    'about.timeline.1.period': '2025-11',
    'about.timeline.1.body':
      'Designed and built a VSCode extension using the Bareun AI API to automate Korean grammar checking.\n' +
      'It is now part of my everyday writing and development workflow.',
    'about.timeline.2.title': 'Maintaining Hun-Bot.dev — Multilingual Blog',
    'about.timeline.2.period': '2025 - Present',
    'about.timeline.2.body':
      'Writing AI experiments, development logs, and writing reflections in Korean, Japanese, and English—sharing not only code but also problem framing and the trial-and-error behind each project.',

    'about.features.title': 'Featured links',
    'about.features.note.title': 'Note: Research & reflections',
    'about.features.note.description':
      'Long-form essays (mainly in Japanese) where I record experiments, failures, and creative sparks that don’t always fit into blog posts.',
    'about.features.github.title': 'GitHub profile README',
    'about.features.github.description':
      'A living README that captures my AI, backend, and 3D-related work, tooling, and automation experiments.',
    'about.features.view-more': 'View more',
  },
} as const;

export function getLangFromUrl(url: URL): UILanguage {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as UILanguage;
  return defaultLang;
}

export function useTranslations(lang: UILanguage) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
