# Team B 実装計画書：タイマー・表示

## 概要

| 項目       | 内容                                       |
| ---------- | ------------------------------------------ |
| チーム名   | Team B                                     |
| 担当領域   | タイマー・表示                             |
| 主な成果物 | useTimer、タイマー関連UIコンポーネント     |
| 依存先     | Team A（型定義、Context）                  |
| 依存元     | Team C（音声通知連携）、Team D（設定連携） |

---

## 担当範囲

### 成果物一覧

```
src/
├── hooks/
│   └── useTimer.ts              # タイマー制御フック
├── components/
│   ├── TimerDisplay/
│   │   ├── TimerDisplay.tsx     # タイマー表示（メイン）
│   │   ├── TimerDisplay.test.tsx
│   │   └── TimerDisplay.module.css
│   ├── BlindInfo/
│   │   ├── BlindInfo.tsx        # ブラインド情報表示
│   │   ├── BlindInfo.test.tsx
│   │   └── BlindInfo.module.css
│   ├── TimerControls/
│   │   ├── TimerControls.tsx    # 操作ボタン
│   │   ├── TimerControls.test.tsx
│   │   └── TimerControls.module.css
│   ├── BreakDisplay/
│   │   ├── BreakDisplay.tsx     # 休憩表示
│   │   ├── BreakDisplay.test.tsx
│   │   └── BreakDisplay.module.css
│   └── NextLevelInfo/
│       ├── NextLevelInfo.tsx    # 次レベル情報
│       ├── NextLevelInfo.test.tsx
│       └── NextLevelInfo.module.css
└── __tests__/
    └── integration/
        └── timer-flow.test.tsx  # タイマーフロー統合テスト
```

---

## 開発開始条件

**Team A からの提供物が必要:**

| 提供物                            | 提供元          | 使用箇所                   |
| --------------------------------- | --------------- | -------------------------- |
| 型定義（Timer, BlindLevel, etc.） | Team A Phase 1  | 全ファイル                 |
| formatTime, formatBlindLevel      | Team A Phase 1  | 表示コンポーネント         |
| TournamentContext                 | Team A Phase 2A | useTimer, 全コンポーネント |
| DEFAULTS, LIMITS                  | Team A Phase 1  | useTimer                   |

**開始可能タイミング**: Team A Phase 1 完了後

---

## 実装フェーズ

### Phase 3A: useTimer フック

**目標**: タイマーの制御ロジックを実装

**作業開始前の必須確認:**

Phase 1の成果物とPhase 2Aの成果物を確認してから実装を開始してください。以下のファイルを必ず確認すること：

1. **Phase 1成果物の確認**
   - `src/types/domain.ts`: Timer, TimerStatus, BlindLevel, TournamentState型
   - `src/types/context.ts`: TournamentAction の全アクション型（START, PAUSE, TICK等）
   - `src/utils/timeFormat.ts`: formatTime, formatLongTime 関数
   - `src/utils/blindFormat.ts`: formatBlindLevel 関数
   - `src/utils/constants.ts`: DEFAULTS, LIMITS 定数
   - `src/domain/models/Break.ts`: shouldTakeBreak, getLevelsUntilBreak 関数

2. **Phase 2A成果物の確認**
   - `src/contexts/TournamentContext.tsx`: TournamentContext の実装
   - TournamentContext の使用方法（useTournament フック）
   - dispatch で使用可能なアクション

3. **完了報告書の確認**
   - `docs/reports/phase1-completion-report.md`: Phase 1の実装詳細
   - `docs/reports/phase2a-completion-report.md`: Phase 2Aの実装詳細（Phase 2A完了後）

**参照ドキュメント:**

- [features/timer.md](../specs/features/timer.md) - タイマー機能仕様（**必読**）
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション1「Context間アクション責務マトリクス」
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション2「イベント通知メカニズム」
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション6「休憩フローの状態遷移」

#### Step 3A.1: useTimer 基本機能

**TDD実装順序:**

