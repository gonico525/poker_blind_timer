import { useState } from 'react';
import {
  useAudioNotification,
  useKeyboardShortcuts,
  useTimer,
  usePresets,
} from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import {
  AppHeader,
  TimerDisplay,
  BlindInfo,
  TimerControls,
  NextLevelInfo,
  BreakDisplay,
  PresetManagementModal,
} from '@/components';
import type { PresetId } from '@/types';
import './MainLayout.css';

function MainLayout() {
  // フック群
  useAudioNotification();
  useKeyboardShortcuts();
  const timer = useTimer();
  const { presets, loadPreset, currentPresetId } = usePresets();
  const { state: settingsState, dispatch: settingsDispatch } = useSettings();

  // UI状態
  const [showPresetManagement, setShowPresetManagement] = useState(false);

  // プリセット選択ハンドラ
  const handlePresetSelect = (presetId: PresetId) => {
    loadPreset(presetId);
  };

  // プリセット管理モーダルを開く
  const handleOpenPresetManagement = () => {
    setShowPresetManagement(true);
  };

  // プリセット管理モーダルを閉じる
  const handleClosePresetManagement = () => {
    setShowPresetManagement(false);
  };

  // テーマ変更ハンドラ
  const handleThemeChange = (theme: 'light' | 'dark') => {
    settingsDispatch({ type: 'SET_THEME', payload: { theme } });
  };

  // 音量変更ハンドラ
  const handleVolumeChange = (volume: number) => {
    settingsDispatch({ type: 'SET_VOLUME', payload: { volume } });
  };

  // 音声ON/OFF変更ハンドラ
  const handleSoundEnabledChange = (enabled: boolean) => {
    settingsDispatch({ type: 'SET_SOUND_ENABLED', payload: { enabled } });
  };

  return (
    <div className="main-layout" data-testid="main-layout">
      <AppHeader
        presets={presets}
        currentPresetId={currentPresetId}
        onPresetSelect={handlePresetSelect}
        onPresetManage={handleOpenPresetManagement}
        volume={settingsState.settings.volume}
        isSoundEnabled={settingsState.settings.soundEnabled}
        onVolumeChange={handleVolumeChange}
        onSoundEnabledChange={handleSoundEnabledChange}
        theme={settingsState.settings.theme}
        onThemeChange={handleThemeChange}
      />

      <main className="main-content">
        <div className="timer-view">
          {timer.isOnBreak ? (
            <BreakDisplay
              remainingTime={timer.remainingTime}
              onSkip={timer.skipBreak}
            />
          ) : (
            <>
              <TimerDisplay
                remainingTime={timer.remainingTime}
                elapsedTime={timer.elapsedTime}
                status={timer.status}
                isOnBreak={timer.isOnBreak}
              />
              <BlindInfo
                level={timer.currentLevel}
                blindLevel={timer.currentBlind}
              />
              <NextLevelInfo
                nextBlind={timer.nextBlind}
                levelsUntilBreak={timer.levelsUntilBreak}
              />
            </>
          )}

          <TimerControls
            status={timer.status}
            isOnBreak={timer.isOnBreak}
            hasNextLevel={timer.hasNextLevel}
            hasPrevLevel={timer.hasPrevLevel}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
            onNextLevel={timer.nextLevel}
            onPrevLevel={timer.prevLevel}
            onSkipBreak={timer.skipBreak}
          />
        </div>
      </main>

      <PresetManagementModal
        isOpen={showPresetManagement}
        onClose={handleClosePresetManagement}
        currentPresetId={currentPresetId}
      />
    </div>
  );
}

export default MainLayout;
