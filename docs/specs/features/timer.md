# タイマー機能仕様

## 1. 概要

タイマー機能は、ポーカーブラインドタイマーの中核機能です。正確な時間管理、状態制御、自動レベル進行を担当します。

## 2. 機能要件

### 2.1 基本機能

- カウントダウンタイマー（MM:SS形式）
- 開始/一時停止/再開/リセット操作
- 自動レベル進行
- 残り時間・経過時間の表示
- バックグラウンドタブでの動作保証

### 2.2 精度要件

- **精度**: 1秒あたり±50ms以内
- **累積誤差**: 10分で最大±500ms
- **ドリフト補正**: 実時間との同期

## 3. タイマー状態

### 3.1 状態定義

```typescript
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Timer {
  status: TimerStatus;
  remainingTime: number;     // 残り時間（秒）
  elapsedTime: number;       // 経過時間（秒）
  startTime: number | null;  // 開始時刻（Date.now()）
  pausedAt: number | null;   // 一時停止時刻（Date.now()）
}
```

### 3.2 状態遷移図

```
    ┌─────┐
    │Idle │ 初期状態
    └──┬──┘
       │ START
       ↓
    ┌──────────┐
    │ Running  │ タイマー動作中
    └─┬──────┬─┘
      │      │
      │PAUSE │
      ↓      │
    ┌──────┐ │
    │Paused│ │RESUME
    └──┬───┘ │
       │     │
       └─────┘

    RESET → Idle (どの状態からでも可能)
    時間切れ → 自動的に次レベルへ → Idle (新しいレベルで)
```

## 4. タイマー実装

### 4.1 useTimer カスタムフック

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useTournament } from './useTournament';

export function useTimer() {
  const { state, dispatch } = useTournament();
  const { timer, levelDuration } = state;

  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  // タイマー開始
  const start = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
  }, [dispatch]);

  // タイマー一時停止
  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE_TIMER' });
  }, [dispatch]);

  // タイマー再開
  const resume = useCallback(() => {
    dispatch({ type: 'RESUME_TIMER' });
  }, [dispatch]);

  // タイマーリセット
  const reset = useCallback(() => {
    dispatch({ type: 'RESET_TIMER' });
  }, [dispatch]);

  // タイマー更新ループ
  useEffect(() => {
    if (timer.status !== 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // ミリ秒を秒に変換
      lastTime = now;

      dispatch({ type: 'TICK', payload: { deltaTime } });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timer.status, dispatch]);

  return {
    timer,
    start,
    pause,
    resume,
    reset,
  };
}
```

### 4.2 Reducer実装（TournamentContext）

```typescript
function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'START_TIMER':
      if (state.timer.status !== 'idle') return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'running',
          startTime: Date.now(),
        },
      };

    case 'PAUSE_TIMER':
      if (state.timer.status !== 'running') return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'paused',
          pausedAt: Date.now(),
        },
      };

    case 'RESUME_TIMER':
      if (state.timer.status !== 'paused') return state;

      // 一時停止していた時間を計算して、開始時刻を調整
      const pauseDuration = Date.now() - (state.timer.pausedAt || 0);
      const adjustedStartTime = (state.timer.startTime || 0) + pauseDuration;

      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'running',
          startTime: adjustedStartTime,
          pausedAt: null,
        },
      };

    case 'RESET_TIMER':
      return {
        ...state,
        timer: createInitialTimer(state.levelDuration),
      };

    case 'TICK': {
      const { deltaTime } = action.payload;
      const newRemainingTime = Math.max(0, state.timer.remainingTime - deltaTime);
      const newElapsedTime = state.timer.elapsedTime + deltaTime;

      // 時間切れチェック
      if (newRemainingTime === 0 && state.timer.remainingTime > 0) {
        // 次のレベルへ自動進行
        return handleLevelChange(state, 'next');
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          remainingTime: newRemainingTime,
          elapsedTime: newElapsedTime,
        },
      };
    }

    default:
      return state;
  }
}
```

### 4.3 ドリフト補正

タイマーの精度を保つため、実時間との差を定期的に補正します。

```typescript
// より精密なTICK実装（ドリフト補正付き）
case 'TICK': {
  if (!state.timer.startTime) return state;

  // 実際の経過時間を計算
  const now = Date.now();
  const actualElapsed = (now - state.timer.startTime) / 1000;

  // 理想的な残り時間を計算
  const idealRemainingTime = Math.max(0, state.levelDuration - actualElapsed);

  // ドリフトが発生している場合、実時間に基づいて補正
  const newRemainingTime = idealRemainingTime;
  const newElapsedTime = actualElapsed;

  // 時間切れチェック
  if (newRemainingTime === 0 && state.timer.remainingTime > 0) {
    return handleLevelChange(state, 'next');
  }

  return {
    ...state,
    timer: {
      ...state.timer,
      remainingTime: newRemainingTime,
      elapsedTime: newElapsedTime,
    },
  };
}
```

## 5. バックグラウンドタブ対応

### 5.1 Visibility API の使用

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // タブが非アクティブになった時刻を記録
      // （既にstartTimeで記録されているので追加処理不要）
    } else {
      // タブがアクティブになった時、強制的に再計算
      if (state.timer.status === 'running') {
        // 再レンダリングをトリガーして時間を再計算
        dispatch({ type: 'SYNC_TIMER' });
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [state.timer.status, dispatch]);
```

