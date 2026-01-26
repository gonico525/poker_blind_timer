/**
 * ストレージ関連の型定義
 */

import type { Settings, Preset, TournamentState } from './domain';

/**
 * ストレージキー型
 */
export type StorageKey =
  | 'poker-timer-settings'
  | 'poker-timer-presets'
  | 'poker-timer-tournament';

/**
 * ストレージスキーマ
 */
export interface StorageSchema {
  'poker-timer-settings': Settings;
  'poker-timer-presets': Preset[];
  'poker-timer-tournament': TournamentState;
}
