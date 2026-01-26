# ブラインド管理機能仕様

## 1. 概要

ブラインド管理機能は、トーナメントのブラインド構造を管理し、レベル進行、休憩制御、次のレベル情報の表示を担当します。

## 2. 機能要件

### 2.1 基本機能

- ブラインドレベルの表示（現在/次）
- レベルの手動変更（前後のレベルへジャンプ）
- 休憩時間の管理
- 次の休憩までのレベル数表示
- ブラインド構造の編集

### 2.2 休憩機能

- デフォルトで無効
- Xレベルごとに自動休憩を挿入
- 休憩時間のカウントダウン
- 休憩スキップ機能

## 3. データモデル

### 3.1 BlindLevel

```typescript
export interface BlindLevel {
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly ante: number;
}
```

詳細は [02-data-models.md](../02-data-models.md) を参照。

### 3.2 BreakConfig

```typescript
export interface BreakConfig {
  readonly enabled: boolean;    // デフォルト: false
  readonly frequency: number;   // 1-10レベルごと（デフォルト: 4）
  readonly duration: number;    // 5-30分（デフォルト: 10）
}
```

## 4. レベル進行ロジック

### 4.1 レベル遷移

```typescript
/**
 * 次のレベルへ進む（自動または手動）
 */
function goToNextLevel(state: TournamentState): TournamentState {
  const currentLevel = state.currentLevel;
  const maxLevel = state.blindLevels.length - 1;

  // 現在休憩中の場合
  if (state.isBreak) {
    // 休憩終了 → 次のレベルへ
    return {
      ...state,
      isBreak: false,
      currentLevel: currentLevel + 1,
      timer: createInitialTimer(state.levelDuration),
    };
  }

  // 休憩チェック
  if (shouldTakeBreak(currentLevel + 1, state.breakConfig)) {
    return {
      ...state,
      isBreak: true,
      timer: createInitialTimer(state.breakConfig.duration * 60),
    };
  }

  // 最終レベルチェック
  if (currentLevel >= maxLevel) {
    // 最終レベル完了
    return {
      ...state,
      timer: {
        ...state.timer,
        status: 'idle',
        remainingTime: 0,
      },
    };
  }

  // 通常のレベル進行
  return {
    ...state,
    currentLevel: currentLevel + 1,
    timer: createInitialTimer(state.levelDuration),
  };
}

/**
 * 前のレベルに戻る（手動のみ）
 */
function goToPreviousLevel(state: TournamentState): TournamentState {
  const currentLevel = state.currentLevel;

  // 現在休憩中の場合
  if (state.isBreak) {
    // 休憩キャンセル → 前のレベルに戻る
    return {
      ...state,
      isBreak: false,
      timer: createInitialTimer(state.levelDuration),
    };
  }

  // 最初のレベルチェック
  if (currentLevel === 0) {
    // リセット
    return {
      ...state,
      timer: createInitialTimer(state.levelDuration),
    };
  }

  // 1つ前のレベルに戻る
  return {
    ...state,
    currentLevel: currentLevel - 1,
    timer: createInitialTimer(state.levelDuration),
  };
}
```

### 4.2 休憩判定

```typescript
/**
 * 指定レベルで休憩すべきかを判定
 * @param level レベル番号（0-indexed）
 * @param config 休憩設定
 */
export function shouldTakeBreak(
  level: number,
  config: BreakConfig
): boolean {
  if (!config.enabled) return false;

  // レベル番号は0-indexedだが、頻度は1-indexedで考える
  // 例: frequency=4 → Level 3, 7, 11... の後に休憩
  //     つまり Level 4, 8, 12... の開始時
  const levelNumber = level + 1; // 1-indexedに変換
  return levelNumber % config.frequency === 0;
}

/**
 * 次の休憩までのレベル数を計算
 * @returns レベル数、または休憩が無効の場合null
 */
export function getLevelsUntilNextBreak(
  currentLevel: number,
  config: BreakConfig
): number | null {
  if (!config.enabled) return null;

  const currentLevelNumber = currentLevel + 1; // 1-indexedに変換
  const { frequency } = config;

  // 次の休憩レベル = 次の頻度の倍数
  const nextBreakLevelNumber = Math.ceil(currentLevelNumber / frequency) * frequency;

  // 現在のレベルから次の休憩までのレベル数
  return nextBreakLevelNumber - currentLevelNumber;
}
```

