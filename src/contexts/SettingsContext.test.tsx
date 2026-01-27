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
    presets: [],
    currentPresetId: null,
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

  describe('Preset actions', () => {
    const testPreset = {
      id: 'test-1',
      name: 'Test Preset',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should add preset', () => {
      const state = settingsReducer(initialState, {
        type: 'ADD_PRESET',
        payload: { preset: testPreset },
      });
      expect(state.presets).toContainEqual(testPreset);
      expect(state.presets.length).toBe(1);
    });

    it('should update preset', () => {
      const stateWithPreset: SettingsState = {
        ...initialState,
        presets: [testPreset],
      };
      const updatedPreset = {
        ...testPreset,
        name: 'Updated Preset',
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'UPDATE_PRESET',
        payload: { preset: updatedPreset },
      });
      expect(state.presets[0].name).toBe('Updated Preset');
      expect(state.presets.length).toBe(1);
    });

    it('should not update preset if id not found', () => {
      const stateWithPreset: SettingsState = {
        ...initialState,
        presets: [testPreset],
      };
      const unknownPreset = {
        ...testPreset,
        id: 'unknown-id',
        name: 'Unknown',
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'UPDATE_PRESET',
        payload: { preset: unknownPreset },
      });
      expect(state.presets[0].name).toBe('Test Preset');
    });

    it('should delete preset', () => {
      const stateWithPreset: SettingsState = {
        ...initialState,
        presets: [testPreset],
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'DELETE_PRESET',
        payload: { presetId: 'test-1' },
      });
      expect(state.presets).toHaveLength(0);
    });

    it('should not delete preset if id not found', () => {
      const stateWithPreset: SettingsState = {
        ...initialState,
        presets: [testPreset],
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'DELETE_PRESET',
        payload: { presetId: 'unknown-id' },
      });
      expect(state.presets).toHaveLength(1);
    });

    it('should set presets', () => {
      const presets = [
        testPreset,
        { ...testPreset, id: 'test-2', name: 'Test Preset 2' },
      ];
      const state = settingsReducer(initialState, {
        type: 'SET_PRESETS',
        payload: { presets },
      });
      expect(state.presets).toEqual(presets);
      expect(state.presets.length).toBe(2);
    });

    it('should set current preset id', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_CURRENT_PRESET',
        payload: { presetId: 'test-1' },
      });
      expect(state.currentPresetId).toBe('test-1');
    });

    it('should set current preset id to null', () => {
      const stateWithCurrent: SettingsState = {
        ...initialState,
        currentPresetId: 'test-1',
      };
      const state = settingsReducer(stateWithCurrent, {
        type: 'SET_CURRENT_PRESET',
        payload: { presetId: null },
      });
      expect(state.currentPresetId).toBeNull();
    });
  });
});
