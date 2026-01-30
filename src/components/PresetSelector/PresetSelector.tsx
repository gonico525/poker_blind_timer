import { useMemo } from 'react';
import { Dropdown, DropdownOption } from '@/components/common/Dropdown';
import type { Preset, PresetId } from '@/types';
import styles from './PresetSelector.module.css';

export interface PresetSelectorProps {
  presets: Preset[];
  currentPresetId: PresetId | null;
  onSelect: (presetId: PresetId) => void;
  onManage: () => void;
}

const MANAGE_VALUE = '__manage__';

/**
 * PresetSelector コンポーネント
 * ヘッダーのプリセット選択ドロップダウン
 */
export function PresetSelector({
  presets,
  currentPresetId,
  onSelect,
  onManage,
}: PresetSelectorProps) {
  const options = useMemo((): DropdownOption[] => {
    const presetOptions: DropdownOption[] = presets.map((preset) => ({
      value: preset.id,
      label: preset.name,
    }));

    // セパレータ用の無効化オプションと管理オプションを追加
    return [
      ...presetOptions,
      {
        value: '__separator__',
        label: '────────',
        disabled: true,
      },
      {
        value: MANAGE_VALUE,
        label: '⚙ プリセット管理...',
      },
    ];
  }, [presets]);

  const handleChange = (value: string) => {
    if (value === MANAGE_VALUE) {
      onManage();
    } else if (value !== '__separator__') {
      onSelect(value as PresetId);
    }
  };

  const currentPreset = presets.find((p) => p.id === currentPresetId);
  const currentValue = currentPresetId ?? '';

  return (
    <div className={styles.container}>
      <Dropdown
        value={currentValue}
        options={options}
        onChange={handleChange}
        placeholder="プリセットを選択"
        aria-label="プリセット選択"
        className={styles.dropdown}
      />
      {currentPreset && (
        <span className={styles.currentPresetName}>{currentPreset.name}</span>
      )}
    </div>
  );
}
