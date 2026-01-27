import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAudioNotification } from './useAudioNotification';
import { AudioService } from '@/services/AudioService';
import * as TournamentContext from '@/contexts/TournamentContext';
import * as SettingsContext from '@/contexts/SettingsContext';
import type { TournamentState, SettingsState } from '@/types';

// モック化
vi.mock('@/services/AudioService');
vi.mock('@/contexts/TournamentContext');
vi.mock('@/contexts/SettingsContext');

describe('useAudioNotification', () => {
  let mockTournamentState: TournamentState;
  let mockSettingsState: SettingsState;

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトの状態を設定
    mockTournamentState = {
      timer: {
        status: 'idle',
        remainingTime: 600,
        elapsedTime: 0,
      },
      currentLevel: 0,
      blindLevels: [
        { smallBlind: 10, bigBlind: 20, ante: 0 },
        { smallBlind: 20, bigBlind: 40, ante: 0 },
      ],
      breakConfig: { enabled: true, frequency: 4, duration: 300 },
      levelDuration: 600,
      isOnBreak: false,
      breakRemainingTime: 0,
    };

    mockSettingsState = {
      settings: {
        theme: 'light',
        soundEnabled: true,
        volume: 0.7,
        keyboardShortcutsEnabled: true,
      },
      presets: [],
      currentPresetId: null,
    };

    // useTournamentとuseSettingsをモック化
    vi.mocked(TournamentContext.useTournament).mockReturnValue({
      state: mockTournamentState,
      dispatch: vi.fn(),
    });

    vi.mocked(SettingsContext.useSettings).mockReturnValue({
      state: mockSettingsState,
      dispatch: vi.fn(),
    });
  });

  describe('warning at 1 minute', () => {
    it('should play warning sound when remainingTime crosses 60 seconds', () => {
      // 61秒の状態で開始
      mockTournamentState.timer.remainingTime = 61;
      mockTournamentState.timer.status = 'running';

      const { rerender } = renderHook(() => useAudioNotification());

      // 60秒に変化させる
      mockTournamentState.timer.remainingTime = 60;

      rerender();

      expect(AudioService.playWarning1Min).toHaveBeenCalled();
    });

    it('should not play warning when remainingTime is already below 60', () => {
      // 最初から30秒の状態
      mockTournamentState.timer.remainingTime = 30;
      mockTournamentState.timer.status = 'running';

      renderHook(() => useAudioNotification());

      expect(AudioService.playWarning1Min).not.toHaveBeenCalled();
    });

    it('should not play warning when sound is disabled', () => {
      // 音声無効で開始
      mockSettingsState.settings.soundEnabled = false;
      mockTournamentState.timer.remainingTime = 61;
      mockTournamentState.timer.status = 'running';

      const { rerender } = renderHook(() => useAudioNotification());

      // 60秒に変化
      mockTournamentState.timer.remainingTime = 60;

      rerender();

      expect(AudioService.playWarning1Min).not.toHaveBeenCalled();
    });
  });

  describe('level change notification', () => {
    it('should play level change sound when remainingTime reaches 0', () => {
      // 1秒の状態で開始
      mockTournamentState.timer.remainingTime = 1;
      mockTournamentState.timer.status = 'running';

      const { rerender } = renderHook(() => useAudioNotification());

      // 0秒に変化
      mockTournamentState.timer.remainingTime = 0;

      rerender();

      expect(AudioService.playLevelChange).toHaveBeenCalled();
    });

    it('should not play level change sound when sound is disabled', () => {
      mockSettingsState.settings.soundEnabled = false;
      mockTournamentState.timer.remainingTime = 1;
      mockTournamentState.timer.status = 'running';

      const { rerender } = renderHook(() => useAudioNotification());

      // 0秒に変化
      mockTournamentState.timer.remainingTime = 0;

      rerender();

      expect(AudioService.playLevelChange).not.toHaveBeenCalled();
    });
  });

  describe('break start notification', () => {
    it('should play break start sound when entering break', () => {
      // 休憩前の状態
      mockTournamentState.isOnBreak = false;

      const { rerender } = renderHook(() => useAudioNotification());

      // 休憩開始
      mockTournamentState.isOnBreak = true;
      mockTournamentState.breakRemainingTime = 300;

      rerender();

      expect(AudioService.playBreakStart).toHaveBeenCalled();
    });

    it('should not play when exiting break', () => {
      // 休憩中の状態で開始
      mockTournamentState.isOnBreak = true;
      mockTournamentState.breakRemainingTime = 300;

      const { rerender } = renderHook(() => useAudioNotification());

      // 休憩終了
      mockTournamentState.isOnBreak = false;
      mockTournamentState.breakRemainingTime = 0;

      rerender();

      expect(AudioService.playBreakStart).not.toHaveBeenCalled();
    });

    it('should not play break start when sound is disabled', () => {
      mockSettingsState.settings.soundEnabled = false;
      mockTournamentState.isOnBreak = false;

      const { rerender } = renderHook(() => useAudioNotification());

      // 休憩開始
      mockTournamentState.isOnBreak = true;
      mockTournamentState.breakRemainingTime = 300;

      rerender();

      expect(AudioService.playBreakStart).not.toHaveBeenCalled();
    });
  });

  describe('volume sync', () => {
    it('should sync volume with settings', () => {
      mockSettingsState.settings.volume = 0.5;

      renderHook(() => useAudioNotification());

      expect(AudioService.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('should update volume when it changes', () => {
      mockSettingsState.settings.volume = 0.5;

      const { rerender } = renderHook(() => useAudioNotification());

      // 音量を変更
      mockSettingsState.settings.volume = 0.8;

      rerender();

      expect(AudioService.setVolume).toHaveBeenCalledWith(0.8);
    });
  });

  describe('sound enabled sync', () => {
    it('should sync enabled state with settings', () => {
      mockSettingsState.settings.soundEnabled = false;

      renderHook(() => useAudioNotification());

      expect(AudioService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should update enabled state when it changes', () => {
      mockSettingsState.settings.soundEnabled = false;

      const { rerender } = renderHook(() => useAudioNotification());

      // 音声を有効化
      mockSettingsState.settings.soundEnabled = true;

      rerender();

      expect(AudioService.setEnabled).toHaveBeenCalledWith(true);
    });
  });
});
