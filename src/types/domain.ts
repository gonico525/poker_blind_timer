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
 * ストラクチャーID型
 */
export type StructureId = string;

/**
 * ストラクチャータイプ
 */
export type StructureType =
  | 'default'
  | 'standard'
  | 'turbo'
  | 'deepstack'
  | 'custom';

/**
 * ストラクチャーエンティティ
 * ポーカートーナメントのブラインドストラクチャーを定義
 */
export interface Structure {
  id: StructureId;
  name: string;
  type: StructureType;
  blindLevels: BlindLevel[];
  levelDuration: number;
  breakConfig: BreakConfig;
  createdAt: number;
  updatedAt: number;
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
  keyboardShortcutsEnabled: boolean;
}
