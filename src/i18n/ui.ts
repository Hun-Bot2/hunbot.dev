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
    'about.stats.focus': '관심 주제',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web',
    'about.stats.languages': '사용 언어',
    'about.stats.languages.value': '한국어(모국어)\n'+ '日本語(일상회화)\n' + 'English(일상회화)',

    'about.connect': 'Connect with me',
    'about.education': 'Education',
    'about.university': '성균관대학교 (Sungkyunkwan University)',
    'about.major': '컴퓨터교육과 / 뇌인지과학(자기설계융합전공)',
    'about.status': '재학 중',
    'about.university-desc':
      '성균관대학교에서 컴퓨터교육과 지능정보융합공학을 공부하며 곧 졸업을 앞두고 있습니다. 마음이 이끄는 대로 재미있는 것을 찾기 위해 여러 분야를 부딪혀보며 탐색했습니다. 실제 동작하는 AI 서비스를 만들고 시스템을 엮어내는 엔지니어링이 가장 제 적성에 맞는다는 것을 깨닫고, 지금은 즐겁게 개발에만 몰두하고 있습니다.',
    'about.academics.title': '수강한 과목들',
    'about.academics.self.title': 'Independent Study',
    'about.academics.self.courses':
      'Go · Rust · MLOps · RAG Pipeline · WebGPU · Three.js',
    'about.academics.self.focus.current.label': 'CURRENT',
    'about.academics.self.focus.current.value': 
      '기계 번역(MT) 파이프라인 연구 · 효율적인 AI 프로덕트 설계',
    'about.academics.self.focus.past.label': 'PAST',
    'about.academics.self.focus.past.value': 
      '자율주행(ROS2) · 디스플레이 공정 실습 · 뇌인지과학',
    'about.academics.cs.title': 'Computer Science',
    'about.academics.cs.courses':
      '운영체제 · 소프트웨어공학 · 컴퓨터그래픽스개론' +
      '· 자료구조 · 컴퓨터 구조 · 네트워크 구조' +
      '· 리눅스 시스템 프로그래밍 · 데이터베이스' +
      '· 시스템 프로그램(CS:APP)' ,
    'about.academics.ai.title': 'Artificial Intelligence',
    'about.academics.ai.courses':
      '기계학습원론 · AI기반 전략적의사결정' +
      '· 인공지능개론 · 인지신경과학 · 데이터 보안 · AI 윤리 ' +
      '· 심층신경망개론',
    'about.academics.backend.title': 'Engineering & HCI',
    'about.academics.backend.courses':
      'HCI개론 · 기본 프로그래밍(C Lang)' +
      '· 게임 프로그래밍 (C# + Unity) · 차세대 컴퓨터 인터페이스 디자인(아두이노)',
    'about.academics.edu.title': 'Education & Cognitive Science',
    'about.academics.edu.courses':
      '컴퓨터교육개론 · 컴퓨터교과교육론 · 교육실습' +
      '· 교육 심리학 · 교육 철학 · 인지과학 기초' +
      ' 교육 방법 및 공학 · 학교 폭력 예방과 이해 · 상업정보교과논라논술' +
      ' 컴퓨터교재연구및지도법',
    'about.tech-stack': 'Tech Stack & Interests',

    'about.frontend': 'Frontend & 3D Web',
    'about.frontend-desc':
      'React와 TypeScript로 필요한 웹 인터페이스를 빠르게 구현합니다. 최근에는 단순히 정보를 보여주는 것을 넘어, WebGPU와 Three.js를 활용해 브라우저 위에서 3D 그래픽을 직접 렌더링하고 조작하는 작업에 재미를 붙이고 있습니다.',

    'about.backend': 'Backend & Systems',
    'about.backend-desc':
      'Go와 Rust를 주력 언어로 사용합니다. 단순히 API를 뚫는 것을 넘어 시스템의 성능이나 아키텍처에 관심이 많아, 최근에는 Kafka를 이용한 데이터 파이프라인이나 Terraform을 통한 인프라 구축까지 영역을 넓혀가며 삽질하고 있습니다.',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      '새로운 AI 모델의 밑바닥을 연구하기보다는, 이미 나와있는 강력한 LLM들을 엮어서 "실제로 돌아가는 서비스"를 만드는 데 집중합니다. RAG 파이프라인을 구축하거나 LangGraph 등으로 AI 에이전트 워크플로우를 설계하는 작업을 주로 합니다.',

    'about.hci': 'UX & Practical Design',
    'about.hci-desc':
      '아무리 뛰어난 백엔드나 AI 기술이 들어가도 결국 사용자가 쓰기 불편하면 의미가 없다고 생각합니다. 대단한 디자인 철학을 내세우기보다는, 실제 프로덕트가 사람들에게 어떤 경험을 주는지 관찰하고 기능과 UI 사이의 타협점을 찾는 데 신경 씁니다.',

    // 메인 타임라인: 내 흐름
    'about.timeline.title': 'Timeline',
    'about.timeline.order':
      'ai_rookies,ai_products_plan,autonomous_award,bareun_vscode,campus_task_planner,ict_next_frontier,jetema_renewal,scamverse,grow_graph,digital_legacy,tech_blog_archive',
    'about.timeline.trajectory.subtitle': '기반 구축에서 제품화까지, 2024-2026 성장 흐름',
    'about.timeline.filter.all': 'All',
    'about.timeline.filter.project': 'Project',
    'about.timeline.filter.award': 'Award',
    'about.timeline.filter.study': 'Study',
    'about.timeline.filter.community': 'Community',
    'about.timeline.year.2026.summary': '제품화와 실전 운영 역량 강화',
    'about.timeline.year.2025.summary': '아이디어 검증과 구현 경험 확장',
    'about.timeline.year.2024.summary': '전환점 확보와 기반 구축',
    'about.timeline.type.project': 'Project',
    'about.timeline.type.award': 'Award',
    'about.timeline.type.study': 'Study',
    'about.timeline.type.community': 'Community',
    'about.timeline.meta.goal': 'Goal',
    'about.timeline.meta.impact': 'Impact',
    'about.timeline.year.toggle.more': '연도 펼치기',
    'about.timeline.year.toggle.less': '연도 접기',
    'about.timeline.toggle.more': '자세히 보기',
    'about.timeline.toggle.less': '접기',
    'about.timeline.ai_rookies.title': 'AI Rookies 프로그램 참여',
    'about.timeline.ai_rookies.period': '2026.05 ~ 진행 중',
    'about.timeline.ai_rookies.body':
      'AI Rookies 멤버로 선발되어 AI 모델 실무 프로젝트를 수행하며 엔지니어링 파이프라인 고도화 및 최적화에 집중하고 있습니다.',
    'about.timeline.ai_products_plan.title': 'AI 프로덕트 4종 설계 및 개발 계획',
    'about.timeline.ai_products_plan.period': '2026.01 ~ 진행 중',
    'about.timeline.ai_products_plan.body':
      '주식 분석, 온프레미스 학습 플랫폼, JLPT 경어 회화, 모바일 부가서비스 탐지 등 4개 서비스를 직접 설계하고 구축 중입니다.',
    'about.timeline.autonomous_award.title': '자율주행 경진대회 장려상',
    'about.timeline.autonomous_award.period': '2026.01',
    'about.timeline.autonomous_award.body':
      'ROS2와 YOLOv8을 활용한 자율주행 시스템 구현. 제한된 하드웨어 자원에서의 모델 최적화 과정을 경험했습니다.',
    'about.timeline.bareun_vscode.title': 'Bareun AI 기반 VSCode Extension 개발 및 배포',
    'about.timeline.bareun_vscode.period': '2025.11 ~ 2025.12',
    'about.timeline.bareun_vscode.body':
      '한국어 문법 검수 자동화를 위한 VSCode 확장 프로그램을 직접 개발하여 마켓플레이스에 배포했습니다. [30+ 다운로드]',
    'about.timeline.campus_task_planner.title': '교내 해커톤 – AI Task Planner 백엔드 구축',
    'about.timeline.campus_task_planner.period': '2025.10',
    'about.timeline.campus_task_planner.body':
      'AI 기반 일정 관리 서비스의 백엔드 아키텍처 설계 및 API 서버 구현.',
    'about.timeline.ict_next_frontier.title': 'ICT Next Frontier 강원 – 최우수상',
    'about.timeline.ict_next_frontier.period': '2025.09',
    'about.timeline.ict_next_frontier.body':
      'AI 기반 재난 구호 물류 최적화 시스템을 제안하여 ICT Next Frontier 강원 대회에서 최우수상을 수상했습니다.',
    'about.timeline.jetema_renewal.title': '제테마 홈페이지 리뉴얼 해커톤 우수상',
    'about.timeline.jetema_renewal.period': '2025.08',
    'about.timeline.jetema_renewal.body':
      '사용자 경험 개선을 위한 웹 프론트엔드 리뉴얼 기획 및 구현으로 우수상을 수상했습니다.',
    'about.timeline.scamverse.title': 'ScamVerse – 사기 예방 메타버스 기획',
    'about.timeline.scamverse.period': '2025.07',
    'about.timeline.scamverse.body':
      '다양한 사기 수법을 체계적으로 가상 체험하여 피해를 예방하는 서비스의 개념과 시나리오를 설계했습니다.',
    'about.timeline.grow_graph.title': 'Grow Graph – 자료구조 시각화 프로젝트',
    'about.timeline.grow_graph.period': '2025.03 ~ 2025.06',
    'about.timeline.grow_graph.body':
      '진로 성장 그래프 시각화 서비스의 풀스택 개발 및 AI 데이터 처리 연동을 수행했습니다.',
    'about.timeline.digital_legacy.title': '교내 해커톤 – 디지털 유산 및 데이터 상속 관리',
    'about.timeline.digital_legacy.period': '2024.10',
    'about.timeline.digital_legacy.body':
      '사후 디지털 자산과 데이터를 체계적으로 관리하고 상속하는 서비스의 프로토타입을 기획하고 개발했습니다.',
    'about.timeline.tech_blog_archive.title': '기술 블로그 및 지식 아카이브 운영',
    'about.timeline.tech_blog_archive.period': '2025.06 ~ 현재',
    'about.timeline.tech_blog_archive.body':
      '트러블슈팅을 기록하는 블로그(Hun-Bot.dev)와 전공 지식을 구조화하는 Docusaurus 기반 아카이브를 운영 중입니다.',
    'about.features.title': 'Personal Links',
    'about.features.note.title': 'Study Log',
    'about.features.note.description':
      '학교 전공 과목과 개인적인 학습 기록을 정리하고 있는 지식 저장소입니다.',
    'about.features.github.title': 'Portfolio',
    'about.features.github.description':
      'Three.js로 구현한 인터렉티브한 웹 페이지입니다.',
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
    'about.description': 'AI Product Engineerを目指すナム・ジョンフンの紹介ページです。',
    'about.greeting': 'こんにちは。\nAI Product Engineerを目指しているナム・ジョンフンです。',
    'about.intro':
      '私たちの生活にAIが入り込む隙間は多いですが、それが必ずしも効率的であるとは限らないと考えています。\n' +
      '単に製品を作るのではなく、「誰かにとって本当に必要な製品」を作るために日々勉強しています。',

    'about.stats.role': '現在の役割',
    'about.stats.role.value': '学生',
    'about.stats.location': '拠点',
    'about.stats.location.value': 'ソウル・韓国',
    'about.stats.focus': '注力分野',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web',
    'about.stats.languages': '対応言語',
    'about.stats.languages.value': '韓国語(母国語)\n' + '日本語(日常会話)\n' + '英語(日常会話)',

    'about.connect': 'つながる',
    'about.education': '学歴',
    'about.university': '成均館大学校 (Sungkyunkwan University)',
    'about.major': 'コンピュータ教育学科 / 知能情報融合専攻（自己設計複合専攻）',
    'about.status': '在学中',
    'about.university-desc':
      '成均館大学でコンピュータ教育と知能情報融合工学を学び、卒業を控えています。興味の赴くままに多様な分野へ挑戦する中で、実際に動くAIサービスを作り、システムを組み上げるエンジニアリングが最も自分に合っていると確信しました。現在はその開発に集中しています。',
    'about.academics.title': '履修した科目',
    'about.academics.subtitle': '学部生 — 成均館大学 コンピュータ教育学科・認知科学',
    'about.academics.self.title': '自主学習',
    'about.academics.self.courses':
      'Linear Algebra · Calculus · Rust · Go · Three.js' +
      '· Kafka · MLOps · RAG Pipeline · WebGPU · Terraform',
    'about.academics.self.focus.current.label': 'CURRENT',
    'about.academics.self.focus.current.value': '機械翻訳(MT)パイプライン研究 · 効率的なAIプロダクト設計',
    'about.academics.self.focus.past.label': 'PAST',
    'about.academics.self.focus.past.value': '自動運転(ROS2) · ディスプレイ工程実習 · 認知科学',
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

    'about.frontend': 'Frontend & 3D Web',
    'about.frontend-desc':
      'ユーザーと製品が最初に出会う「Web」において、3D技術がもたらす没入感に注目し、Three.jsを勉強しています。ReactとTypeScriptを武器に、情報をより直感的に伝えるインタラクティブなUIを研究しています。',

    'about.backend': 'Backend & Systems',
    'about.backend-desc':
      'GoとRustを主力言語として活用しています。単にAPIを実装するだけでなく、システム性能やアーキテクチャに関心を持ち、最近はKafkaを使ったデータパイプラインやTerraformによるインフラ構築にも取り組んでいます。',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      '複雑なAI技術をプロダクトとして精製する過程に集中しています。LLMオーケストレーションとコンピュータビジョン技術を適材適所に配置し、技術デモを超えて「実際に運用可能な機能」を実装することを目指しています。',

    'about.hci': 'UX & Practical Design',
    'about.hci-desc':
      'どれほど優れたバックエンドやAI技術でも、使いにくければ価値は半減すると考えています。大げさなデザイン理論よりも、実際のユーザー体験を観察し、機能とUIの最適なバランスを探ることを重視しています。',

  // メインタイムライン: 活動の軌跡
  'about.timeline.title': '活動タイムライン',
  'about.timeline.order':
    'ai_rookies,ai_products_plan,autonomous_award,bareun_vscode,campus_task_planner,ict_next_frontier,jetema_renewal,scamverse,grow_graph,digital_legacy,tech_blog_archive',
  'about.timeline.trajectory.subtitle': '基盤構築からプロダクト化まで、2024-2026の成長軌跡',
  'about.timeline.filter.all': 'すべて',
  'about.timeline.filter.project': 'プロジェクト',
  'about.timeline.filter.award': '受賞',
  'about.timeline.filter.study': '学習',
  'about.timeline.filter.community': 'コミュニティ',
  'about.timeline.year.2026.summary': 'プロダクト化と実運用の強化',
  'about.timeline.year.2025.summary': '検証と実装経験の拡張',
  'about.timeline.year.2024.summary': '転換点の確立と基盤構築',
  'about.timeline.type.project': 'プロジェクト',
  'about.timeline.type.award': '受賞',
  'about.timeline.type.study': '学習',
  'about.timeline.type.community': 'コミュニティ',
  'about.timeline.meta.goal': '目標',
  'about.timeline.meta.impact': '成果',
  'about.timeline.year.toggle.more': '年を展開',
  'about.timeline.year.toggle.less': '年を折りたたむ',
  'about.timeline.toggle.more': '詳しく見る',
  'about.timeline.toggle.less': '閉じる',

  'about.timeline.ai_rookies.title': 'AI Rookiesプログラム参加',
  'about.timeline.ai_rookies.period': '2026.05 ~ 現在',
  'about.timeline.ai_rookies.body':
    'AI Rookiesメンバーに選抜され、AIモデルの実務プロジェクトに参加しながら、エンジニアリングパイプラインの高度化と最適化に注力しています。',

  'about.timeline.ai_products_plan.title': 'AIプロダクト4種の設計・開発計画',
  'about.timeline.ai_products_plan.period': '2026.01 ~ 現在',
  'about.timeline.ai_products_plan.body':
    '株式分析、オンプレミス学習プラットフォーム、JLPT敬語会話、モバイル付加サービス検知など、4つのサービスを自ら設計・構築しています。',

  'about.timeline.autonomous_award.title': '自動運転コンテスト 奨励賞受賞',
  'about.timeline.autonomous_award.period': '2026.01',
  'about.timeline.autonomous_award.body':
    'ROS2とYOLOv8を活用した自動運転システムを実装。限られたハードウェア資源の中でモデル最適化のプロセスを経験しました。',

  'about.timeline.bareun_vscode.title': 'Bareun AIベース VSCode拡張機能の開発・公開',
  'about.timeline.bareun_vscode.period': '2025.11 ~ 2025.12',
  'about.timeline.bareun_vscode.body':
    '韓国語文法チェックの自動化を目的に、VSCode拡張機能を自ら開発しマーケットプレイスに公開しました。 [30+ ダウンロード]',

  'about.timeline.campus_task_planner.title': '学内ハッカソン – AI Task Plannerバックエンド構築',
  'about.timeline.campus_task_planner.period': '2025.10',
  'about.timeline.campus_task_planner.body':
    'AIベースのスケジュール管理サービス向けに、バックエンドアーキテクチャ設計とAPIサーバー実装を担当しました。',

  'about.timeline.ict_next_frontier.title': 'ICT Next Frontier 江原 – 最優秀賞',
  'about.timeline.ict_next_frontier.period': '2025.09',
  'about.timeline.ict_next_frontier.body':
    'AIベースの災害救援物流最適化システムを提案し、ICT Next Frontier 江原大会で最優秀賞を受賞しました。',

  'about.timeline.jetema_renewal.title': 'Jetemaホームページリニューアルハッカソン 優秀賞',
  'about.timeline.jetema_renewal.period': '2025.08',
  'about.timeline.jetema_renewal.body':
    'ユーザー体験改善を目的に、Webフロントエンドのリニューアルを企画・実装し、優秀賞を受賞しました。',

  'about.timeline.scamverse.title': 'ScamVerse – 詐欺防止メタバース企画',
  'about.timeline.scamverse.period': '2025.07',
  'about.timeline.scamverse.body':
    '多様な詐欺手法を体系的に仮想体験できるサービスのコンセプトとシナリオを設計し、被害予防につなげる企画を行いました。',

  'about.timeline.grow_graph.title': 'Grow Graph – データ構造可視化プロジェクト',
  'about.timeline.grow_graph.period': '2025.03 ~ 2025.06',
  'about.timeline.grow_graph.body':
    '進路成長グラフ可視化サービスのフルスタック開発を行い、AIデータ処理連携まで実装しました。',

  'about.timeline.digital_legacy.title': '学内ハッカソン – デジタル遺産とデータ継承管理',
  'about.timeline.digital_legacy.period': '2024.10',
  'about.timeline.digital_legacy.body':
    '死後のデジタル資産とデータを体系的に管理・継承するサービスのプロトタイプを企画・開発しました。',
  'about.timeline.tech_blog_archive.title': '技術ブログおよび知識アーカイブ運営',
  'about.timeline.tech_blog_archive.period': '2025.06 ~ 現在',
  'about.timeline.tech_blog_archive.body':
    'トラブルシューティングを記録するブログ（Hun-Bot.dev）と、専攻知識を構造化するDocusaurusベースのアーカイブを運営しています。',

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
    'about.description': 'This is the profile page of Jeonghun Nam, an aspiring AI Product Engineer.',
    'about.greeting': "Hi, I'm Jeonghun Nam, aspiring to be an AI Product Engineer.",
    'about.intro':
      "While AI is permeating many parts of our lives, I don't think its efficiency is always guaranteed.\n" +
      'Instead of just producing products, I am studying to build products that someone truly needs.',

    'about.stats.role': 'Current Role',
    'about.stats.role.value': 'Student',
    'about.stats.location': 'Based in',
    'about.stats.location.value': 'Seoul, South Korea',
    'about.stats.focus': 'Focus Areas',
    'about.stats.focus.value': 'MLOps, LLM, 3D Web',
    'about.stats.languages': 'Languages',
    'about.stats.languages.value': 'Korean (Native)\n' + 'Japanese (Conversational)\n' + 'English (Conversational)',

    'about.connect': 'Connect with me',
    'about.education': 'Education',
    'about.university': 'Sungkyunkwan University (SKKU)',
    'about.major': 'Computer Education / Cognitive Science (Interdisciplinary Major)',
    'about.status': 'Enrolled',
    'about.university-desc':
      'I am studying Computer Education and Intelligent Information Convergence Engineering at SKKU and am nearing graduation. While exploring multiple fields, I realized that building real AI services and integrating systems is where I fit best. I am now fully focused on engineering and product development.',
    'about.academics.title': 'Courses I Have Taken',
    'about.academics.subtitle': 'Undergraduate — SKKU Computer Education & Cognitive Science',
    'about.academics.self.title': 'Independent Study',
    'about.academics.self.courses':
      'Linear Algebra · Calculus · Rust · Go · Three.js' +
      '· Kafka · MLOps · RAG Pipeline · WebGPU · Terraform',
    'about.academics.self.focus.current.label': 'Current',
    'about.academics.self.focus.current.value': 'Go · Rust · Kafka · MLOps',
    'about.academics.self.focus.past.label': 'Past',
    'about.academics.self.focus.past.value': 'Linear Algebra · Calculus · Three.js · Terraform',
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

    'about.frontend': 'Frontend & 3D Web',
    'about.frontend-desc':
      'Focusing on the immersive experiences 3D technology brings to the web, I am studying Three.js. Using React and TypeScript, I research interactive interfaces that deliver information more intuitively.',

    'about.backend': 'Backend & Systems',
    'about.backend-desc':
      'I primarily use Go and Rust. Beyond implementing APIs, I focus on system performance and architecture, and recently expanded into Kafka-based data pipelines and infrastructure setup with Terraform.',

    'about.ai': 'AI Product Engineering',
    'about.ai-desc':
      'I focus on the process of refining complex AI technologies into usable products. By placing LLM orchestration and computer vision in the right places, I aim to implement production-ready features beyond tech demos.',

    'about.hci': 'UX & Practical Design',
    'about.hci-desc':
      'No matter how strong the backend or AI is, it has limited value if users find it hard to use. Rather than pushing grand design theories, I focus on observing real user experiences and finding practical trade-offs between functionality and UI.',

    // Main Timeline: My Journey
  'about.timeline.title': 'Timeline',
  'about.timeline.order':
    'ai_rookies,ai_products_plan,autonomous_award,bareun_vscode,campus_task_planner,ict_next_frontier,jetema_renewal,scamverse,grow_graph,digital_legacy,tech_blog_archive',
  'about.timeline.trajectory.subtitle': 'Growth trajectory from 2024 to 2026, from foundation to productization',
  'about.timeline.filter.all': 'All',
  'about.timeline.filter.project': 'Project',
  'about.timeline.filter.award': 'Award',
  'about.timeline.filter.study': 'Study',
  'about.timeline.filter.community': 'Community',
  'about.timeline.year.2026.summary': 'Strengthening productization and production readiness',
  'about.timeline.year.2025.summary': 'Expanding validation and implementation experience',
  'about.timeline.year.2024.summary': 'Building foundations and defining a turning point',
  'about.timeline.type.project': 'Project',
  'about.timeline.type.award': 'Award',
  'about.timeline.type.study': 'Study',
  'about.timeline.type.community': 'Community',
  'about.timeline.meta.goal': 'Goal',
  'about.timeline.meta.impact': 'Impact',
  'about.timeline.year.toggle.more': 'Expand year',
  'about.timeline.year.toggle.less': 'Collapse year',
  'about.timeline.toggle.more': 'Read more',
  'about.timeline.toggle.less': 'Collapse',

  'about.timeline.ai_rookies.title': 'Participating in the AI Rookies Program',
  'about.timeline.ai_rookies.period': 'May 2026 ~ Present',
  'about.timeline.ai_rookies.body':
    'Selected as an AI Rookies member, I am working on practical AI model projects with a focus on upgrading and optimizing engineering pipelines.',

  'about.timeline.ai_products_plan.title': 'Planning and Building Four AI Products',
  'about.timeline.ai_products_plan.period': 'Jan 2026 ~ Present',
  'about.timeline.ai_products_plan.body':
    'I am directly designing and building four services, including stock analysis, an on-premise learning platform, JLPT honorific conversation support, and mobile value-added service detection.',

  'about.timeline.autonomous_award.title': 'Autonomous Driving Competition – Encouragement Award',
  'about.timeline.autonomous_award.period': 'Jan 2026',
  'about.timeline.autonomous_award.body':
    'Implemented an autonomous driving system using ROS2 and YOLOv8, and gained hands-on experience optimizing models under constrained hardware resources.',

  'about.timeline.bareun_vscode.title': 'Built and Published a Bareun AI-Based VSCode Extension',
  'about.timeline.bareun_vscode.period': 'Nov 2025 ~ Dec 2025',
  'about.timeline.bareun_vscode.body':
    'Developed and published a VSCode extension for automated Korean grammar review on the Marketplace. [30+ downloads]',

  'about.timeline.campus_task_planner.title': 'Campus Hackathon – AI Task Planner Backend',
  'about.timeline.campus_task_planner.period': 'Oct 2025',
  'about.timeline.campus_task_planner.body':
    'Designed backend architecture and implemented APIs for an AI-based scheduling service.',

  'about.timeline.ict_next_frontier.title': 'ICT Next Frontier Gangwon – Grand Prize',
  'about.timeline.ict_next_frontier.period': 'Sep 2025',
  'about.timeline.ict_next_frontier.body':
    'Proposed an AI-based disaster-relief logistics optimization system and won the Grand Prize at ICT Next Frontier Gangwon.',

  'about.timeline.jetema_renewal.title': 'Jetema Website Renewal Hackathon – Excellence Award',
  'about.timeline.jetema_renewal.period': 'Aug 2025',
  'about.timeline.jetema_renewal.body':
    'Planned and implemented a web frontend renewal focused on improving user experience and received the Excellence Award.',

  'about.timeline.scamverse.title': 'ScamVerse – Anti-Scam Metaverse Concept',
  'about.timeline.scamverse.period': 'Jul 2025',
  'about.timeline.scamverse.body':
    'Designed a concept and scenario for a service that helps prevent fraud by systematically simulating common scam tactics in a virtual environment.',

  'about.timeline.grow_graph.title': 'Grow Graph – Data Structure Visualization Project',
  'about.timeline.grow_graph.period': 'Mar 2025 ~ Jun 2025',
  'about.timeline.grow_graph.body':
    'Built a full-stack career growth graph visualization service and integrated AI-based data processing.',

  'about.timeline.digital_legacy.title': 'Campus Hackathon – Digital Legacy and Data Inheritance Management',
  'about.timeline.digital_legacy.period': 'Oct 2024',
  'about.timeline.digital_legacy.body':
    'Planned and developed a prototype service to systematically manage and transfer post-mortem digital assets and data.',
  'about.timeline.tech_blog_archive.title': 'Operating a Tech Blog and Knowledge Archive',
  'about.timeline.tech_blog_archive.period': 'Jun 2025 ~ Present',
  'about.timeline.tech_blog_archive.body':
    'Running a troubleshooting-focused blog (Hun-Bot.dev) and a Docusaurus-based archive that structures major-related knowledge.',

  'about.features.title': 'Personal Links',
  'about.features.note.title': 'Study Log',
  'about.features.note.description': 'A structured knowledge repository of academic subjects and self-study notes.',
  'about.features.github.title': 'Portfolio',
  'about.features.github.description': 'An interactive web page implemented with Three.js.',
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
