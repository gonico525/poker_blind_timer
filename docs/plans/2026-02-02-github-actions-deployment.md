# GitHub Actions デプロイメント実装計画

**日付**: 2026-02-02
**起点**: 開発完了・公開準備
**対象ブランチ**: `claude/github-actions-deployment-LMXik`
**優先度**: 高（公開準備完了済み）

---

## 1. 目的と背景

Poker Blind Timer は開発が完了し、公開可能な状態となった。本計画では GitHub Actions を使用した自動デプロイメントパイプラインを構築し、GitHub Pages でアプリケーションを公開する。

### 1.1 現状分析

| 項目 | 現状 | 評価 |
|------|------|------|
| CI ワークフロー | `ci.yml` で lint/test/build を実行 | ✅ 完備 |
| デプロイワークフロー | 未作成 | ❌ 要作成 |
| ビルド設定 | `npm run build` で `dist/` 出力 | ✅ 完備 |
| base パス設定 | `vite.config.ts` に未設定 | ❌ 要設定 |
| テストカバレッジ | Codecov 連携済み | ✅ 完備 |

### 1.2 技術選定: GitHub Pages

本プロジェクトの特性から GitHub Pages を選定する。

**選定理由:**
- クライアントサイドのみの静的 SPA（バックエンド不要）
- 無料で HTTPS 対応
- GitHub リポジトリとの統合が容易
- カスタムドメイン対応可能
- GitHub Actions との親和性が高い

**代替案の検討:**
| ホスティング | メリット | デメリット | 採用 |
|--------------|----------|------------|------|
| GitHub Pages | 無料、GitHub 統合、シンプル | 1リポジトリ1サイト制限 | ✅ |
| Netlify | 高機能、プレビューデプロイ | 外部サービス依存 | - |
| Vercel | 高速、エッジ配信 | 外部サービス依存 | - |
| Cloudflare Pages | 高速、無制限帯域 | 設定が複雑 | - |

---

## 2. 影響範囲

### 2.1 変更対象ファイル

| ファイル | 変更種類 | 内容 |
|----------|---------|------|
| `vite.config.ts` | 設定追加 | `base` パス設定を追加 |
| `.github/workflows/deploy.yml` | 新規作成 | デプロイワークフロー |
| `.nojekyll` | 新規作成 | Jekyll 処理の無効化 |
| `public/.nojekyll` | 新規作成 | ビルド出力への `.nojekyll` 含有 |

### 2.2 変更不要なファイル

- `ci.yml`: 既存の CI ワークフローは変更不要（独立して動作）
- `package.json`: ビルドスクリプトは既に適切
- `index.html`: base 設定で自動的にパスが調整される

---

## 3. 実装ステップ

### Step 1. vite.config.ts の設定更新

**ファイル**: `vite.config.ts`

GitHub Pages はリポジトリ名のサブパス（`https://<username>.github.io/<repository>/`）でホストされるため、`base` オプションを設定する必要がある。

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/poker_blind_timer/',  // ← 追加
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // ... 既存のテスト設定
  },
});
```

**注意点:**
- リポジトリ名は `poker_blind_timer` であることを確認
- 末尾のスラッシュは必須
- ローカル開発（`npm run dev`）には影響しない

### Step 2. .nojekyll ファイルの作成

**ファイル**: `public/.nojekyll`

GitHub Pages はデフォルトで Jekyll 処理を行うが、Vite の出力にはアンダースコアで始まるディレクトリ（`_assets` 等）が含まれる可能性があり、Jekyll はこれらを無視する。`.nojekyll` ファイルを配置して Jekyll 処理を無効化する。

```bash
# 空ファイルを作成
touch public/.nojekyll
```

`public/` ディレクトリに配置することで、ビルド時に自動的に `dist/` にコピーされる。

### Step 3. デプロイワークフローの作成

**ファイル**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:  # 手動実行を許可

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**ワークフローの特徴:**

| 項目 | 設定 | 理由 |
|------|------|------|
| トリガー | `main` ブランチへの push | 本番環境へのデプロイは main マージ時のみ |
| `workflow_dispatch` | 有効 | 手動でのデプロイを可能に |
| `concurrency` | 設定済み | 同時デプロイを防止 |
| テスト実行 | ビルド前に実行 | テスト失敗時はデプロイしない |
| Node.js バージョン | 20.x | LTS 版を使用 |

### Step 4. GitHub リポジトリ設定

GitHub Pages を有効化するために、リポジトリ設定を変更する必要がある。

1. リポジトリの **Settings** タブを開く
2. 左メニューから **Pages** を選択
3. **Source** で **GitHub Actions** を選択

> **注意**: この設定は GitHub Web UI から手動で行う必要がある。

---

## 4. デプロイフロー図

```
[開発者]
    │
    ├── feature ブランチで開発
    │
    ├── PR 作成 → CI ワークフロー実行（lint/test/build）
    │                    │
    │                    ├── 失敗 → マージ不可
    │                    │
    │                    └── 成功 → レビュー → マージ
    │
    └── main ブランチにマージ
                │
                └── デプロイワークフロー実行
                            │
                            ├── テスト実行
                            │       │
                            │       ├── 失敗 → デプロイ中止
                            │       │
                            │       └── 成功
                            │
                            ├── ビルド実行
                            │
                            ├── GitHub Pages にデプロイ
                            │
                            └── https://gonico525.github.io/poker_blind_timer/ で公開
