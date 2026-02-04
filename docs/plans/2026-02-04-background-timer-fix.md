# バックグラウンドタイマー対応 実装計画書

## 1. 概要

### 1.1 課題

スマートフォンで別のアプリを開いたり、ブラウザタブを切り替えた際にタイマーが停止する問題を修正する。

### 1.2 原因

現在の実装は `setInterval(1000)` で毎秒固定デクリメントを行っているが、ブラウザはバックグラウンドタブで `setInterval` を節流（throttling）するため、タイマーが遅延・停止する。

### 1.3 解決方針

**タイムスタンプベース + visibilitychange イベント**による時間計算に変更する。

この方針は既存の仕様書 `docs/specs/features/timer.md` に記載された設計に準拠している。

## 2. 仕様書との整合性確認

### 2.1 既存仕様書の確認

| 項目 | 仕様書の記載 | 現在の実装 | 対応 |
|------|------------|-----------|------|
| Timer型に `startTime` | あり（34行） | なし | 追加必要 |
| Timer型に `pausedAt` | あり（35行） | なし | 追加必要 |
| `visibilitychange` イベント | あり（252-276行） | なし | 追加必要 |
| `SYNC_TIMER` アクション | あり（278-300行） | なし | 追加必要 |
| ドリフト補正 | あり（216-250行） | なし | 追加必要 |

### 2.2 結論

**仕様書の修正は不要**。実装を仕様書に合わせる形で進める。

## 3. 実装計画

### 3.1 フェーズ1: 型定義の更新

**対象ファイル**: `src/types/context.ts`

**変更内容**:
```typescript
// 変更前
interface Timer {
  status: TimerStatus;
  remainingTime: number;
  elapsedTime: number;
}

// 変更後
interface Timer {
  status: TimerStatus;
  remainingTime: number;
  elapsedTime: number;
  startTime: number | null;    // 開始時刻（Date.now()）
  pausedAt: number | null;     // 一時停止時刻（Date.now()）
}
```

### 3.2 フェーズ2: TournamentContext の更新

**対象ファイル**: `src/contexts/TournamentContext.tsx`

**変更内容**:

1. **初期状態の更新**
   - `startTime: null`, `pausedAt: null` を追加

2. **START アクション**
   - `startTime: Date.now()` を設定

3. **PAUSE アクション**
   - `pausedAt: Date.now()` を設定

4. **RESUME アクション（新規または修正）**
   - 一時停止していた時間を計算し、`startTime` を調整
   - `pausedAt: null` にリセット

5. **TICK アクション**
   - 固定デクリメントから実時間ベースの計算に変更
   - `startTime` からの経過時間を基に `remainingTime` を算出

6. **SYNC_TIMER アクション（新規）**
   - バックグラウンドから復帰時に呼び出し
   - 実時間に基づいて強制的に再計算

7. **RESET / NEXT_LEVEL / PREV_LEVEL アクション**
   - `startTime`, `pausedAt` のリセット処理を追加

### 3.3 フェーズ3: useTimer フックの更新

**対象ファイル**: `src/hooks/useTimer.ts`

**変更内容**:

1. **visibilitychange イベントリスナーの追加**
   ```typescript
   useEffect(() => {
     const handleVisibilityChange = () => {
       if (!document.hidden && state.timer.status === 'running') {
         dispatch({ type: 'SYNC_TIMER' });
       }
     };
     document.addEventListener('visibilitychange', handleVisibilityChange);
     return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
     };
   }, [state.timer.status, dispatch]);
   ```

2. **setInterval のTICK間隔調整（オプション）**
   - 現在の1000msを維持（UI更新用）
   - TICK内で実時間計算を行うため、間隔自体は重要ではなくなる

### 3.4 フェーズ4: 関連コンポーネントの確認

**対象ファイル**:
- `src/hooks/useAudioNotification.ts`
- `src/services/StorageService.ts`

