import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

function LoadingScreen({ message = '読み込み中...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen" data-testid="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner" data-testid="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
