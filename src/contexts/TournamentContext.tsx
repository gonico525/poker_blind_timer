import React, { createContext, useContext, useReducer } from 'react';
import type {
  TournamentState,
  TournamentAction,
  TournamentContextValue,
} from '@/types';
import { shouldTakeBreak } from '@/domain/models/Break';

// Reducer
export function tournamentReducer(
  state: TournamentState,
  action: TournamentAction
): TournamentState {
  switch (action.type) {
    case 'START': {
      // 既に実行中であれば開始しない
      if (state.timer.status === 'running') {
        return state;
      }
      return {
        ...state,
        timer: { ...state.timer, status: 'running' },
      };
    }

    case 'PAUSE': {
      // 実行中でなければ停止しない
      if (state.timer.status !== 'running') {
        return state;
      }
      return {
        ...state,
        timer: { ...state.timer, status: 'paused' },
      };
    }

    case 'TICK': {
      // 実行中でなければtickしない
      if (state.timer.status !== 'running') {
        return state;
      }

      // 休憩中の場合、タイマーをカウントダウン
      if (state.isOnBreak) {
        const newRemainingTime = Math.max(0, state.timer.remainingTime - 1);
        const newElapsedTime =
          state.timer.elapsedTime + (newRemainingTime > 0 ? 1 : 0);

        // 休憩タイマーが0になったら、休憩を終了して次のレベルに進む（自動進行のためタイマーは継続）
        if (newRemainingTime === 0 && state.timer.remainingTime > 0) {
          return {
            ...state,
            isOnBreak: false,
            timer: {
              status: 'running',
              remainingTime: state.levelDuration,
              elapsedTime: 0,
            },
          };
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

      // 通常のタイマーをカウントダウン
      const newRemainingTime = Math.max(0, state.timer.remainingTime - 1);
      const newElapsedTime =
        state.timer.elapsedTime + (newRemainingTime > 0 ? 1 : 0);

      // タイマーが0になったら、次のレベルに自動進行
      if (newRemainingTime === 0 && state.timer.remainingTime > 0) {
        // 最後のレベルの場合はタイマーを停止するのみ
        if (state.currentLevel >= state.blindLevels.length - 1) {
          return {
            ...state,
            timer: {
              status: 'idle',
              remainingTime: 0,
              elapsedTime: state.timer.elapsedTime + 1,
            },
          };
        }

        // 休憩判定（現在のレベル終了後に休憩を取るか）
        const takeBreak = shouldTakeBreak(
          state.currentLevel,
          state.breakConfig
        );
        const newLevel = state.currentLevel + 1;

        if (takeBreak) {
          // 休憩を開始（自動進行のため、タイマーは継続して動作）
          return {
            ...state,
            currentLevel: newLevel,
            isOnBreak: true,
            timer: {
              status: 'running',
              remainingTime: state.breakConfig.duration,
              elapsedTime: 0,
            },
          };
        }

        // 次のレベルに進む
        return {
          ...state,
          currentLevel: newLevel,
          timer: {
            status: 'running',
            remainingTime: state.levelDuration,
            elapsedTime: 0,
          },
        };
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

    case 'NEXT_LEVEL': {
      // タイマーが動いている場合は変更不可
      if (state.timer.status === 'running') {
        return state;
      }

      // 最後のレベルの場合は進めない
      if (state.currentLevel >= state.blindLevels.length - 1) {
        return state;
      }

      // 休憩判定（現在のレベル終了後に休憩を取るか）
      const takeBreak = shouldTakeBreak(state.currentLevel, state.breakConfig);
      const newLevel = state.currentLevel + 1;

      if (takeBreak) {
        // 休憩を開始
        return {
          ...state,
          currentLevel: newLevel,
          isOnBreak: true,
          timer: {
            status: 'idle',
            remainingTime: state.breakConfig.duration,
            elapsedTime: 0,
          },
        };
      }

      // 次のレベルに進む
      return {
        ...state,
        currentLevel: newLevel,
        timer: {
          status: 'idle',
          remainingTime: state.levelDuration,
          elapsedTime: 0,
        },
      };
    }

    case 'PREV_LEVEL': {
      // タイマーが動いている場合は変更不可
      if (state.timer.status === 'running') {
        return state;
      }

      // 最初のレベルの場合は戻れない
      if (state.currentLevel <= 0) {
        return state;
      }

      return {
        ...state,
        currentLevel: state.currentLevel - 1,
        timer: {
          status: 'idle',
          remainingTime: state.levelDuration,
          elapsedTime: 0,
        },
      };
    }

    case 'RESET': {
      return {
        ...state,
        timer: {
          status: 'idle',
          remainingTime: state.isOnBreak
            ? state.breakConfig.duration
            : state.levelDuration,
          elapsedTime: 0,
        },
      };
    }

    case 'LOAD_STRUCTURE': {
      const { structure } = action.payload;
      return {
        ...state,
        blindLevels: structure.blindLevels,
        breakConfig: structure.breakConfig,
        levelDuration: structure.levelDuration,
        currentLevel: 0,
        timer: {
          status: 'idle',
          remainingTime: structure.levelDuration,
          elapsedTime: 0,
        },
        isOnBreak: false,
      };
    }

    case 'UPDATE_BLIND_LEVELS': {
      const { blindLevels } = action.payload;
      // 現在のレベルが新しいブラインドレベル数を超えている場合、レベル0にリセット
      const newCurrentLevel =
        state.currentLevel >= blindLevels.length ? 0 : state.currentLevel;
      const shouldReset = newCurrentLevel !== state.currentLevel;

      return {
        ...state,
        blindLevels,
        currentLevel: newCurrentLevel,
        timer: shouldReset
          ? {
              status: 'idle',
              remainingTime: state.levelDuration,
              elapsedTime: 0,
            }
          : state.timer,
      };
    }

    case 'UPDATE_BREAK_CONFIG': {
      return {
        ...state,
        breakConfig: action.payload.breakConfig,
      };
    }

    case 'UPDATE_LEVEL_DURATION': {
      const { levelDuration } = action.payload;
      // idleの場合のみタイマーを更新
      const shouldUpdateTimer = state.timer.status === 'idle';

      return {
        ...state,
        levelDuration,
        timer: shouldUpdateTimer
          ? { ...state.timer, remainingTime: levelDuration }
          : state.timer,
      };
    }

    case 'START_BREAK': {
      return {
        ...state,
        isOnBreak: true,
        timer: {
          status: 'idle',
          remainingTime: state.breakConfig.duration,
          elapsedTime: 0,
        },
      };
    }

    case 'END_BREAK': {
      return {
        ...state,
        isOnBreak: false,
      };
    }

    case 'SKIP_BREAK': {
      // 休憩中でない場合は何もしない
      if (!state.isOnBreak) {
        return state;
      }

      // 休憩をスキップして次のレベルに進む（タイマーをリセット）
      return {
        ...state,
        isOnBreak: false,
        timer: {
          status: 'idle',
          remainingTime: state.levelDuration,
          elapsedTime: 0,
        },
      };
    }

    case 'START_BREAK_TIMER': {
      return {
        ...state,
        timer: { ...state.timer, status: 'running' },
      };
    }

    default:
      return state;
  }
}

// Context
const TournamentContext = createContext<TournamentContextValue | undefined>(
  undefined
);

// Provider Props
interface TournamentProviderProps {
  children: React.ReactNode;
  initialState?: TournamentState;
}

// Provider
export function TournamentProvider({
  children,
  initialState: providedInitialState,
}: TournamentProviderProps) {
  const [state, dispatch] = useReducer(
    tournamentReducer,
    providedInitialState ?? {
      timer: { status: 'idle', remainingTime: 600, elapsedTime: 0 },
      currentLevel: 0,
      blindLevels: [],
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      levelDuration: 600,
      isOnBreak: false,
    }
  );

  const contextValue: TournamentContextValue = {
    state,
    dispatch,
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
}

// Hook
export function useTournament(): TournamentContextValue {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
