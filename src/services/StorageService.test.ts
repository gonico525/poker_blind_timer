import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './StorageService';
import type { Settings, Preset, TournamentState } from '@/types';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(StorageService.isAvailable()).toBe(true);
    });
  });

  describe('get/set', () => {
    it('should save and retrieve data', () => {
      const data = { test: 'value' };
      StorageService.set('test-key', data);
      expect(StorageService.get('test-key')).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      expect(StorageService.get('non-existent')).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('invalid-json', 'invalid json data');
      expect(StorageService.get('invalid-json')).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove data', () => {
      StorageService.set('test-key', { test: 'value' });
      StorageService.remove('test-key');
      expect(StorageService.get('test-key')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      StorageService.set('test-key-1', { test: 'value1' });
      StorageService.set('test-key-2', { test: 'value2' });
      StorageService.clear();
      expect(StorageService.get('test-key-1')).toBeNull();
      expect(StorageService.get('test-key-2')).toBeNull();
    });
  });

  describe('settings storage', () => {
    it('should save and load settings', () => {
      const settings: Settings = {
        theme: 'dark',
        soundEnabled: true,
        volume: 0.7,
        keyboardShortcutsEnabled: true,
      };
      StorageService.saveSettings(settings);
      expect(StorageService.loadSettings()).toEqual(settings);
    });

    it('should return null for non-existent settings', () => {
      expect(StorageService.loadSettings()).toBeNull();
    });
  });

  describe('presets storage', () => {
    it('should save and load presets', () => {
      const presets: Preset[] = [
        {
          id: 'test-1',
          name: 'Test Preset',
          type: 'custom',
          blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
          levelDuration: 600,
          breakConfig: { enabled: false, frequency: 4, duration: 600 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      StorageService.savePresets(presets);
      expect(StorageService.loadPresets()).toEqual(presets);
    });

    it('should return null for non-existent presets', () => {
      expect(StorageService.loadPresets()).toBeNull();
    });
  });

  describe('tournament state storage', () => {
    it('should save and load tournament state', () => {
      const state: TournamentState = {
        timer: { status: 'running', remainingTime: 300, elapsedTime: 300 },
        currentLevel: 2,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        levelDuration: 600,
        isOnBreak: false,
        breakRemainingTime: 0,
      };
      StorageService.saveTournamentState(state);
      expect(StorageService.loadTournamentState()).toEqual(state);
    });

    it('should return null for non-existent tournament state', () => {
      expect(StorageService.loadTournamentState()).toBeNull();
    });

    it('should remove tournament state', () => {
      const state: TournamentState = {
        timer: { status: 'idle', remainingTime: 600, elapsedTime: 0 },
        currentLevel: 0,
        blindLevels: [],
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        levelDuration: 600,
        isOnBreak: false,
        breakRemainingTime: 0,
      };
      StorageService.saveTournamentState(state);
      StorageService.removeTournamentState();
      expect(StorageService.loadTournamentState()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() =>
        StorageService.set('test-key', { test: 'value' })
      ).not.toThrow();

      // Restore original implementation
      localStorage.setItem = originalSetItem;
    });

    it('should return false for isAvailable if localStorage is not available', () => {
      // Mock localStorage to be undefined
      const originalLocalStorage = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(StorageService.isAvailable()).toBe(false);

      // Restore original implementation
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });
  });
});
