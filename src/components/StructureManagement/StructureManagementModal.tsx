import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StructureList } from './StructureList';
import { StructureEditor } from './StructureEditor';
import { useStructures } from '@/hooks/useStructures';
import type { Structure, StructureId } from '@/types';
import { generateStructureId } from '@/domain/models/Structure';
import styles from './StructureManagementModal.module.css';

export interface StructureManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStructureId: StructureId | null;
}

/**
 * StructureManagementModal コンポーネント
 * StructureList と StructureEditor を統合したモーダル
 *
 * 機能:
 * - Modal（size='fullscreen'）を使用
 * - 左右2カラムレイアウト（30%:70%）
 * - ストラクチャー選択時、右側に表示
 * - 編集時の未保存警告（別ストラクチャー選択時、モーダルを閉じる時）
 * - Context統合: useStructures()
 */
export function StructureManagementModal({
  isOpen,
  onClose,
  currentStructureId,
}: StructureManagementModalProps) {
  const {
    structures,
    currentStructureId: contextCurrentStructureId,
    addStructure,
    updateStructure,
    deleteStructure,
    loadStructure,
  } = useStructures();

  const [selectedStructureId, setSelectedStructureId] =
    useState<StructureId | null>(currentStructureId);
  const [editingStructure, setEditingStructure] = useState<Structure | null>(
    null
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isNewStructure, setIsNewStructure] = useState(false);

  // 確認ダイアログの状態
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingStructureId, setDeletingStructureId] =
    useState<StructureId | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // モーダルが開いた時、currentStructureIdのストラクチャーを選択
  useEffect(() => {
    if (isOpen && currentStructureId) {
      const structure = structures.find((s) => s.id === currentStructureId);
      if (structure) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedStructureId(currentStructureId);

        setEditingStructure(structure);

        setIsDirty(false);

        setIsNewStructure(false);
      }
    }
  }, [isOpen, currentStructureId, structures]);

  // 選択中のストラクチャーが変わったら編集中ストラクチャーも更新
  useEffect(() => {
    if (selectedStructureId && !isDirty) {
      const structure = structures.find((s) => s.id === selectedStructureId);
      if (structure) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingStructure(structure);
      }
    }
  }, [selectedStructureId, structures, isDirty]);

  // editingStructureの変更を監視してisDirtyを設定
  useEffect(() => {
    if (!editingStructure || !selectedStructureId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDirty(false);
      return;
    }

    const originalStructure = structures.find(
      (s) => s.id === selectedStructureId
    );
    if (!originalStructure) {
      // 新規ストラクチャーの場合は常にdirty

      setIsDirty(true);
      return;
    }

    const hasChanges =
      JSON.stringify(editingStructure) !== JSON.stringify(originalStructure);

    setIsDirty(hasChanges || isNewStructure);
  }, [editingStructure, selectedStructureId, structures, isNewStructure]);

  const handleSelectStructure = useCallback(
    (structureId: StructureId) => {
      if (isDirty) {
        // 未保存の変更がある場合は確認ダイアログを表示
        setPendingAction(() => () => {
          const structure = structures.find((s) => s.id === structureId);
          if (structure) {
            setSelectedStructureId(structureId);
            setEditingStructure(structure);
            setIsDirty(false);
            setIsNewStructure(false);
          }
        });
        setShowUnsavedDialog(true);
      } else {
        const structure = structures.find((s) => s.id === structureId);
        if (structure) {
          setSelectedStructureId(structureId);
          setEditingStructure(structure);
          setIsDirty(false);
          setIsNewStructure(false);
        }
      }
    },
    [isDirty, structures]
  );

  const handleCreateStructureImpl = useCallback(() => {
    const newStructure: Structure = {
      id: generateStructureId(),
      name: '新しいストラクチャー',
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

    setSelectedStructureId(newStructure.id);
    setEditingStructure(newStructure);
    setIsDirty(true);
    setIsNewStructure(true);
  }, []);

  const handleCreateStructure = useCallback(() => {
    if (isDirty) {
      setPendingAction(() => handleCreateStructureImpl);
      setShowUnsavedDialog(true);
    } else {
      handleCreateStructureImpl();
    }
  }, [isDirty, handleCreateStructureImpl]);

  const handleDeleteStructure = useCallback((structureId: StructureId) => {
    setDeletingStructureId(structureId);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingStructureId) {
      deleteStructure(deletingStructureId);

      // 削除したストラクチャーが選択中の場合、選択を解除
      if (selectedStructureId === deletingStructureId) {
        setSelectedStructureId(null);
        setEditingStructure(null);
        setIsDirty(false);
        setIsNewStructure(false);
      }

      setDeletingStructureId(null);
      setShowDeleteDialog(false);
    }
  }, [deletingStructureId, deleteStructure, selectedStructureId]);

  const handleSaveStructure = useCallback(
    (structure: Structure) => {
      if (isNewStructure) {
        // 新規ストラクチャーの場合はaddStructureを呼ぶ
        const savedStructure = addStructure({
          name: structure.name,
          blindLevels: structure.blindLevels,
          levelDuration: structure.levelDuration,
          breakConfig: structure.breakConfig,
        });
        setSelectedStructureId(savedStructure.id);
        setEditingStructure(savedStructure);
        setIsNewStructure(false);
      } else {
        // 既存ストラクチャーの場合はupdateStructureを呼ぶ
        updateStructure(structure.id, {
          name: structure.name,
          blindLevels: structure.blindLevels,
          levelDuration: structure.levelDuration,
          breakConfig: structure.breakConfig,
        });
        setEditingStructure(structure);
      }
      setIsDirty(false);
    },
    [isNewStructure, addStructure, updateStructure]
  );

  const handleUseStructure = useCallback(
    (structure: Structure) => {
      // 未保存の変更がある場合は先に保存
      if (isDirty) {
        handleSaveStructure(structure);
      }

      loadStructure(structure.id);
      onClose();
    },
    [isDirty, handleSaveStructure, loadStructure, onClose]
  );

  const handleEditorChange = useCallback((structure: Structure) => {
    setEditingStructure(structure);
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
    setIsNewStructure(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleCancelUnsaved = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  }, []);

  const deletingStructureName =
    deletingStructureId &&
    structures.find((s) => s.id === deletingStructureId)?.name;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="ストラクチャー管理"
        size="fullscreen"
      >
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <StructureList
              structures={structures}
              currentStructureId={contextCurrentStructureId}
              selectedStructureId={selectedStructureId}
              onSelect={handleSelectStructure}
              onCreate={handleCreateStructure}
              onDelete={handleDeleteStructure}
            />
          </div>
          <div className={styles.main}>
            <StructureEditor
              structure={editingStructure}
              onSave={handleSaveStructure}
              onUse={handleUseStructure}
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
        title="ストラクチャーを削除"
        message={`「${deletingStructureName}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
      />
    </>
  );
}
