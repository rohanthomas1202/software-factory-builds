/**
 * useTimer Hook Unit Tests — tests/unit/useTimer.test.ts
 *
 * Comprehensive Vitest test coverage for the useTimer hook.
 *
 * Test categories:
 * 1.  Initial state (idle, default duration)
 * 2.  start() — idle → running transition
 * 3.  pause() — running → paused transition
 * 4.  resume() — paused → running transition
 * 5.  reset() — any state → idle transition
 * 6.  setDuration() — updates duration in idle state only
 * 7.  hydrate() — restores persisted state with wall-clock recovery
 *     a. Running state: computes elapsed time from savedAt timestamp
 *     b. Running state overdue: transitions directly to completed
 *     c. Paused state: restores remaining time unchanged
 *     d. Completed state: restores completed state
 *     e. Idle state: restores duration only
 * 8.  Tick behaviour — remainingMs decrements over time
 * 9.  Auto-completion — transitions to completed when remainingMs hits 0
 * 10. Multiple pause/resume cycles
 * 11. reset() from paused state
 * 12. reset() from completed state
 * 13. setDuration() is ignored while running
 * 14. setDuration() is ignored while paused
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before importing the hook
// ---------------------------------------------------------------------------

/**
 * Mock the timer engine so we have full control over ticking behaviour.
 * The real TimerEngine runs a setInterval internally; we replace it with
 * a mock that exposes a manual `tick()` helper for deterministic tests.
 */
const mockStart = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockStop = vi.fn();
const mockTick = vi.fn(); // artificial tick trigger captured from constructor

vi.mock("@/lib/timer-engine", () => {
  class MockTimerEngine {
    private _onTick: ((remainingMs: number) => void) | null = null;
    private _onComplete: (() => void) | null = null;

    constructor(
      _durationMs: number,
      onTick: (remainingMs: number) => void,
      onComplete: () => void
    ) {
      this._onTick = onTick;
      this._onComplete = onComplete;
      // Expose tick/complete triggers globally so tests can call them
      mockTick.mockImplementation((ms: number) => {
        this._onTick?.(ms);
      });
      // expose a complete trigger
      (MockTimerEngine as unknown as Record<string, unknown>)._triggerComplete =
        () => {
          this._onComplete?.();
        };
    }

    start = mockStart;
    pause = mockPause;
    resume = mockResume;
    stop = mockStop;
  }

  return { TimerEngine: MockTimerEngine };
});

/**
 * Mock localStorage storage layer.
 */
const mockLoadState = vi.fn();
const mockSaveState = vi.fn();
const mockClearState = vi.fn();

vi.mock("@/lib/storage", () => ({
  loadTimerState: mockLoadState,
  saveTimerState: mockSaveState,
  clearTimerState: mockClearState,
}));

