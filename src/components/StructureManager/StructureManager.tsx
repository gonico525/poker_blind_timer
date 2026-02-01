import React from 'react';
import type { Structure, StructureId } from '@/types';
import { isDefaultStructure } from '@/domain/models/Structure';
import styles from './StructureManager.module.css';

interface StructureManagerProps {
  structures: Structure[];
  currentStructureId?: StructureId | null;
  onLoad?: (structureId: StructureId) => void;
  onEdit?: (structureId: StructureId) => void;
  onDelete?: (structureId: StructureId) => void;
}

/**
 * ストラクチャー管理コンポーネント
 * ストラクチャー一覧の表示と操作を提供
 */
export function StructureManager({
  structures,
  currentStructureId,
  onLoad,
  onEdit,
  onDelete,
}: StructureManagerProps) {
  const handleLoad = (structureId: StructureId) => {
    if (onLoad) {
      onLoad(structureId);
    }
  };

  const handleEdit = (e: React.MouseEvent, structureId: StructureId) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(structureId);
    }
  };

  const handleDelete = (e: React.MouseEvent, structureId: StructureId) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(structureId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>ストラクチャー一覧</h2>
      </div>

      <div className={styles.list}>
        {structures.map((structure) => {
          const isSelected = structure.id === currentStructureId;
          const isDefault = isDefaultStructure(structure.id);
          const itemClassName = [styles.item, isSelected && styles.selected]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={structure.id}
              className={itemClassName}
              data-testid="structure-item"
              onClick={() => handleLoad(structure.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLoad(structure.id);
                }
              }}
            >
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{structure.name}</span>
                  {isDefault && (
                    <span className={styles.badge}>デフォルト</span>
                  )}
                </div>
                <div className={styles.details}>
                  {structure.blindLevels.length}レベル ・{' '}
                  {Math.floor(structure.levelDuration / 60)}分/レベル
                </div>
              </div>

              {!isDefault && (
                <div className={styles.actions}>
                  <button
                    className={styles.editButton}
                    data-testid="edit-button"
                    onClick={(e) => handleEdit(e, structure.id)}
                    aria-label={`${structure.name}を編集`}
                  >
                    編集
                  </button>
                  <button
                    className={styles.deleteButton}
                    data-testid="delete-button"
                    onClick={(e) => handleDelete(e, structure.id)}
                    aria-label={`${structure.name}を削除`}
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
