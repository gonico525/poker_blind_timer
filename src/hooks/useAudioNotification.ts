import { useEffect, useRef } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AudioService } from '@/services/AudioService';

/**
 * 音声通知フック
 *
 * TournamentContextとSettingsContextを監視し、
 * タイマーイベントに応じて音声を再生します。
 *
 * @example
 * ```tsx
 * function App() {
 *   useAudioNotification();
 *   return <MainLayout />;
 * }
 * ```
 */
export function useAudioNotification(): void {
  const { state } = useTournament();
  const { state: settingsState } = useSettings();

  const prevRemainingTime = useRef(state.timer.remainingTime);
  const prevIsOnBreak = useRef(state.isOnBreak);

  // 音量の同期
  useEffect(() => {
    AudioService.setVolume(settingsState.settings.volume);
  }, [settingsState.settings.volume]);

  // 音声有効/無効の同期
  useEffect(() => {
    AudioService.setEnabled(settingsState.settings.soundEnabled);
  }, [settingsState.settings.soundEnabled]);

  // 残り時間の監視（警告音、レベル変更音）
  useEffect(() => {
    if (!settingsState.settings.soundEnabled) {
      prevRemainingTime.current = state.timer.remainingTime;
      return;
    }

    const prev = prevRemainingTime.current;
    const current = state.timer.remainingTime;

    // 残り1分警告（61秒以上 → 60秒以下に変化、かつ0より大きい）
    if (prev > 60 && current <= 60 && current > 0) {
      AudioService.playWarning1Min();
    }

    // レベル変更通知（1秒以上 → 0秒に変化）
    if (prev > 0 && current === 0) {
      AudioService.playLevelChange();
    }

    prevRemainingTime.current = current;
  }, [state.timer.remainingTime, settingsState.settings.soundEnabled]);

  // 休憩状態の監視
  useEffect(() => {
    if (!settingsState.settings.soundEnabled) {
      prevIsOnBreak.current = state.isOnBreak;
      return;
    }

    // 休憩開始通知（false → true）
    if (!prevIsOnBreak.current && state.isOnBreak) {
      AudioService.playBreakStart();
    }

    prevIsOnBreak.current = state.isOnBreak;
  }, [state.isOnBreak, settingsState.settings.soundEnabled]);
}
