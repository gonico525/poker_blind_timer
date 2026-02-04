# プリセット管理機能仕様

## 1. 概要

プリセット管理機能は、ブラインド構造のテンプレートを保存・読み込み・編集する機能です。デフォルトプリセットとカスタムプリセットの両方をサポートします。

## 2. 機能要件

### 2.1 基本機能

- プリセットの一覧表示
- プリセットの選択・読み込み
- カスタムプリセットの作成
- プリセットの編集
- プリセットの削除
- インポート/エクスポート（JSON形式）

### 2.2 デフォルトプリセット

システムに組み込まれた4つのプリセット：

1. **Deepstack (30min/50k Start)**: 30分レベル、24レベル、休憩有効（4レベルごと）
2. **Standard (20min/30k Start)**: 20分レベル、17レベル、休憩有効（4レベルごと）
3. **Turbo (15min/25k Start)**: 15分レベル、14レベル、休憩有効（5レベルごと）
4. **Hyper Turbo (10min/20k Start)**: 10分レベル、12レベル、休憩無効

詳細は [02-data-models.md](../02-data-models.md#4-デフォルトプリセット) を参照。

### 2.3 制限事項

- **最大保存数**: 50個
- **名前の長さ**: 最大50文字
- **レベル数**: 最小1、最大制限なし（実用的には50レベル程度）

## 3. データモデル

### 3.1 Preset型

```typescript
export interface Preset {
  id: PresetId;
  name: string;
  type: PresetType;
  blindLevels: BlindLevel[];
  levelDuration: number; // 秒
  breakConfig: BreakConfig;
  createdAt: number;
  updatedAt: number;
}

export type PresetType = 'standard' | 'turbo' | 'deepstack' | 'custom';
```

## 4. プリセット管理ロジック

### 4.1 usePresets カスタムフック

```typescript
import { useSettings } from './useSettings';
import { Preset, PresetId } from '@/types/domain';
import { generatePresetId } from '@/domain/models/Preset';

export function usePresets() {
  const { state, dispatch } = useSettings();
  const { presets } = state;

  // プリセット一覧取得
  const getPresets = useCallback((): Preset[] => {
    return presets;
  }, [presets]);

  // プリセット取得（ID指定）
  const getPreset = useCallback(
    (id: PresetId): Preset | undefined => {
      return presets.find((p) => p.id === id);
    },
    [presets]
  );

  // プリセット追加
  const addPreset = useCallback(
    (preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newPreset: Preset = {
        ...preset,
        id: generatePresetId(),
        type: 'custom',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      dispatch({ type: 'ADD_PRESET', payload: newPreset });
      return newPreset;
    },
    [dispatch]
  );

  // プリセット更新
  const updatePreset = useCallback(
    (id: PresetId, updates: Partial<Preset>) => {
      const existing = presets.find((p) => p.id === id);
      if (!existing) {
        throw new Error(`Preset not found: ${id}`);
      }

      // デフォルトプリセットは編集不可
      if (isDefaultPreset(id)) {
        throw new Error('Default presets cannot be modified');
      }

      const updatedPreset: Preset = {
        ...existing,
        ...updates,
        id, // IDは変更不可
        updatedAt: Date.now(),
      };

      dispatch({ type: 'UPDATE_PRESET', payload: updatedPreset });
    },
    [presets, dispatch]
  );

  // プリセット削除
  const deletePreset = useCallback(
    (id: PresetId) => {
      // デフォルトプリセットは削除不可
      if (isDefaultPreset(id)) {
        throw new Error('Default presets cannot be deleted');
      }

      dispatch({ type: 'DELETE_PRESET', payload: { id } });
    },
    [dispatch]
  );

  // プリセット読み込み（トーナメントに適用）
  const loadPreset = useCallback(
    (id: PresetId) => {
      const preset = getPreset(id);
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      // TournamentContextに通知
      dispatch({ type: 'LOAD_PRESET', payload: { preset } });
    },
    [getPreset, dispatch]
  );

  return {
    presets,
    getPresets,
    getPreset,
    addPreset,
    updatePreset,
    deletePreset,
    loadPreset,
  };
}
```

## 5. UI コンポーネント

### 5.1 PresetList コンポーネント

```typescript
import React from 'react';
import { usePresets } from '@/ui/hooks/usePresets';
import { useTournament } from '@/ui/hooks/useTournament';
import { isDefaultPreset } from '@/domain/models/Preset';
import styles from './PresetList.module.css';

export const PresetList: React.FC = () => {
  const { presets, deletePreset, loadPreset } = usePresets();
  const { state } = useTournament();
  const { activePresetId } = state;

  const handleLoad = (id: PresetId) => {
    if (window.confirm('現在のトーナメント設定が上書きされます。よろしいですか?')) {
      loadPreset(id);
    }
  };

  const handleDelete = (id: PresetId, name: string) => {
    if (window.confirm(`プリセット「${name}」を削除しますか?`)) {
      deletePreset(id);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>プリセット一覧</h2>
      </div>

      <div className={styles.list}>
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={`${styles.item} ${preset.id === activePresetId ? styles.active : ''}`}
          >
            <div className={styles.info}>
              <div className={styles.name}>
                {preset.name}
                {isDefaultPreset(preset.id) && (
                  <span className={styles.badge}>デフォルト</span>
                )}
              </div>
              <div className={styles.details}>
                {preset.blindLevels.length}レベル・
                {Math.floor(preset.levelDuration / 60)}分/レベル
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={() => handleLoad(preset.id)}
                className={styles.loadButton}
              >
                読み込み
              </button>

              {!isDefaultPreset(preset.id) && (
                <>
                  <button
                    onClick={() => {/* 編集モーダルを開く */}}
                    className={styles.editButton}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id, preset.name)}
                    className={styles.deleteButton}
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {presets.length >= MAX_PRESETS && (
        <div className={styles.warning}>
          プリセットの上限（{MAX_PRESETS}個）に達しています。
          新しいプリセットを保存するには、既存のプリセットを削除してください。
        </div>
      )}
    </div>
  );
};
```

### 5.2 PresetForm コンポーネント

```typescript
import React, { useState } from 'react';
import { usePresets } from '@/ui/hooks/usePresets';
import { useTournament } from '@/ui/hooks/useTournament';
import { BlindLevel, BreakConfig } from '@/types/domain';
import { validatePresetName } from '@/utils/validation';
import { BlindEditor } from '../settings/BlindEditor';
import { BreakSettings } from '../settings/BreakSettings';
import styles from './PresetForm.module.css';

interface Props {
  onClose: () => void;
}

export const PresetForm: React.FC<Props> = ({ onClose }) => {
  const { addPreset } = usePresets();
  const { state } = useTournament();

  // 現在のトーナメント設定を初期値とする
  const [name, setName] = useState('');
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>(state.blindLevels);
  const [levelDuration, setLevelDuration] = useState(state.levelDuration / 60); // 秒→分
  const [breakConfig, setBreakConfig] = useState<BreakConfig>(state.breakConfig);

  const handleSave = () => {
    // バリデーション
    const nameValidation = validatePresetName(name);
    if (!nameValidation.valid) {
      alert(nameValidation.errors.join('\n'));
      return;
    }

    if (blindLevels.length === 0) {
      alert('最低1つのレベルが必要です');
      return;
    }

    // プリセット作成
    addPreset({
      name,
      blindLevels,
      levelDuration: levelDuration * 60, // 分→秒
      breakConfig,
    });

    onClose();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>新しいプリセットを作成</h2>
      </div>

      <div className={styles.form}>
        {/* プリセット名 */}
        <div className={styles.field}>
          <label className={styles.label}>プリセット名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ホームゲーム用"
            maxLength={50}
            className={styles.input}
          />
        </div>

        {/* レベル時間 */}
        <div className={styles.field}>
          <label className={styles.label}>レベル時間（分）</label>
          <input
            type="number"
            value={levelDuration}
            onChange={(e) => setLevelDuration(parseInt(e.target.value, 10))}
            min={1}
            max={60}
            className={styles.input}
          />
        </div>

        {/* ブラインド構造 */}
        <div className={styles.field}>
          <label className={styles.label}>ブラインド構造</label>
          <BlindEditor levels={blindLevels} onChange={setBlindLevels} />
        </div>

        {/* 休憩設定 */}
        <div className={styles.field}>
          <label className={styles.label}>休憩設定</label>
          <BreakSettings config={breakConfig} onChange={setBreakConfig} />
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={onClose} className={styles.cancelButton}>
          キャンセル
        </button>
        <button onClick={handleSave} className={styles.saveButton}>
          保存
        </button>
      </div>
    </div>
  );
};
```

### 5.3 ImportExport コンポーネント

```typescript
import React, { useRef } from 'react';
import { usePresets } from '@/ui/hooks/usePresets';
import { validateImportData } from '@/utils/validation';
import styles from './ImportExport.module.css';

export const ImportExport: React.FC = () => {
  const { presets, addPreset } = usePresets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // エクスポート
  const handleExport = (presetId: PresetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // すべてエクスポート
  const handleExportAll = () => {
    const json = JSON.stringify(presets, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'poker-timer-presets.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  // インポート
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      // バリデーション
      const result = validateImportData(content);
      if (!result.valid) {
        alert(`インポートエラー: ${result.error}`);
        return;
      }

      // プリセット追加
      if (result.preset) {
        addPreset(result.preset);
        alert('プリセットをインポートしました');
      }
    };

    reader.readAsText(file);

    // 入力リセット（同じファイルを再度選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3>インポート</h3>
        <p>JSONファイルからプリセットを読み込みます</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.section}>
        <h3>エクスポート</h3>
        <p>プリセットをJSONファイルとして保存します</p>
        <button onClick={handleExportAll} className={styles.exportButton}>
          すべてエクスポート
        </button>
      </div>

      <div className={styles.section}>
        <h3>個別エクスポート</h3>
        <div className={styles.presetList}>
          {presets.map((preset) => (
            <div key={preset.id} className={styles.presetItem}>
              <span>{preset.name}</span>
              <button
                onClick={() => handleExport(preset.id)}
                className={styles.exportItemButton}
              >
                エクスポート
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## 6. Reducer アクション

### 6.1 Settings Reducer

```typescript
type SettingsAction =
  | { type: 'ADD_PRESET'; payload: Preset }
  | { type: 'UPDATE_PRESET'; payload: Preset }
  | { type: 'DELETE_PRESET'; payload: { id: PresetId } }
  | { type: 'LOAD_PRESETS'; payload: Preset[] };

function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'ADD_PRESET': {
      // 上限チェック
      if (state.presets.length >= MAX_PRESETS) {
        throw new Error(`プリセットの上限（${MAX_PRESETS}個）に達しています`);
      }

      return {
        ...state,
        presets: [...state.presets, action.payload],
      };
    }

    case 'UPDATE_PRESET': {
      const index = state.presets.findIndex((p) => p.id === action.payload.id);
      if (index === -1) return state;

      const newPresets = [...state.presets];
      newPresets[index] = action.payload;

      return {
        ...state,
        presets: newPresets,
      };
    }

    case 'DELETE_PRESET': {
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== action.payload.id),
      };
    }

    case 'LOAD_PRESETS': {
      return {
        ...state,
        presets: action.payload,
      };
    }

    default:
      return state;
  }
}
```

### 6.2 Tournament Reducer（プリセット読み込み）

```typescript
case 'LOAD_PRESET': {
  const { preset } = action.payload;

  return {
    ...state,
    blindLevels: preset.blindLevels,
    levelDuration: preset.levelDuration,
    breakConfig: preset.breakConfig,
    activePresetId: preset.id,
    currentLevel: 0,
    isBreak: false,
    timer: createInitialTimer(preset.levelDuration),
  };
}
```

## 7. 永続化

### 7.1 プリセットの自動保存

```typescript
// SettingsContext内でプリセット変更を監視
useEffect(() => {
  // プリセットをlocalStorageに保存
  savePresetsToStorage(state.presets);
}, [state.presets]);
```

### 7.2 初期化時のロード

```typescript
// アプリ起動時にプリセットをロード
useEffect(() => {
  const loadPresets = async () => {
    try {
      const stored = loadPresetsFromStorage();

      // デフォルトプリセットと統合
      const allPresets = mergeWithDefaultPresets(stored);

      dispatch({ type: 'LOAD_PRESETS', payload: allPresets });
    } catch (error) {
      console.error('Failed to load presets:', error);
      // デフォルトプリセットのみ使用
      dispatch({ type: 'LOAD_PRESETS', payload: DEFAULT_PRESETS });
    }
  };

  loadPresets();
}, []);

