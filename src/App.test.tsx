import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AudioService } from '@/services/AudioService';
import { KeyboardService } from '@/services/KeyboardService';

// サービスのモック
vi.mock('@/services/AudioService');
vi.mock('@/services/KeyboardService');

// コンテキストのモック
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    state: {
      settings: {
        theme: 'dark',
        volume: 0.7,
        soundEnabled: true,
      },
    },
    dispatch: vi.fn(),
  })),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// StructureManagementModalをモック
vi.mock('@/components', async () => {
  const actual = await vi.importActual('@/components');
  return {
    ...actual,
    StructureManagementModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="structure-management-modal">Modal</div> : null,
  };
});

// フックのモック
vi.mock('@/hooks', () => ({
  useAudioNotification: vi.fn(),
  useKeyboardShortcuts: vi.fn(),
  useTimer: vi.fn(() => ({
    status: 'idle',
    isOnBreak: false,
    remainingTime: 600,
    elapsedTime: 0,
    currentLevel: 1,
    currentBlind: { level: 1, smallBlind: 25, bigBlind: 50, ante: 0 },
    nextBlind: { level: 2, smallBlind: 50, bigBlind: 100, ante: 0 },
    levelsUntilBreak: 4,
    hasNextLevel: true,
    hasPrevLevel: false,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    nextLevel: vi.fn(),
    prevLevel: vi.fn(),
    skipBreak: vi.fn(),
  })),
  useStructures: vi.fn(() => ({
    structures: [
      {
        id: 'default-standard',
        name: 'Standard Tournament',
        blindLevels: [{ level: 1, smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 300 },
      },
    ],
    currentStructureId: 'default-standard',
    loadStructure: vi.fn(),
  })),
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
    vi.mocked(AudioService.preload).mockRejectedValue(
      new Error('Initialization failed')
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('error-screen')).toBeInTheDocument();
    });
  });

  it('should display error message when initialization fails', async () => {
    vi.mocked(AudioService.preload).mockRejectedValue(new Error('Test error'));

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/アプリの初期化に失敗しました/i)
      ).toBeInTheDocument();
    });
  });
});
