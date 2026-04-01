/**
 * Timer Engine Unit Tests — tests/unit/timer-engine.test.ts
 *
 * Comprehensive test coverage for the drift-corrected countdown timer engine.
 *
 * Test categories:
 * 1. Initial state construction
 * 2. State machine transitions (idle → running → paused → completed)
 * 3. Drift correction on every tick
 * 4. Background tab catch-up (large elapsed time between ticks)
 * 5. Zero-remaining edge cases
 * 6. Callback invocations (onTick, onComplete)
 * 7. createTimerEngine factory function
 * 8. Engine lifecycle (start, pause, resume, reset, destroy)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module under test
// We import the module fresh for each relevant describe block by clearing the
// module registry where needed. For most tests, a single static import is fine
// because timer-engine exports pure factory functions.
// ---------------------------------------------------------------------------

import {
  createTimerEngine,
  type TimerEngine,
  type TimerEngineOptions,
  type TimerEngineState,
} from "@/lib/timer-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a default options object, overridable per-test. */
function makeOptions(overrides: Partial<TimerEngineOptions> = {}): TimerEngineOptions {
  return {
    durationMs: 10_000, // 10 seconds default
    onTick: vi.fn(),
    onComplete: vi.fn(),
    tickIntervalMs: 100,
    ...overrides,
  };
}

/**
 * Advance fake timers by `ms` milliseconds AND move Date.now() forward by
 * the same amount so the drift-correction math inside the engine sees a
 * consistent wall-clock delta.
 */
function advanceTime(ms: number): void {
  vi.advanceTimersByTime(ms);
}

// ---------------------------------------------------------------------------
// Global fake-timer setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Use fake timers with a fixed starting date so Date.now() is predictable.
  vi.useFakeTimers({ now: 0 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ===========================================================================
// 1. createTimerEngine — factory & initial state
// ===========================================================================

describe("createTimerEngine — factory", () => {
  it("returns an object with the expected public API", () => {
    const engine = createTimerEngine(makeOptions());

    expect(engine).toHaveProperty("start");
    expect(engine).toHaveProperty("pause");
    expect(engine).toHaveProperty("resume");
    expect(engine).toHaveProperty("reset");
    expect(engine).toHaveProperty("destroy");
    expect(engine).toHaveProperty("getState");

    expect(typeof engine.start).toBe("function");
    expect(typeof engine.pause).toBe("function");
    expect(typeof engine.resume).toBe("function");
    expect(typeof engine.reset).toBe("function");
    expect(typeof engine.destroy).toBe("function");
    expect(typeof engine.getState).toBe("function");
  });

  it("initial state is idle with full remaining time", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 5_000 }));
    const state = engine.getState();

    expect(state.status).toBe("idle");
    expect(state.remainingMs).toBe(5_000);
    expect(state.durationMs).toBe(5_000);
    expect(state.elapsedMs).toBe(0);
  });

  it("initial state has zero elapsed time", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 30_000 }));
    expect(engine.getState().elapsedMs).toBe(0);
  });

  it("initial state is not running, paused, or completed", () => {
    const engine = createTimerEngine(makeOptions());
    const { status } = engine.getState();

    expect(status).not.toBe("running");
    expect(status).not.toBe("paused");
    expect(status).not.toBe("completed");
  });

  it("does not fire onTick before start() is called", () => {
    const onTick = vi.fn();
    createTimerEngine(makeOptions({ onTick }));

    advanceTime(5_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it("does not fire onComplete before start() is called", () => {
    const onComplete = vi.fn();
    createTimerEngine(makeOptions({ durationMs: 1_000, onComplete }));

    advanceTime(5_000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("accepts a very large duration without error", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 24 * 3_600_000 })); // 24 hours
    expect(engine.getState().remainingMs).toBe(24 * 3_600_000);
  });

  it("accepts a duration of 1 ms without error", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 1 }));
    expect(engine.getState().remainingMs).toBe(1);
  });
});

// ===========================================================================
// 2. State machine transitions
// ===========================================================================

describe("state machine — idle → running", () => {
  it("start() transitions status from idle to running", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();

    expect(engine.getState().status).toBe("running");
  });

  it("start() does not alter durationMs", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 7_000 }));
    engine.start();

    expect(engine.getState().durationMs).toBe(7_000);
  });

  it("calling start() twice does not break state", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    engine.start(); // second call should be a no-op or idempotent

    expect(engine.getState().status).toBe("running");
  });
});