/**
 * デフォルトプリセットとストレージのプリセットを統合
 */
function mergeWithDefaultPresets(stored: Preset[]): Preset[] {
  // デフォルトプリセットは常に含める
  const customPresets = stored.filter((p) => !isDefaultPreset(p.id));
  return [...DEFAULT_PRESETS, ...customPresets];
}
```

## 8. バリデーション

詳細は [02-data-models.md](../02-data-models.md#6-データバリデーション) を参照。

```typescript
// プリセット全体のバリデーション
export function isValidPreset(preset: Preset): boolean {
  return (
    preset.id.length > 0 &&
    preset.name.trim().length > 0 &&
    preset.blindLevels.length > 0 &&
    preset.blindLevels.every(isValidBlindLevel) &&
    preset.levelDuration >= 60 &&
    preset.levelDuration <= 3600 &&
    isValidBreakConfig(preset.breakConfig)
  );
}
```

## 9. エラーハンドリング

### 9.1 プリセット保存失敗

```typescript
try {
  addPreset(newPreset);
} catch (error) {
  if (error.message.includes('上限')) {
    alert(
      'プリセットの保存上限に達しています。不要なプリセットを削除してください。'
    );
  } else {
    alert('プリセットの保存に失敗しました');
  }
}
```

### 9.2 インポートエラー

```typescript
const result = validateImportData(json);
if (!result.valid) {
  // エラーメッセージを表示
  alert(`インポートエラー:\n${result.error}`);
  return;
}
```

## 10. テストケース

```typescript
import { describe, it, expect } from 'vitest';
import { isValidPreset, generatePresetId } from '@/domain/models/Preset';

