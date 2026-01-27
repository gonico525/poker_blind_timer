import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { KeyboardService } from '@/services/KeyboardService';
import * as TournamentContext from '@/contexts/TournamentContext';
import type { TournamentState, TournamentAction } from '@/types';

// モック化
vi.mock('@/services/KeyboardService');
vi.mock('@/contexts/TournamentContext');

describe('useKeyboardShortcuts', () => {
  let mockTournamentState: TournamentState;
  let mockDispatch: vi.Mock<[action: TournamentAction], void>;

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトの状態を設定
    mockTournamentState = {
      timer: {
        status: 'idle',
        remainingTime: 600,
        elapsedTime: 0,
      },
      currentLevel: 0,
      blindLevels: [
        { smallBlind: 10, bigBlind: 20, ante: 0 },
        { smallBlind: 20, bigBlind: 40, ante: 0 },
        { smallBlind: 40, bigBlind: 80, ante: 0 },
      ],
      breakConfig: { enabled: true, frequency: 4, duration: 300 },
      levelDuration: 600,
      isOnBreak: false,
      breakRemainingTime: 0,
    };

    mockDispatch = vi.fn<[action: TournamentAction], void>();

    // useTournamentをモック化
    vi.mocked(TournamentContext.useTournament).mockReturnValue({
      state: mockTournamentState,
      dispatch: mockDispatch,
    });
  });

  describe('initialization', () => {
    it('should subscribe to keyboard events on mount', () => {
      renderHook(() => useKeyboardShortcuts());

      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'Space',
        expect.any(Function),
        expect.objectContaining({ preventDefault: true })
      );
      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'ArrowRight',
        expect.any(Function),
        expect.objectContaining({ preventDefault: true })
      );
      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'ArrowLeft',
        expect.any(Function),
        expect.objectContaining({ preventDefault: true })
      );
      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'KeyR',
        expect.any(Function)
      );
      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'KeyF',
        expect.any(Function)
      );
      expect(KeyboardService.subscribe).toHaveBeenCalledWith(
        'Escape',
        expect.any(Function)
      );
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      vi.mocked(KeyboardService.subscribe).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(6); // 6つのショートカット
    });
  });

  describe('Space key (toggle timer)', () => {
    it('should start timer when status is idle', () => {
      mockTournamentState.timer.status = 'idle';

      renderHook(() => useKeyboardShortcuts());

      // Space キーのハンドラを取得して実行
      const spaceHandler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'Space')?.[1];

      expect(spaceHandler).toBeDefined();
      spaceHandler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'START' });
    });

    it('should pause timer when status is running', () => {
      mockTournamentState.timer.status = 'running';

      renderHook(() => useKeyboardShortcuts());

      const spaceHandler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'Space')?.[1];

      spaceHandler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'PAUSE' });
    });

    it('should resume timer when status is paused', () => {
      mockTournamentState.timer.status = 'paused';

      renderHook(() => useKeyboardShortcuts());

      const spaceHandler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'Space')?.[1];

      spaceHandler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'START' });
    });
  });

  describe('Arrow keys', () => {
    it('should go to next level on ArrowRight', () => {
      mockTournamentState.currentLevel = 0;
      mockTournamentState.isOnBreak = false;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowRight')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'NEXT_LEVEL' });
    });

    it('should not go to next level when on break', () => {
      mockTournamentState.currentLevel = 0;
      mockTournamentState.isOnBreak = true;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowRight')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not go to next level when at last level', () => {
      mockTournamentState.currentLevel = 2; // 最後のレベル (blindLevels.length - 1)
      mockTournamentState.isOnBreak = false;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowRight')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should go to previous level on ArrowLeft', () => {
      mockTournamentState.currentLevel = 1;
      mockTournamentState.isOnBreak = false;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowLeft')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'PREV_LEVEL' });
    });

    it('should not go to previous level when on break', () => {
      mockTournamentState.currentLevel = 1;
      mockTournamentState.isOnBreak = true;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowLeft')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not go to previous level when at first level', () => {
      mockTournamentState.currentLevel = 0;
      mockTournamentState.isOnBreak = false;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'ArrowLeft')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('R key (reset)', () => {
    it('should reset timer on R', () => {
      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'KeyR')?.[1];

      handler!({} as KeyboardEvent);

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' });
    });
  });

  describe('F key (fullscreen)', () => {
    it('should toggle fullscreen on F', () => {
      // document.fullscreenElement をモック
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      });

      const requestFullscreen = vi.fn().mockResolvedValue(undefined);
      document.documentElement.requestFullscreen = requestFullscreen;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'KeyF')?.[1];

      handler!({} as KeyboardEvent);

      expect(requestFullscreen).toHaveBeenCalled();
    });

    it('should exit fullscreen when already in fullscreen', () => {
      // フルスクリーン状態をモック
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.body,
      });

      const exitFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = exitFullscreen;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'KeyF')?.[1];

      handler!({} as KeyboardEvent);

      expect(exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should exit fullscreen on Escape when in fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.body,
      });

      const exitFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = exitFullscreen;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'Escape')?.[1];

      handler!({} as KeyboardEvent);

      expect(exitFullscreen).toHaveBeenCalled();
    });

    it('should not call exitFullscreen when not in fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      });

      const exitFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = exitFullscreen;

      renderHook(() => useKeyboardShortcuts());

      const handler = vi
        .mocked(KeyboardService.subscribe)
        .mock.calls.find((call) => call[0] === 'Escape')?.[1];

      handler!({} as KeyboardEvent);

      expect(exitFullscreen).not.toHaveBeenCalled();
    });
  });
});
