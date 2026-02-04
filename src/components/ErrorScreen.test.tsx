import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorScreen from './ErrorScreen';

describe('ErrorScreen', () => {
  it('should render error screen with message', () => {
    render(<ErrorScreen message="エラーが発生しました" />);
    expect(screen.getByTestId('error-screen')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<ErrorScreen message="テストエラー" />);
    expect(screen.getByText('テストエラー')).toBeInTheDocument();
  });

  it('should display default message when no message provided', () => {
    render(<ErrorScreen />);
    expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
  });

  it('should display error icon', () => {
    render(<ErrorScreen message="エラー" />);
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('should display retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen message="エラー" onRetry={onRetry} />);
    expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen message="エラー" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /再試行/i });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not display retry button when onRetry is not provided', () => {
    render(<ErrorScreen message="エラー" />);
    expect(
      screen.queryByRole('button', { name: /再試行/i })
    ).not.toBeInTheDocument();
  });
});
