# アベレージスタック表示機能 フェーズ3 デザインレビューレポート

## 実施日

2026-02-11

## 概要

アベレージスタック表示機能のフェーズ3（UI層の実装）に着手する前に、既存のデザイン仕様・UI実装・情報設計を精査し、UX改善点を検討した。結果として4点の改善を特定し、計画書および仕様書を更新した。

## 関連計画書

- `docs/plans/2026-02-09-average-stack-display.md`
- `docs/specs/features/average-stack.md`
- `docs/specs/03-design-system.md`
- `docs/reports/2026-02-10-average-stack-phase2.md`

## レビュー対象

### 確認した実装ファイル

| ファイル | 確認内容 |
|---|---|
| `src/components/MainLayout.tsx` | レイアウト構造、コンポーネント配置 |
| `src/components/MainLayout.css` | flex レイアウト、nth-child セレクタ |
| `src/components/TimerDisplay/TimerDisplay.tsx` | タイマー表示の構造 |
| `src/components/BlindInfo/BlindInfo.tsx` | ブラインド情報の表示パターン |
| `src/components/BlindInfo/BlindInfo.module.css` | スタイリングパターン |
| `src/components/NextLevelInfo/NextLevelInfo.tsx` | コンパクトバーの実装パターン |
| `src/components/NextLevelInfo/NextLevelInfo.module.css` | バー形式のスタイリング |
| `src/components/BreakDisplay/BreakDisplay.tsx` | ブレイク表示の構造と props |
| `src/components/BreakDisplay/BreakDisplay.module.css` | ブレイク時のスタイリング |
| `src/components/TimerControls/TimerControls.tsx` | コントロールの配置 |
| `src/components/common/NumberInput/NumberInput.tsx` | 数値入力コンポーネントの仕様 |
| `src/hooks/useTimer.ts` | フックが公開するプレイヤー関連データ |

### 確認した仕様書

| ファイル | 確認内容 |
|---|---|
| `docs/specs/03-design-system.md` | カラーシステム、タイポグラフィ、レスポンシブ設計 |
| `docs/specs/features/average-stack.md` | フィーチャー仕様（更新前） |
| `docs/plans/2026-02-09-average-stack-display.md` | 実装計画（更新前） |

## 現状のUI構造分析

### MainLayout の DOM 構造

```
.timer-view（flex column, gap: spacing-4）
├── [1st child] TimerDisplay / BreakDisplay（flex: 1 — メインエリア）
├── [2nd child] BlindInfo（flex-shrink: 0）※通常時のみ
├── [3rd child] NextLevelInfo（flex-shrink: 0）※通常時のみ
└── [last child] TimerControls（flex-shrink: 0）
```

**CSS の nth-child セレクタ:**

- `:first-child` → `flex: 1`（メイン表示エリア）
- `:nth-child(2), :nth-child(3), :nth-child(4)` → `flex-shrink: 0`
- `:last-child` → `align-self: stretch`

### 情報の視覚的優先度（現状）

| 優先度 | コンポーネント | フォントサイズ（PC） | 特徴 |
|---|---|---|---|
| 最高 | TimerDisplay | 120px (display-xl) | モノスペース、大サイズ |
| 高 | BlindInfo | 48px (h1) | ゴールドアクセント、テキストシャドウ |
| 中 | NextLevelInfo | 24px (h4) | コンパクトバー、tertiary背景 |
| 操作 | TimerControls | 16px (base) | ボタン群 |

## 特定した改善点

### 改善 1: コンポーネント配置の確定

**問題:** 元の仕様では「BlindInfo と NextLevelInfo の間、または NextLevelInfo の下」と配置が未確定だった。

**分析:**

- Timer → BlindInfo → NextLevelInfo はタイマーのコア情報フローを形成
- このフローの途中にアベレージスタック（補助統計情報）を挿入すると、ユーザーの視線の流れが中断される
- NextLevelInfo の下であれば、「コア情報 → 補助情報 → 操作」という自然な階層が維持される

**決定:** NextLevelInfo の下（TimerControls の直上）に配置する。

**影響:**

- MainLayout.css の nth-child セレクタの更新が必要
- BreakDisplay 時も同じ位置に表示可能（一貫性）

### 改善 2: ブレイク時の統合方式

**問題:** 元の計画では BreakDisplay を変更してアベレージスタック表示を埋め込む設計だった。

**分析:**

- BreakDisplay に AverageStackDisplay を埋め込むと、props の拡張が必要（remainingTime, onSkip に加えてプレイヤー関連データ全て）
- コンポーネントの責務が肥大化し、単一責任の原則に反する
- 通常時と異なるコンポーネントパスでアベレージスタックを表示するため、コード重複またはコンポーネント分離が必要

