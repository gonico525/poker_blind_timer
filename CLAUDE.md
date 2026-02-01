# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working on the Poker Blind Timer codebase.

## Project Overview

A browser-based poker blind timer for No-Limit Hold'em tournaments. The application is:
- **Client-side only** - No backend, runs entirely in the browser
- **Offline-first** - All data persisted in localStorage
- **Japanese localized** - Documentation and UI text in Japanese

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

## Quick Commands

```bash
npm run dev          # Start development server
npm run build        # TypeScript check + Vite build
npm test             # Run Vitest
npm run test:ui      # Vitest with UI
npm run test:coverage # Coverage report
npm run lint         # ESLint (zero warnings policy)
npm run format       # Prettier format
npm run format:check # Prettier check
```

## Architecture

### Three-Layer Architecture

```
UI Layer (React)
    ↓ depends on
Services Layer (Audio, Keyboard, Storage)
    ↓ depends on
Domain Layer (Pure business logic)
```

**Dependency rules:**
- Upper layers may depend on lower layers
- Lower layers must NOT depend on upper layers
- Domain layer has zero external dependencies

### Directory Structure

```
src/
├── components/     # React components (17 subdirectories)
│   ├── common/     # Reusable UI components (Button, Modal, etc.)
│   ├── timer/      # Timer-related components
│   ├── settings/   # Settings panel components
│   └── ...
├── contexts/       # React Context for state management
│   ├── TournamentContext.tsx  # Timer, blind levels, breaks
│   ├── SettingsContext.tsx    # Theme, audio, keyboard
│   └── NotificationContext.tsx # Toast/confirm dialogs
├── hooks/          # Custom React hooks (9 hooks)
├── services/       # Browser API abstractions
│   ├── AudioService.ts      # Sound playback
│   ├── KeyboardService.ts   # Keyboard shortcuts
│   └── StorageService.ts    # localStorage wrapper
├── domain/models/  # Pure business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions & constants
└── test/           # Test setup files
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

Enforced by Prettier:
- Semicolons: required
- Quotes: single quotes
- Trailing commas: ES5 style
- Print width: 80 characters
- Tab width: 2 spaces
- Arrow parens: always

ESLint rules:
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

## Path Aliases

The `@` alias points to `src/`:
```typescript
import { BlindLevel } from '@/types';
import { formatTime } from '@/utils';
```

## Key Types

Located in `src/types/`:

```typescript
// Core domain types
interface BlindLevel {
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  bbAnte?: boolean;
}

type TimerStatus = 'idle' | 'running' | 'paused';

interface Structure {
  id: string;
  name: string;
  blindLevels: BlindLevel[];
  levelDuration: number;
  breakConfig: BreakConfig;
}

interface BreakConfig {
  enabled: boolean;
  frequency: number;
  duration: number;
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

GitHub Actions runs on push/PR:
1. Lint check (ESLint + Prettier)
2. Tests (Vitest)
3. Build verification
4. Coverage report (Codecov)

Pre-commit hooks (Husky + lint-staged):
- ESLint fix
- Prettier format

## Documentation

```
docs/
├── urs/        # User requirements
├── specs/      # Technical specifications
│   ├── 01-architecture.md
│   ├── 02-data-models.md
│   ├── 03-design-system.md
│   ├── features/  # Feature-specific specs
│   └── testing.md
├── plans/      # Implementation plans
├── reports/    # Completion reports
└── reviews/    # Code/spec reviews
```

## Common Pitfalls

1. **Don't add `any` types** - Use proper TypeScript types
2. **Don't skip tests** - All new code needs tests
3. **Run lint before commit** - Zero warnings policy
4. **Use CSS Modules** - No global CSS for components
5. **Context is the state source** - Don't duplicate state
6. **Japanese UI text** - Keep UI strings in Japanese

## Quick Reference

| Need | Location |
|------|----------|
| Add a component | `src/components/<Category>/` |
| Add a hook | `src/hooks/` |
| Add a type | `src/types/` |
| Add a utility | `src/utils/` |
| Add a test | Co-locate with source file |
| Add business logic | `src/domain/models/` |
| Update global state | `src/contexts/` |

## Recent Changes (2026-02)

- Timer state unification refactoring completed
- `breakRemainingTime` removed, now uses unified `timer.remainingTime`
- Terminology change: "Preset" renamed to "Structure"
