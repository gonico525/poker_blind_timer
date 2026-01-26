# Team D 実装計画書：プリセット・設定UI

## 概要

| 項目       | 内容                                                 |
| ---------- | ---------------------------------------------------- |
| チーム名   | Team D                                               |
| 担当領域   | プリセット・設定UI                                   |
| 主な成果物 | usePresets、PresetManager、BlindEditor、設定パネル群 |
| 依存先     | Team A（Context、Storage）、Team B（タイマー連携）   |
| 依存元     | なし                                                 |

---

## 担当範囲

### 成果物一覧

```
src/
├── hooks/
│   ├── usePresets.ts            # プリセット管理フック
│   └── usePresets.test.ts
├── components/
│   ├── SettingsPanel/
│   │   ├── SettingsPanel.tsx    # 設定パネル（メイン）
│   │   ├── SettingsPanel.test.tsx
│   │   └── SettingsPanel.module.css
│   ├── PresetManager/
│   │   ├── PresetManager.tsx    # プリセット管理
│   │   ├── PresetManager.test.tsx
│   │   ├── PresetList.tsx
│   │   ├── PresetForm.tsx
│   │   └── PresetManager.module.css
│   ├── BlindEditor/
│   │   ├── BlindEditor.tsx      # ブラインド編集
│   │   ├── BlindEditor.test.tsx
│   │   ├── BlindLevelRow.tsx
│   │   └── BlindEditor.module.css
│   ├── BreakSettings/
│   │   ├── BreakSettings.tsx    # 休憩設定
│   │   ├── BreakSettings.test.tsx
│   │   └── BreakSettings.module.css
│   ├── AudioSettings/
│   │   ├── AudioSettings.tsx    # 音声設定
│   │   ├── AudioSettings.test.tsx
│   │   └── AudioSettings.module.css
│   ├── ThemeToggle/
│   │   ├── ThemeToggle.tsx      # テーマ切り替え
│   │   ├── ThemeToggle.test.tsx
│   │   └── ThemeToggle.module.css
│   └── ImportExport/
│       ├── ImportExport.tsx     # インポート/エクスポート
│       ├── ImportExport.test.tsx
│       └── ImportExport.module.css
└── __tests__/
    └── integration/
        └── preset-flow.test.tsx # プリセットフロー統合テスト
```

---

## 開発開始条件

**Team A からの提供物が必要:**

| 提供物                             | 提供元          | 使用箇所                         |
| ---------------------------------- | --------------- | -------------------------------- |
| 型定義（Preset, BlindLevel, etc.） | Team A Phase 1  | 全ファイル                       |
| バリデーション関数                 | Team A Phase 1  | PresetForm, BlindEditor          |
| SettingsContext                    | Team A Phase 2A | usePresets, 全設定コンポーネント |
| TournamentContext                  | Team A Phase 2A | usePresets（LOAD_PRESET連携）    |
| NotificationContext                | Team A Phase 2A | エラー/成功通知                  |
| StorageService                     | Team A Phase 2A | インポート/エクスポート          |

**開始可能タイミング**: Team A Phase 2A 完了後

---

## 実装フェーズ

### Phase 3A: usePresets フック

**目標**: プリセット管理のビジネスロジックを実装

**作業開始前の必須確認:**

Phase 1およびPhase 2Aの成果物を確認してから実装を開始してください。以下のファイルを必ず確認すること：

1. **Phase 1成果物の確認**
   - `src/types/domain.ts`: Preset, BlindLevel, BreakConfig等の型定義を確認
   - `src/types/context.ts`: SettingsAction, TournamentAction等のアクション型定義を確認
   - `src/utils/constants.ts`: LIMITS.MAX_PRESETS等の定数値を確認
   - `src/utils/validation.ts`: isValidPreset, validatePresetName等のバリデーション関数を確認
   - `src/domain/models/Preset.ts`: createDefaultPresets, mergeWithDefaultPresets等の関数を確認