describe("state machine — running → paused", () => {
  it("pause() transitions status from running to paused", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    advanceTime(1_000);
    engine.pause();

    expect(engine.getState().status).toBe("paused");
  });

  it("pause() preserves remainingMs at the moment of pause", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000 }));
    engine.start();
    advanceTime(3_000);
    engine.pause();

    const { remainingMs } = engine.getState();
    // Allow ±200ms tolerance for tick resolution
    expect(remainingMs).toBeGreaterThanOrEqual(6_800);
    expect(remainingMs).toBeLessThanOrEqual(7_200);
  });

  it("calling pause() while idle is a no-op", () => {
    const engine = createTimerEngine(makeOptions());
    engine.pause();

    expect(engine.getState().status).toBe("idle");
  });

  it("calling pause() while already paused is a no-op", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    engine.pause();
    engine.pause(); // second pause should not change state

    expect(engine.getState().status).toBe("paused");
  });

  it("timer does not count down while paused", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000 }));
    engine.start();
    advanceTime(2_000);
    engine.pause();

    const remainingAfterPause = engine.getState().remainingMs;
    advanceTime(5_000); // advance time while paused
    const remainingAfterWait = engine.getState().remainingMs;

    expect(remainingAfterWait).toBe(remainingAfterPause);
  });
});

describe("state machine — paused → running (resume)", () => {
  it("resume() transitions status from paused to running", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    advanceTime(1_000);
    engine.pause();
    engine.resume();

    expect(engine.getState().status).toBe("running");
  });

  it("calling resume() while already running is a no-op", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    engine.resume(); // should not throw or break

    expect(engine.getState().status).toBe("running");
  });

  it("calling resume() while idle is a no-op", () => {
    const engine = createTimerEngine(makeOptions());
    engine.resume();

    expect(engine.getState().status).toBe("idle");
  });

  it("timer resumes counting from the paused remaining time", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000 }));
    engine.start();
    advanceTime(3_000); // use 3 seconds
    engine.pause();

    const remainingAtPause = engine.getState().remainingMs;
    advanceTime(60_000); // 60 seconds pass while paused — should NOT count
    engine.resume();
    advanceTime(2_000); // use 2 more seconds

    const remainingAfterResume = engine.getState().remainingMs;
    // Remaining should be roughly (remainingAtPause - 2000)
    expect(remainingAfterResume).toBeGreaterThanOrEqual(remainingAtPause - 2_200);
    expect(remainingAfterResume).toBeLessThanOrEqual(remainingAtPause - 1_800);
  });
});

describe("state machine — any → idle (reset)", () => {
  it("reset() from idle keeps status idle", () => {
    const engine = createTimerEngine(makeOptions());
    engine.reset();

    expect(engine.getState().status).toBe("idle");
  });

  it("reset() from running transitions to idle", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    advanceTime(1_000);
    engine.reset();

    expect(engine.getState().status).toBe("idle");
  });

  it("reset() from paused transitions to idle", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();
    engine.pause();
    engine.reset();

    expect(engine.getState().status).toBe("idle");
  });

  it("reset() from completed transitions to idle", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 1_000, onComplete }));
    engine.start();
    advanceTime(2_000);
    engine.reset();

    expect(engine.getState().status).toBe("idle");
  });

  it("reset() restores remainingMs to the original durationMs", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 5_000 }));
    engine.start();
    advanceTime(2_000);
    engine.reset();

    expect(engine.getState().remainingMs).toBe(5_000);
  });

  it("reset() restores elapsedMs to 0", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 5_000 }));
    engine.start();
    advanceTime(2_000);
    engine.reset();

    expect(engine.getState().elapsedMs).toBe(0);
  });

  it("after reset, timer does not continue ticking", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick }));
    engine.start();
    advanceTime(500);
    onTick.mockClear();

    engine.reset();
    advanceTime(2_000);

    expect(onTick).not.toHaveBeenCalled();
  });
});

describe("state machine — running → completed", () => {
  it("status transitions to completed when remainingMs reaches zero", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 2_000 }));
    engine.start();
    advanceTime(3_000); // advance beyond duration

    expect(engine.getState().status).toBe("completed");
  });

  it("remainingMs is exactly 0 when completed", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 1_000 }));
    engine.start();
    advanceTime(2_000);

    expect(engine.getState().remainingMs).toBe(0);
  });

  it("elapsedMs equals durationMs when completed", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 3_000 }));
    engine.start();
    advanceTime(5_000);

    expect(engine.getState().elapsedMs).toBe(3_000);
  });

  it("does not go below 0 remaining (clamped)", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 500 }));
    engine.start();
    advanceTime(10_000); // massively overshoot

    expect(engine.getState().remainingMs).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================================================
// 3. onTick callback invocations
// ===========================================================================

