/**
 * 型定義の統合エクスポート
 * 全ての型を @/types からインポート可能にする
 */

// ドメイン型
export type {
  BlindLevel,
  Timer,
  TimerStatus,
  Structure,
  StructureId,
  StructureType,
  BreakConfig,
  TournamentState,
  Settings,
  Theme,
} from './domain';

// Context型
export type {
  TournamentAction,
  SettingsAction,
  TournamentContextValue,
  SettingsContextValue,
  SettingsState,
} from './context';

// 通知型
export type {
  Notification,
  NotificationType,
  ConfirmOptions,
  NotificationContextValue,
} from './notification';

// ストレージ型
export type { StorageSchema, StorageKey } from './storage';