2. **Phase 2A成果物の確認**
   - `src/contexts/SettingsContext.tsx`: SettingsContext の state 構造とdispatch可能なアクション(ADD_PRESET, UPDATE_PRESET, DELETE_PRESET等)を確認
   - `src/contexts/TournamentContext.tsx`: TournamentContext の LOAD_PRESET アクションの実装を確認
   - `src/contexts/NotificationContext.tsx`: showNotification 関数のシグネチャと使用方法を確認

3. **完了報告書の確認**
   - `docs/reports/phase1-completion-report.md`: Phase 1で実装された全機能の動作確認
   - `docs/reports/phase2a-completion-report.md`: Phase 2Aで実装されたContextの動作確認

**参照ドキュメント:**

- [features/presets.md](../specs/features/presets.md) - プリセット機能仕様（**必読**）
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション1.3「LOAD_PRESETの処理フロー」（**必読**）
- [features/storage.md](../specs/features/storage.md) - ストレージ仕様

#### Step 3A.1: usePresets 基本機能

**TDD実装順序:**

```typescript
// src/hooks/usePresets.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePresets } from './usePresets';

vi.mock('@/services/StorageService');

describe('usePresets', () => {
  const createWrapper = (initialPresets: Preset[] = []) => {
    return ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider initialState={{ presets: initialPresets }}>
        <TournamentProvider>
          {children}
        </TournamentProvider>
      </SettingsProvider>
    );
  };

  describe('presets list', () => {
    it('should return all presets', () => {
      const presets = [
        { id: '1', name: 'Preset 1', type: 'custom', blindLevels: [] },
        { id: '2', name: 'Preset 2', type: 'custom', blindLevels: [] },
      ];

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(presets),
      });

      expect(result.current.presets).toHaveLength(2);
    });

    it('should return default presets', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      expect(result.current.defaultPresets.length).toBeGreaterThan(0);
      expect(result.current.defaultPresets.some(p => p.type === 'default')).toBe(true);
    });

    it('should return custom presets only', () => {
      const presets = [
        { id: 'default-standard', name: 'Standard', type: 'default', blindLevels: [] },
        { id: 'custom-1', name: 'My Preset', type: 'custom', blindLevels: [] },
      ];

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(presets),
      });

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].id).toBe('custom-1');
    });
  });

  describe('loadPreset', () => {
    it('should load preset into tournament context', async () => {
      const preset = {
        id: '1',
        name: 'Test',
        type: 'custom',
        blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
        levelDuration: 900,
      };

      const { result } = renderHook(
        () => {
          const presets = usePresets();
          const tournament = useTournament();
          return { presets, tournament };
        },
        { wrapper: createWrapper([preset]) }
      );

      act(() => {
        result.current.presets.loadPreset('1');
      });

      expect(result.current.tournament.state.blindLevels).toEqual(preset.blindLevels);
      expect(result.current.tournament.state.levelDuration).toBe(900);
    });

    it('should set currentPresetId after loading', () => {
      const preset = { id: '1', name: 'Test', type: 'custom', blindLevels: [] };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      act(() => {
        result.current.loadPreset('1');
      });

      expect(result.current.currentPresetId).toBe('1');
    });
  });

  describe('addPreset', () => {
    it('should add new preset', async () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      const newPreset = {
        name: 'New Preset',
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 0 }],
      };

      await act(async () => {
        await result.current.addPreset(newPreset);
      });

      expect(result.current.customPresets.some(p => p.name === 'New Preset')).toBe(true);
    });

    it('should generate unique id for new preset', async () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      await act(async () => {
        await result.current.addPreset({ name: 'Test', blindLevels: [] });
      });

      const addedPreset = result.current.customPresets.find(p => p.name === 'Test');
      expect(addedPreset?.id).toBeDefined();
      expect(addedPreset?.id).toMatch(/^custom-/);
    });

    it('should throw error when max presets reached', async () => {
      const maxPresets = Array.from({ length: 20 }, (_, i) => ({
        id: `custom-${i}`,
        name: `Preset ${i}`,
        type: 'custom',
        blindLevels: [],
      }));

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(maxPresets),
      });

      await expect(
        act(async () => {
          await result.current.addPreset({ name: 'One more', blindLevels: [] });
        })
      ).rejects.toThrow(/maximum/i);
    });
  });

  describe('updatePreset', () => {
    it('should update existing preset', async () => {
      const preset = { id: 'custom-1', name: 'Old Name', type: 'custom', blindLevels: [] };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      await act(async () => {
        await result.current.updatePreset('custom-1', { name: 'New Name' });
      });

      expect(result.current.customPresets[0].name).toBe('New Name');
    });

    it('should not allow updating default presets', async () => {
      const defaultPreset = { id: 'default-standard', name: 'Standard', type: 'default', blindLevels: [] };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([defaultPreset]),
      });

      await expect(
        act(async () => {
          await result.current.updatePreset('default-standard', { name: 'Modified' });
        })
      ).rejects.toThrow(/default/i);
    });
  });

  describe('deletePreset', () => {
    it('should delete custom preset', async () => {
      const preset = { id: 'custom-1', name: 'To Delete', type: 'custom', blindLevels: [] };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      await act(async () => {
        await result.current.deletePreset('custom-1');
      });

      expect(result.current.customPresets).toHaveLength(0);
    });

    it('should not allow deleting default presets', async () => {
      const defaultPreset = { id: 'default-standard', name: 'Standard', type: 'default', blindLevels: [] };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([defaultPreset]),
      });

      await expect(
        act(async () => {
          await result.current.deletePreset('default-standard');
        })
      ).rejects.toThrow(/default/i);
    });
  });

  describe('duplicatePreset', () => {
    it('should create a copy of preset', async () => {
      const preset = {
        id: 'custom-1',
        name: 'Original',
        type: 'custom',
        blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
      };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      await act(async () => {
        await result.current.duplicatePreset('custom-1');
      });

      expect(result.current.customPresets).toHaveLength(2);
      expect(result.current.customPresets[1].name).toBe('Original (コピー)');
      expect(result.current.customPresets[1].blindLevels).toEqual(preset.blindLevels);
    });
  });
});
```

