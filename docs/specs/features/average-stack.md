# アベレージスタック機能仕様

## 1. 概要

アベレージスタック機能は、トーナメント進行中に各プレイヤーの平均チップ量を表示する機能である。ブラインドとの関係性（BB数）を確認することで、トーナメントの進行度合いを直感的に把握できる。

## 2. 機能要件

### 2.1 基本機能

- ストラクチャーに初期スタック（開始チップ数）を設定できる
- タイマー画面で参加人数と残り人数を設定できる
- アベレージスタック（平均チップ数）をリアルタイム表示する
- アベレージスタックのBB（ビッグブラインド）換算を併記する
- タイマーの状態（idle/running/paused）に関係なくプレイヤー数を変更できる
- ブレイク中もアベレージスタック情報を表示する

### 2.2 制限事項

- リバイ額が初期スタックと異なる場合のリバイ対応は本機能のスコープ外
- アドオン（追加チップ購入）対応は本機能のスコープ外
- プレイヤー名簿管理は本機能のスコープ外

### 2.3 リバイの運用方法

リバイ額 = 初期スタックの場合（一般的なトーナメントルール）、`totalPlayers` を +1 することで総チップ量を正しく反映できる。この運用方法はUIにヒントテキストとして表示する。

## 3. データモデル

### 3.1 Structure（ストラクチャー）への追加フィールド

```typescript
interface Structure {
  // 既存フィールド（省略）
  initialStack: number;  // 初期スタック（チップ数）。0 = 未設定
}
```

