'use client';

import { RefObject, useEffect, useRef } from 'react';

/**
 * Hook that detects clicks outside of a specified element
 * Useful for closing dropdowns, modals, or other popup elements when clicking outside
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    excludeRefs?: RefObject<HTMLElement>[];
    capture?: boolean;
  }
): RefObject<T> {
  const ref = useRef<T>(null);
  const {
    enabled = true,
    excludeRefs = [],
    capture = false
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if the click is inside the main ref
      if (ref.current && !ref.current.contains(event.target as Node)) {
        // Check if the click is inside any excluded refs
        const isExcluded = excludeRefs.some(
          excludeRef => excludeRef.current?.contains(event.target as Node)
        );

        if (!isExcluded) {
          handler();
        }
      }
    };

    // Use capture phase to handle clicks before they bubble up
    document.addEventListener('mousedown', handleClickOutside, capture);
    document.addEventListener('touchstart', handleClickOutside, capture);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, capture);
      document.removeEventListener('touchstart', handleClickOutside, capture);
    };
  }, [handler, enabled, excludeRefs, capture]);

  return ref;
}

/**
 * Alternative version that accepts multiple refs
 * Useful when you need to detect clicks outside of multiple elements
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement>[],
  handler: () => void,
  options?: {
    enabled?: boolean;
    capture?: boolean;
  }
): void {
  const {
    enabled = true,
    capture = false
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if the click is outside all provided refs
      const isOutside = refs.every(
        ref => !ref.current?.contains(event.target as Node)
      );

      if (isOutside) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, capture);
    document.addEventListener('touchstart', handleClickOutside, capture);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, capture);
      document.removeEventListener('touchstart', handleClickOutside, capture);
    };
  }, [refs, handler, enabled, capture]);
}

/**
 * Hook that detects clicks outside and also handles escape key press
 * Combines click outside detection with keyboard navigation
 */
export function useDismissable<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    excludeRefs?: RefObject<HTMLElement>[];
    capture?: boolean;
    escapeKey?: boolean;
  }
): RefObject<T> {
  const ref = useRef<T>(null);
  const {
    enabled = true,
    excludeRefs = [],
    capture = false,
    escapeKey = true
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        const isExcluded = excludeRefs.some(
          excludeRef => excludeRef.current?.contains(event.target as Node)
        );

        if (!isExcluded) {
          handler();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (escapeKey && event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, capture);
    document.addEventListener('touchstart', handleClickOutside, capture);
    
    if (escapeKey) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, capture);
      document.removeEventListener('touchstart', handleClickOutside, capture);
      
      if (escapeKey) {
        document.removeEventListener('keydown', handleEscapeKey);
      }
    };
  }, [handler, enabled, excludeRefs, capture, escapeKey]);

  return ref;
}

/**
 * Hook that detects clicks outside with additional focus trap support
 * Useful for accessible modals and dialogs
 */
export function useFocusTrapClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    excludeRefs?: RefObject<HTMLElement>[];
    trapFocus?: boolean;
    initialFocusRef?: RefObject<HTMLElement>;
  }
): {
  ref: RefObject<T>;
  focusTrapProps: {
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
} {
  const ref = useRef<T>(null);
  const {
    enabled = true,
    excludeRefs = [],
    trapFocus = true,
    initialFocusRef
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        const isExcluded = excludeRefs.some(
          excludeRef => excludeRef.current?.contains(event.target as Node)
        );

        if (!isExcluded) {
          handler();
        }
      }
    };

    // Focus the initial element when the component mounts
    if (trapFocus && initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, enabled, excludeRefs, trapFocus, initialFocusRef]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!trapFocus || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: focus previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: focus next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    if (event.key === 'Escape') {
      handler();
    }
  };

  return {
    ref,
    focusTrapProps: {
      onKeyDown: handleKeyDown
    }
  };
}