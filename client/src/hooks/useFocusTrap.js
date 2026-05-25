import { useEffect, useRef, useCallback } from 'react';

//useFocusTrap — keeps keyboard focus inside a container (e.g. a modal).
 
// WCAG 2.2 SC 2.4.3 (Focus Order) & SC 2.1.2 (No Keyboard Trap): Focus must stay inside dialogs while open, and Escape must always close them.

// 1. On mount, saves the previously focused element, then focuses the container.
// 2. Traps Tab / Shift+Tab within focusable children of the container.
// 3. On unmount (modal close), returns focus to the element that was focused before.
export default function useFocusTrap(onClose) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Selectors for all natively-focusable elements
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const handleKeyDown = useCallback(
    (e) => {
      if (!containerRef.current) return;

      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap Tab
      if (e.key === 'Tab') {
        const focusable = Array.from(
          containerRef.current.querySelectorAll(FOCUSABLE)
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose, FOCUSABLE]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Remember what was focused before the modal opened
    previouslyFocused.current = document.activeElement;

    // Focus the container (or its first focusable child)
    const focusable = container.querySelectorAll(FOCUSABLE);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }

    // Attach keydown listener
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to the element that triggered the modal
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [handleKeyDown, FOCUSABLE]);

  return containerRef;
}