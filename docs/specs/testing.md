# テスト戦略

## 1. 概要

本ドキュメントでは、ポーカーブラインドタイマーのテスト戦略、テストレベル、テストツール、テストケースについて説明します。

## 2. テストピラミッド

```
        ┌─────────────┐
        │   E2E Test  │  少数（クリティカルパスのみ）
        └─────────────┘
       ┌───────────────┐
       │Integration Test│ 中程度（コンポーネント統合）
       └───────────────┘
     ┌───────────────────┐
     │   Unit Test       │ 多数（ビジネスロジック）
     └───────────────────┘
```

## 3. テストツール

### 3.1 テストフレームワーク

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Vitest | ^1.0.0 | テストランナー・アサーション |
| @testing-library/react | ^14.0.0 | Reactコンポーネントテスト |
| @testing-library/user-event | ^14.0.0 | ユーザー操作シミュレーション |
| @testing-library/jest-dom | ^6.0.0 | DOMマッチャー |

### 3.2 テスト実行環境

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### 3.3 設定ファイル

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
});
```

## 4. 単体テスト（Unit Test）

### 4.1 対象

- ドメインロジック
- ユーティリティ関数
- バリデーション関数
- データ変換関数

### 4.2 テストケース例

#### 4.2.1 時間フォーマット

```typescript
// tests/unit/utils/timeFormat.test.ts
import { describe, it, expect } from 'vitest';
import { formatTime, formatLongTime } from '@/utils/timeFormat';

