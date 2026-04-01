/**
 * Core TypeScript types for the Countdown Timer App.
 *
 * All shared types are defined here to ensure consistency across
 * components, hooks, and utilities. No runtime code lives in this file —
 * pure type definitions only.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * All possible timer states in the state machine.
 * Matches the PRD state diagram exactly.
 */
export enum TimerStatus {
  Idle = "idle",
  Running = "running",
  Paused = "paused",
  Completed = "completed",
}

// ---------------------------------------------------------------------------
// Core State Shape
// ---------------------------------------------------------------------------

/**
 * The complete, authoritative timer state held in the useReducer.
 * All fields are serialisable for localStorage persistence.
 */
export interface TimerState {
  /** Current state machine node */
  status: TimerStatus;

  /** The total duration set by the user, in milliseconds */
  durationMs: number;

  /** Milliseconds remaining in the current countdown */
  remainingMs: number;

  /** Milliseconds elapsed since the current run started */
  elapsedMs: number;

  /**
   * Wall-clock timestamp (Date.now()) when the current run segment started.
   * Reset on RESUME to the resume wall-clock time (not the original start).
   * Null when idle, paused, or completed.
   */
  startedAt: number | null;

  /**
   * Wall-clock timestamp when the timer was most recently paused.
   * Null when not paused.
   */
  pausedAt: number | null;

  /**
   * Wall-clock timestamp when the timer reached zero.
   * Null unless status === Completed.
   */
  completedAt: number | null;

  /**
   * Number of times the timer has been restarted in this session.
   * Used for analytics and optionally displayed in the UI.
   */
  lapCount: number;
}

// ---------------------------------------------------------------------------
// Persisted State Shape
// ---------------------------------------------------------------------------

/**
 * Shape written to / read from localStorage.
 * Identical to TimerState but all fields are optional (forward-compat with
 * schema migrations and partial writes).
 */
export interface PersistedTimerState {
  status?: TimerStatus;
  durationMs: number;
  remainingMs?: number;
  elapsedMs?: number;
  startedAt?: number | null;
  pausedAt?: number | null;
  completedAt?: number | null;
  lapCount?: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Set a new countdown duration (only valid when idle) */
export interface SetDurationAction {
  type: "SET_DURATION";
  payload: { durationMs: number };
}

/** Transition idle → running */
export interface StartAction {
  type: "START";
  payload: { startedAt: number };
}

/** Transition running → paused */
export interface PauseAction {
  type: "PAUSE";
  payload: { pausedAt: number };
}

/** Transition paused → running */
export interface ResumeAction {
  type: "RESUME";
  payload: { resumedAt: number };
}

/** Transition any → idle */
export interface ResetAction {
  type: "RESET";
}

/** Update remaining/elapsed time (running → running | running → completed) */
export interface TickAction {
  type: "TICK";
  payload: { remainingMs: number; elapsedMs: number };
}

/** Explicit completion signal (running → completed) */
export interface CompleteAction {
  type: "COMPLETE";
  payload: { completedAt: number };
}

/** Restart from completed (completed → running) */
export interface RestartAction {
  type: "RESTART";
  payload: { startedAt: number };
}

/** Restore persisted state on mount (mount-only) */
export interface HydrateAction {
  type: "HYDRATE";
  payload: { state: PersistedTimerState };
}

/** Discriminated union of all valid timer actions */
export type TimerAction =
  | SetDurationAction
  | StartAction
  | PauseAction
  | ResumeAction
  | ResetAction
  | TickAction
  | CompleteAction
  | RestartAction
  | HydrateAction;

// ---------------------------------------------------------------------------
// Hook Return Type
// ---------------------------------------------------------------------------

/**
 * The full public API surface returned by useTimer().
 */
export interface UseTimerReturn {
  // ── State ────────────────────────────────────────────────────────────────
  /** Full reducer state */
  state: TimerState;

  // ── Derived booleans ─────────────────────────────────────────────────────
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  isCompleted: boolean;

  /** true when idle and durationMs > 0 — Start button should be enabled */
  canStart: boolean;
  /** true when running — Pause button should be enabled */
  canPause: boolean;
  /** true when paused — Resume button should be enabled */
  canResume: boolean;
  /** true when running, paused, or completed — Reset button should be enabled */
  canReset: boolean;

  /**
   * 0.0 → 1.0 fraction of elapsed time.
   * 0 = no progress (idle / just started)
   * 1 = fully elapsed (completed)
   */
  progressFraction: number;

  // ── Action dispatchers ───────────────────────────────────────────────────
  /** Update the countdown duration (idle only) */
  setDuration: (durationMs: number) => void;
  /** Start the countdown from the full duration */
  start: () => void;
  /** Pause a running countdown */
  pause: () => void;
  /** Resume a paused countdown */
  resume: () => void;
  /** Reset to idle, preserving the current duration setting */
  reset: () => void;
  /** Restart immediately from completed state */
  restart: () => void;

  // ── Internal ─────────────────────────────────────────────────────────────
  /**
   * Restore persisted state from storage. Called exclusively by
   * useTimerPersistence on mount. Not for use in components.
   * @internal
   */
  hydrate: (state: PersistedTimerState) => void;

  /**
   * Raw dispatch. Available for advanced use cases (e.g. forcing a COMPLETE
   * from the visibility-change handler in useTimerPersistence).
   * Prefer the typed action dispatchers above where possible.
   * @internal
   */
  dispatch: React.Dispatch<TimerAction>;
}

// ---------------------------------------------------------------------------
// Timer Presets
// ---------------------------------------------------------------------------

export interface TimerPreset {
  /** Display label shown on the preset button */
  label: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Short description for tooltips / aria-label */
  description: string;
}

// ---------------------------------------------------------------------------
// Status Style Config (used by Badge / TimerDisplay)
// ---------------------------------------------------------------------------

export interface StatusStyleConfig {
  /** Tailwind text-color class */
  textClass: string;
  /** Tailwind bg-color class */
  bgClass: string;
  /** Tailwind ring/border class */
  ringClass: string;
  /** Human-readable label */
  label: string;
  /** Unicode/emoji icon */
  icon: string;
}

// ---------------------------------------------------------------------------
// Engine Callback Types
// ---------------------------------------------------------------------------

export interface TimerEngineCallbacks {
  /** Fired on each display-rate tick (~1 Hz) with updated timing values */
  onTick: (remainingMs: number, elapsedMs: number) => void;
  /** Fired once when the countdown reaches zero */
  onComplete: (completedAt: number) => void;
}

// ---------------------------------------------------------------------------
// Storage Schema
// ---------------------------------------------------------------------------

export interface StorageSchema {
  /** Schema version — increment on breaking changes */
  version: number;
  /** ISO timestamp of last write */
  savedAt: string;
  /** The timer state payload */
  timer: PersistedTimerState;
}