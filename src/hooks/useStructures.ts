import { useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTournament } from '@/contexts/TournamentContext';
import type { Structure, StructureId } from '@/types';
import {
  generateStructureId,
  isDefaultStructure,
} from '@/domain/models/Structure';

/**
 * ストラクチャー管理フック
 * ストラクチャーのCRUD操作とトーナメントへの適用を提供
 */
export function useStructures() {
  const { state, dispatch } = useSettings();
  const { dispatch: tournamentDispatch } = useTournament();
  const { structures, currentStructureId } = state;

  // ストラクチャー一覧取得
  const getStructures = useCallback((): Structure[] => {
    return structures;
  }, [structures]);

  // ストラクチャー取得（ID指定）
  const getStructure = useCallback(
    (id: StructureId): Structure | undefined => {
      return structures.find((s) => s.id === id);
    },
    [structures]
  );

  // ストラクチャー追加
  const addStructure = useCallback(
    (
      structure: Omit<Structure, 'id' | 'type' | 'createdAt' | 'updatedAt'>
    ): Structure => {
      const now = Date.now();
      const newStructure: Structure = {
        ...structure,
        id: generateStructureId(),
        type: 'custom',
        createdAt: now,
        updatedAt: now,
      };

      dispatch({ type: 'ADD_STRUCTURE', payload: { structure: newStructure } });
      return newStructure;
    },
    [dispatch]
  );

  // ストラクチャー更新
  const updateStructure = useCallback(
    (id: StructureId, updates: Partial<Structure>) => {
      const existing = structures.find((s) => s.id === id);
      if (!existing) {
        throw new Error(`Structure not found: ${id}`);
      }

      // デフォルトストラクチャーは編集不可
      if (isDefaultStructure(id)) {
        throw new Error('Default structures cannot be modified');
      }

      const updatedStructure: Structure = {
        ...existing,
        ...updates,
        id, // IDは変更不可
        type: existing.type, // typeも変更不可
        createdAt: existing.createdAt, // createdAtも変更不可
        updatedAt: Date.now(),
      };

      dispatch({
        type: 'UPDATE_STRUCTURE',
        payload: { structure: updatedStructure },
      });
    },
    [structures, dispatch]
  );

  // ストラクチャー削除
  const deleteStructure = useCallback(
    (id: StructureId) => {
      // デフォルトストラクチャーは削除不可
      if (isDefaultStructure(id)) {
        throw new Error('Default structures cannot be deleted');
      }

      dispatch({ type: 'DELETE_STRUCTURE', payload: { structureId: id } });
    },
    [dispatch]
  );

  // ストラクチャー読み込み（トーナメントに適用）
  const loadStructure = useCallback(
    (id: StructureId) => {
      const structure = getStructure(id);
      if (!structure) {
        throw new Error(`Structure not found: ${id}`);
      }

      // SettingsContextで現在のストラクチャーを記録
      dispatch({ type: 'SET_CURRENT_STRUCTURE', payload: { structureId: id } });

      // TournamentContextに通知
      tournamentDispatch({ type: 'LOAD_STRUCTURE', payload: { structure } });
    },
    [getStructure, dispatch, tournamentDispatch]
  );

  return {
    // 状態
    structures,
    currentStructureId,

    // メソッド
    getStructures,
    getStructure,
    addStructure,
    updateStructure,
    deleteStructure,
    loadStructure,
  };
}
