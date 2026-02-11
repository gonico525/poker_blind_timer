# アベレージスタック表示機能 実装計画

## 概要

タイマー画面にアベレージスタック（平均スタック）を表示する機能を追加する。
トーナメント進行中に各プレイヤーの平均チップ量を把握することで、ブラインドとの関係性（M値・BB数）を確認でき、トーナメントの進行状況をより適切に判断できるようになる。

## 現状分析

### 既存のデータモデル

現在の `Structure` 型には初期スタック（開始チップ量）のフィールドが存在しない。デフォルトストラクチャーの名前に「50k Start」「30k Start」等の記載があるが、これは表示用の文字列に過ぎず、データとしては保持されていない。

```
// 現在の Structure 型（src/types/domain.ts）
Structure {
  id, name, type, blindLevels[], levelDuration, breakConfig, createdAt, updatedAt
}
```

また、`TournamentState` にはプレイヤー数に関するフィールドが一切存在しない。

```
// 現在の TournamentState 型（src/types/domain.ts）
TournamentState {
  timer, currentLevel, blindLevels[], breakConfig, levelDuration, isOnBreak
}
```

### 影響を受ける既存機能

- **ストラクチャー管理**: `Structure` 型への `initialStack` 追加、編集UI拡張が必要
- **トーナメント状態管理**: `TournamentState` へのプレイヤー数フィールド追加が必要
- **タイマー画面**: アベレージスタック表示コンポーネントの追加が必要
- **localStorage**: 保存スキーマの拡張が必要（後方互換性を維持）

### デフォルトストラクチャーの初期スタック値

既存のデフォルトストラクチャー名から読み取れる初期スタック値:

| ストラクチャー | 名前の記載 | initialStack |
|---|---|---|
| Deepstack | 50k Start | 50000 |
| Standard | 30k Start | 30000 |
| Turbo | 25k Start | 25000 |
| Hyper Turbo | 20k Start | 20000 |

## 確認事項

### [Question 1] アベレージスタックの計算式

**Q:** アベレージスタックの計算は `(initialStack × totalPlayers) / remainingPlayers` でよいか？リバイ（再参加）やアドオンは考慮するか？

**A:** 本計画では最もシンプルな形で実装する。計算式は `(initialStack × totalPlayers) / remainingPlayers` とする。なお、リバイ（再参加）が発生した場合は `totalPlayers` を +1 することで総チップ量を正しく反映できる（リバイ額 = 初期スタックの場合）。この運用方法はUIにヒントとして記載する。リバイ額が初期スタックと異なる場合やアドオン対応は将来の拡張として扱う。

### [Question 2] 表示する情報の種類

**Q:** アベレージスタックはチップ数だけでなく、BB（ビッグブラインド）換算値も表示するか？

**A:** 両方を表示する。チップ数（例: 25,000）とBB数（例: 50BB）を併記することで、トーナメントの進行度合いをより直感的に把握できる。

### [Question 3] プレイヤー数の入力タイミング

**Q:** 参加人数と残り人数はいつ設定するか？タイマー実行中も変更可能か？

**A:** タイマー画面上で常時変更可能とする。タイマーの状態（idle/running/paused）に関係なく、プレイヤー数は随時調整できる。トーナメント中にプレイヤーが脱落するたびに残り人数を減らす運用を想定する。

### [Question 4] 初期スタックの設定場所

**Q:** 初期スタックはストラクチャーの設定項目として持つべきか、それともトーナメント実行時の設定とすべきか？

**A:** ストラクチャーの設定項目とする。初期スタックはブラインド構成と密接に関連しており（ブラインド設計時に初期スタックを前提として設計する）、ストラクチャーの一部として管理するのが自然である。

### [Question 5] 参加人数と残り人数の初期値

**Q:** 参加人数と残り人数のデフォルト値はどうするか？

**A:** 参加人数のデフォルトは 0（未設定）とし、0の場合はアベレージスタックを表示しない。残り人数の初期値は参加人数と同じ値とする。参加人数が設定されるとアベレージスタック表示が有効になる。

### [Question 6] ブレイク中の表示

**Q:** ブレイク中もアベレージスタックを表示するか？

