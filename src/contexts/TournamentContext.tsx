/* eslint-disable react-refresh/only-export-components */
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

      const now = Date.now();

      // 一時停止からの再開の場合、startTimeを調整
      if (state.timer.status === 'paused' && state.timer.pausedAt) {
        const pauseDuration = now - state.timer.pausedAt;
        const adjustedStartTime =
          (state.timer.startTime || now) + pauseDuration;
        return {
          ...state,
          timer: {
            ...state.timer,
            status: 'running',
            startTime: adjustedStartTime,
            pausedAt: null,
          },
        };
      }

      // 新規開始の場合
      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'running',
          startTime: now,
          pausedAt: null,
        },
      };
    }

    case 'PAUSE': {
      // 実行中でなければ停止しない
      if (state.timer.status !== 'running') {
        return state;
      }
      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'paused',
          pausedAt: Date.now(),
        },
      };
    }

    case 'TICK': {
      // 実行中でなければtickしない
      if (state.timer.status !== 'running') {
        return state;
      }

      // タイムスタンプベースの時間計算
      const now = Date.now();
      const { startTime } = state.timer;

      // 休憩中の場合
      if (state.isOnBreak) {
        const duration = state.breakConfig.duration;
        let newRemainingTime: number;
        let newElapsedTime: number;

        if (startTime) {
          // タイムスタンプベースで計算
          const actualElapsed = (now - startTime) / 1000;
          newRemainingTime = Math.max(0, duration - actualElapsed);
          newElapsedTime = Math.min(actualElapsed, duration);
        } else {
          // フォールバック: 従来の固定デクリメント
          newRemainingTime = Math.max(0, state.timer.remainingTime - 1);
          newElapsedTime =
            state.timer.elapsedTime + (newRemainingTime > 0 ? 1 : 0);
        }

        // 表示用に整数化（ただし内部計算は小数点以下を保持）
        const displayRemaining = Math.ceil(newRemainingTime);
        const prevDisplayRemaining = Math.ceil(state.timer.remainingTime);

        // 休憩タイマーが0になったら、休憩を終了して次のレベルに進む
        if (displayRemaining === 0 && prevDisplayRemaining > 0) {
          return {
            ...state,
            isOnBreak: false,
            timer: {
              status: 'running',
              remainingTime: state.levelDuration,
              elapsedTime: 0,
              startTime: Date.now(),
              pausedAt: null,
            },
          };
        }

        return {
          ...state,
          timer: {
            ...state.timer,
            remainingTime: displayRemaining,
            elapsedTime: Math.floor(newElapsedTime),
          },
        };
      }

      // 通常のタイマー計算
      const duration = state.isOnBreak
        ? state.breakConfig.duration
        : state.levelDuration;
      let newRemainingTime: number;
      let newElapsedTime: number;

      if (startTime) {
        // タイムスタンプベースで計算
        const actualElapsed = (now - startTime) / 1000;
        newRemainingTime = Math.max(0, duration - actualElapsed);
        newElapsedTime = Math.min(actualElapsed, duration);
      } else {
        // フォールバック: 従来の固定デクリメント
        newRemainingTime = Math.max(0, state.timer.remainingTime - 1);
        newElapsedTime =
          state.timer.elapsedTime + (newRemainingTime > 0 ? 1 : 0);
      }

      // 表示用に整数化
      const displayRemaining = Math.ceil(newRemainingTime);
      const prevDisplayRemaining = Math.ceil(state.timer.remainingTime);

      // タイマーが0になったら、次のレベルに自動進行
      if (displayRemaining === 0 && prevDisplayRemaining > 0) {
        // 最後のレベルの場合はタイマーを停止するのみ
        if (state.currentLevel >= state.blindLevels.length - 1) {
          return {
            ...state,
            timer: {
              status: 'idle',
              remainingTime: 0,
              elapsedTime: Math.floor(newElapsedTime),
              startTime: null,
              pausedAt: null,
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
              startTime: Date.now(),
              pausedAt: null,
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
            startTime: Date.now(),
            pausedAt: null,
          },
        };
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          remainingTime: displayRemaining,
          elapsedTime: Math.floor(newElapsedTime),
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
            startTime: null,
            pausedAt: null,
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
          startTime: null,
          pausedAt: null,
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
          startTime: null,
          pausedAt: null,
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
          startTime: null,
          pausedAt: null,
        },
        // 残り人数を参加人数にリセット
        remainingPlayers: state.totalPlayers,
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
          startTime: null,
          pausedAt: null,
        },
        isOnBreak: false,
        // 新しいストラクチャーの初期スタックを設定し、プレイヤー数をリセット
        initialStack: structure.initialStack,
        totalPlayers: 0,
        remainingPlayers: 0,
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
              startTime: null,
              pausedAt: null,
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
          startTime: null,
          pausedAt: null,
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
          startTime: null,
          pausedAt: null,
        },
      };
    }

    case 'START_BREAK_TIMER': {
      return {
        ...state,
        timer: {
          ...state.timer,
          status: 'running',
          startTime: Date.now(),
          pausedAt: null,
        },
      };
    }

    case 'SYNC_TIMER': {
      // バックグラウンドから復帰時に実時間に基づいて再計算
      if (!state.timer.startTime || state.timer.status !== 'running') {
        return state;
      }

      const now = Date.now();
      const duration = state.isOnBreak
        ? state.breakConfig.duration
        : state.levelDuration;
      const actualElapsed = (now - state.timer.startTime) / 1000;
      const newRemainingTime = Math.max(0, duration - actualElapsed);

      // 表示用に整数化
      const displayRemaining = Math.ceil(newRemainingTime);
      const prevDisplayRemaining = Math.ceil(state.timer.remainingTime);

      // タイマーが0になっていた場合、自動進行を処理
      if (displayRemaining === 0 && prevDisplayRemaining > 0) {
        // 休憩中の場合
        if (state.isOnBreak) {
          return {
            ...state,
            isOnBreak: false,
            timer: {
              status: 'running',
              remainingTime: state.levelDuration,
              elapsedTime: 0,
              startTime: Date.now(),
              pausedAt: null,
            },
          };
        }

        // 最後のレベルの場合はタイマーを停止
        if (state.currentLevel >= state.blindLevels.length - 1) {
          return {
            ...state,
            timer: {
              status: 'idle',
              remainingTime: 0,
              elapsedTime: Math.floor(actualElapsed),
              startTime: null,
              pausedAt: null,
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
          return {
            ...state,
            currentLevel: newLevel,
            isOnBreak: true,
            timer: {
              status: 'running',
              remainingTime: state.breakConfig.duration,
              elapsedTime: 0,
              startTime: Date.now(),
              pausedAt: null,
            },
          };
        }

        return {
          ...state,
          currentLevel: newLevel,
          timer: {
            status: 'running',
            remainingTime: state.levelDuration,
            elapsedTime: 0,
            startTime: Date.now(),
            pausedAt: null,
          },
        };
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          remainingTime: displayRemaining,
          elapsedTime: Math.floor(Math.min(actualElapsed, duration)),
        },
      };
    }

    case 'SET_PLAYERS': {
      const { totalPlayers, remainingPlayers } = action.payload;
      // remainingPlayers が totalPlayers を超えないように調整
      const adjustedRemainingPlayers = Math.min(remainingPlayers, totalPlayers);
      return {
        ...state,
        totalPlayers,
        remainingPlayers: adjustedRemainingPlayers,
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
      timer: {
        status: 'idle',
        remainingTime: 600,
        elapsedTime: 0,
        startTime: null,
        pausedAt: null,
      },
      currentLevel: 0,
      blindLevels: [],
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      levelDuration: 600,
      isOnBreak: false,
      totalPlayers: 0,
      remainingPlayers: 0,
      initialStack: 0,
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
