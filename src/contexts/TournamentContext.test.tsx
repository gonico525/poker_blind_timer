import { describe, it, expect } from 'vitest';
import type { TournamentState } from '@/types';
import { tournamentReducer } from './TournamentContext';

describe('tournamentReducer', () => {
  const initialState: TournamentState = {
    timer: { status: 'idle', remainingTime: 600, elapsedTime: 0 },
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
    breakRemainingTime: 0,
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

    it('should not start during break', () => {
      const breakState = {
        ...initialState,
        isOnBreak: true,
      };
      const state = tournamentReducer(breakState, { type: 'START' });
      expect(state).toBe(breakState);
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
    it('should decrement remainingTime by 1', () => {
      const runningState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
        },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(99);
      expect(state.timer.elapsedTime).toBe(501);
    });

    it('should not tick below 0', () => {
      const runningState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 0,
          elapsedTime: 600,
        },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(0);
      expect(state.timer.elapsedTime).toBe(600);
    });

    it('should not tick when not running', () => {
      const state = tournamentReducer(initialState, { type: 'TICK' });
      expect(state).toBe(initialState);
    });

    it('should tick during break', () => {
      const breakState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 0,
          elapsedTime: 600,
        },
        isOnBreak: true,
        breakRemainingTime: 300,
      };
      const state = tournamentReducer(breakState, { type: 'TICK' });
      expect(state.breakRemainingTime).toBe(299);
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
      expect(state.breakRemainingTime).toBe(600);
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
      const state = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 100,
          elapsedTime: 500,
        },
      };
      const newState = tournamentReducer(state, { type: 'RESET' });
      expect(newState.timer.remainingTime).toBe(initialState.levelDuration);
      expect(newState.timer.elapsedTime).toBe(0);
      expect(newState.timer.status).toBe('idle');
    });

    it('should not reset during break', () => {
      const breakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 300,
      };
      const state = tournamentReducer(breakState, { type: 'RESET' });
      expect(state).toBe(breakState);
    });
  });

  describe('LOAD_PRESET action', () => {
    it('should load preset data', () => {
      const preset = {
        id: 'test',
        name: 'Test',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 10 }],
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        levelDuration: 900,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const state = tournamentReducer(initialState, {
        type: 'LOAD_PRESET',
        payload: { preset },
      });
      expect(state.blindLevels).toEqual(preset.blindLevels);
      expect(state.breakConfig).toEqual(preset.breakConfig);
      expect(state.levelDuration).toBe(900);
      expect(state.currentLevel).toBe(0);
      expect(state.timer.status).toBe('idle');
      expect(state.timer.remainingTime).toBe(900);
      expect(state.timer.elapsedTime).toBe(0);
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
      const runningState = {
        ...initialState,
        timer: {
          status: 'running' as const,
          remainingTime: 300,
          elapsedTime: 300,
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
      expect(state.breakRemainingTime).toBe(initialState.breakConfig.duration);
      expect(state.timer.status).toBe('idle');
    });

    it('should end break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 100,
      };
      const state = tournamentReducer(onBreakState, { type: 'END_BREAK' });
      expect(state.isOnBreak).toBe(false);
      expect(state.breakRemainingTime).toBe(0);
    });

    it('should skip break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 300,
      };
      const state = tournamentReducer(onBreakState, { type: 'SKIP_BREAK' });
      expect(state.isOnBreak).toBe(false);
      expect(state.breakRemainingTime).toBe(0);
    });

    it('should start break timer', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 300,
      };
      const state = tournamentReducer(onBreakState, {
        type: 'START_BREAK_TIMER',
      });
      expect(state.timer.status).toBe('running');
    });
  });
});
