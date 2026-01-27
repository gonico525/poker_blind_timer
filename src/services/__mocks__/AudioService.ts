import { vi } from 'vitest';

export const AudioService = {
  preload: vi.fn().mockResolvedValue(undefined),
  playLevelChange: vi.fn(),
  playWarning1Min: vi.fn(),
  playBreakStart: vi.fn(),
  setVolume: vi.fn(),
  setEnabled: vi.fn(),
  isEnabled: vi.fn().mockReturnValue(true),
  getVolume: vi.fn().mockReturnValue(0.7),
  cleanup: vi.fn(),
};
