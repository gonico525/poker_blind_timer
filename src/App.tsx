import { useState, useEffect } from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AudioService } from '@/services/AudioService';
import { KeyboardService } from '@/services/KeyboardService';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import MainLayout from '@/components/MainLayout';
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Phase 4: サービス初期化
        // AudioServiceのプリロード（音声ファイルの事前読み込み）
        await AudioService.preload();

        // KeyboardServiceの初期化（グローバルキーリスナー登録）
        KeyboardService.initialize();

        // 初期化完了
        setIsInitialized(true);
      } catch (error) {
        setInitError('アプリの初期化に失敗しました');
        console.error('Initialization error:', error);
      }
    }

    initialize();

    // クリーンアップ
    return () => {
      KeyboardService.cleanup();
    };
  }, []);

  // エラー画面の表示
  if (initError) {
    return <ErrorScreen message={initError} />;
  }

  // ローディング画面の表示
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // メイン画面の表示
  return (
    <SettingsProvider>
      <TournamentProvider>
        <NotificationProvider>
          <MainLayout />
        </NotificationProvider>
      </TournamentProvider>
    </SettingsProvider>
  );
}

export default App;