## 5. UI コンポーネント

### 5.1 BlindInfo コンポーネント

```typescript
import React from 'react';
import { useTournament } from '@/ui/hooks/useTournament';
import { formatBlindLevel, formatBlindValue } from '@/utils/format';
import styles from './BlindInfo.module.css';

export const BlindInfo: React.FC = () => {
  const { state } = useTournament();
  const { blindLevels, currentLevel, isBreak } = state;

  // 休憩中の表示
  if (isBreak) {
    return (
      <div className={styles.container}>
        <div className={styles.breakLabel}>休憩中</div>
        <div className={styles.breakIcon}>☕</div>
      </div>
    );
  }

  const currentBlind = blindLevels[currentLevel];

  return (
    <div className={styles.container}>
      {/* レベル番号 */}
      <div className={styles.levelLabel}>
        Level {currentLevel + 1}
      </div>

      {/* ブラインド情報 */}
      <div className={styles.blinds}>
        {/* スモールブラインド */}
        <div className={styles.blindItem}>
          <div className={styles.blindLabel}>SB</div>
          <div className={styles.blindValue}>
            {formatBlindValue(currentBlind.smallBlind)}
          </div>
        </div>

        {/* ビッグブラインド */}
        <div className={styles.blindItem}>
          <div className={styles.blindLabel}>BB</div>
          <div className={styles.blindValue}>
            {formatBlindValue(currentBlind.bigBlind)}
          </div>
        </div>

        {/* アンティ（0より大きい場合のみ表示） */}
        {currentBlind.ante > 0 && (
          <div className={styles.blindItem}>
            <div className={styles.blindLabel}>Ante</div>
            <div className={styles.blindValue}>
              {formatBlindValue(currentBlind.ante)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5.2 NextLevelInfo コンポーネント

```typescript
import React from 'react';
import { useTournament } from '@/ui/hooks/useTournament';
import { formatBlindLevel } from '@/utils/format';
import { getLevelsUntilNextBreak } from '@/domain/models/Tournament';
import styles from './NextLevelInfo.module.css';

export const NextLevelInfo: React.FC = () => {
  const { state } = useTournament();
  const { blindLevels, currentLevel, isBreak, breakConfig } = state;

  // 休憩中は次のレベル情報を表示
  if (isBreak) {
    const nextLevel = currentLevel + 1;
    const nextBlind = blindLevels[nextLevel];

    return (
      <div className={styles.container}>
        <div className={styles.label}>次のレベル</div>
        <div className={styles.info}>
          Level {nextLevel + 1}: {formatBlindLevel(nextBlind)}
        </div>
      </div>
    );
  }

  // 最終レベルチェック
  const isLastLevel = currentLevel >= blindLevels.length - 1;
  if (isLastLevel) {
    return (
      <div className={styles.container}>
        <div className={styles.label}>最終レベル</div>
      </div>
    );
  }

  // 次のレベル情報
  const nextLevel = currentLevel + 1;
  const nextBlind = blindLevels[nextLevel];

  // 次の休憩までのレベル数
  const levelsUntilBreak = getLevelsUntilNextBreak(currentLevel, breakConfig);

  return (
    <div className={styles.container}>
      {/* 次のレベル */}
      <div className={styles.nextLevel}>
        <div className={styles.label}>次のレベル</div>
        <div className={styles.info}>
          Level {nextLevel + 1}: {formatBlindLevel(nextBlind)}
        </div>
      </div>

      {/* 休憩情報 */}
      {levelsUntilBreak !== null && (
        <div className={styles.breakInfo}>
          <div className={styles.breakLabel}>
            次の休憩まで: {levelsUntilBreak}レベル
          </div>
        </div>
      )}
    </div>
  );
};
```

### 5.3 LevelControls コンポーネント

```typescript
import React from 'react';
import { useTournament } from '@/ui/hooks/useTournament';
import styles from './LevelControls.module.css';

export const LevelControls: React.FC = () => {
  const { state, dispatch } = useTournament();
  const { currentLevel, blindLevels, isBreak } = state;

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_LEVEL' });
  };

  const handleNext = () => {
    dispatch({ type: 'NEXT_LEVEL' });
  };

  const canGoPrevious = currentLevel > 0 || isBreak;
  const canGoNext = currentLevel < blindLevels.length - 1 || isBreak;

  return (
    <div className={styles.container}>
      <button
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className={styles.button}
        aria-label="前のレベルに戻る"
      >
        ← 前へ
      </button>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className={styles.button}
        aria-label="次のレベルに進む"
      >
        次へ →
      </button>
    </div>
  );
};
```

## 6. ブラインド編集機能

### 6.1 BlindEditor コンポーネント

```typescript
import React, { useState } from 'react';
import { BlindLevel } from '@/types/domain';
import { validateBlindInput } from '@/utils/validation';
import styles from './BlindEditor.module.css';

