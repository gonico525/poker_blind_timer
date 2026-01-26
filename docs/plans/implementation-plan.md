# 実装計画書（マスタープラン）

本ドキュメントは、ポーカーブラインドタイマーの実装計画を定義します。
TDD（テスト駆動開発）を採用し、並行開発を最大化する構成としています。

---

## 目次

1. [開発方針](#1-開発方針)
2. [チーム構成と担当範囲](#2-チーム構成と担当範囲)
3. [フェーズ定義と依存関係](#3-フェーズ定義と依存関係)
4. [マイルストーン](#4-マイルストーン)
5. [TDD実践ガイドライン](#5-tdd実践ガイドライン)
6. [結合ポイントと同期タイミング](#6-結合ポイントと同期タイミング)
7. [リスクと対策](#7-リスクと対策)

---

## 1. 開発方針

### 1.1 TDD（テスト駆動開発）の採用

全ての実装において、以下のTDDサイクルを厳守します。

```
┌─────────────────────────────────────────────────────────┐
│                    TDD サイクル                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐       │
│    │  RED    │ ───► │  GREEN  │ ───► │ REFACTOR│       │
│    │失敗する │      │最小実装 │      │設計改善 │       │
│    │テスト作成│      │でパス   │      │         │       │
│    └─────────┘      └─────────┘      └─────────┘       │
│         ▲                                   │          │
│         └───────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**各フェーズの詳細:**

| フェーズ     | 作業内容                         | 完了条件                             |
| ------------ | -------------------------------- | ------------------------------------ |
| **RED**      | 失敗するテストを書く             | テストが意図通り失敗すること         |
| **GREEN**    | テストを通す最小限のコードを書く | 全テストがパスすること               |
| **REFACTOR** | コードの設計を改善する           | テストが引き続きパス、コード品質向上 |

### 1.2 並行開発の原則

- **インターフェースファースト**: 実装前にインターフェースを確定
- **モック活用**: 依存先が未完成でもモックで開発継続
- **契約によるプログラミング**: 型定義とテストが契約となる

### 1.3 技術スタック

| カテゴリ             | 技術                                    |
| -------------------- | --------------------------------------- |
| フレームワーク       | React 19.2 + TypeScript 5.9             |
| ビルドツール         | Vite 7.3                                |
| テストフレームワーク | Vitest 4.0 + React Testing Library 16.3 |
| Linting              | ESLint 9.39 (Flat Config)               |
| Formatting           | Prettier 3.8                            |
| スタイリング         | CSS Modules または Tailwind CSS         |
| 状態管理             | React Context + useReducer              |

---

## 2. チーム構成と担当範囲

### 2.1 チーム編成

```
┌─────────────────────────────────────────────────────────────────┐
│                        プロジェクト構成                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Team A     │  │   Team B     │  │   Team C     │          │
│  │  基盤・状態   │  │ タイマー・表示│  │ 音声・キーボード│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         │          ┌──────┴──────┐          │                   │
│         │          │             │          │                   │
│         ▼          ▼             ▼          ▼                   │
│  ┌─────────────────────────────────────────────────┐           │
│  │                    Team D                        │           │
│  │               プリセット・設定UI                  │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 担当範囲詳細

| チーム     | 担当領域         | 主な成果物                                | 計画書                                                           |
| ---------- | ---------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| **Team A** | 基盤・状態管理   | 型定義、ユーティリティ、Context、Storage  | [implementation-plan-team-a.md](./implementation-plan-team-a.md) |
| **Team B** | タイマー・表示   | useTimer、TimerDisplay、BlindInfo         | [implementation-plan-team-b.md](./implementation-plan-team-b.md) |
| **Team C** | 音声・キーボード | AudioService、KeyboardService、関連フック | [implementation-plan-team-c.md](./implementation-plan-team-c.md) |
| **Team D** | プリセット・設定 | usePresets、PresetManager、Settings       | [implementation-plan-team-d.md](./implementation-plan-team-d.md) |

### 2.3 依存関係マトリクス

```
        依存先 →
依存元    Team A   Team B   Team C   Team D
  ↓     ────────────────────────────────────
Team A     -        -        -        -
Team B    必須      -        -        -
Team C    必須      -        -        -
Team D    必須     一部      -        -
```

---

## 3. フェーズ定義と依存関係

### 3.1 フェーズ概要

```
Phase 0: プロジェクトセットアップ
    │
    ▼
Phase 1: 基盤構築 ─────────────────────────────────────┐
    │                                                  │
    ├─────────────────┬─────────────────┐              │
    ▼                 ▼                 ▼              │
Phase 2A          Phase 2B          Phase 2C          │
Context層         サービス層         サービス層          │
(Team A)         (Team C:Audio)   (Team C:Keyboard)   │
    │                 │                 │              │
    ├─────────────────┴─────────────────┤              │
    ▼                                   ▼              │
Phase 3A                            Phase 3B          │
フック層                            フック層            │
(Team A,B)                         (Team C)           │
    │                                   │              │
    ├───────────────────────────────────┤              │
    ▼                                                  │
Phase 4: UI層 ◄────────────────────────────────────────┘
(全チーム並行)
    │
    ▼
Phase 5: 結合・統合テスト
(全チーム合流)
```

### 3.2 各フェーズの詳細

#### Phase 0: プロジェクトセットアップ（全チーム共通）

| 項目     | 内容                                         |
| -------- | -------------------------------------------- |
| 担当     | リードエンジニア                             |
| 成果物   | プロジェクト雛形、CI/CD設定、lint/format設定 |
| 前提条件 | なし                                         |

**タスク:**

- [ ] Vite + React + TypeScript プロジェクト作成
- [ ] Vitest + React Testing Library 設定
- [ ] パスエイリアス（@/）設定
- [ ] ESLint + Prettier 設定
- [ ] Git hooks（husky + lint-staged）設定
- [ ] CI/CD パイプライン設定

#### Phase 1: 基盤構築（Team A主導）

| 項目     | 内容                             |
| -------- | -------------------------------- |
| 担当     | Team A                           |
| 成果物   | 型定義、定数、ユーティリティ関数 |
| 前提条件 | Phase 0 完了                     |
| 並行可能 | 不可（他チームの前提）           |

**作業開始前の確認事項:**

- [ ] Phase 0の成果物確認（プロジェクト構成、設定ファイル）
- [ ] 開発環境のセットアップ確認（npm install, npm test実行可能）

**完了条件:**

- 全ての型定義が完了し、テストがパス
- 全てのユーティリティ関数が完了し、テストがパス
- 他チームがインポートして使用可能な状態

#### Phase 2: Context層・サービス層（並行開発開始）

**Phase 2A: Context層（Team A）**

| 項目     | 内容                                                                    |
| -------- | ----------------------------------------------------------------------- |
| 担当     | Team A                                                                  |
| 成果物   | StorageService, SettingsContext, TournamentContext, NotificationContext |
| 前提条件 | Phase 1 完了                                                            |

**作業開始前の必須確認:**

- [ ] Phase 1成果物の確認：
  - [ ] `src/types/` の型定義（TournamentAction, SettingsAction等）
  - [ ] `src/utils/` のバリデーション関数、定数
  - [ ] `src/domain/models/` のドメインロジック
- [ ] Phase 1完了報告書の確認（`docs/reports/phase1-completion-report.md`）

**Phase 2B: AudioService（Team C）**

| 項目     | 内容                    |
| -------- | ----------------------- |
| 担当     | Team C                  |
| 成果物   | AudioService            |
| 前提条件 | Phase 1 完了            |
| 並行可能 | Phase 2A, 2C と並行可能 |

**作業開始前の必須確認:**

- [ ] Phase 1成果物の確認：
  - [ ] `src/utils/constants.ts` の AUDIO_FILES 定数
  - [ ] `src/types/` のSettings型定義
- [ ] Phase 1完了報告書の確認

**Phase 2C: KeyboardService（Team C）**

| 項目     | 内容                    |
| -------- | ----------------------- |
| 担当     | Team C                  |
| 成果物   | KeyboardService         |
| 前提条件 | Phase 1 完了            |
| 並行可能 | Phase 2A, 2B と並行可能 |

**作業開始前の必須確認:**

- [ ] Phase 1成果物の確認：
  - [ ] `src/types/context.ts` の TournamentAction型定義
- [ ] Phase 1完了報告書の確認

#### Phase 3: フック層（並行開発継続）

**Phase 3A: コアフック（Team A, B）**

| 項目     | 内容                               |
| -------- | ---------------------------------- |
| 担当     | Team A（基盤）, Team B（タイマー） |
| 成果物   | useTimer, usePresets               |
| 前提条件 | Phase 2A 完了                      |

**作業開始前の必須確認:**

- [ ] Phase 2A成果物の確認：
  - [ ] TournamentContext / SettingsContext の実装
  - [ ] Context APIの使用方法
- [ ] Phase 2A完了報告書の確認

**Phase 3B: 連携フック（Team C）**

| 項目     | 内容                                       |
| -------- | ------------------------------------------ |
| 担当     | Team C                                     |
| 成果物   | useAudioNotification, useKeyboardShortcuts |
| 前提条件 | Phase 2A, 2B, 2C 完了                      |

**作業開始前の必須確認:**

- [ ] Phase 2成果物の確認：
  - [ ] TournamentContext の実装
  - [ ] AudioService / KeyboardService の実装
- [ ] Phase 2完了報告書の確認

#### Phase 4: UI層（全チーム並行）

| 項目     | 内容               |
| -------- | ------------------ |
| 担当     | 全チーム           |
| 成果物   | 全UIコンポーネント |
| 前提条件 | Phase 3 完了       |

**作業開始前の必須確認:**

- [ ] Phase 3成果物の確認：
  - [ ] 全てのカスタムフック（useTimer, usePresets等）の実装
  - [ ] フックの使用方法とAPI
- [ ] Phase 3完了報告書の確認

**Team別担当:**

| チーム | 担当コンポーネント                                     |
| ------ | ------------------------------------------------------ |
| Team A | App, MainLayout, ErrorScreen, LoadingScreen            |
| Team B | TimerDisplay, BlindInfo, TimerControls, BreakDisplay   |
| Team C | （フック統合のみ、専用UIなし）                         |
| Team D | SettingsPanel, PresetManager, BlindEditor, ThemeToggle |

#### Phase 5: 結合・統合テスト

| 項目     | 内容                  |
| -------- | --------------------- |
| 担当     | 全チーム合流          |
| 成果物   | 統合テスト、E2Eテスト |
| 前提条件 | Phase 4 完了          |

**作業開始前の必須確認:**

- [ ] Phase 4成果物の確認：
  - [ ] 全UIコンポーネントの実装
  - [ ] コンポーネントの統合状態
- [ ] Phase 4完了報告書の確認

---

## 4. マイルストーン

### 4.1 マイルストーン一覧

| #   | マイルストーン       | 完了条件                           | 担当       |
| --- | -------------------- | ---------------------------------- | ---------- |
| M0  | プロジェクト準備完了 | ビルド・テスト実行可能             | リード     |
| M1  | 基盤層完了           | 型・ユーティリティのテスト100%パス | Team A     |
| M2  | Context層完了        | 全Contextのテスト100%パス          | Team A     |
| M3  | サービス層完了       | 全Serviceのテスト100%パス          | Team C     |
| M4  | フック層完了         | 全フックのテスト100%パス           | Team A,B,C |
| M5  | UI層完了             | 全コンポーネントのテスト100%パス   | 全チーム   |
| M6  | 結合完了             | 統合テスト100%パス                 | 全チーム   |
| M7  | リリース準備完了     | E2Eテスト100%パス、本番ビルド成功  | 全チーム   |

### 4.2 チェックポイント

各マイルストーン完了時に以下を確認:

- [ ] 全テストがパスしている
- [ ] コードレビューが完了している
- [ ] ドキュメントが更新されている
- [ ] 他チームへの影響が確認されている

---

## 5. TDD実践ガイドライン

### 5.1 テストファイルの配置

```
src/
├── utils/
│   ├── timeFormat.ts
│   ├── timeFormat.test.ts      # ユニットテスト
│   └── ...
├── services/
│   ├── AudioService.ts
│   ├── AudioService.test.ts    # ユニットテスト
│   └── __mocks__/
│       └── AudioService.ts     # モック
├── contexts/
│   ├── TournamentContext.tsx
│   ├── TournamentContext.test.tsx
│   └── ...
├── hooks/
│   ├── useTimer.ts
│   ├── useTimer.test.ts
│   └── ...
├── components/
│   ├── TimerDisplay/
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerDisplay.test.tsx
│   │   └── TimerDisplay.module.css
│   └── ...
└── __tests__/
    ├── integration/            # 統合テスト
    └── e2e/                    # E2Eテスト
```

### 5.2 テスト作成の原則

#### RED フェーズ（失敗するテストを書く）

```typescript
// ❌ BAD: 実装を先に考えてからテストを書く
// ✅ GOOD: 期待する振る舞いからテストを書く

describe('formatTime', () => {
  // 1. まず期待する入出力を明確にする
  it('should format 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 90 seconds as "01:30"', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  // 2. エッジケースを考える
  it('should handle negative values', () => {
    expect(formatTime(-1)).toBe('00:00');
  });
});
```

#### GREEN フェーズ（最小実装でパス）

```typescript
// ❌ BAD: 最初から完璧な実装を目指す
// ✅ GOOD: テストを通す最小限のコード

// Step 1: 最初のテストを通す最小実装
export function formatTime(seconds: number): string {
  return '00:00'; // まずはハードコード
}

// Step 2: 次のテストを通すために修正
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

#### REFACTOR フェーズ（設計改善）

```typescript
// テストがパスした状態で、コードを改善
// - 重複の除去
// - 命名の改善
// - 関数の分割
// - パフォーマンス改善

// リファクタリング後も必ずテストを実行して確認
```

### 5.3 モックの活用

依存先が未完成の場合、モックを活用して開発を継続:

```typescript
// src/services/__mocks__/AudioService.ts
export const AudioService = {
  preload: vi.fn().mockResolvedValue(undefined),
  playLevelChange: vi.fn(),
  playWarning1Min: vi.fn(),
  playBreakStart: vi.fn(),
  setVolume: vi.fn(),
  setEnabled: vi.fn(),
};

// テストファイル
vi.mock('@/services/AudioService');

describe('useAudioNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should play warning sound at 1 minute remaining', () => {
    // ...
    expect(AudioService.playWarning1Min).toHaveBeenCalled();
  });
});
```

### 5.4 テストカバレッジ目標

| 層         | カバレッジ目標 | 備考                       |
| ---------- | -------------- | -------------------------- |
| utils      | 100%           | 純粋関数、完全にテスト可能 |
| services   | 90%以上        | 外部依存をモック化         |
| contexts   | 90%以上        | Reducer + 初期化ロジック   |
| hooks      | 85%以上        | 副作用を含むため一部困難   |
| components | 80%以上        | UI操作のテスト             |

---

## 6. 結合ポイントと同期タイミング

### 6.1 結合ポイント

各チーム間で結合が必要なポイント:

| #   | 結合ポイント       | 関係チーム   | タイミング          |
| --- | ------------------ | ------------ | ------------------- |
| 1   | 型定義の確定       | A → 全チーム | Phase 1 完了時      |
| 2   | Context API の確定 | A → B, C, D  | Phase 2A 完了時     |
| 3   | Service API の確定 | C → A, D     | Phase 2B, 2C 完了時 |
| 4   | フック API の確定  | A, B → D     | Phase 3A 完了時     |
| 5   | 全機能結合         | 全チーム     | Phase 5 開始時      |

### 6.2 同期ミーティング

| タイミング     | 目的                            | 参加者   |
| -------------- | ------------------------------- | -------- |
| Phase 1 完了時 | 型定義・ユーティリティの共有    | 全チーム |
| Phase 2 完了時 | Context・Service API の確認     | 全チーム |
| Phase 3 完了時 | フック API の確認、UI設計の調整 | 全チーム |
| Phase 5 開始時 | 結合テスト計画の確認            | 全チーム |

### 6.3 インターフェース凍結ルール

- Phase 1 完了後: 型定義の変更は全チームの合意が必要
- Phase 2 完了後: Context/Service API の変更は影響チームの合意が必要
- Phase 3 完了後: フック API の変更は影響チームの合意が必要

---

## 7. リスクと対策

### 7.1 識別されたリスク

| #   | リスク                | 影響度 | 発生可能性 | 対策                                               |
| --- | --------------------- | ------ | ---------- | -------------------------------------------------- |
| R1  | Phase 1 の遅延        | 高     | 中         | Team A にリソース集中、他チームは環境構築を並行    |
| R2  | インターフェース変更  | 中     | 高         | 早期のインターフェースレビュー、凍結ルールの厳守   |
| R3  | Context間の整合性問題 | 高     | 中         | インターフェース定義書の遵守、結合テストの早期実施 |
| R4  | 音声ファイル未準備    | 低     | 低         | ダミーファイルで開発継続                           |
| R5  | テストカバレッジ不足  | 中     | 中         | CI でカバレッジチェック、レビューで確認            |

### 7.2 エスカレーションルール

- 予定より1日以上遅延: チームリーダーに報告
- インターフェース変更が必要: 影響チーム全員で協議
- ブロッカー発生: 即座に全チームに共有

---

## 参照ドキュメント

### 必須参照（全チーム共通）

| ドキュメント           | パス                                                                           | 内容                   |
| ---------------------- | ------------------------------------------------------------------------------ | ---------------------- |
| 要求仕様書             | [docs/urs/requirements.md](../urs/requirements.md)                             | プロジェクト要件       |
| アーキテクチャ         | [docs/specs/01-architecture.md](../specs/01-architecture.md)                   | システム構成           |
| データモデル           | [docs/specs/02-data-models.md](../specs/02-data-models.md)                     | 型定義                 |
| インターフェース定義書 | [docs/specs/04-interface-definitions.md](../specs/04-interface-definitions.md) | **結合仕様（最重要）** |

### 機能別参照

| 機能       | ドキュメント                                                     |
| ---------- | ---------------------------------------------------------------- |
| タイマー   | [docs/specs/features/timer.md](../specs/features/timer.md)       |
| ブラインド | [docs/specs/features/blinds.md](../specs/features/blinds.md)     |
| プリセット | [docs/specs/features/presets.md](../specs/features/presets.md)   |
| 音声       | [docs/specs/features/audio.md](../specs/features/audio.md)       |
| キーボード | [docs/specs/features/keyboard.md](../specs/features/keyboard.md) |
| ストレージ | [docs/specs/features/storage.md](../specs/features/storage.md)   |

---

## 改訂履歴

| バージョン | 日付       | 変更内容                                           | 作成者               |
| ---------- | ---------- | -------------------------------------------------- | -------------------- |
| 1.0        | 2026-01-26 | 初版作成                                           | システムアーキテクト |
| 1.1        | 2026-01-26 | 技術スタック更新（React 19.2, Vite 7.3等）         | リードエンジニア     |
| 1.2        | 2026-01-26 | 各フェーズに「前フェーズ成果物の確認」タスクを追加 | リードエンジニア     |