**A:** 表示する。ブレイク中にプレイヤー数を確認・調整することが多いため、BreakDisplay にもアベレージスタック情報を表示する。

## 機能仕様

### アベレージスタック計算

- **計算式**: `averageStack = (initialStack × totalPlayers) / remainingPlayers`
- **BB換算**: `averageStackBB = averageStack / currentBigBlind`
- **表示条件**: `initialStack > 0` かつ `totalPlayers > 0` かつ `remainingPlayers > 0` の場合のみ表示
- **端数処理**: チップ数は整数に丸める（Math.round）、BB数は小数第1位まで表示

### データモデル拡張

#### Structure 型への追加

- `initialStack: number` — 初期スタック（チップ数）。0 は未設定を意味する

#### TournamentState 型への追加

- `totalPlayers: number` — 参加人数（0 = 未設定）
- `remainingPlayers: number` — 残り人数

### UI仕様

#### ストラクチャー編集画面

- レベル時間設定の近くに「初期スタック」入力欄を追加
- 入力範囲: 0〜10,000,000（0は未設定）
- NumberInput コンポーネントを使用

#### タイマー画面（通常時）

- BlindInfo と NextLevelInfo の間、または NextLevelInfo の下にアベレージスタック表示エリアを配置
- 表示内容:
  - 参加人数（編集可能）
  - 残り人数（編集可能、＋/−ボタン付き）
  - アベレージスタック（チップ数）
  - アベレージスタック（BB換算）
- プレイヤー数未設定時は入力促進UIを表示（またはセクション自体を非表示）

#### タイマー画面（ブレイク中）

- BreakDisplay 内にもアベレージスタック情報を表示
- プレイヤー数の編集も可能

### 永続化

- `initialStack` は `Structure` の一部として既存のストラクチャー保存に含まれる
- `totalPlayers` / `remainingPlayers` は `TournamentState` の一部として既存のトーナメント状態保存に含まれる
- 後方互換性: 既存データにフィールドがない場合はデフォルト値（0）で補完

## 実装フェーズ

### フェーズ 0: 仕様書の更新

既存の仕様書を先に更新し、チーム全体で仕様を共有する。

**対象ファイル:**

1. **`docs/specs/02-data-models.md`** — データモデル仕様の更新
   - `Structure` 型に `initialStack` フィールドを追加
   - `TournamentState` 型に `totalPlayers`, `remainingPlayers` を追加
   - デフォルトストラクチャーの `initialStack` 値を記載
   - バリデーションルールを追加
   - localStorage スキーマの後方互換性について記載

2. **`docs/specs/04-interface-definitions.md`** — インターフェース定義の更新
   - TournamentContext のアクション型に `SET_PLAYERS` を追加
   - `LOAD_STRUCTURE` アクションが `initialStack` を含む旨を記載

3. **`docs/specs/features/average-stack.md`** — 新規フィーチャー仕様書の作成
   - アベレージスタック機能の詳細仕様
   - 計算ロジック、表示条件、UI仕様、エッジケース

**完了条件:** 仕様書のレビューが完了し、実装に着手できる状態であること

### フェーズ 1: ドメイン層の実装

ビジネスロジックとデータモデルの拡張。UIに依存しない純粋なロジック層。

**タスク:**

1. **型定義の拡張** (`src/types/domain.ts`)
   - `Structure` に `initialStack` を追加
   - `TournamentState` に `totalPlayers`, `remainingPlayers` を追加

2. **アクション型の追加** (`src/types/context.ts`)
   - `SET_PLAYERS` アクションの定義（totalPlayers, remainingPlayers を設定）

3. **ドメインモデルの追加** (`src/domain/models/AverageStack.ts`)
   - `calculateAverageStack(initialStack, totalPlayers, remainingPlayers)` — 平均チップ数を計算
   - `calculateAverageStackBB(averageStack, bigBlind)` — BB換算値を計算
   - `canCalculateAverageStack(initialStack, totalPlayers, remainingPlayers)` — 計算可能判定

4. **デフォルトストラクチャーの更新** (`src/domain/models/Structure.ts`)
   - 4つのデフォルトストラクチャーに `initialStack` 値を設定

