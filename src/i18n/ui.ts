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
    'nav.blog': '모든 글',
    'nav.categories': '카테고리',
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
    'blog.categories-title': '카테고리',
    'blog.categories-description': '카테고리별로 글을 모아볼 수 있습니다.',
    'blog.no-categories': '아직 등록된 카테고리가 없습니다.',
    'blog.category-count': '글 {count}개',
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
    
    // 메인 타임라인: 내 흐름
    'about.timeline.title': 'Timeline',
    'about.timeline.0.title': '일본 시장을 향한 AI 서비스 4종 설계·개발',
    'about.timeline.0.period': '2026.01 ~ 진행 중',
    'about.timeline.0.body':
      '일본 주식 서비스, 온프레미스 일본어 학습 플랫폼, JLPT N1·경어 말하기 서비스, 핸드폰 부가서비스 탐지 서비스를 설계·구현하며 실제 배포를 준비하고 있습니다.',
    'about.timeline.1.title': '자율주행대회 장려상',
    'about.timeline.1.period': '2026.01.15 ~ 2026.01.20',
    'about.timeline.1.body':
      'ROS2와 AI를 활용해 팀과 함께 자율주행 차량을 구현했고, 기술적 어려움으로 아쉽게도 장려상을 수상했습니다.',
    'about.timeline.2.title': 'Bareun 기반 VSCode Extension 개발·배포',
    'about.timeline.2.period': '2025.11 ~ 2025.12',
    'about.timeline.2.body':
      '한국어 문법 검수 자동화를 위해 Bareun AI API를 활용한 VSCode 확장 프로그램을 처음부터 직접 구현하고, 실제로 사용할 목적으로 마켓플레이스에 배포했습니다. [30+ 다운로드]',
    'about.timeline.3.title': '교내 해커톤 – AI Task Planner 백엔드 구축',
    'about.timeline.3.period': '2025.10',
    'about.timeline.3.body':
      '교내 해커톤에서 AI 기반 Task Planner 서비스를 위한 백엔드 시스템을 설계·구현하며, API 설계와 서비스 아키텍처 감각을 키웠습니다.',
    'about.timeline.4.title': 'ICT Next Frontier 강원 – 재난 구호 AI 시스템 최우수상',
    'about.timeline.4.period': '2025.09',
    'about.timeline.4.body':
      '재난 구호 물자 중복과 비효율을 줄이기 위해, AI 기반 배분 최적화·투명성 향상 시스템의 아이디어를 발표해, ICT Next Frontier 강원 대회에서 최우수상(상금 150만원)을 받았습니다.',
    'about.timeline.5.title': '제테마 홈페이지 리뉴얼 해커톤 우수상',
    'about.timeline.5.period': '2025.08',
    'about.timeline.5.body':
      '제테마 홈페이지 리뉴얼 해커톤에서 사용자 경험 관점의 웹 리뉴얼을 제안·구현하며 우수상(상금 30만원)을 수상했습니다.',
    'about.timeline.6.title': 'Grow Graph – 자료구조 수업 프로젝트',
    'about.timeline.6.period': '2025.03 ~ 2025.06',
    'about.timeline.6.body':
      '자료구조 수업에서 Grow Graph 프로젝트를 진행하며, 클라이언트와 서버를 모두 구현하고 AI를 활용한 진로 성장 그래프 시각화를 시도했습니다.',
    'about.timeline.7.title': '성균관대학교 3학년 편입',
    'about.timeline.7.period': '2024.03',
    'about.timeline.7.body':
      '성균관대학교 정보·컴퓨터 계열로 3학년 편입하여, 이후 AI·백엔드 중심 커리어를 본격적으로 준비하기 시작했습니다.',
    // 옵션: 블로그/정리 흐름을 추가하고 싶으면 아래 두 개까지 포함
    'about.timeline.8.title': 'Hun-Bot.dev 기술 블로그 운영 시작',
    'about.timeline.8.period': '2025.06 ~ 현재',
    'about.timeline.8.body':
      '공부와 개발 과정을 기록하기 위해 개인 기술 블로그를 개설하고, 프로젝트 회고와 생각들을 꾸준히 글로 정리하고 있습니다.',
    'about.timeline.9.title': '전공 지식 정리용 github.io Study 사이트 구축',
    'about.timeline.9.period': '2025.11 ~ 현재',
    'about.timeline.9.body':
      '전공 지식과 개인 공부 내용을 구조적으로 정리하기 위해 Docusaurus 기반 github.io 사이트를 구축하고, 노트와 정리 글을 계속 추가하고 있습니다.',
    // 도전/부족 섹션: 실패와 배운 점
    'about.challenges.title': '도전과 부족했던 순간들',
    'about.challenges.0.title': '편입 직후 1년, 방향을 찾지 못한 시간',
    'about.challenges.0.period': '2024 ~ 2025 초',
    'about.challenges.0.body':
      '성균관대로 편입한 뒤 처음 1년은 뚜렷한 목표 없이 수업만 따라가며 “물 흐르듯” 보냈고, 25년이 되고 나서야, 이 시간이 아깝다고 느껴서 이후 공모전·해커톤과 개인 프로젝트에 적극적으로 뛰어들게 만든 계기가 됐습니다.',
    'about.challenges.1.title': '교내 대회 2회 연속 실패 – 개인정보 서비스 & 일정 관리 AI',
    'about.challenges.1.period': '2024 하반기, 2025 하반기',
    'about.challenges.1.body':
      '죽음 이후의 개인 정보를 다루는 서비스, 일정 관리 AI 자동화 서비스를 해커톤 기간인 1박2일 안에 설계·구현했지만 상을 받지는 못했습니다. 데이터 준비와 사전 리서치, 아이디어와 도메인 지식의 중요성을 뼈저리게 배웠습니다.',
    'about.challenges.2.title': 'SNU 공모전 탈락 – 편의점 데이터 분석',
    'about.challenges.2.period': '2025.04 ~ 2025.06',
    'about.challenges.2.body':
      '대한민국 편의점 데이터를 다루는 SNU 공모전에 도전했지만, 피처 엔지니어링과 AI에 대한 지식이 부족해 탈락했습니다.' +
      '이 경험을 바탕으로 이후 ICT 재난 구호 AI 프로젝트에서는 문제 정의와 데이터 조사, 논문 조사에 훨씬 더 많은 시간을 투자하게 됐습니다.',

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
    'nav.blog': 'すべての投稿',
    'nav.categories': 'カテゴリー',
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
    'blog.categories-title': 'カテゴリー',
    'blog.categories-description': 'カテゴリー別に投稿を確認できます。',
    'blog.no-categories': 'カテゴリーがありません。',
    'blog.category-count': '{count}件',
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

  // メインタイムライン: 活動の軌跡
  'about.timeline.title': '活動タイムライン',

  'about.timeline.0.title': '日本市場向けAIサービス4種の構築',
  'about.timeline.0.period': '2026.01 ~ 現在',
  'about.timeline.0.body':
    '日本株分析、日本語学習プラットフォーム、JLPT会話コーチ、モバイル付加サービス検知など、4つのAIサービスを設計・実装しています。現在は本番環境へのデプロイに向けた最終調整を行っています。',

  'about.timeline.1.title': '自動運転コンテスト 奨励賞受賞',
  'about.timeline.1.period': '2026.01.15 ~ 2026.01.20',
  'about.timeline.1.body':
    'ROS2とAI技術を駆使し、自律走行車両をチームで実装しました。技術的な難題に直面しながらも、粘り強く解決策を模索した結果、奨励賞を受賞しました。',

  'about.timeline.2.title': 'Bareun AI活用 VSCode拡張機能の開発・公開',
  'about.timeline.2.period': '2025.11 ~ 2025.12',
  'about.timeline.2.body':
    '韓国語校正を自動化するため、Bareun AI APIを用いたVSCode拡張機能を開発しました。実用性を重視してマーケットプレイスに公開し、現在30回以上のダウンロードを記録しています。',

  'about.timeline.3.title': '学内ハッカソン – AIタスクプランナー構築',
  'about.timeline.3.period': '2025.10',
  'about.timeline.3.body':
    'AIベースのタスク管理サービスにてバックエンド設計を担当。API設計やマイクロサービス的な視点でのシステム構築に取り組み、実践的な開発スキルを養いました。',

  'about.timeline.4.title': 'ICT Next Frontier – 災害救援AIシステム 最優秀賞',
  'about.timeline.4.period': '2025.09',
  'about.timeline.4.body':
    '救援物資の重複分配を防ぐためのAI最適化システムを提案しました。技術的な実現可能性と論理的な設計が評価され、最優秀賞（賞金150万ウォン）を受賞しました。',

  'about.timeline.5.title': 'Jetemaサイトリニューアルハッカソン 優秀賞',
  'about.timeline.5.period': '2025.08',
  'about.timeline.5.body':
    'UX（ユーザー体験）の観点からウェブサイトのリニューアルを提案・実装しました。デザインと機能性の調和を評価され、優秀賞を受賞しました。',

  'about.timeline.6.title': 'Grow Graph – データ構造プロジェクト',
  'about.timeline.6.period': '2025.03 ~ 2025.06',
  'about.timeline.6.body':
    'データ構造の講義にて、AIを用いたキャリア成長可視化システムを開発。クライアントからサーバーまで一貫して実装し、フルスタックな開発を経験しました。',

  'about.timeline.7.title': '成均館大学への編入',
  'about.timeline.7.period': '2024.03',
  'about.timeline.7.body':
    'より高度な工学の知見を得るため、成均館大学の情報通信学部に編入しました。これを機にAIおよびバックエンドエンジニアとしてのキャリアを本格化させました。',

  'about.timeline.8.title': '技術ブログ「Hun-Bot.dev」の運営',
  'about.timeline.8.period': '2025.06 ~ 現在',
  'about.timeline.8.body':
    '開発プロセスや思考の整理を目的として技術ブログを開設。プロジェクトの振り返りなどを通じ、継続的なアウトプットを行っています。',

  'about.timeline.9.title': '学習アーカイブサイトの構築',
  'about.timeline.9.period': '2025.11 ~ 현재',
  'about.timeline.9.body':
    '専門知識を体系的に整理するため、Docusaurusベースの学習サイトを構築。学んだ知識を資産化し、常にブラッシュアップを続けています。',

  // 挑戦と試行錯誤の記録
  'about.challenges.title': '挑戦と成長の記録',

  'about.challenges.0.title': '編入後の模索と転환点',
  'about.challenges.0.period': '2024 ~ 2025 初頭',
  'about.challenges.0.body':
    '編入直後は明確な目標が見つからず、授業に追われる日々でした。しかし、その停滞感こそが「自ら行動しなければならない」という強い動機付けとなり、後の挑戦へと繋がりました。',

  'about.challenges.1.title': '学内大会での苦い経験 – 2度の落選',
  'about.challenges.1.period': '2024 下半期、2025 下半期',
  'about.challenges.1.body':
    '1泊2日の強行軍でシステムを構築しましたが、入賞には至りませんでした。準備の不足やドメイン知識の重要性を痛感し、エンジニアとしての基礎体力を鍛え直す契機となりました。',

  'about.challenges.2.title': 'SNUコンペでの挫折と再挑戦',
  'about.challenges.2.period': '2025.04 ~ 2025.06',
  'about.challenges.2.body':
    'データ分析コンペに挑むも、AIの知識不足により落選。この悔しさを糧に、後の災害救援AIプロジェクトでは徹底的な先行研究調査を行い、最優秀賞に繋げることができました。',

  'about.features.title': 'Personal Links',
  'about.features.note.title': 'Study Log',
  'about.features.note.description': '大学の講義や個人の学習記録をまとめたナレッジベースです。',
  'about.features.github.title': 'Portfolio',
  'about.features.github.description': '進行中のプロジェクトのソースコードを管理しています。',
  'about.features.view-more': '準備中です',

  },

  en: {
    'nav.home': 'Home',
    'nav.blog': 'All Posts',
    'nav.categories': 'Categories',
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
    'blog.categories-title': 'Categories',
    'blog.categories-description': 'Browse posts by category.',
    'blog.no-categories': 'No categories found.',
    'blog.category-count': '{count} posts',
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

    // Main Timeline: My Journey
  'about.timeline.title': 'Timeline',

  'about.timeline.0.title': 'Developing 4 AI Services for the Japanese Market',
  'about.timeline.0.period': 'Jan 2026 ~ Present',
  'about.timeline.0.body':
    'Architecting and implementing Japanese Stock Analysis, On-premise Language Learning, JLPT Speaking Coach, and Carrier Add-on Detection services. Preparing for production deployment.',

  'about.timeline.1.title': 'Autonomous Driving Competition – Encouragement Award',
  'about.timeline.1.period': 'Jan 2026',
  'about.timeline.1.body':
    'Developed an autonomous vehicle prototype using ROS2 and AI. Despite technical bottlenecks, secured the Encouragement Award through team-based problem-solving.',

  'about.timeline.2.title': 'VSCode Extension Development & Deployment (Bareun AI)',
  'about.timeline.2.period': 'Nov 2025 ~ Dec 2025',
  'about.timeline.2.body':
    'Built a VSCode extension from scratch for automated Korean grammar checking using Bareun AI API. Deployed to Marketplace with 30+ downloads to optimize developer workflows.',

  'about.timeline.3.title': 'Campus Hackathon – AI Task Planner Backend Architecture',
  'about.timeline.3.period': 'Oct 2025',
  'about.timeline.3.body':
    'Designed and implemented a backend system for an AI-powered Task Planner, gaining hands-on experience in API design and scalable service architectures.',

  'about.timeline.4.title': 'ICT Next Frontier – Grand Prize (AI Disaster Relief System)',
  'about.timeline.4.period': 'Sep 2025',
  'about.timeline.4.body':
    'Proposed an AI-driven optimization system for disaster relief allocation. Awarded the Grand Prize (1.5M KRW) for technological feasibility and system design logic.',

  'about.timeline.5.title': 'Jetema Website Renewal Hackathon – Excellence Award',
  'about.timeline.5.period': 'Aug 2025',
  'about.timeline.5.body':
    'Executed a UX-focused website renewal proposal. Won the Excellence Award (300K KRW) by demonstrating the impact of user-centric design.',

  'about.timeline.6.title': 'Grow Graph – Data Structure Project',
  'about.timeline.6.period': 'Mar 2025 ~ Jun 2025',
  'about.timeline.6.body':
    'Developed both client and server for the "Grow Graph" project, exploring AI-based career growth visualization during Data Structure coursework.',

  'about.timeline.7.title': 'Transferred to Sungkyunkwan University',
  'about.timeline.7.period': 'Mar 2024',
  'about.timeline.7.body':
    'Transferred as a junior to major in Information and Computer Engineering. Pivoted focus toward AI and Backend Engineering to build a specialized career path.',

  'about.timeline.8.title': 'Launched Tech Blog "Hun-Bot.dev"',
  'about.timeline.8.period': 'Jun 2025 ~ Present',
  'about.timeline.8.body':
    'Established a technical blog to document learning processes and development retrospectives, consistently sharing engineering insights.',

  'about.timeline.9.title': 'Built github.io Knowledge Repository',
  'about.timeline.9.period': 'Nov 2025 ~ Present',
  'about.timeline.9.body':
    'Constructed a Docusaurus-based study site to structurally organize computer science knowledge and personal learning milestones.',

  // Challenges Section
  'about.challenges.title': 'Challenges & Lessons Learned',

  'about.challenges.0.title': 'A Period of Reflection After Transfer',
  'about.challenges.0.period': '2024 ~ Early 2025',
  'about.challenges.0.body':
    'Spent the first year focused on core academic subjects. Recognizing the need for practical application in 2025, I began proactively engaging in hackathons and large-scale projects.',

  'about.challenges.1.title': 'Successive Failures in Campus Competitions',
  'about.challenges.1.period': 'Late 2024, Late 2025',
  'about.challenges.1.body':
    'Attempted to build Post-mortem Data and AI Scheduling services within 48-hour hackathon constraints. Although unsuccessful, I learned the paramount importance of data preprocessing and domain research.',

  'about.challenges.2.title': 'SNU Data Competition Failure',
  'about.challenges.2.period': 'Apr 2025 ~ Jun 2025',
  'about.challenges.2.body':
    'Challenged the SNU competition but failed due to insufficient knowledge in feature engineering. This experience drove me to prioritize rigorous problem definition and research in subsequent award-winning projects.',

  'about.features.title': 'Personal Links',
  'about.features.note.title': 'Study Log',
  'about.features.note.description': 'A structured knowledge repository of academic subjects and self-study notes.',
  'about.features.github.title': 'Portfolio',
  'about.features.github.description': 'Source codes and deliverables for ongoing engineering projects.',
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