```typescript
// src/hooks/useTimer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';
import { TournamentProvider } from '@/contexts/TournamentContext';

// テスト用ラッパー
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TournamentProvider>{children}</TournamentProvider>
);

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial timer state', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      expect(result.current.status).toBe('idle');
      expect(result.current.remainingTime).toBeGreaterThan(0);
      expect(result.current.elapsedTime).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('start', () => {
    it('should start the timer', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isRunning).toBe(true);
    });

    it('should decrement remainingTime every second', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const initialTime = result.current.remainingTime;

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.remainingTime).toBe(initialTime - 1);
      expect(result.current.elapsedTime).toBe(1);
    });

    it('should increment elapsedTime every second', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedTime).toBe(5);
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe('paused');
      expect(result.current.isPaused).toBe(true);
    });

    it('should stop decrementing when paused', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const timeBeforePause = result.current.remainingTime;

      act(() => {
        result.current.pause();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.remainingTime).toBe(timeBeforePause);
    });
  });

  describe('toggle', () => {
    it('should toggle between running and paused', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      // idle → running
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('running');

      // running → paused
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('paused');

      // paused → running
      act(() => {
        result.current.toggle();
      });
      expect(result.current.status).toBe('running');
    });
  });

  describe('reset', () => {
    it('should reset timer to level duration', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.elapsedTime).toBe(0);
      // remainingTime should be reset to levelDuration
    });
  });

  describe('nextLevel', () => {
    it('should advance to next level', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const initialLevel = result.current.currentLevel;

      act(() => {
        result.current.nextLevel();
      });

      expect(result.current.currentLevel).toBe(initialLevel + 1);
      expect(result.current.status).toBe('idle');
      expect(result.current.elapsedTime).toBe(0);
    });
  });

  describe('prevLevel', () => {
    it('should go back to previous level', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      // まず次のレベルに進む
      act(() => {
        result.current.nextLevel();
      });

      const levelAfterNext = result.current.currentLevel;

      act(() => {
        result.current.prevLevel();
      });

      expect(result.current.currentLevel).toBe(levelAfterNext - 1);
    });

    it('should not go below level 0', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });

      act(() => {
        result.current.prevLevel();
      });

      expect(result.current.currentLevel).toBe(0);
    });
  });

  describe('auto level progression', () => {
    it('should auto-advance when remainingTime reaches 0', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const initialLevel = result.current.currentLevel;

      act(() => {
        result.current.start();
      });

      // タイマーを終了まで進める
      act(() => {
        vi.advanceTimersByTime(result.current.remainingTime * 1000);
      });

      expect(result.current.currentLevel).toBe(initialLevel + 1);
      expect(result.current.status).toBe('idle');
    });
  });
});
```

#### Step 3A.2: 休憩処理

```typescript
describe('useTimer - break handling', () => {
  // 休憩設定ありのContextでテスト
  const wrapperWithBreak = ({ children }: { children: React.ReactNode }) => (
    <TournamentProvider
      initialState={{
        breakConfig: { enabled: true, frequency: 2, duration: 300 },
        // ... other initial state
      }}
    >
      {children}
    </TournamentProvider>
  );

  it('should enter break mode at break frequency', () => {
    const { result } = renderHook(() => useTimer(), { wrapper: wrapperWithBreak });

    // レベル1を完了（0-indexed: 0 → 1）
    act(() => {
      result.current.nextLevel();
    });

    // レベル2を完了（0-indexed: 1 → 2）、ここで休憩
    act(() => {
      result.current.nextLevel();
    });

    expect(result.current.isOnBreak).toBe(true);
    expect(result.current.breakRemainingTime).toBe(300);
  });

  it('should skip break when skipBreak is called', () => {
    const { result } = renderHook(() => useTimer(), { wrapper: wrapperWithBreak });

    // 休憩に入る
    act(() => {
      result.current.nextLevel();
      result.current.nextLevel();
    });

    expect(result.current.isOnBreak).toBe(true);

    act(() => {
      result.current.skipBreak();
    });

    expect(result.current.isOnBreak).toBe(false);
  });

  it('should return levelsUntilBreak', () => {
    const { result } = renderHook(() => useTimer(), { wrapper: wrapperWithBreak });

    expect(result.current.levelsUntilBreak).toBe(2);

    act(() => {
      result.current.nextLevel();
    });

    expect(result.current.levelsUntilBreak).toBe(1);
  });
});
```

#### Step 3A.3: useTimer の実装