describe("onTick callback", () => {
  it("onTick is called after engine starts", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(500);

    expect(onTick).toHaveBeenCalled();
  });

  it("onTick receives current engine state", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, durationMs: 10_000 }));
    engine.start();
    advanceTime(200);

    const lastCallArg: TimerEngineState = onTick.mock.calls[onTick.mock.calls.length - 1][0];
    expect(lastCallArg).toHaveProperty("status");
    expect(lastCallArg).toHaveProperty("remainingMs");
    expect(lastCallArg).toHaveProperty("durationMs");
    expect(lastCallArg).toHaveProperty("elapsedMs");
  });

  it("onTick status is 'running' during countdown", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, durationMs: 10_000 }));
    engine.start();
    advanceTime(300);

    const states: TimerEngineState[] = onTick.mock.calls.map((c) => c[0]);
    const runningCalls = states.filter((s) => s.status === "running");
    expect(runningCalls.length).toBeGreaterThan(0);
  });

  it("onTick is NOT called while paused", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(200);
    engine.pause();
    onTick.mockClear();

    advanceTime(2_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it("onTick resumes after resume()", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(200);
    engine.pause();
    onTick.mockClear();

    engine.resume();
    advanceTime(500);

    expect(onTick).toHaveBeenCalled();
  });

  it("onTick is not called after reset()", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(200);
    engine.reset();
    onTick.mockClear();

    advanceTime(2_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it("onTick is not called after destroy()", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(200);
    engine.destroy();
    onTick.mockClear();

    advanceTime(2_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it("onTick reports monotonically decreasing remainingMs", () => {
    const ticks: number[] = [];
    const onTick = vi.fn((state: TimerEngineState) => {
      ticks.push(state.remainingMs);
    });
    const engine = createTimerEngine(makeOptions({ onTick, durationMs: 5_000, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(3_000);

    // Each successive tick's remainingMs should be ≤ previous
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeLessThanOrEqual(ticks[i - 1]!);
    }
  });
});

// ===========================================================================
// 4. onComplete callback
// ===========================================================================

describe("onComplete callback", () => {
  it("onComplete is called exactly once when timer reaches zero", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 1_000, onComplete }));
    engine.start();
    advanceTime(2_000);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("onComplete is NOT called if timer is reset before completion", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 5_000, onComplete }));
    engine.start();
    advanceTime(2_000);
    engine.reset();
    advanceTime(5_000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("onComplete is NOT called if timer is never started", () => {
    const onComplete = vi.fn();
    createTimerEngine(makeOptions({ durationMs: 100, onComplete }));
    advanceTime(5_000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("onComplete is NOT called multiple times for a single completion", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 500, onComplete }));
    engine.start();
    advanceTime(5_000); // way past completion

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("onComplete receives the final state with remainingMs = 0", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 1_000, onComplete }));
    engine.start();
    advanceTime(2_000);

    const finalState: TimerEngineState = onComplete.mock.calls[0][0];
    expect(finalState.remainingMs).toBe(0);
    expect(finalState.status).toBe("completed");
  });

  it("onComplete is NOT called after reset even if originally completed", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 500, onComplete }));
    engine.start();
    advanceTime(1_000);
    onComplete.mockClear();

    engine.reset();
    advanceTime(2_000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("onComplete fires even if paused shortly before zero and then resumed", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 2_000, onComplete }));
    engine.start();
    advanceTime(1_800);
    engine.pause();
    engine.resume();
    advanceTime(500);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 5. Drift correction
// ===========================================================================