#### Step 3A.2: インポート/エクスポート機能

```typescript
describe('usePresets - import/export', () => {
  describe('exportPreset', () => {
    it('should export preset as JSON string', () => {
      const preset = {
        id: 'custom-1',
        name: 'Export Test',
        type: 'custom',
        blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
      };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      const exported = result.current.exportPreset('custom-1');

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.name).toBe('Export Test');
      expect(parsed.blindLevels).toEqual(preset.blindLevels);
    });

    it('should exclude internal fields from export', () => {
      const preset = {
        id: 'custom-1',
        name: 'Export Test',
        type: 'custom',
        blindLevels: [],
      };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([preset]),
      });

      const exported = result.current.exportPreset('custom-1');
      const parsed = JSON.parse(exported);

      expect(parsed.id).toBeUndefined();
      expect(parsed.type).toBeUndefined();
    });
  });

  describe('exportAllPresets', () => {
    it('should export all custom presets', () => {
      const presets = [
        {
          id: 'default-standard',
          name: 'Standard',
          type: 'default',
          blindLevels: [],
        },
        { id: 'custom-1', name: 'Custom 1', type: 'custom', blindLevels: [] },
        { id: 'custom-2', name: 'Custom 2', type: 'custom', blindLevels: [] },
      ];

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(presets),
      });

      const exported = result.current.exportAllPresets();
      const parsed = JSON.parse(exported);

      expect(parsed.presets).toHaveLength(2); // default以外
    });
  });

  describe('importPreset', () => {
    it('should import valid preset JSON', async () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      const importData = JSON.stringify({
        name: 'Imported',
        blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
        levelDuration: 600,
      });

      await act(async () => {
        await result.current.importPreset(importData);
      });

      expect(
        result.current.customPresets.some((p) => p.name === 'Imported')
      ).toBe(true);
    });

    it('should throw error for invalid JSON', async () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      await expect(
        act(async () => {
          await result.current.importPreset('invalid json');
        })
      ).rejects.toThrow(/JSON/i);
    });

    it('should throw error for invalid preset structure', async () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([]),
      });

      const invalidData = JSON.stringify({ name: 'No blinds' }); // blindLevels missing

      await expect(
        act(async () => {
          await result.current.importPreset(invalidData);
        })
      ).rejects.toThrow(/invalid/i);
    });

    it('should rename duplicate preset names', async () => {
      const existing = {
        id: 'custom-1',
        name: 'My Preset',
        type: 'custom',
        blindLevels: [],
      };

      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper([existing]),
      });

      const importData = JSON.stringify({
        name: 'My Preset',
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 0 }],
      });

      await act(async () => {
        await result.current.importPreset(importData);
      });

      const imported = result.current.customPresets.find((p) =>
        p.name.includes('(2)')
      );
      expect(imported).toBeDefined();
    });
  });
});
```