```

---

## 5. 検証方法

### 5.1 ローカル検証

1. **ビルドの確認**
   ```bash
   npm run build
   ls -la dist/
   # .nojekyll ファイルが含まれていることを確認
   ```

2. **プレビューサーバーでの動作確認**
   ```bash
   npm run preview
   # http://localhost:4173/poker_blind_timer/ でアクセス
   ```

3. **base パスの確認**
   - アセット（CSS、JS、画像）が正しく読み込まれること
   - ルーティング（もしあれば）が正しく動作すること

### 5.2 デプロイ後の検証

1. **URL アクセス確認**
   - `https://gonico525.github.io/poker_blind_timer/` にアクセス
   - アプリケーションが正常に表示されること

2. **機能テスト**
   - タイマーの開始/停止
   - ブラインドレベルの変更
   - ストラクチャーの保存/読み込み（localStorage）
   - 音声通知

3. **パフォーマンス確認**
   - Lighthouse でのスコア測定
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

---

## 6. ロールバック手順

デプロイ後に問題が発生した場合のロールバック手順。

### 6.1 GitHub Actions からのロールバック

1. **Actions** タブを開く
2. **Deploy to GitHub Pages** ワークフローを選択
3. 問題のないコミットの実行を見つける
4. **Re-run all jobs** をクリック

### 6.2 git revert によるロールバック

```bash
# 問題のあるコミットを特定
git log --oneline

# revert コミットを作成
git revert <commit-hash>

# main にプッシュ
git push origin main
# → 自動的にデプロイワークフローが実行される
```

---

## 7. セキュリティ考慮事項

| 考慮点 | 対策 | 状態 |
|--------|------|------|
| シークレットの露出 | 環境変数を使用していない（不要） | ✅ 対策不要 |
| HTTPS | GitHub Pages で自動対応 | ✅ 自動 |
| CSP | 現時点では設定なし | ⏳ 将来検討 |
| 依存関係の脆弱性 | Dependabot で自動アラート | ✅ 設定済み |

---

## 8. 将来の拡張

### 8.1 短期（オプション）

- [ ] カスタムドメインの設定
- [ ] PWA 対応（Service Worker）
- [ ] Lighthouse CI の導入

### 8.2 長期（将来検討）

- [ ] プレビュー環境（PR ごとのデプロイ）
- [ ] E2E テストの CI 統合
- [ ] パフォーマンスモニタリング

---

## 9. 実装チェックリスト

- [ ] `vite.config.ts` に `base` 設定を追加
- [ ] `public/.nojekyll` ファイルを作成
- [ ] `.github/workflows/deploy.yml` を作成
- [ ] ローカルでビルド・プレビュー確認
- [ ] GitHub リポジトリの Pages 設定を変更
- [ ] main ブランチにマージしてデプロイ確認
- [ ] 本番 URL での動作確認

---

## 10. 参考リンク

- [Vite - Deploying a Static Site](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)
- [actions/configure-pages](https://github.com/actions/configure-pages)
