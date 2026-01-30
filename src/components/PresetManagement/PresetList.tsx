import type { Preset, PresetId } from '@/types';
import { isDefaultPreset } from '@/domain/models/Preset';
import styles from './PresetList.module.css';

export interface PresetListProps {
  presets: Preset[];
  currentPresetId: PresetId | null;
  selectedPresetId: PresetId | null;
  onSelect: (presetId: PresetId) => void;
  onCreate: () => void;
  onDelete: (presetId: PresetId) => void;
}

/**
 * PresetList コンポーネント
 * モーダル左側のプリセット一覧
 *
 * 機能:
 * - プリセット一覧表示
 * - 使用中プリセットに✓マーク
 * - 選択中プリセットをハイライト
 * - カスタムプリセットに[削除]ボタン（デフォルトプリセットには非表示）
 * - [+ 新規作成]ボタン（最下部）
 */
export function PresetList({
  presets,
  currentPresetId,
  selectedPresetId,
  onSelect,
  onCreate,
  onDelete,
}: PresetListProps) {
  const handleDelete = (e: React.MouseEvent, presetId: PresetId) => {
    e.stopPropagation();
    onDelete(presetId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          const isCurrent = preset.id === currentPresetId;
          const isDefault = isDefaultPreset(preset.id);

          const itemClassName = [styles.item, isSelected && styles.selected]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={preset.id}
              className={itemClassName}
              onClick={() => onSelect(preset.id)}
              role="button"
              tabIndex={0}
              aria-label={`プリセット: ${preset.name}`}
              aria-current={isCurrent ? 'true' : undefined}
              data-testid="preset-item"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(preset.id);
                }
              }}
            >
              <div className={styles.itemContent}>
                <span className={styles.checkmark} aria-hidden="true">
                  {isCurrent && '✓'}
                </span>
                <span className={styles.name}>{preset.name}</span>
              </div>

              {!isDefault && (
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(e, preset.id)}
                  aria-label={`${preset.name}を削除`}
                  data-testid="delete-preset-button"
                >
                  削除
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        className={styles.createButton}
        onClick={onCreate}
        aria-label="新規プリセットを作成"
        data-testid="create-preset-button"
      >
        <span aria-hidden="true">+</span> 新規作成
      </button>
    </div>
  );
}
