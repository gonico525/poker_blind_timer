import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AudioService } from '@/services/AudioService';
import { KeyboardService } from '@/services/KeyboardService';

// サービスのモック
vi.mock('@/services/AudioService');
vi.mock('@/services/KeyboardService');

// フックのモック
vi.mock('@/hooks', () => ({
  useAudioNotification: vi.fn(),
  useKeyboardShortcuts: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // AudioService.preload をモック化
    vi.mocked(AudioService.preload).mockResolvedValue(undefined);
    // KeyboardService.initialize をモック化
    vi.mocked(KeyboardService.initialize).mockReturnValue(undefined);
  });

  it('should show loading screen initially', () => {
    render(<App />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('should initialize AudioService during startup', async () => {
    render(<App />);
    await waitFor(() => {
      expect(AudioService.preload).toHaveBeenCalled();
    });
  });

  it('should initialize KeyboardService during startup', async () => {
    render(<App />);
    await waitFor(() => {
      expect(KeyboardService.initialize).toHaveBeenCalled();
    });
  });

  it('should show main layout after initialization', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  it('should not show loading screen after initialization', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });
  });

  it('should show error screen when initialization fails', async () => {
    vi.mocked(AudioService.preload).mockRejectedValue(new Error('Initialization failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('error-screen')).toBeInTheDocument();
    });
  });

  it('should display error message when initialization fails', async () => {
    vi.mocked(AudioService.preload).mockRejectedValue(new Error('Test error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/アプリの初期化に失敗しました/i)).toBeInTheDocument();
    });
  });
});
