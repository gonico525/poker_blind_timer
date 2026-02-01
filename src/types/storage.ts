/**
 * ストレージ関連の型定義
 */

import type { Settings, Structure, TournamentState } from './domain';

/**
 * ストレージキー型
 */
export type StorageKey =
  | 'poker-timer-settings'
  | 'poker-timer-structures'
  | 'poker-timer-tournament';

/**
 * ストレージスキーマ
 */
export interface StorageSchema {
  'poker-timer-settings': Settings;
  'poker-timer-structures': Structure[];
  'poker-timer-tournament': TournamentState;
}
