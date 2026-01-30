import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Dropdown コンポーネント
 * プリセット選択ドロップダウンのベースコンポーネント
 *
 * 機能:
 * - キーボード操作（上下矢印、Enter、Escape）
 * - 選択中の項目にチェックマーク表示
 * - disabled状態の項目はクリック不可
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = '選択してください',
  className,
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (optionValue: string, disabled?: boolean) => {
      if (disabled) return;
      onChange(optionValue);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      const enabledOptions = options.filter((opt) => !opt.disabled);
      const currentFocusedOption =
        focusedIndex >= 0 ? options[focusedIndex] : null;
      const currentIndexInEnabled = currentFocusedOption
        ? enabledOptions.findIndex(
            (opt) => opt.value === currentFocusedOption.value
          )
        : -1;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (enabledOptions.length === 0) break;
          const nextEnabledIndex =
            (currentIndexInEnabled + 1) % enabledOptions.length;
          const nextOption = enabledOptions[nextEnabledIndex];
          setFocusedIndex(options.findIndex((opt) => opt === nextOption));
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          if (enabledOptions.length === 0) break;
          const prevEnabledIndex =
            currentIndexInEnabled <= 0
              ? enabledOptions.length - 1
              : currentIndexInEnabled - 1;
          const prevOption = enabledOptions[prevEnabledIndex];
          setFocusedIndex(options.findIndex((opt) => opt === prevOption));
          break;
        }

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const option = options[focusedIndex];
            handleSelect(option.value, option.disabled);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;

        default:
          break;
      }
    },
    [isOpen, options, focusedIndex, handleSelect]
  );

  const containerClassName = [styles.container, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={dropdownRef}
      className={containerClassName}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        data-testid="dropdown-trigger"
      >
        <span className={styles.value}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={styles.arrow} aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <ul
          className={styles.menu}
          role="listbox"
          aria-label={ariaLabel}
          data-testid="dropdown-menu"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;
            const itemClassName = [
              styles.item,
              isSelected && styles.selected,
              isFocused && styles.focused,
              option.disabled && styles.disabled,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li
                key={option.value}
                className={itemClassName}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => handleSelect(option.value, option.disabled)}
                data-testid="dropdown-item"
              >
                <span className={styles.check} aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
                <span className={styles.label}>{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