#### Step 3A.3: usePresets の実装

```typescript
// src/hooks/usePresets.ts
import { useCallback, useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTournament } from '@/contexts/TournamentContext';
import { useNotification } from '@/contexts/NotificationContext';
import { isValidPreset, validatePresetName } from '@/utils/validation';
import { LIMITS } from '@/utils/constants';
import type { Preset, PresetId } from '@/types';

interface NewPresetData {
  name: string;
  blindLevels: Preset['blindLevels'];
  breakConfig?: Preset['breakConfig'];
  levelDuration?: number;
}

export function usePresets() {
  const { state, dispatch } = useSettings();
  const { dispatch: tournamentDispatch } = useTournament();
  const { showNotification } = useNotification();

  // プリセット分類
  const defaultPresets = useMemo(
    () => state.presets.filter((p) => p.type === 'default'),
    [state.presets]
  );

  const customPresets = useMemo(
    () => state.presets.filter((p) => p.type === 'custom'),
    [state.presets]
  );

  // プリセットをロード
  const loadPreset = useCallback(
    (presetId: PresetId) => {
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) {
        showNotification({
          type: 'error',
          message: 'プリセットが見つかりません',
        });
        return;
      }

      // SettingsContextで現在のプリセットを記録
      dispatch({ type: 'SET_CURRENT_PRESET', payload: { presetId } });

      // TournamentContextにプリセットをロード
      tournamentDispatch({ type: 'LOAD_PRESET', payload: { preset } });

      showNotification({
        type: 'success',
        message: `${preset.name} をロードしました`,
      });
    },
    [state.presets, dispatch, tournamentDispatch, showNotification]
  );

  // プリセットを追加
  const addPreset = useCallback(
    async (data: NewPresetData): Promise<Preset> => {
      // バリデーション
      const nameValidation = validatePresetName(data.name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error);
      }

      if (customPresets.length >= LIMITS.MAX_PRESETS) {
        throw new Error(`プリセットは最大${LIMITS.MAX_PRESETS}個までです`);
      }

      const newPreset: Preset = {
        id: `custom-${Date.now()}`,
        type: 'custom',
        name: data.name,
        blindLevels: data.blindLevels,
        breakConfig: data.breakConfig,
        levelDuration: data.levelDuration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_PRESET', payload: { preset: newPreset } });
      showNotification({
        type: 'success',
        message: `${data.name} を保存しました`,
      });

      return newPreset;
    },
    [customPresets.length, dispatch, showNotification]
  );

  // プリセットを更新
  const updatePreset = useCallback(
    async (
      presetId: PresetId,
      updates: Partial<NewPresetData>
    ): Promise<void> => {
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) {
        throw new Error('プリセットが見つかりません');
      }

      if (preset.type === 'default') {
        throw new Error('デフォルトプリセットは編集できません');
      }

      if (updates.name) {
        const nameValidation = validatePresetName(updates.name);
        if (!nameValidation.valid) {
          throw new Error(nameValidation.error);
        }
      }

      const updatedPreset: Preset = {
        ...preset,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_PRESET', payload: { preset: updatedPreset } });
      showNotification({ type: 'success', message: '保存しました' });
    },
    [state.presets, dispatch, showNotification]
  );

  // プリセットを削除
  const deletePreset = useCallback(
    async (presetId: PresetId): Promise<void> => {
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) {
        throw new Error('プリセットが見つかりません');
      }

      if (preset.type === 'default') {
        throw new Error('デフォルトプリセットは削除できません');
      }

      dispatch({ type: 'DELETE_PRESET', payload: { presetId } });
      showNotification({
        type: 'success',
        message: `${preset.name} を削除しました`,
      });
    },
    [state.presets, dispatch, showNotification]
  );

  // プリセットを複製
  const duplicatePreset = useCallback(
    async (presetId: PresetId): Promise<Preset> => {
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) {
        throw new Error('プリセットが見つかりません');
      }

      return addPreset({
        name: `${preset.name} (コピー)`,
        blindLevels: [...preset.blindLevels],
        breakConfig: preset.breakConfig ? { ...preset.breakConfig } : undefined,
        levelDuration: preset.levelDuration,
      });
    },
    [state.presets, addPreset]
  );

  // エクスポート
  const exportPreset = useCallback(
    (presetId: PresetId): string => {
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) {
        throw new Error('プリセットが見つかりません');
      }

      const exportData = {
        name: preset.name,
        blindLevels: preset.blindLevels,
        breakConfig: preset.breakConfig,
        levelDuration: preset.levelDuration,
      };

      return JSON.stringify(exportData, null, 2);
    },
    [state.presets]
  );

  const exportAllPresets = useCallback((): string => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      presets: customPresets.map((p) => ({
        name: p.name,
        blindLevels: p.blindLevels,
        breakConfig: p.breakConfig,
        levelDuration: p.levelDuration,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, [customPresets]);

  // インポート
  const importPreset = useCallback(
    async (jsonString: string): Promise<Preset> => {
      let data: unknown;
      try {
        data = JSON.parse(jsonString);
      } catch {
        throw new Error('JSONの形式が正しくありません');
      }

      if (!isValidPreset({ ...data, id: 'temp', type: 'custom' })) {
        throw new Error('プリセットのデータ形式が正しくありません');
      }

      const importData = data as NewPresetData;

      // 重複名のチェック
      let name = importData.name;
      let counter = 2;
      while (state.presets.some((p) => p.name === name)) {
        name = `${importData.name} (${counter})`;
        counter++;
      }

      return addPreset({
        ...importData,
        name,
      });
    },
    [state.presets, addPreset]
  );

  return {
    // 状態
    presets: state.presets,
    defaultPresets,
    customPresets,
    currentPresetId: state.currentPresetId,

    // アクション
    loadPreset,
    addPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    exportPreset,
    exportAllPresets,
    importPreset,
  };
}
```

