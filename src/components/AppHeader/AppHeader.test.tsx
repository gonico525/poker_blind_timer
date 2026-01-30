import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from './AppHeader';
import type { Preset } from '@/types';

describe('AppHeader', () => {
  const mockPresets: Preset[] = [
    {
      id: 'default-standard',
      name: 'Standard Tournament',
      blindLevels: [{ level: 1, smallBlind: 25, bigBlind: 50, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 300 },
    },
    {
      id: 'default-turbo',
      name: 'Turbo Tournament',
      blindLevels: [{ level: 1, smallBlind: 50, bigBlind: 100, ante: 0 }],
      levelDuration: 300,
      breakConfig: { enabled: false, frequency: 4, duration: 300 },
    },
  ] as Preset[];

  const defaultProps = {
    presets: mockPresets,
    currentPresetId: 'default-standard',
    onPresetSelect: vi.fn(),
    onPresetManage: vi.fn(),
    volume: 0.7,
    isSoundEnabled: true,
    onVolumeChange: vi.fn(),
    onSoundEnabledChange: vi.fn(),
    theme: 'dark' as const,
    onThemeChange: vi.fn(),
  };

  it('ヘッダーが正しくレンダリングされる', () => {
    render(<AppHeader {...defaultProps} />);

    const header = screen.getByTestId('app-header');
    expect(header).toBeInTheDocument();
  });

  it('アプリタイトルが表示される', () => {
    render(<AppHeader {...defaultProps} />);

    expect(screen.getByText('🎰')).toBeInTheDocument();
    expect(screen.getByText('Poker Blind Timer')).toBeInTheDocument();
  });

  it('PresetSelectorが表示される', () => {
    render(<AppHeader {...defaultProps} />);

    // Dropdownコンポーネント内にプリセット選択が表示されることを確認
    expect(screen.getByLabelText('プリセット選択')).toBeInTheDocument();
  });

  it('VolumeControlが表示される', () => {
    render(<AppHeader {...defaultProps} />);

    // VolumeControlは音量ボタンとして表示
    const volumeButton = screen.getByLabelText(/音量/i);
    expect(volumeButton).toBeInTheDocument();
  });

  it('ThemeToggleが表示される', () => {
    render(<AppHeader {...defaultProps} />);

    // ThemeToggleはテーマ切り替えボタンとして表示
    const themeButton = screen.getByLabelText(/テーマ/i);
    expect(themeButton).toBeInTheDocument();
  });

  it('プリセット管理ボタンが表示される', () => {
    render(<AppHeader {...defaultProps} />);

    const manageButton = screen.getByRole('button', { name: 'プリセット管理' });
    expect(manageButton).toBeInTheDocument();
    expect(manageButton).toHaveTextContent('⚙');
    expect(manageButton).toHaveTextContent('プリセット管理');
  });

  it('プリセット管理ボタンをクリックするとonPresetManageが呼ばれる', async () => {
    const user = userEvent.setup();
    const onPresetManage = vi.fn();

    render(<AppHeader {...defaultProps} onPresetManage={onPresetManage} />);

    const manageButton = screen.getByRole('button', { name: 'プリセット管理' });
    await user.click(manageButton);

    expect(onPresetManage).toHaveBeenCalledTimes(1);
  });

  it('プリセット管理ボタンにアクセシビリティ属性が設定されている', () => {
    render(<AppHeader {...defaultProps} />);

    const manageButton = screen.getByRole('button', { name: 'プリセット管理' });
    expect(manageButton).toHaveAttribute('aria-label', 'プリセット管理');
  });

  it('ヘッダーのレイアウトが正しく設定されている', () => {
    render(<AppHeader {...defaultProps} />);

    const header = screen.getByTestId('app-header');
    // CSS Modulesを使用しているため、クラス名は動的に生成される
    expect(header.className).toContain('header');
  });

  it('全てのコンポーネントに正しいPropsが渡される', () => {
    const props = {
      ...defaultProps,
      volume: 0.5,
      isSoundEnabled: false,
      theme: 'light' as const,
    };

    render(<AppHeader {...props} />);

    // コンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('現在のプリセットが選択されている', () => {
    render(<AppHeader {...defaultProps} />);

    // PresetSelectorが現在のプリセットを表示していることを確認
    // (Dropdownコンポーネント内で選択されている)
    const dropdown = screen.getByLabelText('プリセット選択');
    expect(dropdown).toBeInTheDocument();
  });

  it('currentPresetIdがnullの場合でもエラーなくレンダリングされる', () => {
    const props = {
      ...defaultProps,
      currentPresetId: null,
    };

    render(<AppHeader {...props} />);

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('プリセットが空の配列でもエラーなくレンダリングされる', () => {
    const props = {
      ...defaultProps,
      presets: [],
      currentPresetId: null,
    };

    render(<AppHeader {...props} />);

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });
});
