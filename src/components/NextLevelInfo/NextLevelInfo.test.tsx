import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextLevelInfo } from './NextLevelInfo';

describe('NextLevelInfo', () => {
  const nextBlind = { smallBlind: 200, bigBlind: 400, ante: 50 };

  it('should display next level info', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={3} />);
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByTestId('next-blinds')).toHaveTextContent('200/400');
  });

  it('should display levels until break', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={3} />);
    expect(screen.getByTestId('break-info')).toHaveTextContent('3');
  });

  it('should not display break info when null', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={null} />);
    expect(screen.queryByTestId('break-info')).not.toBeInTheDocument();
  });

  it('should display "Last Level" when no next blind', () => {
    render(<NextLevelInfo nextBlind={undefined} levelsUntilBreak={null} />);
    expect(screen.getByText(/last level/i)).toBeInTheDocument();
  });

  it('should display ante when present', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={null} />);
    expect(screen.getByTestId('next-ante')).toHaveTextContent('Ante: 50');
  });

  it('should not display ante when 0', () => {
    const blindWithoutAnte = { smallBlind: 200, bigBlind: 400, ante: 0 };
    render(
      <NextLevelInfo nextBlind={blindWithoutAnte} levelsUntilBreak={null} />
    );
    expect(screen.queryByTestId('next-ante')).not.toBeInTheDocument();
  });

  it('should format large values with K suffix', () => {
    const largeBlind = { smallBlind: 2000, bigBlind: 4000, ante: 500 };
    render(<NextLevelInfo nextBlind={largeBlind} levelsUntilBreak={null} />);
    expect(screen.getByTestId('next-blinds')).toHaveTextContent('2K/4K');
  });

  it('should display singular "level" when 1 level until break', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={1} />);
    expect(screen.getByTestId('break-info')).toHaveTextContent(/1.*level/i);
  });

  it('should display plural "levels" when multiple levels until break', () => {
    render(<NextLevelInfo nextBlind={nextBlind} levelsUntilBreak={3} />);
    expect(screen.getByTestId('break-info')).toHaveTextContent(/3.*levels/i);
  });
});