---

### Phase 4: UIコンポーネント

**作業開始前の必須確認:**

Phase 1、Phase 2A、Phase 3Aの成果物を確認してから実装を開始してください。以下のファイルを必ず確認すること：

1. **Phase 1成果物の確認**
   - `src/types/domain.ts`: Preset, BlindLevel, BreakConfig, Settings, Theme等の型定義を確認
   - `src/utils/constants.ts`: LIMITS, DEFAULTS等の定数値を確認（MAX_BLIND_LEVELS, MIN_LEVEL_DURATION等）
   - `src/utils/validation.ts`: isValidBlindLevel, validatePresetName等のバリデーション関数を確認
   - `src/utils/blindFormat.ts`: formatBlindLevel, formatBlindValue等のフォーマット関数を確認
   - `src/utils/timeFormat.ts`: formatTime等の時間フォーマット関数を確認

2. **Phase 2A成果物の確認**
   - `src/contexts/SettingsContext.tsx`: useSettings フックの使用方法を確認
   - `src/contexts/TournamentContext.tsx`: useTournament フックの使用方法を確認
   - `src/contexts/NotificationContext.tsx`: useNotification フックの使用方法を確認

3. **Phase 3A成果物の確認**
   - `src/hooks/usePresets.ts`: usePresets フックのAPI（presets, loadPreset, addPreset, updatePreset, deletePreset, duplicatePreset, exportPreset, importPreset等）を確認
   - `src/hooks/usePresets.test.ts`: テストコードから使用例を確認

4. **完了報告書の確認**
   - `docs/reports/phase1-completion-report.md`: Phase 1で実装された全機能の動作確認
   - `docs/reports/phase2a-completion-report.md`: Phase 2Aで実装されたContextの動作確認
   - `docs/reports/phase3a-completion-report.md`: Phase 3Aで実装されたusePresetsの動作確認

**参照ドキュメント:**

