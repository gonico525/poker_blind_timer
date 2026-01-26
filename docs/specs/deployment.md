# デプロイメント手順

## 1. 概要

本ドキュメントでは、ポーカーブラインドタイマーのビルド設定、デプロイメント手順、ホスティングオプションについて説明します。

## 2. 開発環境セットアップ

### 2.1 前提条件

- **Node.js**: v18.x 以上
- **npm**: v9.x 以上（またはyarn, pnpm）
- **Git**: v2.x 以上

### 2.2 初回セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-org/poker-blind-timer.git
cd poker-blind-timer

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

開発サーバーが起動したら、ブラウザで `http://localhost:5173` にアクセスします。

### 2.3 package.json スクリプト

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  }
}
```

## 3. ビルド設定

### 3.1 Vite設定

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境ではconsole.logを削除
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーコードを分割
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
```

### 3.2 TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.3 環境変数

```bash
# .env.development
VITE_APP_TITLE=ポーカーブラインドタイマー
VITE_APP_VERSION=1.0.0

# .env.production
VITE_APP_TITLE=ポーカーブラインドタイマー
VITE_APP_VERSION=1.0.0
```

使用例：

```typescript
const appTitle = import.meta.env.VITE_APP_TITLE;
const version = import.meta.env.VITE_APP_VERSION;
```

## 4. ビルドプロセス

### 4.1 本番ビルド

```bash
# TypeScriptの型チェック + ビルド
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### 4.2 ビルド出力

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # メインJavaScript
│   ├── index-[hash].css     # メインCSS
│   └── react-vendor-[hash].js
└── sounds/
    ├── level-change.mp3
    └── warning-1min.mp3
```

### 4.3 ビルド最適化

#### コード分割

```typescript
// 遅延ロード例
import { lazy, Suspense } from 'react';

const SettingsView = lazy(() => import('./ui/views/SettingsView'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsView />
    </Suspense>
  );
}
```

#### Tree Shaking

Viteは自動的にTree Shakingを行います。未使用のコードは自動削除されます。

#### 画像最適化

音声ファイルは既に最適化されていることを前提とします（128kbps MP3）。

## 5. ホスティングオプション

### 5.1 GitHub Pages

#### 設定手順

1. **リポジトリ設定**

```typescript
// vite.config.ts に base を追加
export default defineConfig({
  base: '/poker-blind-timer/', // リポジトリ名
  // ...
});
```

2. **デプロイスクリプト**

```json
// package.json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.0.0"
  }
}
```

3. **デプロイ実行**

```bash
npm install -D gh-pages
npm run deploy
```

4. **GitHub設定**

- リポジトリ設定 → Pages → Source: `gh-pages` ブランチ

#### GitHub Actions（自動デプロイ）

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 5.2 Netlify

#### 設定手順

1. **netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

2. **デプロイ**

```bash
# Netlify CLIを使用
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

または、GitHubリポジトリと連携して自動デプロイ。

### 5.3 Vercel

#### 設定手順

1. **vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

2. **デプロイ**

```bash
# Vercel CLIを使用
npm install -g vercel
vercel login
vercel --prod
```

または、GitHubリポジトリと連携して自動デプロイ。

### 5.4 ホスティング比較

| サービス | 無料プラン | カスタムドメイン | 自動デプロイ | 推奨度 |
|---------|----------|----------------|------------|-------|
| **GitHub Pages** | ✓ | ✓ | ✓（Actions） | ⭐⭐⭐⭐⭐ |
| **Netlify** | ✓ | ✓ | ✓ | ⭐⭐⭐⭐⭐ |
| **Vercel** | ✓ | ✓ | ✓ | ⭐⭐⭐⭐⭐ |
| **Firebase Hosting** | ✓ | ✓ | ✓ | ⭐⭐⭐⭐ |

**推奨**: GitHub Pages（シンプル、無料、GitHub統合）

## 6. PWA対応（オプション）

### 6.1 Service Worker

Progressive Web Appとして動作させる場合：

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ポーカーブラインドタイマー',
        short_name: 'Poker Timer',
        description: 'ノーリミットホールデムトーナメント用ブラインドタイマー',
        theme_color: '#1e6f3e',
        background_color: '#0f1419',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

## 7. CI/CD パイプライン

### 7.1 完全なCI/CDワークフロー

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      - uses: actions/upload-pages-artifact@v2
        with:
          path: dist/
      - uses: actions/deploy-pages@v2
```

