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
    'about.greeting': '안녕하세요, AI Product Engineer를 목표하고 있는 남정훈입니다.',
    'about.intro':
    '우리 삶에는 AI가 비집고 들어올 부분이 많지만, 그것이 효율적임을 장담할 순 없다고 생각합니다.\n' +
    '단순하게 제품을 만들어 내는 것이 아닌, 누군가에겐 필요한 제품을 만들려고 공부하고 있습니다.',
    
    'about.stats.role': '현재 역할',
    'about.stats.role.value': '학생',
    'about.stats.location': '지역',
    'about.stats.location.value': '서울 · 대한민국',
    'about.stats.focus': '관심 주제',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web, CV',
    'about.stats.languages': '사용 언어',
    'about.stats.languages.value': '한국어(모국어)\n'+ '日本語(일상회화)\n' + 'English(일상회화)',

    'about.connect': 'Connect with me',
    'about.education': 'Education',
    'about.university': '성균관대학교 (Sungkyunkwan University)',
    'about.major': '컴퓨터교육과 / 뇌인지과학(자기설계융합전공)',
    'about.status': '재학 중',
    'about.university-desc':
      '곧 졸업을 앞두고 있는 성균관대학교 컴퓨터교육과 학생입니다. 컴퓨터교육과에서 프로그래밍과 소프트웨어 개발의 기초를 배우고, 뇌인지과학(지능정보융합전공)에서 AI · LLM · 3D Vision을 공부하며 "사람이 쓸 수 있는 AI 서비스"를 만드는 관점을 키우고 있습니다.',
    'about.academics.title': 'Educational Background',
    'about.academics.subtitle': '학부생 — 성균관대학교 컴퓨터교육과 · 뇌인지과학',
    'about.academics.cs.title': 'Computer Science',
    'about.academics.cs.courses':
      '운영체제 · 소프트웨어공학 · 컴퓨터그래픽스개론\n' +
      '· 자료구조 · 컴퓨터 구조 · 네트워크 구조\n' +
      '· 리눅스 시스템 프로그래밍 · 데이터베이스 시스템',
    'about.academics.ai.title': 'Artificial Intelligence',
    'about.academics.ai.courses':
      '기계학습원론 · AI기반 전략적의사결정\n' +
      '· 인공지능개론 · 인지신경과학 · 데이터 보안 · AI 윤리',
    'about.academics.backend.title': 'Engineering & HCI',
    'about.academics.backend.courses':
      'HCI개론 · 기본 프로그래밍(C Lang)\n' +
      '· 게임 프로그래밍 (C# + Unity)',
    'about.academics.edu.title': 'Education & Cognitive Science',
    'about.academics.edu.courses':
      '컴퓨터교육개론 · 컴퓨터교과교육론 · 교육실습\n' +
      '· 교육 심리학 · 교육 철학 · 인지과학 기초',

    'about.tech-stack': 'Tech Stack & Interests',

    'about.frontend': 'Frontend & Interactive Web',
    'about.frontend-desc':
      '사용자와 제품이 만나는 첫 접점인 웹에서 3D 기술이 주는 몰입감에 주목하며 Three.js를 공부하고 있습니다. React와 TypeScript를 도구로 삼아, 정보를 더 직관적으로 전달할 수 있는 인터랙티브 인터페이스를 연구합니다.',

    'about.backend': 'Backend & MLOps',
    'about.backend-desc':
      '더 빠르고 안정적인 서비스를 제공하고자 Go를 주력으로 백엔드 엔지니어링 역량을 쌓는 중입니다. AI 기술이 실무에서 가치를 내기 위해 필수적인 Airflow, n8n 등 MLOps 환경 구축에 큰 관심을 두고 학습하고 있습니다.',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      '복잡한 AI 기술을 프로덕트로 정제하는 과정에 집중합니다. LLM 오케스트레이션과 컴퓨터 비전 기술을 적재적소에 배치하여, 기술 데모를 넘어 실제 운영 가능한 기능을 구현하는 것을 지향합니다.',

    'about.hci': 'HCI & UX Design',
    'about.hci-desc':
      '뇌인지과학 전공을 바탕으로 "사람이 쓰기 편한 인공지능"을 고민합니다. 사용자 데이터 분석을 통해 경험의 빈틈을 찾고, 기술과 사람 사이의 간극을 줄이는 인터페이스 설계 능력을 기르고 있습니다.',
    
    'about.timeline.title': 'Timeline',
    'about.timeline.0.title': 'Algorithm RAG Engine 개발',
    'about.timeline.0.period': '2026.01',
    'about.timeline.0.body':
      '개인 프로젝트로 Algorithm RAG 엔진을 개발하여 사용하고 있습니다.',
    'about.timeline.1.title': '전공 지식 정리용 github.io 사이트 제작',
    'about.timeline.1.period': '2025.11 ~ 현재',
    'about.timeline.1.body':
      '전공 지식 및 개인 공부 내용을 정리하는 github.io 사이트를 제작하여 기록하고 있습니다.',
    'about.timeline.2.title': 'Bareun 기반 VSCode Extension 제작',
    'about.timeline.2.period': '2025.11 ~ 2025.12',
    'about.timeline.2.body':
      '한국어 문법 검수 자동화를 위해 Bareun AI API를 활용한 확장 프로그램을 개발하여 개인 워크플로우에 적용하고 배포했습니다.',
    'about.timeline.3.title': 'Hun-Bot.dev 기술 블로그 운영',
    'about.timeline.3.period': '2025.06 - 현재',
    'about.timeline.3.body':
      '개인 블로그를 가지고 싶어서 개설했습니다. 다양한 주제로 글을 작성하고 있습니다.',

    'about.features.title': 'Personal Links',
    'about.features.note.title': 'Study Log',
    'about.features.note.description':
      '학교 전공 과목과 개인적인 학습 기록을 꼼꼼하게 정리하고 있는 지식 저장소입니다.',
    'about.features.github.title': 'Portfolio',
    'about.features.github.description':
      '진행한 프로젝트의 코드와 결과물을 정리하고 있습니다. 현재 새로운 콘텐츠로 지속 업데이트 중입니다.',
    'about.features.view-more': '공사중입니다',
  },

  jp: {
    'nav.home': 'ホーム',
    'nav.blog': 'ブログ',
    'nav.about': '私について',
    'nav.tags': 'タグ',
    'nav.archive': 'アーカイブ',
    'footer.copyright': 'All rights reserved',
    'footer.built-with': 'Built with:',
    'blog.read-more': '続きを読む',
    'blog.all-posts': 'すべての投稿',
    'blog.recent-posts': '最近の投稿',
    'blog.no-posts': 'まだ投稿がありません。',
    'blog.tags-title': 'タグ一覧',
    'blog.tags-description': 'すべての投稿で使用されているタグを確認できます。',
    'blog.no-tags': 'タグがありません。',
    'blog.tag-count': '{count}件',
    'blog.published': '公開日',
    'blog.updated': '更新日',
    'blog.views': '閲覧数',
    'blog.views-loading': '集計中...',
    'blog.views-error': '取得失敗',
    'toc.title': '目次',
    'toc.toggle': '目次の切り替え',

    'about.title': '私について',
    'about.description': 'AI Product Engineerを目指す、ナム・ジョンフンの紹介ページです。',
    'about.greeting': 'こんにちは、\n'+'AI Product Engineerを 目指している ナム・ジョンフンです。',
    'about.intro':
      '私たちの生活にAIが入り込む隙間は多いですが、それが必ずしも効率的であるとは限らないと考えています。\n' +
      '単に製品を作るのではなく、「誰かにとって本当に必要な製品」を作るために日々勉強しています。',

    'about.stats.role': '現在の役割',
    'about.stats.role.value': '学生',
    'about.stats.location': '拠点',
    'about.stats.location.value': 'ソウル・韓国',
    'about.stats.focus': '注力分野',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web, CV',
    'about.stats.languages': '対応言語',
    'about.stats.languages.value': '韓国語(母国語)\n' + '日本語(日常会話)\n' + '英語(日常会話)',

    'about.connect': 'つながる',
    'about.education': '学歴',
    'about.university': '成均館大学校 (Sungkyunkwan University)',
    'about.major': 'コンピュータ教育学科 / 知能情報融合専攻（自己設計複合専攻）',
    'about.status': '在学中',
    'about.university-desc':
      '卒業を控えている成均館大学の学生です。コンピュータ教育学科でプログラミングとソフトウェア開発の基礎を学び、知能情報融合専攻で AI・LLM・3D Vision を研究しながら、「人が使えるAIサービス」を作る視点を養っています。',
    'about.academics.title': 'アカデミックバックグラウンド',
    'about.academics.subtitle': '学部生 — 成均館大学 コンピュータ教育学科・認知科学',
    'about.academics.cs.title': 'Computer Science',
    'about.academics.cs.courses':
      'オペレーティングシステム・ソフトウェア工学・コンピュータグラフィックス概論\n' +
      'データ構造・コンピュータ構成・ネットワーク構成\n' +
      '· Linuxシステムプログラミング・データベースシステム',
    'about.academics.ai.title': 'Artificial Intelligence',
    'about.academics.ai.courses':
      '機械学習原論・AIベースの戦略的意思決定\n' +
      '· 人工知能概論・認知神経科学・データセキュリティ・AI倫理',
    'about.academics.backend.title': 'Engineering & HCI',
    'about.academics.backend.courses':
      'HCI概論・プログラミング基礎(C言語)\n' +
      '· ゲームプログラミング (C# + Unity)',
    'about.academics.edu.title': 'Education & Cognitive Science',
    'about.academics.edu.courses':
      'コンピュータ教育概論・コンピュータ教科教育論・教育実習\n' +
      '· 教育心理学・教育哲学・認知科学基礎',

    'about.tech-stack': '技術スタック & 興味',

    'about.frontend': 'Frontend & Interactive Web',
    'about.frontend-desc':
      'ユーザーと製品が最初に出会う「Web」において、3D技術がもたらす没入感に注目し、Three.jsを勉強しています。ReactとTypeScriptを武器に、情報をより直感的に伝えるインタラクティブなUIを研究しています。',

    'about.backend': 'Backend & MLOps',
    'about.backend-desc':
      'より迅速で安定したサービスを提供するため、Goを主力としてバックエンドエンジニアリングのスキルを磨いています。AI技術を実務で価値あるものにするために不可欠な Airflow、n8n などの MLOps 環境構築に強い関心を持って学習しています。',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      '複雑なAI技術をプロダクトとして精製する過程に集中しています。LLMオーケストレーションとコンピュータビジョン技術を適材適所に配置し、技術デモを超えて「実際に運用可能な機能」を実装することを目指しています。',

    'about.hci': 'HCI & UX Design',
    'about.hci-desc':
      '認知科学の専攻を活かし、「人が使いやすい人工知能」を模索しています。ユーザーデータの分析を通じて体験の隙間を見つけ、技術と人の距離を縮めるインターフェース設計能力を養っています。',

    'about.timeline.title': 'タイムライン',
    'about.timeline.0.title': 'Algorithm RAG Engine 開発',
    'about.timeline.0.period': '2026.01',
    'about.timeline.0.body':
      '個人プロジェクトとして Algorithm RAG エンジンを開発し、自ら活用しています。',
    'about.timeline.1.title': '学習記録用 github.io サイト制作',
    'about.timeline.1.period': '2025.11 - 現在',
    'about.timeline.1.body':
      '専攻知識や個人の学習内容を整理するため、github.io サイトを制作し記録を残しています。',
    'about.timeline.2.title': 'Bareun 連携 VSCode 拡張機能の開発',
    'about.timeline.2.period': '2025.11 - 2025.12',
    'about.timeline.2.body':
      '韓国語文法チェックの自動化のため、Bareun AI API を活用した拡張機能を開発し、個人のワークフローへの適用および配布を行いました。',
    'about.timeline.3.title': 'Hun-Bot.dev 技術ブログ運営',
    'about.timeline.3.period': '2025.06 - 現在',
    'about.timeline.3.body':
      '自分だけのブログを持ちたいと思い開設しました。多様なトピックで記事を執筆しています。',

    'about.features.title': '関連リンク',
    'about.features.note.title': 'Study Log',
    'about.features.note.description':
      '大学の専攻科目や個人学習の記録を詳細に整理している知識ベースです。',
    'about.features.github.title': 'Portfolio',
    'about.features.github.description':
      '進行したプロジェクトのコードや成果物を整理しています。現在、新しいコンテンツを継続的に更新中です。',
    'about.features.view-more': '準備中です',
  },

  en: {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.tags': 'Tags',
    'nav.archive': 'Archive',
    'footer.copyright': 'All rights reserved',
    'footer.built-with': 'Built with:',
    'blog.read-more': 'Read more',
    'blog.all-posts': 'All Posts',
    'blog.recent-posts': 'Recent Posts',
    'blog.no-posts': 'No posts yet.',
    'blog.tags-title': 'Tags',
    'blog.tags-description': 'Explore every tag used across posts.',
    'blog.no-tags': 'No tags found.',
    'blog.tag-count': '{count} posts',
    'blog.published': 'Published',
    'blog.updated': 'Updated',
    'blog.views': 'Views',
    'blog.views-loading': 'Counting...',
    'blog.views-error': 'Error',
    'toc.title': 'Table of Contents',
    'toc.toggle': 'Toggle table of contents',

    'about.title': 'About',
    'about.description': 'About Jeonghun Nam, an aspiring AI Product Engineer.',
    'about.greeting': "Hi, I'm Jeonghun Nam, aspiring to be an AI Product Engineer.",
    'about.intro':
      "While AI is permeating many parts of our lives, I don't think its efficiency is always guaranteed.\n" +
      'Instead of just producing products, I am studying to build products that someone truly needs.',

    'about.stats.role': 'Current Role',
    'about.stats.role.value': 'Student',
    'about.stats.location': 'Based in',
    'about.stats.location.value': 'Seoul, South Korea',
    'about.stats.focus': 'Focus Areas',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web, CV',
    'about.stats.languages': 'Languages',
    'about.stats.languages.value': 'Korean (Native)\n' + 'Japanese (Conversational)\n' + 'English (Conversational)',

    'about.connect': 'Connect with me',
    'about.education': 'Education',
    'about.university': 'Sungkyunkwan University (SKKU)',
    'about.major': 'Computer Education / Cognitive Science (Interdisciplinary Major)',
    'about.status': 'Enrolled',
    'about.university-desc':
      'I am a Computer Education student at SKKU, nearing graduation. I am building a foundation in software development and programming while exploring AI, LLMs, and 3D Vision to develop a perspective on creating "human-centric AI services."',
    'about.academics.title': 'Academic Background',
    'about.academics.subtitle': 'Undergraduate — SKKU Computer Education & Cognitive Science',
    'about.academics.cs.title': 'Computer Science',
    'about.academics.cs.courses':
      'Operating Systems · Software Engineering · Intro to Computer Graphics\n' +
      '· Data Structures · Computer Architecture · Network Architecture\n' +
      '· Linux System Programming · Database Systems',
    'about.academics.ai.title': 'Artificial Intelligence',
    'about.academics.ai.courses':
      'Principles of Machine Learning · Strategic Decision Making via AI\n' +
      '· Introduction of AI · Cognitive Neuroscience ·  Data Security · AI Ethics',
    'about.academics.backend.title': 'Engineering & HCI',
    'about.academics.backend.courses':
      'Intro to HCI · C Programming Fundamentals\n' +
      '· Game Programming (C# + Unity)',
    'about.academics.edu.title': 'Education & Cognitive Science',
    'about.academics.edu.courses':
      'Intro to Computer Education · CS Teaching Methods · Teaching Practice\n' +
      '· Educational Psychology · Philosophy of Education · Cognitive Science Fundamentals',

    'about.tech-stack': 'Tech Stack & Interests',

    'about.frontend': 'Frontend & Interactive Web',
    'about.frontend-desc':
      'Focusing on the immersive experiences 3D technology brings to the web, I am studying Three.js. Using React and TypeScript, I research interactive interfaces that deliver information more intuitively.',

    'about.backend': 'Backend & MLOps',
    'about.backend-desc':
      'To provide faster and more stable services, I am building backend engineering skills with Go. I have a strong interest in learning MLOps, including tools like Airflow and n8n, which are essential for integrating AI into production.',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      'I focus on the process of refining complex AI technologies into usable products. By placing LLM orchestration and computer vision in the right places, I aim to implement production-ready features beyond tech demos.',

    'about.hci': 'HCI & UX Design',
    'about.hci-desc':
      'Based on my Cognitive Science background, I think deeply about "user-friendly AI." I analyze user data to find experience gaps and develop the ability to design interfaces that bridge the gap between technology and people.',

    'about.timeline.title': 'Timeline',
    'about.timeline.0.title': 'Algorithm RAG Engine Development',
    'about.timeline.0.period': 'Jan 2026',
    'about.timeline.0.body':
      'Developed and am currently using an Algorithm RAG engine as a personal project.',
    'about.timeline.1.title': 'github.io Site for Knowledge Management',
    'about.timeline.1.period': 'Nov 2025 - Present',
    'about.timeline.1.body':
      'Created a github.io site to organize and record major-related knowledge and personal studies.',
    'about.timeline.2.title': 'Bareun-based VSCode Extension',
    'about.timeline.2.period': 'Nov 2025 - Dec 2025',
    'about.timeline.2.body':
      'Developed and deployed a VSCode extension using the Bareun AI API to automate Korean grammar checking in my workflow.',
    'about.timeline.3.title': 'Hun-Bot.dev Tech Blog',
    'about.timeline.3.period': 'Jun 2025 - Present',
    'about.timeline.3.body':
      'Launched a personal blog to share thoughts and insights on various technical topics.',

    'about.features.title': 'Personal Links',
    'about.features.note.title': 'Study Log',
    'about.features.note.description':
      'A knowledge repository where I meticulously organize course materials and personal study records.',
    'about.features.github.title': 'Portfolio',
    'about.features.github.description':
      'A collection of code and results from my projects, continuously updated with new content.',
    'about.features.view-more': 'Under Construction',
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
