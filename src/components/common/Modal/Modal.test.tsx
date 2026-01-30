import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const modal = screen.getByTestId('modal');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('accepts different size props without error', () => {
    const { rerender } = render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Modal"
        size="small"
      >
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    rerender(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Modal"
        size="large"
      >
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    rerender(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Modal"
        size="fullscreen"
      >
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-labelledby', 'modal-title');

    const title = screen.getByText('Test Modal');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('prevents body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('focuses first focusable element when opened', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    // The close button in the header is the first focusable element
    const closeButton = screen.getByTestId('modal-close-button');
    expect(document.activeElement).toBe(closeButton);
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    const closeButton = screen.getByTestId('modal-close-button');
    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');

    // Focus should be on close button initially (first focusable element)
    expect(document.activeElement).toBe(closeButton);

    // Tab to first button
    await user.tab();
    expect(document.activeElement).toBe(firstButton);

    // Tab to second button
    await user.tab();
    expect(document.activeElement).toBe(secondButton);

    // Tab should cycle back to close button
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab should go back to second button
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(secondButton);
  });
});
