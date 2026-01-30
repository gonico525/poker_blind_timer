import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown, type DropdownOption } from './Dropdown';

describe('Dropdown', () => {
  const mockOptions: DropdownOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3', disabled: true },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder when no value is selected', () => {
    render(
      <Dropdown
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders with selected value', () => {
    render(
      <Dropdown value="1" options={mockOptions} onChange={mockOnChange} />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('opens menu when trigger is clicked', async () => {
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });
  });

  it('closes menu when clicking outside', async () => {
    render(
      <div>
        <Dropdown value="" options={mockOptions} onChange={mockOnChange} />
        <button>Outside</button>
      </div>
    );

    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const outsideButton = screen.getByText('Outside');
    fireEvent.mouseDown(outsideButton);

    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });
  });

  it('calls onChange when an option is selected', async () => {
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('dropdown-item');
    fireEvent.click(items[0]);

    expect(mockOnChange).toHaveBeenCalledWith('1');
    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });
  });

  it('does not call onChange when disabled option is selected', async () => {
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('dropdown-item');
    fireEvent.click(items[2]); // disabled option

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('displays check mark for selected option', async () => {
    render(
      <Dropdown value="1" options={mockOptions} onChange={mockOnChange} />
    );

    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('dropdown-item');
    expect(items[0]).toHaveTextContent('✓');
    expect(items[1]).not.toHaveTextContent('✓');
  });

  it('navigates options with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    trigger.focus();

    // Open with ArrowDown (which sets focusedIndex to 0)
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('dropdown-item');
    // First item should be focused after opening with ArrowDown
    expect(items[0].className).toContain('focused');

    // Navigate down again (skip disabled option 3, go to option 2)
    await user.keyboard('{ArrowDown}');
    expect(items[1].className).toContain('focused');
  });

  it('selects option with Enter key', async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    trigger.focus();

    // Open with ArrowDown (which also sets focus to first option)
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    // The first option should already be focused
    // Select with Enter
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith('1');
  });

  it('closes menu with Escape key', async () => {
    const user = userEvent.setup();
    render(<Dropdown value="" options={mockOptions} onChange={mockOnChange} />);

    const trigger = screen.getByTestId('dropdown-trigger');
    trigger.focus();

    // Open
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    // Close with Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <Dropdown
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper ARIA attributes', () => {
    render(
      <Dropdown
        value=""
        options={mockOptions}
        onChange={mockOnChange}
        aria-label="Test dropdown"
      />
    );

    const trigger = screen.getByTestId('dropdown-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-label', 'Test dropdown');
  });
});