5. **定数の追加** (`src/utils/constants.ts`)
   - `LIMITS` に `MIN_INITIAL_STACK`, `MAX_INITIAL_STACK`, `MIN_PLAYERS`, `MAX_PLAYERS` を追加
   - `DEFAULTS` に `INITIAL_STACK`, `TOTAL_PLAYERS`, `REMAINING_PLAYERS` を追加

6. **バリデーションの追加** (`src/utils/validation.ts`)
   - 初期スタックのバリデーション関数
   - プレイヤー数のバリデーション関数（残り人数 ≤ 参加人数）

**テスト:**
- `AverageStack.ts` のユニットテスト（計算ロジック、境界値、エッジケース）
- バリデーション関数のテスト

**完了条件:** `npm test` と `npm run lint` がパスすること

### フェーズ 2: 状態管理層の実装

Context / Reducer の拡張。

**タスク:**

1. **TournamentContext の拡張** (`src/contexts/TournamentContext.tsx`)
   - 初期状態に `totalPlayers: 0`, `remainingPlayers: 0` を追加
   - `SET_PLAYERS` アクションのハンドリング追加
   - `LOAD_STRUCTURE` アクション時に `totalPlayers`, `remainingPlayers` をリセット
   - `RESET` アクション時に `remainingPlayers` を `totalPlayers` にリセット

2. **useTimer フックの拡張** (`src/hooks/useTimer.ts`)
   - `totalPlayers`, `remainingPlayers`, `setPlayers` を公開
   - `initialStack`（現在のストラクチャーから取得）を公開

3. **localStorage 永続化の対応**
   - `TournamentState` の保存・復元に `totalPlayers`, `remainingPlayers` を含める
   - 既存データからの復元時、フィールドがなければデフォルト値で補完

**テスト:**
- Reducer の `SET_PLAYERS` アクションテスト
- `LOAD_STRUCTURE` 時のプレイヤー数リセットテスト
- `RESET` 時の `remainingPlayers` リセットテスト
- localStorage からの復元テスト（後方互換性）

**完了条件:** `npm test` と `npm run lint` がパスすること

### フェーズ 3: UI層の実装（タイマー画面）

タイマー画面へのアベレージスタック表示コンポーネントの追加。

#### デザイン方針

**配置**: NextLevelInfo の**下**（NextLevelInfo と TimerControls の間）に配置する。BlindInfo と NextLevelInfo の間には配置しない。理由:

- Timer → BlindInfo → NextLevelInfo はタイマーのコア情報であり、この流れを分断すべきでない
- アベレージスタックは補助的な情報であり、コア情報より下に配置するのが情報階層として適切
- 通常時・ブレイク時で同じ位置に表示されるため、ユーザーが迷わない

**ビジュアルスタイル**: NextLevelInfo と同じコンパクトなバー形式（`bg-tertiary` 背景、ボーダー付き、小さめフォント）。タイマーやブラインド表示より低い視覚的優先度を維持する。

**ブレイク時の統合**: BreakDisplay を変更せず、MainLayout で AverageStackDisplay を BreakDisplay と同列（兄弟要素）として描画する。これにより:

- BreakDisplay の変更が不要（コンポーネントの疎結合を維持）
- 通常時・ブレイク時で AverageStackDisplay は同じコンポーネントを再利用
- 配置位置が一貫する（常に TimerControls の直上）

**レイアウトワイヤーフレーム:**

```
通常時:
┌─────────────────────────────────────────────┐
│  TimerDisplay（flex: 1）                     │
│  BlindInfo                                  │
├─────────────────────────────────────────────┤
│  NextLevelInfo（コンパクトバー）              │
├─────────────────────────────────────────────┤
│  AverageStackDisplay（コンパクトバー）        │
├─────────────────────────────────────────────┤
│  TimerControls                              │
└─────────────────────────────────────────────┘

ブレイク時:
┌─────────────────────────────────────────────┐
│  BreakDisplay（flex: 1）                     │
├─────────────────────────────────────────────┤
│  AverageStackDisplay（コンパクトバー）        │
├─────────────────────────────────────────────┤
│  TimerControls                              │
└─────────────────────────────────────────────┘
```

**デスクトップ（1280px+）レイアウト:**

