/**
 * Context関連の型定義
 */

import type {
  TournamentState,
  Settings,
  Structure,
  StructureId,
  Theme,
  BlindLevel,
  BreakConfig,
} from './domain';

/**
 * TournamentContext のアクション型
 */
export type TournamentAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'TICK' }
  | { type: 'SYNC_TIMER' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'PREV_LEVEL' }
  | { type: 'START_BREAK' }
  | { type: 'END_BREAK' }
  | { type: 'SKIP_BREAK' }
  | { type: 'START_BREAK_TIMER' }
  | { type: 'LOAD_STRUCTURE'; payload: { structure: Structure } }
  | { type: 'UPDATE_BLIND_LEVELS'; payload: { blindLevels: BlindLevel[] } }
  | { type: 'UPDATE_BREAK_CONFIG'; payload: { breakConfig: BreakConfig } }
  | { type: 'UPDATE_LEVEL_DURATION'; payload: { levelDuration: number } }
  | {
      type: 'SET_PLAYERS';
      payload: { totalPlayers: number; remainingPlayers: number };
    };

/**
 * TournamentContext の値
 */
export interface TournamentContextValue {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
}

/**
 * SettingsContext のアクション型
 */
export type SettingsAction =
  | { type: 'SET_THEME'; payload: { theme: Theme } }
  | { type: 'SET_SOUND_ENABLED'; payload: { enabled: boolean } }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'SET_KEYBOARD_SHORTCUTS_ENABLED'; payload: { enabled: boolean } }
  | { type: 'ADD_STRUCTURE'; payload: { structure: Structure } }
  | { type: 'UPDATE_STRUCTURE'; payload: { structure: Structure } }
  | { type: 'DELETE_STRUCTURE'; payload: { structureId: StructureId } }
  | { type: 'SET_STRUCTURES'; payload: { structures: Structure[] } }
  | {
      type: 'SET_CURRENT_STRUCTURE';
      payload: { structureId: StructureId | null };
    }
  | { type: 'IMPORT_STRUCTURES'; payload: { structures: Structure[] } };

/**
 * SettingsContext の状態
 */
export interface SettingsState {
  settings: Settings;
  structures: Structure[];
  currentStructureId: StructureId | null;
}

/**
 * SettingsContext の値
 */
export interface SettingsContextValue {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
}
