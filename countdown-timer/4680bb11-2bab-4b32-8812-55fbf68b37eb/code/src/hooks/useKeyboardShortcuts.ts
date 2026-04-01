/**
 * useKeyboardShortcuts — src/hooks/useKeyboardShortcuts.ts
 *
 * Registers a single keydown listener on the document and dispatches
 * declarative actions based on key mappings.
 *
 * Supported shortcuts (per PRD):
 *   Space   → Start / Pause toggle
 *   R       → Reset
 *   P       → Pause (explicit)
 *   Escape  → Reset
 *   ?       → Toggle keyboard shortcut overlay
 *
 * Safety rules:
 *   1. Skips all shortcuts when focus is inside an <input>, <textarea>,
 *      or <select> element (prevents hijacking duration entry).
 *   2. Skips when a modifier key (Ctrl, Alt, Meta) is held — avoids
 *      overriding OS/browser shortcuts.
 *   3. Attaches a single listener to document (not multiple per action).
 *   4. Cleans up the listener on unmount.
 *   5. SSR safe — no direct window/document access at module level.
 *
 * Design:
 *   Consumers pass a declarative `actions` map. The hook does not import
 *   or depend on timer state — it is purely a keyboard event bridge.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Elements where keyboard shortcuts should be suppressed */
const BLOCKED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** All shortcut key identifiers recognised by this hook */
export type ShortcutKey =
  | " "       // Space — Start / Pause toggle
  | "r"       // R key — Reset
  | "R"       // R key (shift held, still valid)
  | "p"       // P key — Pause
  | "P"       // P key (shift held)
  | "Escape"  // Escape — Reset
  | "?";      // Question mark — Toggle overlay

/**
 * Map of shortcut key → callback.
 * Only keys present in this map are acted upon.
 */
export interface ShortcutActions {
  /** Called when Space is pressed. Typically toggles start/pause. */
  onToggleStartPause?: () => void;
  /** Called when R or Escape is pressed. Typically resets the timer. */
  onReset?: () => void;
  /** Called when P is pressed. Typically pauses the timer. */
  onPause?: () => void;
  /** Called when ? is pressed. Typically toggles the shortcut overlay. */
  onToggleOverlay?: () => void;
}

export interface UseKeyboardShortcutsOptions {
  /** Declarative action callbacks */
  actions: ShortcutActions;
  /**
   * Current timer status — used to make context-aware decisions.
   * For example, Space only triggers start when idle/paused, and pause when running.
   */
  status: TimerStatus;
  /** Whether keyboard shortcuts are globally enabled. Default: true */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useKeyboardShortcuts
 *
 * Registers a single document-level keydown listener that maps key presses
 * to timer actions. Automatically skips when focus is in a form element.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   status: timerState.status,
 *   actions: {
 *     onToggleStartPause: () => isRunning ? pause() : start(),
 *     onReset: reset,
 *     onPause: pause,
 *     onToggleOverlay: () => setShowOverlay(v => !v),
 *   },
 * });
 * ```
 */
export function useKeyboardShortcuts({
  actions,
  status,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  // Store actions in a ref so the event listener always calls the latest
  // version without needing to re-register on every render.
  const actionsRef = useRef<ShortcutActions>(actions);
  const statusRef  = useRef<TimerStatus>(status);
  const enabledRef = useRef<boolean>(enabled);

  // Keep refs in sync with latest props on every render.
  useEffect(() => {
    actionsRef.current  = actions;
    statusRef.current   = status;
    enabledRef.current  = enabled;
  }); // No dep array — runs after every render intentionally.

  // Build and memoize the stable event handler.
  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // ── Guard: hook disabled ────────────────────────────────────────────────
    if (!enabledRef.current) return;

    // ── Guard: modifier keys held (Ctrl / Alt / Meta) ──────────────────────
    // Allow Shift for characters like '?' which require it on some keyboards.
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // ── Guard: focus inside a form element ─────────────────────────────────
    const target = event.target as HTMLElement | null;
    if (target && BLOCKED_TAGS.has(target.tagName)) return;
    // Also check contenteditable divs
    if (target?.isContentEditable) return;

    const key   = event.key;
    const acts  = actionsRef.current;
    const state = statusRef.current;

    switch (key) {
      // ── Space: Start / Pause toggle ───────────────────────────────────────
      case " ": {
        // Prevent the page from scrolling on Space.
        event.preventDefault();

        if (acts.onToggleStartPause) {
          acts.onToggleStartPause();
        }
        break;
      }

      // ── R: Reset ──────────────────────────────────────────────────────────
      case "r":
      case "R": {
        event.preventDefault();

        // Only reset when the timer is not idle (no-op when already idle
        // prevents confusing behavior when user is simply navigating the page).
        if (state !== TimerStatus.Idle && acts.onReset) {
          acts.onReset();
        }
        break;
      }

      // ── P: Pause ──────────────────────────────────────────────────────────
      case "p":
      case "P": {
        event.preventDefault();

        // Only meaningful when running.
        if (state === TimerStatus.Running && acts.onPause) {
          acts.onPause();
        }
        break;
      }

      // ── Escape: Reset (also dismisses modals — handled at component level) ─
      case "Escape": {
        // Don't preventDefault on Escape — allows browser's native Escape
        // handling (e.g., closing dialogs) to also fire. Components that
        // listen for Escape independently (ShortcutOverlay, CompletionAlert)
        // will handle modal closure separately.

        if (state !== TimerStatus.Idle && acts.onReset) {
          acts.onReset();
        }
        break;
      }

      // ── ?: Toggle shortcut overlay ────────────────────────────────────────
      case "?": {
        event.preventDefault();

        if (acts.onToggleOverlay) {
          acts.onToggleOverlay();
        }
        break;
      }

      // All other keys fall through — no action.
      default:
        break;
    }
  }, []); // Empty deps — reads from refs, no stale closures.

  // ---------------------------------------------------------------------------
  // Register / deregister the listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.addEventListener("keydown", handleKeyDown, {
      // Passive: false so we can call preventDefault() inside.
      passive: false,
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]); // handleKeyDown is stable (useCallback with empty deps).
}

export default useKeyboardShortcuts;