describe('Preset', () => {
  it('generatePresetId: ユニークなIDを生成', () => {
    const id1 = generatePresetId();
    const id2 = generatePresetId();
    expect(id1).not.toBe(id2);
  });

  it('isValidPreset: 正しくバリデーション', () => {
    const validPreset = createMockPreset();
    expect(isValidPreset(validPreset)).toBe(true);

    const invalidPreset = { ...validPreset, name: '' };
    expect(isValidPreset(invalidPreset)).toBe(false);
  });
});
```

## 11. まとめ

プリセット管理機能の主要な実装ポイント：

1. **CRUD操作**: 作成・読み込み・更新・削除
2. **デフォルトプリセット**: 削除・編集不可の組み込みプリセット
3. **永続化**: localStorageへの自動保存
4. **インポート/エクスポート**: JSON形式でのデータ交換
5. **バリデーション**: データ整合性の保証

---

## 関連ドキュメント

- [02-data-models.md](../02-data-models.md) - Preset型定義
- [storage.md](./storage.md) - データ永続化の実装
- [blinds.md](./blinds.md) - ブラインド構造の編集

---

## 改訂履歴

| バージョン | 日付       | 変更内容 | 作成者              |
| ---------- | ---------- | -------- | ------------------- |
| 1.0        | 2026-01-26 | 初版作成 | AI System Architect |
