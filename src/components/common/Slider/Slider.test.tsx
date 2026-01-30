import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from './Slider';

describe('Slider', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders without label', () => {
    render(<Slider min={0} max={100} value={50} onChange={mockOnChange} />);

    const slider = screen.getByTestId('slider-input');
    expect(slider).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(
      <Slider
        label="Volume"
        min={0}
        max={100}
        value={50}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('displays current value when showValue is true', () => {
    render(
      <Slider
        min={0}
        max={100}
        value={75}
        onChange={mockOnChange}
        showValue={true}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('75');
  });

  it('does not display value when showValue is false', () => {
    render(
      <Slider
        min={0}
        max={100}
        value={75}
        onChange={mockOnChange}
        showValue={false}
      />
    );

    expect(screen.queryByTestId('slider-value')).not.toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    render(<Slider min={0} max={100} value={50} onChange={mockOnChange} />);

    const slider = screen.getByTestId('slider-input');
    fireEvent.change(slider, { target: { value: '75' } });

    expect(mockOnChange).toHaveBeenCalledWith(75);
  });

  it('respects min and max values', () => {
    render(<Slider min={10} max={90} value={50} onChange={mockOnChange} />);

    const slider = screen.getByTestId('slider-input') as HTMLInputElement;
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('uses custom step value', () => {
    render(
      <Slider min={0} max={100} step={5} value={50} onChange={mockOnChange} />
    );

    const slider = screen.getByTestId('slider-input');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('uses default step value when not provided', () => {
    render(<Slider min={0} max={100} value={50} onChange={mockOnChange} />);

    const slider = screen.getByTestId('slider-input');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Slider min={0} max={100} value={50} onChange={mockOnChange} disabled />
    );

    const slider = screen.getByTestId('slider-input');
    expect(slider).toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Slider
        min={0}
        max={100}
        value={50}
        onChange={mockOnChange}
        aria-label="Volume control"
      />
    );

    const slider = screen.getByTestId('slider-input');
    expect(slider).toHaveAttribute('aria-label', 'Volume control');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('uses label as aria-label when aria-label is not provided', () => {
    render(
      <Slider
        label="Volume"
        min={0}
        max={100}
        value={50}
        onChange={mockOnChange}
      />
    );

    const slider = screen.getByTestId('slider-input');
    expect(slider).toHaveAttribute('aria-label', 'Volume');
  });

  it('rounds displayed value to nearest integer', () => {
    render(
      <Slider
        min={0}
        max={100}
        value={75.7}
        onChange={mockOnChange}
        showValue={true}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('76');
  });

  it('handles decimal step values', () => {
    render(
      <Slider min={0} max={1} step={0.1} value={0.5} onChange={mockOnChange} />
    );

    const slider = screen.getByTestId('slider-input');
    fireEvent.change(slider, { target: { value: '0.7' } });

    expect(mockOnChange).toHaveBeenCalledWith(0.7);
  });
});
