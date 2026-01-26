# システムアーキテクチャ

## 1. 概要

本ドキュメントでは、ポーカーブラインドタイマーのシステムアーキテクチャ、技術スタック、プロジェクト構成について詳細に説明します。

## 2. システム概要図

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client Side Only)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 React Application                    │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  UI Layer    │  │  Services    │  │  Domain   │ │   │
│  │  │  (React)     │→ │  Layer       │→ │  Layer    │ │   │
│  │  │              │  │              │  │           │ │   │
│  │  │ - Components │  │ - Storage    │  │ - Models  │ │   │
│  │  │ - Views      │  │ - Audio      │  │ - Logic   │ │   │
│  │  │ - Hooks      │  │ - Keyboard   │  │           │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │      State Management (Context + Reducer)     │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ localStorage │  │  Web Audio   │  │  Fullscreen  │      │
│  │     API      │  │     API      │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 3. 技術スタック

### 3.1 コアテクノロジー

| 技術 | バージョン | 目的 |
|------|-----------|------|
| React | ^18.2.0 | UIライブラリ |
| TypeScript | ^5.3.0 | 型安全な開発 |
| Vite | ^5.0.0 | ビルドツール・開発サーバー |

### 3.2 状態管理

- **React Context API**: グローバル状態管理
- **useReducer**: 複雑な状態ロジックの管理
- **カスタムフック**: 状態ロジックの再利用

### 3.3 スタイリング

- **CSS Modules**: コンポーネントスコープのスタイル
- **CSS Variables**: テーマ管理（ダークモード/ライトモード）

### 3.4 ブラウザAPI

| API | 用途 | フォールバック |
|-----|------|---------------|
| localStorage | データ永続化 | なし（必須機能） |
| Web Audio API / HTML5 Audio | 音声通知 | 無音（音なしで動作） |
| Fullscreen API | フルスクリーン表示 | 通常表示のまま |
| requestAnimationFrame | アニメーション | CSSアニメーション |

### 3.5 開発ツール

```json
{
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

## 4. アーキテクチャパターン

### 4.1 レイヤードアーキテクチャ

本プロジェクトは3層アーキテクチャを採用します：

```
┌─────────────────────────────────────┐
│        UI Layer (Presentation)       │
│  - React Components                  │
│  - Views                             │
│  - Custom Hooks                      │
│  - Styles                            │
└──────────────┬──────────────────────┘
               │ depends on
               ↓
┌─────────────────────────────────────┐
│      Services Layer (Application)    │
│  - StorageService                    │
│  - AudioService                      │
│  - KeyboardService                   │
└──────────────┬──────────────────────┘
               │ depends on
               ↓
