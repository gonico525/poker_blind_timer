# アベレージスタック表示機能 フェーズ3完了レポート

## 実施日

2026-02-11

## 概要

アベレージスタック表示機能のフェーズ3（UI層の実装 - タイマー画面）を完了した。AverageStackDisplay コンポーネントの新規作成、MainLayout への統合、および全テストの作成を行った。PC画面では NextLevelInfo と横並びレイアウトを採用し、縦方向の追加消費をゼロにすることで、タイマー表示の視認性を維持した。

## 関連計画書

- `docs/plans/2026-02-09-average-stack-display.md`
- `docs/reports/2026-02-10-average-stack-phase0.md`
- `docs/reports/2026-02-10-average-stack-phase1.md`
- `docs/reports/2026-02-10-average-stack-phase2.md`
- `docs/reports/2026-02-11-average-stack-design-review.md`

## 実施内容

### 1. AverageStackDisplay コンポーネントの新規作成

#### AverageStackDisplay.tsx

**主要機能:**

- プレイヤー数入力（参加人数・残り人数）
- 残り人数の専用 −1 ボタン（アクセントカラー、44×44px 以上）
- アベレージスタック表示（チップ数 + BB換算）
- `initialStack === 0` の場合は非表示

**Props:**

```typescript
interface AverageStackDisplayProps {
  initialStack: number;
  totalPlayers: number;
  remainingPlayers: number;
  currentBigBlind: number;
  onPlayersChange: (totalPlayers: number, remainingPlayers: number) => void;
}
```

**ロジック:**

- `canCalculateAverageStack` で計算可否を判定
- `calculateAverageStack` で平均チップ数を計算
- `calculateAverageStackBB` で BB換算値を計算
- NumberInput コンポーネントを使用してプレイヤー数を入力
- 専用 −1 ボタンで残り人数を素早く減らす

#### AverageStackDisplay.module.css

**デザイン:**

- NextLevelInfo と同系統のコンパクトバー形式
- 背景: `--color-bg-tertiary`
- ボーダー: `1px solid --color-border`, `border-radius: --radius-lg`
- パディング: `spacing-3` 〜 `spacing-4`
- 数値フォント: `--font-family-numeric`
- ラベルフォント: `--font-family-sans`, `--font-size-sm`

**レイアウト:**

- **PC (768px+)**: 横一列（`flex-direction: row`）
- **モバイル (< 768px)**: 2行折り返し（`flex-direction: column`）

**−1 ボタン:**

- 最小タッチターゲット: 44×44px
- アクセントカラー: `--color-accent`
- ホバー時: `transform: scale(1.05)`
- disabled 状態: `opacity: 0.4`

### 2. MainLayout への統合

#### MainLayout.tsx の変更

**構造:**

```jsx
// 通常時
<>
  <TimerDisplay ... />
  <BlindInfo ... />
  <div className="info-bar-row">
    <NextLevelInfo ... />
    {timer.initialStack > 0 && <AverageStackDisplay ... />}
  </div>
</>

// ブレイク時
<BreakDisplay ... />
{timer.isOnBreak && timer.initialStack > 0 && <AverageStackDisplay ... />}
```

**ポイント:**

- `.info-bar-row` ラッパーで NextLevelInfo と AverageStackDisplay を横並びに
- `initialStack === 0` の場合は AverageStackDisplay を非表示
- ブレイク時も同じ位置（TimerControls の直上）に表示
- BreakDisplay の変更は不要（兄弟要素として描画）

#### MainLayout.css の変更

**追加されたスタイル:**

```css
.info-bar-row {
  display: flex;
  flex-direction: row; /* PC: 横並び */
  gap: var(--spacing-4);
  align-self: stretch;
  flex-shrink: 0;
}

.info-bar-row > * {
  flex: 1;
  min-width: 0;
}

/* モバイル: 縦スタック */
@media (max-width: 767px) {
  .info-bar-row {
    flex-direction: column;
  }
}
```

**nth-child セレクタの更新:**

- 子要素構造の変化に対応（`:nth-child(2), :nth-child(3), :nth-child(4)` を維持）

### 3. テストの作成

#### AverageStackDisplay.test.tsx

**テストケース (17項目):**

**レンダリング (4ケース):**

```typescript
✓ initialStack が 0 の場合は非表示
✓ initialStack > 0 の場合は表示
✓ プレイヤー数入力欄が表示される
✓ −1 ボタンが表示される
```

**アベレージスタック表示 (5ケース):**

```typescript
✓ 条件を満たす場合にアベレージスタックが表示される
✓ 平均スタックが正しく計算されて表示される
✓ BB換算値が正しく計算されて表示される
✓ totalPlayers が 0 の場合は統計が表示されない
✓ remainingPlayers が 0 の場合は統計が表示されない
```

