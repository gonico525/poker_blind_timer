# バックグラウンドタイマー対応 実装完了レポート

## 実装日

2026-02-05

## 概要

スマートフォンで別のアプリを開いたり、ブラウザタブを切り替えた際にタイマーが停止する問題を修正しました。

## 解決した課題

- ブラウザがバックグラウンドタブで `setInterval` を節流（throttling）するため、タイマーが遅延・停止していた
- バックグラウンドから復帰時にタイマーの残り時間が正しく表示されなかった

## 実装内容

### 1. Timer型の拡張 (`src/types/domain.ts`)

```typescript
export interface Timer {
  status: TimerStatus;
  remainingTime: number;
  elapsedTime: number;
  startTime: number | null; // 開始時刻（Date.now()）- 新規追加
  pausedAt: number | null; // 一時停止時刻（Date.now()）- 新規追加
}
```

### 2. SYNC_TIMERアクションの追加 (`src/types/context.ts`)

バックグラウンドから復帰時に実時間に基づいてタイマーを再計算するための新しいアクションを追加。

### 3. TournamentContext Reducerの更新 (`src/contexts/TournamentContext.tsx`)

- **STARTアクション**: `startTime`を記録、一時停止からの再開時は`startTime`を調整
- **PAUSEアクション**: `pausedAt`を記録
- **TICKアクション**: タイムスタンプベースの時間計算に変更（ドリフト補正付き）
- **SYNC_TIMERアクション**: 新規追加（バックグラウンド復帰時に実時間で再計算）
- **その他のアクション**: Timer初期化時に`startTime: null, pausedAt: null`を設定

### 4. useTimerフックの更新 (`src/hooks/useTimer.ts`)

`visibilitychange`イベントリスナーを追加し、バックグラウンドから復帰時に`SYNC_TIMER`をdispatchするように変更。

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

## 変更ファイル一覧

| ファイル                                  | 変更内容                                    |
| ----------------------------------------- | ------------------------------------------- |
| `src/types/domain.ts`                     | Timer型に`startTime`と`pausedAt`を追加      |
| `src/types/context.ts`                    | TournamentActionに`SYNC_TIMER`を追加        |
| `src/contexts/TournamentContext.tsx`      | Reducerの複数アクション修正、SYNC_TIMER追加 |
| `src/hooks/useTimer.ts`                   | `visibilitychange`イベントリスナー追加      |
| `src/contexts/TournamentContext.test.tsx` | テストケース更新・追加（+9テスト）          |
| `src/hooks/useTimer.test.ts`              | テストケースの初期状態を更新                |

## テスト結果

### 実行コマンド

```bash
npm test -- --run
```

### 結果

- **テストファイル**: 41 passed, 1 failed (App.test.tsx - PWAプラグイン関連の既存問題)
- **テストケース**: 494 passed

### 追加したテストケース

1. `SYNC_TIMER action - should sync timer based on real elapsed time`
2. `SYNC_TIMER action - should not sync if timer is not running`
3. `SYNC_TIMER action - should not sync if no startTime`
4. `SYNC_TIMER action - should advance to next level if time expired during background`
5. `SYNC_TIMER action - should sync break timer correctly`
6. `SYNC_TIMER action - should stop timer when last level expires`
7. `Timestamp-based START/PAUSE - should set startTime on START`
8. `Timestamp-based START/PAUSE - should set pausedAt on PAUSE`
9. `Timestamp-based START/PAUSE - should adjust startTime on resume from pause`

## 仕様書との整合性

実装は既存の仕様書 `docs/specs/features/timer.md` に記載された設計に準拠しています。

## 未実装項目（スコープ外）

以下は本実装のスコープ外とし、将来の課題として残しています：

- バックグラウンド中の複数レベル自動進行
- 復帰時の「レベルが変わりました」通知
- localStorage へのタイムスタンプ永続化（ページリロード対応）
- Service Worker / Web Worker の導入

## 検証方法

1. タイマーを開始
2. 別のアプリ/タブに切り替え
3. 数秒～数分後に復帰
4. タイマーの残り時間が正しく表示されることを確認

## 備考

- 既存のテストとの後方互換性を維持するため、`startTime`がnullの場合は従来の固定デクリメントにフォールバックする仕組みを導入
- UIの更新は1秒ごと（setInterval 1000ms）を維持し、残り時間の計算のみタイムスタンプベースに変更

---

## 改訂履歴

| バージョン | 日付       | 変更内容 | 作成者 |
| ---------- | ---------- | -------- | ------ |
| 1.0        | 2026-02-05 | 初版作成 | Claude |