- [03-design-system.md](../specs/03-design-system.md) - デザインシステム（**必読**）
- [features/presets.md](../specs/features/presets.md) - プリセットUI仕様
- [features/blinds.md](../specs/features/blinds.md) - ブラインド編集UI仕様

#### Step 4.1: PresetManager

```typescript
// src/components/PresetManager/PresetManager.test.tsx
describe('PresetManager', () => {
  const mockPresets = [
    { id: 'default-standard', name: 'Standard', type: 'default', blindLevels: [] },
    { id: 'custom-1', name: 'My Preset', type: 'custom', blindLevels: [] },
  ];

  it('should display preset list', () => {
    render(<PresetManager presets={mockPresets} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('My Preset')).toBeInTheDocument();
  });

  it('should highlight current preset', () => {
    render(<PresetManager presets={mockPresets} currentPresetId="custom-1" />);

    const customItem = screen.getByText('My Preset').closest('[data-testid="preset-item"]');
    expect(customItem).toHaveClass('selected');
  });

  it('should call onLoad when preset is clicked', async () => {
    const onLoad = vi.fn();
    render(<PresetManager presets={mockPresets} onLoad={onLoad} />);

    await userEvent.click(screen.getByText('My Preset'));
    expect(onLoad).toHaveBeenCalledWith('custom-1');
  });

  it('should show edit/delete buttons only for custom presets', () => {
    render(<PresetManager presets={mockPresets} />);

    const standardItem = screen.getByText('Standard').closest('[data-testid="preset-item"]');
    const customItem = screen.getByText('My Preset').closest('[data-testid="preset-item"]');

    expect(standardItem?.querySelector('[data-testid="edit-button"]')).not.toBeInTheDocument();
    expect(customItem?.querySelector('[data-testid="edit-button"]')).toBeInTheDocument();
  });

  it('should open create form when "New" button is clicked', async () => {
    render(<PresetManager presets={mockPresets} />);

    await userEvent.click(screen.getByRole('button', { name: /new|新規/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onDelete with confirmation', async () => {
    const onDelete = vi.fn();
    render(<PresetManager presets={mockPresets} onDelete={onDelete} />);

    const customItem = screen.getByText('My Preset').closest('[data-testid="preset-item"]');
    await userEvent.click(customItem?.querySelector('[data-testid="delete-button"]')!);

    // 確認ダイアログが表示される
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /delete|削除/i }));
    expect(onDelete).toHaveBeenCalledWith('custom-1');
  });
});
```

#### Step 4.2: BlindEditor

