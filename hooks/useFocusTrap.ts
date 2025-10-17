// FIX: Import React to provide the React namespace for types like React.RefObject.
import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const useFocusTrap = (ref: React.RefObject<HTMLElement>) => {
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    previousActiveElement.current = document.activeElement;
    
    const focusableElements = Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    ref.current.addEventListener('keydown', handleKeyDown);

    return () => {
      ref.current?.removeEventListener('keydown', handleKeyDown);
      (previousActiveElement.current as HTMLElement)?.focus();
    };
  }, [ref]);
};