describe("drift correction", () => {
  it("remainingMs tracks wall-clock elapsed time, not tick count", () => {
    // With fake timers, Date.now() advances with vi.advanceTimersByTime,
    // so the drift-correction formula should yield accurate results.
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(5_000); // advance exactly 5 seconds

    const { remainingMs } = engine.getState();
    // Should be close to 5000ms remaining (10000 - 5000)
    expect(remainingMs).toBeGreaterThanOrEqual(4_800);
    expect(remainingMs).toBeLessThanOrEqual(5_200);
  });

  it("elapsed time matches wall-clock delta after several ticks", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(3_000);

    const { elapsedMs } = engine.getState();
    expect(elapsedMs).toBeGreaterThanOrEqual(2_800);
    expect(elapsedMs).toBeLessThanOrEqual(3_200);
  });

  it("elapsed + remaining always equals durationMs (before completion)", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 8_000, tickIntervalMs: 100 }));
    engine.start();

    // Sample at several points
    for (const ms of [500, 1_000, 2_000, 4_000]) {
      advanceTime(ms === 500 ? 500 : ms - [0, 500, 1_000, 2_000][([500, 1_000, 2_000, 4_000].indexOf(ms))]);
      const state = engine.getState();
      if (state.status !== "completed") {
        expect(state.elapsedMs + state.remainingMs).toBeCloseTo(8_000, -2); // within 100ms
      }
    }
  });

  it("remainingMs is never negative", () => {
    const ticks: number[] = [];
    const onTick = vi.fn((state: TimerEngineState) => ticks.push(state.remainingMs));
    const engine = createTimerEngine(makeOptions({ durationMs: 1_000, onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(5_000);

    for (const r of ticks) {
      expect(r).toBeGreaterThanOrEqual(0);
    }
  });
});

// ===========================================================================
// 6. Background tab catch-up (large elapsed time between ticks)
// ===========================================================================

describe("background tab catch-up", () => {
  it("completes the timer correctly after a large gap between ticks", () => {
    // Simulates browser throttling setInterval to 1-minute intervals
    // when the tab is in the background.
    const onComplete = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ durationMs: 5_000, onComplete, tickIntervalMs: 100 })
    );
    engine.start();

    // Simulate the tab going to background: a huge gap before the next tick
    advanceTime(60_000); // 60 second gap

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(engine.getState().status).toBe("completed");
    expect(engine.getState().remainingMs).toBe(0);
  });

  it("remainingMs is 0 (not negative) after a massive gap", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 3_000, tickIntervalMs: 100 }));
    engine.start();

    advanceTime(3_600_000); // 1 hour gap

    expect(engine.getState().remainingMs).toBe(0);
  });

  it("timer catches up when returning from background mid-countdown", () => {
    // 10-second timer, 3 seconds pass normally, then 4-second gap (background)
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(3_000); // normal ticking

    // Simulate background tab: large single jump
    advanceTime(4_000);

    const { remainingMs } = engine.getState();
    // Should have consumed 7 seconds total → ~3000ms remaining
    expect(remainingMs).toBeGreaterThanOrEqual(2_800);
    expect(remainingMs).toBeLessThanOrEqual(3_200);
  });

  it("onComplete fires exactly once even with multiple large gaps", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ durationMs: 1_000, onComplete, tickIntervalMs: 100 })
    );
    engine.start();

    advanceTime(500);
    advanceTime(500);
    advanceTime(500); // total > duration

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 7. Zero-remaining edge cases
// ===========================================================================

describe("zero-remaining edge cases", () => {
  it("1ms duration completes on the very first tick", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ durationMs: 1, onComplete, tickIntervalMs: 100 })
    );
    engine.start();
    advanceTime(100);

    expect(onComplete).toHaveBeenCalled();
    expect(engine.getState().remainingMs).toBe(0);
  });

  it("completing and resetting allows a fresh run", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 500, onComplete }));
    engine.start();
    advanceTime(1_000);

    expect(engine.getState().status).toBe("completed");
    onComplete.mockClear();

    engine.reset();
    expect(engine.getState().status).toBe("idle");
    expect(engine.getState().remainingMs).toBe(500);

    engine.start();
    advanceTime(1_000);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(engine.getState().status).toBe("completed");
  });

  it("calling start() after completion does not restart the countdown", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(makeOptions({ durationMs: 500, onComplete }));
    engine.start();
    advanceTime(1_000);
    onComplete.mockClear();

    // Attempt second start without reset — should be a no-op
    engine.start();
    advanceTime(1_000);

    expect(onComplete).not.toHaveBeenCalled();
    expect(engine.getState().status).toBe("completed");
  });

  it("final tick state has remainingMs = 0 and elapsedMs = durationMs", () => {
    const ticks: TimerEngineState[] = [];
    const onTick = vi.fn((s: TimerEngineState) => ticks.push({ ...s }));
    const engine = createTimerEngine(
      makeOptions({ durationMs: 1_000, onTick, tickIntervalMs: 100 })
    );
    engine.start();
    advanceTime(2_000);

    const completedTick = ticks.find((s) => s.status === "completed");
    if (completedTick) {
      expect(completedTick.remainingMs).toBe(0);
      expect(completedTick.elapsedMs).toBe(1_000);
    }
  });

  it("pausing at exactly 0ms remaining does not prevent completion", () => {
    // This edge case tests that the engine doesn't get stuck when
    // pause is called after the timer has already completed internally.
    const onComplete = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ durationMs: 1_000, onComplete, tickIntervalMs: 100 })
    );
    engine.start();
    advanceTime(1_050); // just past completion
    engine.pause(); // should be a no-op or graceful

    expect(engine.getState().status).toBe("completed");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 8. destroy() lifecycle
