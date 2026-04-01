/**
 * useWakeLock — src/hooks/useWakeLock.ts
 *
 * Prevents the device screen from sleeping while the timer is running
 * by acquiring a Screen Wake Lock (navigator.wakeLock.request("screen")).
 *
 * Spec: https://www.w3.org/TR/screen-wake-lock/
 * MDN:  https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
 *
 * Lifecycle:
 *   - Acquires the lock when `isActive` transitions to true.
 *   - Releases the lock when `isActive` transitions to false.
 *   - Re-acquires the lock after a visibility change event (the browser
 *     automatically releases wake locks when the page becomes hidden;
 *     this hook re-acquires when the page becomes visible again AND
 *     `isActive` is still true).
 *   - Releases and cleans up on unmount.
 *
 * Graceful degradation:
 *   - The Wake Lock API is not yet supported in all browsers (notably Firefox
 *     and Safari iOS < 16.4). The hook silently no-ops when unavailable.
 *   - Permission errors (e.g., insecure context) are caught and logged.
 *
 * SSR safe: all navigator access is inside useEffect or guarded with
 * typeof checks.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseWakeLockReturn {
  /** Whether the Screen Wake Lock is currently active */
  isLocked: boolean;
  /** Whether the Screen Wake Lock API is supported in this browser */
  isSupported: boolean;
  /** Last error message if acquisition failed; null otherwise */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type-safe check for Wake Lock API support */
function isWakeLockSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "wakeLock" in navigator &&
    typeof navigator.wakeLock?.request === "function"
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useWakeLock
 *
 * @param isActive  When true, the hook attempts to acquire a screen wake lock.
 *                  When false, it releases any held lock.
 *
 * @example
 * ```tsx
 * const { isLocked, isSupported } = useWakeLock(timerState.status === TimerStatus.Running);
 * ```
 */
export function useWakeLock(isActive: boolean): UseWakeLockReturn {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [isLocked,   setIsLocked]   = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  /** The currently held WakeLockSentinel, or null if no lock is held */
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  /** Whether the hook is still mounted (prevents state updates after unmount) */
  const isMountedRef = useRef<boolean>(true);

  /** Stable reference to isActive for use in event handlers */
  const isActiveRef = useRef<boolean>(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }); // Runs after every render — no dep array intentional.

  // ---------------------------------------------------------------------------
  // Check API support on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    setIsSupported(isWakeLockSupported());

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Core acquire / release logic
  // ---------------------------------------------------------------------------

  /** Acquires the screen wake lock. Safe to call multiple times. */
  const acquireLock = useCallback(async (): Promise<void> => {
    if (!isWakeLockSupported()) return;

    // Already locked — don't acquire a second sentinel.
    if (sentinelRef.current !== null) return;

    try {
      const sentinel = await navigator.wakeLock.request("screen");

      if (!isMountedRef.current) {
        // Component unmounted while we were awaiting — immediately release.
        await sentinel.release().catch(() => {/* ignore */});
        return;
      }

      sentinelRef.current = sentinel;
      setIsLocked(true);
      setError(null);

      // The browser may release the sentinel automatically (e.g., when the
      // tab becomes hidden). Listen for the 'release' event.
      sentinel.addEventListener("release", () => {
        if (!isMountedRef.current) return;
        sentinelRef.current = null;
        setIsLocked(false);
      });
    } catch (err: unknown) {
      if (!isMountedRef.current) return;

      // DOMException: NotAllowedError — insecure context or permission denied
      // AbortError — page is being unloaded
      const message =
        err instanceof Error ? err.message : "Wake Lock acquisition failed";

      setIsLocked(false);
      setError(message);

      // Only log non-trivial errors (not "document lost focus" which is normal)
      if (
        !(err instanceof DOMException && err.name === "AbortError") &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn("[useWakeLock] Failed to acquire wake lock:", message);
      }
    }
  }, []);

  /** Releases the screen wake lock. Safe to call when no lock is held. */
  const releaseLock = useCallback(async (): Promise<void> => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    try {
      // Remove the sentinel ref before awaiting to prevent double-release.
      sentinelRef.current = null;
      await sentinel.release();
    } catch {
      // Release errors are non-critical — the sentinel may already be released.
    } finally {
      if (isMountedRef.current) {
        setIsLocked(false);
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Effect: acquire / release based on isActive
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isWakeLockSupported()) return;

    if (isActive) {
      void acquireLock();
    } else {
      void releaseLock();
    }
  }, [isActive, acquireLock, releaseLock]);

  // ---------------------------------------------------------------------------
  // Effect: re-acquire after page visibility change
  //
  // Browsers release the wake lock when the page is hidden (e.g., user
  // switches tabs). We re-acquire it when the page becomes visible again
  // if isActive is still true.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        // Re-acquire the lock (acquireLock guards against double-acquisition).
        void acquireLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [acquireLock]);

  // ---------------------------------------------------------------------------
  // Effect: cleanup on unmount — release any held lock
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      const sentinel = sentinelRef.current;
      if (sentinel) {
        sentinelRef.current = null;
        void sentinel.release().catch(() => {/* ignore */});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — mount/unmount only

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    isLocked,
    isSupported,
    error,
  };
}

export default useWakeLock;