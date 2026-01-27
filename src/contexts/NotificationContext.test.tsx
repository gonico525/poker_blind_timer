import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from './NotificationContext';

// Test component that uses the notification context
function TestComponent() {
  const { notifications, showNotification, dismissNotification } =
    useNotification();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          data-testid={`notification-${notification.id}`}
        >
          <span data-testid={`notification-type-${notification.id}`}>
            {notification.type}
          </span>
          <span data-testid={`notification-message-${notification.id}`}>
            {notification.message}
          </span>
          <button
            data-testid={`dismiss-${notification.id}`}
            onClick={() => dismissNotification(notification.id)}
          >
            Dismiss
          </button>
        </div>
      ))}
      <button
        data-testid="show-notification"
        onClick={() =>
          showNotification({
            type: 'success',
            message: 'Test notification',
          })
        }
      >
        Show Notification
      </button>
    </div>
  );
}

describe('NotificationContext', () => {
  it('should throw error when useNotification is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotification must be used within a NotificationProvider');

    consoleError.mockRestore();
  });

  it('should show notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');

    const button = screen.getByTestId('show-notification');
    act(() => {
      button.click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
  });

  it('should dismiss notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByTestId('show-notification');
    act(() => {
      button.click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');

    // Get the notification id from the DOM
    const notificationElement = screen.getByTestId(
      /notification-notification-/
    );
    const notificationId = notificationElement
      .getAttribute('data-testid')
      ?.replace('notification-', '');

    if (!notificationId) {
      throw new Error('Notification id not found');
    }

    const dismissButton = screen.getByTestId(`dismiss-${notificationId}`);
    act(() => {
      dismissButton.click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });

  it('should show notification with correct type and message', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByTestId('show-notification');
    act(() => {
      button.click();
    });

    // Find notification elements
    const typeElement = screen.getByTestId(/notification-type-/);
    const messageElement = screen.getByTestId(/notification-message-/);

    expect(typeElement).toHaveTextContent('success');
    expect(messageElement).toHaveTextContent('Test notification');
  });

  it('should show multiple notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByTestId('show-notification');

    act(() => {
      button.click();
      button.click();
      button.click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
  });
});