詳細は [02-data-models.md](../02-data-models.md#10-アベレージスタック関連のデータモデル) を参照。

### 3.2 TournamentState への追加フィールド

```typescript
interface TournamentState {
  // 既存フィールド（省略）
  totalPlayers: number;       // 参加人数（0 = 未設定）
  remainingPlayers: number;   // 残り人数
  initialStack: number;       // 現在のストラクチャーの初期スタック
}
```

### 3.3 制約条件

| フィールド | 最小値 | 最大値 | デフォルト | 備考 |
|---|---|---|---|---|
| initialStack | 0 | 10,000,000 | 0 | 0は未設定を意味する |
| totalPlayers | 0 | 10,000 | 0 | 0は未設定を意味する |
| remainingPlayers | 0 | totalPlayers | 0 | totalPlayersを超えない |

## 4. 計算ロジック

### 4.1 アベレージスタック

```
averageStack = (initialStack × totalPlayers) / remainingPlayers
```

- 結果は `Math.round()` で整数に丸める
- `initialStack`, `totalPlayers`, `remainingPlayers` のいずれかが 0 の場合は計算不可（null）

### 4.2 BB換算

```
averageStackBB = averageStack / currentBigBlind
```

- 結果は小数第1位まで表示（例: 42.5BB）
- `currentBigBlind` が 0 の場合は計算不可（null）

### 4.3 表示条件

アベレージスタック情報は以下の条件がすべて満たされた場合のみ表示する:

1. `initialStack > 0`（ストラクチャーに初期スタックが設定されている）
2. `totalPlayers > 0`（参加人数が設定されている）
3. `remainingPlayers > 0`（残り人数が1人以上）

### 4.4 計算例

| 初期スタック | 参加人数 | 残り人数 | BB | アベレージスタック | BB換算 |
|---|---|---|---|---|---|
| 30,000 | 10 | 10 | 200 | 30,000 | 150.0BB |
| 30,000 | 10 | 5 | 600 | 60,000 | 100.0BB |
| 30,000 | 10 | 2 | 2,000 | 150,000 | 75.0BB |
| 30,000 | 11（リバイ1回） | 10 | 200 | 33,000 | 165.0BB |

## 5. UIコンポーネント

### 5.1 ストラクチャー編集画面（StructureEditor）

レベル時間設定の付近に「初期スタック」入力欄を追加する。

**入力仕様:**

- ラベル: 「初期スタック」
- 入力タイプ: NumberInput コンポーネント
- 入力範囲: 0〜10,000,000
- ステップ: 1000
- プレースホルダ: 「0（未設定）」
- ヒントテキスト: 「0の場合、アベレージスタックは表示されません」

**デフォルトストラクチャーの場合:**

- デフォルトストラクチャーは編集不可のため、初期スタック値は表示のみ

### 5.2 タイマー画面（AverageStackDisplay）

#### コンポーネント配置

- **通常時**: NextLevelInfo の下（NextLevelInfo と TimerControls の間）に配置
- **ブレイク時**: BreakDisplay の下（BreakDisplay と TimerControls の間）に配置
- **配置の一貫性**: 通常時・ブレイク時ともに TimerControls の直上に表示される

**配置の根拠:**

BlindInfo と NextLevelInfo の間には配置しない。Timer → BlindInfo → NextLevelInfo はタイマーのコア情報群であり、この情報の流れを分断するとユーザーの視線移動が不自然になる。アベレージスタックは補助的な統計情報であり、コア情報群の下に配置するのが情報階層として適切である。

#### ビジュアルデザイン

NextLevelInfo と同系統のコンパクトなバー形式を採用する。

- **背景**: `--color-bg-tertiary`（NextLevelInfo と統一）
- **ボーダー**: `1px solid --color-border`、`border-radius: --radius-lg`
- **フォント**: 数値は `--font-family-numeric`、ラベルは `--font-family-sans`
- **サイズ**: NextLevelInfo と同程度のコンパクトさ（padding: spacing-3〜4）

#### 表示要素

**プレイヤー数入力エリア:**

| 要素 | 仕様 |
|---|---|
| 参加人数ラベル | 「エントリー」 |
| 参加人数入力 | NumberInput、0〜10,000 |
| 残り人数ラベル | 「残り」 |
| 残り人数入力 | NumberInput、0〜totalPlayers |
| 残り人数 −1 ボタン | 残り人数を1減らす専用ボタン（主要操作） |

**−1 ボタン詳細仕様:**

残り人数 −1 ボタンはトーナメント進行中の最頻出操作（プレイヤー脱落時）であり、以下の仕様で実装する:

- NumberInput の標準増減ボタンとは別の独立した専用ボタン
- アクセントカラー（`--color-accent` 系）で視覚的に目立たせる
- 最小タッチターゲット: 44×44px（WCAG 2.1準拠）
- ラベル: 「−1」
- 無効条件: `remainingPlayers <= 0`

**アベレージスタック表示エリア:**

| 要素 | 仕様 |
|---|---|
| ラベル | 「Avg Stack」 |
| チップ数 | カンマ区切り表示（例: 「33,000」） |
| BB換算 | 小数第1位まで表示（例: 「55.0BB」） |

#### レイアウトワイヤーフレーム

**デスクトップ（768px以上）: 横一列レイアウト**

```
┌──────────────────────────────────────────────────────────────────┐
│ エントリー [ 10 ] │ 残り [ 8 ] [−1] │ Avg Stack  37,500 (62.5BB)│
└──────────────────────────────────────────────────────────────────┘
```

- プレイヤー数入力エリアとアベレージスタック表示が横一列に並ぶ
- 区切り線またはスペースで視覚的にセクションを分離

**モバイル（768px未満）: 2行折り返しレイアウト**

```
┌─────────────────────────────────────┐
│  エントリー [10]   残り [8]  [−1]   │
│       Avg Stack: 37,500 (62.5BB)    │
└─────────────────────────────────────┘
```

- 1行目: プレイヤー数入力
- 2行目: アベレージスタック表示

#### 未設定時の表示

- `initialStack` が 0（ストラクチャーに初期スタック未設定）の場合:
  - コンポーネント全体を非表示にする（DOM に描画しない）
  - レイアウトに影響を与えない
- `totalPlayers` が 0（参加人数未設定）の場合:
  - プレイヤー数入力欄は表示する（参加人数の入力を促す）
  - アベレージスタック値は「---」のプレースホルダ表示

### 5.3 ブレイク中の表示

BreakDisplay 自体は変更しない。MainLayout で AverageStackDisplay を BreakDisplay の兄弟要素として描画する。

- 通常時・ブレイク時ともに AverageStackDisplay は同じコンポーネントインスタンスで、同じ配置位置（TimerControls の直上）に表示される
- BreakDisplay との疎結合を維持し、コンポーネントの再利用性を確保する
- ブレイク中もプレイヤー数の編集は操作可能（ブレイク中にプレイヤー数を確認・調整する運用を想定）

## 6. アクション定義

### 6.1 SET_PLAYERS

```typescript
{ type: 'SET_PLAYERS'; payload: { totalPlayers: number; remainingPlayers: number } }
```

**発行元:** AverageStackDisplay コンポーネント

**処理内容:**
- `totalPlayers` と `remainingPlayers` を更新
- `remainingPlayers` が `totalPlayers` を超えている場合、`totalPlayers` に切り詰める

**バリデーション:**
- `totalPlayers >= 0`
- `remainingPlayers >= 0`
- `remainingPlayers <= totalPlayers`（超える場合は totalPlayers に調整）

### 6.2 関連アクションへの影響

| アクション | アベレージスタック関連の処理 |
|---|---|
| `LOAD_STRUCTURE` | `totalPlayers`, `remainingPlayers` を 0 にリセット。`initialStack` を新ストラクチャーの値に更新 |
| `RESET` | `remainingPlayers` を `totalPlayers` にリセット |
| `START` / `PAUSE` / `TICK` | 影響なし |
| `NEXT_LEVEL` / `PREV_LEVEL` | 影響なし（ブラインド変更によりBB換算が自動更新される） |

## 7. 永続化

### 7.1 ストラクチャーの永続化

`initialStack` は `Structure` の一部として既存のストラクチャー保存処理に含まれる。

### 7.2 トーナメント状態の永続化

`totalPlayers`, `remainingPlayers` は `TournamentState` の一部として既存のトーナメント状態保存処理に含まれる。

### 7.3 後方互換性

既存の localStorage データにフィールドがない場合はデフォルト値（0）で補完する。詳細は [02-data-models.md](../02-data-models.md#105-localstorage-スキーマの後方互換性) を参照。

## 8. ドメインモデル

### 8.1 ファイル配置

`src/domain/models/AverageStack.ts` に計算ロジックを配置する。

### 8.2 公開関数

| 関数 | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `calculateAverageStack` | initialStack, totalPlayers, remainingPlayers | `number \| null` | 平均チップ数 |
| `calculateAverageStackBB` | averageStack, bigBlind | `number \| null` | BB換算値 |
| `canCalculateAverageStack` | initialStack, totalPlayers, remainingPlayers | `boolean` | 計算可否判定 |

## 9. エッジケース

### 9.1 残り人数が1人の場合

全チップが1人に集中するため、アベレージスタック = initialStack × totalPlayers となる。正常に表示する。

### 9.2 参加人数を後から変更した場合

`totalPlayers` を変更した際、`remainingPlayers` が新しい `totalPlayers` を超えている場合は `totalPlayers` に切り詰める。

### 9.3 ストラクチャー切り替え時

ストラクチャーをロードすると `totalPlayers` と `remainingPlayers` が 0 にリセットされる。新しいトーナメント設定への切り替えを意味するため。

### 9.4 タイマーリセット時

`RESET` アクション時に `remainingPlayers` を `totalPlayers` にリセットする。これはトーナメントの最初のレベルからのやり直しを意味するため。

### 9.5 最終レベル以降

最終レベルに到達してもアベレージスタック表示は継続する（残り人数が 0 でない限り）。

## 10. テストケース

### 10.1 計算ロジックのテスト

```
describe('AverageStack', () => {
  - calculateAverageStack: 正しく計算できる
  - calculateAverageStack: initialStack が 0 の場合 null を返す
  - calculateAverageStack: totalPlayers が 0 の場合 null を返す
  - calculateAverageStack: remainingPlayers が 0 の場合 null を返す
  - calculateAverageStack: 端数が正しく丸められる
  - calculateAverageStackBB: 正しくBB換算できる
  - calculateAverageStackBB: bigBlind が 0 の場合 null を返す
  - canCalculateAverageStack: 全フィールドが正の場合 true
  - canCalculateAverageStack: いずれかが 0 の場合 false
})
```

### 10.2 UIコンポーネントのテスト

```
describe('AverageStackDisplay', () => {
  - initialStack が 0 の場合、コンポーネントが非表示
  - totalPlayers が 0 の場合、アベレージスタック値が非表示
  - 正しい計算結果が表示される
  - 残り人数を減らすとアベレージスタックが増加する
  - remainingPlayers が totalPlayers を超えないことを確認
  - ブレイク中も表示される
  - プレイヤー数変更が dispatch を正しく呼び出す
})
```

### 10.3 Reducer のテスト

```
describe('TournamentReducer - SET_PLAYERS', () => {
  - totalPlayers と remainingPlayers が正しく設定される
  - remainingPlayers が totalPlayers を超えないよう調整される
  - LOAD_STRUCTURE 時にプレイヤー数がリセットされる
  - RESET 時に remainingPlayers が totalPlayers にリセットされる
})
```

### 10.4 後方互換性のテスト

```
describe('Backward Compatibility', () => {
  - initialStack フィールドなしのストラクチャーが正しく読み込まれる（デフォルト0）
  - totalPlayers/remainingPlayers なしのトーナメント状態が正しく復元される（デフォルト0）
})
```

## 11. まとめ

アベレージスタック機能の主要な実装ポイント:

1. **ストラクチャーへの初期スタック追加**: ブラインド構成と紐づく設定
2. **タイマー画面でのプレイヤー数管理**: 参加人数と残り人数の入力・表示
3. **リアルタイム計算**: チップ数とBB換算の自動表示
4. **後方互換性**: 既存データへの影響なし
5. **リバイ対応**: totalPlayers 増加による運用対応

---

## 関連ドキュメント

- [02-data-models.md](../02-data-models.md) - データモデル仕様
- [04-interface-definitions.md](../04-interface-definitions.md) - インターフェース定義
- [blinds.md](./blinds.md) - ブラインド管理機能
- [timer.md](./timer.md) - タイマー機能
- [presets.md](./presets.md) - プリセット管理機能

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-02-09 | 初版作成 | AI System Architect |
| 1.1 | 2026-02-11 | UI仕様の改善: 配置をNextLevelInfo下に確定、コンパクトバーデザイン、ブレイク時の統合方式変更（BreakDisplay非変更）、−1ボタン詳細仕様追加、レイアウトワイヤーフレーム追加 | AI Designer |
