# 休憩時間バグ修正計画

**日付**: 2026-02-02
**対象ブランチ**: `claude/fix-break-time-buttons-etKjj`
**優先度**: 高（ユーザー操作がブロックされる）
**背景**: 2026-02-01のタイマー状態統一リファクタリングで2件のバグが混入した

---

## 1. バグ1: 休憩中でSTART・RESUME・RESETが反応しない

### 1.1 症状

休憩タイマーが自動進行で開始された後、PAUSEを押すと停止する。
その後、START・RESUME・RESETのいずれも無視され、SKIP BREAKのみが動作する。

### 1.2 根本原因

`src/contexts/TournamentContext.tsx` のreducerで、2つのアクションが `isOnBreak` を Guard条件として持っている。

**START アクション（line 17）:**

```typescript
case 'START': {
  if (state.timer.status === 'running' || state.isOnBreak) {
    return state;  // ← isOnBreak が true なら常に早期リターン
  }
  ...
}
```

**RESET アクション（line 199）:**

```typescript
case 'RESET': {
  if (state.isOnBreak) {
    return state;  // ← 休憩中はリセットを全て拒否
  }
  ...
}
```

これが以下の2つのシナリオで問題になる。

| シナリオ | 状態遷移 | 失敗ポイント |
|----------|---------|-------------|
| 自動進行で休憩開始後にPAUSEした場合 | `isOnBreak:true, status:running` → PAUSE → `status:paused` → Resume(=START) | START の `isOnBreak` guard で拒否 |
| 手動NEXT_LEVELで休憩開始した場合 | `isOnBreak:true, status:idle` → START | START の `isOnBreak` guard で拒否 |
| 休憩中のRESET | `isOnBreak:true` → RESET | RESET の `isOnBreak` guard で拒否 |

**なぜPAUSEは動作するか**: PAUSEアクションは `isOnBreak` をチェックしないため、休憩中でも正常に `running → paused` に遷移する。
**なぜSKIP BREAKが動作するか**: SKIP_BREAKアクションは `isOnBreak` をチェックして `true` の場合に処理を実行するため正常に動作する。

### 1.3 修正方針

**START アクション**: `isOnBreak` の guard を削除する。STARTの本質的な幂等性guard は `status === 'running'`（既に実行中なら何もしない）だけで十分。休憩中でも `idle → running`・`paused → running` の遷移を許可する。

```typescript
case 'START': {
  if (state.timer.status === 'running') {
    return state;
  }
  return {
    ...state,
    timer: { ...state.timer, status: 'running' },
  };
}
```

**RESET アクション**: 休憩中にも RESET を許可し、休憩タイマーを初期値にリセットする。休憩中の場合は `breakConfig.duration` を残り時間として、`isOnBreak` は維持する。

```typescript
case 'RESET': {
  return {
    ...state,
    timer: {
      status: 'idle',
      remainingTime: state.isOnBreak
        ? state.breakConfig.duration
        : state.levelDuration,
      elapsedTime: 0,
    },
  };
}
```

---

## 2. バグ2: 休憩時間入力欄の単位不整合（表示「分」・実値「秒」）

### 2.1 症状

ストラクチャー管理の休憩時間入力欄のラベルは「分」だが、入力した数値がそのまま「秒」として保存される。
例: 「10」と入力 → 休憩時間は10秒になる。

### 2.2 根本原因

`src/components/StructureManagement/StructureEditor.tsx` で、`levelDuration` と `breakConfig.duration` の変換の扱いが異なっている。

| 項目 | 表示値（NumberInputのvalue） | 保存時の変換 | UIラベル | 正否 |
|------|---------------------------|------------|---------|------|
| `levelDuration` | `levelDuration / 60`（秒→分） | `minutes * 60`（分→秒） | `unit="分"` | 正しい |
| `breakConfig.duration` | `breakConfig.duration`（変換なし） | `duration: minutes`（変換なし） | `unit="分"` | **不正** |

具体的には以下2箇所で変換が抜けている。

**表示側（line 220）:**
```typescript
<NumberInput
  label="休憩時間"
  value={editedStructure.breakConfig.duration}  // ← 秒数をそのまま表示
  ...
  unit="分"
/>
```

**保存側（line 99-104）:**
```typescript
const handleBreakDurationChange = (minutes: number) => {
  setEditedStructure({
    ...editedStructure,
    breakConfig: { ...editedStructure.breakConfig, duration: minutes },
    // ← minutes * 60 に変換すべき
  });
};
```

さらに、デフォルトストラクチャーの `duration: 600`（600秒＝10分）を読み込むと、
NumberInput の `value={600}` となり `max={30}` を超える。
これは表示にも影響を与える可能性がある。

### 2.3 修正方針

`levelDuration` と同じ変換パターンを適用する。

**表示側**: `value` を `breakConfig.duration / 60` に変更。

**保存側**: `handleBreakDurationChange` で `duration: minutes * 60` に変更。

```typescript
// 表示
<NumberInput
  value={editedStructure.breakConfig.duration / 60}
  ...
/>

// 保存
const handleBreakDurationChange = (minutes: number) => {
  setEditedStructure({
    ...editedStructure,
    breakConfig: { ...editedStructure.breakConfig, duration: minutes * 60 },
  });
};
```

---

## 3. 影響範囲と変更対象ファイル

| ファイル | 変更箇所 | 変更内容 |
|----------|---------|---------|
| `src/contexts/TournamentContext.tsx` | START アクション (line 17) | `isOnBreak` guard を削除 |
| `src/contexts/TournamentContext.tsx` | RESET アクション (line 199) | 休憩中も許可し `breakConfig.duration` でリセット |
| `src/components/StructureManagement/StructureEditor.tsx` | handleBreakDurationChange (line 102) | `duration: minutes` → `duration: minutes * 60` |
| `src/components/StructureManagement/StructureEditor.tsx` | NumberInput value (line 220) | `duration` → `duration / 60` |

---

## 4. テスト更新の必要性

既存テストの確認と追加テストが必要な箇所：

| テストファイル | 確認・更新内容 |
|--------------|-------------|
| `src/contexts/TournamentContext.test.tsx` | START/RESET アクションの休憩中テストケースを追加・修正 |
| `src/components/StructureManagement/StructureEditor.test.tsx` | 休憩時間の入力・保存で分→秒変換を検証するケースを追加・修正 |

---

## 5. 検証方法

1. `npm run build` で型エラー0件を確認
2. `npm test` で全件パスを確認
3. 休憩フロー動作確認のポイント:
   - 休憩中に PAUSE → RESUME で正常に再開できる
   - 休憩中に RESET で休憩タイマーが初期値に戻る
   - 手動NEXT_LEVELで休憩開始後に START で休憩タイマーが開始できる
   - 休憩時間「10」と入力して保存し読み込むと「10」（分）で戻る
   - デフォルトストラクチャーの休憩時間が「10」（分）で正しく表示される
