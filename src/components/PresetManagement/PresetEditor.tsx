import { useState, useEffect } from 'react';
import type { Preset } from '@/types';
import { BlindEditor } from '@/components/BlindEditor/BlindEditor';
import { NumberInput } from '@/components/common/NumberInput/NumberInput';
import { Toggle } from '@/components/common/Toggle/Toggle';
import { ImportExport } from '@/components/ImportExport/ImportExport';
import styles from './PresetEditor.module.css';

export interface PresetEditorProps {
  preset: Preset | null;
  onSave: (preset: Preset) => void;
  onUse: (preset: Preset) => void;
  onChange?: (preset: Preset) => void;
  isDirty: boolean;
}

/**
 * PresetEditor コンポーネント
 * モーダル右側の編集エリア（常に編集可能）
 *
 * セクション:
 * 1. プリセット名
 * 2. ブラインド構造編集（BlindEditor）
 * 3. トーナメント設定（レベル時間、休憩設定）
 * 4. データ管理（ImportExport）
 * 5. アクションボタン（保存、このプリセットを使う）
 */
export function PresetEditor({
  preset,
  onSave,
  onUse,
  onChange,
  isDirty,
}: PresetEditorProps) {
  const [editedPreset, setEditedPreset] = useState<Preset | null>(preset);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setEditedPreset(preset);
    setNameError(null);
  }, [preset]);

  // editedPresetの変更を親に通知
  useEffect(() => {
    if (editedPreset && onChange) {
      onChange(editedPreset);
    }
  }, [editedPreset, onChange]);

  if (!editedPreset) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>
          プリセットを選択するか、新規作成してください
        </p>
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditedPreset({ ...editedPreset, name: newName });

    if (newName.trim().length === 0) {
      setNameError('プリセット名を入力してください');
    } else if (newName.length > 50) {
      setNameError('プリセット名は50文字以内で入力してください');
    } else {
      setNameError(null);
    }
  };

  const handleBlindLevelsChange = (
    blindLevels: typeof editedPreset.blindLevels
  ) => {
    setEditedPreset({ ...editedPreset, blindLevels });
  };

  const handleLevelDurationChange = (minutes: number) => {
    setEditedPreset({ ...editedPreset, levelDuration: minutes * 60 });
  };

  const handleBreakEnabledChange = (enabled: boolean) => {
    setEditedPreset({
      ...editedPreset,
      breakConfig: { ...editedPreset.breakConfig, enabled },
    });
  };

  const handleBreakFrequencyChange = (frequency: number) => {
    setEditedPreset({
      ...editedPreset,
      breakConfig: { ...editedPreset.breakConfig, frequency },
    });
  };

  const handleBreakDurationChange = (minutes: number) => {
    setEditedPreset({
      ...editedPreset,
      breakConfig: { ...editedPreset.breakConfig, duration: minutes },
    });
  };

  const handleImport = (importedPresets: Preset[]) => {
    if (importedPresets.length > 0) {
      // 最初のプリセットをロード
      setEditedPreset(importedPresets[0]);
    }
  };

  const handleSave = () => {
    if (!validatePreset()) return;
    onSave(editedPreset);
  };

  const handleUse = () => {
    if (!validatePreset()) return;
    onUse(editedPreset);
  };

  const validatePreset = (): boolean => {
    if (editedPreset.name.trim().length === 0) {
      setNameError('プリセット名を入力してください');
      return false;
    }

    if (editedPreset.name.length > 50) {
      setNameError('プリセット名は50文字以内で入力してください');
      return false;
    }

    if (editedPreset.blindLevels.length === 0) {
      return false;
    }

    return true;
  };

  const canSave = isDirty && !nameError && editedPreset.blindLevels.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* セクション1: プリセット名 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>プリセット名</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={[styles.nameInput, nameError && styles.error]
                .filter(Boolean)
                .join(' ')}
              value={editedPreset.name}
              onChange={handleNameChange}
              placeholder="プリセット名を入力"
              aria-label="プリセット名"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'name-error' : undefined}
              data-testid="preset-name-input"
            />
            {nameError && (
              <span
                id="name-error"
                className={styles.errorMessage}
                role="alert"
                data-testid="name-error"
              >
                {nameError}
              </span>
            )}
          </div>
        </section>

        {/* セクション2: ブラインド構造 */}
        <section className={styles.section}>
          <BlindEditor
            blindLevels={editedPreset.blindLevels}
            onChange={handleBlindLevelsChange}
          />
        </section>

        {/* セクション3: トーナメント設定 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>トーナメント設定</h3>
          <div className={styles.settingsGrid}>
            <NumberInput
              label="レベル時間"
              value={editedPreset.levelDuration / 60}
              min={1}
              max={60}
              onChange={handleLevelDurationChange}
              unit="分"
              aria-label="レベル時間（分）"
            />

            <Toggle
              label="休憩を有効にする"
              value={editedPreset.breakConfig.enabled}
              onChange={handleBreakEnabledChange}
              aria-label="休憩を有効にする"
            />

            {editedPreset.breakConfig.enabled && (
              <>
                <NumberInput
                  label="休憩頻度"
                  value={editedPreset.breakConfig.frequency}
                  min={1}
                  max={20}
                  onChange={handleBreakFrequencyChange}
                  unit="レベルごと"
                  aria-label="休憩頻度（レベルごと）"
                />

                <NumberInput
                  label="休憩時間"
                  value={editedPreset.breakConfig.duration}
                  min={1}
                  max={30}
                  onChange={handleBreakDurationChange}
                  unit="分"
                  aria-label="休憩時間（分）"
                />
              </>
            )}
          </div>
        </section>

        {/* セクション4: データ管理 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>データ管理</h3>
          <ImportExport presets={[editedPreset]} onImport={handleImport} />
        </section>
      </div>

      {/* セクション5: アクションボタン */}
      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!canSave}
          aria-label="プリセットを保存"
          data-testid="save-button"
        >
          保存
        </button>
        <button
          className={styles.useButton}
          onClick={handleUse}
          disabled={editedPreset.blindLevels.length === 0}
          aria-label="このプリセットを使う"
          data-testid="use-button"
        >
          このプリセットを使う
        </button>
      </div>
    </div>
  );
}