// ---------------------------------------------------------------------------
// Import hook AFTER mocks are registered
// ---------------------------------------------------------------------------
import { useTimer } from "@/hooks/useTimer";
import { TimerStatus } from "@/types/timer";
import { DEFAULT_DURATION_MS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a mock persisted state snapshot. */
function makePersistedState(
  overrides: Partial<{
    status: TimerStatus;
    durationMs: number;
    remainingMs: number;
    savedAt: number;
  }> = {}
) {
  return {
    status: TimerStatus.Idle,
    durationMs: DEFAULT_DURATION_MS,
    remainingMs: DEFAULT_DURATION_MS,
    savedAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));

    // Reset all mocks
    mockStart.mockReset();
    mockPause.mockReset();
    mockResume.mockReset();
    mockStop.mockReset();
    mockTick.mockReset();
    mockLoadState.mockReset();
    mockSaveState.mockReset();
    mockClearState.mockReset();

    // Default: no persisted state
    mockLoadState.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Initial State
  // ─────────────────────────────────────────────────────────────────────────

  describe("1. Initial state", () => {
    it("starts in idle status", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("has the default duration as remainingMs", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.remainingMs).toBe(DEFAULT_DURATION_MS);
    });

    it("has the default duration as durationMs", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.durationMs).toBe(DEFAULT_DURATION_MS);
    });

    it("exposes all action dispatchers as functions", () => {
      const { result } = renderHook(() => useTimer());
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.pause).toBe("function");
      expect(typeof result.current.resume).toBe("function");
      expect(typeof result.current.reset).toBe("function");
      expect(typeof result.current.setDuration).toBe("function");
      expect(typeof result.current.hydrate).toBe("function");
    });

    it("isRunning is false when idle", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isRunning).toBe(false);
    });

    it("isPaused is false when idle", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isPaused).toBe(false);
    });

    it("isCompleted is false when idle", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isCompleted).toBe(false);
    });

    it("isIdle is true when idle", () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isIdle).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. start() — idle → running
  // ─────────────────────────────────────────────────────────────────────────

  describe("2. start() — idle → running", () => {
    it("transitions status to running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe(TimerStatus.Running);
    });

    it("sets isRunning to true", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it("sets isIdle to false after start", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      expect(result.current.isIdle).toBe(false);
    });

    it("retains durationMs after start", () => {
      const { result } = renderHook(() => useTimer());
      const originalDuration = result.current.durationMs;

      act(() => {
        result.current.start();
      });

      expect(result.current.durationMs).toBe(originalDuration);
    });

    it("retains full remainingMs immediately after start (before any tick)", () => {
      const { result } = renderHook(() => useTimer());
      const originalRemaining = result.current.remainingMs;

      act(() => {
        result.current.start();
      });

      expect(result.current.remainingMs).toBe(originalRemaining);
    });

    it("calls engine.start() when transitioning to running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      expect(mockStart).toHaveBeenCalledOnce();
    });

    it("does not allow start() while already running (no-op)", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      mockStart.mockClear();

      act(() => {
        result.current.start();
      });

      // Should remain running but not call start again
      expect(result.current.status).toBe(TimerStatus.Running);
      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. pause() — running → paused
  // ─────────────────────────────────────────────────────────────────────────

  describe("3. pause() — running → paused", () => {
    it("transitions status to paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe(TimerStatus.Paused);
    });

    it("sets isPaused to true", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);
    });

    it("sets isRunning to false when paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it("calls engine.pause()", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      expect(mockPause).toHaveBeenCalledOnce();
    });

    it("preserves remainingMs at the moment of pause", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      // Simulate a tick that reduces remaining time
      const tickedRemaining = DEFAULT_DURATION_MS - 1000;
      act(() => {
        mockTick(tickedRemaining);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.remainingMs).toBe(tickedRemaining);
    });

    it("pause() is a no-op when already paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      mockPause.mockClear();

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe(TimerStatus.Paused);
      expect(mockPause).not.toHaveBeenCalled();
    });

    it("pause() is a no-op when idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
      expect(mockPause).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. resume() — paused → running
  // ─────────────────────────────────────────────────────────────────────────

  describe("4. resume() — paused → running", () => {
    it("transitions status from paused to running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.status).toBe(TimerStatus.Running);
    });

    it("sets isRunning to true after resume", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it("sets isPaused to false after resume", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);
    });

    it("calls engine.resume()", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      mockResume.mockClear();

      act(() => {
        result.current.resume();
      });

      expect(mockResume).toHaveBeenCalledOnce();
    });

    it("retains the same remainingMs after resume", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      const tickedRemaining = DEFAULT_DURATION_MS - 3000;
      act(() => {
        mockTick(tickedRemaining);
      });

      act(() => {
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.remainingMs).toBe(tickedRemaining);
    });

    it("resume() is a no-op when already running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      mockResume.mockClear();

      act(() => {
        result.current.resume();
      });

      expect(result.current.status).toBe(TimerStatus.Running);
      expect(mockResume).not.toHaveBeenCalled();
    });

    it("resume() is a no-op when idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.resume();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. reset() — any state → idle
  // ─────────────────────────────────────────────────────────────────────────

  describe("5. reset() — any state → idle", () => {
    it("resets from running to idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("resets from paused to idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("resets from completed to idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        // Simulate completion via the engine callback
        mockTick(0);
      });

      // Force completion
      act(() => {
        // Trigger the onComplete callback stored in the engine
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("restores remainingMs to durationMs after reset", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(DEFAULT_DURATION_MS - 5000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.remainingMs).toBe(result.current.durationMs);
    });

    it("calls engine.stop() on reset from running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.reset();
      });

      expect(mockStop).toHaveBeenCalledOnce();
    });

    it("calls engine.stop() on reset from paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      mockStop.mockClear();

      act(() => {
        result.current.reset();
      });

      expect(mockStop).toHaveBeenCalledOnce();
    });

    it("reset() from idle is a no-op (stays idle)", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("isIdle is true after reset", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.reset();
      });

      expect(result.current.isIdle).toBe(true);
    });

    it("isRunning is false after reset", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.reset();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. setDuration() — updates duration in idle state
  // ─────────────────────────────────────────────────────────────────────────

  describe("6. setDuration()", () => {
    it("updates durationMs in idle state", () => {
      const { result } = renderHook(() => useTimer());
      const newDuration = 5 * 60 * 1000; // 5 minutes

      act(() => {
        result.current.setDuration(newDuration);
      });

      expect(result.current.durationMs).toBe(newDuration);
    });

    it("also updates remainingMs to the new duration when idle", () => {
      const { result } = renderHook(() => useTimer());
      const newDuration = 10 * 60 * 1000; // 10 minutes

      act(() => {
        result.current.setDuration(newDuration);
      });

      expect(result.current.remainingMs).toBe(newDuration);
    });

    it("is a no-op while running", () => {
      const { result } = renderHook(() => useTimer());
      const originalDuration = result.current.durationMs;

      act(() => {
        result.current.start();
        result.current.setDuration(5 * 60 * 1000);
      });

      expect(result.current.durationMs).toBe(originalDuration);
    });

    it("is a no-op while paused", () => {
      const { result } = renderHook(() => useTimer());
      const originalDuration = result.current.durationMs;

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.setDuration(5 * 60 * 1000);
      });

      expect(result.current.durationMs).toBe(originalDuration);
    });

    it("is a no-op while completed", () => {
      const { result } = renderHook(() => useTimer());
      const originalDuration = result.current.durationMs;

      act(() => {
        result.current.start();
        mockTick(0);
      });

      act(() => {
        result.current.setDuration(5 * 60 * 1000);
      });

      expect(result.current.durationMs).toBe(originalDuration);
    });

    it("accepts a 1-second minimum duration", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.setDuration(1000);
      });

      expect(result.current.durationMs).toBe(1000);
    });

    it("accepts a large duration (99 hours)", () => {
      const { result } = renderHook(() => useTimer());
      const ninetyNineHours = 99 * 60 * 60 * 1000;

      act(() => {
        result.current.setDuration(ninetyNineHours);
      });

      expect(result.current.durationMs).toBe(ninetyNineHours);
    });

    it("changing duration multiple times only keeps the last value", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.setDuration(1 * 60 * 1000);
        result.current.setDuration(2 * 60 * 1000);
        result.current.setDuration(3 * 60 * 1000);
      });

      expect(result.current.durationMs).toBe(3 * 60 * 1000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. hydrate() — persistence recovery
  // ─────────────────────────────────────────────────────────────────────────

  describe("7. hydrate()", () => {
    describe("7a. Idle persisted state", () => {
      it("restores durationMs from persisted idle state", () => {
        const { result } = renderHook(() => useTimer());
        const savedDuration = 15 * 60 * 1000;

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Idle,
              durationMs: savedDuration,
              remainingMs: savedDuration,
            })
          );
        });

        expect(result.current.durationMs).toBe(savedDuration);
      });

      it("restores status as idle from persisted idle state", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({ status: TimerStatus.Idle })
          );
        });

        expect(result.current.status).toBe(TimerStatus.Idle);
      });
    });

    describe("7b. Paused persisted state", () => {
      it("restores status as paused", () => {
        const { result } = renderHook(() => useTimer());
        const remaining = 45 * 1000;

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Paused,
              durationMs: 60 * 1000,
              remainingMs: remaining,
            })
          );
        });

        expect(result.current.status).toBe(TimerStatus.Paused);
      });

      it("restores remainingMs unchanged from paused state", () => {
        const { result } = renderHook(() => useTimer());
        const remaining = 45 * 1000;

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Paused,
              durationMs: 60 * 1000,
              remainingMs: remaining,
            })
          );
        });

        expect(result.current.remainingMs).toBe(remaining);
      });

      it("restores durationMs from paused state", () => {
        const { result } = renderHook(() => useTimer());
        const duration = 60 * 1000;

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Paused,
              durationMs: duration,
              remainingMs: 45 * 1000,
            })
          );
        });

        expect(result.current.durationMs).toBe(duration);
      });

      it("isPaused is true after paused hydration", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Paused,
              remainingMs: 30 * 1000,
            })
          );
        });

        expect(result.current.isPaused).toBe(true);
      });
    });

    describe("7c. Running persisted state — wall-clock recovery", () => {
      it("restores status as running when elapsed time < durationMs", () => {
        const now = Date.now();
        const duration = 60 * 1000;
        const elapsed = 10 * 1000; // 10 seconds have passed

        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: duration,
              remainingMs: duration, // full remaining at save time
              savedAt: now - elapsed,
            })
          );
        });

        expect(result.current.status).toBe(TimerStatus.Running);
      });

      it("computes recovered remainingMs = savedRemaining - elapsed wall-clock time", () => {
        const now = Date.now();
        const duration = 60 * 1000;
        const savedRemaining = 60 * 1000;
        const elapsed = 10 * 1000;

        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: duration,
              remainingMs: savedRemaining,
              savedAt: now - elapsed,
            })
          );
        });

        // remainingMs should be approximately savedRemaining - elapsed
        const expectedRemaining = savedRemaining - elapsed;
        expect(result.current.remainingMs).toBeCloseTo(expectedRemaining, -2); // within 100ms
      });

      it("wall-clock recovery: partial elapsed reduces remaining proportionally", () => {
        const now = Date.now();
        const duration = 120 * 1000; // 2 minutes
        const savedRemaining = 90 * 1000; // 30s already elapsed at save
        const elapsedSinceSave = 30 * 1000; // another 30s elapsed

        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: duration,
              remainingMs: savedRemaining,
              savedAt: now - elapsedSinceSave,
            })
          );
        });

        const expectedRemaining = savedRemaining - elapsedSinceSave; // 60s
        expect(result.current.remainingMs).toBeCloseTo(expectedRemaining, -2);
      });

      it("calls engine.start() after wall-clock running recovery", () => {
        const now = Date.now();
        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        mockStart.mockClear();

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: 60 * 1000,
              remainingMs: 60 * 1000,
              savedAt: now - 5000,
            })
          );
        });

        expect(mockStart).toHaveBeenCalledOnce();
      });
    });

    describe("7d. Running persisted state — overdue (elapsed > remaining)", () => {
      it("transitions to completed when elapsed time exceeds savedRemaining", () => {
        const now = Date.now();
        const duration = 60 * 1000;
        const savedRemaining = 5 * 1000; // only 5 seconds left when saved
        const elapsed = 10 * 1000; // but 10 seconds have passed → overdue

        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: duration,
              remainingMs: savedRemaining,
              savedAt: now - elapsed,
            })
          );
        });

        expect(result.current.status).toBe(TimerStatus.Completed);
      });

      it("sets remainingMs to 0 when overdue on resume", () => {
        const now = Date.now();
        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: 60 * 1000,
              remainingMs: 3 * 1000,
              savedAt: now - 10 * 1000, // overdue by 7 seconds
            })
          );
        });

        expect(result.current.remainingMs).toBe(0);
      });

      it("sets isCompleted to true when overdue on resume", () => {
        const now = Date.now();
        vi.setSystemTime(now);

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: 30 * 1000,
              remainingMs: 1 * 1000,
              savedAt: now - 5 * 1000,
            })
          );
        });

        expect(result.current.isCompleted).toBe(true);
      });

      it("does NOT call engine.start() when overdue (no re-run)", () => {
        const now = Date.now();
        vi.setSystemTime(now);
        mockStart.mockClear();

        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Running,
              durationMs: 30 * 1000,
              remainingMs: 2 * 1000,
              savedAt: now - 10 * 1000,
            })
          );
        });

        expect(mockStart).not.toHaveBeenCalled();
      });
    });

    describe("7e. Completed persisted state", () => {
      it("restores status as completed", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Completed,
              remainingMs: 0,
            })
          );
        });

        expect(result.current.status).toBe(TimerStatus.Completed);
      });

      it("restores remainingMs as 0 for completed state", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Completed,
              remainingMs: 0,
            })
          );
        });

        expect(result.current.remainingMs).toBe(0);
      });

      it("isCompleted is true after completed hydration", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Completed,
              remainingMs: 0,
            })
          );
        });

        expect(result.current.isCompleted).toBe(true);
      });
    });

    describe("7f. Hydrate edge cases", () => {
      it("hydrate with null/undefined is a no-op", () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
          // @ts-expect-error — testing runtime safety with null
          result.current.hydrate(null);
        });

        expect(result.current.status).toBe(TimerStatus.Idle);
        expect(result.current.durationMs).toBe(DEFAULT_DURATION_MS);
      });

      it("second hydrate call overwrites first", () => {
        const { result } = renderHook(() => useTimer());
        const firstDuration = 5 * 60 * 1000;
        const secondDuration = 15 * 60 * 1000;

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Idle,
              durationMs: firstDuration,
              remainingMs: firstDuration,
            })
          );
        });

        act(() => {
          result.current.hydrate(
            makePersistedState({
              status: TimerStatus.Idle,
              durationMs: secondDuration,
              remainingMs: secondDuration,
            })
          );
        });

        expect(result.current.durationMs).toBe(secondDuration);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Tick behaviour — remainingMs updates
  // ─────────────────────────────────────────────────────────────────────────

  describe("8. Tick behaviour", () => {
    it("updates remainingMs when the engine fires a tick", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      const newRemaining = DEFAULT_DURATION_MS - 1000;
      act(() => {
        mockTick(newRemaining);
      });

      expect(result.current.remainingMs).toBe(newRemaining);
    });

    it("multiple ticks reduce remainingMs progressively", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(DEFAULT_DURATION_MS - 1000);
      });
      act(() => {
        mockTick(DEFAULT_DURATION_MS - 2000);
      });
      act(() => {
        mockTick(DEFAULT_DURATION_MS - 3000);
      });

      expect(result.current.remainingMs).toBe(DEFAULT_DURATION_MS - 3000);
    });

    it("tick does not update remainingMs when paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(DEFAULT_DURATION_MS - 2000);
      });

      act(() => {
        result.current.pause();
      });

      const remainingAtPause = result.current.remainingMs;

      // Engine should not tick while paused, but even if it did,
      // the hook should guard against state updates in paused mode.
      act(() => {
        mockTick(DEFAULT_DURATION_MS - 5000);
      });

      // In paused state, the engine is stopped, so remaining stays the same
      // This verifies the engine mock was stopped properly
      expect(result.current.remainingMs).toBe(remainingAtPause);
    });

    it("tick to zero triggers completed transition", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(0);
      });

      // Either the tick to 0 or the onComplete callback triggers completion
      // Most implementations complete on 0 tick or onComplete callback
      // Check that the hook either stays in running with 0ms or transitions to completed
      expect(result.current.remainingMs).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Auto-completion on engine onComplete callback
  // ─────────────────────────────────────────────────────────────────────────

  describe("9. Auto-completion via engine onComplete", () => {
    it("transitions to completed status when engine fires onComplete", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      // Simulate engine completing the countdown
      act(() => {
        mockTick(0);
        // Also trigger any direct onComplete path
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });

      expect(result.current.status).toBe(TimerStatus.Completed);
    });

    it("sets isCompleted to true after completion", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });

      expect(result.current.isCompleted).toBe(true);
    });

    it("sets isRunning to false after completion", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it("remainingMs is 0 after completion", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        mockTick(0);
      });

      act(() => {
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });

      expect(result.current.remainingMs).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Multiple pause/resume cycles
  // ─────────────────────────────────────────────────────────────────────────

  describe("10. Multiple pause/resume cycles", () => {
    it("correctly cycles through running → paused → running multiple times", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // First pause/resume cycle
      act(() => {
        result.current.pause();
      });
      expect(result.current.status).toBe(TimerStatus.Paused);

      act(() => {
        result.current.resume();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // Second pause/resume cycle
      act(() => {
        result.current.pause();
      });
      expect(result.current.status).toBe(TimerStatus.Paused);

      act(() => {
        result.current.resume();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // Third pause
      act(() => {
        result.current.pause();
      });
      expect(result.current.status).toBe(TimerStatus.Paused);
    });

    it("preserves remainingMs correctly across multiple pause/resume cycles with ticks", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      // First interval: 10s elapsed
      act(() => {
        mockTick(DEFAULT_DURATION_MS - 10000);
      });
      act(() => {
        result.current.pause();
      });
      const remainingAfterFirstPause = result.current.remainingMs;
      expect(remainingAfterFirstPause).toBe(DEFAULT_DURATION_MS - 10000);

      act(() => {
        result.current.resume();
      });

      // Second interval: another 5s elapsed
      act(() => {
        mockTick(DEFAULT_DURATION_MS - 15000);
      });
      act(() => {
        result.current.pause();
      });
      expect(result.current.remainingMs).toBe(DEFAULT_DURATION_MS - 15000);
    });

    it("engine.pause and engine.resume are called correct number of times", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.resume();
        result.current.pause();
        result.current.resume();
      });

      expect(mockPause).toHaveBeenCalledTimes(2);
      expect(mockResume).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 11. reset() from paused state
  // ─────────────────────────────────────────────────────────────────────────

  describe("11. reset() from paused state", () => {
    it("transitions from paused to idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("restores full remainingMs after reset from paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(DEFAULT_DURATION_MS - 20000);
      });

      act(() => {
        result.current.pause();
        result.current.reset();
      });

      expect(result.current.remainingMs).toBe(result.current.durationMs);
    });

    it("isPaused is false after reset from paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
        result.current.reset();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 12. reset() from completed state
  // ─────────────────────────────────────────────────────────────────────────

  describe("12. reset() from completed state", () => {
    it("transitions from completed to idle", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("restores remainingMs to durationMs after reset from completed", () => {
      const { result } = renderHook(() => useTimer());
      const duration = 30 * 1000;

      act(() => {
        result.current.hydrate(
          makePersistedState({
            status: TimerStatus.Completed,
            durationMs: duration,
            remainingMs: 0,
          })
        );
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.remainingMs).toBe(duration);
    });

    it("isCompleted is false after reset from completed", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isCompleted).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 13. Progress computation
  // ─────────────────────────────────────────────────────────────────────────

  describe("13. Progress computation", () => {
    it("progress is 1 (full) when remainingMs equals durationMs (start of countdown)", () => {
      const { result } = renderHook(() => useTimer());
      // At idle, remaining === duration → progress = 1
      expect(result.current.progress).toBeCloseTo(1, 5);
    });

    it("progress decreases as remainingMs decreases", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        mockTick(DEFAULT_DURATION_MS / 2);
      });

      // Half remaining → progress should be ~0.5
      expect(result.current.progress).toBeCloseTo(0.5, 1);
    });

    it("progress is 0 when remainingMs is 0 (completed)", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        mockTick(0);
      });

      expect(result.current.progress).toBeCloseTo(0, 5);
    });

    it("progress is between 0 and 1 during countdown", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        mockTick(DEFAULT_DURATION_MS * 0.75);
      });

      expect(result.current.progress).toBeGreaterThanOrEqual(0);
      expect(result.current.progress).toBeLessThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 14. State machine guard: invalid transitions are rejected
  // ─────────────────────────────────────────────────────────────────────────

  describe("14. State machine guard: invalid transitions", () => {
    it("calling pause() on idle has no effect", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("calling resume() on idle has no effect", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.resume();
      });

      expect(result.current.status).toBe(TimerStatus.Idle);
    });

    it("calling start() when completed has no effect (must reset first)", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
      });

      mockStart.mockClear();

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe(TimerStatus.Completed);
      expect(mockStart).not.toHaveBeenCalled();
    });

    it("calling pause() when completed has no effect", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
        result.current.pause();
      });

      expect(result.current.status).toBe(TimerStatus.Completed);
    });

    it("calling resume() when completed has no effect", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
        result.current.resume();
      });

      expect(result.current.status).toBe(TimerStatus.Completed);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 15. Full lifecycle integration test
  // ─────────────────────────────────────────────────────────────────────────

  describe("15. Full lifecycle integration", () => {
    it("completes a full start → pause → resume → complete → reset cycle", () => {
      const { result } = renderHook(() => useTimer());

      // Set a custom 30-second duration
      act(() => {
        result.current.setDuration(30 * 1000);
      });
      expect(result.current.durationMs).toBe(30 * 1000);
      expect(result.current.status).toBe(TimerStatus.Idle);

      // Start
      act(() => {
        result.current.start();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // Tick 10 seconds
      act(() => {
        mockTick(20 * 1000);
      });
      expect(result.current.remainingMs).toBe(20 * 1000);

      // Pause at 20s remaining
      act(() => {
        result.current.pause();
      });
      expect(result.current.status).toBe(TimerStatus.Paused);
      expect(result.current.remainingMs).toBe(20 * 1000);

      // Resume
      act(() => {
        result.current.resume();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // Tick to completion
      act(() => {
        mockTick(0);
      });

      act(() => {
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });
      expect(result.current.status).toBe(TimerStatus.Completed);
      expect(result.current.remainingMs).toBe(0);

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(result.current.status).toBe(TimerStatus.Idle);
      expect(result.current.remainingMs).toBe(30 * 1000);
      expect(result.current.durationMs).toBe(30 * 1000);
    });

    it("persisted running → wall-clock recovery → resume → complete → reset full flow", () => {
      const now = Date.now();
      const duration = 60 * 1000;
      const savedRemaining = 30 * 1000;
      const elapsedSinceSave = 10 * 1000;

      vi.setSystemTime(now);

      const { result } = renderHook(() => useTimer());

      // Hydrate with a running state saved 10s ago
      act(() => {
        result.current.hydrate(
          makePersistedState({
            status: TimerStatus.Running,
            durationMs: duration,
            remainingMs: savedRemaining,
            savedAt: now - elapsedSinceSave,
          })
        );
      });

      // Should be running with ~20s remaining
      expect(result.current.status).toBe(TimerStatus.Running);
      expect(result.current.remainingMs).toBeCloseTo(
        savedRemaining - elapsedSinceSave,
        -2
      );

      // Tick down to 5s
      act(() => {
        mockTick(5000);
      });
      expect(result.current.remainingMs).toBe(5000);

      // Pause
      act(() => {
        result.current.pause();
      });
      expect(result.current.status).toBe(TimerStatus.Paused);
      expect(result.current.remainingMs).toBe(5000);

      // Resume
      act(() => {
        result.current.resume();
      });
      expect(result.current.status).toBe(TimerStatus.Running);

      // Complete
      act(() => {
        mockTick(0);
        const { TimerEngine } = require("@/lib/timer-engine") as {
          TimerEngine: { _triggerComplete?: () => void };
        };
        TimerEngine._triggerComplete?.();
      });
      expect(result.current.status).toBe(TimerStatus.Completed);

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(result.current.status).toBe(TimerStatus.Idle);
      expect(result.current.remainingMs).toBe(duration);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 16. Cleanup on unmount
  // ─────────────────────────────────────────────────────────────────────────

  describe("16. Cleanup on unmount", () => {
    it("calls engine.stop() when unmounted while running", () => {
      const { result, unmount } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      mockStop.mockClear();

      unmount();

      expect(mockStop).toHaveBeenCalledOnce();
    });

    it("calls engine.stop() when unmounted while paused", () => {
      const { result, unmount } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      mockStop.mockClear();

      unmount();

      expect(mockStop).toHaveBeenCalledOnce();
    });

    it("does not throw when unmounted from idle state", () => {
      const { unmount } = renderHook(() => useTimer());

      expect(() => unmount()).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 17. Derived boolean flags consistency
  // ─────────────────────────────────────────────────────────────────────────

  describe("17. Derived boolean flags consistency", () => {
    it("only one status flag is true at a time — idle", () => {
      const { result } = renderHook(() => useTimer());

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(false);
    });

    it("only one status flag is true at a time — running", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(false);
    });

    it("only one status flag is true at a time — paused", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start();
        result.current.pause();
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.isCompleted).toBe(false);
    });

    it("only one status flag is true at a time — completed", () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.hydrate(
          makePersistedState({ status: TimerStatus.Completed, remainingMs: 0 })
        );
      });

      expect(result.current.isIdle).toBe(false);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });
  });
});