# PWA（Progressive Web App）実装計画

**日付**: 2026-02-02
**前提**: GitHub Pages デプロイ完了後に実施
**対象ブランチ**: 別途作成（`feature/pwa-support` 等）
**優先度**: 中（デプロイ後の機能拡張）

---

## 1. 目的と背景

### 1.1 目的

Poker Blind Timer を PWA 化し、以下の機能を追加する：

- **オフライン動作**: ネットワーク接続なしでも完全に動作
- **インストール可能**: ホーム画面に追加してネイティブアプリのように起動
- **フルスクリーン表示**: ブラウザ UI なしでタイマーを大きく表示

### 1.2 背景

ポーカートーナメントでの利用シーンを考慮すると、PWA 化には以下の実用的価値がある：

| シーン | PWA の価値 |
|--------|-----------|
| 会場の Wi-Fi が不安定 | オフラインでも動作継続 |
| タブレットで全員に見せる | フルスクリーンで大きく表示 |
| トーナメント中の再起動 | ホーム画面から即座に起動 |
| 音声通知 | キャッシュ済みで確実に再生 |

### 1.3 現状との適合性

本アプリは既に PWA 化に適した設計になっている：

- ✅ クライアントサイドのみ（バックエンド不要）
- ✅ localStorage でデータ永続化済み
- ✅ 静的アセット（HTML/CSS/JS/音声）のみ
- ✅ 外部 API 呼び出しなし

---

## 2. 技術選定

### 2.1 vite-plugin-pwa

**選定**: `vite-plugin-pwa`（Vite 公式推奨）

| 項目 | 内容 |
|------|------|
| パッケージ | `vite-plugin-pwa` |
| Service Worker | Workbox ベース（自動生成） |
| Manifest | 設定から自動生成 |
| 更新戦略 | Prompt for update（推奨） |

**選定理由**:
- Vite との統合がシームレス
- 設定のみで Service Worker を自動生成
- Workbox による堅牢なキャッシュ戦略
- TypeScript サポート

### 2.2 代替案

| ライブラリ | メリット | デメリット | 採用 |
|------------|----------|------------|------|
| vite-plugin-pwa | 自動生成、簡単 | カスタマイズに制限 | ✅ |
| 手動実装 | 完全制御 | 実装コスト高 | - |
| Workbox CLI | 柔軟 | ビルドプロセス複雑化 | - |

---

## 3. 影響範囲

### 3.1 変更対象ファイル

| ファイル | 変更種類 | 内容 |
|----------|----------|------|
| `package.json` | 依存追加 | `vite-plugin-pwa` を追加 |
| `vite.config.ts` | 設定追加 | PWA プラグイン設定 |
| `public/icons/` | 新規作成 | PWA アイコン画像 |
| `src/main.tsx` | 修正 | Service Worker 登録（オプション） |
| `src/components/common/UpdatePrompt/` | 新規作成 | 更新通知 UI |

### 3.2 変更不要なファイル

- 既存コンポーネント: 変更不要
- localStorage 関連: 変更不要
- 音声サービス: 変更不要（キャッシュで恩恵を受ける）

---

## 4. 実装ステップ

### Step 1. 依存パッケージのインストール

```bash
npm install -D vite-plugin-pwa
```

### Step 2. PWA アイコンの作成

`public/icons/` ディレクトリを作成し、以下のアイコンを配置：

| ファイル名 | サイズ | 用途 |
|-----------|--------|------|
| `icon-192x192.png` | 192x192 | Android ホーム画面 |
| `icon-512x512.png` | 512x512 | スプラッシュスクリーン |
| `icon-maskable-192x192.png` | 192x192 | Android マスカブルアイコン |
| `icon-maskable-512x512.png` | 512x512 | Android マスカブルアイコン |
| `apple-touch-icon.png` | 180x180 | iOS ホーム画面 |

**アイコンデザイン案**:
- ポーカーチップまたはタイマーをモチーフ
- 背景色: アプリのプライマリカラー
- シンプルで視認性の高いデザイン

### Step 3. vite.config.ts の設定

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'sounds/*.mp3',
      ],
      manifest: {
        name: 'Poker Blind Timer',
        short_name: 'Blind Timer',
        description: 'ポーカートーナメント用ブラインドタイマー',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        scope: '/poker_blind_timer/',
        start_url: '/poker_blind_timer/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/poker_blind_timer/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // ... 既存のテスト設定
});
```

### Step 4. index.html の更新

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1a1a2e" />
    <meta name="description" content="ポーカートーナメント用ブラインドタイマー" />
    <title>Poker Blind Timer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 5. 更新通知コンポーネントの作成（オプション）

**ファイル**: `src/components/common/UpdatePrompt/UpdatePrompt.tsx`

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => setNeedRefresh(false);

  if (!needRefresh) return null;

  return (
    <div className={styles.prompt}>
      <p>新しいバージョンが利用可能です</p>
      <div className={styles.buttons}>
        <button onClick={() => updateServiceWorker(true)}>
          更新する
        </button>
        <button onClick={close}>後で</button>
      </div>
    </div>
  );
};
```

### Step 6. App.tsx への統合