```
┌──────────────────────────────────────────────────────────────────┐
│ エントリー [ 10 ] │ 残り [ 8 ] [−1] │ Avg Stack  37,500 (62.5BB)│
└──────────────────────────────────────────────────────────────────┘
```

**モバイル（< 768px）レイアウト:**

```
┌─────────────────────────────────────┐
│  エントリー [10]   残り [8]  [−1]   │
│       Avg Stack: 37,500 (62.5BB)    │
└─────────────────────────────────────┘
```

**−1 ボタンの設計**: 残り人数の −1 ボタンはトーナメント進行中の主要操作であるため、NumberInput の標準的な増減ボタンとは別に、視覚的に目立つ専用ボタンとして実装する。アクセントカラー（ゴールド系）を使用し、タッチターゲットは最低 44×44px を確保する。

**タスク:**

1. **AverageStackDisplay コンポーネント新規作成** (`src/components/AverageStackDisplay/`)
   - プレイヤー数入力UI（参加人数、残り人数）
   - 残り人数の専用 −1 ボタン（主要操作として目立つデザイン）
   - アベレージスタック表示（チップ数 + BB換算）
   - コンパクトなバー形式（NextLevelInfo と同系統のスタイル）
   - 未設定時の表示制御（`initialStack === 0` で非表示）
   - CSS Module によるスタイリング
   - レスポンシブ対応（デスクトップ: 横一列、モバイル: 2行折り返し）

2. **MainLayout への組み込み** (`src/components/MainLayout.tsx`)
   - NextLevelInfo と TimerControls の間に AverageStackDisplay を配置
   - 通常時・ブレイク時ともに同じ位置に描画（BreakDisplay の変更は不要）
   - `initialStack === 0` の場合は描画しない（レイアウトに影響なし）

3. **MainLayout.css のレイアウト調整** (`src/components/MainLayout.css`)
   - 子要素数の変更に対応（nth-child セレクタの更新）
   - AverageStackDisplay に `flex-shrink: 0` を適用

4. **フォーマットユーティリティ** (`src/utils/blindFormat.ts` に追加、または既存の関数を活用)
   - チップ数の表示フォーマット（カンマ区切り）
   - BB数の表示フォーマット（小数第1位）

**テスト:**
- AverageStackDisplay のレンダリングテスト
- プレイヤー数変更時の表示更新テスト
- −1 ボタンの動作テスト
- 未設定時の非表示テスト（`initialStack === 0`）
- ブレイク中の表示テスト
- レスポンシブ: モバイルでの2行レイアウトテスト（任意）

**完了条件:** `npm test` と `npm run lint` がパスすること

### フェーズ 4: UI層の実装（ストラクチャー編集）

ストラクチャー編集画面への初期スタック入力の追加。

**タスク:**

1. **StructureEditor の拡張** (`src/components/StructureManagement/StructureEditor.tsx`)
   - 初期スタック入力フィールドの追加（NumberInput 使用）
   - バリデーションの統合

2. **ストラクチャー保存・読み込みの確認**
   - `initialStack` が正しく保存・復元されることを確認
   - デフォルトストラクチャーの `initialStack` が正しく表示されることを確認
   - インポート/エクスポートでの `initialStack` の扱い

**テスト:**
- StructureEditor での初期スタック入力テスト
- ストラクチャー保存・読み込みテスト
- インポート/エクスポートテスト

**完了条件:** `npm test` と `npm run lint` がパスすること

### フェーズ 5: 統合テスト・最終確認

**タスク:**

1. **E2Eシナリオの確認**
   - ストラクチャーで初期スタックを設定 → タイマー画面でプレイヤー数を設定 → アベレージスタックが正しく表示される
   - レベルが進行するとBB換算値が変化する
   - プレイヤーが脱落（残り人数を減らす）するとアベレージスタックが増加する
   - ブレイク中もアベレージスタックが表示される
   - タイマーリセット時に残り人数が参加人数にリセットされる

2. **後方互換性の確認**
   - `initialStack` フィールドなしの既存ストラクチャーデータが正しく読み込まれる
   - `totalPlayers` / `remainingPlayers` なしの既存トーナメント状態が正しく復元される

3. **レスポンシブ確認**
   - モバイル、タブレット、デスクトップでの表示確認

