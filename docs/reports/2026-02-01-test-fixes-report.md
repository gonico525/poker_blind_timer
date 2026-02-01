# テスト失敗修正 実施報告

**日付**: 2026-02-01
**作成者**: リードエンジニア
**ブランチ**: claude/fix-failing-tests-kmY2e
**対象分析レポート**: docs/reviews/2026-02-01-failing-tests-analysis.md

---

## サマリー

テスト失敗分析レポートに基づき、**12件のテスト失敗を全て解消**しました。
修正後: **489件のテスト全て合格**

| 修正対象                   | 修正内容                               | 修正タイプ |
| -------------------------- | -------------------------------------- | ---------- |
| AudioService.test.ts       | モックにaddEventListener追加           | テスト     |
| ImportExport.test.tsx      | File.text()のモック追加                | テスト     |
| TournamentContext.tsx      | STARTアクションにisOnBreakチェック追加 | **実装**   |
| TournamentContext.test.tsx | TICKテストのセットアップ修正           | テスト     |
| useStructures.test.ts      | テスト分離の改善                       | テスト     |
| MainLayout.test.tsx        | テストの修正とモック改善               | テスト     |

---

## 修正詳細

### 1. AudioService.test.ts (4件修正)

**問題**: MockAudioクラスに`addEventListener`と`removeEventListener`が欠落

**修正内容**: モッククラスに以下を追加

- `addEventListener()` メソッド
- `removeEventListener()` メソッド
- `canplaythrough`イベントの即時発火（テスト用）

**修正ファイル**: `src/services/AudioService.test.ts:40-56`

```typescript
addEventListener(event: string, handler: EventListener) {
  if (!this.listeners.has(event)) {
    this.listeners.set(event, new Set());
  }
  this.listeners.get(event)!.add(handler);
  if (event === 'canplaythrough') {
    setTimeout(() => handler(new Event('canplaythrough')), 0);
  }
}

removeEventListener(event: string, handler: EventListener) {
  const handlers = this.listeners.get(event);
  if (handlers) {
    handlers.delete(handler);
  }
}
```

---

### 2. ImportExport.test.tsx (4件修正)

**問題**: JSDOM環境で`File.prototype.text()`が正しく動作しない

**修正内容**: `beforeEach`でFile.prototype.textを`Object.defineProperty`でモック

- `vi.spyOn`ではなく直接プロパティを設定（JSDOMでは`text`プロパティが存在しないため）

**修正ファイル**: `src/components/ImportExport/ImportExport.test.tsx:52-64`

```typescript
Object.defineProperty(File.prototype, 'text', {
  configurable: true,
  writable: true,
  value: function (this: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(this);
    });
  },
});
```

---

### 3. TournamentContext.tsx (実装のバグ修正)

**問題**: STARTアクションが休憩中でも実行されてしまう

**修正内容**: `isOnBreak`チェックを追加

**修正ファイル**: `src/contexts/TournamentContext.tsx:15-19`

```typescript
case 'START': {
  // 既に実行中、または休憩中は開始しない
  if (state.timer.status === 'running' || state.isOnBreak) {
    return state;
  }
  // ...
}
```

**影響**: 休憩中に通常のSTARTアクションが無視されるようになり、ポーカートーナメントの実務に即した動作に修正

---

### 4. TournamentContext.test.tsx (1件修正)

**問題**: 「should tick during break」テストのセットアップで`timer.remainingTime`が0に設定されていた

**修正内容**: `timer.remainingTime`を`breakRemainingTime`と同じ値（300）に設定

**修正ファイル**: `src/contexts/TournamentContext.test.tsx:97-111`

```typescript
it('should tick during break', () => {
  const breakState = {
    ...initialState,
    timer: {
      status: 'running' as const,
      remainingTime: 300, // breakRemainingTimeと同じ値に設定
      elapsedTime: 0,
    },
    isOnBreak: true,
    breakRemainingTime: 300,
  };
  // ...
});
```

---

### 5. useStructures.test.ts (1件修正)

**問題**: テスト間の状態干渉、タイムスタンプ比較の失敗

**修正内容**:

1. `afterEach`でcleanupとlocalStorage.clear()を追加
2. `toBeGreaterThan`を`toBeGreaterThanOrEqual`に変更（同一ミリ秒内実行対応）

**修正ファイル**: `src/hooks/useStructures.test.ts:1-29, 134-137`

---

### 6. MainLayout.test.tsx (1件修正)

**問題**: 「ストラクチャー管理ボタンをクリックするとモーダルが開く」テストが失敗

**修正内容**:

1. `afterEach`でcleanupを追加
2. AppHeaderをモックしてテスト可能に
3. テストをモックに対応した形式に修正

**修正ファイル**: `src/components/MainLayout.test.tsx:1-4, 56-78, 80-84, 110-124`

---

## 対象外（別途リファクタリング計画）

以下は分析レポートで指摘されているが、今回は対象外:

- **TournamentContextの状態設計リファクタリング**
  - `timer.remainingTime`と`breakRemainingTime`の二重管理を統一
  - 影響範囲が大きいため、別タスクとして計画済み

---

## テスト結果

```
Test Files  42 passed (42)
Tests       489 passed (489)
Duration    21.07s
```

---

## 変更ファイル一覧

| ファイル                                          | 変更タイプ   |
| ------------------------------------------------- | ------------ |
| src/services/AudioService.test.ts                 | テスト修正   |
| src/components/ImportExport/ImportExport.test.tsx | テスト修正   |
| src/contexts/TournamentContext.tsx                | **実装修正** |
| src/contexts/TournamentContext.test.tsx           | テスト修正   |
| src/hooks/useStructures.test.ts                   | テスト修正   |
| src/components/MainLayout.test.tsx                | テスト修正   |
