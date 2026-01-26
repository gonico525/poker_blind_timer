/**
 * ドメイン型定義
 * アプリケーションのコアとなるビジネスドメインの型を定義
 */

/**
 * ブラインドレベル（バリューオブジェクト）
 */
export interface BlindLevel {
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly ante: number;
}

/**
 * タイマーの状態
 */
export type TimerStatus = 'idle' | 'running' | 'paused';

/**
 * タイマーエンティティ
 */
export interface Timer {
  status: TimerStatus;
  remainingTime: number;
  elapsedTime: number;
}

/**
 * 休憩設定（バリューオブジェクト）
 */
export interface BreakConfig {
  readonly enabled: boolean;
  readonly frequency: number;
  readonly duration: number;
}

/**
 * プリセットID型
 */
export type PresetId = string;

/**
 * プリセットタイプ
 */
export type PresetType = 'default' | 'custom';

/**
 * プリセットエンティティ
 */
export interface Preset {
  id: PresetId;
  name: string;
  type: PresetType;
  blindLevels: BlindLevel[];
  levelDuration: number;
  breakConfig: BreakConfig;
}

/**
 * トーナメント状態
 */
export interface TournamentState {
  timer: Timer;
  currentLevel: number;
  blindLevels: BlindLevel[];
  breakConfig: BreakConfig;
  levelDuration: number;
  isOnBreak: boolean;
  breakRemainingTime: number;
}

/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark';

/**
 * アプリケーション設定
 */
export interface Settings {
  theme: Theme;
  soundEnabled: boolean;
  volume: number;
}
