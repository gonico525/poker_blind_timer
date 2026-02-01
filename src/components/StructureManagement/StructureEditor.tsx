import { useState, useEffect } from 'react';
import type { Structure } from '@/types';
import { BlindEditor } from '@/components/BlindEditor/BlindEditor';
import { NumberInput } from '@/components/common/NumberInput/NumberInput';
import { Toggle } from '@/components/common/Toggle/Toggle';
import { ImportExport } from '@/components/ImportExport/ImportExport';
import styles from './StructureEditor.module.css';

export interface StructureEditorProps {
  structure: Structure | null;
  onSave: (structure: Structure) => void;
  onUse: (structure: Structure) => void;
  onChange?: (structure: Structure) => void;
  isDirty: boolean;
}

/**
 * StructureEditor コンポーネント
 * モーダル右側の編集エリア（常に編集可能）
 *
 * セクション:
 * 1. ストラクチャー名
 * 2. ブラインド構造編集（BlindEditor）
 * 3. トーナメント設定（レベル時間、休憩設定）
 * 4. データ管理（ImportExport）
 * 5. アクションボタン（保存、このストラクチャーを使う）
 */
export function StructureEditor({
  structure,
  onSave,
  onUse,
  onChange,
  isDirty,
}: StructureEditorProps) {
  const [editedStructure, setEditedStructure] = useState<Structure | null>(
    structure
  );
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setEditedStructure(structure);
    setNameError(null);
  }, [structure]);

  // editedStructureの変更を親に通知
  useEffect(() => {
    if (editedStructure && onChange) {
      onChange(editedStructure);
    }
  }, [editedStructure, onChange]);

  if (!editedStructure) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>
          ストラクチャーを選択するか、新規作成してください
        </p>
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditedStructure({ ...editedStructure, name: newName });

    if (newName.trim().length === 0) {
      setNameError('ストラクチャー名を入力してください');
    } else if (newName.length > 50) {
      setNameError('ストラクチャー名は50文字以内で入力してください');
    } else {
      setNameError(null);
    }
  };

  const handleBlindLevelsChange = (
    blindLevels: typeof editedStructure.blindLevels
  ) => {
    setEditedStructure({ ...editedStructure, blindLevels });
  };

  const handleLevelDurationChange = (minutes: number) => {
    setEditedStructure({ ...editedStructure, levelDuration: minutes * 60 });
  };

  const handleBreakEnabledChange = (enabled: boolean) => {
    setEditedStructure({
      ...editedStructure,
      breakConfig: { ...editedStructure.breakConfig, enabled },
    });
  };

  const handleBreakFrequencyChange = (frequency: number) => {
    setEditedStructure({
      ...editedStructure,
      breakConfig: { ...editedStructure.breakConfig, frequency },
    });
  };

  const handleBreakDurationChange = (minutes: number) => {
    setEditedStructure({
      ...editedStructure,
      breakConfig: { ...editedStructure.breakConfig, duration: minutes },
    });
  };

  const handleImport = (importedStructures: Structure[]) => {
    if (importedStructures.length > 0) {
      // 最初のストラクチャーをロード
      setEditedStructure(importedStructures[0]);
    }
  };

  const handleSave = () => {
    if (!validateStructure()) return;
    onSave(editedStructure);
  };

  const handleUse = () => {
    if (!validateStructure()) return;
    onUse(editedStructure);
  };

  const validateStructure = (): boolean => {
    if (editedStructure.name.trim().length === 0) {
      setNameError('ストラクチャー名を入力してください');
      return false;
    }

    if (editedStructure.name.length > 50) {
      setNameError('ストラクチャー名は50文字以内で入力してください');
      return false;
    }

    if (editedStructure.blindLevels.length === 0) {
      return false;
    }

    return true;
  };

  const canSave =
    isDirty && !nameError && editedStructure.blindLevels.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* セクション1: ストラクチャー名 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>ストラクチャー名</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={[styles.nameInput, nameError && styles.error]
                .filter(Boolean)
                .join(' ')}
              value={editedStructure.name}
              onChange={handleNameChange}
              placeholder="ストラクチャー名を入力"
              aria-label="ストラクチャー名"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'name-error' : undefined}
              data-testid="structure-name-input"
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
            blindLevels={editedStructure.blindLevels}
            onChange={handleBlindLevelsChange}
          />
        </section>

        {/* セクション3: トーナメント設定 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>トーナメント設定</h3>
          <div className={styles.settingsGrid}>
            <NumberInput
              label="レベル時間"
              value={editedStructure.levelDuration / 60}
              min={1}
              max={60}
              onChange={handleLevelDurationChange}
              unit="分"
              aria-label="レベル時間（分）"
            />

            <Toggle
              label="休憩を有効にする"
              value={editedStructure.breakConfig.enabled}
              onChange={handleBreakEnabledChange}
              aria-label="休憩を有効にする"
            />

            {editedStructure.breakConfig.enabled && (
              <>
                <NumberInput
                  label="休憩頻度"
                  value={editedStructure.breakConfig.frequency}
                  min={1}
                  max={20}
                  onChange={handleBreakFrequencyChange}
                  unit="レベルごと"
                  aria-label="休憩頻度（レベルごと）"
                />

                <NumberInput
                  label="休憩時間"
                  value={editedStructure.breakConfig.duration}
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
          <ImportExport
            structures={[editedStructure]}
            onImport={handleImport}
          />
        </section>
      </div>

      {/* セクション5: アクションボタン */}
      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!canSave}
          aria-label="ストラクチャーを保存"
          data-testid="save-button"
        >
          保存
        </button>
        <button
          className={styles.useButton}
          onClick={handleUse}
          disabled={editedStructure.blindLevels.length === 0}
          aria-label="このストラクチャーを使う"
          data-testid="use-button"
        >
          このストラクチャーを使う
        </button>
      </div>
    </div>
  );
}
