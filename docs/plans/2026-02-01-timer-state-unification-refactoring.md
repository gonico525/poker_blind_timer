# タイマー状態統一リファクタリング実行計画

**日付**: 2026-02-01
**起点ドキュメント**: `docs/reviews/2026-02-01-failing-tests-analysis.md`（末尾「別途リファクタリング計画」項）
**対象ブランチ**: `claude/plan-refactoring-tests-aSnfH`
**優先度**: 中（機能は動作するが保守性に影響）

---

## 1. 目的と背景

`TournamentState`には休憩残り時間を表現する項目が2つ存在し、常に同値として並行維持されている。

| 項目 | 役割 | 休憩開始時の値 | TICK時の変化 |
|------|------|--------------|-------------|
| `timer.remainingTime` | レベルタイマーにも休憩タイマーにも使われる | `breakConfig.duration` に設定 | 毎秒デクリメント |
| `breakRemainingTime` | 休憩残り時間の別途管理 | `breakConfig.duration` に設定 | 毎秒デクリメント（`timer.remainingTime`と同値） |

レポートで指摘されたとおり、ポーカートーナメントでは同時に動くタイマーは1つだけ（レベルタイマーか休憩タイマーか）であるため、`isOnBreak`フラグで現在何のタイマーかを判別すれば十分である。`breakRemainingTime`は削除し、`timer.remainingTime`に統一する。

---

## 2. 調査結果と変更が不要なポイント

リファクタリング前に以下を確認した。

### 2.1 UIは既に `timer.remainingTime` を使用している

`MainLayout.tsx`では休憩中の表示に `useTimer()` の戻り値の `remainingTime`（= `state.timer.remainingTime`）を `BreakDisplay` に渡している。`breakRemainingTime` は `useTimer` から返されているものの、いかなるコンポーネントにも渡されていない。したがって **UIの変更は一切不要**である。

### 2.2 Reducerの休憩タイマーロジック自体は正しい

`TournamentContext.tsx`の`TICK`アクション内で休憩中のカウントダウン・休憩終了時の次レベルへの自動進行は、すべて`timer.remainingTime`を基準に動作している。`breakRemainingTime`はそこに同値で書き込まれているだけであり、それを読み戻して判定に使う箇所はない。つまりReducerのロジックの変更も**削除行のみで十分**。

### 2.3 StorageService

`StorageService`は`TournamentState`をそのままシリアライズ・デシリアライズするだけで、`breakRemainingTime`に対する特別なハンドリングは存在しない。型定義から削除すればStorageService自体の実装変更は不要。ただしテストで`TournamentState`オブジェクトを構築しているため、そちらの更新は必要。

---

## 3. 影響範囲の一覧

以下が変更対象のファイルとその変更の種類である。

| ファイル | 変更種類 | 変更内容のサマリー |
|----------|---------|-------------------|
| `src/types/domain.ts` | 型定義の削除 | `TournamentState`から`breakRemainingTime`を削除 |
| `src/contexts/TournamentContext.tsx` | Reducer・Provider改修 | 全アクションから`breakRemainingTime`の代入行を削除 |
| `src/hooks/useTimer.ts` | Hook戻り値の削除 | `breakRemainingTime`を返すプロパティを削除 |
| `src/contexts/TournamentContext.test.tsx` | テスト修正 | 初期状態・アサーション・テスト用の状態オブジェクトから削除・移行 |
| `src/hooks/useTimer.test.ts` | テスト修正 | 初期状態・アサーションの削除・移行 |
| `src/hooks/useAudioNotification.test.tsx` | テスト修正 | モック状態オブジェクトから削除 |
| `src/hooks/useKeyboardShortcuts.test.tsx` | テスト修正 | モック状態オブジェクトから削除 |
| `src/services/StorageService.test.ts` | テスト修正 | 状態オブジェクトから削除 |

---

## 4. 実行ステップ

### Step 1. 型定義の変更

**ファイル**: `src/types/domain.ts`

`TournamentState`インターフェース（現在8プロパティ）から`breakRemainingTime: number`を削除する。削除後は`isOnBreak: boolean`で休憩中かどうかを判別し、休憩タイマーの残り時間は`timer.remainingTime`で読む。