### 5.2 SYNC_TIMER アクション

```typescript
case 'SYNC_TIMER': {
  if (!state.timer.startTime || state.timer.status !== 'running') {
    return state;
  }

  // 実時間に基づいて強制的に再計算
  const now = Date.now();
  const actualElapsed = (now - state.timer.startTime) / 1000;
  const idealRemainingTime = Math.max(0, state.levelDuration - actualElapsed);

  return {
    ...state,
    timer: {
      ...state.timer,
      remainingTime: idealRemainingTime,
      elapsedTime: actualElapsed,
    },
  };
}
```

## 6. 自動レベル進行

### 6.1 レベル変更ロジック

```typescript
function handleLevelChange(
  state: TournamentState,
  direction: 'next' | 'previous'
): TournamentState {
  const currentLevel = state.currentLevel;
  const maxLevel = state.blindLevels.length - 1;

  // 次のレベルを計算
  let nextLevel: number;
  if (direction === 'next') {
    // 休憩チェック
    if (shouldTakeBreak(currentLevel, state.breakConfig)) {
      return startBreak(state);
    }
    nextLevel = Math.min(currentLevel + 1, maxLevel);
  } else {
    // 前のレベルに戻る（休憩中の場合は前のレベルに）
    if (state.isBreak) {
      return endBreak(state);
    }
    nextLevel = Math.max(currentLevel - 1, 0);
  }

  // レベルが変わらない場合（最初/最後のレベル）
  if (nextLevel === currentLevel && !state.isBreak) {
    return {
      ...state,
      timer: createInitialTimer(state.levelDuration),
    };
  }

  // レベル変更
  return {
    ...state,
    currentLevel: nextLevel,
    isBreak: false,
    timer: createInitialTimer(state.levelDuration),
  };
}
```

### 6.2 休憩開始/終了

```typescript
function startBreak(state: TournamentState): TournamentState {
  return {
    ...state,
    isBreak: true,
    timer: createInitialTimer(state.breakConfig.duration * 60), // 分を秒に変換
  };
}

function endBreak(state: TournamentState): TournamentState {
  return {
    ...state,
    isBreak: false,
    currentLevel: state.currentLevel + 1, // 休憩後は次のレベル
    timer: createInitialTimer(state.levelDuration),
  };
}
```

## 7. イベント通知

### 7.1 タイマーイベント

```typescript
// イベントリスナーの型
type TimerEventListener = (event: TimerEvent) => void;

type TimerEvent =
  | { type: 'LEVEL_CHANGED'; level: number; isBreak: boolean }
  | { type: 'WARNING_1MIN'; level: number }
  | { type: 'TIMER_COMPLETED'; level: number };

// イベント発火（Reducerから）
case 'TICK': {
  // ... タイマー更新ロジック ...

  // 残り1分の警告
  if (newRemainingTime <= 60 && state.timer.remainingTime > 60) {
    // 音声サービスをトリガー
    notifyWarning1Min(state.currentLevel);
  }

  // 時間切れ
  if (newRemainingTime === 0 && state.timer.remainingTime > 0) {
    // レベル変更音をトリガー
    notifyLevelChange(state.currentLevel + 1);
    return handleLevelChange(state, 'next');
  }

  return { ...state, timer: updatedTimer };
}
```

## 8. UI コンポーネント

### 8.1 TimerDisplay コンポーネント

```typescript
import React from 'react';
import { useTimer } from '@/ui/hooks/useTimer';
import { formatTime } from '@/utils/timeFormat';
import styles from './TimerDisplay.module.css';

export const TimerDisplay: React.FC = () => {
  const { timer } = useTimer();
  const { remainingTime, elapsedTime, status } = timer;

  // 警告状態の判定（残り1分以下）
  const isWarning = remainingTime <= 60 && remainingTime > 0;

  return (
    <div className={styles.container}>
      {/* 残り時間 */}
      <div className={styles.timerWrapper}>
        <div className={styles.label}>残り時間</div>
        <div
          className={`${styles.timer} ${isWarning ? styles.warning : ''}`}
          role="timer"
          aria-live="polite"
          aria-label={`残り時間 ${formatTime(remainingTime)}`}
        >
          {formatTime(remainingTime)}
        </div>
      </div>

      {/* 経過時間 */}
      <div className={styles.elapsedWrapper}>
        <div className={styles.elapsedLabel}>経過時間</div>
        <div className={styles.elapsed}>
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* 状態インジケーター */}
      {status === 'paused' && (
        <div className={styles.pausedIndicator}>
          一時停止中
        </div>
      )}
    </div>
  );
};
```

