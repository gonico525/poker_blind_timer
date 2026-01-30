import { Modal } from '../Modal/Modal';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * ConfirmDialog コンポーネント
 * プリセット削除確認ダイアログ
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'info',
}: ConfirmDialogProps) {
  const confirmButtonClassName = [
    styles.confirmButton,
    styles[`${variant}Variant`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="small">
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            data-testid="cancel-button"
          >
            {cancelText}
          </button>
          <button
            className={confirmButtonClassName}
            onClick={onConfirm}
            data-testid="confirm-button"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