> **確認点**: TypeScriptコンパイル時にこの削除だけで、次のStepで対応すべき箇所が全て型エラーとして浮かび上がる。エラー一覧を確認してStep 2以降の見落ちがないか検証できる。

### Step 2. Reducerの変更

**ファイル**: `src/contexts/TournamentContext.tsx`

Reducerの各アクション・TournamentProviderの初期状態の中で`breakRemainingTime`に代入する行を削除する。削除対象は以下の9箇所である。

| アクション名 | 現在の代入内容 | 削除の理由 |
|-------------|--------------|-----------|
| `TICK`（休憩タイマー切れ時） | `breakRemainingTime: 0` | `timer.remainingTime`が`levelDuration`にリセットされる同じreturn文にある |
| `TICK`（休憩中カウントダウン） | `breakRemainingTime: newRemainingTime` | `timer.remainingTime`も`newRemainingTime`に設定される同じreturn文にある |
| `TICK`（自動休憩開始） | `breakRemainingTime: state.breakConfig.duration` | `timer.remainingTime`も同じ値に設定される |
| `NEXT_LEVEL`（休憩開始） | `breakRemainingTime: state.breakConfig.duration` | `timer.remainingTime`も同じ値に設定される |
| `LOAD_STRUCTURE` | `breakRemainingTime: 0` | 休憩中でない状態にリセットされる |
| `START_BREAK` | `breakRemainingTime: state.breakConfig.duration` | `timer.remainingTime`も同じ値に設定される |
| `END_BREAK` | `breakRemainingTime: 0` | 休憩が終了した事実の表現は`isOnBreak: false`で十分 |
| `SKIP_BREAK` | `breakRemainingTime: 0` | `timer.remainingTime`がlevelDurationにリセットされる同じreturn文にある |
| Provider初期状態 | `breakRemainingTime: 0` | 初期状態では休憩中ではない |

> **確認点**: これらは「削除のみ」の対象である。`timer.remainingTime`の値や休憩開始・終了のロジックは変更しない。

### Step 3. Hookの変更

**ファイル**: `src/hooks/useTimer.ts`

戻り値オブジェクトから`breakRemainingTime: state.breakRemainingTime`を削除する。
MainLayoutはこの戻り値の`remainingTime`（= `state.timer.remainingTime`）を休憩中にも使用しており、休憩中の残り時間の表示には影響しない。

### Step 4. テストの変更

以下の各ファイルで変更が必要な内容を説明する。

#### 4-A. `src/contexts/TournamentContext.test.tsx`

このファイルは`tournamentReducer`を単体テストしている。変更は以下の種類に分類される。

**① 初期状態オブジェクトの削除**
`initialState`の定義で`breakRemainingTime: 0`を削除する。

**② テスト用の状態オブジェクトから削除**
各テスト内で休憩状態を再現するために`breakRemainingTime`を指定している箇所がある。これらを削除する。該当テスト：
- 「TICK」テスト中の休憩状態セットアップ
- 「RESET」テスト中の休憩状態セットアップ
- 「Break handling」のセットアップ（`should end break`・`should skip break`・`should start break timer`）

**③ アサーションの移行**
`breakRemainingTime`への期待値チェックを`timer.remainingTime`へ変更する。移行先の値は必ず同じはずなので、既に別途`timer.remainingTime`へのアサーションがある場合は重複になるため、`breakRemainingTime`側のアサーションを削除すればよい。該当箇所：
- 「should tick during break」→ `state.breakRemainingTime` の期待値チェック
- 「should trigger break when conditions are met」→ `state.breakRemainingTime` の期待値チェック（`state.timer.remainingTime`へ変更）
- 「should start break」→ `state.breakRemainingTime` の期待値チェック（`state.timer.remainingTime`へ変更）
- 「should end break」→ `state.breakRemainingTime` の期待値チェック（削除。休憩終了は`isOnBreak: false`で確認済み）
- 「should skip break」→ `state.breakRemainingTime` の期待値チェック（削除。`timer.remainingTime`がlevelDurationにリセットされることで確認）

#### 4-B. `src/hooks/useTimer.test.ts`

このファイルは`useTimer`フックを統合テストしている。

**① `createWrapper`内の`defaultState`から削除**
`breakRemainingTime: 0`を削除する。

