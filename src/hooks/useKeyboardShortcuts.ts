import { useEffect, useCallback } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { KeyboardService } from '@/services/KeyboardService';

/**
 * キーボードショートカットフック
 *
 * TournamentContextとKeyboardServiceを連携させ、
 * キーボードショートカットでタイマーを操作できるようにします。
 *
 * **ショートカット一覧:**
 * - Space: タイマー開始/一時停止/再開
 * - ArrowRight (→): 次のレベルへ進む
 * - ArrowLeft (←): 前のレベルに戻る
 * - R: タイマーリセット
 * - F: フルスクリーン切り替え
 * - Esc: フルスクリーン解除
 *
 * @example
 * ```tsx
 * function App() {
 *   useKeyboardShortcuts();
 *   return <MainLayout />;
 * }
 * ```
 */
export function useKeyboardShortcuts(): void {
  const { state, dispatch } = useTournament();

  // タイマートグル (Space)
  const handleToggle = useCallback(() => {
    if (state.timer.status === 'running') {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'START' });
    }
  }, [state.timer.status, dispatch]);

  // 次のレベル (ArrowRight)
  const handleNextLevel = useCallback(() => {
    if (state.isOnBreak) return;
    if (state.currentLevel >= state.blindLevels.length - 1) return;

    dispatch({ type: 'NEXT_LEVEL' });
  }, [state.isOnBreak, state.currentLevel, state.blindLevels.length, dispatch]);

  // 前のレベル (ArrowLeft)
  const handlePrevLevel = useCallback(() => {
    if (state.isOnBreak) return;
    if (state.currentLevel <= 0) return;

    dispatch({ type: 'PREV_LEVEL' });
  }, [state.isOnBreak, state.currentLevel, dispatch]);

  // リセット (R)
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // フルスクリーントグル (F)
  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // フルスクリーン解除 (Esc)
  const handleEscape = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const unsubscribers = [
      KeyboardService.subscribe('Space', handleToggle, {
        preventDefault: true,
      }),
      KeyboardService.subscribe('ArrowRight', handleNextLevel, {
        preventDefault: true,
      }),
      KeyboardService.subscribe('ArrowLeft', handlePrevLevel, {
        preventDefault: true,
      }),
      KeyboardService.subscribe('KeyR', handleReset),
      KeyboardService.subscribe('KeyF', handleFullscreen),
      KeyboardService.subscribe('Escape', handleEscape),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    handleToggle,
    handleNextLevel,
    handlePrevLevel,
    handleReset,
    handleFullscreen,
    handleEscape,
  ]);
}
