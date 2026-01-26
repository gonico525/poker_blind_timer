/**
 * 通知システム関連の型定義
 */

/**
 * 通知タイプ
 */
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

/**
 * 通知オブジェクト
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

/**
 * 確認ダイアログのオプション
 */
export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

/**
 * NotificationContext の値
 */
export interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}
