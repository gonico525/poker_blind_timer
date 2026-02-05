import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';
import { TournamentProvider } from '@/contexts/TournamentContext';
import type { TournamentState } from '@/types';
import React from 'react';

// Test wrapper with TournamentProvider
const createWrapper =
  (initialState?: Partial<TournamentState>) =>
  ({ children }: { children: React.ReactNode }) => {
    const defaultState: TournamentState = {
      timer: {
        status: 'idle',
        remainingTime: 600,
        elapsedTime: 0,
        startTime: null,
        pausedAt: null,
      },
      currentLevel: 0,
      blindLevels: [
        { smallBlind: 25, bigBlind: 50, ante: 0 },
        { smallBlind: 50, bigBlind: 100, ante: 0 },
        { smallBlind: 100, bigBlind: 200, ante: 25 },
      ],
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      levelDuration: 600,
      isOnBreak: false,
    };

    return React.createElement(TournamentProvider, {
      initialState: { ...defaultState, ...initialState },
      children,
    });
  };

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial timer state', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.remainingTime).toBe(600);
      expect(result.current.elapsedTime).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });

    it('should return current level information', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentLevel).toBe(0);
      expect(result.current.currentBlind).toEqual({
        smallBlind: 25,
        bigBlind: 50,
        ante: 0,
      });
      expect(result.current.nextBlind).toEqual({
        smallBlind: 50,
        bigBlind: 100,
        ante: 0,
      });
      expect(result.current.hasNextLevel).toBe(true);
      expect(result.current.hasPrevLevel).toBe(false);
    });
  });

  describe('start', () => {
    it('should start the timer', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isRunning).toBe(true);
    });

    it('should decrement remainingTime every second', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.remainingTime).toBe(599);
      expect(result.current.elapsedTime).toBe(1);
    });

    it('should increment elapsedTime every second', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedTime).toBe(5);
      expect(result.current.remainingTime).toBe(595);
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe('paused');
      expect(result.current.isPaused).toBe(true);
    });

    it('should stop decrementing when paused', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const timeBeforePause = result.current.remainingTime;

      act(() => {
        result.current.pause();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.remainingTime).toBe(timeBeforePause);
    });
  });

  describe('toggle', () => {
    it('should toggle between running and paused', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      // idle → running
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('running');

      // running → paused
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('paused');

      // paused → running
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('running');
    });
  });

  describe('reset', () => {
    it('should reset timer to level duration', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.elapsedTime).toBe(0);
      expect(result.current.remainingTime).toBe(600);
    });
  });

  describe('nextLevel', () => {
    it('should advance to next level', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.nextLevel();
      });

      expect(result.current.currentLevel).toBe(1);
      expect(result.current.status).toBe('idle');
      expect(result.current.elapsedTime).toBe(0);
      expect(result.current.remainingTime).toBe(600);
    });

    it('should not advance beyond last level', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({ currentLevel: 2 }),
      });

      act(() => {
        result.current.nextLevel();
      });

      expect(result.current.currentLevel).toBe(2);
    });
  });

  describe('prevLevel', () => {
    it('should go back to previous level', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({ currentLevel: 1 }),
      });

      act(() => {
        result.current.prevLevel();
      });

      expect(result.current.currentLevel).toBe(0);
      expect(result.current.status).toBe('idle');
      expect(result.current.elapsedTime).toBe(0);
    });

    it('should not go below level 0', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.prevLevel();
      });

      expect(result.current.currentLevel).toBe(0);
    });
  });

  describe('break handling', () => {
    it('should enter break mode at break frequency', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({
          breakConfig: { enabled: true, frequency: 2, duration: 300 },
          currentLevel: 1,
        }),
      });

      act(() => {
        result.current.nextLevel();
      });

      expect(result.current.isOnBreak).toBe(true);
      expect(result.current.remainingTime).toBe(300);
    });

    it('should skip break when skipBreak is called', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({
          breakConfig: { enabled: true, frequency: 2, duration: 300 },
          currentLevel: 2,
          isOnBreak: true,
        }),
      });

      act(() => {
        result.current.skipBreak();
      });

      expect(result.current.isOnBreak).toBe(false);
      expect(result.current.remainingTime).toBe(600);
    });

    it('should return levelsUntilBreak', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({
          breakConfig: { enabled: true, frequency: 4, duration: 600 },
        }),
      });

      expect(result.current.levelsUntilBreak).toBe(4);
    });

    it('should return null for levelsUntilBreak when break is disabled', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
        }),
      });

      expect(result.current.levelsUntilBreak).toBeNull();
    });

    it('should start break timer when START_BREAK_TIMER is dispatched', () => {
      const { result } = renderHook(() => useTimer(), {
        wrapper: createWrapper({
          isOnBreak: true,
        }),
      });

      act(() => {
        result.current.startBreakTimer();
      });

      expect(result.current.status).toBe('running');
    });
  });
});
