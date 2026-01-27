import { useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTournament } from '@/contexts/TournamentContext';
import type { Preset, PresetId } from '@/types';
import { generatePresetId, isDefaultPreset } from '@/domain/models/Preset';

/**
 * プリセット管理フック
 * プリセットのCRUD操作とトーナメントへの適用を提供
 */
export function usePresets() {
  const { state, dispatch } = useSettings();
  const { dispatch: tournamentDispatch } = useTournament();
  const { presets, currentPresetId } = state;

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
    (
      preset: Omit<Preset, 'id' | 'type' | 'createdAt' | 'updatedAt'>
    ): Preset => {
      const now = Date.now();
      const newPreset: Preset = {
        ...preset,
        id: generatePresetId(),
        type: 'custom',
        createdAt: now,
        updatedAt: now,
      };

      dispatch({ type: 'ADD_PRESET', payload: { preset: newPreset } });
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
        type: existing.type, // typeも変更不可
        createdAt: existing.createdAt, // createdAtも変更不可
        updatedAt: Date.now(),
      };

      dispatch({ type: 'UPDATE_PRESET', payload: { preset: updatedPreset } });
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

      dispatch({ type: 'DELETE_PRESET', payload: { presetId: id } });
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

      // SettingsContextで現在のプリセットを記録
      dispatch({ type: 'SET_CURRENT_PRESET', payload: { presetId: id } });

      // TournamentContextに通知
      tournamentDispatch({ type: 'LOAD_PRESET', payload: { preset } });
    },
    [getPreset, dispatch, tournamentDispatch]
  );

  return {
    // 状態
    presets,
    currentPresetId,

    // メソッド
    getPresets,
    getPreset,
    addPreset,
    updatePreset,
    deletePreset,
    loadPreset,
  };
}