```typescript
// src/hooks/useTimer.ts
import { useCallback, useEffect, useRef } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { shouldTakeBreak, getLevelsUntilBreak } from '@/domain/models/Break';

export function useTimer() {
  const { state, dispatch } = useTournament();
  const intervalRef = useRef<number | null>(null);

  // タイマーの開始
  const start = useCallback(() => {
    if (state.timer.status === 'running') return;
    dispatch({ type: 'START' });
  }, [state.timer.status, dispatch]);

  // タイマーの一時停止
  const pause = useCallback(() => {
    if (state.timer.status !== 'running') return;
    dispatch({ type: 'PAUSE' });
  }, [state.timer.status, dispatch]);

  // トグル（開始/一時停止）
  const toggle = useCallback(() => {
    if (state.timer.status === 'running') {
      pause();
    } else {
      start();
    }
  }, [state.timer.status, start, pause]);

  // リセット
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // 次のレベルへ
  const nextLevel = useCallback(() => {
    dispatch({ type: 'NEXT_LEVEL' });
  }, [dispatch]);

  // 前のレベルへ
  const prevLevel = useCallback(() => {
    dispatch({ type: 'PREV_LEVEL' });
  }, [dispatch]);

  // 休憩スキップ
  const skipBreak = useCallback(() => {
    dispatch({ type: 'SKIP_BREAK' });
  }, [dispatch]);

  // タイマーの tick 処理
  useEffect(() => {
    if (state.timer.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.timer.status, dispatch]);

  // 自動レベル進行
  useEffect(() => {
    if (state.timer.remainingTime === 0 && state.timer.status === 'running') {
      // 休憩判定
      if (shouldTakeBreak(state.currentLevel, state.breakConfig)) {
        dispatch({ type: 'START_BREAK' });
      } else {
        dispatch({ type: 'NEXT_LEVEL' });
      }
    }
  }, [
    state.timer.remainingTime,
    state.timer.status,
    state.currentLevel,
    state.breakConfig,
    dispatch,
  ]);

  return {
    // 状態
    status: state.timer.status,
    remainingTime: state.timer.remainingTime,
    elapsedTime: state.timer.elapsedTime,
    currentLevel: state.currentLevel,
    isOnBreak: state.isOnBreak,
    breakRemainingTime: state.breakRemainingTime,
    levelsUntilBreak: getLevelsUntilBreak(
      state.currentLevel,
      state.breakConfig
    ),

    // 算出プロパティ
    isRunning: state.timer.status === 'running',
    isPaused: state.timer.status === 'paused',
    isIdle: state.timer.status === 'idle',

    // 現在のブラインド
    currentBlind: state.blindLevels[state.currentLevel],
    nextBlind: state.blindLevels[state.currentLevel + 1],
    hasNextLevel: state.currentLevel < state.blindLevels.length - 1,
    hasPrevLevel: state.currentLevel > 0,

    // アクション
    start,
    pause,
    toggle,
    reset,
    nextLevel,
    prevLevel,
    skipBreak,
  };
}
```

---

### Phase 4: UIコンポーネント

**参照ドキュメント:**

- [03-design-system.md](../specs/03-design-system.md) - デザインシステム（**必読**）
- [features/timer.md](../specs/features/timer.md) - タイマー表示仕様

#### Step 4.1: TimerDisplay

**TDD実装順序:**

```typescript
// src/components/TimerDisplay/TimerDisplay.test.tsx
describe('TimerDisplay', () => {
  const mockTimerState = {
    remainingTime: 545,  // 9:05
    elapsedTime: 55,
    status: 'running' as const,
    isOnBreak: false,
  };

  it('should display remaining time in MM:SS format', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('remaining-time')).toHaveTextContent('09:05');
  });

  it('should display elapsed time', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:55');
  });

  it('should apply running class when timer is running', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('timer-display')).toHaveClass('running');
  });

  it('should apply warning class when remainingTime <= 60', () => {
    render(<TimerDisplay {...mockTimerState} remainingTime={60} />);
    expect(screen.getByTestId('timer-display')).toHaveClass('warning');
  });

  it('should apply critical class when remainingTime <= 30', () => {
    render(<TimerDisplay {...mockTimerState} remainingTime={30} />);
    expect(screen.getByTestId('timer-display')).toHaveClass('critical');
  });

  it('should display "BREAK" when on break', () => {
    render(<TimerDisplay {...mockTimerState} isOnBreak={true} />);
    expect(screen.getByTestId('break-indicator')).toBeInTheDocument();
  });
});
```

