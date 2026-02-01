import { StructureSelector } from '@/components/StructureSelector';
import { VolumeControl } from '@/components/VolumeControl';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Structure, StructureId, Theme } from '@/types';
import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  // StructureSelector関連
  structures: Structure[];
  currentStructureId: StructureId | null;
  onStructureSelect: (structureId: StructureId) => void;
  onStructureManage: () => void;

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
 * - StructureSelector 統合
 * - VolumeControl 統合
 * - ThemeToggle 統合
 * - [⚙ ストラクチャー管理] ボタン
 *
 * レイアウト:
 * - 左側: タイトル
 * - 中央: StructureSelector
 * - 右側: VolumeControl, ThemeToggle, ストラクチャー管理ボタン
 */
export function AppHeader({
  structures,
  currentStructureId,
  onStructureSelect,
  onStructureManage,
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
        <StructureSelector
          structures={structures}
          currentStructureId={currentStructureId}
          onSelect={onStructureSelect}
          onManage={onStructureManage}
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
          onClick={onStructureManage}
          aria-label="ストラクチャー管理"
        >
          <span className={styles.manageIcon}>⚙</span>
          <span className={styles.manageText}>ストラクチャー管理</span>
        </button>
      </div>
    </header>
  );
}