┌─────────────────────────────────────┐
│         Domain Layer (Business)      │
│  - Tournament (Entity)               │
│  - Timer (Entity)                    │
│  - BlindLevel (Value Object)         │
│  - Preset (Entity)                   │
│  - Pure Business Logic               │
└─────────────────────────────────────┘
```

### 4.2 依存関係ルール

1. **上位層は下位層に依存できる**
   - UI Layer → Services Layer → Domain Layer

2. **下位層は上位層に依存しない**
   - Domain Layer は UI や Services を知らない
   - Services Layer は UI を知らない

3. **同一層内の依存は最小限に**
   - 循環依存を避ける

## 5. ディレクトリ構成

### 5.1 プロジェクト全体構造

```
poker-blind-timer/
├── public/                     # 静的ファイル
│   ├── sounds/                # 音声ファイル
│   │   ├── level-change.mp3  # レベル変更音
│   │   └── warning-1min.mp3  # 残り1分警告音
│   └── favicon.ico
│
├── src/                        # ソースコード
│   ├── domain/                # ドメイン層（ビジネスロジック）
│   ├── services/              # サービス層（アプリケーションロジック）
│   ├── ui/                    # UI層（プレゼンテーション）
│   ├── context/               # React Context（状態管理）
│   ├── types/                 # 共通型定義
│   ├── utils/                 # ユーティリティ関数
│   ├── App.tsx               # アプリケーションルート
│   ├── main.tsx              # エントリーポイント
│   └── vite-env.d.ts
│
├── tests/                      # テスト
│   ├── unit/                  # 単体テスト
│   ├── integration/           # 統合テスト
│   └── e2e/                   # E2Eテスト
│
├── docs/                       # ドキュメント
│   ├── urs/                   # 要求仕様書
│   ├── plans/                 # 計画書
│   └── specs/                 # 機能仕様書（本ドキュメント）
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.json
├── .prettierrc
└── README.md
```

### 5.2 src/domain/ - ドメイン層

```
src/domain/
├── models/
│   ├── Tournament.ts         # トーナメント管理ロジック
│   ├── Timer.ts             # タイマーロジック
│   ├── BlindLevel.ts        # ブラインドレベル（Value Object）
│   ├── Preset.ts            # プリセット
│   ├── BreakConfig.ts       # 休憩設定
│   └── index.ts
│
├── events/
│   └── TournamentEvents.ts  # ドメインイベント定義
│
└── index.ts
```

#### 責務

- **ビジネスルールの実装**
- **ドメインモデルの定義**
- **UIやインフラストラクチャに依存しない純粋なロジック**

### 5.3 src/services/ - サービス層

```
src/services/
├── storage/
│   ├── StorageService.ts     # localStorage 抽象化
│   ├── PresetStorage.ts      # プリセットの保存/読み込み
│   └── SettingsStorage.ts    # 設定の保存/読み込み
│
├── audio/
│   └── AudioService.ts       # 音声再生管理
│
├── keyboard/
│   └── KeyboardService.ts    # キーボードイベント管理
│
└── index.ts
```

#### 責務

- **ブラウザAPIとの連携**
- **外部リソースの管理**
- **ドメインロジックのオーケストレーション**

### 5.4 src/ui/ - UI層

```
src/ui/
├── components/
│   ├── timer/
│   │   ├── TimerDisplay.tsx          # タイマー表示
│   │   ├── TimerDisplay.module.css
│   │   ├── BlindInfo.tsx             # ブラインド情報表示
│   │   ├── BlindInfo.module.css
│   │   ├── ControlButtons.tsx        # 操作ボタン
│   │   └── ControlButtons.module.css
│   │
│   ├── settings/
│   │   ├── SettingsPanel.tsx         # 設定パネル
│   │   ├── BlindEditor.tsx           # ブラインド編集
│   │   ├── BreakSettings.tsx         # 休憩設定
│   │   ├── ThemeToggle.tsx           # テーマ切り替え
│   │   └── *.module.css
│   │
│   ├── preset/
│   │   ├── PresetList.tsx            # プリセット一覧
│   │   ├── PresetForm.tsx            # プリセット作成/編集
│   │   ├── ImportExport.tsx          # インポート/エクスポート
│   │   └── *.module.css
│   │
│   ├── common/
│   │   ├── Button.tsx                # 共通ボタン
│   │   ├── Modal.tsx                 # モーダル
│   │   ├── Input.tsx                 # 入力フィールド
│   │   └── *.module.css
│   │
│   └── layout/
│       ├── MainLayout.tsx            # メインレイアウト
│       ├── FullscreenLayout.tsx      # フルスクリーンレイアウト
│       └── *.module.css
│
├── views/
│   ├── TimerView.tsx                 # タイマー画面
│   ├── SettingsView.tsx              # 設定画面
│   └── PresetView.tsx                # プリセット管理画面
│
├── hooks/
│   ├── useTournament.ts              # トーナメント状態管理
│   ├── useTimer.ts                   # タイマー制御
│   ├── usePresets.ts                 # プリセット管理
│   ├── useKeyboard.ts                # キーボードショートカット
│   ├── useAudio.ts                   # 音声再生
│   └── useFullscreen.ts              # フルスクリーン制御
│
└── styles/
    ├── globals.css                   # グローバルスタイル
    ├── themes.css                    # テーマ定義
    └── variables.css                 # CSS変数
