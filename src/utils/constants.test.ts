import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS, LIMITS, DEFAULTS, AUDIO_FILES } from './constants';

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(STORAGE_KEYS.SETTINGS).toBe('poker-timer-settings');
      expect(STORAGE_KEYS.STRUCTURES).toBe('poker-timer-structures');
      expect(STORAGE_KEYS.TOURNAMENT_STATE).toBe('poker-timer-tournament');
    });
  });

  describe('LIMITS', () => {
    it('should have valid limit values', () => {
      expect(LIMITS.MAX_STRUCTURES).toBeGreaterThan(0);
      expect(LIMITS.MIN_LEVEL_DURATION).toBeLessThan(LIMITS.MAX_LEVEL_DURATION);
      expect(LIMITS.MIN_BREAK_DURATION).toBeLessThan(LIMITS.MAX_BREAK_DURATION);
      expect(LIMITS.MIN_BREAK_FREQUENCY).toBeLessThan(
        LIMITS.MAX_BREAK_FREQUENCY
      );
    });

    it('should have reasonable max structures limit', () => {
      expect(LIMITS.MAX_STRUCTURES).toBe(20);
    });

    it('should have reasonable max blind levels limit', () => {
      expect(LIMITS.MAX_BLIND_LEVELS).toBe(50);
    });
  });

  describe('DEFAULTS', () => {
    it('should have sensible default values', () => {
      expect(DEFAULTS.LEVEL_DURATION).toBe(600); // 10分
      expect(DEFAULTS.BREAK_DURATION).toBe(600); // 10分
      expect(DEFAULTS.BREAK_FREQUENCY).toBe(4); // 4レベルごと
      expect(DEFAULTS.VOLUME).toBe(0.7);
    });

    it('should have volume between 0 and 1', () => {
      expect(DEFAULTS.VOLUME).toBeGreaterThan(0);
      expect(DEFAULTS.VOLUME).toBeLessThanOrEqual(1);
    });
  });

  describe('AUDIO_FILES', () => {
    it('should have valid file paths', () => {
      expect(AUDIO_FILES.LEVEL_CHANGE).toMatch(/\.mp3$/);
      expect(AUDIO_FILES.WARNING_1MIN).toMatch(/\.mp3$/);
      expect(AUDIO_FILES.BREAK_START).toMatch(/\.mp3$/);
    });

    it('should have correct paths', () => {
      expect(AUDIO_FILES.LEVEL_CHANGE).toBe('/sounds/level-change.mp3');
      expect(AUDIO_FILES.WARNING_1MIN).toBe('/sounds/warning-1min.mp3');
      expect(AUDIO_FILES.BREAK_START).toBe('/sounds/break-start.mp3');
    });
  });
});
