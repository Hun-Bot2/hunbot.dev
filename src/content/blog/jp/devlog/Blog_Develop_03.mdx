---
title: 'ブログ開発ログ 03'
description: 'ドメイン更新と、翻訳がない記事で発生した 404 エラー修正'
pubDate: '2025-11-15'
heroImage: '/images/giscus.png'
tags: ['Devlog', 'Bug Fix']
category: 'devlog'
---

## 発生していたパス問題
記事ページで他言語ボタンを押すと 404 ページに飛ぶケースがあった。該当言語の MD ファイルをまだ用意していないため発生しており、次のようにリファクタリングして解決した。

### 解決策: 存在しない言語は言語ピッカーに出さない
- `getStaticPaths` で同じ slug の別言語バージョンを `Map` に集計し、各ポストへ `availableLangs` 配列を props として渡すように変更。
- `BlogPost` レイアウトがこの配列を `FloatingLanguagePicker` に渡し、実際に存在する言語のみ表示するようロジックを修正した。

## hun-bot.dev ドメインを Cloudflare DNS で取得
- これまでは `.vercel.app` で提供していたが、Cloudflare Registrar で `hun-bot.dev` を取得し DNS を設定。
- `astro.config.mjs` の `site`、`src/consts.ts` の `SITE_URL`、`robots.txt` など、すべての固定 URL を `https://hun-bot.dev` 基準に統一してビルド成果物が新ドメインを指すようにした。

## SEO / Discovery の整備
ドメインを切り替えたタイミングで SEO パイプラインを全面的に見直した。

1. **BaseHead のリファクタ**
   - `hreflang` セット / canonical / Open Graph locale / JSON フィードリンク / Search Console 用メタを一括で計算するように整理。
   - `SupportedLanguage` 型とマッピングテーブルで `ko/jp/en` → `ko-KR/ja-JP/en-US` を安定的に出力。

2. **Sitemap / Robots の再構成**
   - `public/robots.txt` に `sitemap.xml` と `sitemap-index.xml` の両方を記載し、`Host` も新ドメインへ。
   - ビルド時に生成される `dist/sitemap-0.xml` が新 URL で埋まることを確認。

## Giscus コメントを追加
- `src/components/GiscusComments.astro` を作り、`BlogPost` レイアウトの末尾に配置。`.env` に Giscus の環境変数を入れれば GitHub Discussions スレッドが自動で紐づく。
- `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY_ID` などが空の場合は「コメント無効」の案内ボックスだけを表示するフォールバックを追加。

## TODO
- ライトテーマでコードブロックのコントラストが足りず読みにくい。v04 でスタイルを修正予定。
