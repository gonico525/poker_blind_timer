# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working on the Poker Blind Timer codebase.

## Project Overview

A browser-based poker blind timer for No-Limit Hold'em tournaments. The application is:
- **Client-side only** - No backend, runs entirely in the browser
- **Offline-first** - All data persisted in localStorage
- **PWA-enabled** - Installable with offline support via service worker
- **Japanese localized** - Documentation and UI text in Japanese (button labels in English)
- **Deployed on GitHub Pages** - Base path `/poker_blind_timer/`

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| TypeScript | 5.9.3 | Type-safe development |
| Vite | 7.3.1 | Build tool & dev server |
| Vitest | 4.0.18 | Unit/integration testing |
| React Testing Library | 16.3.2 | Component testing |
| ESLint | 9.39.2 | Linting (Flat Config) |
| Prettier | 3.8.1 | Code formatting |
| Husky | 9.0.11 | Git hooks |
| vite-plugin-pwa | 1.2.0 | PWA support |
| lint-staged | 16.2.7 | Pre-commit formatting |

## Quick Commands

```bash
npm run dev          # Start development server
npm run build        # TypeScript check + Vite build
npm test             # Run Vitest (watch mode)
npm run test:ui      # Vitest with UI
npm run test:coverage # Coverage report
npm run lint         # ESLint (zero warnings policy)
npm run format       # Prettier format
npm run format:check # Prettier check
```

## Architecture

### Three-Layer Architecture

```
UI Layer (React components, contexts, hooks)
    ↓ depends on
Services Layer (AudioService, KeyboardService, StorageService)
    ↓ depends on
Domain Layer (Pure business logic - AverageStack, Break, Structure)
```

**Dependency rules:**
- Upper layers may depend on lower layers
- Lower layers must NOT depend on upper layers
- Domain layer has zero external dependencies

### Directory Structure

```
src/
├── components/         # React components
│   ├── common/         # 7 reusable UI components
│   │   ├── ConfirmDialog/
│   │   ├── Dropdown/
│   │   ├── Modal/
│   │   ├── NumberInput/
│   │   ├── Slider/
│   │   ├── Toggle/
│   │   └── UpdatePrompt/
│   ├── AppHeader/
│   ├── AverageStackDisplay/
│   ├── BlindEditor/
│   ├── BlindInfo/
│   ├── BreakDisplay/
│   ├── ErrorScreen/
│   ├── ImportExport/
│   ├── LoadingScreen/
│   ├── MainLayout/
│   ├── NextLevelInfo/
│   ├── SettingsPanel/
│   ├── StructureManagement/
│   ├── StructureManager/
│   ├── StructureSelector/
│   ├── ThemeToggle/
│   ├── TimerControls/
│   ├── TimerDisplay/
│   └── VolumeControl/
├── contexts/           # React Context for state management
│   ├── TournamentContext.tsx  # Timer, blind levels, breaks, player counts
│   ├── SettingsContext.tsx    # Theme, audio, keyboard
│   └── NotificationContext.tsx # Toast/confirm dialogs
├── hooks/              # Custom React hooks (4 hooks)
│   ├── useAudioNotification.ts  # Audio notification management
│   ├── useKeyboardShortcuts.ts  # Keyboard shortcut handling
│   ├── useStructures.ts         # Structure CRUD management
│   └── useTimer.ts              # Timer state management
├── services/           # Browser API abstractions
│   ├── AudioService.ts      # Sound playback
│   ├── KeyboardService.ts   # Keyboard shortcuts
│   ├── StorageService.ts    # localStorage wrapper
│   └── __mocks__/           # Service mocks for testing
├── domain/models/      # Pure business logic
│   ├── AverageStack.ts      # Average stack calculation
│   ├── Break.ts             # Break interval logic
│   └── Structure.ts         # Structure management logic
├── types/              # TypeScript type definitions
│   ├── domain.ts            # Core domain types
│   ├── context.ts           # Context/action types
│   ├── notification.ts      # Notification types
│   └── storage.ts           # Storage schema types
├── utils/              # Utility functions & constants
│   ├── blindFormat.ts       # Blind level formatting
│   ├── constants.ts         # App-wide constants
│   ├── timeFormat.ts        # Time formatting
│   └── validation.ts        # Input validation
├── test/               # Test setup files
│   ├── setup.ts             # Vitest setup
│   └── mocks/pwa-register.ts
└── assets/             # Static assets (logo)
```

