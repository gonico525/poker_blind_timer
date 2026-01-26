# デザインシステム仕様

## 1. 概要

本ドキュメントでは、ポーカーブラインドタイマーのUI/UX詳細、デザインシステム、カラーパレット、タイポグラフィについて詳細に説明します。

## 2. デザインコンセプト

### 2.1 デザインテーマ

**コンセプト**: シンプルでポーカーらしいかっこいいデザイン

- **ポーカーテーブルの雰囲気**: ダークグリーン、ゴールドアクセント
- **視認性重視**: 大きく明瞭なタイポグラフィ
- **プロフェッショナル**: 洗練されたミニマルデザイン

### 2.2 デザイン原則

1. **Clarity（明瞭性）**: 情報は常に明確に表示
2. **Efficiency（効率性）**: 最小限の操作で目的を達成
3. **Consistency（一貫性）**: 統一されたビジュアルルール
4. **Accessibility（アクセシビリティ）**: 誰もが使いやすい

## 3. カラーシステム

### 3.1 カラーパレット - ダークモード

```css
:root[data-theme='dark'] {
  /* Primary Colors */
  --color-primary: #1e6f3e;          /* ポーカーグリーン */
  --color-primary-light: #2a9d54;
  --color-primary-dark: #154d2c;

  /* Accent Colors */
  --color-accent: #d4af37;           /* ゴールド */
  --color-accent-light: #f0c84a;
  --color-accent-dark: #b89430;

  /* Background Colors */
  --color-bg-primary: #0f1419;       /* メイン背景 */
  --color-bg-secondary: #1a1f26;     /* セカンダリ背景 */
  --color-bg-tertiary: #252d38;      /* カード背景 */
  --color-bg-hover: #2d3744;         /* ホバー背景 */

  /* Text Colors */
  --color-text-primary: #e8eaed;     /* メインテキスト */
  --color-text-secondary: #9aa0a6;   /* セカンダリテキスト */
  --color-text-tertiary: #6c757d;    /* 補助テキスト */
  --color-text-inverse: #0f1419;     /* 逆色テキスト */

  /* Border Colors */
  --color-border: #3c4451;
  --color-border-light: #4a5362;
  --color-border-focus: var(--color-accent);

  /* Semantic Colors */
  --color-success: #2ecc71;          /* 成功 */
  --color-warning: #f39c12;          /* 警告 */
  --color-error: #e74c3c;            /* エラー */
  --color-info: #3498db;             /* 情報 */

  /* Timer Specific */
  --color-timer-normal: #e8eaed;     /* 通常時 */
  --color-timer-warning: #f39c12;    /* 残り1分 */
  --color-timer-break: #3498db;      /* 休憩中 */
}
```

### 3.2 カラーパレット - ライトモード

```css
:root[data-theme='light'] {
  /* Primary Colors */
  --color-primary: #2a9d54;
  --color-primary-light: #3cb371;
  --color-primary-dark: #1e6f3e;

  /* Accent Colors */
  --color-accent: #d4af37;
  --color-accent-light: #f0c84a;
  --color-accent-dark: #b89430;

  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f7fa;
  --color-bg-tertiary: #e8ecf1;
  --color-bg-hover: #dde3eb;

  /* Text Colors */
  --color-text-primary: #1a1f26;
  --color-text-secondary: #4a5362;
  --color-text-tertiary: #6c757d;
  --color-text-inverse: #ffffff;

  /* Border Colors */
  --color-border: #d1d5db;
  --color-border-light: #e5e7eb;
  --color-border-focus: var(--color-accent);

  /* Semantic Colors */
  --color-success: #2ecc71;
  --color-warning: #f39c12;
  --color-error: #e74c3c;
  --color-info: #3498db;

  /* Timer Specific */
  --color-timer-normal: #1a1f26;
  --color-timer-warning: #f39c12;
  --color-timer-break: #3498db;
}
```

### 3.3 カラー使用ガイドライン

| 用途 | ダークモード | ライトモード |
|------|-------------|-------------|
| メイン背景 | `--color-bg-primary` | `--color-bg-primary` |
| カード背景 | `--color-bg-tertiary` | `--color-bg-tertiary` |
| ボタン（プライマリ） | `--color-primary` | `--color-primary` |
| ボタン（アクセント） | `--color-accent` | `--color-accent` |
| タイマー表示 | `--color-timer-normal` | `--color-timer-normal` |
| 警告表示 | `--color-timer-warning` | `--color-timer-warning` |

## 4. タイポグラフィ

### 4.1 フォントファミリー