#### Step 4.2: BlindInfo

```typescript
// src/components/BlindInfo/BlindInfo.test.tsx
describe('BlindInfo', () => {
  const mockBlindLevel = {
    smallBlind: 100,
    bigBlind: 200,
    ante: 25,
  };

  it('should display current level number', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('level-number')).toHaveTextContent('Level 1');
  });

  it('should display SB/BB', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('blinds')).toHaveTextContent('100/200');
  });

  it('should display ante when present', () => {
    render(<BlindInfo level={1} blindLevel={mockBlindLevel} />);
    expect(screen.getByTestId('ante')).toHaveTextContent('Ante: 25');
  });

  it('should not display ante when 0', () => {
    render(<BlindInfo level={1} blindLevel={{ ...mockBlindLevel, ante: 0 }} />);
    expect(screen.queryByTestId('ante')).not.toBeInTheDocument();
  });

  it('should format large values with K suffix', () => {
    const largeBlind = { smallBlind: 1000, bigBlind: 2000, ante: 200 };
    render(<BlindInfo level={1} blindLevel={largeBlind} />);
    expect(screen.getByTestId('blinds')).toHaveTextContent('1K/2K');
  });
});
```

#### Step 4.3: TimerControls

```typescript
// src/components/TimerControls/TimerControls.test.tsx
describe('TimerControls', () => {
  const defaultProps = {
    status: 'idle' as const,
    isOnBreak: false,
    hasNextLevel: true,
    hasPrevLevel: false,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onReset: vi.fn(),
    onNextLevel: vi.fn(),
    onPrevLevel: vi.fn(),
    onSkipBreak: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Start/Pause button', () => {
    it('should show "Start" when idle', () => {
      render(<TimerControls {...defaultProps} status="idle" />);
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should show "Pause" when running', () => {
      render(<TimerControls {...defaultProps} status="running" />);
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should show "Resume" when paused', () => {
      render(<TimerControls {...defaultProps} status="paused" />);
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should call onStart when clicked in idle state', async () => {
      render(<TimerControls {...defaultProps} status="idle" />);
      await userEvent.click(screen.getByRole('button', { name: /start/i }));
      expect(defaultProps.onStart).toHaveBeenCalled();
    });

    it('should call onPause when clicked in running state', async () => {
      render(<TimerControls {...defaultProps} status="running" />);
      await userEvent.click(screen.getByRole('button', { name: /pause/i }));
      expect(defaultProps.onPause).toHaveBeenCalled();
    });
  });

  describe('Reset button', () => {
    it('should call onReset when clicked', async () => {
      render(<TimerControls {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: /reset/i }));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  describe('Level navigation', () => {
    it('should disable prev button when hasPrevLevel is false', () => {
      render(<TimerControls {...defaultProps} hasPrevLevel={false} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('should disable next button when hasNextLevel is false', () => {
      render(<TimerControls {...defaultProps} hasNextLevel={false} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should call onNextLevel when next is clicked', async () => {
      render(<TimerControls {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(defaultProps.onNextLevel).toHaveBeenCalled();
    });

    it('should call onPrevLevel when prev is clicked', async () => {
      render(<TimerControls {...defaultProps} hasPrevLevel={true} />);
      await userEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(defaultProps.onPrevLevel).toHaveBeenCalled();
    });
  });

  describe('Break controls', () => {
    it('should show skip break button when on break', () => {
      render(<TimerControls {...defaultProps} isOnBreak={true} />);
      expect(screen.getByRole('button', { name: /skip break/i })).toBeInTheDocument();
    });

    it('should disable level navigation when on break', () => {
      render(<TimerControls {...defaultProps} isOnBreak={true} hasNextLevel={true} hasPrevLevel={true} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });
});
```

#### Step 4.4: BreakDisplay

