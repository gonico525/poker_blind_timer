import { PresetSelector } from '@/components/PresetSelector';
import { VolumeControl } from '@/components/VolumeControl';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Preset, PresetId } from '@/types';
import type { Theme } from '@/types/settings';
import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  // PresetSelector関連
  presets: Preset[];
  currentPresetId: PresetId | null;
  onPresetSelect: (presetId: PresetId) => void;
  onPresetManage: () => void;

  // VolumeControl関連
  volume: number;
  isSoundEnabled: boolean;
  onVolumeChange: (volume: number) => void;
  onSoundEnabledChange: (enabled: boolean) => void;

  // ThemeToggle関連
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

/**
 * AppHeader コンポーネント
 * 統合ヘッダーコンポーネント
 *
 * 機能:
 * - アプリタイトル「🎰 Poker Blind Timer」
 * - PresetSelector 統合
 * - VolumeControl 統合
 * - ThemeToggle 統合
 * - [⚙ プリセット管理] ボタン
 *
 * レイアウト:
 * - 左側: タイトル
 * - 中央: PresetSelector
 * - 右側: VolumeControl, ThemeToggle, プリセット管理ボタン
 */
export function AppHeader({
  presets,
  currentPresetId,
  onPresetSelect,
  onPresetManage,
  volume,
  isSoundEnabled,
  onVolumeChange,
  onSoundEnabledChange,
  theme,
  onThemeChange,
}: AppHeaderProps) {
  return (
    <header className={styles.header} data-testid="app-header">
      <div className={styles.left}>
        <h1 className={styles.title}>
          <span className={styles.icon}>🎰</span>
          <span className={styles.titleText}>Poker Blind Timer</span>
        </h1>
      </div>

      <div className={styles.center}>
        <PresetSelector
          presets={presets}
          currentPresetId={currentPresetId}
          onSelect={onPresetSelect}
          onManage={onPresetManage}
        />
      </div>

      <div className={styles.right}>
        <VolumeControl
          volume={volume}
          isSoundEnabled={isSoundEnabled}
          onVolumeChange={onVolumeChange}
          onSoundEnabledChange={onSoundEnabledChange}
        />
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <button
          className={styles.manageButton}
          onClick={onPresetManage}
          aria-label="プリセット管理"
        >
          <span className={styles.manageIcon}>⚙</span>
          <span className={styles.manageText}>プリセット管理</span>
        </button>
      </div>
    </header>
  );
}
