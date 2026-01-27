import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('should display current theme', () => {
    render(<ThemeToggle theme="dark" onChange={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/dark|ダーク/i);
  });

  it('should toggle theme on click', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle theme="dark" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('should toggle from light to dark', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle theme="light" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('should display light theme text', () => {
    render(<ThemeToggle theme="light" onChange={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/light|ライト/i);
  });

  it('should have proper aria-label', () => {
    render(<ThemeToggle theme="dark" onChange={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
