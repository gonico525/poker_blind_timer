/**
 * Context関連の型定義
 */

import type {
  TournamentState,
  Settings,
  Preset,
  PresetId,
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
  | { type: 'NEXT_LEVEL' }
  | { type: 'PREV_LEVEL' }
  | { type: 'START_BREAK' }
  | { type: 'END_BREAK' }
  | { type: 'SKIP_BREAK' }
  | { type: 'START_BREAK_TIMER' }
  | { type: 'LOAD_PRESET'; payload: { preset: Preset } }
  | { type: 'UPDATE_BLIND_LEVELS'; payload: { blindLevels: BlindLevel[] } }
  | { type: 'UPDATE_BREAK_CONFIG'; payload: { breakConfig: BreakConfig } }
  | { type: 'UPDATE_LEVEL_DURATION'; payload: { levelDuration: number } };

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
  | { type: 'ADD_PRESET'; payload: { preset: Preset } }
  | { type: 'UPDATE_PRESET'; payload: { preset: Preset } }
  | { type: 'DELETE_PRESET'; payload: { presetId: PresetId } }
  | { type: 'SET_PRESETS'; payload: { presets: Preset[] } }
  | { type: 'SET_CURRENT_PRESET'; payload: { presetId: PresetId | null } }
  | { type: 'IMPORT_PRESETS'; payload: { presets: Preset[] } };

/**
 * SettingsContext の状態
 */
export interface SettingsState {
  settings: Settings;
  presets: Preset[];
  currentPresetId: PresetId | null;
}

/**
 * SettingsContext の値
 */
export interface SettingsContextValue {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
}