**確認事項**:
- 音声通知がバックグラウンド復帰時に正しく動作するか
- 状態永続化に影響がないか

### 3.5 フェーズ5: テストの更新

**対象ファイル**:
- `src/hooks/useTimer.test.ts`
- `src/contexts/TournamentContext.test.tsx`

**追加テストケース**:

1. **タイムスタンプベースの時間計算**
   - TICK時に実際の経過時間が反映されること
   - ドリフト補正が機能すること

2. **バックグラウンド復帰**
   - `SYNC_TIMER` アクションで時間が正しく同期されること
   - 複数秒経過後の復帰で正しい残り時間になること

3. **一時停止/再開**
   - 一時停止中の時間が `startTime` に正しく加算されること
   - 再開後のタイマーが正確に動作すること

4. **レベル自動進行**
   - バックグラウンド中にレベル終了時刻を過ぎた場合の処理

## 4. 実装順序

```
1. 型定義の更新 (src/types/context.ts)
   ↓
2. TournamentContext の更新 (src/contexts/TournamentContext.tsx)
   ↓
3. useTimer フックの更新 (src/hooks/useTimer.ts)
   ↓
4. 既存テストの修正・実行
   ↓
5. 新規テストケースの追加
   ↓
6. 関連コンポーネントの動作確認
   ↓
7. 手動テスト（スマホ実機でのバックグラウンド動作確認）
```

## 5. 影響範囲

### 5.1 変更ファイル一覧

| ファイル | 変更種別 | 変更内容 |
|---------|---------|---------|
| `src/types/context.ts` | 修正 | Timer型に2フィールド追加 |
| `src/contexts/TournamentContext.tsx` | 修正 | Reducer の複数アクション修正、SYNC_TIMER追加 |
| `src/hooks/useTimer.ts` | 修正 | visibilitychange イベント追加 |
| `src/hooks/useTimer.test.ts` | 修正 | テストケース追加・修正 |
| `src/contexts/TournamentContext.test.tsx` | 修正 | テストケース追加・修正 |

### 5.2 影響を受けるコンポーネント

- `TimerDisplay` - 表示のみ、変更不要
- `ControlButtons` - 操作のみ、変更不要
- `useAudioNotification` - 残り時間監視、動作確認のみ

## 6. リスクと対策

### 6.1 レベル自動進行の複雑さ

**リスク**: バックグラウンド中に複数レベルを跨ぐ場合の処理が複雑

**対策**:
- 復帰時は1レベルずつ進行させるのではなく、経過時間から正しいレベルを直接計算
- ただし、初期実装では「復帰時点の残り時間を計算」のみとし、複数レベル跨ぎは Phase 2 で対応

### 6.2 音声通知のタイミング

**リスク**: バックグラウンド中の警告音・レベル変更音が鳴らない

**対策**:
- これはブラウザの制限であり、完全な解決は困難
- 復帰時に「レベルが変わっていた場合」は通知を出すなどの UX 改善を検討（将来課題）

### 6.3 テストの複雑化

**リスク**: `Date.now()` のモックが必要になり、テストが複雑化

**対策**:
- `vi.useFakeTimers()` と `vi.setSystemTime()` を使用
- テストヘルパー関数を作成して重複を削減

## 7. 成功基準

1. スマートフォンで別アプリに切り替え後、復帰時にタイマーが正しい残り時間を表示すること
2. PCでタブ切り替え後、復帰時にタイマーが正しい残り時間を表示すること
3. 既存のテストがすべてパスすること
4. 新規テストケースがすべてパスすること
5. lint/format チェックがパスすること

## 8. 将来の拡張（スコープ外）

以下は本計画のスコープ外とし、必要に応じて別途計画を立てる：

- バックグラウンド中の複数レベル自動進行
- 復帰時の「レベルが変わりました」通知
- localStorage へのタイムスタンプ永続化（ページリロード対応）
- Service Worker / Web Worker の導入

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-02-04 | 初版作成 | Claude |
