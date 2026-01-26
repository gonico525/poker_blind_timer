/**
 * KeyboardService のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { KeyboardService } from './KeyboardService';

describe('KeyboardService', () => {
  beforeEach(() => {
    KeyboardService.cleanup();
  });

  afterEach(() => {
    KeyboardService.cleanup();
  });

  describe('initialize', () => {
    it('should add keydown event listener', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      KeyboardService.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('cleanup', () => {
    it('should remove keydown event listener', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      KeyboardService.initialize();
      KeyboardService.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('subscribe', () => {
    it('should call handler when key matches', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      fireEvent.keyDown(document, { code: 'Space' });

      expect(handler).toHaveBeenCalled();
    });

    it('should not call handler when key does not match', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      fireEvent.keyDown(document, { code: 'KeyA' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      const unsubscribe = KeyboardService.subscribe('Space', handler);

      unsubscribe();
      fireEvent.keyDown(document, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('modifier keys', () => {
    it('should handle Ctrl modifier', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Ctrl+KeyS', handler);

      fireEvent.keyDown(document, { code: 'KeyS', ctrlKey: true });
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      fireEvent.keyDown(document, { code: 'KeyS', ctrlKey: false });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle Shift modifier', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Shift+KeyR', handler);

      fireEvent.keyDown(document, { code: 'KeyR', shiftKey: true });
      expect(handler).toHaveBeenCalled();
    });

    it('should handle Alt modifier', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Alt+KeyA', handler);

      fireEvent.keyDown(document, { code: 'KeyA', altKey: true });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('input focus handling', () => {
    it('should not trigger shortcuts when input is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when textarea is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      fireEvent.keyDown(textarea, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('should not trigger shortcuts when select is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();

      fireEvent.keyDown(select, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(select);
    });

    it('should not trigger shortcuts when contentEditable is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      fireEvent.keyDown(div, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });
  });

  describe('prevent default', () => {
    it('should prevent default for handled keys', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler, { preventDefault: true });

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when preventDefault is false', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler, { preventDefault: false });

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('multiple subscriptions', () => {
    it('should handle multiple handlers for different keys', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler1);
      KeyboardService.subscribe('KeyA', handler2);

      fireEvent.keyDown(document, { code: 'Space' });
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();

      handler1.mockClear();
      handler2.mockClear();

      fireEvent.keyDown(document, { code: 'KeyA' });
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle multiple handlers for the same key', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler1);
      KeyboardService.subscribe('Space', handler2);

      fireEvent.keyDown(document, { code: 'Space' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should not throw when handler throws', () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      expect(() => {
        fireEvent.keyDown(document, { code: 'Space' });
      }).not.toThrow();
    });
  });
});
