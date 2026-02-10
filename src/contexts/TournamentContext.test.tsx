import { describe, it, expect } from 'vitest';
import type { TournamentState } from '@/types';
import { tournamentReducer } from './TournamentContext';

describe('tournamentReducer', () => {
  const initialState: TournamentState = {
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
      { smallBlind: 200, bigBlind: 400, ante: 50 },
      { smallBlind: 300, bigBlind: 600, ante: 75 },
    ],
    breakConfig: { enabled: false, frequency: 4, duration: 600 },
    levelDuration: 600,
    isOnBreak: false,
    totalPlayers: 0,
    remainingPlayers: 0,
    initialStack: 0,
  };

  describe('START action', () => {
    it('should change timer status to running', () => {
      const state = tournamentReducer(initialState, { type: 'START' });
      expect(state.timer.status).toBe('running');
    });

    it('should not start if already running', () => {
      const runningState = {
        ...initialState,
        timer: { ...initialState.timer, status: 'running' as const },
      };
      const state = tournamentReducer(runningState, { type: 'START' });
      expect(state).toBe(runningState);
    });

    it('should start during break when idle', () => {
      const breakState: TournamentState = {
        ...initialState,
        isOnBreak: true,
        timer: {
          status: 'idle',
          remainingTime: 600,
          elapsedTime: 0,
          startTime: null,
          pausedAt: null,
        },
      };
      const state = tournamentReducer(breakState, { type: 'START' });
      expect(state.timer.status).toBe('running');
      expect(state.isOnBreak).toBe(true);
    });

    it('should resume during break when paused', () => {
      const now = Date.now();
      const pausedBreakState: TournamentState = {
        ...initialState,
        isOnBreak: true,
        timer: {
          status: 'paused',
          remainingTime: 300,
          elapsedTime: 300,
          startTime: now - 300000,
          pausedAt: now,
        },
      };
      const state = tournamentReducer(pausedBreakState, { type: 'START' });
      expect(state.timer.status).toBe('running');
      expect(state.timer.remainingTime).toBe(300);
      expect(state.isOnBreak).toBe(true);
    });
  });

  describe('PAUSE action', () => {
    it('should change timer status to paused', () => {
      const runningState = {
        ...initialState,
        timer: { ...initialState.timer, status: 'running' as const },
      };
      const state = tournamentReducer(runningState, { type: 'PAUSE' });
      expect(state.timer.status).toBe('paused');
    });

    it('should not pause if already paused or idle', () => {
      const state = tournamentReducer(initialState, { type: 'PAUSE' });
      expect(state).toBe(initialState);
    });
  });

  describe('TICK action', () => {
    it('should decrement remainingTime based on timestamp', () => {
      const now = Date.now();
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: now - 501000, // 501秒前に開始
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      // タイムスタンプベースの計算：600 - 501秒 = 99秒
      expect(state.timer.remainingTime).toBe(99);
    });

    it('should fallback to fixed decrement when no startTime', () => {
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: null,
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(99);
      expect(state.timer.elapsedTime).toBe(501);
    });

    it('should not tick below 0', () => {
      const now = Date.now();
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 0,
          elapsedTime: 600,
          startTime: now - 700000, // 700秒前（既に時間切れ）
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(0);
    });

    it('should not tick when not running', () => {
      const state = tournamentReducer(initialState, { type: 'TICK' });
      expect(state).toBe(initialState);
    });

    it('should tick during break', () => {
      const now = Date.now();
      const breakState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 300,
          elapsedTime: 0,
          startTime: now - 1000, // 1秒前に開始
          pausedAt: null,
        },
        isOnBreak: true,
        breakConfig: { enabled: true, frequency: 4, duration: 300 },
      };
      const state = tournamentReducer(breakState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(299);
    });
  });

  describe('NEXT_LEVEL action', () => {
    it('should advance to next level', () => {
      const state = tournamentReducer(initialState, { type: 'NEXT_LEVEL' });
      expect(state.currentLevel).toBe(1);
      expect(state.timer.remainingTime).toBe(initialState.levelDuration);
      expect(state.timer.elapsedTime).toBe(0);
      expect(state.timer.status).toBe('idle');
    });

    it('should not advance beyond last level', () => {
      const lastLevelState = {
        ...initialState,
        currentLevel: 4, // Last level (0-indexed)
      };
      const state = tournamentReducer(lastLevelState, { type: 'NEXT_LEVEL' });
      expect(state.currentLevel).toBe(4);
    });

    it('should trigger break when conditions are met', () => {
      const stateWithBreak = {
        ...initialState,
        currentLevel: 2,
        breakConfig: { enabled: true, frequency: 3, duration: 600 },
      };
      const state = tournamentReducer(stateWithBreak, { type: 'NEXT_LEVEL' });
      expect(state.isOnBreak).toBe(true);
      expect(state.timer.remainingTime).toBe(600);
      expect(state.currentLevel).toBe(3);
    });
  });

  describe('PREV_LEVEL action', () => {
    it('should go back to previous level', () => {
      const state = { ...initialState, currentLevel: 2 };
      const newState = tournamentReducer(state, { type: 'PREV_LEVEL' });
      expect(newState.currentLevel).toBe(1);
      expect(newState.timer.remainingTime).toBe(initialState.levelDuration);
      expect(newState.timer.elapsedTime).toBe(0);
      expect(newState.timer.status).toBe('idle');
    });

    it('should not go below 0', () => {
      const state = tournamentReducer(initialState, { type: 'PREV_LEVEL' });
      expect(state.currentLevel).toBe(0);
    });
  });

  describe('RESET action', () => {
    it('should reset timer for current level', () => {
      const state: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: Date.now() - 500000,
          pausedAt: null,
        },
      };
      const newState = tournamentReducer(state, { type: 'RESET' });
      expect(newState.timer.remainingTime).toBe(initialState.levelDuration);
      expect(newState.timer.elapsedTime).toBe(0);
      expect(newState.timer.status).toBe('idle');
      expect(newState.timer.startTime).toBeNull();
      expect(newState.timer.pausedAt).toBeNull();
    });

    it('should reset break timer during break', () => {
      const breakState: TournamentState = {
        ...initialState,
        isOnBreak: true,
        breakConfig: { enabled: true, frequency: 4, duration: 600 },
        timer: {
          status: 'running',
          remainingTime: 200,
          elapsedTime: 400,
          startTime: Date.now() - 400000,
          pausedAt: null,
        },
      };
      const state = tournamentReducer(breakState, { type: 'RESET' });
      expect(state.timer.status).toBe('idle');
      expect(state.timer.remainingTime).toBe(600);
      expect(state.timer.elapsedTime).toBe(0);
      expect(state.isOnBreak).toBe(true);
    });

    it('should reset remainingPlayers to totalPlayers', () => {
      const state: TournamentState = {
        ...initialState,
        totalPlayers: 10,
        remainingPlayers: 5,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: Date.now() - 500000,
          pausedAt: null,
        },
      };
      const newState = tournamentReducer(state, { type: 'RESET' });
      expect(newState.remainingPlayers).toBe(10);
      expect(newState.totalPlayers).toBe(10);
    });
  });

  describe('LOAD_STRUCTURE action', () => {
    it('should load structure data', () => {
      const structure = {
        id: 'test',
        name: 'Test',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 10 }],
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        levelDuration: 900,
        initialStack: 30000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const state = tournamentReducer(initialState, {
        type: 'LOAD_STRUCTURE',
        payload: { structure },
      });
      expect(state.blindLevels).toEqual(structure.blindLevels);
      expect(state.breakConfig).toEqual(structure.breakConfig);
      expect(state.levelDuration).toBe(900);
      expect(state.currentLevel).toBe(0);
      expect(state.timer.status).toBe('idle');
      expect(state.timer.remainingTime).toBe(900);
      expect(state.timer.elapsedTime).toBe(0);
    });

    it('should load initialStack from structure', () => {
      const structure = {
        id: 'test',
        name: 'Test',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 10 }],
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        levelDuration: 900,
        initialStack: 50000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const state = tournamentReducer(initialState, {
        type: 'LOAD_STRUCTURE',
        payload: { structure },
      });
      expect(state.initialStack).toBe(50000);
    });

    it('should reset player counts when loading structure', () => {
      const stateWithPlayers: TournamentState = {
        ...initialState,
        totalPlayers: 10,
        remainingPlayers: 5,
      };
      const structure = {
        id: 'test',
        name: 'Test',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 10 }],
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        levelDuration: 900,
        initialStack: 30000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const state = tournamentReducer(stateWithPlayers, {
        type: 'LOAD_STRUCTURE',
        payload: { structure },
      });
      expect(state.totalPlayers).toBe(0);
      expect(state.remainingPlayers).toBe(0);
    });
  });

  describe('UPDATE_BLIND_LEVELS action', () => {
    it('should update blind levels', () => {
      const newLevels = [
        { smallBlind: 100, bigBlind: 200, ante: 0 },
        { smallBlind: 200, bigBlind: 400, ante: 50 },
      ];
      const state = tournamentReducer(initialState, {
        type: 'UPDATE_BLIND_LEVELS',
        payload: { blindLevels: newLevels },
      });
      expect(state.blindLevels).toEqual(newLevels);
    });

    it('should reset to level 0 if current level is out of bounds', () => {
      const stateAtLevel2 = {
        ...initialState,
        currentLevel: 2,
      };
      const newLevels = [{ smallBlind: 100, bigBlind: 200, ante: 0 }];
      const state = tournamentReducer(stateAtLevel2, {
        type: 'UPDATE_BLIND_LEVELS',
        payload: { blindLevels: newLevels },
      });
      expect(state.currentLevel).toBe(0);
      expect(state.timer.status).toBe('idle');
    });
  });

  describe('UPDATE_BREAK_CONFIG action', () => {
    it('should update break config', () => {
      const newConfig = { enabled: true, frequency: 5, duration: 900 };
      const state = tournamentReducer(initialState, {
        type: 'UPDATE_BREAK_CONFIG',
        payload: { breakConfig: newConfig },
      });
      expect(state.breakConfig).toEqual(newConfig);
    });
  });

  describe('UPDATE_LEVEL_DURATION action', () => {
    it('should update level duration', () => {
      const state = tournamentReducer(initialState, {
        type: 'UPDATE_LEVEL_DURATION',
        payload: { levelDuration: 900 },
      });
      expect(state.levelDuration).toBe(900);
    });

    it('should update timer remaining time if idle', () => {
      const state = tournamentReducer(initialState, {
        type: 'UPDATE_LEVEL_DURATION',
        payload: { levelDuration: 900 },
      });
      expect(state.timer.remainingTime).toBe(900);
    });

    it('should not update timer remaining time if running', () => {
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 300,
          elapsedTime: 300,
          startTime: Date.now() - 300000,
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, {
        type: 'UPDATE_LEVEL_DURATION',
        payload: { levelDuration: 900 },
      });
      expect(state.timer.remainingTime).toBe(300);
    });
  });

  describe('Break handling', () => {
    it('should start break', () => {
      const state = tournamentReducer(initialState, { type: 'START_BREAK' });
      expect(state.isOnBreak).toBe(true);
      expect(state.timer.remainingTime).toBe(initialState.breakConfig.duration);
      expect(state.timer.status).toBe('idle');
    });

    it('should end break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
      };
      const state = tournamentReducer(onBreakState, { type: 'END_BREAK' });
      expect(state.isOnBreak).toBe(false);
    });

    it('should skip break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
      };
      const state = tournamentReducer(onBreakState, { type: 'SKIP_BREAK' });
      expect(state.isOnBreak).toBe(false);
      expect(state.timer.remainingTime).toBe(initialState.levelDuration);
    });

    it('should start break timer', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
      };
      const state = tournamentReducer(onBreakState, {
        type: 'START_BREAK_TIMER',
      });
      expect(state.timer.status).toBe('running');
    });
  });

  describe('SYNC_TIMER action', () => {
    it('should sync timer based on real elapsed time', () => {
      const now = Date.now();
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 500, // 表示上は500秒残っている
          elapsedTime: 100,
          startTime: now - 200000, // 実際は200秒経過
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, { type: 'SYNC_TIMER' });
      // 実際の経過時間に基づいて再計算: 600 - 200 = 400秒
      expect(state.timer.remainingTime).toBe(400);
      expect(state.timer.elapsedTime).toBe(200);
    });

    it('should not sync if timer is not running', () => {
      const state = tournamentReducer(initialState, { type: 'SYNC_TIMER' });
      expect(state).toBe(initialState);
    });

    it('should not sync if no startTime', () => {
      const pausedState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 500,
          elapsedTime: 100,
          startTime: null,
          pausedAt: null,
        },
      };
      const state = tournamentReducer(pausedState, { type: 'SYNC_TIMER' });
      expect(state).toBe(pausedState);
    });

    it('should advance to next level if time expired during background', () => {
      const now = Date.now();
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: now - 700000, // 700秒経過 (600秒のレベル時間を超過)
          pausedAt: null,
        },
      };
      const state = tournamentReducer(runningState, { type: 'SYNC_TIMER' });
      // 次のレベルに進むべき
      expect(state.currentLevel).toBe(1);
      expect(state.timer.status).toBe('running');
      expect(state.timer.remainingTime).toBe(600);
    });

    it('should sync break timer correctly', () => {
      const now = Date.now();
      const breakState: TournamentState = {
        ...initialState,
        isOnBreak: true,
        breakConfig: { enabled: true, frequency: 4, duration: 300 },
        timer: {
          status: 'running' as const,
          remainingTime: 250,
          elapsedTime: 50,
          startTime: now - 100000, // 100秒経過
          pausedAt: null,
        },
      };
      const state = tournamentReducer(breakState, { type: 'SYNC_TIMER' });
      // 300 - 100 = 200秒
      expect(state.timer.remainingTime).toBe(200);
      expect(state.isOnBreak).toBe(true);
    });

    it('should stop timer when last level expires', () => {
      const now = Date.now();
      const lastLevelState: TournamentState = {
        ...initialState,
        currentLevel: 4,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
          startTime: now - 700000, // 700秒経過 (600秒を超過)
          pausedAt: null,
        },
      };
      const state = tournamentReducer(lastLevelState, { type: 'SYNC_TIMER' });
      expect(state.timer.status).toBe('idle');
      expect(state.timer.remainingTime).toBe(0);
      expect(state.currentLevel).toBe(4);
    });
  });

  describe('Timestamp-based START/PAUSE', () => {
    it('should set startTime on START', () => {
      const beforeStart = Date.now();
      const state = tournamentReducer(initialState, { type: 'START' });
      const afterStart = Date.now();

      expect(state.timer.startTime).not.toBeNull();
      expect(state.timer.startTime).toBeGreaterThanOrEqual(beforeStart);
      expect(state.timer.startTime).toBeLessThanOrEqual(afterStart);
    });

    it('should set pausedAt on PAUSE', () => {
      const runningState: TournamentState = {
        ...initialState,
        timer: {
          ...initialState.timer,
          status: 'running' as const,
          startTime: Date.now() - 100000,
          pausedAt: null,
        },
      };

      const beforePause = Date.now();
      const state = tournamentReducer(runningState, { type: 'PAUSE' });
      const afterPause = Date.now();

      expect(state.timer.pausedAt).not.toBeNull();
      expect(state.timer.pausedAt).toBeGreaterThanOrEqual(beforePause);
      expect(state.timer.pausedAt).toBeLessThanOrEqual(afterPause);
    });

    it('should adjust startTime on resume from pause', () => {
      const originalStart = Date.now() - 100000; // 100秒前に開始
      const pausedAt = Date.now() - 50000; // 50秒前に一時停止

      const pausedState: TournamentState = {
        ...initialState,
        timer: {
          status: 'paused' as const,
          remainingTime: 550,
          elapsedTime: 50,
          startTime: originalStart,
          pausedAt: pausedAt,
        },
      };

      const state = tournamentReducer(pausedState, { type: 'START' });

      // startTimeは一時停止していた時間分だけ後ろにずらされる
      expect(state.timer.startTime).toBeGreaterThan(originalStart);
      expect(state.timer.pausedAt).toBeNull();
      expect(state.timer.status).toBe('running');
    });
  });

  describe('SET_PLAYERS action', () => {
    it('should set totalPlayers and remainingPlayers', () => {
      const state = tournamentReducer(initialState, {
        type: 'SET_PLAYERS',
        payload: { totalPlayers: 10, remainingPlayers: 8 },
      });
      expect(state.totalPlayers).toBe(10);
      expect(state.remainingPlayers).toBe(8);
    });

    it('should adjust remainingPlayers if it exceeds totalPlayers', () => {
      const state = tournamentReducer(initialState, {
        type: 'SET_PLAYERS',
        payload: { totalPlayers: 5, remainingPlayers: 10 },
      });
      expect(state.totalPlayers).toBe(5);
      expect(state.remainingPlayers).toBe(5);
    });

    it('should handle zero values', () => {
      const stateWithPlayers: TournamentState = {
        ...initialState,
        totalPlayers: 10,
        remainingPlayers: 5,
      };
      const state = tournamentReducer(stateWithPlayers, {
        type: 'SET_PLAYERS',
        payload: { totalPlayers: 0, remainingPlayers: 0 },
      });
      expect(state.totalPlayers).toBe(0);
      expect(state.remainingPlayers).toBe(0);
    });

    it('should allow updating totalPlayers while keeping remainingPlayers', () => {
      const stateWithPlayers: TournamentState = {
        ...initialState,
        totalPlayers: 10,
        remainingPlayers: 8,
      };
      const state = tournamentReducer(stateWithPlayers, {
        type: 'SET_PLAYERS',
        payload: { totalPlayers: 12, remainingPlayers: 8 },
      });
      expect(state.totalPlayers).toBe(12);
      expect(state.remainingPlayers).toBe(8);
    });
  });
});
