# テスト失敗分析レポート

**日付**: 2026-02-01
**作成者**: リードエンジニア
**ブランチ**: claude/fix-failing-tests-X6TRI

## サマリー

全体で **489件中12件のテストが失敗** しています。失敗しているテストは5つのファイルに分散しています。

| ファイル                                            | 失敗数 | 深刻度 |
| --------------------------------------------------- | ------ | ------ |
| `src/services/AudioService.test.ts`                 | 4      | 中     |
| `src/components/ImportExport/ImportExport.test.tsx` | 4      | 中     |
| `src/contexts/TournamentContext.test.tsx`           | 2      | 高     |
| `src/hooks/useStructures.test.ts`                   | 1      | 低     |
| `src/components/MainLayout.test.tsx`                | 1      | 低     |

---

## 1. AudioService.test.ts (4件失敗)

### 失敗テスト

1. `should preload all audio files` - 6個のAudio要素が作成されるが、期待値は3個
2. `should play level change sound` - `play()`が呼び出されていない
3. `should set volume for all audio elements` - 音量が0.5に設定されていない
4. `should clamp volume between 0 and 1` - 音量クランプが機能していない

### 根本原因

**テストのモックが不完全**

`AudioService.test.ts`で作成されているモックAudioクラスに`addEventListener`メソッドが実装されていません。

```typescript
// 現在のモック（問題箇所）
const MockAudio = class {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  // addEventListener が欠落している！
};
```

`AudioService.ts`の`loadAudio`関数は`audio.addEventListener('error', ...)`と`audio.addEventListener('canplaythrough', ...)`を呼び出しています（36行目、46行目）。モックにこのメソッドがないため、`TypeError: audio.addEventListener is not a function`がスローされ、catch文で空のAudioオブジェクトが返されます。

### 修正方針

モックAudioクラスに`addEventListener`と`removeEventListener`を追加する必要があります：

```typescript
const MockAudio = class {
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  private _volume = 1;
  private _currentTime = 0;
  private listeners: Map<string, Function[]> = new Map();

  addEventListener(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);

    // canplaythroughイベントを即座に発火させる（テスト用）
    if (event === 'canplaythrough') {
      setTimeout(() => handler(), 0);
    }
  }

  removeEventListener(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }
  // ... 残りのプロパティ
};
```

---

## 2. ImportExport.test.tsx (4件失敗)

### 失敗テスト

1. `should import valid JSON file`
2. `should show success message after import`
3. `should show error for invalid JSON`
4. `should show error for non-array JSON`

### 根本原因

**File.text()メソッドのJSDOM環境での動作問題**

全てのインポート関連テストで「インポートに失敗しました」というエラーメッセージが表示されています。これは`File.text()`の呼び出しで例外が発生し、汎用的なエラーハンドラーにキャッチされているためです。

JSDOM環境では`File.prototype.text()`が正しく実装されていない、または予期せぬ例外をスローしている可能性があります。

### 修正方針

**オプション1**: テスト内で`File.prototype.text`をモックする

```typescript
beforeEach(() => {
  vi.spyOn(File.prototype, 'text').mockImplementation(function (this: File) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(this);
    });
  });
});
```

**オプション2**: FileReaderを使用するようコンポーネントを修正する

```typescript
// ImportExport.tsx の handleFileChange を修正
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const data = JSON.parse(text);
      // ... 残りの処理
    } catch (err) {
      // ... エラーハンドリング
    }
  };
  reader.onerror = () => {
    setError('ファイルの読み込みに失敗しました');
  };
  reader.readAsText(file);
};
```

---

## 3. TournamentContext.test.tsx (2件失敗)

### 失敗テスト

1. `should not start during break` - 休憩中にSTARTアクションが状態を変更してしまう
2. `should tick during break` - `breakRemainingTime`が減少しない

### 仕様書との照合

| 観点          | 仕様書                                          | 実装                            | テスト               |
| ------------- | ----------------------------------------------- | ------------------------------- | -------------------- |
| 休憩中のSTART | 明確な記載なし（`START_BREAK_TIMER`が別途存在） | `isOnBreak`をチェックしていない | 休憩中は無視を期待   |
| 休憩中のTICK  | 「残り時間をカウントダウン」と明記              | `timer.remainingTime`を操作     | セットアップが不適切 |

### 根本原因

#### 問題1: STARTアクションの休憩チェック欠落（実装のバグ）

テストでは`isOnBreak: true`の時にSTARTアクションが無視されることを期待していますが、実装では`isOnBreak`をチェックしていません。

ポーカートーナメントの実務観点からも、休憩中に通常の「開始」ボタンを押しても無視されるべきです（休憩タイマー開始には専用の`START_BREAK_TIMER`アクションが存在）。

