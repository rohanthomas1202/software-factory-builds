/**
 * Framework-agnostic countdown timer engine.
 *
 * Implements a wall-clock drift-corrected timer using Date.now() comparisons
 * on every ~100ms setInterval tick. Manages state machine transitions:
 *
 *   idle → running → paused → running → ... → completed
 *   any  → idle   (via reset)
 *
 * Display updates are throttled to ~1 second to avoid unnecessary re-renders,
 * while the internal tick runs at ~100ms for drift correction precision.
 *
 * Drift correction strategy:
 *   On each tick we compute how much wall-clock time has actually elapsed
 *   since the engine last entered the running state (accounting for any
 *   previous paused duration). We then derive `remainingMs` from the
 *   original `durationMs` minus that elapsed time, rather than decrementing
 *   a counter — so accumulated jitter never compounds.
 *
 * State machine:
 *   ┌────────┐  start()  ┌─────────┐  (time=0)  ┌───────────┐
 *   │  idle  │ ─────────▶│ running │ ──────────▶ │ completed │
 *   └────────┘           └─────────┘             └───────────┘
 *        ▲                 │     ▲                      │
 *        │    pause()      ▼     │ resume()             │
 *        │              ┌────────┴┐                     │
 *        └──────────────│  paused │◀────────────────────┘
 *           reset()     └─────────┘        reset()
 *   (reset() works from any state)
 */

import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Snapshot of the timer engine's current state, emitted on every display-
 * throttled tick and on every state transition.
 */
export interface TimerSnapshot {
  /** Current state machine status. */
  status: TimerStatus;
  /** Total configured duration in milliseconds. */
  durationMs: number;
  /** Milliseconds remaining (0 when completed). */
  remainingMs: number;
  /**
   * Progress fraction in [0, 1].
   * 1.0 = full duration remaining (just started or idle).
   * 0.0 = no time remaining (completed).
   */
  progress: number;
  /**
   * Monotonically increasing counter incremented on every display-throttled
   * update. Consumers can compare this value to detect a new render cycle
   * without deep-comparing the whole snapshot.
   */
  tickCount: number;
}

/**
 * Callbacks supplied to createTimerEngine at construction time.
 * All callbacks are optional — omit any you don't need.
 */
export interface TimerEngineCallbacks {
  /**
   * Fired on every display-throttled tick (~1 s) while running,
   * and once immediately when start/resume is called.
   */
  onTick?: (snapshot: TimerSnapshot) => void;
  /**
   * Fired exactly once when remainingMs reaches zero.
   * Receives the final (zero-remaining) snapshot.
   */
  onComplete?: (snapshot: TimerSnapshot) => void;
  /**
   * Fired on every status transition (idle→running, running→paused, etc.)
   * and once on engine construction to deliver the initial idle snapshot.
   */
  onStateChange?: (snapshot: TimerSnapshot) => void;
}

/**
 * Imperative handle returned by createTimerEngine.
 */