```

#### 責務

- **ユーザーインターフェースの実装**
- **ユーザー操作の受付**
- **状態の表示**

### 5.5 src/context/ - 状態管理

```
src/context/
├── TournamentContext.tsx      # トーナメント状態
│   ├── State定義
│   ├── Actions定義
│   ├── Reducer実装
│   └── Provider/Hooks
│
├── SettingsContext.tsx        # 設定状態
│   ├── UI設定（テーマ、音量等）
│   └── Provider/Hooks
│
└── index.ts
```

#### 責務

- **グローバル状態の管理**
- **状態の更新ロジック（Reducer）**
- **コンポーネントへの状態提供**

### 5.6 src/types/ - 型定義

```
src/types/
├── domain.ts                  # ドメイン型
├── storage.ts                 # localStorage スキーマ型
├── ui.ts                      # UI関連型
└── index.ts
```

### 5.7 src/utils/ - ユーティリティ

```
src/utils/
├── timeFormat.ts              # 時間フォーマット関数
├── validation.ts              # バリデーション関数
├── constants.ts               # 定数定義
└── index.ts
```

## 6. データフロー

### 6.1 ユーザー操作からUI更新まで

```
[User Action]
    ↓
[UI Component]
    ↓ dispatch
[Context Reducer]
    ↓ update
[Global State]
    ↓ subscribe
[UI Component]
    ↓
[Re-render]
```

### 6.2 タイマーイベントフロー

```
[Timer Tick]
    ↓
[useTimer Hook]
    ↓ dispatch
[TournamentContext]
    ↓ state change
[TimerDisplay Component]
    ↓
[UI Update]
    ↓
[Audio Service] ← (条件: レベル変更、警告音)
    ↓
[Sound Playback]
```

### 6.3 データ永続化フロー

```
[State Change]
    ↓
[useEffect (auto-save)]
    ↓
[StorageService]
    ↓
[localStorage API]
    ↓
[Browser Storage]

[App Init]
    ↓
[StorageService.load()]
    ↓
[localStorage API]
    ↓
[Context Initial State]
```

## 7. 状態管理設計

### 7.1 Context構造

#### TournamentContext

```typescript
interface TournamentState {
  // 現在のトーナメント情報
  currentLevel: number;
  blindLevels: BlindLevel[];
  levelDuration: number; // 秒

  // タイマー状態
  timerStatus: 'idle' | 'running' | 'paused';
  remainingTime: number; // 秒
  elapsedTime: number; // 秒

  // 休憩設定
  breakConfig: {
    enabled: boolean;
    frequency: number; // Xレベルごと
    duration: number; // 分
  };
  isBreak: boolean;

  // プリセット
  activePresetId: string | null;
}

type TournamentAction =
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'TICK'; payload: { deltaTime: number } }
  | { type: 'NEXT_LEVEL' }
  | { type: 'PREVIOUS_LEVEL' }
  | { type: 'LOAD_PRESET'; payload: { preset: Preset } }
  | { type: 'UPDATE_BLIND_LEVELS'; payload: { levels: BlindLevel[] } }
  | { type: 'UPDATE_BREAK_CONFIG'; payload: BreakConfig };
```

#### SettingsContext

```typescript
interface SettingsState {
  // UI設定
  theme: 'light' | 'dark' | 'system';
  isFullscreen: boolean;

  // 音声設定
  soundEnabled: boolean;

  // プリセット管理
  presets: Preset[];
}

type SettingsAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'ADD_PRESET'; payload: Preset }
  | { type: 'UPDATE_PRESET'; payload: Preset }
  | { type: 'DELETE_PRESET'; payload: { id: string } }
  | { type: 'LOAD_PRESETS'; payload: Preset[] };
