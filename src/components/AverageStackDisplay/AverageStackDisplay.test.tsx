import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AverageStackDisplay } from './AverageStackDisplay';

describe('AverageStackDisplay', () => {
  const defaultProps = {
    initialStack: 30000,
    totalPlayers: 10,
    remainingPlayers: 8,
    currentBigBlind: 600,
    onPlayersChange: vi.fn(),
  };

  describe('レンダリング', () => {
    it('initialStack が 0 の場合は非表示', () => {
      const { container } = render(
        <AverageStackDisplay {...defaultProps} initialStack={0} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('initialStack > 0 の場合は表示', () => {
      render(<AverageStackDisplay {...defaultProps} />);
      expect(screen.getByTestId('average-stack-display')).toBeInTheDocument();
    });

    it('プレイヤー数入力欄が表示される', () => {
      render(<AverageStackDisplay {...defaultProps} />);
      expect(screen.getByLabelText('Entries')).toBeInTheDocument();
      expect(screen.getByLabelText('Remaining')).toBeInTheDocument();
    });

    it('−1 ボタンが表示される', () => {
      render(<AverageStackDisplay {...defaultProps} />);
      expect(
        screen.getByTestId('decrement-remaining-button')
      ).toBeInTheDocument();
      expect(screen.getByText('−1')).toBeInTheDocument();
    });
  });

  describe('アベレージスタック表示', () => {
    it('条件を満たす場合にアベレージスタックが表示される', () => {
      render(<AverageStackDisplay {...defaultProps} />);
      expect(screen.getByTestId('average-stack-stats')).toBeInTheDocument();
      expect(screen.getByText('Avg Stack:')).toBeInTheDocument();
    });

    it('平均スタックが正しく計算されて表示される', () => {
      // (30000 * 10) / 8 = 37500
      render(<AverageStackDisplay {...defaultProps} />);
      expect(screen.getByText('37,500')).toBeInTheDocument();
    });

    it('BB換算値が正しく計算されて表示される', () => {
      // 37500 / 600 = 62.5
      render(<AverageStackDisplay {...defaultProps} />);
      expect(screen.getByTestId('average-stack-bb')).toHaveTextContent(
        '(62.5BB)'
      );
    });

    it('totalPlayers が 0 の場合は統計が表示されない', () => {
      render(<AverageStackDisplay {...defaultProps} totalPlayers={0} />);
      expect(
        screen.queryByTestId('average-stack-stats')
      ).not.toBeInTheDocument();
    });

    it('remainingPlayers が 0 の場合は統計が表示されない', () => {
      render(<AverageStackDisplay {...defaultProps} remainingPlayers={0} />);
      expect(
        screen.queryByTestId('average-stack-stats')
      ).not.toBeInTheDocument();
    });
  });

  describe('プレイヤー数の変更', () => {
    it('参加人数の変更時に onPlayersChange が呼ばれる', async () => {
      const onPlayersChange = vi.fn();
      const user = userEvent.setup();
      render(
        <AverageStackDisplay
          {...defaultProps}
          onPlayersChange={onPlayersChange}
        />
      );

      const totalPlayersInput = screen.getByLabelText('Entries');
      await user.clear(totalPlayersInput);
      await user.type(totalPlayersInput, '12');

      expect(onPlayersChange).toHaveBeenCalledWith(12, 8);
    });

    it('残り人数の変更時に onPlayersChange が呼ばれる', async () => {
      const onPlayersChange = vi.fn();
      const user = userEvent.setup();
      render(
        <AverageStackDisplay
          {...defaultProps}
          onPlayersChange={onPlayersChange}
        />
      );

      const remainingPlayersInput = screen.getByLabelText('Remaining');
      await user.clear(remainingPlayersInput);
      await user.type(remainingPlayersInput, '7');

      expect(onPlayersChange).toHaveBeenCalledWith(10, 7);
    });
  });

  describe('−1 ボタンの動作', () => {
    it('−1 ボタンクリックで残り人数が1減る', async () => {
      const onPlayersChange = vi.fn();
      const user = userEvent.setup();
      render(
        <AverageStackDisplay
          {...defaultProps}
          onPlayersChange={onPlayersChange}
        />
      );

      const decrementButton = screen.getByTestId('decrement-remaining-button');
      await user.click(decrementButton);

      expect(onPlayersChange).toHaveBeenCalledWith(10, 7);
    });

    it('remainingPlayers が 0 の場合はボタンが無効化される', () => {
      render(<AverageStackDisplay {...defaultProps} remainingPlayers={0} />);
      const decrementButton = screen.getByTestId('decrement-remaining-button');
      expect(decrementButton).toBeDisabled();
    });

    it('remainingPlayers が 1 の場合はボタンが有効', () => {
      render(<AverageStackDisplay {...defaultProps} remainingPlayers={1} />);
      const decrementButton = screen.getByTestId('decrement-remaining-button');
      expect(decrementButton).not.toBeDisabled();
    });
  });

  describe('エッジケース', () => {
    it('BB が 0 の場合も表示される', () => {
      render(<AverageStackDisplay {...defaultProps} currentBigBlind={0} />);
      expect(screen.getByTestId('average-stack-stats')).toBeInTheDocument();
      expect(screen.getByText('37,500')).toBeInTheDocument();
    });

    it('残り1人の場合の平均スタック計算', () => {
      // (30000 * 10) / 1 = 300000
      render(<AverageStackDisplay {...defaultProps} remainingPlayers={1} />);
      expect(screen.getByText('300,000')).toBeInTheDocument();
    });

    it('全員残っている場合の平均スタック計算', () => {
      // (30000 * 10) / 10 = 30000
      render(<AverageStackDisplay {...defaultProps} remainingPlayers={10} />);
      expect(screen.getByText('30,000')).toBeInTheDocument();
    });
  });
});
