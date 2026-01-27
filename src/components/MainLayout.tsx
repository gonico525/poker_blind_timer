import { useAudioNotification, useKeyboardShortcuts } from '@/hooks';
import './MainLayout.css';

function MainLayout() {
  // 音声通知とキーボードショートカットをグローバルに有効化
  useAudioNotification();
  useKeyboardShortcuts();

  return (
    <div className="main-layout" data-testid="main-layout">
      <header className="main-header">
        <h1>Poker Blind Timer</h1>
      </header>
      <main className="main-content">
        <div className="placeholder-message">
          <h2>Phase 4 Team A: 基盤UIコンポーネント完成</h2>
          <p>タイマーUIコンポーネント（Team B）と設定UIコンポーネント（Team D）の実装待ちです。</p>
          <div className="status-info">
            <h3>実装済み機能:</h3>
            <ul>
              <li>✅ 初期化シーケンス</li>
              <li>✅ ローディング画面</li>
              <li>✅ エラー画面</li>
              <li>✅ 音声通知システム</li>
              <li>✅ キーボードショートカット</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
