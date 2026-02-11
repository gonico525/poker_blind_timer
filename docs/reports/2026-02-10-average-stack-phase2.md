# アベレージスタック表示機能 フェーズ2完了レポート

## 実施日

2026-02-10

## 概要

アベレージスタック表示機能のフェーズ2（状態管理層の実装）を完了した。TournamentContextの拡張、useTimerフックの拡張、localStorage永続化の対応、および全テストの作成を行った。

## 関連計画書

- `docs/plans/2026-02-09-average-stack-display.md`
- `docs/reports/2026-02-10-average-stack-phase0.md`
- `docs/reports/2026-02-10-average-stack-phase1.md`

## 実施内容

### 1. TournamentContextの拡張 (`src/contexts/TournamentContext.tsx`)

#### 初期状態の更新

```typescript
{
  // ... 既存フィールド
  totalPlayers: 0,
  remainingPlayers: 0,
  initialStack: 0,
}
```

#### SET_PLAYERSアクションの追加

```typescript
case 'SET_PLAYERS': {
  const { totalPlayers, remainingPlayers } = action.payload;
  // remainingPlayers が totalPlayers を超えないように調整
  const adjustedRemainingPlayers = Math.min(
    remainingPlayers,
    totalPlayers
  );
  return {
    ...state,
    totalPlayers,
    remainingPlayers: adjustedRemainingPlayers,
  };
}
```

**機能:**

- `totalPlayers`と`remainingPlayers`を設定
- `remainingPlayers`が`totalPlayers`を超える場合は自動調整

#### LOAD_STRUCTUREアクションの更新

```typescript
case 'LOAD_STRUCTURE': {
  const { structure } = action.payload;
  return {
    ...state,
    // ... 既存処理
    initialStack: structure.initialStack,
    totalPlayers: 0,
    remainingPlayers: 0,
  };
}
```

**動作:**

- 新しいストラクチャーの`initialStack`を設定
- プレイヤー数を0にリセット（新しいトーナメント設定への切り替えを意味）

#### RESETアクションの更新

```typescript
case 'RESET': {
  return {
    ...state,
    timer: { /* タイマーリセット */ },
    remainingPlayers: state.totalPlayers, // 追加
  };
}
```

**動作:**

- `remainingPlayers`を`totalPlayers`にリセット
- トーナメントの最初のレベルからのやり直しを表現

### 2. useTimerフックの拡張 (`src/hooks/useTimer.ts`)

#### setPlayers関数の追加

```typescript
const setPlayers = useCallback(
  (totalPlayers: number, remainingPlayers: number) => {
    dispatch({
      type: 'SET_PLAYERS',
      payload: { totalPlayers, remainingPlayers },
    });
  },
  [dispatch]
);
```

#### 戻り値の拡張

追加されたプロパティ:

- `totalPlayers: number` — 参加人数
- `remainingPlayers: number` — 残り人数
- `initialStack: number` — 現在のストラクチャーの初期スタック
- `setPlayers: (total: number, remaining: number) => void` — プレイヤー数設定関数

### 3. localStorage永続化の対応

#### mergeWithDefaultStructuresの拡張 (`src/domain/models/Structure.ts`)

```typescript
export function mergeWithDefaultStructures(
  userStructures: Structure[]
): Structure[] {
  const defaults = createDefaultStructures();
  const userStructureIds = new Set(userStructures.map((s) => s.id));

  // 後方互換性: initialStack フィールドがない場合は 0 で補完
  const normalizedUserStructures = userStructures.map((structure) => ({
    ...structure,
    initialStack: structure.initialStack ?? 0,
  }));

  return [
    ...defaults.filter((d) => !userStructureIds.has(d.id)),
    ...normalizedUserStructures,
  ];
}
```

**後方互換性:**

- 既存のStructureデータに`initialStack`フィールドがない場合、デフォルト値（0）で補完
- ユーザーが保存した古いデータでもエラーなく読み込める

**TournamentStateの後方互換性:**

- TournamentContextの初期状態でデフォルト値（0）を設定済み
- 将来、localStorage保存・復元が実装されても対応可能

### 4. テストの作成

#### TournamentContext.test.tsx

既存のテストファイルに以下を追加:

**initialStateの更新:**

- `totalPlayers: 0`
- `remainingPlayers: 0`
- `initialStack: 0`

**SET_PLAYERSアクションのテスト (4ケース):**

```typescript
✓ should set totalPlayers and remainingPlayers
✓ should adjust remainingPlayers if it exceeds totalPlayers
✓ should handle zero values
✓ should allow updating totalPlayers while keeping remainingPlayers
```

**LOAD_STRUCTUREアクションのテスト (追加2ケース):**

```typescript
✓ should load initialStack from structure
✓ should reset player counts when loading structure
```

**RESETアクションのテスト (追加1ケース):**

```typescript
✓ should reset remainingPlayers to totalPlayers
```

#### Structure.test.ts

デフォルトストラクチャーと後方互換性のテストを追加:

**後方互換性のテスト (2ケース):**

```typescript
✓ should add initialStack to structures missing the field (backward compatibility)
✓ should preserve existing initialStack values
```

**デフォルトストラクチャーのテスト (追加1ケース):**

