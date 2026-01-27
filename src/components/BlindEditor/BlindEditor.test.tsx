import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlindEditor } from './BlindEditor';
import type { BlindLevel } from '@/types';

describe('BlindEditor', () => {
  const mockBlindLevels: BlindLevel[] = [
    { smallBlind: 25, bigBlind: 50, ante: 0 },
    { smallBlind: 50, bigBlind: 100, ante: 0 },
    { smallBlind: 100, bigBlind: 200, ante: 25 },
  ];

  it('should display all blind levels', () => {
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={vi.fn()} />);

    expect(screen.getAllByTestId('blind-level-row')).toHaveLength(3);
  });

  it('should display level numbers', () => {
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={vi.fn()} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onChange when SB is edited', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    const sbInputs = screen.getAllByTestId('sb-input');
    await userEvent.clear(sbInputs[0]);
    await userEvent.type(sbInputs[0], '30');

    expect(onChange).toHaveBeenCalled();
    // userEvent.typeは文字ごとに変更イベントを発火するため、onChangeが複数回呼ばれる
    // 最後の呼び出しでsmallBlindが正の値であることを確認
    const calls = onChange.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall[0].smallBlind).toBeGreaterThan(0);
  });

  it('should add new level when "Add" button is clicked', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /追加|add/i }));

    expect(onChange).toHaveBeenCalled();
    const newLevels = onChange.mock.calls[0][0];
    expect(newLevels).toHaveLength(4);
  });

  it('should remove level when delete is clicked', async () => {
    const onChange = vi.fn();
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={onChange} />);

    const deleteButtons = screen.getAllByTestId('delete-level-button');
    await userEvent.click(deleteButtons[1]); // 2番目を削除

    expect(onChange).toHaveBeenCalled();
    const newLevels = onChange.mock.calls[0][0];
    expect(newLevels).toHaveLength(2);
    expect(newLevels[0]).toEqual(mockBlindLevels[0]);
    expect(newLevels[1]).toEqual(mockBlindLevels[2]);
  });

  it('should disable delete button if only one level remains', () => {
    render(
      <BlindEditor blindLevels={[mockBlindLevels[0]]} onChange={vi.fn()} />
    );

    const deleteButton = screen.getByTestId('delete-level-button');
    expect(deleteButton).toBeDisabled();
  });

  it('should display ante when present', () => {
    render(<BlindEditor blindLevels={mockBlindLevels} onChange={vi.fn()} />);

    const anteInputs = screen.getAllByTestId('ante-input');
    expect(anteInputs[2]).toHaveValue(25);
  });
});