describe('timeFormat', () => {
  describe('formatTime', () => {
    it('0秒は00:00', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('59秒は00:59', () => {
      expect(formatTime(59)).toBe('00:59');
    });

    it('60秒は01:00', () => {
      expect(formatTime(60)).toBe('01:00');
    });

    it('599秒は09:59', () => {
      expect(formatTime(599)).toBe('09:59');
    });

    it('600秒は10:00', () => {
      expect(formatTime(600)).toBe('10:00');
    });
  });

  describe('formatLongTime', () => {
    it('3661秒は1:01:01', () => {
      expect(formatLongTime(3661)).toBe('1:01:01');
    });

    it('60秒未満はformatTimeと同じ', () => {
      expect(formatLongTime(59)).toBe('00:59');
    });
  });
});
```

#### 4.2.2 ブラインドレベルバリデーション

```typescript
// tests/unit/domain/BlindLevel.test.ts
import { describe, it, expect } from 'vitest';
import { isValidBlindLevel, formatBlindLevel } from '@/domain/models/BlindLevel';

describe('BlindLevel', () => {
  describe('isValidBlindLevel', () => {
    it('正常なレベルはtrue', () => {
      expect(isValidBlindLevel({ smallBlind: 25, bigBlind: 50, ante: 0 })).toBe(true);
    });

    it('SBが0以下はfalse', () => {
      expect(isValidBlindLevel({ smallBlind: 0, bigBlind: 50, ante: 0 })).toBe(false);
      expect(isValidBlindLevel({ smallBlind: -10, bigBlind: 50, ante: 0 })).toBe(false);
    });

    it('BBがSBより小さいとfalse', () => {
      expect(isValidBlindLevel({ smallBlind: 100, bigBlind: 50, ante: 0 })).toBe(false);
    });

    it('anteが負の数はfalse', () => {
      expect(isValidBlindLevel({ smallBlind: 25, bigBlind: 50, ante: -5 })).toBe(false);
    });
  });

  describe('formatBlindLevel', () => {
    it('anteなしは"SB/BB"', () => {
      expect(formatBlindLevel({ smallBlind: 25, bigBlind: 50, ante: 0 })).toBe('25/50');
    });

    it('anteありは"SB/BB (Ante: X)"', () => {
      expect(formatBlindLevel({ smallBlind: 25, bigBlind: 50, ante: 10 }))
        .toBe('25/50 (Ante: 10)');
    });
  });
});
```

#### 4.2.3 休憩ロジック

```typescript
// tests/unit/domain/Tournament.test.ts
import { describe, it, expect } from 'vitest';
import { shouldTakeBreak, getLevelsUntilNextBreak } from '@/domain/models/Tournament';
import { BreakConfig } from '@/types/domain';

describe('Tournament - Break Logic', () => {
  const breakConfig: BreakConfig = {
    enabled: true,
    frequency: 4,
    duration: 10,
  };

  describe('shouldTakeBreak', () => {
    it('4レベルごとに休憩', () => {
      expect(shouldTakeBreak(0, breakConfig)).toBe(false);
      expect(shouldTakeBreak(3, breakConfig)).toBe(false);
      expect(shouldTakeBreak(4, breakConfig)).toBe(true);
      expect(shouldTakeBreak(7, breakConfig)).toBe(false);
      expect(shouldTakeBreak(8, breakConfig)).toBe(true);
    });

    it('休憩無効時は常にfalse', () => {
      const disabled = { ...breakConfig, enabled: false };
      expect(shouldTakeBreak(4, disabled)).toBe(false);
    });
  });

  describe('getLevelsUntilNextBreak', () => {
    it('次の休憩までのレベル数を計算', () => {
      expect(getLevelsUntilNextBreak(0, breakConfig)).toBe(3);
      expect(getLevelsUntilNextBreak(1, breakConfig)).toBe(2);
      expect(getLevelsUntilNextBreak(2, breakConfig)).toBe(1);
      expect(getLevelsUntilNextBreak(3, breakConfig)).toBe(0);
      expect(getLevelsUntilNextBreak(4, breakConfig)).toBe(3);
    });
  });
});
```

#### 4.2.4 Preset バリデーション

```typescript
// tests/unit/domain/Preset.test.ts
import { describe, it, expect } from 'vitest';
import { isValidPreset, generatePresetId } from '@/domain/models/Preset';
import { createMockPreset } from '@/tests/mockData';

describe('Preset', () => {
  describe('isValidPreset', () => {
    it('正常なプリセットはtrue', () => {
      const preset = createMockPreset();
      expect(isValidPreset(preset)).toBe(true);
    });

    it('名前が空はfalse', () => {
      const preset = createMockPreset({ name: '' });
      expect(isValidPreset(preset)).toBe(false);
    });

    it('レベルが0個はfalse', () => {
      const preset = createMockPreset({ blindLevels: [] });
      expect(isValidPreset(preset)).toBe(false);
    });

    it('レベル時間が範囲外はfalse', () => {
      const preset = createMockPreset({ levelDuration: 30 }); // 30秒
      expect(isValidPreset(preset)).toBe(false);

      const preset2 = createMockPreset({ levelDuration: 4000 }); // 66分超
      expect(isValidPreset(preset2)).toBe(false);
    });
  });

  describe('generatePresetId', () => {
    it('ユニークなIDを生成', () => {
      const id1 = generatePresetId();
      const id2 = generatePresetId();
      expect(id1).not.toBe(id2);
    });

    it('プレフィックスを含む', () => {
      const id = generatePresetId();
      expect(id).toMatch(/^preset_/);
    });
  });
});
```

### 4.3 カバレッジ目標

- **ドメインロジック**: 90%以上
- **ユーティリティ**: 85%以上
- **全体**: 70%以上

## 5. 統合テスト（Integration Test）

### 5.1 対象

- Reactコンポーネント
- カスタムフック
- Context + Reducer

### 5.2 テストケース例

#### 5.2.1 TimerDisplay コンポーネント

```typescript
// tests/integration/components/TimerDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimerDisplay } from '@/ui/components/timer/TimerDisplay';
import { TournamentProvider } from '@/context/TournamentContext';

describe('TimerDisplay', () => {
  it('残り時間を表示', () => {
    render(
      <TournamentProvider>
        <TimerDisplay />
      </TournamentProvider>
    );

    // 初期状態は10:00（600秒）
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('経過時間を表示', () => {
    render(
      <TournamentProvider>
        <TimerDisplay />
      </TournamentProvider>
    );

    expect(screen.getByText('経過時間')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });
});
```

#### 5.2.2 useTimer フック

```typescript
// tests/integration/hooks/useTimer.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTimer } from '@/ui/hooks/useTimer';
import { TournamentProvider } from '@/context/TournamentContext';

describe('useTimer', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TournamentProvider>{children}</TournamentProvider>
  );

  it('タイマーを開始できる', () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.timer.status).toBe('idle');

    act(() => {
      result.current.start();
    });

    expect(result.current.timer.status).toBe('running');
  });

  it('タイマーを一時停止できる', () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.timer.status).toBe('paused');
  });

  it('タイマーをリセットできる', () => {
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.timer.status).toBe('idle');
    expect(result.current.timer.remainingTime).toBe(600); // 10分
  });
});
```

#### 5.2.3 ブラインド編集

```typescript
// tests/integration/components/BlindEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BlindEditor } from '@/ui/components/settings/BlindEditor';

