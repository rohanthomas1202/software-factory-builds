/**
 * useDocumentTitle — src/hooks/useDocumentTitle.ts
 *
 * Updates the browser tab title on every timer tick and state change.
 *
 * Title formats (per PRD):
 *   - Running:   "▶ 01:23 — Countdown Timer"
 *   - Paused:    "⏸ 01:23 — Countdown Timer"
 *   - Completed: "✅ Done! — Countdown Timer"
 *   - Idle:      "Countdown Timer"
 *
 * Additionally swaps the <link rel="icon"> element to reflect timer state
 * using the SVG icons in /public/icons/.
 *
 * Icon map:
 *   idle      → /icons/timer-idle.svg
 *   running   → /icons/timer-running.svg
 *   paused    → /icons/timer-idle.svg   (reuses idle icon)
 *   completed → /icons/timer-complete.svg
 *
 * Safety:
 *   - All DOM access is guarded with typeof document checks (SSR safe)
 *   - Restores the original title on unmount
 *   - Does not cause unnecessary re-renders (no state, only effects)
 */

"use client";

import { useEffect, useRef } from "react";
import { TimerStatus } from "@/types/timer";
import { formatTime } from "@/lib/time-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_NAME = "Countdown Timer";

/** Map of timer status → favicon href (relative to /public) */
const FAVICON_MAP: Record<TimerStatus, string> = {
  [TimerStatus.Idle]:      "/icons/timer-idle.svg",
  [TimerStatus.Running]:   "/icons/timer-running.svg",
  [TimerStatus.Paused]:    "/icons/timer-idle.svg",
  [TimerStatus.Completed]: "/icons/timer-complete.svg",
};

/** Map of timer status → title prefix emoji/symbol */
const PREFIX_MAP: Record<TimerStatus, string | null> = {
  [TimerStatus.Idle]:      null,
  [TimerStatus.Running]:   "▶",
  [TimerStatus.Paused]:    "⏸",
  [TimerStatus.Completed]: "✅",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDocumentTitleOptions {
  /** Current remaining time in milliseconds */
  remainingMs: number;
  /** Current timer status */
  status: TimerStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the full document title string from timer state.
 * Examples:
 *   idle      → "Countdown Timer"
 *   running   → "▶ 01:23 — Countdown Timer"
 *   paused    → "⏸ 01:23 — Countdown Timer"
 *   completed → "✅ Done! — Countdown Timer"
 */
function buildTitle(status: TimerStatus, remainingMs: number): string {
  switch (status) {
    case TimerStatus.Idle:
      return APP_NAME;

    case TimerStatus.Running:
    case TimerStatus.Paused: {
      const prefix = PREFIX_MAP[status]!;
      // formatTime returns "HH:MM:SS" or "MM:SS" depending on duration.
      // For the title, always show at least MM:SS.
      const timeString = formatTime(remainingMs, { forceHours: false });
      return `${prefix} ${timeString} — ${APP_NAME}`;
    }

    case TimerStatus.Completed:
      return `✅ Done! — ${APP_NAME}`;

    default:
      return APP_NAME;
  }
}

/**
 * Finds or creates the <link rel="icon"> element in the document <head>.
 * Returns null in SSR environments.
 */
function getOrCreateFaviconLink(): HTMLLinkElement | null {
  if (typeof document === "undefined") return null;

  // Try to find an existing dynamic favicon link (one we manage)
  let link = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"][data-dynamic="true"]'
  );

  if (!link) {
    // Create a new <link> element for dynamic favicon management.
    // We leave any existing static <link rel="icon"> elements untouched
    // so that SSR-rendered favicons remain until we first update them.
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.setAttribute("data-dynamic", "true");
    document.head.appendChild(link);
  }

  return link;
}

/**
 * Updates the favicon <link> element href.
 * No-op in SSR environments.
 */
function updateFavicon(status: TimerStatus): void {
  const link = getOrCreateFaviconLink();
  if (!link) return;

  const href = FAVICON_MAP[status];
  if (link.href !== href) {
    link.href = href;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useDocumentTitle
 *
 * @param options.remainingMs  Current remaining time in milliseconds.
 * @param options.status       Current timer status.
 *
 * @example
 * ```tsx
 * useDocumentTitle({ remainingMs: timerState.remainingMs, status: timerState.status });
 * ```
 */
export function useDocumentTitle({
  remainingMs,
  status,
}: UseDocumentTitleOptions): void {
  // Capture the original title so we can restore it on unmount.
  const originalTitleRef = useRef<string>("");

  // ---------------------------------------------------------------------------
  // Capture original title on mount (client only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === "undefined") return;
    originalTitleRef.current = document.title;

    // Cleanup: restore original title when the component unmounts.
    return () => {
      if (typeof document !== "undefined") {
        document.title = originalTitleRef.current;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally mount-only

  // ---------------------------------------------------------------------------
  // Update document.title on every relevant state/tick change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === "undefined") return;

    const newTitle = buildTitle(status, remainingMs);

    // Only write to the DOM if the title actually changed — avoid unnecessary
    // layout thrashing on high-frequency ticks.
    if (document.title !== newTitle) {
      document.title = newTitle;
    }
  }, [status, remainingMs]);

  // ---------------------------------------------------------------------------
  // Update favicon on status change (lower frequency than title)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    updateFavicon(status);
  }, [status]);
}

export default useDocumentTitle;