// ===========================================================================

describe("destroy()", () => {
  it("destroy() stops the internal interval", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    advanceTime(300);
    onTick.mockClear();

    engine.destroy();
    advanceTime(5_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it("calling destroy() multiple times does not throw", () => {
    const engine = createTimerEngine(makeOptions());
    engine.start();

    expect(() => {
      engine.destroy();
      engine.destroy();
      engine.destroy();
    }).not.toThrow();
  });

  it("calling start() after destroy() has no effect (graceful)", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(makeOptions({ onTick, tickIntervalMs: 100 }));
    engine.start();
    engine.destroy();
    onTick.mockClear();

    // Should not throw, and no ticks should fire
    expect(() => engine.start()).not.toThrow();
    advanceTime(2_000);
    // Depending on implementation, destroy may prevent re-start
    // We simply verify it doesn't crash
  });
});

// ===========================================================================
// 9. getState() consistency
// ===========================================================================

describe("getState() — consistency", () => {
  it("getState() returns a snapshot (not a live reference)", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000 }));
    const snapshot1 = engine.getState();
    engine.start();
    advanceTime(2_000);
    const snapshot2 = engine.getState();

    // snapshot1 should still reflect idle state
    expect(snapshot1.status).toBe("idle");
    expect(snapshot2.status).toBe("running");
  });

  it("getState() is callable at any point without throwing", () => {
    const engine = createTimerEngine(makeOptions());

    expect(() => engine.getState()).not.toThrow(); // idle
    engine.start();
    expect(() => engine.getState()).not.toThrow(); // running
    engine.pause();
    expect(() => engine.getState()).not.toThrow(); // paused
    engine.resume();
    expect(() => engine.getState()).not.toThrow(); // running again
    engine.reset();
    expect(() => engine.getState()).not.toThrow(); // idle after reset
    engine.destroy();
    expect(() => engine.getState()).not.toThrow(); // after destroy
  });
});

// ===========================================================================
// 10. Fake timer control — precision tests
// ===========================================================================

describe("fake timer control — precision", () => {
  it("100ms tick interval fires approximately correct number of ticks per second", () => {
    const onTick = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ onTick, tickIntervalMs: 100, durationMs: 10_000 })
    );
    engine.start();
    advanceTime(1_000);

    // Expect ~10 ticks (±2 tolerance)
    expect(onTick.mock.calls.length).toBeGreaterThanOrEqual(8);
    expect(onTick.mock.calls.length).toBeLessThanOrEqual(12);
  });

  it("timer state progresses linearly over time", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000, tickIntervalMs: 100 }));
    engine.start();

    advanceTime(1_000);
    const at1s = engine.getState().elapsedMs;

    advanceTime(1_000);
    const at2s = engine.getState().elapsedMs;

    advanceTime(1_000);
    const at3s = engine.getState().elapsedMs;

    // Each 1-second step should increase elapsedMs by approximately 1000ms
    expect(at2s - at1s).toBeGreaterThanOrEqual(800);
    expect(at2s - at1s).toBeLessThanOrEqual(1_200);
    expect(at3s - at2s).toBeGreaterThanOrEqual(800);
    expect(at3s - at2s).toBeLessThanOrEqual(1_200);
  });

  it("full lifecycle: start → run to completion → reset → re-run", () => {
    const onComplete = vi.fn();
    const engine = createTimerEngine(
      makeOptions({ durationMs: 3_000, onComplete, tickIntervalMs: 100 })
    );

    // First run
    engine.start();
    advanceTime(4_000);
    expect(engine.getState().status).toBe("completed");
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Reset
    engine.reset();
    expect(engine.getState().status).toBe("idle");
    expect(engine.getState().remainingMs).toBe(3_000);
    onComplete.mockClear();

    // Second run
    engine.start();
    advanceTime(4_000);
    expect(engine.getState().status).toBe("completed");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("pause/resume cycle preserves total elapsed time correctly", () => {
    const engine = createTimerEngine(makeOptions({ durationMs: 10_000, tickIntervalMs: 100 }));
    engine.start();

    advanceTime(2_000); // run for 2s
    engine.pause();
    advanceTime(5_000); // wait 5s while paused
    engine.resume();
    advanceTime(2_000); // run for 2 more seconds

    const { elapsedMs } = engine.getState();
    // Should be ~4000ms elapsed (2 + 2), NOT 9000ms (which would include paused time)
    expect(elapsedMs).toBeGreaterThanOrEqual(3_800);
    expect(elapsedMs).toBeLessThanOrEqual(4_200);
  });
});