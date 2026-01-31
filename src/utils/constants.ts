/**
 * アプリケーション全体で使用する定数
 */

// ストレージキー
export const STORAGE_KEYS = {
  SETTINGS: 'poker-timer-settings',
  STRUCTURES: 'poker-timer-structures',
  TOURNAMENT_STATE: 'poker-timer-tournament',
} as const;

// 制限値
export const LIMITS = {
  MAX_STRUCTURES: 20,
  MAX_BLIND_LEVELS: 50,
  MIN_LEVEL_DURATION: 60, // 1分
  MAX_LEVEL_DURATION: 3600, // 60分
  MIN_BREAK_DURATION: 60, // 1分
  MAX_BREAK_DURATION: 1800, // 30分
  MIN_BREAK_FREQUENCY: 1,
  MAX_BREAK_FREQUENCY: 20,
} as const;

// デフォルト値
export const DEFAULTS = {
  LEVEL_DURATION: 600, // 10分
  BREAK_DURATION: 600, // 10分
  BREAK_FREQUENCY: 4, // 4レベルごと
  VOLUME: 0.7,
} as const;

// 音声ファイルパス
export const AUDIO_FILES = {
  LEVEL_CHANGE: '/sounds/level-change.mp3',
  WARNING_1MIN: '/sounds/warning-1min.mp3',
  BREAK_START: '/sounds/break-start.mp3',
} as const;
