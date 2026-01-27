import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('should render loading screen with message', () => {
    render(<LoadingScreen />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('should display loading text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
  });

  it('should display spinner element', () => {
    render(<LoadingScreen />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should accept custom message', () => {
    render(<LoadingScreen message="初期化中..." />);
    expect(screen.getByText('初期化中...')).toBeInTheDocument();
  });
});
