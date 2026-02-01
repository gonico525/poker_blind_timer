import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useStructures } from './useStructures';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TournamentProvider } from '@/contexts/TournamentContext';
import type { Structure } from '@/types';
import React from 'react';

// Test wrapper with both providers
const createWrapper =
  () =>
  ({ children }: { children: React.ReactNode }) => {
    return React.createElement(SettingsProvider, {
      children: React.createElement(TournamentProvider, { children }),
    });
  };

describe('useStructures', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    globalThis.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Ensure cleanup after each test
    cleanup();
    globalThis.localStorage.clear();
  });

  describe('getStructures', () => {
    it('should return all structures including defaults', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structures = result.current.getStructures();
      expect(structures.length).toBeGreaterThan(0);

      // Should include default structures
      const hasDefaultStructure = structures.some((s) =>
        s.id.startsWith('default-')
      );
      expect(hasDefaultStructure).toBe(true);
    });
  });

  describe('getStructure', () => {
    it('should return structure by id', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structures = result.current.getStructures();
      const firstStructure = structures[0];

      const structure = result.current.getStructure(firstStructure.id);
      expect(structure).toEqual(firstStructure);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structure = result.current.getStructure('non-existent-id');
      expect(structure).toBeUndefined();
    });
  });

  describe('addStructure', () => {
    it('should add a new custom structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const newStructure = {
        name: 'Test Structure',
        blindLevels: [
          { smallBlind: 25, bigBlind: 50, ante: 0 },
          { smallBlind: 50, bigBlind: 100, ante: 0 },
        ],
        breakConfig: { enabled: true, frequency: 4, duration: 600 },
        levelDuration: 900,
      };

      let addedStructure: Structure | undefined;

      act(() => {
        addedStructure = result.current.addStructure(newStructure);
      });

      expect(addedStructure).toBeDefined();
      expect(addedStructure?.name).toBe('Test Structure');
      expect(addedStructure?.type).toBe('custom');
      expect(addedStructure?.id).toBeDefined();
      expect(addedStructure?.createdAt).toBeDefined();
      expect(addedStructure?.updatedAt).toBeDefined();

      // Verify it's in the list
      const structures = result.current.getStructures();
      expect(structures.find((s) => s.id === addedStructure?.id)).toBeDefined();
    });
  });

  describe('updateStructure', () => {
    it('should update an existing structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      // Add a structure first
      let addedStructure: Structure | undefined;
      act(() => {
        addedStructure = result.current.addStructure({
          name: 'Original Name',
          blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
          levelDuration: 600,
        });
      });

      expect(addedStructure).toBeDefined();

      // Update the structure
      act(() => {
        result.current.updateStructure(addedStructure!.id, {
          name: 'Updated Name',
        });
      });

      const updatedStructure = result.current.getStructure(addedStructure!.id);
      expect(updatedStructure?.name).toBe('Updated Name');
      // 同一ミリ秒内で実行される可能性があるため、toBeGreaterThanOrEqualを使用
      expect(updatedStructure?.updatedAt).toBeGreaterThanOrEqual(
        addedStructure!.updatedAt
      );
    });

    it('should throw error when updating non-existent structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.updateStructure('non-existent-id', { name: 'Test' });
        });
      }).toThrow('Structure not found');
    });

    it('should throw error when updating default structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structures = result.current.getStructures();
      const defaultStructure = structures.find((s) =>
        s.id.startsWith('default-')
      );

      expect(defaultStructure).toBeDefined();

      expect(() => {
        act(() => {
          result.current.updateStructure(defaultStructure!.id, {
            name: 'Test',
          });
        });
      }).toThrow('Default structures cannot be modified');
    });
  });

  describe('deleteStructure', () => {
    it('should delete a custom structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      // Add a structure first
      let addedStructure: Structure | undefined;
      act(() => {
        addedStructure = result.current.addStructure({
          name: 'To Delete',
          blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
          levelDuration: 600,
        });
      });

      expect(addedStructure).toBeDefined();

      // Delete the structure
      act(() => {
        result.current.deleteStructure(addedStructure!.id);
      });

      const deletedStructure = result.current.getStructure(addedStructure!.id);
      expect(deletedStructure).toBeUndefined();
    });

    it('should throw error when deleting default structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structures = result.current.getStructures();
      const defaultStructure = structures.find((s) =>
        s.id.startsWith('default-')
      );

      expect(defaultStructure).toBeDefined();

      expect(() => {
        act(() => {
          result.current.deleteStructure(defaultStructure!.id);
        });
      }).toThrow('Default structures cannot be deleted');
    });
  });

  describe('loadStructure', () => {
    it('should load structure into tournament context', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      const structures = result.current.getStructures();
      const structureToLoad = structures[0];

      act(() => {
        result.current.loadStructure(structureToLoad.id);
      });

      // Verify the structure was loaded
      // Note: We can't directly verify TournamentContext state here
      // This would require a separate test with both hooks
    });

    it('should throw error when loading non-existent structure', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.loadStructure('non-existent-id');
        });
      }).toThrow('Structure not found');
    });
  });

  describe('currentStructureId', () => {
    it('should track current structure id', () => {
      const { result } = renderHook(() => useStructures(), {
        wrapper: createWrapper(),
      });

      // Should have a default structure selected initially
      expect(result.current.currentStructureId).toBeDefined();
    });
  });
});