```css
:root {
  /* メインフォント */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                      'Roboto', 'Helvetica Neue', Arial, sans-serif;

  /* タイマー用（等幅） */
  --font-family-mono: 'SF Mono', 'Roboto Mono', 'Courier New', monospace;

  /* 数字用（等幅、視認性重視） */
  --font-family-numeric: 'Roboto Mono', 'SF Mono', Consolas, monospace;
}
```

### 4.2 フォントサイズスケール

```css
:root {
  /* Display (超大サイズ) */
  --font-size-display-xl: 120px;     /* タイマー表示 */
  --font-size-display-lg: 96px;      /* 大タイマー */
  --font-size-display-md: 72px;      /* 中タイマー */

  /* Heading (見出し) */
  --font-size-h1: 48px;
  --font-size-h2: 36px;
  --font-size-h3: 28px;
  --font-size-h4: 24px;
  --font-size-h5: 20px;
  --font-size-h6: 18px;

  /* Body (本文) */
  --font-size-lg: 18px;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-xs: 12px;
}
```

### 4.3 フォントウェイト

```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

### 4.4 行間

```css
:root {
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  --line-height-loose: 2;
}
```

### 4.5 タイポグラフィ使用例

```css
/* タイマー表示（残り時間） */
.timer-display {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-display-xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-timer-normal);
}

/* ブラインド情報（SB/BB） */
.blind-info {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}

/* レベル番号 */
.level-number {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
}

/* 補助情報 */
.info-text {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}
```

## 5. スペーシングシステム

### 5.1 スペーシングスケール

```css
:root {
  --spacing-0: 0;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;
}
```

### 5.2 スペーシング使用ガイドライン

| 用途 | 値 |
|------|-----|
| コンポーネント内の小さな間隔 | `--spacing-2` (8px) |
| コンポーネント内の標準間隔 | `--spacing-4` (16px) |
| コンポーネント間の間隔 | `--spacing-6` (24px) |
| セクション間の間隔 | `--spacing-12` (48px) |
| ページレベルの大きな間隔 | `--spacing-20` (80px) |

## 6. レイアウト

### 6.1 ブレークポイント

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### 6.2 コンテナ幅

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-full: 100%;
}
```

### 6.3 最小解像度

プロジェクト要件：
- **最小解像度**: 1280x720px
- **推奨解像度**: 1920x1080px (フルHD)

## 7. コンポーネントスタイル

### 7.1 ボタン

#### プライマリボタン

```css
.button-primary {
  padding: var(--spacing-3) var(--spacing-6);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-primary:hover {
  background-color: var(--color-primary-light);
}

.button-primary:active {
  background-color: var(--color-primary-dark);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### アクセントボタン

```css
.button-accent {
  padding: var(--spacing-3) var(--spacing-6);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-inverse);
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-accent:hover {
  background-color: var(--color-accent-light);
}
```

#### セカンダリボタン

```css
.button-secondary {
  padding: var(--spacing-3) var(--spacing-6);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background-color: transparent;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}
