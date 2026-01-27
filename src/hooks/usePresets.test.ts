import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresets } from './usePresets';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TournamentProvider } from '@/contexts/TournamentContext';
import type { Preset } from '@/types';
import React from 'react';

// Test wrapper with both providers
const createWrapper =
  () =>
  ({ children }: { children: React.ReactNode }) => {
    return React.createElement(SettingsProvider, {
      children: React.createElement(TournamentProvider, { children }),
    });
  };

describe('usePresets', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    globalThis.localStorage.clear();
  });

  describe('getPresets', () => {
    it('should return all presets including defaults', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const presets = result.current.getPresets();
      expect(presets.length).toBeGreaterThan(0);

      // Should include default presets
      const hasDefaultPreset = presets.some((p) => p.id.startsWith('default-'));
      expect(hasDefaultPreset).toBe(true);
    });
  });

  describe('getPreset', () => {
    it('should return preset by id', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const presets = result.current.getPresets();
      const firstPreset = presets[0];

      const preset = result.current.getPreset(firstPreset.id);
      expect(preset).toEqual(firstPreset);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const preset = result.current.getPreset('non-existent-id');
      expect(preset).toBeUndefined();
    });
  });

  describe('addPreset', () => {
    it('should add a new custom preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const newPreset = {
        name: 'Test Preset',
        blindLevels: [
          { smallBlind: 25, bigBlind: 50, ante: 0 },
          { smallBlind: 50, bigBlind: 100, ante: 0 },
        ],
        breakConfig: { enabled: true, frequency: 4, duration: 600 },
        levelDuration: 900,
      };

      let addedPreset: Preset | undefined;

      act(() => {
        addedPreset = result.current.addPreset(newPreset);
      });

      expect(addedPreset).toBeDefined();
      expect(addedPreset?.name).toBe('Test Preset');
      expect(addedPreset?.type).toBe('custom');
      expect(addedPreset?.id).toBeDefined();
      expect(addedPreset?.createdAt).toBeDefined();
      expect(addedPreset?.updatedAt).toBeDefined();

      // Verify it's in the list
      const presets = result.current.getPresets();
      expect(presets.find((p) => p.id === addedPreset?.id)).toBeDefined();
    });
  });

  describe('updatePreset', () => {
    it('should update an existing preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      // Add a preset first
      let addedPreset: Preset | undefined;
      act(() => {
        addedPreset = result.current.addPreset({
          name: 'Original Name',
          blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
          levelDuration: 600,
        });
      });

      expect(addedPreset).toBeDefined();

      // Update the preset
      act(() => {
        result.current.updatePreset(addedPreset!.id, {
          name: 'Updated Name',
        });
      });

      const updatedPreset = result.current.getPreset(addedPreset!.id);
      expect(updatedPreset?.name).toBe('Updated Name');
      expect(updatedPreset?.updatedAt).toBeGreaterThan(addedPreset!.updatedAt);
    });

    it('should throw error when updating non-existent preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.updatePreset('non-existent-id', { name: 'Test' });
        });
      }).toThrow('Preset not found');
    });

    it('should throw error when updating default preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const presets = result.current.getPresets();
      const defaultPreset = presets.find((p) => p.id.startsWith('default-'));

      expect(defaultPreset).toBeDefined();

      expect(() => {
        act(() => {
          result.current.updatePreset(defaultPreset!.id, { name: 'Test' });
        });
      }).toThrow('Default presets cannot be modified');
    });
  });

  describe('deletePreset', () => {
    it('should delete a custom preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      // Add a preset first
      let addedPreset: Preset | undefined;
      act(() => {
        addedPreset = result.current.addPreset({
          name: 'To Delete',
          blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
          levelDuration: 600,
        });
      });

      expect(addedPreset).toBeDefined();

      // Delete the preset
      act(() => {
        result.current.deletePreset(addedPreset!.id);
      });

      const deletedPreset = result.current.getPreset(addedPreset!.id);
      expect(deletedPreset).toBeUndefined();
    });

    it('should throw error when deleting default preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const presets = result.current.getPresets();
      const defaultPreset = presets.find((p) => p.id.startsWith('default-'));

      expect(defaultPreset).toBeDefined();

      expect(() => {
        act(() => {
          result.current.deletePreset(defaultPreset!.id);
        });
      }).toThrow('Default presets cannot be deleted');
    });
  });

  describe('loadPreset', () => {
    it('should load preset into tournament context', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      const presets = result.current.getPresets();
      const presetToLoad = presets[0];

      act(() => {
        result.current.loadPreset(presetToLoad.id);
      });

      // Verify the preset was loaded
      // Note: We can't directly verify TournamentContext state here
      // This would require a separate test with both hooks
    });

    it('should throw error when loading non-existent preset', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.loadPreset('non-existent-id');
        });
      }).toThrow('Preset not found');
    });
  });

  describe('currentPresetId', () => {
    it('should track current preset id', () => {
      const { result } = renderHook(() => usePresets(), {
        wrapper: createWrapper(),
      });

      // Should have a default preset selected initially
      expect(result.current.currentPresetId).toBeDefined();
    });
  });
});
