/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  Notification,
  NotificationType,
  ConfirmOptions,
  NotificationContextValue,
} from '@/types';

// Context
const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

// Provider Props
interface NotificationProviderProps {
  children: React.ReactNode;
}

// Default durations for different notification types (in milliseconds)
const DEFAULT_DURATIONS: Record<NotificationType, number | undefined> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: undefined, // Manual dismiss only
};

// Provider
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  const showNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const duration =
        notification.duration ?? DEFAULT_DURATIONS[notification.type];

      const newNotification: Notification = {
        ...notification,
        id,
        duration,
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-dismiss if duration is specified
      if (duration !== undefined) {
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== newNotification.id)
          );
        }, duration);
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showConfirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          options,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirmResponse = useCallback((confirmed: boolean) => {
    setConfirmState((prev) => {
      if (prev.resolve) {
        prev.resolve(confirmed);
      }
      return {
        isOpen: false,
        options: null,
        resolve: null,
      };
    });
  }, []);

  const contextValue: NotificationContextValue = {
    notifications,
    showNotification,
    dismissNotification,
    showConfirm,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Confirmation dialog would be rendered here in actual UI implementation */}
      {confirmState.isOpen && confirmState.options && (
        <div data-testid="confirm-dialog">
          <h3>{confirmState.options.title}</h3>
          <p>{confirmState.options.message}</p>
          <button onClick={() => handleConfirmResponse(true)}>
            {confirmState.options.confirmLabel ?? '確認'}
          </button>
          <button onClick={() => handleConfirmResponse(false)}>
            {confirmState.options.cancelLabel ?? 'キャンセル'}
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