export interface TimerEngine {
  /** Transition idle → running. No-op if not idle. */
  start: () => void;
  /** Transition running → paused. No-op if not running. */
  pause: () => void;
  /** Transition paused → running. No-op if not paused. */
  resume: () => void;
  /**
   * Transition any state → idle.
   * Optionally supply a new duration (ms); otherwise the original duration
   * is preserved so the user can restart with the same settings.
   */
  reset: (newDurationMs?: number) => void;
  /**
   * Read the current snapshot synchronously without firing any callbacks.
   * Useful for initialising React state from a persisted engine handle.
   */
  getSnapshot: () => TimerSnapshot;
  /**
   * Release all resources held by the engine (clears the interval).
   * Call this in React cleanup / component unmount to avoid memory leaks.
   */
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface InternalState {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  /**
   * Wall-clock timestamp (Date.now()) recorded when the engine most recently
   * *entered the running state* (either via start() or resume()).
   * null when idle or paused.
   */
  runStartWallTime: number | null;
  /**
   * Total milliseconds already counted before the most recent
   * start/resume call. Accumulates across pause/resume cycles.
   */
  elapsedBeforeResume: number;
  tickCount: number;
  /** Wall-clock time of the last display-throttled onTick callback. */
  lastDisplayTickWallTime: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How often the internal setInterval fires for drift correction (ms). */
const TICK_INTERVAL_MS = 100;

/** Minimum elapsed wall-clock time between onTick display callbacks (ms). */
const DISPLAY_THROTTLE_MS = 950; // slightly under 1 s to avoid drift in the other direction

/** Floor for durationMs to prevent nonsensical timers. */
const MIN_DURATION_MS = 1_000;

/** Maximum duration: 99 hours 59 minutes 59 seconds. */
const MAX_DURATION_MS = (99 * 3_600 + 59 * 60 + 59) * 1_000;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a new drift-corrected countdown timer engine.
 *
 * @param initialDurationMs - Total countdown duration in milliseconds.
 *   Clamped to [MIN_DURATION_MS, MAX_DURATION_MS].
 * @param callbacks - Optional callback handlers (onTick, onComplete, onStateChange).
 * @returns Imperative TimerEngine API.
 *
 * @example
 * ```ts
 * const engine = createTimerEngine(5 * 60 * 1000, {
 *   onTick: (snap) => setRemaining(snap.remainingMs),
 *   onComplete: () => alert("Done!"),
 *   onStateChange: (snap) => setStatus(snap.status),
 * });
 * engine.start();
 * // later…
 * engine.destroy();
 * ```
 */
export function createTimerEngine(
  initialDurationMs: number,
  callbacks: TimerEngineCallbacks = {}
): TimerEngine {
  // -------------------------------------------------------------------------
  // Validate and clamp duration
  // -------------------------------------------------------------------------
  const clampedDuration = Math.max(
    MIN_DURATION_MS,
    Math.min(MAX_DURATION_MS, Math.round(initialDurationMs))
  );

  // -------------------------------------------------------------------------
  // Mutable internal state (plain object — not reactive)
  // -------------------------------------------------------------------------
  const state: InternalState = {
    status: TimerStatus.Idle,
    durationMs: clampedDuration,
    remainingMs: clampedDuration,
    runStartWallTime: null,
    elapsedBeforeResume: 0,
    tickCount: 0,
    lastDisplayTickWallTime: null,
  };

  // setInterval handle — null when not running
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  // -------------------------------------------------------------------------
  // Snapshot builder
  // -------------------------------------------------------------------------

  function buildSnapshot(): TimerSnapshot {
    const progress =
      state.durationMs > 0
        ? Math.max(0, Math.min(1, state.remainingMs / state.durationMs))
        : 0;
    return {
      status: state.status,
      durationMs: state.durationMs,
      remainingMs: Math.max(0, state.remainingMs),
      progress,
      tickCount: state.tickCount,
    };
  }

  // -------------------------------------------------------------------------
  // Core tick handler — called by setInterval ~every 100 ms
  // -------------------------------------------------------------------------

  function tick(): void {
    if (
      state.status !== TimerStatus.Running ||
      state.runStartWallTime === null
    ) {
      return;
    }

    const now = Date.now();

    // Wall-clock elapsed since the last resume/start, plus any prior elapsed
    const wallElapsed = now - state.runStartWallTime;
    const totalElapsed = state.elapsedBeforeResume + wallElapsed;

    // Derive remaining from duration — never accumulate errors
    const rawRemaining = state.durationMs - totalElapsed;
    const newRemaining = Math.max(0, rawRemaining);

    state.remainingMs = newRemaining;

    // -----------------------------------------------------------------------
    // Completion check — fires before display throttle so final state is exact
    // -----------------------------------------------------------------------
    if (newRemaining === 0) {
      state.status = TimerStatus.Completed;
      state.remainingMs = 0;
      state.tickCount += 1;
      stopInterval();
      const snap = buildSnapshot();
      callbacks.onTick?.(snap);
      callbacks.onComplete?.(snap);
      callbacks.onStateChange?.(snap);
      return;
    }

    // -----------------------------------------------------------------------
    // Display throttle — only fire onTick if ≥ DISPLAY_THROTTLE_MS has passed
    // since the last display update
    // -----------------------------------------------------------------------
    const shouldDisplay =
      state.lastDisplayTickWallTime === null ||
      now - state.lastDisplayTickWallTime >= DISPLAY_THROTTLE_MS;

    if (shouldDisplay) {
      state.tickCount += 1;
      state.lastDisplayTickWallTime = now;
      callbacks.onTick?.(buildSnapshot());
    }
  }

  // -------------------------------------------------------------------------
  // Interval helpers
  // -------------------------------------------------------------------------

  function startInterval(): void {
    if (intervalHandle !== null) return; // already running
    intervalHandle = setInterval(tick, TICK_INTERVAL_MS);
  }

  function stopInterval(): void {
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  // -------------------------------------------------------------------------
  // Emit initial idle snapshot so consumers can initialise their state
  // -------------------------------------------------------------------------
  callbacks.onStateChange?.(buildSnapshot());

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  function start(): void {
    if (state.status !== TimerStatus.Idle) return;

    state.status = TimerStatus.Running;
    state.runStartWallTime = Date.now();
    state.elapsedBeforeResume = 0;
    state.lastDisplayTickWallTime = Date.now();
    state.tickCount += 1;

    const snap = buildSnapshot();
    callbacks.onStateChange?.(snap);
    callbacks.onTick?.(snap); // immediate tick on start

    startInterval();
  }

  function pause(): void {
    if (state.status !== TimerStatus.Running) return;
    if (state.runStartWallTime === null) return;

    // Accumulate elapsed time so resume can continue from the right place
    const wallElapsed = Date.now() - state.runStartWallTime;
    state.elapsedBeforeResume += wallElapsed;
    state.runStartWallTime = null;

    state.status = TimerStatus.Paused;
    state.tickCount += 1;

    stopInterval();

    callbacks.onStateChange?.(buildSnapshot());
    callbacks.onTick?.(buildSnapshot()); // update display immediately on pause
  }

  function resume(): void {
    if (state.status !== TimerStatus.Paused) return;

    state.status = TimerStatus.Running;
    state.runStartWallTime = Date.now();
    state.lastDisplayTickWallTime = Date.now();
    state.tickCount += 1;

    const snap = buildSnapshot();
    callbacks.onStateChange?.(snap);
    callbacks.onTick?.(snap); // immediate tick on resume

    startInterval();
  }

  function reset(newDurationMs?: number): void {
    stopInterval();

    // Optionally update duration
    if (newDurationMs !== undefined) {
      const clamped = Math.max(
        MIN_DURATION_MS,
        Math.min(MAX_DURATION_MS, Math.round(newDurationMs))
      );
      state.durationMs = clamped;
    }

    state.status = TimerStatus.Idle;
    state.remainingMs = state.durationMs;
    state.runStartWallTime = null;
    state.elapsedBeforeResume = 0;
    state.lastDisplayTickWallTime = null;
    state.tickCount += 1;

    callbacks.onStateChange?.(buildSnapshot());
  }

  function getSnapshot(): TimerSnapshot {
    return buildSnapshot();
  }

  function destroy(): void {
    stopInterval();
  }

  return { start, pause, resume, reset, getSnapshot, destroy };
}

// ---------------------------------------------------------------------------
// Re-export TimerStatus for consumers that only import from this module
// ---------------------------------------------------------------------------
export { TimerStatus };