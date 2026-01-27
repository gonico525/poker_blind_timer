import type { BlindLevel } from '@/types';
import styles from './BlindEditor.module.css';

interface BlindEditorProps {
  blindLevels: BlindLevel[];
  onChange: (blindLevels: BlindLevel[]) => void;
}

/**
 * ブラインドレベル編集コンポーネント
 * ブラインド構造の編集機能を提供
 */
export function BlindEditor({ blindLevels, onChange }: BlindEditorProps) {
  const handleLevelChange = (
    index: number,
    field: keyof BlindLevel,
    value: number
  ) => {
    const newLevels = [...blindLevels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: Math.max(0, value),
    };
    onChange(newLevels);
  };

  const handleAddLevel = () => {
    const lastLevel = blindLevels[blindLevels.length - 1];
    const newLevel: BlindLevel = {
      smallBlind: Math.round(lastLevel.smallBlind * 1.5),
      bigBlind: Math.round(lastLevel.bigBlind * 1.5),
      ante: lastLevel.ante > 0 ? Math.round(lastLevel.ante * 1.5) : 0,
    };
    onChange([...blindLevels, newLevel]);
  };

  const handleRemoveLevel = (index: number) => {
    if (blindLevels.length > 1) {
      const newLevels = blindLevels.filter((_, i) => i !== index);
      onChange(newLevels);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>ブラインド構造</h3>
        <button
          className={styles.addButton}
          onClick={handleAddLevel}
          aria-label="レベルを追加"
        >
          + レベル追加
        </button>
      </div>

      <div className={styles.list}>
        <div className={styles.headerRow}>
          <span className={styles.levelNum}>レベル</span>
          <span className={styles.blindValue}>SB</span>
          <span className={styles.blindValue}>BB</span>
          <span className={styles.blindValue}>アンティ</span>
          <span className={styles.actions}></span>
        </div>

        {blindLevels.map((level, index) => (
          <div
            key={index}
            className={styles.row}
            data-testid="blind-level-row"
          >
            <span className={styles.levelNum}>{index + 1}</span>

            <input
              type="number"
              className={styles.input}
              data-testid="sb-input"
              value={level.smallBlind}
              onChange={(e) =>
                handleLevelChange(
                  index,
                  'smallBlind',
                  parseInt(e.target.value) || 0
                )
              }
              min="1"
              aria-label={`レベル${index + 1}のスモールブラインド`}
            />

            <input
              type="number"
              className={styles.input}
              data-testid="bb-input"
              value={level.bigBlind}
              onChange={(e) =>
                handleLevelChange(
                  index,
                  'bigBlind',
                  parseInt(e.target.value) || 0
                )
              }
              min="1"
              aria-label={`レベル${index + 1}のビッグブラインド`}
            />

            <input
              type="number"
              className={styles.input}
              data-testid="ante-input"
              value={level.ante}
              onChange={(e) =>
                handleLevelChange(index, 'ante', parseInt(e.target.value) || 0)
              }
              min="0"
              aria-label={`レベル${index + 1}のアンティ`}
            />

            <button
              className={styles.deleteButton}
              data-testid="delete-level-button"
              onClick={() => handleRemoveLevel(index)}
              disabled={blindLevels.length === 1}
              aria-label={`レベル${index + 1}を削除`}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