**② テスト用の状態オブジェクトから削除**
以下のテスト内で`breakRemainingTime`を指定している箇所を削除する：
- 「should skip break when skipBreak is called」のinitialState指定
- 「should start break timer when START_BREAK_TIMER is dispatched」のinitialState指定

**③ アサーションの移行**
- 「should enter break mode at break frequency」→ `result.current.breakRemainingTime` の期待値チェックを `result.current.remainingTime` へ変更する。
- 「should skip break when skipBreak is called」→ `result.current.breakRemainingTime` の期待値チェックを削除する。（休憩スキップ後の`remainingTime`はlevelDurationに戻るため、`result.current.remainingTime`で確認すればよい）

#### 4-C. `src/hooks/useAudioNotification.test.tsx`

このファイルのテストは`breakRemainingTime`の値を直接アサートしているわけでない。モック状態オブジェクトの構築・変更で使っているだけである。

**① beforeEach内の初期モック状態から削除**
`breakRemainingTime: 0`を削除する。

**② テスト内のモック変更行を削除**
以下の行を削除する：
- 「should play break start sound when entering break」→ `mockTournamentState.breakRemainingTime = 300`
- 「should not play when exiting break」→ 休憩中の初期設定と休憩終了時の両方の変更行
- 「should not play break start when sound is disabled」→ `mockTournamentState.breakRemainingTime = 300`

> **確認点**: `useAudioNotification`自体は`breakRemainingTime`を参照していない（`isOnBreak`と`timer.remainingTime`のみ監視）。モック値の削除でテスト動作には影響しない。

#### 4-D. `src/hooks/useKeyboardShortcuts.test.tsx`

モック状態オブジェクトの`breakRemainingTime: 0`を削除する。実装側も`breakRemainingTime`を参照していないため、削除のみで十分。

#### 4-E. `src/services/StorageService.test.ts`

`TournamentState`オブジェクトを直接構築している2箇所で`breakRemainingTime: 0`を削除する。（「should save and load tournament state」・「should remove tournament state」の各テスト）

---

## 5. 検証方法

実装後に以下を確認する。

1. **TypeScriptコンパイル**: `npm run build`で型エラーが0件であること。
2. **テスト全件パス**: `npm test`で489件全件（または削除・変更後の件数）が合格であること。
3. **休憩フロー動作確認のポイント**（テスト内で確認すべき動作）：
   - 休憩開始時に`timer.remainingTime`が`breakConfig.duration`になる
   - 休憩中のTICKで`timer.remainingTime`が毎秒減少する
   - 休憩タイマーが0になると自動で次レベルに進み、`timer.remainingTime`がlevelDurationにリセットされる
   - SKIP_BREAKで休憩中断し、`timer.remainingTime`がlevelDurationにリセットされる
   - END_BREAKで休憩が終了し、`isOnBreak`がfalseになる

---

## 6. リスクと注意事項

| リスク | 対策 |
|--------|------|
| ストレージに既存の保存データが`breakRemainingTime`を含んでいる | `StorageService.loadTournamentState`で読み込むデータは`TournamentState`の型に対応するが、余分なプロパティが付いていても動作不可にはならない（TypeScriptの構造的型チェックは削除側に厳しくない）。ただし今後の保存データにはquesto projepctのコンテキスト上で休憩中の状態を永続化する仕組みが見つからないため、影響は現実的には無い可能性が高い。 |
| テスト変更で休憩動作のカバレッジが下がる | アサーション削除箇所はすべて`timer.remainingTime`へのアサーションと同一の期待値であるため、実質的なカバレッジは維持される。 |

---

## 7. 対応範囲の明確な境界

以下は本リファクタリングの**対象外**である。

- `BreakDisplay`コンポーネント（既に`timer.remainingTime`を使用しているため変更不要）
- `TimerDisplay`・`TimerControls`コンポーネント（`breakRemainingTime`を参照していない）
- `useAudioNotification`の実装（`breakRemainingTime`を参照していない）
- `useKeyboardShortcuts`の実装（`breakRemainingTime`を参照していない）
- `StorageService`の実装（型に依存するだけで特別なロジックなし）
- `domain/models/Break.ts`（`shouldTakeBreak`・`getLevelsUntilBreak`は`breakRemainingTime`を使用していない）
- 仕様書（`docs/specs/`）の更新（仕様書はタイマーの外部インターフェースを記述しており、内部の状態構造には言及していない）