```

### 7.2 状態の永続化

以下の状態はlocalStorageに自動保存されます：

- `SettingsContext.presets` - プリセット一覧
- `SettingsContext.theme` - テーマ設定
- `SettingsContext.soundEnabled` - 音声設定
- `TournamentContext.breakConfig` - 休憩設定

以下は永続化されません（セッション限り）：

- `TournamentContext.timerStatus` - タイマー状態
- `TournamentContext.remainingTime` - 残り時間
- `TournamentContext.currentLevel` - 現在レベル

## 8. コンポーネント設計原則

### 8.1 コンポーネント分類

#### Presentational Components（表示専用）

- Propsのみで動作
- 状態を持たない
- 再利用可能

例: `Button`, `Input`, `BlindInfo`

#### Container Components（ロジック含む）

- Contextから状態を取得
- イベントハンドラを持つ
- ビジネスロジックを含む

例: `TimerDisplay`, `SettingsPanel`, `PresetList`

### 8.2 Props設計ガイドライン

1. **必須Propsは少なく**: 最大5個まで
2. **デフォルト値を提供**: オプショナルPropsはデフォルト値を設定
3. **型を明確に**: すべてのPropsに型定義
4. **Callbackは`on`プレフィックス**: `onClick`, `onChange`

### 8.3 カスタムフック設計

各カスタムフックは単一責任を持つ：

- `useTournament()` - トーナメント状態とアクション
- `useTimer()` - タイマー制御
- `usePresets()` - プリセット管理
- `useKeyboard()` - キーボードイベント
- `useAudio()` - 音声再生
- `useFullscreen()` - フルスクリーン制御

## 9. パフォーマンス最適化戦略

### 9.1 レンダリング最適化

1. **React.memo**: 高頻度で更新されないコンポーネント
   ```typescript
   export const BlindInfo = React.memo(({ level }: Props) => { ... });
   ```

2. **useCallback**: イベントハンドラの最適化
   ```typescript
   const handleStart = useCallback(() => {
     dispatch({ type: 'START_TIMER' });
   }, [dispatch]);
   ```

3. **useMemo**: 高コストな計算結果のキャッシュ
   ```typescript
   const nextBreakLevel = useMemo(() =>
     calculateNextBreak(currentLevel, breakConfig),
     [currentLevel, breakConfig]
   );
   ```

### 9.2 バンドルサイズ最適化

- **コード分割**: 設定画面は遅延ロード
  ```typescript
  const SettingsView = lazy(() => import('./ui/views/SettingsView'));
  ```

- **Tree Shaking**: 使用していないコードの削除（Viteが自動処理）

### 9.3 タイマー精度保証

詳細は [features/timer.md](./features/timer.md) を参照。

- **ドリフト補正**: `Date.now()`で実時間を追跡
- **バックグラウンド対応**: 非アクティブ時も時間を追跡

## 10. エラーハンドリング戦略

### 10.1 エラーバウンダリ

```typescript
// 最上位でエラーをキャッチ
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 10.2 localStorage エラー

```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // 容量超過エラー処理
    showNotification('ストレージ容量が不足しています');
  }
}
```

### 10.3 音声再生エラー

```typescript
try {
  await audio.play();
} catch (error) {
  // ユーザー操作前の自動再生エラー（無視してよい）
  console.warn('Audio playback failed:', error);
}
```

## 11. セキュリティ考慮事項

### 11.1 XSS対策

- Reactのデフォルトエスケープに依存
- `dangerouslySetInnerHTML` は使用しない

### 11.2 データバリデーション

- localStorage から読み込んだデータは必ずバリデーション
- ユーザー入力は型チェックと範囲チェック

### 11.3 プライバシー

- 外部への通信なし（完全オフライン動作）
- アナリティクスやトラッキングなし

## 12. ブラウザ対応

### 12.1 対象ブラウザ

| ブラウザ | 最小バージョン |
|---------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ (Chromium) |

### 12.2 必須機能のサポート確認

- ES2020構文
- CSS Grid / Flexbox
- CSS Variables
- localStorage API
- Web Audio API または HTML5 Audio

### 12.3 オプショナル機能

- Fullscreen API（非対応時はボタン無効化）

## 13. 開発ワークフロー

### 13.1 Git ブランチ戦略

```
main          本番用ブランチ
  ├─ develop  開発統合ブランチ
      ├─ feature/timer
      ├─ feature/blinds
      └─ feature/presets
```

### 13.2 コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

### 13.3 コードレビュー基準

1. TypeScript型エラーがないこと
2. ESLintエラーがないこと
3. テストが通ること
4. パフォーマンスに問題がないこと

## 14. ビルド設定

### 14.1 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### 14.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 15. まとめ

本アーキテクチャは以下の特徴を持ちます：

1. **レイヤードアーキテクチャ**: 責務の明確な分離
2. **型安全性**: TypeScriptによる厳格な型チェック
3. **保守性**: 明確なディレクトリ構成と命名規則
4. **拡張性**: 新機能追加を考慮した設計
5. **パフォーマンス**: 最適化戦略の明確化

---

## 関連ドキュメント

- [02-data-models.md](./02-data-models.md) - データモデル詳細
- [03-design-system.md](./03-design-system.md) - デザインシステム
- [testing.md](./testing.md) - テスト戦略
- [deployment.md](./deployment.md) - デプロイメント

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