interface Props {
  levels: BlindLevel[];
  onChange: (levels: BlindLevel[]) => void;
}

export const BlindEditor: React.FC<Props> = ({ levels, onChange }) => {
  const [editingLevels, setEditingLevels] = useState<BlindLevel[]>(levels);

  const handleLevelChange = (index: number, field: keyof BlindLevel, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const newLevels = [...editingLevels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: numValue,
    };
    setEditingLevels(newLevels);
  };

  const handleAddLevel = () => {
    const lastLevel = editingLevels[editingLevels.length - 1];
    const newLevel: BlindLevel = {
      smallBlind: lastLevel ? lastLevel.smallBlind * 2 : 25,
      bigBlind: lastLevel ? lastLevel.bigBlind * 2 : 50,
      ante: lastLevel ? lastLevel.ante : 0,
    };
    setEditingLevels([...editingLevels, newLevel]);
  };

  const handleRemoveLevel = (index: number) => {
    if (editingLevels.length > 1) {
      const newLevels = editingLevels.filter((_, i) => i !== index);
      setEditingLevels(newLevels);
    }
  };

  const handleSave = () => {
    // バリデーション
    const allValid = editingLevels.every((level) => {
      const result = validateBlindInput(
        level.smallBlind.toString(),
        level.bigBlind.toString(),
        level.ante.toString()
      );
      return result.valid;
    });

    if (allValid) {
      onChange(editingLevels);
    }
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>レベル</th>
            <th>SB</th>
            <th>BB</th>
            <th>Ante</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {editingLevels.map((level, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="number"
                  value={level.smallBlind}
                  onChange={(e) => handleLevelChange(index, 'smallBlind', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={level.bigBlind}
                  onChange={(e) => handleLevelChange(index, 'bigBlind', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={level.ante}
                  onChange={(e) => handleLevelChange(index, 'ante', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <button
                  onClick={() => handleRemoveLevel(index)}
                  disabled={editingLevels.length === 1}
                  className={styles.removeButton}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.actions}>
        <button onClick={handleAddLevel} className={styles.addButton}>
          + レベルを追加
        </button>
        <button onClick={handleSave} className={styles.saveButton}>
          保存
        </button>
      </div>
    </div>
  );
};
```

### 6.2 BreakSettings コンポーネント

```typescript
import React, { useState } from 'react';
import { BreakConfig } from '@/types/domain';
import styles from './BreakSettings.module.css';

interface Props {
  config: BreakConfig;
  onChange: (config: BreakConfig) => void;
}

export const BreakSettings: React.FC<Props> = ({ config, onChange }) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [frequency, setFrequency] = useState(config.frequency);
  const [duration, setDuration] = useState(config.duration);

  const handleSave = () => {
    onChange({
      enabled,
      frequency,
      duration,
    });
  };

  return (
    <div className={styles.container}>
      {/* 休憩有効/無効 */}
      <div className={styles.row}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          休憩を有効にする
        </label>
      </div>

      {/* 休憩頻度 */}
      {enabled && (
        <>
          <div className={styles.row}>
            <label className={styles.label}>
              休憩頻度
              <select
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
                className={styles.select}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}レベルごと
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 休憩時間 */}
          <div className={styles.row}>
            <label className={styles.label}>
              休憩時間
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className={styles.select}
              >
                {[5, 10, 15, 20, 25, 30].map((n) => (
                  <option key={n} value={n}>
                    {n}分
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <button onClick={handleSave} className={styles.saveButton}>
        保存
      </button>
    </div>
  );
};
```

## 7. Reducer アクション

### 7.1 レベル変更アクション

```typescript
type TournamentAction =
  | { type: 'NEXT_LEVEL' }
  | { type: 'PREVIOUS_LEVEL' }
  | { type: 'UPDATE_BLIND_LEVELS'; payload: { levels: BlindLevel[] } }
  | { type: 'UPDATE_BREAK_CONFIG'; payload: BreakConfig }
  | { type: 'SKIP_BREAK' };

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'NEXT_LEVEL':
      return goToNextLevel(state);

    case 'PREVIOUS_LEVEL':
      return goToPreviousLevel(state);

    case 'UPDATE_BLIND_LEVELS':
      return {
        ...state,
        blindLevels: action.payload.levels,
        currentLevel: 0,
        timer: createInitialTimer(state.levelDuration),
      };

    case 'UPDATE_BREAK_CONFIG':
      return {
        ...state,
        breakConfig: action.payload,
      };

    case 'SKIP_BREAK':
      if (!state.isBreak) return state;
      return {
        ...state,
        isBreak: false,
        currentLevel: state.currentLevel + 1,
        timer: createInitialTimer(state.levelDuration),
      };

    default:
      return state;
  }
}
```

## 8. ユーティリティ関数

### 8.1 フォーマット関数

```typescript
/**
 * ブラインドレベルを文字列にフォーマット
 * @example "25/50" or "25/50 (Ante: 10)"
 */
export function formatBlindLevel(level: BlindLevel): string {
  const base = `${formatBlindValue(level.smallBlind)}/${formatBlindValue(level.bigBlind)}`;
  return level.ante > 0 ? `${base} (Ante: ${formatBlindValue(level.ante)})` : base;
}

/**
 * ブラインド値をカンマ区切りでフォーマット
 * @example 1000 → "1,000"
 */
export function formatBlindValue(value: number): string {
  return value.toLocaleString('ja-JP');
}
```

## 9. テストケース

### 9.1 レベル進行のテスト

```typescript
import { describe, it, expect } from 'vitest';
import { shouldTakeBreak, getLevelsUntilNextBreak } from '@/domain/models/Tournament';

describe('Break Logic', () => {
  const breakConfig: BreakConfig = {
    enabled: true,
    frequency: 4,
    duration: 10,
  };

  it('shouldTakeBreak: 正しく休憩を判定', () => {
    expect(shouldTakeBreak(0, breakConfig)).toBe(false);
    expect(shouldTakeBreak(3, breakConfig)).toBe(false);
    expect(shouldTakeBreak(4, breakConfig)).toBe(true); // Level 4 → Level 5の前
    expect(shouldTakeBreak(7, breakConfig)).toBe(false);
    expect(shouldTakeBreak(8, breakConfig)).toBe(true); // Level 8 → Level 9の前
  });

  it('getLevelsUntilNextBreak: 正しくカウント', () => {
    expect(getLevelsUntilNextBreak(0, breakConfig)).toBe(3); // Level 1 → 休憩まで3レベル
    expect(getLevelsUntilNextBreak(1, breakConfig)).toBe(2);
    expect(getLevelsUntilNextBreak(2, breakConfig)).toBe(1);
    expect(getLevelsUntilNextBreak(3, breakConfig)).toBe(0); // 次が休憩
    expect(getLevelsUntilNextBreak(4, breakConfig)).toBe(3); // 休憩後、次まで3レベル
  });

  it('休憩無効時はnullを返す', () => {
    const disabledConfig = { ...breakConfig, enabled: false };
    expect(getLevelsUntilNextBreak(0, disabledConfig)).toBe(null);
  });
});
```

## 10. エッジケース

### 10.1 最終レベル到達時

```typescript
// 最終レベル完了時の処理
if (currentLevel >= blindLevels.length - 1 && !isBreak) {
  return {
    ...state,
    timer: {
      ...state.timer,
      status: 'idle',
      remainingTime: 0,
    },
  };
}
```

### 10.2 休憩スキップ

```typescript
// 休憩を手動でスキップ
case 'SKIP_BREAK':
  if (!state.isBreak) return state;

  return goToNextLevel({ ...state, isBreak: false });
```

## 11. まとめ

ブラインド管理機能の主要な実装ポイント：

1. **レベル進行**: 自動進行と手動ジャンプの両対応
2. **休憩制御**: デフォルト無効、柔軟な設定
3. **情報表示**: 現在/次のレベル、休憩までの残りレベル
4. **編集機能**: ブラインド構造と休憩設定の編集

---

## 関連ドキュメント

- [02-data-models.md](../02-data-models.md) - BlindLevel, BreakConfig型定義
- [timer.md](./timer.md) - タイマーとの連携
- [presets.md](./presets.md) - プリセットからのロード

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