```typescript
// src/components/BreakDisplay/BreakDisplay.test.tsx
describe('BreakDisplay', () => {
  it('should display break time remaining', () => {
    render(<BreakDisplay remainingTime={300} />);
    expect(screen.getByTestId('break-time')).toHaveTextContent('05:00');
  });

  it('should display break message', () => {
    render(<BreakDisplay remainingTime={300} />);
    expect(screen.getByText(/break/i)).toBeInTheDocument();
  });

  it('should show skip button', () => {
    const onSkip = vi.fn();
    render(<BreakDisplay remainingTime={300} onSkip={onSkip} />);
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });
});
```

#### Step 4.5: NextLevelInfo

```typescript
// src/components/NextLevelInfo/NextLevelInfo.test.tsx
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
});
```

---

### 統合テスト

```typescript
// src/__tests__/integration/timer-flow.test.tsx
describe('Timer Flow Integration', () => {
  it('should complete a full level cycle', async () => {
    render(<App />);

    // 初期状態の確認
    expect(screen.getByTestId('timer-status')).toHaveTextContent('idle');

    // タイマー開始
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByTestId('timer-status')).toHaveTextContent('running');

    // 一時停止
    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(screen.getByTestId('timer-status')).toHaveTextContent('paused');

    // 再開
    await userEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(screen.getByTestId('timer-status')).toHaveTextContent('running');

    // 次のレベルへ手動遷移
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('level-number')).toHaveTextContent('Level 2');
  });

  it('should handle break flow', async () => {
    // 休憩設定ありでレンダリング
    render(<App initialBreakConfig={{ enabled: true, frequency: 2, duration: 300 }} />);

    // レベル2まで進める
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // 休憩表示の確認
    expect(screen.getByTestId('break-display')).toBeInTheDocument();

    // 休憩スキップ
    await userEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.queryByTestId('break-display')).not.toBeInTheDocument();
  });
});
```

---

## 完了条件

### Phase 3A 完了条件

- [ ] useTimer フックが実装され、全テストがパス
- [ ] タイマー制御（start, pause, toggle, reset）が動作
- [ ] レベル操作（nextLevel, prevLevel）が動作
- [ ] 自動レベル進行が動作
- [ ] 休憩処理（休憩判定、スキップ）が動作
- [ ] Team C が useTimer の状態を監視可能

### Phase 4 完了条件

- [ ] TimerDisplay が実装され、テストがパス
- [ ] BlindInfo が実装され、テストがパス
- [ ] TimerControls が実装され、テストがパス
- [ ] BreakDisplay が実装され、テストがパス
- [ ] NextLevelInfo が実装され、テストがパス
- [ ] 統合テストがパス

---

## Team C との連携

### 提供するもの

Team C の `useAudioNotification` が監視する状態:

| 状態                        | 用途                         |
| --------------------------- | ---------------------------- |
| `state.timer.remainingTime` | 警告音トリガー（60秒、30秒） |
| `state.isOnBreak`           | 休憩開始音トリガー           |
| `state.currentLevel`        | レベル変更音トリガー         |

### 連携テスト

```typescript
// Team C と共同でテスト
describe('Timer + Audio integration', () => {
  it('should trigger warning at 60 seconds', async () => {
    // useAudioNotification のモックを使用
    const { result } = renderHook(
      () => {
        const timer = useTimer();
        useAudioNotification(); // Team C 提供
        return timer;
      },
      { wrapper: AllProviders }
    );

    // タイマーを60秒まで進める
    // ...

    expect(AudioService.playWarning1Min).toHaveBeenCalled();
  });
});
```

---

## 参照ドキュメント一覧

| ドキュメント                                                        | 必須度   | 内容                    |
| ------------------------------------------------------------------- | -------- | ----------------------- |
| [features/timer.md](../specs/features/timer.md)                     | **必読** | タイマー機能の詳細仕様  |
| [04-interface-definitions.md](../specs/04-interface-definitions.md) | **必読** | Context連携、休憩フロー |
| [03-design-system.md](../specs/03-design-system.md)                 | **必読** | UI設計、タイポグラフィ  |
| [02-data-models.md](../specs/02-data-models.md)                     | 参照     | 型定義詳細              |
| [features/blinds.md](../specs/features/blinds.md)                   | 参照     | ブラインド表示仕様      |

---

## 改訂履歴

| バージョン | 日付       | 変更内容 | 作成者               |
| ---------- | ---------- | -------- | -------------------- |
| 1.0        | 2026-01-26 | 初版作成 | システムアーキテクト |