```typescript
// TournamentContext.tsx (現在のコード - バグ)
case 'START': {
  if (state.timer.status === 'running') {
    return state;
  }
  // isOnBreak のチェックが欠落している
  return {
    ...state,
    timer: { ...state.timer, status: 'running' },
  };
}
```

#### 問題2: 休憩中TICKのテストセットアップ誤り（テストのミス）

テストでは`timer.remainingTime: 0`でセットアップしていますが、実装では`timer.remainingTime`をデクリメントし、それを`breakRemainingTime`に反映する設計になっています。テストのセットアップが実装の期待する初期状態と一致していません。

### 設計上の課題（別途リファクタリング対象）

現在の設計には以下の問題があります：

```typescript
// 現在の状態構造（二重管理）
{
  timer: {
    remainingTime: number,  // ← レベルにも休憩にも使われる
  },
  breakRemainingTime: number,   // ← 休憩専用の残り時間（重複）
  isOnBreak: boolean,
}
```

**問題点**: `timer.remainingTime`と`breakRemainingTime`が二重管理になっており、混乱の原因となっている。

**推奨設計**: ポーカートーナメントでは同時に動くタイマーは1つだけなので、統一タイマー設計が望ましい。

```typescript
// 推奨される設計（将来のリファクタリング）
{
  timer: {
    remainingTime: number,  // 現在動作中のタイマー（レベルまたは休憩）
  },
  isOnBreak: boolean,  // これで何のタイマーかを判断
  // breakRemainingTime は削除
}
```

### 今回の修正方針（暫定対応）

影響範囲を最小限にするため、現在の設計のまま動作するよう修正します。設計のリファクタリングは別タスクとして計画します。

**問題1の修正** (TournamentContext.tsx - 実装を修正):

```typescript
case 'START': {
  // 既に実行中、または休憩中は開始しない
  if (state.timer.status === 'running' || state.isOnBreak) {
    return state;
  }
  return {
    ...state,
    timer: { ...state.timer, status: 'running' },
  };
}
```

**問題2の修正** (テストファイル - テストを修正):

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
  const state = tournamentReducer(breakState, { type: 'TICK' });
  expect(state.breakRemainingTime).toBe(299);
  expect(state.timer.remainingTime).toBe(299);
});
```

---

## 4. useStructures.test.ts (1件失敗)

### 失敗テスト

- `should update an existing structure`

### 根本原因

テスト間の状態干渉の可能性があります。単独実行時はパスする可能性がありますが、全体テスト実行時に他のテストが状態を変更しているため失敗しています。

### 修正方針

- テストの独立性を確保するため、各テストでストレージをクリアする
- `beforeEach`で明示的にlocalStorageをクリアする

---

## 5. MainLayout.test.tsx (1件失敗)

### 失敗テスト

- `ストラクチャー管理ボタンをクリックするとモーダルが開く`

### 根本原因

テスト間の状態干渉または非同期処理のタイミング問題の可能性があります。

### 修正方針

- waitForを使用して非同期処理の完了を待つ
- テストの独立性を確認する

---

## 推奨される修正優先順位

1. **高優先度**: TournamentContext.test.tsx
   - ゲームロジックの中核であり、バグがあるとユーザー体験に直接影響する
   - テストまたは実装の修正が必要

2. **中優先度**: AudioService.test.ts
   - モックの修正のみで解決可能
   - 機能自体は動作している可能性が高い

3. **中優先度**: ImportExport.test.tsx
   - File APIのモック追加で解決可能
   - 実際のブラウザ環境では動作している可能性が高い

4. **低優先度**: useStructures.test.ts / MainLayout.test.tsx
   - テスト間の状態干渉の問題
   - テストの分離を改善する

---

## まとめ

失敗しているテストの多くは**テスト環境のモック不足**または**テストと実装の不一致**が原因です。

### 修正対象の整理

| 問題                     | 直すべき対象 | 理由                                 |
| ------------------------ | ------------ | ------------------------------------ |
| AudioService モック不足  | テスト       | 実装は正常動作、モックが不完全       |
| ImportExport File.text() | テスト       | JSDOM環境の制約、実ブラウザでは動作  |
| TournamentContext START  | **実装**     | 仕様・実務観点から休憩中は無視すべき |
| TournamentContext TICK   | テスト       | セットアップが実装の前提と不一致     |
| useStructures 状態干渉   | テスト       | テスト分離の改善                     |
| MainLayout 状態干渉      | テスト       | テスト分離の改善                     |

### 別途リファクタリング計画

TournamentContextの状態設計に課題があります（`timer.remainingTime`と`breakRemainingTime`の二重管理）。今回は暫定対応として現設計のまま修正し、以下を別タスクとして計画します：

- **タスク**: タイマー状態の統一設計へのリファクタリング
- **目的**: `breakRemainingTime`を削除し、`timer.remainingTime`に統一
- **影響範囲**: TournamentContext、関連コンポーネント、テスト全般
- **優先度**: 中（機能は動作するが、保守性に影響）
