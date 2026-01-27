import styles from './SettingsPanel.module.css';

/**
 * 設定パネルコンポーネント
 * アプリケーション設定のメインUI
 */
export function SettingsPanel() {
  return (
    <div className={styles.panel} data-testid="settings-panel">
      <div className={styles.header}>
        <h2 className={styles.title}>設定</h2>
      </div>

      <div className={styles.content}>
        <p className={styles.placeholder}>
          設定パネル（将来の実装でPresetManager、BlindEditor、ThemeToggleなどを統合予定）
        </p>
      </div>
    </div>
  );
}