4. **ビルド確認**
   - `npm run build` が成功すること
   - `npm run lint` がゼロ警告であること
   - `npm test` が全テストパスすること

**完了条件:** 全チェック項目がパスし、機能が正常に動作すること

## ファイル変更一覧

### 新規作成

| ファイル | フェーズ | 概要 |
|---|---|---|
| `docs/specs/features/average-stack.md` | 0 | フィーチャー仕様書 |
| `src/domain/models/AverageStack.ts` | 1 | アベレージスタック計算ロジック |
| `src/domain/models/AverageStack.test.ts` | 1 | 計算ロジックのテスト |
| `src/components/AverageStackDisplay/AverageStackDisplay.tsx` | 3 | 表示コンポーネント |
| `src/components/AverageStackDisplay/AverageStackDisplay.module.css` | 3 | スタイル |
| `src/components/AverageStackDisplay/AverageStackDisplay.test.tsx` | 3 | コンポーネントテスト |
| `src/components/AverageStackDisplay/index.ts` | 3 | re-export |

### 変更

| ファイル | フェーズ | 概要 |
|---|---|---|
| `docs/specs/02-data-models.md` | 0 | データモデル仕様更新 |
| `docs/specs/04-interface-definitions.md` | 0 | インターフェース定義更新 |
| `src/types/domain.ts` | 1 | Structure, TournamentState 型拡張 |
| `src/types/context.ts` | 1 | SET_PLAYERS アクション追加 |
| `src/domain/models/Structure.ts` | 1 | デフォルトストラクチャーに initialStack 追加 |
| `src/utils/constants.ts` | 1 | 定数追加 |
| `src/utils/validation.ts` | 1 | バリデーション関数追加 |
| `src/contexts/TournamentContext.tsx` | 2 | Reducer 拡張、初期状態更新 |
| `src/hooks/useTimer.ts` | 2 | プレイヤー数・initialStack の公開 |
| `src/components/MainLayout.tsx` | 3 | AverageStackDisplay の組み込み（通常時・ブレイク時共通） |
| `src/components/MainLayout.css` | 3 | レイアウト調整（子要素追加に伴う nth-child 更新） |
| `src/components/StructureManagement/StructureEditor.tsx` | 4 | 初期スタック入力欄追加 |
| `src/components/index.ts` | 3 | AverageStackDisplay のエクスポート追加 |

## リスク・注意事項

1. **後方互換性**: 既存の localStorage データには `initialStack`, `totalPlayers`, `remainingPlayers` が存在しない。デシリアライズ時にデフォルト値（0）で補完する処理が必須。
2. **デフォルトストラクチャーの更新**: `createDefaultStructures()` の戻り値が変わるため、既存のテストに影響する可能性がある。
3. **タイマー画面のレイアウト**: 新しい表示エリアの追加により、特にモバイルでのレイアウトバランスに注意が必要。
4. **パフォーマンス**: アベレージスタックの計算は軽量だが、タイマーの TICK ごとに再レンダリングされないよう、React.memo や useMemo で最適化する。

## リバイ（再参加）の扱い

### 現在の設計で対応可能なケース

本計画の `totalPlayers` を増加させる運用で、標準的なリバイに対応できる:

- リバイ発生時に `totalPlayers` を +1 → 総チップ量が `initialStack` 分増加
- 例: 初期スタック 30,000 / 参加 10人 / 残り 10人 → 平均 30,000
- 1人リバイ → totalPlayers を 11 に → 総チップ 330,000 / 残り 10人 → 平均 33,000

**前提条件:** リバイ額 = 初期スタック（一般的なトーナメントルール）

### 将来の拡張が必要なケース

| ケース | totalPlayers 増加で対応可能か |
|---|---|
| リバイ額 = 初期スタック | **対応可能** |
| リバイ額 ≠ 初期スタック（例: 半額リバイ） | 不正確になる |
| アドオン（追加チップ購入、金額が異なる） | 人数操作では表現しにくい |
| リバイ回数の記録・表示 | できない |

## 将来の拡張可能性（本計画のスコープ外）

- リバイ・アドオン対応（任意額のチップ追加、リバイ回数管理）
- プレイヤー名簿管理
- チップリーダー/ショートスタック表示
- 賞金計算との連携
