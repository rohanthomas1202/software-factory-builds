/**
 * useTimerPersistence — src/hooks/useTimerPersistence.ts
 *
 * Bridges the timer state machine (useTimer) with the localStorage
 * persistence layer (src/lib/storage.ts).
 *
 * Responsibilities:
 *   1. On mount — read any previously saved state from storage and
 *      call hydrate() to restore it into the reducer.
 *      Performs wall-clock recovery for running timers:
 *        - Computes how many ms elapsed since the page was last unloaded
 *          by comparing Date.now() against state.startedAt
 *        - Subtracts that from remainingMs / adds to elapsedMs
 *        - If the timer would have completed during the offline period,
 *          the HYDRATE reducer branch handles the completed transition
 *   2. On every state change (and every TICK) — debounced write to localStorage
 *      via storage.ts to avoid excessive serialisation work
 *
 * This hook owns no state of its own. It is a pure side-effect bridge.
 *
 * Usage:
 *   const timer = useTimer();
 *   useTimerPersistence(timer); // must be called after useTimer()
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { loadTimerState, saveTimerState, clearTimerState } from "@/lib/storage";
import { TimerStatus } from "@/types/timer";
import type { UseTimerReturn, PersistedTimerState } from "@/types/timer";
import { STORAGE_DEBOUNCE_MS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Wall-clock recovery helper
// ---------------------------------------------------------------------------

/**
 * Given a persisted running timer state, computes the adjusted remaining
 * and elapsed times by accounting for the real time that passed since
 * `startedAt`.
 *
 * Example:
 *   - durationMs = 60_000
 *   - remainingMs = 50_000 (persisted mid-run)
 *   - startedAt = Date.now() - 10_000 (the "run segment" started 10s ago)
 *   - offlineElapsed = 10_000
 *   - adjusted remainingMs = 50_000 - 10_000 = 40_000
 *
 * The reducer will further clamp to [0, durationMs].
 */
function recoverRunningState(
  persisted: PersistedTimerState,
  now: number
): PersistedTimerState {
  if (persisted.status !== TimerStatus.Running) {
    return persisted;
  }

  if (persisted.startedAt === null || persisted.startedAt === undefined) {
    // No start timestamp — cannot recover; reset to idle
    return {
      ...persisted,
      status: TimerStatus.Idle,
      remainingMs: persisted.durationMs,
      elapsedMs: 0,
      startedAt: null,
    };
  }

  // How many milliseconds elapsed in real-world time since this run segment began
  const offlineElapsedMs = Math.max(0, now - persisted.startedAt);

  const currentRemainingMs = Math.max(
    0,
    (persisted.remainingMs ?? persisted.durationMs) - offlineElapsedMs
  );
  const currentElapsedMs = Math.min(
    persisted.durationMs,
    (persisted.elapsedMs ?? 0) + offlineElapsedMs
  );

  return {
    ...persisted,
    remainingMs: currentRemainingMs,
    elapsedMs: currentElapsedMs,
    // Keep startedAt as Date.now() so the engine can continue from here
    // if the timer is still running (not yet completed)
    startedAt: currentRemainingMs > 0 ? now : persisted.startedAt,
  };
}

// ---------------------------------------------------------------------------
// Serialise for storage (strips non-serialisable values)
// ---------------------------------------------------------------------------