```

### 7.2 入力フィールド

```css
.input {
  padding: var(--spacing-3) var(--spacing-4);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error);
}
```

### 7.3 カード

```css
.card {
  padding: var(--spacing-6);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.card-header {
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.card-body {
  color: var(--color-text-secondary);
}
```

### 7.4 モーダル

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
}

.modal {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  padding: var(--spacing-8);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.modal-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
```

## 8. アニメーション

### 8.1 トランジション時間

```css
:root {
  --transition-fast: 0.15s;
  --transition-base: 0.2s;
  --transition-slow: 0.3s;
  --transition-slower: 0.5s;
}
```

### 8.2 イージング

```css
:root {
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 8.3 アニメーション例

#### フェードイン

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn var(--transition-slow) var(--ease-out);
}
```

#### スライドアップ

```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp var(--transition-slow) var(--ease-out);
}
```

#### パルス（警告時）

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.pulse {
  animation: pulse 1s var(--ease-in-out) infinite;
}
```

### 8.4 アクセシビリティ対応

```css
/* アニメーション無効設定を尊重 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 9. シャドウ

### 9.1 シャドウスケール

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
                 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
               0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

## 10. ボーダーラディウス

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

## 11. Z-Index スケール

```css
:root {
  --z-index-base: 0;
  --z-index-dropdown: 100;
  --z-index-sticky: 200;
  --z-index-modal-backdrop: 900;
  --z-index-modal: 1000;
  --z-index-tooltip: 1100;
}
```

## 12. 画面別デザイン仕様

### 12.1 タイマー表示画面（メイン画面）

#### レイアウト構造

```
┌─────────────────────────────────────────────┐
│  [Header]                                   │
│  Level 1                      [Settings ⚙️]  │
├─────────────────────────────────────────────┤
│                                             │
│              [Timer Display]                │
│                   10:00                     │
│                                             │
│              [Blind Info]                   │
│            SB: 25  BB: 50                   │
│                                             │
│              [経過時間: 00:00]               │
│                                             │
├─────────────────────────────────────────────┤
│  [Next Level]                               │
│  Level 2: SB 50 / BB 100                    │
│                                             │
│  [休憩まで: 4レベル]                         │
├─────────────────────────────────────────────┤
│  [Control Buttons]                          │
│  [開始] [一時停止] [リセット]                │
│                                             │
│  [← 前へ] [次へ →]                          │
└─────────────────────────────────────────────┘
```

#### コンポーネント仕様

```css
/* タイマー表示 */
.timer-display {
  font-size: 120px;
  font-weight: 700;
  font-family: var(--font-family-mono);
  text-align: center;
  color: var(--color-timer-normal);
  margin: var(--spacing-12) 0;
}

.timer-display.warning {
  color: var(--color-timer-warning);
  animation: pulse 1s infinite;
}

.timer-display.break {
  color: var(--color-timer-break);
}

/* ブラインド情報 */
.blind-info {
  display: flex;
  justify-content: center;
  gap: var(--spacing-8);
  font-size: 48px;
  font-weight: 600;
  margin: var(--spacing-8) 0;
}

.blind-value {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.blind-label {
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2);
}

.blind-amount {
  font-family: var(--font-family-numeric);
  color: var(--color-accent);
}
```

### 12.2 設定画面

#### レイアウト

```
┌─────────────────────────────────────────────┐
│  [Header]                                   │
│  設定                            [閉じる ✕]  │
├─────────────────────────────────────────────┤
│                                             │
│  [タブ]                                     │
│  [ブラインド] [休憩] [音声] [テーマ]         │
│                                             │
│  [コンテンツエリア]                          │
│  - タブに応じた設定項目                      │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  [Footer]                                   │
│            [キャンセル] [保存]               │
└─────────────────────────────────────────────┘
```

### 12.3 フルスクリーンモード

```css
.fullscreen-layout {
  width: 100vw;
  height: 100vh;
  background-color: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.fullscreen-timer {
  font-size: clamp(80px, 15vw, 200px);
  font-weight: 800;
  font-family: var(--font-family-mono);
}

.fullscreen-blinds {
  font-size: clamp(40px, 8vw, 100px);
  font-weight: 700;
  margin-top: var(--spacing-12);
}
```

## 13. レスポンシブ対応

### 13.1 ブレークポイント別スタイル

```css
/* Base (1280px+) */
.timer-display {
  font-size: 120px;
}

/* Medium (768px - 1279px) - タブレット横 */
@media (max-width: 1279px) {
  .timer-display {
    font-size: 96px;
  }

  .blind-info {
    font-size: 36px;
  }
}

/* Small (< 768px) - タブレット縦（最小サポート外） */
@media (max-width: 767px) {
  .timer-display {
    font-size: 72px;
  }

  .blind-info {
    font-size: 28px;
    flex-direction: column;
  }
}
```

## 14. ダークモード/ライトモード切り替え

### 14.1 テーマ切り替えロジック

```typescript
// Theme切り替え関数
function setTheme(theme: Theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

### 14.2 システム設定の監視

```typescript
// システムのカラースキーム変更を監視
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (currentTheme === 'system') {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
```

## 15. アクセシビリティ

### 15.1 色のコントラスト比

- **大きなテキスト（18px以上、または14px太字以上）**: 最低 3:1
- **通常テキスト**: 最低 4.5:1
- **UI要素**: 最低 3:1

### 15.2 フォーカス表示

```css
/* キーボードフォーカス */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

button:focus-visible,
input:focus-visible {
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);
}
```

### 15.3 スクリーンリーダー対応

```tsx
// ARIAラベルの使用例
<button aria-label="タイマーを開始">
  <PlayIcon />
</button>

<div role="timer" aria-live="polite">
  {formatTime(remainingTime)}
</div>
```

## 16. まとめ

本デザインシステムでは以下を定義しました：

1. **カラーシステム**: ダークモード/ライトモード対応の完全なパレット
2. **タイポグラフィ**: 視認性重視のフォント設定
3. **スペーシング**: 一貫したスペーシングスケール
4. **コンポーネントスタイル**: 再利用可能なスタイル定義
5. **アニメーション**: スムーズなトランジション
6. **レスポンシブ**: PC最適化（最小1280x720px）
7. **アクセシビリティ**: WCAG 2.1準拠

---

## 関連ドキュメント

- [01-architecture.md](./01-architecture.md) - システムアーキテクチャ
- [02-data-models.md](./02-data-models.md) - データモデル
- UI実装時は本ドキュメントのCSS変数を使用

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI Design System Architect |
