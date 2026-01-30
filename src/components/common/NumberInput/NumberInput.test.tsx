import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <NumberInput label="Level time" value={10} onChange={mockOnChange} />
    );

    expect(screen.getByText('Level time')).toBeInTheDocument();
  });

  it('renders with unit', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        unit="分"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('分')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(
      <NumberInput label="Level time" value={15} onChange={mockOnChange} />
    );

    const input = screen.getByTestId('number-input') as HTMLInputElement;
    expect(input.value).toBe('15');
  });

  it('calls onChange when value changes', () => {
    render(
      <NumberInput label="Level time" value={10} onChange={mockOnChange} />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '15' } });

    expect(mockOnChange).toHaveBeenCalledWith(15);
  });

  it('increments value when increment button is clicked', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        step={1}
        onChange={mockOnChange}
      />
    );

    const incrementButton = screen.getByTestId('increment-button');
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(11);
  });

  it('decrements value when decrement button is clicked', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        step={1}
        onChange={mockOnChange}
      />
    );

    const decrementButton = screen.getByTestId('decrement-button');
    fireEvent.click(decrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(9);
  });

  it('respects min value', () => {
    render(
      <NumberInput
        label="Level time"
        value={5}
        min={5}
        onChange={mockOnChange}
      />
    );

    const decrementButton = screen.getByTestId('decrement-button');
    expect(decrementButton).toBeDisabled();
  });

  it('respects max value', () => {
    render(
      <NumberInput
        label="Level time"
        value={20}
        max={20}
        onChange={mockOnChange}
      />
    );

    const incrementButton = screen.getByTestId('increment-button');
    expect(incrementButton).toBeDisabled();
  });

  it('shows error message when value is below min', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        min={5}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '3' } });

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      '最小値は5です'
    );
  });

  it('shows error message when value is above max', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        max={20}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '25' } });

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      '最大値は20です'
    );
  });

  it('shows error message when value is not a number', () => {
    render(
      <NumberInput label="Level time" value={10} onChange={mockOnChange} />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      '数値を入力してください'
    );
  });

  it('clamps value to min on blur', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        min={5}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.blur(input);

    expect(input.value).toBe('5');
    expect(mockOnChange).toHaveBeenLastCalledWith(5);
  });

  it('clamps value to max on blur', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        max={20}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.blur(input);

    expect(input.value).toBe('20');
    expect(mockOnChange).toHaveBeenLastCalledWith(20);
  });

  it('resets to previous value on blur when input is invalid', () => {
    render(
      <NumberInput label="Level time" value={10} onChange={mockOnChange} />
    );

    const input = screen.getByTestId('number-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(input.value).toBe('10');
  });

  it('uses custom step value', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        step={5}
        onChange={mockOnChange}
      />
    );

    const incrementButton = screen.getByTestId('increment-button');
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(15);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByTestId('number-input');
    expect(input).toBeDisabled();

    const incrementButton = screen.getByTestId('increment-button');
    const decrementButton = screen.getByTestId('decrement-button');
    expect(incrementButton).toBeDisabled();
    expect(decrementButton).toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        onChange={mockOnChange}
        aria-label="Custom label"
      />
    );

    const input = screen.getByTestId('number-input');
    expect(input).toHaveAttribute('aria-label', 'Custom label');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('sets aria-invalid to true when there is an error', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        min={5}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '3' } });

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('has aria-describedby pointing to error message when there is an error', () => {
    render(
      <NumberInput
        label="Level time"
        value={10}
        min={5}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '3' } });

    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(screen.getByTestId('error-message')).toHaveAttribute('id', errorId);
  });
});