function serialiseState(
  state: UseTimerReturn["state"]
): PersistedTimerState {
  return {
    status: state.status,
    durationMs: state.durationMs,
    remainingMs: state.remainingMs,
    elapsedMs: state.elapsedMs,
    startedAt: state.startedAt,
    pausedAt: state.pausedAt,
    completedAt: state.completedAt,
    lapCount: state.lapCount,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param timer - The return value of useTimer(). Must be stable across renders.
 */
export function useTimerPersistence(timer: UseTimerReturn): void {
  const { state, hydrate } = timer;

  // Track whether we've completed the initial hydration pass
  const hydratedRef = useRef<boolean>(false);

  // Debounce timer ID for write operations
  const writeTimerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: hydrate from localStorage ───────────────────────────────────
  useEffect(() => {
    // Guard: only run once, only in the browser
    if (hydratedRef.current) return;
    if (typeof window === "undefined") return;

    hydratedRef.current = true;

    const raw = loadTimerState();

    if (raw === null) {
      // No persisted state — stay at the default initial state
      return;
    }

    // Apply wall-clock recovery for running timers
    const recovered = recoverRunningState(raw, Date.now());

    // Dispatch to the reducer — it will validate and apply the state
    hydrate(recovered);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty: intentionally mount-only

  // ── Write: debounced persist on every state change ──────────────────────
  const scheduleWrite = useCallback(
    (serialised: PersistedTimerState) => {
      // Clear any pending write
      if (writeTimerIdRef.current !== null) {
        clearTimeout(writeTimerIdRef.current);
      }

      // For idle state, we still persist the duration so the user's
      // last-set duration is restored after a refresh.
      // For completed state, persist immediately (no debounce needed —
      // this is a terminal state until reset).
      if (state.status === TimerStatus.Completed) {
        saveTimerState(serialised);
        return;
      }

      // For idle state after a reset, clear the stored state entirely
      // so we don't restore stale data on next mount.
      if (state.status === TimerStatus.Idle) {
        writeTimerIdRef.current = setTimeout(() => {
          // Only persist the duration for idle — not the full state —
          // so we avoid accidentally hydrating back into idle with
          // confusing stale timestamps.
          saveTimerState({
            status: TimerStatus.Idle,
            durationMs: serialised.durationMs,
            remainingMs: serialised.durationMs,
            elapsedMs: 0,
            startedAt: null,
            pausedAt: null,
            completedAt: null,
            lapCount: 0,
          });
          writeTimerIdRef.current = null;
        }, STORAGE_DEBOUNCE_MS);
        return;
      }

      // Running or paused: debounced write
      writeTimerIdRef.current = setTimeout(() => {
        saveTimerState(serialised);
        writeTimerIdRef.current = null;
      }, STORAGE_DEBOUNCE_MS);
    },
    // We intentionally exclude `state.status` here because we read it via
    // closure inside the setTimeout callback; the effect dependency below
    // handles re-scheduling correctly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.status]
  );

  useEffect(() => {
    // Skip writes during the hydration pass to avoid a write-before-read race
    if (!hydratedRef.current) return;

    const serialised = serialiseState(state);
    scheduleWrite(serialised);

    // Cleanup: cancel any pending write if state changes again before it fires
    return () => {
      if (writeTimerIdRef.current !== null) {
        clearTimeout(writeTimerIdRef.current);
        writeTimerIdRef.current = null;
      }
    };
  }, [
    state,
    scheduleWrite,
  ]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Flush any pending debounced write synchronously before unmount
      if (writeTimerIdRef.current !== null) {
        clearTimeout(writeTimerIdRef.current);
        writeTimerIdRef.current = null;
        // Write the current state synchronously
        if (typeof window !== "undefined") {
          saveTimerState(serialiseState(state));
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Page visibility recovery ─────────────────────────────────────────────
  // When the user returns to the tab after it was hidden (background tab
  // throttling), the engine tick may have drifted. The engine already
  // applies drift correction on each tick, but this handler forces an
  // immediate tick on visibility restore.
  //
  // For a running timer, we also verify the elapsed time hasn't exceeded
  // the duration and force-complete if so.
  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (state.status !== TimerStatus.Running) return;
      if (state.startedAt === null) return;

      const now = Date.now();
      const offlineElapsed = now - (state.startedAt ?? now);
      const projectedRemaining = state.remainingMs - offlineElapsed;

      if (projectedRemaining <= 0) {
        // Timer completed while tab was hidden — dispatch COMPLETE
        timer.dispatch({
          type: "COMPLETE",
          payload: { completedAt: now },
        });
      }
      // If projectedRemaining > 0, the engine tick will catch up naturally
      // via its own drift-correction on the next interval callback.
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.status, state.remainingMs, state.startedAt, timer]);

  // ── beforeunload: synchronous flush ─────────────────────────────────────
  // Ensure state is flushed synchronously when the user closes/navigates away
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleBeforeUnload() {
      // Cancel the debounce timer (it won't fire after navigation)
      if (writeTimerIdRef.current !== null) {
        clearTimeout(writeTimerIdRef.current);
        writeTimerIdRef.current = null;
      }
      // Persist current state synchronously
      // For running timers, also save the current timestamp so wall-clock
      // recovery on the next mount is accurate.
      const serialised = serialiseState(state);
      if (state.status === TimerStatus.Running) {
        // Update startedAt to right now so the next mount's recovery
        // calculates elapsed time from this exact unload moment.
        saveTimerState({
          ...serialised,
          startedAt: Date.now(),
          // remainingMs at this point is the last known value from the tick;
          // the engine may be slightly ahead. The recovery will add any
          // additional delta on top of this.
        });
      } else {
        saveTimerState(serialised);
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state]);
}