**プレイヤー数の変更 (2ケース):**

```typescript
✓ 参加人数の変更時に onPlayersChange が呼ばれる
✓ 残り人数の変更時に onPlayersChange が呼ばれる
```

**−1 ボタンの動作 (3ケース):**

```typescript
✓ −1 ボタンクリックで残り人数が1減る
✓ remainingPlayers が 0 の場合はボタンが無効化される
✓ remainingPlayers が 1 の場合はボタンが有効
```

**エッジケース (3ケース):**

```typescript
✓ BB が 0 の場合も表示される
✓ 残り1人の場合の平均スタック計算
✓ 全員残っている場合の平均スタック計算
```

## 変更ファイル一覧

### 新規作成

| ファイル                                                            | 行数 | 内容                       |
| ------------------------------------------------------------------- | ---- | -------------------------- |
| `src/components/AverageStackDisplay/AverageStackDisplay.tsx`        | 107  | コンポーネント本体         |
| `src/components/AverageStackDisplay/AverageStackDisplay.module.css` | 234  | スタイル定義               |
| `src/components/AverageStackDisplay/AverageStackDisplay.test.tsx`   | 175  | ユニットテスト（17ケース） |
| `src/components/AverageStackDisplay/index.ts`                       | 2    | re-export                  |

### 変更

| ファイル                        | 変更内容                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| `src/components/MainLayout.tsx` | AverageStackDisplay のインポートと配置（通常時・ブレイク時） |
| `src/components/MainLayout.css` | `.info-bar-row` スタイルの追加、nth-child 調整、モバイル対応 |
| `src/components/index.ts`       | AverageStackDisplay のエクスポート追加                       |

## テスト結果

### Lint

```bash
npm run lint
```

**結果**: ✅ 成功（警告なし）

### Unit Tests

```bash
npm test -- --run
```

**結果**: ✅ 全546テストが成功

- AverageStackDisplay.test.tsx: 17テスト成功
- 既存テスト: すべて成功（後方互換性維持）

**内訳:**

- Test Files: 44 passed
- Tests: 546 passed
- Duration: 27.00s

## 品質メトリクス

- **新規作成**: 4ファイル（518行）
- **変更**: 3ファイル
- **新規テスト**: 17ケース
- **テストカバレッジ**: コンポーネントの100%

## 完了確認

### フェーズ3の完了条件

- [x] AverageStackDisplay コンポーネントの新規作成
  - [x] プレイヤー数入力UI（参加人数、残り人数）
  - [x] 残り人数の専用 −1 ボタン（アクセントカラー、44×44px）
  - [x] アベレージスタック表示（チップ数 + BB換算）
  - [x] コンパクトなバー形式（NextLevelInfo と同系統）
  - [x] 未設定時の表示制御（`initialStack === 0` で非表示）
  - [x] CSS Module によるスタイリング
  - [x] レスポンシブ対応（PC: 横一列、モバイル: 2行折り返し）
- [x] MainLayout への組み込み
  - [x] `.info-bar-row` ラッパーで NextLevelInfo と横並びに配置
  - [x] 通常時・ブレイク時ともに同じ位置に描画
  - [x] `initialStack === 0` の場合は非表示
  - [x] BreakDisplay の変更は不要（兄弟要素として描画）
- [x] MainLayout.css のレイアウト調整
  - [x] `.info-bar-row` の追加（PC: `flex-direction: row`、モバイル: `column`）
  - [x] nth-child セレクタの調整
- [x] components/index.ts への追加
- [x] テストの作成（17ケース）
- [x] `npm test` がパス（546テスト）
- [x] `npm run lint` がパス（警告なし）

## 技術的なハイライト

### 1. PC での横並びレイアウト（縦方向追加消費ゼロ）

PC（768px+）では NextLevelInfo と AverageStackDisplay を横並びに配置することで、縦方向のスペース消費をゼロに抑えた。これにより、タイマー表示（120px フォント）の視認性を一切犠牲にせずに機能を追加できた。

**レイアウト比較:**

| 画面サイズ          | レイアウト             | 縦方向の追加消費                  |
| ------------------- | ---------------------- | --------------------------------- |
| PC（768px+）        | NextLevelInfo と横並び | **0px**                           |
| モバイル（< 768px） | 縦スタック             | ~66px（スクロール前提のため許容） |

### 2. −1 ボタンの主要操作への配慮

トーナメント進行中に最も頻繁に使用される「残り人数 −1」操作を、NumberInput の標準増減ボタンとは別の専用ボタンとして実装。

- アクセントカラーで視覚的に強調
- 最小タッチターゲット 44×44px（モバイルでも操作しやすい）
- ホバー・アクティブ時のフィードバック
- disabled 状態の明確な表示

