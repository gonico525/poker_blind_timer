import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Confirm action')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
  });

  it('renders title and message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('確認')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('can be used with different variant props', () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        variant="danger"
      />
    );

    // Verify variant prop is accepted without error
    expect(screen.getByText('Confirm action')).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        variant="warning"
      />
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
  });
});
