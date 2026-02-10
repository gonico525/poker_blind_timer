# アベレージスタック表示機能 フェーズ0完了レポート

## 実施日

2026-02-10

## 概要

アベレージスタック表示機能の実装に先立ち、フェーズ0（仕様書の更新・作成）を完了した。実装計画に基づき、データモデル仕様・インターフェース定義・フィーチャー仕様書の3ドキュメントを更新・作成した。

## 関連計画書

- `docs/plans/2026-02-09-average-stack-display.md`

## 実施内容

### 1. データモデル仕様の更新 (`docs/specs/02-data-models.md`)

セクション10「アベレージスタック関連のデータモデル」を追加。

- **Structure 型への `initialStack` 追加**: 型定義、バリデーション関数、入力範囲（0〜10,000,000）を記載
- **デフォルトストラクチャーの初期スタック値**: Deepstack=50000, Standard=30000, Turbo=25000, Hyper Turbo=20000
- **TournamentState への `totalPlayers` / `remainingPlayers` 追加**: 型定義、制約条件（remainingPlayers ≤ totalPlayers）、動作仕様を記載
- **ドメインロジック仕様**: `calculateAverageStack`, `calculateAverageStackBB`, `canCalculateAverageStack` の関数シグネチャ・ロジックを定義
- **localStorage スキーマの後方互換性**: `?? 0` によるデフォルト値補完のパターンを記載

### 2. インターフェース定義の更新 (`docs/specs/04-interface-definitions.md`)

セクション10「アベレージスタック関連のインターフェース」を追加。

- **`SET_PLAYERS` アクション**: payload定義、バリデーションルール、処理フロー図を追加
- **`LOAD_PRESET` フローの更新**: `initialStack` の引き渡し、`totalPlayers` / `remainingPlayers` の 0 リセットを追記
- **`RESET` 時の動作**: `remainingPlayers` を `totalPlayers` にリセットする仕様を追記
- **データフロー図**: Structure.initialStack → TournamentState → calculateAverageStack → UI の流れを図示

### 3. フィーチャー仕様書の新規作成 (`docs/specs/features/average-stack.md`)

アベレージスタック機能の詳細仕様を新規作成。

- **機能要件**: 初期スタック設定、プレイヤー数管理、リアルタイム表示、BB換算
- **計算ロジック**: 計算式、表示条件、端数処理、計算例テーブル
- **UI仕様**: StructureEditor への入力欄追加、AverageStackDisplay コンポーネント、ブレイク中表示
- **アクション定義**: `SET_PLAYERS` の発行元・処理内容、関連アクションへの影響マトリクス
- **エッジケース**: 残り1人、参加人数変更、ストラクチャー切替、リセット時、最終レベル
- **テストケース**: 計算ロジック（9項目）、UI（7項目）、Reducer（4項目）、後方互換性（2項目）
- **リバイの運用方法**: `totalPlayers` 増加による対応と制約を記載

## 変更ファイル一覧

| ファイル | 操作 | 内容 |
|---|---|---|
| `docs/specs/02-data-models.md` | 更新 | セクション10追加（約175行） |
| `docs/specs/04-interface-definitions.md` | 更新 | セクション10追加、LOAD_PRESETフロー更新（約45行） |
| `docs/specs/features/average-stack.md` | 新規 | フィーチャー仕様書（約320行） |
| `docs/plans/2026-02-09-average-stack-display.md` | 新規 | 実装計画書（別作業で作成済み） |

## 次のステップ

フェーズ1（ドメイン層の実装）に進む。具体的には:

1. `src/types/domain.ts` — Structure / TournamentState 型の拡張
2. `src/types/context.ts` — SET_PLAYERS アクション型の追加
3. `src/domain/models/AverageStack.ts` — 計算ロジックの実装とテスト
4. `src/domain/models/Structure.ts` — デフォルトストラクチャーに initialStack 追加
5. `src/utils/constants.ts` — 定数追加
6. `src/utils/validation.ts` — バリデーション関数追加
