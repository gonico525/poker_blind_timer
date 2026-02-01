import { useCallback, useEffect, useRef } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { getLevelsUntilBreak } from '@/domain/models/Break';

/**
 * タイマー制御フック
 * タイマーの開始/停止/リセット、レベル操作、休憩処理を提供
 */
export function useTimer() {
  const { state, dispatch } = useTournament();
  const intervalRef = useRef<number | null>(null);

  // タイマーの開始
  const start = useCallback(() => {
    if (state.timer.status === 'running') return;
    dispatch({ type: 'START' });
  }, [state.timer.status, dispatch]);

  // タイマーの一時停止
  const pause = useCallback(() => {
    if (state.timer.status !== 'running') return;
    dispatch({ type: 'PAUSE' });
  }, [state.timer.status, dispatch]);

  // トグル（開始/一時停止）
  const toggle = useCallback(() => {
    if (state.timer.status === 'running') {
      pause();
    } else {
      start();
    }
  }, [state.timer.status, start, pause]);

  // リセット
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // 次のレベルへ
  const nextLevel = useCallback(() => {
    dispatch({ type: 'NEXT_LEVEL' });
  }, [dispatch]);

  // 前のレベルへ
  const prevLevel = useCallback(() => {
    dispatch({ type: 'PREV_LEVEL' });
  }, [dispatch]);

  // 休憩スキップ
  const skipBreak = useCallback(() => {
    dispatch({ type: 'SKIP_BREAK' });
  }, [dispatch]);

  // 休憩タイマー開始
  const startBreakTimer = useCallback(() => {
    dispatch({ type: 'START_BREAK_TIMER' });
  }, [dispatch]);

  // タイマーの tick 処理
  useEffect(() => {
    if (state.timer.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.timer.status, dispatch]);

  return {
    // 状態
    status: state.timer.status,
    remainingTime: state.timer.remainingTime,
    elapsedTime: state.timer.elapsedTime,
    currentLevel: state.currentLevel,
    isOnBreak: state.isOnBreak,
    levelsUntilBreak: getLevelsUntilBreak(
      state.currentLevel,
      state.breakConfig
    ),

    // 算出プロパティ
    isRunning: state.timer.status === 'running',
    isPaused: state.timer.status === 'paused',
    isIdle: state.timer.status === 'idle',

    // 現在のブラインド
    currentBlind: state.blindLevels[state.currentLevel],
    nextBlind: state.blindLevels[state.currentLevel + 1],
    hasNextLevel: state.currentLevel < state.blindLevels.length - 1,
    hasPrevLevel: state.currentLevel > 0,

    // アクション
    start,
    pause,
    toggle,
    reset,
    nextLevel,
    prevLevel,
    skipBreak,
    startBreakTimer,
  };
}