**決定:** BreakDisplay は変更しない。MainLayout で AverageStackDisplay を兄弟要素として描画する。

```jsx
// 改善後の構造
{timer.isOnBreak ? (
  <BreakDisplay ... />
) : (
  <>
    <TimerDisplay ... />
    <BlindInfo ... />
    <NextLevelInfo ... />
  </>
)}
{showAverageStack && <AverageStackDisplay ... />}
<TimerControls ... />
```

**メリット:**

- BreakDisplay の変更不要（変更ファイル数の削減）
- 通常時・ブレイク時で同じコンポーネントインスタンスを使用
- 配置位置が一貫（常に TimerControls の直上）

### 改善 3: ビジュアルデザインの統一

**問題:** 元の仕様では AverageStackDisplay のビジュアルデザインが具体的に定義されていなかった。

**分析:**

- 現在のタイマー画面で最も近い視覚的優先度のコンポーネントは NextLevelInfo
- NextLevelInfo はコンパクトなバー形式（bg-tertiary, bordered, small fonts）
- AverageStackDisplay も同じ補助情報カテゴリであり、視覚的に統一すべき

**決定:** NextLevelInfo と同系統のコンパクトバーデザインを採用。

| プロパティ | 値 |
|---|---|
| 背景 | `--color-bg-tertiary` |
| ボーダー | `1px solid --color-border`, `border-radius: --radius-lg` |
| パディング | `spacing-3` 〜 `spacing-4` |
| 数値フォント | `--font-family-numeric` |
| ラベルフォント | `--font-family-sans`, `--font-size-sm` |
| レイアウト | デスクトップ: 横一列 / モバイル: 2行折り返し |

### 改善 4: −1 ボタンの詳細仕様

**問題:** 元の仕様では「残り人数 −1 ボタン」の具体的なデザインが未定義だった。

**分析:**

- トーナメント進行中、TD（トーナメントディレクター）がプレイヤー脱落時に最も頻繁に操作するのが −1 ボタン
- NumberInput の標準増減ボタン（▲/▼）は小さく、高速操作には不向き
- 主要操作であるため、視覚的に目立つ専用ボタンが必要

**決定:** NumberInput とは別の専用ボタンとして実装。

- アクセントカラー（`--color-accent` 系）で視覚的に強調
- 最小タッチターゲット 44×44px
- 明確なラベル「−1」
- disabled 状態: `remainingPlayers <= 0`

## 変更ファイル一覧

### 更新した仕様書・計画書

| ファイル | 変更内容 |
|---|---|
| `docs/plans/2026-02-09-average-stack-display.md` | フェーズ3のタスク詳細化、配置確定、ワイヤーフレーム追加、BreakDisplay変更削除 |
| `docs/specs/features/average-stack.md` | セクション5.2/5.3の全面改訂（配置、ビジュアルデザイン、ワイヤーフレーム、−1ボタン仕様） |

### 削除された計画タスク

| ファイル | 理由 |
|---|---|
| `src/components/BreakDisplay/BreakDisplay.tsx` の変更 | AverageStackDisplay を兄弟要素として描画する方式に変更したため不要 |

## 影響分析

### 実装への影響

| 項目 | 変更前 | 変更後 | 影響 |
|---|---|---|---|
| 変更ファイル数 | 8ファイル | 7ファイル | BreakDisplay.tsx の変更が不要に |
| コンポーネント結合度 | BreakDisplay が AverageStack に依存 | 完全に独立 | 保守性向上 |
| CSS セレクタ | nth-child(2,3,4) | 更新が必要 | MainLayout.css の調整 |

### 既存コードへの影響

- **BreakDisplay**: 変更なし（影響なし）
- **MainLayout.tsx**: AverageStackDisplay の追加と条件付き描画
- **MainLayout.css**: nth-child セレクタの更新（子要素数増加に対応）

## 次のステップ

フェーズ3の実装に着手する。具体的には:

1. AverageStackDisplay コンポーネントの新規作成
   - `src/components/AverageStackDisplay/AverageStackDisplay.tsx`
   - `src/components/AverageStackDisplay/AverageStackDisplay.module.css`
   - `src/components/AverageStackDisplay/AverageStackDisplay.test.tsx`
   - `src/components/AverageStackDisplay/index.ts`
2. MainLayout への統合
3. フォーマットユーティリティの整備
4. テストの作成

## まとめ

フェーズ3のUI実装に先立ち、デザインレビューを実施した。4つの改善点（配置の確定、ブレイク時の統合方式、ビジュアルデザインの統一、−1ボタンの詳細仕様）を特定し、計画書と仕様書を更新した。これらの改善により、情報階層の明確化、コンポーネントの疎結合、視覚的一貫性、主要操作のユーザビリティ向上が期待できる。
