import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <Toggle label="Enable feature" value={false} onChange={mockOnChange} />
    );

    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('renders as unchecked when value is false', () => {
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle.className).not.toContain('active');
  });

  it('renders as checked when value is true', () => {
    render(<Toggle label="Test toggle" value={true} onChange={mockOnChange} />);

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle.className).toContain('active');
  });

  it('calls onChange when clicked', () => {
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange when Space key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    toggle.focus();
    await user.keyboard(' ');

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled and clicked', () => {
    render(
      <Toggle
        label="Test toggle"
        value={false}
        onChange={mockOnChange}
        disabled
      />
    );

    const toggle = screen.getByTestId('toggle-switch');
    fireEvent.click(toggle);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when disabled and Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Toggle
        label="Test toggle"
        value={false}
        onChange={mockOnChange}
        disabled
      />
    );

    const toggle = screen.getByTestId('toggle-switch');
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('has disabled class when disabled', () => {
    render(
      <Toggle
        label="Test toggle"
        value={false}
        onChange={mockOnChange}
        disabled
      />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle.className).toContain('disabled');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
  });

  it('is not focusable when disabled', () => {
    render(
      <Toggle
        label="Test toggle"
        value={false}
        onChange={mockOnChange}
        disabled
      />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('tabIndex', '-1');
  });

  it('is focusable when not disabled', () => {
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('tabIndex', '0');
  });

  it('has proper ARIA attributes', () => {
    render(
      <Toggle
        label="Test toggle"
        value={true}
        onChange={mockOnChange}
        aria-label="Custom label"
      />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('role', 'switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Custom label');
  });

  it('uses label as aria-label when aria-label is not provided', () => {
    render(
      <Toggle label="Test toggle" value={false} onChange={mockOnChange} />
    );

    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('aria-label', 'Test toggle');
  });
});
