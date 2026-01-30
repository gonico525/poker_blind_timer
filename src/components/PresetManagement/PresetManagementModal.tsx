import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { PresetList } from './PresetList';
import { PresetEditor } from './PresetEditor';
import { usePresets } from '@/hooks/usePresets';
import type { Preset, PresetId } from '@/types';
import { generatePresetId } from '@/domain/models/Preset';
import styles from './PresetManagementModal.module.css';

export interface PresetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresetId: PresetId | null;
}

/**
 * PresetManagementModal コンポーネント
 * PresetList と PresetEditor を統合したモーダル
 *
 * 機能:
 * - Modal（size='fullscreen'）を使用
 * - 左右2カラムレイアウト（30%:70%）
 * - プリセット選択時、右側に表示
 * - 編集時の未保存警告（別プリセット選択時、モーダルを閉じる時）
 * - Context統合: usePresets()
 */
export function PresetManagementModal({
  isOpen,
  onClose,
  currentPresetId,
}: PresetManagementModalProps) {
  const {
    presets,
    currentPresetId: contextCurrentPresetId,
    addPreset,
    updatePreset,
    deletePreset,
    loadPreset,
  } = usePresets();

  const [selectedPresetId, setSelectedPresetId] = useState<PresetId | null>(
    currentPresetId
  );
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isNewPreset, setIsNewPreset] = useState(false);

  // 確認ダイアログの状態
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<PresetId | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // モーダルが開いた時、currentPresetIdのプリセットを選択
  useEffect(() => {
    if (isOpen && currentPresetId) {
      const preset = presets.find((p) => p.id === currentPresetId);
      if (preset) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedPresetId(currentPresetId);

        setEditingPreset(preset);

        setIsDirty(false);

        setIsNewPreset(false);
      }
    }
  }, [isOpen, currentPresetId, presets]);

  // 選択中のプリセットが変わったら編集中プリセットも更新
  useEffect(() => {
    if (selectedPresetId && !isDirty) {
      const preset = presets.find((p) => p.id === selectedPresetId);
      if (preset) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingPreset(preset);
      }
    }
  }, [selectedPresetId, presets, isDirty]);

  // editingPresetの変更を監視してisDirtyを設定
  useEffect(() => {
    if (!editingPreset || !selectedPresetId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDirty(false);
      return;
    }

    const originalPreset = presets.find((p) => p.id === selectedPresetId);
    if (!originalPreset) {
      // 新規プリセットの場合は常にdirty

      setIsDirty(true);
      return;
    }

    const hasChanges =
      JSON.stringify(editingPreset) !== JSON.stringify(originalPreset);

    setIsDirty(hasChanges || isNewPreset);
  }, [editingPreset, selectedPresetId, presets, isNewPreset]);

  const handleSelectPreset = useCallback(
    (presetId: PresetId) => {
      if (isDirty) {
        // 未保存の変更がある場合は確認ダイアログを表示
        setPendingAction(() => () => {
          const preset = presets.find((p) => p.id === presetId);
          if (preset) {
            setSelectedPresetId(presetId);
            setEditingPreset(preset);
            setIsDirty(false);
            setIsNewPreset(false);
          }
        });
        setShowUnsavedDialog(true);
      } else {
        const preset = presets.find((p) => p.id === presetId);
        if (preset) {
          setSelectedPresetId(presetId);
          setEditingPreset(preset);
          setIsDirty(false);
          setIsNewPreset(false);
        }
      }
    },
    [isDirty, presets]
  );

  const handleCreatePresetImpl = useCallback(() => {
    const newPreset: Preset = {
      id: generatePresetId(),
      name: '新しいプリセット',
      type: 'custom',
      blindLevels: [
        { smallBlind: 25, bigBlind: 50, ante: 0 },
        { smallBlind: 50, bigBlind: 100, ante: 0 },
      ],
      levelDuration: 600,
      breakConfig: {
        enabled: false,
        frequency: 4,
        duration: 10,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSelectedPresetId(newPreset.id);
    setEditingPreset(newPreset);
    setIsDirty(true);
    setIsNewPreset(true);
  }, []);

  const handleCreatePreset = useCallback(() => {
    if (isDirty) {
      setPendingAction(() => handleCreatePresetImpl);
      setShowUnsavedDialog(true);
    } else {
      handleCreatePresetImpl();
    }
  }, [isDirty, handleCreatePresetImpl]);

  const handleDeletePreset = useCallback((presetId: PresetId) => {
    setDeletingPresetId(presetId);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingPresetId) {
      deletePreset(deletingPresetId);

      // 削除したプリセットが選択中の場合、選択を解除
      if (selectedPresetId === deletingPresetId) {
        setSelectedPresetId(null);
        setEditingPreset(null);
        setIsDirty(false);
        setIsNewPreset(false);
      }

      setDeletingPresetId(null);
      setShowDeleteDialog(false);
    }
  }, [deletingPresetId, deletePreset, selectedPresetId]);

  const handleSavePreset = useCallback(
    (preset: Preset) => {
      if (isNewPreset) {
        // 新規プリセットの場合はaddPresetを呼ぶ
        const savedPreset = addPreset({
          name: preset.name,
          blindLevels: preset.blindLevels,
          levelDuration: preset.levelDuration,
          breakConfig: preset.breakConfig,
        });
        setSelectedPresetId(savedPreset.id);
        setEditingPreset(savedPreset);
        setIsNewPreset(false);
      } else {
        // 既存プリセットの場合はupdatePresetを呼ぶ
        updatePreset(preset.id, {
          name: preset.name,
          blindLevels: preset.blindLevels,
          levelDuration: preset.levelDuration,
          breakConfig: preset.breakConfig,
        });
        setEditingPreset(preset);
      }
      setIsDirty(false);
    },
    [isNewPreset, addPreset, updatePreset]
  );

  const handleUsePreset = useCallback(
    (preset: Preset) => {
      // 未保存の変更がある場合は先に保存
      if (isDirty) {
        handleSavePreset(preset);
      }

      loadPreset(preset.id);
      onClose();
    },
    [isDirty, handleSavePreset, loadPreset, onClose]
  );

  const handleEditorChange = useCallback((preset: Preset) => {
    setEditingPreset(preset);
  }, []);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setPendingAction(() => onClose);
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfirmUnsaved = useCallback(() => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    setIsNewPreset(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleCancelUnsaved = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  }, []);

  const deletingPresetName =
    deletingPresetId && presets.find((p) => p.id === deletingPresetId)?.name;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="プリセット管理"
        size="fullscreen"
      >
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <PresetList
              presets={presets}
              currentPresetId={contextCurrentPresetId}
              selectedPresetId={selectedPresetId}
              onSelect={handleSelectPreset}
              onCreate={handleCreatePreset}
              onDelete={handleDeletePreset}
            />
          </div>
          <div className={styles.main}>
            <PresetEditor
              preset={editingPreset}
              onSave={handleSavePreset}
              onUse={handleUsePreset}
              onChange={handleEditorChange}
              isDirty={isDirty}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showUnsavedDialog}
        title="未保存の変更"
        message="保存されていない変更があります。変更を破棄しますか？"
        onConfirm={handleConfirmUnsaved}
        onCancel={handleCancelUnsaved}
        confirmText="破棄"
        cancelText="キャンセル"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="プリセットを削除"
        message={`「${deletingPresetName}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
      />
    </>
  );
}
