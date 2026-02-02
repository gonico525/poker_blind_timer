import { useState, useEffect, useRef } from 'react';
import {
  useAudioNotification,
  useKeyboardShortcuts,
  useTimer,
  useStructures,
} from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import {
  AppHeader,
  TimerDisplay,
  BlindInfo,
  TimerControls,
  NextLevelInfo,
  BreakDisplay,
  StructureManagementModal,
} from '@/components';
import type { StructureId } from '@/types';
import './MainLayout.css';

function MainLayout() {
  // フック群
  useAudioNotification();
  useKeyboardShortcuts();
  const timer = useTimer();
  const { structures, loadStructure, currentStructureId } = useStructures();
  const { state: settingsState, dispatch: settingsDispatch } = useSettings();

  // 初期ストラクチャーの読み込み
  const hasLoadedInitial = useRef(false);
  useEffect(() => {
    if (!hasLoadedInitial.current && currentStructureId) {
      hasLoadedInitial.current = true;
      loadStructure(currentStructureId);
    }
  }, [currentStructureId, loadStructure]);

  // UI状態
  const [showStructureManagement, setShowStructureManagement] = useState(false);

  // ストラクチャー選択ハンドラ
  const handleStructureSelect = (structureId: StructureId) => {
    loadStructure(structureId);
  };

  // ストラクチャー管理モーダルを開く
  const handleOpenStructureManagement = () => {
    setShowStructureManagement(true);
  };

  // ストラクチャー管理モーダルを閉じる
  const handleCloseStructureManagement = () => {
    setShowStructureManagement(false);
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
        structures={structures}
        currentStructureId={currentStructureId}
        onStructureSelect={handleStructureSelect}
        onStructureManage={handleOpenStructureManagement}
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

      <StructureManagementModal
        isOpen={showStructureManagement}
        onClose={handleCloseStructureManagement}
        currentStructureId={currentStructureId}
      />
    </div>
  );
}

export default MainLayout;
