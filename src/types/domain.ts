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
  startTime: number | null; // 開始時刻（Date.now()）
  pausedAt: number | null; // 一時停止時刻（Date.now()）
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
  initialStack: number; // 初期スタック（チップ数）。0 = 未設定
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
  totalPlayers: number; // 参加人数（0 = 未設定）
  remainingPlayers: number; // 残り人数
  initialStack: number; // 現在のストラクチャーの初期スタック
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
