import React from 'react';
import type { Preset, PresetId } from '@/types';
import { isDefaultPreset } from '@/domain/models/Preset';
import styles from './PresetManager.module.css';

interface PresetManagerProps {
  presets: Preset[];
  currentPresetId?: PresetId | null;
  onLoad?: (presetId: PresetId) => void;
  onEdit?: (presetId: PresetId) => void;
  onDelete?: (presetId: PresetId) => void;
}

/**
 * プリセット管理コンポーネント
 * プリセット一覧の表示と操作を提供
 */
export function PresetManager({
  presets,
  currentPresetId,
  onLoad,
  onEdit,
  onDelete,
}: PresetManagerProps) {
  const handleLoad = (presetId: PresetId) => {
    if (onLoad) {
      onLoad(presetId);
    }
  };

  const handleEdit = (e: React.MouseEvent, presetId: PresetId) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(presetId);
    }
  };

  const handleDelete = (e: React.MouseEvent, presetId: PresetId) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(presetId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>プリセット一覧</h2>
      </div>

      <div className={styles.list}>
        {presets.map((preset) => {
          const isSelected = preset.id === currentPresetId;
          const isDefault = isDefaultPreset(preset.id);
          const itemClassName = [
            styles.item,
            isSelected && styles.selected,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={preset.id}
              className={itemClassName}
              data-testid="preset-item"
              onClick={() => handleLoad(preset.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLoad(preset.id);
                }
              }}
            >
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{preset.name}</span>
                  {isDefault && (
                    <span className={styles.badge}>デフォルト</span>
                  )}
                </div>
                <div className={styles.details}>
                  {preset.blindLevels.length}レベル ・{' '}
                  {Math.floor(preset.levelDuration / 60)}分/レベル
                </div>
              </div>

              {!isDefault && (
                <div className={styles.actions}>
                  <button
                    className={styles.editButton}
                    data-testid="edit-button"
                    onClick={(e) => handleEdit(e, preset.id)}
                    aria-label={`${preset.name}を編集`}
                  >
                    編集
                  </button>
                  <button
                    className={styles.deleteButton}
                    data-testid="delete-button"
                    onClick={(e) => handleDelete(e, preset.id)}
                    aria-label={`${preset.name}を削除`}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