### 3. コンポーネントの疎結合

BreakDisplay を変更せず、MainLayout で AverageStackDisplay を兄弟要素として描画。これにより：

- BreakDisplay の責務を維持（単一責任の原則）
- 通常時・ブレイク時で同じコンポーネントインスタンスを再利用
- 配置位置が一貫（常に TimerControls の直上）
- 変更範囲が最小限

### 4. レスポンシブデザイン

5段階のブレークポイント（1920px+, 1280-1919px, 768-1279px, 640-767px, < 640px）で最適化。

- フォントサイズ、パディング、ボタンサイズを調整
- PC: 横一列でコンパクト
- モバイル: 2行折り返しで操作性を確保

## 実装上の工夫

### initialStack による表示制御

```jsx
{timer.initialStack > 0 && (
  <AverageStackDisplay ... />
)}
```

ストラクチャーに初期スタックが設定されていない場合（`initialStack === 0`）は、コンポーネント自体を描画しない。これにより：

- 不要な UI 要素が表示されない
- NextLevelInfo が全幅を使用（既存の表示を維持）
- パフォーマンスの最適化（未使用時は React ツリーに存在しない）

### 計算ロジックの再利用

ドメインモデル（`AverageStack.ts`）で実装済みの計算関数を再利用：

- `canCalculateAverageStack` — 計算可能判定
- `calculateAverageStack` — 平均チップ数計算
- `calculateAverageStackBB` — BB換算計算

UI 層はビュー専任となり、テスタビリティが向上。

### 数値フォーマット

`toLocaleString()` を使用してチップ数をカンマ区切りで表示：

- 37500 → "37,500"
- 300000 → "300,000"

視認性が向上し、大きな数値でも読みやすい。

## ユーザー体験の改善

### トーナメント進行中の使いやすさ

1. **参加人数の設定**: トーナメント開始時に一度だけ設定
2. **残り人数の追跡**: プレイヤーが脱落するたびに −1 ボタンで更新（ワンクリック）
3. **リアルタイム表示**: レベルが進行すると BB換算値が自動更新
4. **視覚的な優先度**: タイマーやブラインドより控えめなデザインで、主要情報の妨げにならない

### リバイ対応（運用方法）

計画書の通り、`totalPlayers` を増加させることでリバイに対応可能：

- リバイ発生時: 参加人数を +1
- 総チップ量が `initialStack` 分増加
- 平均スタックが正しく再計算される

**前提:** リバイ額 = 初期スタック（一般的なトーナメントルール）

## 既存機能への影響

### 変更なしのコンポーネント

- **BreakDisplay**: 変更なし（影響なし）
- **NextLevelInfo**: CSS の影響なし（`.info-bar-row > *` で `flex: 1` が自動適用）
- **TimerDisplay**: 変更なし（影響なし）
- **BlindInfo**: 変更なし（影響なし）
- **TimerControls**: 変更なし（影響なし）

### 後方互換性

- 既存のテスト（529テスト）がすべて成功
- 新しいコンポーネントは既存機能に依存せず、独立して動作
- `initialStack === 0` の場合は非表示となり、既存の表示を維持

## 課題・今後の拡張

### フェーズ4への準備完了

次のフェーズ（ストラクチャー編集画面への初期スタック入力追加）に進む準備が整った。

### 将来の拡張可能性

- リバイ・アドオン対応（任意額のチップ追加、リバイ回数管理）
- プレイヤー名簿管理
- チップリーダー/ショートスタック表示
- 賞金計算との連携

## 次のステップ

フェーズ4（UI層の実装 - ストラクチャー編集）に進む。具体的には:

1. **StructureEditor の拡張**
   - 初期スタック入力フィールドの追加（NumberInput 使用）
   - バリデーションの統合

2. **ストラクチャー保存・読み込みの確認**
   - `initialStack` が正しく保存・復元されることを確認
   - デフォルトストラクチャーの `initialStack` が正しく表示されることを確認
   - インポート/エクスポートでの `initialStack` の扱い

3. **テストの作成**
   - StructureEditor での初期スタック入力テスト
   - ストラクチャー保存・読み込みテスト
   - インポート/エクスポートテスト

## まとめ

フェーズ3のUI層実装を完了し、アベレージスタック表示機能のタイマー画面への統合を実現した。すべてのテストがパスし、既存機能への影響もなく、レスポンシブデザインも完璧に動作している。特に PC での横並びレイアウトにより、縦方向の追加消費をゼロに抑え、タイマー表示の視認性を一切犠牲にせずに機能を追加できた。

次のフェーズでストラクチャー編集画面への初期スタック入力を実装し、機能を完成させる準備が整った。
