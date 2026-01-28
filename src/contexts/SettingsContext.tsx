import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  SettingsState,
  SettingsAction,
  SettingsContextValue,
} from '@/types';
import { StorageService } from '@/services/StorageService';
import { mergeWithDefaultPresets } from '@/domain/models/Preset';
import { DEFAULTS } from '@/utils';

// Reducer
export function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'SET_THEME': {
      return {
        ...state,
        settings: {
          ...state.settings,
          theme: action.payload.theme,
        },
      };
    }

    case 'SET_SOUND_ENABLED': {
      return {
        ...state,
        settings: {
          ...state.settings,
          soundEnabled: action.payload.enabled,
        },
      };
    }

    case 'SET_VOLUME': {
      // Clamp volume between 0 and 1
      const volume = Math.max(0, Math.min(1, action.payload.volume));
      return {
        ...state,
        settings: {
          ...state.settings,
          volume,
        },
      };
    }

    case 'SET_KEYBOARD_SHORTCUTS_ENABLED': {
      return {
        ...state,
        settings: {
          ...state.settings,
          keyboardShortcutsEnabled: action.payload.enabled,
        },
      };
    }

    case 'ADD_PRESET': {
      return {
        ...state,
        presets: [...state.presets, action.payload.preset],
      };
    }

    case 'UPDATE_PRESET': {
      const { preset } = action.payload;
      const index = state.presets.findIndex((p) => p.id === preset.id);
      if (index === -1) {
        // Preset not found, return state unchanged
        return state;
      }

      const newPresets = [...state.presets];
      newPresets[index] = preset;

      return {
        ...state,
        presets: newPresets,
      };
    }

    case 'DELETE_PRESET': {
      const { presetId } = action.payload;
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== presetId),
      };
    }

    case 'SET_PRESETS': {
      return {
        ...state,
        presets: action.payload.presets,
      };
    }

    case 'SET_CURRENT_PRESET': {
      return {
        ...state,
        currentPresetId: action.payload.presetId,
      };
    }

    default:
      return state;
  }
}

// Context
const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

// Provider Props
interface SettingsProviderProps {
  children: React.ReactNode;
}

// Provider
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, null, () => {
    // Lazy initialization
    const savedSettings = StorageService.loadSettings();
    const savedPresets = StorageService.loadPresets();

    // Merge with default presets
    const presets = mergeWithDefaultPresets(savedPresets ?? []);

    // Find first default preset for current preset id
    const defaultPreset = presets.find((p) => p.type === 'default');

    return {
      settings: savedSettings ?? {
        theme: 'dark',
        soundEnabled: true,
        volume: DEFAULTS.VOLUME,
        keyboardShortcutsEnabled: true,
      },
      presets,
      currentPresetId: defaultPreset?.id ?? null,
    };
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Persist settings to localStorage
  useEffect(() => {
    StorageService.saveSettings(state.settings);
  }, [state.settings]);

  // Persist presets to localStorage
  useEffect(() => {
    // Only save custom presets (filter out default presets)
    const customPresets = state.presets.filter((p) => p.type === 'custom');
    StorageService.savePresets(customPresets);
  }, [state.presets]);

  const contextValue: SettingsContextValue = {
    state,
    dispatch,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