describe('BlindEditor', () => {
  it('レベルを追加できる', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BlindEditor
        levels={[{ smallBlind: 25, bigBlind: 50, ante: 0 }]}
        onChange={onChange}
      />
    );

    const addButton = screen.getByText('+ レベルを追加');
    await user.click(addButton);

    // 2レベルになっている
    const levelRows = screen.getAllByRole('row');
    expect(levelRows.length).toBe(3); // ヘッダー + 2レベル
  });

  it('レベルを削除できる', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BlindEditor
        levels={[
          { smallBlind: 25, bigBlind: 50, ante: 0 },
          { smallBlind: 50, bigBlind: 100, ante: 0 },
        ]}
        onChange={onChange}
      />
    );

    const deleteButtons = screen.getAllByText('削除');
    await user.click(deleteButtons[0]);

    // 保存ボタンをクリック
    await user.click(screen.getByText('保存'));

    // onChangeが呼ばれた
    expect(onChange).toHaveBeenCalled();
  });
});
```

## 6. E2Eテスト（End-to-End Test）

### 6.1 対象

クリティカルパスのみ：

1. トーナメント開始から終了まで
2. プリセット選択からタイマー開始
3. キーボードショートカット操作

### 6.2 ツール

**Playwright**（推奨）または **Cypress**

### 6.3 テストシナリオ例

#### 6.3.1 基本フロー

```typescript
// tests/e2e/basic-flow.spec.ts
import { test, expect } from '@playwright/test';

