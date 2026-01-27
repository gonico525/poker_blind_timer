import { useState } from 'react';
import {
  useAudioNotification,
  useKeyboardShortcuts,
  useTimer,
  usePresets,
} from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import {
  TimerDisplay,
  BlindInfo,
  TimerControls,
  NextLevelInfo,
  BreakDisplay,
  ThemeToggle,
  PresetManager,
} from '@/components';
import './MainLayout.css';

function MainLayout() {
  // フック群
  useAudioNotification();
  useKeyboardShortcuts();
  const timer = useTimer();
  const { presets, loadPreset, currentPresetId } = usePresets();
  const { state: settingsState, dispatch: settingsDispatch } = useSettings();

  // UI状態
  const [showSettings, setShowSettings] = useState(false);

  // テーマ変更ハンドラ
  const handleThemeChange = (theme: 'light' | 'dark') => {
    settingsDispatch({ type: 'SET_THEME', payload: { theme } });
  };

  return (
    <div className="main-layout" data-testid="main-layout">
      <header className="main-header">
        <h1>Poker Blind Timer</h1>
        <div className="header-controls">
          <ThemeToggle
            theme={settingsState.settings.theme}
            onChange={handleThemeChange}
          />
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '✕ 閉じる' : '⚙️ 設定'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {showSettings ? (
          <div className="settings-view">
            <h2>プリセット選択</h2>
            <PresetManager
              presets={presets}
              currentPresetId={currentPresetId}
              onLoad={loadPreset}
            />
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}

export default MainLayout;