### 8.2 ControlButtons コンポーネント

```typescript
import React from 'react';
import { useTimer } from '@/ui/hooks/useTimer';
import styles from './ControlButtons.module.css';

export const ControlButtons: React.FC = () => {
  const { timer, start, pause, resume, reset } = useTimer();
  const { status } = timer;

  return (
    <div className={styles.container}>
      {/* 開始/一時停止/再開 */}
      {status === 'idle' && (
        <button
          onClick={start}
          className={`${styles.button} ${styles.primary}`}
          aria-label="タイマーを開始"
        >
          開始
        </button>
      )}

      {status === 'running' && (
        <button
          onClick={pause}
          className={`${styles.button} ${styles.warning}`}
          aria-label="タイマーを一時停止"
        >
          一時停止
        </button>
      )}

      {status === 'paused' && (
        <button
          onClick={resume}
          className={`${styles.button} ${styles.success}`}
          aria-label="タイマーを再開"
        >
          再開
        </button>
      )}

      {/* リセット */}
      <button
        onClick={reset}
        className={`${styles.button} ${styles.secondary}`}
        aria-label="タイマーをリセット"
        disabled={status === 'idle'}
      >
        リセット
      </button>
    </div>
  );
};
```

## 9. 時間フォーマット

### 9.1 formatTime ユーティリティ

```typescript
/**
 * 秒をMM:SS形式にフォーマット
 * @param seconds 秒数
 * @returns MM:SS形式の文字列
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 秒を時間:分:秒形式にフォーマット（長時間用）
 * @param seconds 秒数
 * @returns HH:MM:SS形式の文字列
 */
export function formatLongTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return formatTime(seconds);
}
```

## 10. テストケース

### 10.1 単体テスト

```typescript
import { describe, it, expect } from 'vitest';
import { formatTime } from '@/utils/timeFormat';
import { createInitialTimer } from '@/domain/models/Timer';

describe('Timer Utils', () => {
  it('formatTime: 正しくフォーマットされる', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(599)).toBe('09:59');
    expect(formatTime(600)).toBe('10:00');
  });

  it('createInitialTimer: 初期状態を作成', () => {
    const timer = createInitialTimer(600);
    expect(timer.status).toBe('idle');
    expect(timer.remainingTime).toBe(600);
    expect(timer.elapsedTime).toBe(0);
  });
});
```

### 10.2 統合テスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '@/ui/hooks/useTimer';

describe('useTimer Hook', () => {
  it('タイマーを開始できる', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.timer.status).toBe('running');
  });

  it('タイマーを一時停止できる', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.timer.status).toBe('paused');
  });
});
```

## 11. パフォーマンス考慮事項

### 11.1 requestAnimationFrame vs setInterval

**採用**: `requestAnimationFrame`

**理由**:
- ブラウザの描画サイクルに同期
- バックグラウンドで自動的に停止（省エネ）
- より滑らかなアニメーション

### 11.2 再レンダリング最適化

```typescript
// React.memo でタイマー表示を最適化
export const TimerDisplay = React.memo(({ timer }: Props) => {
  // ...
}, (prevProps, nextProps) => {
  // 秒単位でのみ再レンダリング
  return Math.floor(prevProps.timer.remainingTime) === Math.floor(nextProps.timer.remainingTime);
});
```

## 12. エラーハンドリング

### 12.1 タイマー異常検知

```typescript
// 異常な時間値の検知
if (newRemainingTime < -1 || newRemainingTime > state.levelDuration + 1) {
  console.error('Timer drift detected, resetting...');
  return {
    ...state,
    timer: createInitialTimer(state.levelDuration),
  };
}
```

## 13. まとめ

タイマー機能の主要な実装ポイント：

1. **精度保証**: ドリフト補正による正確な時間管理
2. **状態管理**: 明確な状態遷移
3. **自動進行**: レベル変更と休憩の自動制御
4. **バックグラウンド対応**: 非アクティブ時も正確に動作
5. **イベント通知**: 音声通知との連携

---

## 関連ドキュメント

- [02-data-models.md](../02-data-models.md) - Timer型定義
- [blinds.md](./blinds.md) - ブラインド管理とレベル進行
- [audio.md](./audio.md) - 音声通知との連携

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
