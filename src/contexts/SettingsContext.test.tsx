import { describe, it, expect } from 'vitest';
import type { SettingsState } from '@/types';
import { settingsReducer } from './SettingsContext';

describe('settingsReducer', () => {
  const initialState: SettingsState = {
    settings: {
      theme: 'dark',
      soundEnabled: true,
      volume: 0.7,
      keyboardShortcutsEnabled: true,
    },
    structures: [],
    currentStructureId: null,
  };

  describe('SET_THEME action', () => {
    it('should change theme to light', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_THEME',
        payload: { theme: 'light' },
      });
      expect(state.settings.theme).toBe('light');
    });

    it('should change theme to dark', () => {
      const lightState = {
        ...initialState,
        settings: { ...initialState.settings, theme: 'light' as const },
      };
      const state = settingsReducer(lightState, {
        type: 'SET_THEME',
        payload: { theme: 'dark' },
      });
      expect(state.settings.theme).toBe('dark');
    });
  });

  describe('SET_SOUND_ENABLED action', () => {
    it('should enable sound', () => {
      const disabledState = {
        ...initialState,
        settings: { ...initialState.settings, soundEnabled: false },
      };
      const state = settingsReducer(disabledState, {
        type: 'SET_SOUND_ENABLED',
        payload: { enabled: true },
      });
      expect(state.settings.soundEnabled).toBe(true);
    });

    it('should disable sound', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_SOUND_ENABLED',
        payload: { enabled: false },
      });
      expect(state.settings.soundEnabled).toBe(false);
    });
  });

  describe('SET_VOLUME action', () => {
    it('should set volume to 0.5', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: 0.5 },
      });
      expect(state.settings.volume).toBe(0.5);
    });

    it('should clamp volume to maximum 1', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: 1.5 },
      });
      expect(state.settings.volume).toBe(1);
    });

    it('should clamp volume to minimum 0', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: -0.5 },
      });
      expect(state.settings.volume).toBe(0);
    });
  });

  describe('SET_KEYBOARD_SHORTCUTS_ENABLED action', () => {
    it('should enable keyboard shortcuts', () => {
      const disabledState = {
        ...initialState,
        settings: { ...initialState.settings, keyboardShortcutsEnabled: false },
      };
      const state = settingsReducer(disabledState, {
        type: 'SET_KEYBOARD_SHORTCUTS_ENABLED',
        payload: { enabled: true },
      });
      expect(state.settings.keyboardShortcutsEnabled).toBe(true);
    });

    it('should disable keyboard shortcuts', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_KEYBOARD_SHORTCUTS_ENABLED',
        payload: { enabled: false },
      });
      expect(state.settings.keyboardShortcutsEnabled).toBe(false);
    });
  });

  describe('Structure actions', () => {
    const testStructure = {
      id: 'test-1',
      name: 'Test Structure',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should add structure', () => {
      const state = settingsReducer(initialState, {
        type: 'ADD_STRUCTURE',
        payload: { structure: testStructure },
      });
      expect(state.structures).toContainEqual(testStructure);
      expect(state.structures.length).toBe(1);
    });

    it('should update structure', () => {
      const stateWithStructure: SettingsState = {
        ...initialState,
        structures: [testStructure],
      };
      const updatedStructure = {
        ...testStructure,
        name: 'Updated Structure',
      };
      const state = settingsReducer(stateWithStructure, {
        type: 'UPDATE_STRUCTURE',
        payload: { structure: updatedStructure },
      });
      expect(state.structures[0].name).toBe('Updated Structure');
      expect(state.structures.length).toBe(1);
    });

    it('should not update structure if id not found', () => {
      const stateWithStructure: SettingsState = {
        ...initialState,
        structures: [testStructure],
      };
      const unknownStructure = {
        ...testStructure,
        id: 'unknown-id',
        name: 'Unknown',
      };
      const state = settingsReducer(stateWithStructure, {
        type: 'UPDATE_STRUCTURE',
        payload: { structure: unknownStructure },
      });
      expect(state.structures[0].name).toBe('Test Structure');
    });

    it('should delete structure', () => {
      const stateWithStructure: SettingsState = {
        ...initialState,
        structures: [testStructure],
      };
      const state = settingsReducer(stateWithStructure, {
        type: 'DELETE_STRUCTURE',
        payload: { structureId: 'test-1' },
      });
      expect(state.structures).toHaveLength(0);
    });

    it('should not delete structure if id not found', () => {
      const stateWithStructure: SettingsState = {
        ...initialState,
        structures: [testStructure],
      };
      const state = settingsReducer(stateWithStructure, {
        type: 'DELETE_STRUCTURE',
        payload: { structureId: 'unknown-id' },
      });
      expect(state.structures).toHaveLength(1);
    });

    it('should set structures', () => {
      const structures = [
        testStructure,
        { ...testStructure, id: 'test-2', name: 'Test Structure 2' },
      ];
      const state = settingsReducer(initialState, {
        type: 'SET_STRUCTURES',
        payload: { structures },
      });
      expect(state.structures).toEqual(structures);
      expect(state.structures.length).toBe(2);
    });

    it('should set current structure id', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_CURRENT_STRUCTURE',
        payload: { structureId: 'test-1' },
      });
      expect(state.currentStructureId).toBe('test-1');
    });

    it('should set current structure id to null', () => {
      const stateWithCurrent: SettingsState = {
        ...initialState,
        currentStructureId: 'test-1',
      };
      const state = settingsReducer(stateWithCurrent, {
        type: 'SET_CURRENT_STRUCTURE',
        payload: { structureId: null },
      });
      expect(state.currentStructureId).toBeNull();
    });
  });
});
