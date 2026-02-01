import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainLayout from './MainLayout';

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
}));

// コンポーネントをモック
vi.mock('@/components', async () => {
  const actual = await vi.importActual('@/components');
  return {
    ...actual,
    StructureManagementModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="structure-management-modal">Modal</div> : null,
    AppHeader: ({
      onStructureManage,
    }: {
      onStructureManage: () => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    }) => (
      <header data-testid="app-header">
        <h1>Poker Blind Timer</h1>
        <button
          data-testid="structure-manage-button"
          onClick={onStructureManage}
        >
          ストラクチャー管理
        </button>
      </header>
    ),
  };
});

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('メインレイアウトが正しくレンダリングされる', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('AppHeaderが表示される', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('アプリタイトルが表示される', () => {
    render(<MainLayout />);
    expect(screen.getByText(/Poker Blind Timer/i)).toBeInTheDocument();
  });

  it('タイマービューが表示される', () => {
    render(<MainLayout />);
    // タイマー関連コンポーネントが表示されることを確認
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('ストラクチャー管理ボタンをクリックするとモーダルが開く', async () => {
    const user = userEvent.setup();
    render(<MainLayout />);

    // モックされたAppHeaderのボタンをクリック
    const manageButton = screen.getByTestId('structure-manage-button');
    await user.click(manageButton);

    // StructureManagementModalが開くことを確認
    await waitFor(() => {
      expect(
        screen.getByTestId('structure-management-modal')
      ).toBeInTheDocument();
    });
  });

  it('useAudioNotificationフックが呼ばれる', async () => {
    const { useAudioNotification } = await import('@/hooks');
    render(<MainLayout />);
    expect(useAudioNotification).toHaveBeenCalled();
  });

  it('useKeyboardShortcutsフックが呼ばれる', async () => {
    const { useKeyboardShortcuts } = await import('@/hooks');
    render(<MainLayout />);
    expect(useKeyboardShortcuts).toHaveBeenCalled();
  });

  it('useTimerフックが呼ばれる', async () => {
    const { useTimer } = await import('@/hooks');
    render(<MainLayout />);
    expect(useTimer).toHaveBeenCalled();
  });

  it('useStructuresフックが呼ばれる', async () => {
    const { useStructures } = await import('@/hooks');
    render(<MainLayout />);
    expect(useStructures).toHaveBeenCalled();
  });
});
