import { useRef, useState } from 'react';
import type { Structure } from '@/types';
import { isValidStructure } from '@/utils/validation';
import styles from './ImportExport.module.css';

export interface ImportExportProps {
  structures: Structure[];
  onImport: (structures: Structure[]) => void;
}

/**
 * ImportExport コンポーネント
 * データのインポート/エクスポート機能
 */
export function ImportExport({ structures, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // エクスポート処理
  const handleExport = () => {
    try {
      const data = JSON.stringify(structures, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `poker-structures-${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setSuccess(
        `ストラクチャーをエクスポートしました（${structures.length}件）`
      );
      setError(null);

      // 成功メッセージを3秒後に消す
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('エクスポートに失敗しました');
      setSuccess(null);
    }
  };

  // インポート処理
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル入力をリセット（同じファイルを再選択できるように）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // データがストラクチャー配列かどうかをチェック
      if (!Array.isArray(data)) {
        setError('無効なファイル形式です。ストラクチャー配列が必要です。');
        setSuccess(null);
        return;
      }

      // 各ストラクチャーをバリデーション
      const validStructures: Structure[] = [];
      const invalidCount = data.length;

      for (const item of data) {
        if (isValidStructure(item)) {
          validStructures.push(item);
        }
      }

      if (validStructures.length === 0) {
        setError('有効なストラクチャーが見つかりませんでした');
        setSuccess(null);
        return;
      }

      const skippedCount = invalidCount - validStructures.length;

      onImport(validStructures);

      if (skippedCount > 0) {
        setSuccess(
          `${validStructures.length}件のストラクチャーをインポートしました（${skippedCount}件をスキップ）`
        );
      } else {
        setSuccess(
          `${validStructures.length}件のストラクチャーをインポートしました`
        );
      }
      setError(null);

      // 成功メッセージを3秒後に消す
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('JSONの解析に失敗しました。ファイル形式を確認してください。');
      } else {
        setError('インポートに失敗しました');
      }
      setSuccess(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={handleExport}
          className={styles.button}
          aria-label="ストラクチャーをエクスポート"
          disabled={structures.length === 0}
        >
          <span className={styles.icon} aria-hidden="true">
            📤
          </span>
          <span>エクスポート</span>
        </button>

        <button
          type="button"
          onClick={handleImport}
          className={styles.button}
          aria-label="ストラクチャーをインポート"
        >
          <span className={styles.icon} aria-hidden="true">
            📥
          </span>
          <span>インポート</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className={styles.fileInput}
          aria-label="JSONファイルを選択"
        />
      </div>

      {error && (
        <div className={styles.message} role="alert" aria-live="assertive">
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.message} role="status" aria-live="polite">
          <span className={styles.successIcon}>✓</span>
          <span className={styles.successText}>{success}</span>
        </div>
      )}
    </div>
  );
}
