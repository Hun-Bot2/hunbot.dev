---
title: 'Smart Korean Grammar Assistant: VSCode 韓国語文法チェッカー拡張の制作記'
description: 'Bareun AI API を活用した VSCode 韓国語文法チェッカー拡張の振り返りと技術共有'
pubDate: '2025-11-05'
heroImage: '/images/Bareun_Market.png'
tags: ['Devlog', 'VSCode Extension', 'NLP', 'Korean', 'Bareun AI']
category: 'devlog'
---

# Smart Korean Grammar Assistant: 開発回顧と技術共有
https://github.com/Hun-Bot2/smart-korean-grammar-assistant

## 開発モチベーション
普段執筆のたびに [바른 한글 검사기](https://nara-speller.co.kr/speller/) へ Alt+Tab で移動し、コピー＆ペーストするのが面倒だった。`vscode-hanspell` という拡張もあるが 3 年前で更新が止まっており、より良い解決策を探して Bareun AI のサービスに辿り着いた。韓国語認識の精度が高かったので、自分専用の拡張として作ってみることにした。

## Markdown ワークフロー
ブログ完成前は VSCode の Markdown (.md) で執筆しているため、今回の拡張は特定フォルダ内の `.md` のみを対象にし、無制限に API を叩かない設計にした。リアルタイムで韓国語のみを確実に検出することを狙い、Bareun へ「開発してもよいか？」とメールで問い合わせたのがスタートである。

![alt text](/images/email.png)

## 企業とのやり取り
翌日には代表から連絡をいただき、要件整理とミーティングを経て開発の方向性を詰めた。11/10 に打ち合わせを行い、欲しい機能や開発方式を確認したあと、既存コードをブラッシュアップしていった。

## コア技術とアーキテクチャ

### VSCode Extension API
主に以下の API を使用した。

- `vscode.languages.createDiagnosticCollection`: Bareun の応答やオフラインヒューリスティックを Diagnostic に変換して色付きの下線を引く。
- `vscode.languages.registerCodeActionsProvider`, `registerHoverProvider`: Quick Fix／Hover で提案やユーザー辞書情報を表示。
- `vscode.workspace.onDidChangeTextDocument`: Markdown 更新を 350ms デバウンスし、`TextDocument.version` を比較して古い応答を破棄。
- `vscode.commands.registerCommand`: `bkga.fixSelection`, `bkga.syncCustomDictionary`, `bkga.toggleEnabled` などのコマンドを公開。
- `vscode.window.createStatusBarItem`, `createWebviewPanel`: ステータスバーで解析状態を表示し、Webview でユーザー辞書パネルを提供。

Markdown かどうかを判定し、`.md` のみ 350ms 後に再解析するフィルター/デバウンスを以下のように実装した。

```ts
function shouldAnalyze(doc: vscode.TextDocument): boolean {
  if (doc.languageId !== 'markdown') return false;
  const includePaths = vscode.workspace.getConfiguration('bkga').get<string[]>('includePaths', ['**/*.md']);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
  if (!workspaceFolder) return false;
  const relativePath = vscode.workspace.asRelativePath(doc.uri, false);
  return includePaths.some((pattern) => {
    const glob = new vscode.RelativePattern(workspaceFolder, pattern);
    return vscode.languages.match({ pattern: glob, language: 'markdown' }, doc) > 0;
  });
}

let debounceTimer: NodeJS.Timeout | undefined;
vscode.workspace.onDidChangeTextDocument((event) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (!shouldAnalyze(event.document)) {
      diagnosticsManager.clearDiagnostics(event.document.uri);
      return;
    }
    diagnosticsManager.analyzeDocument(event.document);
  }, 350);
});
```

### プロジェクト構成
```
src/
├── extension.ts             # エントリポイント
├── bareunClient/            # API クライアントと Rate Limit 制御
├── diagnostics/             # 解析・Diff・デコレーション
├── commands/                # コマンド実装
└── webview/                 # ユーザー辞書 Webview
```

## Bareun API を使ったワークフロー
- Markdown の段落単位でリクエストを送り、Bareun から戻る `diff` と `suggestions` を Diagnostic へ変換。
- REST API が不通の際はローカルヒューリスティックで最低限のスペルチェックを行い、ユーザー辞書の単語は常に優先して除外。
- API 使用量を抑えるため、同一段落は SHA-256 ハッシュでキャッシュし、変更があった箇所のみ再解析。

## UI/UX の工夫
- ステータスバーではエラー数と API 状態を常時表示。
- Quick Fix は `Accept suggestion`/`Add to dictionary` を提供。
- Hover パネルは diff 原文 / 置換語 / ヒント / ユーザー辞書リンクを Markdown で描画し、CLI っぽい雰囲気を維持。

## 結果と今後

### 現状
11/15 時点ではまだ自分のみが使用中。外部ユーザーが使い始めたら別途レポートを書く予定。

### 計画
- **短期**: SecretStorage で API キーを安全に保存、`includePaths` をコマンドから編集できる UI 追加。
- **中期**: 段落単位の Promise Pool で並列リクエストを制御し、Webview 辞書パネルから直接編集できるようにする。
- **長期**: Grammarly 的なトーン/簡潔化の提案、wasm ベースの軽量ルールで API を使わない簡易チェックを検討。

## インストールと貢献

**インストール方法**
- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=hunbot.smart-korean-grammar-assistant)
- VSCode で `smart korean grammar` を検索してインストール。初回起動時に Bareun API キー入力を案内。
- VSIX の場合は `code --install-extension smart-korean-grammar-assistant-1.0.0.vsix`。

**コントリビュート**
- GitHub: https://github.com/Hun-Bot2/smart-korean-grammar-assistant
- `npm install && npm run compile`、VSCode で `F5` を押して Extension Development Host を開き、PR を送る。
- バグは Issues、アイデアは Discussions に分けて投稿してもらえると助かる。

## さいごに
初めて VSCode Marketplace に自作拡張を公開できたのは刺激的だった。「自分が不便だから作った」ものが、Bareun AI チームとのミーティングを経て形になったのも貴重な経験。協力いただいた Bareun AI チームに感謝しつつ、今後もフィードバックをもとに改善を続けていく。
