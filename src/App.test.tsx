import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('Poker Blind Timer')).toBeInTheDocument();
  });

  it('displays phase 0 completion message', () => {
    render(<App />);
    expect(screen.getByText(/Phase 0/i)).toBeInTheDocument();
  });
});
