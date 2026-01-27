import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayout from './MainLayout';

// フックのモック
vi.mock('@/hooks', () => ({
  useAudioNotification: vi.fn(),
  useKeyboardShortcuts: vi.fn(),
}));

describe('MainLayout', () => {
  it('should render main layout', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('should render placeholder content', () => {
    render(<MainLayout />);
    expect(screen.getByText(/Poker Blind Timer/i)).toBeInTheDocument();
  });

  it('should call useAudioNotification hook', async () => {
    const { useAudioNotification } = await import('@/hooks');
    render(<MainLayout />);
    expect(useAudioNotification).toHaveBeenCalled();
  });

  it('should call useKeyboardShortcuts hook', async () => {
    const { useKeyboardShortcuts } = await import('@/hooks');
    render(<MainLayout />);
    expect(useKeyboardShortcuts).toHaveBeenCalled();
  });
});
