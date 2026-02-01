import { useMemo } from 'react';
import { Dropdown, DropdownOption } from '@/components/common/Dropdown';
import type { Structure, StructureId } from '@/types';
import styles from './StructureSelector.module.css';

export interface StructureSelectorProps {
  structures: Structure[];
  currentStructureId: StructureId | null;
  onSelect: (structureId: StructureId) => void;
  onManage: () => void;
}

const MANAGE_VALUE = '__manage__';

/**
 * StructureSelector コンポーネント
 * ヘッダーのストラクチャー選択ドロップダウン
 */
export function StructureSelector({
  structures,
  currentStructureId,
  onSelect,
  onManage,
}: StructureSelectorProps) {
  const options = useMemo((): DropdownOption[] => {
    const structureOptions: DropdownOption[] = structures.map((structure) => ({
      value: structure.id,
      label: structure.name,
    }));

    // セパレータ用の無効化オプションと管理オプションを追加
    return [
      ...structureOptions,
      {
        value: '__separator__',
        label: '────────',
        disabled: true,
      },
      {
        value: MANAGE_VALUE,
        label: '⚙ ストラクチャー管理...',
      },
    ];
  }, [structures]);

  const handleChange = (value: string) => {
    if (value === MANAGE_VALUE) {
      onManage();
    } else if (value !== '__separator__') {
      onSelect(value as StructureId);
    }
  };

  const currentStructure = structures.find((s) => s.id === currentStructureId);
  const currentValue = currentStructureId ?? '';

  return (
    <div className={styles.container}>
      <Dropdown
        value={currentValue}
        options={options}
        onChange={handleChange}
        placeholder="ストラクチャーを選択"
        aria-label="ストラクチャー選択"
        className={styles.dropdown}
      />
      {currentStructure && (
        <span className={styles.currentStructureName}>
          {currentStructure.name}
        </span>
      )}
    </div>
  );
}
