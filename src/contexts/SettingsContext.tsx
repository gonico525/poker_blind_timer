/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  SettingsState,
  SettingsAction,
  SettingsContextValue,
} from '@/types';
import { StorageService } from '@/services/StorageService';
import { mergeWithDefaultStructures } from '@/domain/models/Structure';
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

    case 'ADD_STRUCTURE': {
      return {
        ...state,
        structures: [...state.structures, action.payload.structure],
      };
    }

    case 'UPDATE_STRUCTURE': {
      const { structure } = action.payload;
      const index = state.structures.findIndex((s) => s.id === structure.id);
      if (index === -1) {
        // Structure not found, return state unchanged
        return state;
      }

      const newStructures = [...state.structures];
      newStructures[index] = structure;

      return {
        ...state,
        structures: newStructures,
      };
    }

    case 'DELETE_STRUCTURE': {
      const { structureId } = action.payload;
      return {
        ...state,
        structures: state.structures.filter((s) => s.id !== structureId),
      };
    }

    case 'SET_STRUCTURES': {
      return {
        ...state,
        structures: action.payload.structures,
      };
    }

    case 'SET_CURRENT_STRUCTURE': {
      return {
        ...state,
        currentStructureId: action.payload.structureId,
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
    const savedStructures = StorageService.loadStructures();

    // Merge with default structures
    const structures = mergeWithDefaultStructures(savedStructures ?? []);

    // Find first default structure for current structure id
    const defaultStructure = structures.find((s) => s.type === 'default');

    return {
      settings: savedSettings ?? {
        theme: 'dark',
        soundEnabled: true,
        volume: DEFAULTS.VOLUME,
        keyboardShortcutsEnabled: true,
      },
      structures,
      currentStructureId: defaultStructure?.id ?? null,
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

  // Persist structures to localStorage
  useEffect(() => {
    // Only save custom structures (filter out default structures)
    const customStructures = state.structures.filter(
      (s) => s.type === 'custom'
    );
    StorageService.saveStructures(customStructures);
  }, [state.structures]);

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
