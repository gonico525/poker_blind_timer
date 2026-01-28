import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlindInfo } from './BlindInfo';

describe('BlindInfo', () => {
  const mockBlindLevel = {
    smallBlind: 100,
    bigBlind: 200,
    ante: 25,
  };

  it('should display current level number', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('level-number')).toHaveTextContent('Level 2');
  });

  it('should display SB/BB/Ante in one line', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('blinds')).toHaveTextContent('100/200/25');
  });

  it('should display ante when present', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('ante')).toHaveTextContent('25');
  });

  it('should not display ante when 0', () => {
    render(<BlindInfo level={1} blindLevel={{ ...mockBlindLevel, ante: 0 }} />);
    expect(screen.queryByTestId('ante')).not.toBeInTheDocument();
  });

  it('should format large values with K suffix', () => {
    const largeBlind = { smallBlind: 1000, bigBlind: 2000, ante: 200 };
    render(<BlindInfo level={1} blindLevel={largeBlind} />);
    expect(screen.getByTestId('blinds')).toHaveTextContent('1K/2K/200');
  });

  it('should display level 0 as Level 1', () => {
    render(<BlindInfo level={0} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('level-number')).toHaveTextContent('Level 1');
  });
});