```typescript
import { UpdatePrompt } from '@/components/common/UpdatePrompt';

function App() {
  return (
    <>
      {/* 既存のコンポーネント */}
      <UpdatePrompt />
    </>
  );
}
```

### Step 7. TypeScript 型定義の追加

**ファイル**: `src/vite-env.d.ts`（既存ファイルに追記）

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

---

## 5. キャッシュ戦略

### 5.1 プリキャッシュ（ビルド時）

| アセット | キャッシュ |
|----------|-----------|
| HTML | ✅ |
| CSS | ✅ |
| JavaScript | ✅ |
| 音声ファイル（mp3） | ✅ |
| アイコン画像 | ✅ |

### 5.2 ランタイムキャッシュ

| リソース | 戦略 | 理由 |
|----------|------|------|
| Google Fonts | CacheFirst | 変更頻度が低い |
| 外部画像 | NetworkFirst | 最新版を優先 |

### 5.3 更新戦略

**選択**: `registerType: 'prompt'`

```
[ユーザーがアプリを開く]
        │
        ├── Service Worker が更新をチェック
        │
        ├── 更新あり → 「新しいバージョンが利用可能です」通知
        │                    │
        │                    ├── 「更新する」→ ページリロード
        │                    │
        │                    └── 「後で」→ 次回起動時に再通知
        │
        └── 更新なし → 通常動作
```

---

## 6. テスト計画

### 6.1 ローカルテスト

1. **ビルドと確認**
   ```bash
   npm run build
   npm run preview
   ```

2. **Manifest の確認**
   - Chrome DevTools → Application → Manifest
   - アイコン、名前、表示モードが正しいか

3. **Service Worker の確認**
   - Chrome DevTools → Application → Service Workers
   - 登録されているか、アクティブか

4. **オフラインテスト**
   - DevTools → Network → Offline にチェック
   - アプリが正常に動作するか
   - 音声が再生されるか

### 6.2 インストールテスト

1. **デスクトップ（Chrome）**
   - アドレスバーのインストールアイコンをクリック
   - スタンドアロンで起動するか

2. **モバイル（Android Chrome）**
   - 「ホーム画面に追加」
   - ホーム画面からの起動
   - フルスクリーン表示

3. **モバイル（iOS Safari）**
   - 「ホーム画面に追加」
   - スプラッシュスクリーン
   - スタンドアロン表示

### 6.3 更新テスト

1. アプリをインストール
2. コードを変更してデプロイ
3. アプリを再起動
4. 更新通知が表示されるか
5. 「更新する」で最新版に更新されるか

---

## 7. Lighthouse PWA チェックリスト

| 項目 | 要件 | 対応 |
|------|------|------|
| HTTPS | 必須 | GitHub Pages で自動対応 |
| Service Worker | 必須 | vite-plugin-pwa で自動生成 |
| Web App Manifest | 必須 | vite-plugin-pwa で自動生成 |
| Viewport meta | 必須 | 既に設定済み |
| アイコン (192px) | 必須 | 新規作成 |
| アイコン (512px) | 必須 | 新規作成 |
| Maskable アイコン | 推奨 | 新規作成 |
| theme-color | 推奨 | index.html に追加 |
| オフライン動作 | 推奨 | Service Worker で対応 |

---

## 8. 実装チェックリスト

- [ ] `vite-plugin-pwa` をインストール
- [ ] PWA アイコンを作成・配置
- [ ] `vite.config.ts` に PWA 設定を追加
- [ ] `index.html` にメタタグを追加
- [ ] `vite-env.d.ts` に型定義を追加
- [ ] 更新通知コンポーネントを作成（オプション）
- [ ] ローカルでビルド・動作確認
- [ ] Lighthouse で PWA スコアを確認
- [ ] オフライン動作をテスト
- [ ] モバイルでインストールテスト
- [ ] デプロイして本番環境で確認

---

## 9. 注意事項

### 9.1 Service Worker のスコープ

GitHub Pages のサブパス（`/poker_blind_timer/`）でホストするため、`scope` と `start_url` を正しく設定する必要がある。

### 9.2 キャッシュの無効化

開発中は Service Worker がキャッシュを返すため、変更が反映されない場合がある。

```
DevTools → Application → Service Workers → 「Update on reload」にチェック
```

### 9.3 iOS の制限

- iOS Safari では Web Push 通知が制限される（本アプリでは使用しないため影響なし）
- バックグラウンドでの音声再生に制限あり（ユーザー操作が必要）

### 9.4 既存機能への影響

- localStorage: 影響なし（Service Worker と独立）
- 音声再生: キャッシュにより高速化（改善）
- キーボードショートカット: 影響なし

---

## 10. スケジュール

| フェーズ | 内容 | 目安 |
|---------|------|------|
| Phase 1 | アイコン作成 | - |
| Phase 2 | vite-plugin-pwa 設定 | - |
| Phase 3 | ローカルテスト | - |
| Phase 4 | 更新通知 UI 作成（オプション） | - |
| Phase 5 | デプロイ・本番テスト | - |

---

## 11. 参考リンク

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/) - アイコン生成ツール