test('トーナメントの基本フロー', async ({ page }) => {
  // 1. アプリ起動
  await page.goto('http://localhost:5173');

  // 2. デフォルトプリセット（スタンダード）を確認
  await expect(page.locator('text=Level 1')).toBeVisible();
  await expect(page.locator('text=25/50')).toBeVisible();

  // 3. タイマー開始
  await page.click('button:has-text("開始")');
  await expect(page.locator('text=一時停止')).toBeVisible();

  // 4. 残り時間が減っていることを確認
  await page.waitForTimeout(2000);
  const timer = page.locator('[role="timer"]');
  const time = await timer.textContent();
  expect(time).not.toBe('10:00');

  // 5. 一時停止
  await page.click('button:has-text("一時停止")');
  await expect(page.locator('text=再開')).toBeVisible();

  // 6. 次のレベルへ手動移動
  await page.click('button:has-text("次へ →")');
  await expect(page.locator('text=Level 2')).toBeVisible();
  await expect(page.locator('text=50/100')).toBeVisible();
});
```

#### 6.3.2 プリセット管理

```typescript
test('プリセット作成と読み込み', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. 設定を開く
  await page.click('button[aria-label*="設定"]');

  // 2. プリセットタブ
  await page.click('text=プリセット');

  // 3. 新規作成
  await page.click('text=新規作成');

  // 4. プリセット名を入力
  await page.fill('input[placeholder*="プリセット名"]', 'テスト用');

  // 5. 保存
  await page.click('button:has-text("保存")');

  // 6. プリセット一覧に表示されることを確認
  await expect(page.locator('text=テスト用')).toBeVisible();

  // 7. 読み込み
  await page.click('text=テスト用 >> .. >> button:has-text("読み込み")');

  // 8. 確認ダイアログ
  page.on('dialog', dialog => dialog.accept());
});
```

#### 6.3.3 キーボードショートカット

```typescript
test('キーボードショートカットで操作', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Spaceでタイマー開始
  await page.keyboard.press('Space');
  await expect(page.locator('text=一時停止')).toBeVisible();

  // 2. →キーで次のレベル
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('text=Level 2')).toBeVisible();

  // 3. ←キーで前のレベル
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('text=Level 1')).toBeVisible();

  // 4. Rキーでリセット
  page.on('dialog', dialog => dialog.accept());
  await page.keyboard.press('r');
  await expect(page.locator('[role="timer"]')).toHaveText('10:00');

  // 5. ?キーでヘルプ
  await page.keyboard.press('?');
  await expect(page.locator('text=キーボードショートカット')).toBeVisible();
});
```

## 7. テストカバレッジレポート

### 7.1 カバレッジ取得

```bash
npm run test:coverage
```

### 7.2 レポート形式

- **コンソール**: テキスト形式の概要
- **HTML**: ブラウザで確認可能な詳細レポート（`coverage/index.html`）
- **LCOV**: CI/CDツールとの統合用

## 8. CI/CD統合

### 8.1 GitHub Actions 例

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 9. テストデータ

### 9.1 モックデータ

```typescript
// tests/mockData.ts
import { Preset, BlindLevel, Tournament } from '@/types/domain';

export function createMockBlindLevel(overrides?: Partial<BlindLevel>): BlindLevel {
  return {
    smallBlind: 25,
    bigBlind: 50,
    ante: 0,
    ...overrides,
  };
}

export function createMockPreset(overrides?: Partial<Preset>): Preset {
  return {
    id: 'test-preset-id' as PresetId,
    name: 'Test Preset',
    type: 'custom',
    levelDuration: 600,
    breakConfig: {
      enabled: false,
      frequency: 4,
      duration: 10,
    },
    blindLevels: [
      createMockBlindLevel(),
      createMockBlindLevel({ smallBlind: 50, bigBlind: 100 }),
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockTournament(overrides?: Partial<Tournament>): Tournament {
  return {
    currentLevel: 0,
    blindLevels: [createMockBlindLevel()],
    levelDuration: 600,
    timer: {
      status: 'idle',
      remainingTime: 600,
      elapsedTime: 0,
      startTime: null,
      pausedAt: null,
    },
    breakConfig: {
      enabled: false,
      frequency: 4,
      duration: 10,
    },
    isBreak: false,
    activePresetId: null,
    ...overrides,
  };
}
```

## 10. テスト実行ガイドライン

### 10.1 テスト駆動開発（TDD）

1. テストを先に書く（Red）
2. 最小限の実装で通す（Green）
3. リファクタリング（Refactor）

### 10.2 テスト命名規則

```typescript
// ✅ 良い例
describe('formatTime', () => {
  it('60秒は01:00に変換される', () => {
    expect(formatTime(60)).toBe('01:00');
  });
});

// ❌ 悪い例
describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

### 10.3 テストの独立性

各テストは独立して実行可能にする：

- **beforeEach**: テストごとに状態をリセット
- **afterEach**: クリーンアップ
- **モック**: テスト間で共有しない

## 11. まとめ

テスト戦略の主要なポイント：

1. **テストピラミッド**: 単体テスト中心、E2Eは最小限
2. **ツール**: Vitest + React Testing Library
3. **カバレッジ**: ドメインロジック90%以上
4. **CI/CD**: 自動テスト実行
5. **テストデータ**: モックデータで再利用性向上

---

## 関連ドキュメント

- [01-architecture.md](./01-architecture.md) - テスト対象のアーキテクチャ
- [deployment.md](./deployment.md) - CI/CD統合

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI QA Engineer |
