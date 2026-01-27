import './ErrorScreen.css';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

function ErrorScreen({
  message = 'エラーが発生しました',
  onRetry,
}: ErrorScreenProps) {
  return (
    <div className="error-screen" data-testid="error-screen">
      <div className="error-content">
        <div className="error-icon" data-testid="error-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="error-title">エラー</h2>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button className="retry-button" onClick={onRetry}>
            再試行
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorScreen;