```typescript
✓ should have initialStack defined for all default structures
  - Deepstack: 50000
  - Standard: 30000
  - Turbo: 25000
  - Hyper Turbo: 20000
```

## 変更ファイル一覧

### 変更

| ファイル                                  | 変更内容                                                           |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `src/contexts/TournamentContext.tsx`      | 初期状態追加、SET_PLAYERSアクション実装、LOAD_STRUCTURE/RESET更新  |
| `src/hooks/useTimer.ts`                   | setPlayers関数追加、totalPlayers/remainingPlayers/initialStack公開 |
| `src/domain/models/Structure.ts`          | mergeWithDefaultStructuresに後方互換性処理追加                     |
| `src/contexts/TournamentContext.test.tsx` | initialState更新、新規テスト7ケース追加                            |
| `src/domain/models/Structure.test.ts`     | 既存モックデータ更新、新規テスト3ケース追加                        |

## テスト結果

### Lint

```bash
npm run lint
```

**結果:** ✅ 成功（警告なし）

### Unit Tests

```bash
npm test -- --run
```

**結果:** ✅ 全529テストが成功

- TournamentContext: 45テスト（+7）
- Structure: 13テスト（+3）
- 既存テスト: すべて成功（後方互換性維持）

**新規追加テスト:** 10ケース

## 品質メトリクス

- **変更ファイル**: 5ファイル
- **新規テスト**: 10ケース
- **総テスト数**: 529テスト（全パス）
- **lintエラー**: 0件
- **lintワーニング**: 0件

## 完了確認

### フェーズ2の完了条件

- [x] TournamentContextの拡張
  - [x] 初期状態に新フィールド追加
  - [x] SET_PLAYERSアクションの実装
  - [x] LOAD_STRUCTURE時のプレイヤー数リセット
  - [x] RESET時のremainingPlayersリセット
- [x] useTimerフックの拡張
  - [x] totalPlayers、remainingPlayers、initialStackの公開
  - [x] setPlayers関数の実装
- [x] localStorage永続化の対応
  - [x] 後方互換性の実装（initialStack補完）
- [x] テストの作成
  - [x] SET_PLAYERSアクションテスト
  - [x] LOAD_STRUCTURE時のテスト
  - [x] RESET時のテスト
  - [x] 後方互換性テスト
- [x] `npm test` がパス（529テスト）
- [x] `npm run lint` がパス（警告なし）

## 技術的なハイライト

### 1. remainingPlayersの自動調整

SET_PLAYERSアクションで、`remainingPlayers`が`totalPlayers`を超える場合に自動的に調整する処理を実装。これにより、データの整合性が保証される。

### 2. 後方互換性の確保

`mergeWithDefaultStructures`関数で、`initialStack`フィールドがない古いデータを自動補完。既存ユーザーのデータが破損しない。

### 3. 状態リセットの一貫性

- **LOAD_STRUCTURE**: プレイヤー数を0にリセット（新しいトーナメント開始）
- **RESET**: remainingPlayersをtotalPlayersにリセット（現在のトーナメントの再スタート）

この設計により、ユーザーの意図に沿った動作を実現。

### 4. テストカバレッジ

- 正常系の動作テスト
- 境界値テスト（remainingPlayers > totalPlayers）
- エッジケース（ゼロ値）
- 後方互換性テスト

## 課題・注意事項

### TournamentStateの永続化

現時点では、TournamentStateのlocalStorage保存・復元機能は実装されていない。ただし、将来実装される場合に備えて：

- 初期状態でデフォルト値（0）を設定済み
- StorageServiceは既にサポートしている
- 型定義は完全に対応済み

### 既存テストへの影響

既存の全テストが引き続き成功しており、後方互換性が維持されている。新フィールドはすべてオプショナルなデフォルト値（0）を持つため、破壊的変更はない。

## 次のステップ

フェーズ3（UI層の実装 - タイマー画面）に進む。具体的には:

1. **AverageStackDisplayコンポーネントの新規作成**
   - プレイヤー数入力UI
   - 残り人数の＋/−ボタン
   - アベレージスタック表示（チップ数 + BB換算）
   - CSS Module によるスタイリング

2. **MainLayoutへの組み込み**
   - 通常時: BlindInfo / NextLevelInfo の付近に配置
   - ブレイク時: BreakDisplay 内または近くに配置

3. **フォーマットユーティリティの活用**
   - チップ数の表示フォーマット（カンマ区切り）
   - BB数の表示フォーマット（小数第1位）

4. **テストの作成**
   - AverageStackDisplay のレンダリングテスト
   - プレイヤー数変更時の表示更新テスト
   - 未設定時の非表示テスト
   - ブレイク中の表示テスト

## まとめ

フェーズ2の状態管理層実装を完了し、アベレージスタック機能のコアとなる状態管理ロジックを確立した。すべてのテストがパスし、既存機能への影響もなく、後方互換性も確保されている。次のフェーズでUI層の実装に進む準備が整った。

## コミット準備

実装が完了し、以下の準備ができている:

- すべてのコード変更が完了
- lintチェックがパス
- 全テストがパス（529テスト）
- レポートドキュメント作成完了

次のステップとして、変更をコミットし、指定されたブランチにプッシュする。