### Public Assets

```
public/
├── sounds/             # Audio files
│   ├── level-change.mp3
│   ├── warning-1min.mp3
│   └── break-start.mp3
├── icons/              # PWA icons (192, 512, maskable, apple-touch)
└── .nojekyll           # GitHub Pages config
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TimerDisplay`, `BlindEditor` |
| Component files | PascalCase.tsx | `TimerDisplay.tsx` |
| Hooks | camelCase with `use` prefix | `useTimer`, `useStructures` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEYS`, `LIMITS` |
| Functions | camelCase | `formatTime`, `validateInput` |
| Types/Interfaces | PascalCase | `BlindLevel`, `TimerStatus` |
| CSS Modules | *.module.css | `TimerDisplay.module.css` |
| Test files | *.test.tsx / *.test.ts | `TimerDisplay.test.tsx` |

## Code Style

Enforced by Prettier (`.prettierrc`):
- Semicolons: required
- Quotes: single quotes
- Trailing commas: ES5 style
- Print width: 80 characters
- Tab width: 2 spaces
- Arrow parens: always

ESLint rules (Flat Config):
- Zero warnings policy (`--max-warnings 0`)
- Unused vars prefixed with `_` are allowed
- React Hooks rules enforced
- TypeScript strict mode

## Component Patterns

### File Co-location

Each component directory contains:
```
ComponentName/
├── ComponentName.tsx        # Component logic
├── ComponentName.module.css # Scoped styles
├── ComponentName.test.tsx   # Tests
└── index.ts                 # Re-export
```

### Component Types

**Presentational (stateless):**
```typescript
interface Props {
  value: number;
  onChange: (value: number) => void;
}

export const NumberInput: React.FC<Props> = ({ value, onChange }) => {
  // Pure rendering, no state
};
```

**Container (stateful):**
```typescript
export const TimerDisplay: React.FC = () => {
  const { state, dispatch } = useTournament();
  // Uses context for state
};
```

### State Management Pattern

Uses Context + Reducer pattern:
```typescript
// Discriminated union actions
type Action =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'TICK'; payload: { deltaTime: number } };

// Reducer in context
const [state, dispatch] = useReducer(reducer, initialState);
```

## Testing Patterns

### Test File Location

Tests are co-located with source files:
```
src/components/Timer/Timer.tsx
src/components/Timer/Timer.test.tsx
```

### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByTestId('element')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});
```

### Test Attributes

- Use `data-testid` for element selection
- Use `data-status`, `data-warning` for state testing
- Use semantic queries (`getByRole`, `getByLabelText`) when possible

### Service Mocks

Service mocks live in `src/services/__mocks__/` for consistent test isolation.

## Path Aliases

The `@` alias points to `src/`:
```typescript
import { BlindLevel } from '@/types';
import { formatTime } from '@/utils';
```

## Key Types

Located in `src/types/domain.ts`:

```typescript
interface BlindLevel {
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly ante: number;
}

type TimerStatus = 'idle' | 'running' | 'paused';

interface Timer {
  status: TimerStatus;
  remainingTime: number;
  elapsedTime: number;
  startTime: number | null;
  pausedAt: number | null;
}

type StructureType = 'default' | 'standard' | 'turbo' | 'deepstack' | 'custom';

interface Structure {
  id: StructureId;
  name: string;
  type: StructureType;
  blindLevels: BlindLevel[];
  levelDuration: number;
  breakConfig: BreakConfig;
  initialStack: number;    // 0 = unset
  createdAt: number;
  updatedAt: number;
}

interface BreakConfig {
  readonly enabled: boolean;
  readonly frequency: number;
  readonly duration: number;
}

interface TournamentState {
  timer: Timer;
  currentLevel: number;
  blindLevels: BlindLevel[];
  breakConfig: BreakConfig;
  levelDuration: number;
  isOnBreak: boolean;
  totalPlayers: number;      // 0 = unset
  remainingPlayers: number;
  initialStack: number;
}

type Theme = 'light' | 'dark';

interface Settings {
  theme: Theme;
  soundEnabled: boolean;
  volume: number;
  keyboardShortcutsEnabled: boolean;
}
```