```typescript
// src/components/BlindEditor/BlindEditor.test.tsx
describe('BlindEditor', () => {
  const mockBlindLevels = [
    { smallBlind: 25, bigBlind: 50, ante: 0 },
    { smallBlind: 50, bigBlind: 100, ante: 0 },
    { smallBlind: 100, bigBlind: 200, ante: 25 },
  ];

  it('should display all blind levels', () => {
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={vi.fn()} />);

    expect(screen.getAllByTestId('blind-level-row')).toHaveLength(3);
  });

  it('should display level numbers', () => {
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={vi.fn()} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onChange when SB is edited', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    const sbInput = screen.getAllByTestId('sb-input')[0];
    await userEvent.clear(sbInput);
    await userEvent.type(sbInput, '30');

    expect(onChange).toHaveBeenCalledWith([
      { smallBlind: 30, bigBlind: 50, ante: 0 },
      ...mockBlindLevels.slice(1),
    ]);
  });

  it('should add new level when "Add" button is clicked', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /add|追加/i }));

    expect(onChange).toHaveBeenCalledWith([
      ...mockBlindLevels,
      expect.objectContaining({ smallBlind: expect.any(Number) }),
    ]);
  });

  it('should auto-calculate next level based on previous', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /add|追加/i }));

    const newLevel = onChange.mock.calls[0][0][3];
    // 前のレベル(100/200)の約1.5〜2倍
    expect(newLevel.smallBlind).toBeGreaterThanOrEqual(150);
    expect(newLevel.bigBlind).toBeGreaterThanOrEqual(300);
  });

  it('should remove level when delete is clicked', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    const deleteButtons = screen.getAllByTestId('delete-level-button');
    await userEvent.click(deleteButtons[1]); // 2番目を削除

    expect(onChange).toHaveBeenCalledWith([
      mockBlindLevels[0],
      mockBlindLevels[2],
    ]);
  });

  it('should not allow deleting if only one level remains', () => {
    render(<BlindEditor blindLevels={[mockBlindLevels[0]]} onChange={vi.fn()} />);

    expect(screen.queryByTestId('delete-level-button')).toBeDisabled();
  });

  it('should allow reordering levels', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    // ドラッグ&ドロップのテスト（実装方法による）
    // ...
  });

  it('should validate blind values', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    const sbInput = screen.getAllByTestId('sb-input')[0];
    await userEvent.clear(sbInput);
    await userEvent.type(sbInput, '-10');

    expect(screen.getByText(/正の数/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

#### Step 4.3: BreakSettings

```typescript
// src/components/BreakSettings/BreakSettings.test.tsx
describe('BreakSettings', () => {
  const mockBreakConfig = {
    enabled: true,
    frequency: 4,
    duration: 600,
  };

  it('should display break toggle', () => {
    render(<BreakSettings config={mockBreakConfig} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: /break|休憩/i })).toBeChecked();
  });

  it('should toggle break enabled', async () => {
    const onChange = vi.fn();
    render(<BreakSettings config={mockBreakConfig} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /break|休憩/i }));

    expect(onChange).toHaveBeenCalledWith({ ...mockBreakConfig, enabled: false });
  });

  it('should disable frequency/duration inputs when disabled', () => {
    render(<BreakSettings config={{ ...mockBreakConfig, enabled: false }} onChange={vi.fn()} />);

    expect(screen.getByTestId('frequency-input')).toBeDisabled();
    expect(screen.getByTestId('duration-input')).toBeDisabled();
  });

  it('should update frequency', async () => {
    const onChange = vi.fn();
    render(<BreakSettings config={mockBreakConfig} onChange={onChange} />);

    const frequencyInput = screen.getByTestId('frequency-input');
    await userEvent.clear(frequencyInput);
    await userEvent.type(frequencyInput, '6');

    expect(onChange).toHaveBeenCalledWith({ ...mockBreakConfig, frequency: 6 });
  });

  it('should update duration', async () => {
    const onChange = vi.fn();
    render(<BreakSettings config={mockBreakConfig} onChange={onChange} />);

    const durationInput = screen.getByTestId('duration-input');
    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, '15'); // 15分

    expect(onChange).toHaveBeenCalledWith({ ...mockBreakConfig, duration: 900 });
  });

  it('should validate frequency range', async () => {
    render(<BreakSettings config={mockBreakConfig} onChange={vi.fn()} />);

    const frequencyInput = screen.getByTestId('frequency-input');
    await userEvent.clear(frequencyInput);
    await userEvent.type(frequencyInput, '0');

    expect(screen.getByText(/1以上/i)).toBeInTheDocument();
  });
});
```

#### Step 4.4: AudioSettings

```typescript
// src/components/AudioSettings/AudioSettings.test.tsx
describe('AudioSettings', () => {
  const mockSettings = {
    soundEnabled: true,
    volume: 0.7,
  };

  it('should display sound toggle', () => {
    render(<AudioSettings settings={mockSettings} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: /sound|音声/i })).toBeChecked();
  });

  it('should display volume slider', () => {
    render(<AudioSettings settings={mockSettings} onChange={vi.fn()} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('70'); // 0.7 * 100
  });

  it('should toggle sound', async () => {
    const onChange = vi.fn();
    render(<AudioSettings settings={mockSettings} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /sound|音声/i }));

    expect(onChange).toHaveBeenCalledWith({ ...mockSettings, soundEnabled: false });
  });

  it('should change volume', async () => {
    const onChange = vi.fn();
    render(<AudioSettings settings={mockSettings} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(onChange).toHaveBeenCalledWith({ ...mockSettings, volume: 0.5 });
  });

  it('should disable volume slider when sound is off', () => {
    render(<AudioSettings settings={{ ...mockSettings, soundEnabled: false }} onChange={vi.fn()} />);

    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('should show test sound button', () => {
    render(<AudioSettings settings={mockSettings} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /test|テスト/i })).toBeInTheDocument();
  });
});
```

#### Step 4.5: ThemeToggle

```typescript
// src/components/ThemeToggle/ThemeToggle.test.tsx
describe('ThemeToggle', () => {
  it('should display current theme', () => {
    render(<ThemeToggle theme="dark" onChange={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveTextContent(/dark|ダーク/i);
  });

  it('should toggle theme on click', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle theme="dark" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('should toggle from light to dark', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle theme="light" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
```

#### Step 4.6: ImportExport

```typescript
// src/components/ImportExport/ImportExport.test.tsx
describe('ImportExport', () => {
  it('should have export button', () => {
    render(<ImportExport onExport={vi.fn()} onImport={vi.fn()} />);

    expect(screen.getByRole('button', { name: /export|エクスポート/i })).toBeInTheDocument();
  });

  it('should have import button', () => {
    render(<ImportExport onExport={vi.fn()} onImport={vi.fn()} />);

    expect(screen.getByRole('button', { name: /import|インポート/i })).toBeInTheDocument();
  });

  it('should call onExport when export is clicked', async () => {
    const onExport = vi.fn();
    render(<ImportExport onExport={onExport} onImport={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /export|エクスポート/i }));

    expect(onExport).toHaveBeenCalled();
  });

  it('should open file picker when import is clicked', async () => {
    render(<ImportExport onExport={vi.fn()} onImport={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /import|インポート/i }));

    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should call onImport with file content', async () => {
    const onImport = vi.fn();
    render(<ImportExport onExport={vi.fn()} onImport={onImport} />);

    const fileContent = JSON.stringify({ name: 'Test', blindLevels: [] });
    const file = new File([fileContent], 'test.json', { type: 'application/json' });

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);

    expect(onImport).toHaveBeenCalledWith(fileContent);
  });

  it('should show error for invalid file type', async () => {
    render(<ImportExport onExport={vi.fn()} onImport={vi.fn()} />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);

    expect(screen.getByText(/json/i)).toBeInTheDocument();
  });
});
```

---

## 完了条件

### Phase 3A 完了条件

- [ ] usePresets フックが実装され、全テストがパス
- [ ] loadPreset が TournamentContext と正しく連携
- [ ] CRUD操作（add, update, delete, duplicate）が動作
- [ ] インポート/エクスポートが動作
- [ ] バリデーションが適切に機能
- [ ] エラー時にNotificationContextで通知

### Phase 4 完了条件

- [ ] PresetManager が実装され、テストがパス
- [ ] BlindEditor が実装され、テストがパス
- [ ] BreakSettings が実装され、テストがパス
- [ ] AudioSettings が実装され、テストがパス
- [ ] ThemeToggle が実装され、テストがパス
- [ ] ImportExport が実装され、テストがパス
- [ ] SettingsPanel で全設定コンポーネントが統合されている

---

## 参照ドキュメント一覧

| ドキュメント                                                        | 必須度   | 内容                     |
| ------------------------------------------------------------------- | -------- | ------------------------ |
| [features/presets.md](../specs/features/presets.md)                 | **必読** | プリセット機能の詳細仕様 |
| [features/blinds.md](../specs/features/blinds.md)                   | **必読** | ブラインド編集仕様       |
| [04-interface-definitions.md](../specs/04-interface-definitions.md) | **必読** | LOAD_PRESET フロー       |
| [03-design-system.md](../specs/03-design-system.md)                 | **必読** | UI設計、フォーム設計     |
| [features/storage.md](../specs/features/storage.md)                 | 参照     | ストレージ仕様           |
| [02-data-models.md](../specs/02-data-models.md)                     | 参照     | 型定義詳細               |

---

## 改訂履歴

| バージョン | 日付       | 変更内容                                            | 作成者               |
| ---------- | ---------- | --------------------------------------------------- | -------------------- |
| 1.1        | 2026-01-26 | Phase 3A, Phase 4に前フェーズ成果物確認タスクを追加 | システムアーキテクト |
| 1.0        | 2026-01-26 | 初版作成                                            | システムアーキテクト |
