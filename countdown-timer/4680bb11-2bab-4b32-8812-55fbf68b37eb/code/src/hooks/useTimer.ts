/**
 * useTimer — src/hooks/useTimer.ts
 *
 * The single source of truth for countdown timer state.
 *
 * Architecture:
 * - useReducer with a strict state machine matching the PRD state diagram
 * - timer-engine.ts is wrapped via useRef (imperative handle, no re-renders)
 * - Wall-clock recovery on mount for persisted running state
 * - Exposes TimerState and typed action dispatchers
 * - Integrates with useTimerPersistence via a HYDRATE action
 *
 * State machine transitions:
 *   idle      → running   (START)
 *   running   → paused    (PAUSE)
 *   running   → completed (TICK when remainingMs reaches 0)
 *   paused    → running   (RESUME)
 *   paused    → idle      (RESET)
 *   running   → idle      (RESET)
 *   completed → idle      (RESET)
 *   completed → running   (RESTART — same as reset + start)
 *   any       → any       (HYDRATE — only on mount)
 *   idle      → idle      (SET_DURATION)
 */

"use client";

import {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { TimerEngine } from "@/lib/timer-engine";
import {
  DEFAULT_DURATION_MS,
  MIN_DURATION_MS,
  MAX_DURATION_MS,
} from "@/lib/constants";
import { clampDuration } from "@/lib/time-utils";
import { TimerStatus } from "@/types/timer";
import type {
  TimerState,
  TimerAction,
  UseTimerReturn,
  PersistedTimerState,
} from "@/types/timer";

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const buildInitialState = (durationMs: number = DEFAULT_DURATION_MS): TimerState => ({
  status: TimerStatus.Idle,
  durationMs: clampDuration(durationMs, MIN_DURATION_MS, MAX_DURATION_MS),
  remainingMs: clampDuration(durationMs, MIN_DURATION_MS, MAX_DURATION_MS),
  elapsedMs: 0,
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  lapCount: 0,
});

// ---------------------------------------------------------------------------
// Reducer — pure state machine, no side-effects
// ---------------------------------------------------------------------------

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    // ── SET_DURATION ──────────────────────────────────────────────────────
    // Only allowed when idle. Clamps to valid range.
    case "SET_DURATION": {
      if (state.status !== TimerStatus.Idle) {
        return state;
      }
      const clamped = clampDuration(
        action.payload.durationMs,
        MIN_DURATION_MS,
        MAX_DURATION_MS
      );
      return {
        ...state,
        durationMs: clamped,
        remainingMs: clamped,
        elapsedMs: 0,
      };
    }

    // ── START ─────────────────────────────────────────────────────────────
    // idle → running
    case "START": {
      if (state.status !== TimerStatus.Idle) {
        return state;
      }
      if (state.durationMs <= 0) {
        return state;
      }
      return {
        ...state,
        status: TimerStatus.Running,
        startedAt: action.payload.startedAt,
        pausedAt: null,
        completedAt: null,
        remainingMs: state.durationMs,
        elapsedMs: 0,
      };
    }

    // ── PAUSE ─────────────────────────────────────────────────────────────
    // running → paused
    case "PAUSE": {
      if (state.status !== TimerStatus.Running) {
        return state;
      }
      return {
        ...state,
        status: TimerStatus.Paused,
        pausedAt: action.payload.pausedAt,
      };
    }

    // ── RESUME ────────────────────────────────────────────────────────────
    // paused → running
    case "RESUME": {
      if (state.status !== TimerStatus.Paused) {
        return state;
      }
      return {
        ...state,
        status: TimerStatus.Running,
        pausedAt: null,
        startedAt: action.payload.resumedAt,
      };
    }

    // ── RESET ─────────────────────────────────────────────────────────────
    // any → idle (restores original duration)
    case "RESET": {
      return {
        ...buildInitialState(state.durationMs),
      };
    }

    // ── TICK ──────────────────────────────────────────────────────────────
    // Fired by the engine on every display-rate update (~1 Hz)
    // running → running (normal) or running → completed
    case "TICK": {
      if (state.status !== TimerStatus.Running) {
        return state;
      }
      const { remainingMs, elapsedMs } = action.payload;
      const clampedRemaining = Math.max(0, remainingMs);
      const clampedElapsed = Math.min(state.durationMs, elapsedMs);

      if (clampedRemaining <= 0) {
        return {
          ...state,
          status: TimerStatus.Completed,
          remainingMs: 0,
          elapsedMs: state.durationMs,
          completedAt: Date.now(),
        };
      }

      return {
        ...state,
        remainingMs: clampedRemaining,
        elapsedMs: clampedElapsed,
      };
    }

    // ── COMPLETE ──────────────────────────────────────────────────────────
    // Explicit completion signal from the engine (belt-and-suspenders)
    case "COMPLETE": {
      if (state.status === TimerStatus.Completed) {
        return state;
      }
      return {
        ...state,
        status: TimerStatus.Completed,
        remainingMs: 0,
        elapsedMs: state.durationMs,
        completedAt: action.payload.completedAt,
      };
    }

    // ── RESTART ───────────────────────────────────────────────────────────
    // completed → running (reset + start in one action for the "Restart" button)
    case "RESTART": {
      if (state.status !== TimerStatus.Completed) {
        return state;
      }
      return {
        ...state,
        status: TimerStatus.Running,
        remainingMs: state.durationMs,
        elapsedMs: 0,
        startedAt: action.payload.startedAt,
        pausedAt: null,
        completedAt: null,
      };
    }

    // ── HYDRATE ───────────────────────────────────────────────────────────
    // Mount-only action. Restores persisted state from localStorage.
    // Wall-clock recovery is applied before this action is dispatched
    // (see useTimerPersistence.ts).
    case "HYDRATE": {
      const persisted = action.payload.state;
      // Validate the persisted state is coherent before applying
      if (!persisted || typeof persisted !== "object") {
        return state;
      }
      // Clamp all numeric values defensively
      const durationMs = clampDuration(
        persisted.durationMs ?? DEFAULT_DURATION_MS,
        MIN_DURATION_MS,
        MAX_DURATION_MS
      );
      const remainingMs = Math.max(
        0,
        Math.min(durationMs, persisted.remainingMs ?? durationMs)
      );
      const elapsedMs = Math.max(
        0,
        Math.min(durationMs, persisted.elapsedMs ?? 0)
      );

      // If the persisted status is running (page was reloaded while running),
      // wall-clock recovery in useTimerPersistence has already adjusted
      // remainingMs / elapsedMs. We just apply the state as-is.
      const status = Object.values(TimerStatus).includes(
        persisted.status as TimerStatus
      )
        ? (persisted.status as TimerStatus)
        : TimerStatus.Idle;

      // If remaining time has been exhausted during the offline period,
      // transition to completed.
      const finalStatus =
        status === TimerStatus.Running && remainingMs <= 0
          ? TimerStatus.Completed
          : status;

      return {
        status: finalStatus,
        durationMs,
        remainingMs: finalStatus === TimerStatus.Completed ? 0 : remainingMs,
        elapsedMs:
          finalStatus === TimerStatus.Completed ? durationMs : elapsedMs,
        startedAt: persisted.startedAt ?? null,
        pausedAt: persisted.pausedAt ?? null,
        completedAt:
          finalStatus === TimerStatus.Completed
            ? (persisted.completedAt ?? Date.now())
            : null,
        lapCount: persisted.lapCount ?? 0,
      };
    }

    default: {
      // Exhaustiveness check — TypeScript will error if an action is unhandled
      const _exhaustive: never = action;
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTimer(): UseTimerReturn {
  // ── Reducer ──────────────────────────────────────────────────────────────
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    () => buildInitialState(DEFAULT_DURATION_MS)
  );

  // ── Engine ref ───────────────────────────────────────────────────────────
  // Holds the TimerEngine instance. Never triggers re-renders directly —
  // all state flows through the reducer.
  const engineRef = useRef<TimerEngine | null>(null);

  // Keep a stable ref to the current state so engine callbacks always
  // read the latest value without needing to be recreated.
  const stateRef = useRef<TimerState>(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // ── Engine initialisation ─────────────────────────────────────────────
  useEffect(() => {
    if (engineRef.current === null) {
      engineRef.current = new TimerEngine({
        onTick: (remainingMs: number, elapsedMs: number) => {
          dispatch({
            type: "TICK",
            payload: { remainingMs, elapsedMs },
          });
        },
        onComplete: (completedAt: number) => {
          dispatch({
            type: "COMPLETE",
            payload: { completedAt },
          });
        },
      });
    }

    return () => {
      // Clean up the engine on unmount to prevent memory leaks
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync engine with state machine ────────────────────────────────────
  // After each state change, ensure the engine reflects the new status.
  // This is the only place the engine imperative API is called in response
  // to state transitions.
  const prevStatusRef = useRef<TimerStatus>(TimerStatus.Idle);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const prevStatus = prevStatusRef.current;
    const { status, remainingMs, durationMs } = state;

    if (prevStatus === status) return; // No transition occurred
    prevStatusRef.current = status;

    switch (status) {
      case TimerStatus.Running: {
        // Start or resume the engine
        if (
          prevStatus === TimerStatus.Idle ||
          prevStatus === TimerStatus.Completed
        ) {
          engine.start(remainingMs, durationMs);
        } else if (prevStatus === TimerStatus.Paused) {
          engine.resume(remainingMs);
        }
        break;
      }
      case TimerStatus.Paused: {
        engine.pause();
        break;
      }
      case TimerStatus.Idle:
      case TimerStatus.Completed: {
        engine.stop();
        break;
      }
    }
  }, [state]);

  // ── Action dispatchers ───────────────────────────────────────────────────

  const setDuration = useCallback((durationMs: number) => {
    dispatch({
      type: "SET_DURATION",
      payload: { durationMs },
    });
  }, []);

  const start = useCallback(() => {
    dispatch({
      type: "START",
      payload: { startedAt: Date.now() },
    });
  }, []);

  const pause = useCallback(() => {
    dispatch({
      type: "PAUSE",
      payload: { pausedAt: Date.now() },
    });
  }, []);

  const resume = useCallback(() => {
    dispatch({
      type: "RESUME",
      payload: { resumedAt: Date.now() },
    });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const restart = useCallback(() => {
    dispatch({
      type: "RESTART",
      payload: { startedAt: Date.now() },
    });
  }, []);

  // Internal — used exclusively by useTimerPersistence on mount
  const hydrate = useCallback((persistedState: PersistedTimerState) => {
    dispatch({
      type: "HYDRATE",
      payload: { state: persistedState },
    });
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const progressFraction = useMemo(() => {
    if (state.durationMs <= 0) return 0;
    if (state.status === TimerStatus.Completed) return 1;
    if (state.status === TimerStatus.Idle) return 0;
    return Math.min(1, Math.max(0, state.elapsedMs / state.durationMs));
  }, [state.status, state.durationMs, state.elapsedMs]);

  const isRunning = state.status === TimerStatus.Running;
  const isPaused = state.status === TimerStatus.Paused;
  const isIdle = state.status === TimerStatus.Idle;
  const isCompleted = state.status === TimerStatus.Completed;
  const canStart = isIdle && state.durationMs > 0;
  const canPause = isRunning;
  const canResume = isPaused;
  const canReset = isRunning || isPaused || isCompleted;

  return {
    // State
    state,
    // Derived booleans
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    canStart,
    canPause,
    canResume,
    canReset,
    progressFraction,
    // Actions
    setDuration,
    start,
    pause,
    resume,
    reset,
    restart,
    // Internal (used by useTimerPersistence)
    hydrate,
    // Raw dispatch (for advanced use cases)
    dispatch,
  };
}