## Services

### AudioService
- Preloads audio files on initialization
- Plays level-change, warning, break sounds
- Handles volume and enable/disable

### StorageService
- Wraps localStorage API
- Handles quota errors
- Validates data on load

### KeyboardService
- Manages global keyboard shortcuts
- Initialize/cleanup on mount/unmount

## Domain Models

### AverageStack
- Calculates average stack based on total players, remaining players, and initial stack
- Pure calculation logic with no dependencies

### Break
- Determines when breaks should occur based on break config and current level
- Break interval logic

### Structure
- Tournament structure management and validation
- Default structure generation

## Constants

Located in `src/utils/constants.ts`:

```typescript
STORAGE_KEYS = { SETTINGS, STRUCTURES, TOURNAMENT_STATE }
LIMITS = { MAX_STRUCTURES: 20, MAX_BLIND_LEVELS: 50, ... }
DEFAULTS = { LEVEL_DURATION: 600, BREAK_DURATION: 600, ... }
AUDIO_FILES = { LEVEL_CHANGE, WARNING_1MIN, BREAK_START }
```

## Git Commit Convention

```
feat: New feature
fix: Bug fix
docs: Documentation update
style: Code formatting (no logic change)
refactor: Code refactoring
test: Test additions/fixes
chore: Build/config changes
```

## CI/CD

### GitHub Actions (`ci.yml`)

Runs on push/PR to `main` and `develop`:
1. Lint check (ESLint + Prettier)
2. Tests (Vitest with `--run` flag)
3. Build verification (`tsc` + `vite build`)
4. Coverage report (Codecov) - separate job

### GitHub Pages Deployment (`deploy.yml`)

Runs on push to `main` + manual trigger:
1. Run tests and build
2. Deploy `dist/` to GitHub Pages

### Pre-commit hooks (Husky + lint-staged)

Configured in `.lintstagedrc.json`:
- `*.{ts,tsx}`: ESLint fix + Prettier format
- `*.{css,md,json}`: Prettier format

## Documentation

```
docs/
├── urs/           # User requirements specification
├── specs/         # Technical specifications
│   ├── 01-architecture.md
│   ├── 02-data-models.md
│   ├── 03-design-system.md
│   ├── 04-interface-definitions.md
│   ├── deployment.md
│   ├── testing.md
│   └── features/  # Feature-specific specs (7 specs)
├── plans/         # Implementation plans (13 plans)
├── reports/       # Completion reports (43 reports)
└── reviews/       # Code/spec reviews (5 reviews)
```

## Common Pitfalls

1. **Don't add `any` types** - Use proper TypeScript types
2. **Don't skip tests** - All new code needs tests
3. **Run lint before commit** - Zero warnings policy
4. **Use CSS Modules** - No global CSS for components
5. **Context is the state source** - Don't duplicate state
6. **Japanese UI text** - Keep UI strings in Japanese (button labels may be English)
7. **Use unified timer** - `timer.remainingTime` is the single source for both level and break time
8. **Use `Structure` terminology** - Not "Preset" (renamed project-wide)

## Quick Reference

| Need | Location |
|------|----------|
| Add a component | `src/components/<ComponentName>/` |
| Add a common component | `src/components/common/<ComponentName>/` |
| Add a hook | `src/hooks/` |
| Add a type | `src/types/` |
| Add a utility | `src/utils/` |
| Add a test | Co-locate with source file |
| Add business logic | `src/domain/models/` |
| Update global state | `src/contexts/` |
| Add a service | `src/services/` |

## Recent Changes (2026-02)

- **Average stack display** - Multi-phase implementation (phases 1-4) completed: domain logic, state management, UI component, and structure editor integration with initial stack input
- **Timer state unification** - `breakRemainingTime` removed, now uses unified `timer.remainingTime`
- **Terminology change** - "Preset" renamed to "Structure" project-wide
- **English button labels** - Button labels standardized to English with fix for -1 button color
- **CI test fixes** - Test queries updated to match English labels
- **Player tracking** - `totalPlayers`, `remainingPlayers` added to TournamentState
- **Structure enhancements** - `type`, `initialStack`, `createdAt`, `updatedAt` fields added