## 8. ローカルプレビュー

### 8.1 ビルド後のプレビュー

```bash
# ビルド
npm run build

# プレビューサーバー起動
npm run preview
```

ブラウザで `http://localhost:4173` にアクセスします。

### 8.2 本番環境シミュレーション

```bash
# 本番ビルド
npm run build

# HTTPサーバーで配信（serve使用）
npx serve -s dist -l 8080
```

## 9. パフォーマンス最適化

### 9.1 Lighthouse監査

```bash
# Chrome DevToolsのLighthouseタブで実行
# または
npx lighthouse http://localhost:4173 --view
```

**目標スコア**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### 9.2 バンドルサイズ分析

```bash
# vite-plugin-visualizerを使用
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

ビルド後、`stats.html` が開き、バンドルサイズの内訳が表示されます。

## 10. セキュリティ

### 10.1 依存関係の脆弱性チェック

```bash
# npm audit
npm audit

# 自動修正
npm audit fix

# 強制修正（破壊的変更の可能性）
npm audit fix --force
```

### 10.2 定期的な更新

```bash
# 古い依存関係のチェック
npx npm-check-updates

# 更新
npx npm-check-updates -u
npm install
```

### 10.3 セキュリティヘッダー（Netlify例）

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

## 11. ドメイン設定

### 11.1 カスタムドメイン（GitHub Pages）

1. ドメインのDNS設定で`CNAME`レコードを追加：

```
CNAME  poker-timer  your-username.github.io
```

2. GitHubリポジトリ設定 → Pages → Custom domain に入力

3. `public/CNAME` ファイルを作成：

```
poker-timer.yourdomain.com
```

### 11.2 HTTPS

- GitHub Pages: 自動的にHTTPS有効
- Netlify/Vercel: 自動的にLet's Encrypt証明書発行

## 12. モニタリング

### 12.1 エラー追跡（Sentry例）

```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD, // 本番環境のみ
});
```

### 12.2 アナリティクス（オプション）

プライバシーポリシーに基づき、必要に応じて追加：

- **Google Analytics 4**
- **Plausible**（プライバシー重視）
- **Umami**（セルフホスト可能）

## 13. トラブルシューティング

### 13.1 よくある問題

#### ビルドエラー

```bash
# node_modulesとキャッシュをクリア
rm -rf node_modules package-lock.json
npm install
```

#### 型エラー

```bash
# 型チェックのみ実行
npm run type-check
```

#### 音声ファイルが見つからない

- `public/sounds/` ディレクトリに音声ファイルが存在するか確認
- パスが正しいか確認（`/sounds/level-change.mp3`）

#### localStorageが動作しない

- ブラウザのプライベートモードでないか確認
- localStorageが有効か確認（`storageService.isAvailable()`）

## 14. デプロイチェックリスト

デプロイ前の確認事項：

- [ ] すべてのテストが通る（`npm run test`）
- [ ] Lintエラーがない（`npm run lint`）
- [ ] TypeScriptエラーがない（`npm run type-check`）
- [ ] ローカルでビルドが成功する（`npm run build`）
- [ ] ビルド後のプレビューで動作確認（`npm run preview`）
- [ ] 音声ファイルが含まれている
- [ ] 環境変数が正しく設定されている
- [ ] README.mdが最新
- [ ] CHANGELOG.mdを更新（バージョン管理している場合）

## 15. まとめ

デプロイメントの主要なポイント：

1. **ビルド**: Viteによる最適化されたビルド
2. **ホスティング**: GitHub Pages推奨（無料、シンプル）
3. **CI/CD**: GitHub Actionsで自動テスト・デプロイ
4. **最適化**: コード分割、Tree Shaking
5. **セキュリティ**: 依存関係の定期更新

---

## 関連ドキュメント

- [01-architecture.md](./01-architecture.md) - システムアーキテクチャ
- [testing.md](./testing.md) - テスト戦略

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI DevOps Engineer |
