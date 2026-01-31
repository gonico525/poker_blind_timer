import type { Structure, StructureId } from '@/types';
import { isDefaultStructure } from '@/domain/models/Structure';
import styles from './StructureList.module.css';

export interface StructureListProps {
  structures: Structure[];
  currentStructureId: StructureId | null;
  selectedStructureId: StructureId | null;
  onSelect: (structureId: StructureId) => void;
  onCreate: () => void;
  onDelete: (structureId: StructureId) => void;
}

/**
 * StructureList コンポーネント
 * モーダル左側のストラクチャー一覧
 *
 * 機能:
 * - ストラクチャー一覧表示
 * - 使用中ストラクチャーに✓マーク
 * - 選択中ストラクチャーをハイライト
 * - カスタムストラクチャーに[削除]ボタン（デフォルトストラクチャーには非表示）
 * - [+ 新規作成]ボタン（最下部）
 */
export function StructureList({
  structures,
  currentStructureId,
  selectedStructureId,
  onSelect,
  onCreate,
  onDelete,
}: StructureListProps) {
  const handleDelete = (e: React.MouseEvent, structureId: StructureId) => {
    e.stopPropagation();
    onDelete(structureId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {structures.map((structure) => {
          const isSelected = structure.id === selectedStructureId;
          const isCurrent = structure.id === currentStructureId;
          const isDefault = isDefaultStructure(structure.id);

          const itemClassName = [styles.item, isSelected && styles.selected]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={structure.id}
              className={itemClassName}
              onClick={() => onSelect(structure.id)}
              role="button"
              tabIndex={0}
              aria-label={`ストラクチャー: ${structure.name}`}
              aria-current={isCurrent ? 'true' : undefined}
              data-testid="structure-item"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(structure.id);
                }
              }}
            >
              <div className={styles.itemContent}>
                <span className={styles.checkmark} aria-hidden="true">
                  {isCurrent && '✓'}
                </span>
                <span className={styles.name}>{structure.name}</span>
              </div>

              {!isDefault && (
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(e, structure.id)}
                  aria-label={`${structure.name}を削除`}
                  data-testid="delete-structure-button"
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
        aria-label="新規ストラクチャーを作成"
        data-testid="create-structure-button"
      >
        <span aria-hidden="true">+</span> 新規作成
      </button>
    </div>
  );
}
