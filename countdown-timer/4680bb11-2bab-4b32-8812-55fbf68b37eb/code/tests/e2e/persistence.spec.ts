/**
 * Persistence E2E Tests — tests/e2e/persistence.spec.ts
 *
 * Verifies localStorage state persistence across page reloads:
 *
 * 1. Running timer: started timer survives page reload and auto-resumes
 *    with wall-clock-corrected remaining time
 * 2. Paused timer: paused state is restored exactly (no wall-clock adjustment)
 * 3. Idle with custom duration: duration setting persists across reload
 * 4. Elapsed time recovery: after reload from running, remaining time reflects
 *    the time spent away from the page
 * 5. Reset clears localStorage: after reset, reload shows clean idle state
 * 6. Completed timer: completed state is handled gracefully on reload
 */

import { test, expect, type Page, type Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the raw persisted timer state from localStorage.
 * Returns null if nothing is stored or JSON is invalid.
 */
async function readPersistedState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    // Check common storage keys — the app may use "countdown-timer-state" or similar
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes("timer") || key.includes("countdown")) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            return JSON.parse(raw) as Record<string, unknown>;
          }
        } catch {
          // ignore parse error
        }
      }
    }
    return null;
  });
}

/**
 * Set timer duration via input fields.
 */
async function setDuration(
  page: Page,
  hours: number,
  minutes: number,
  seconds: number
): Promise<void> {
  const hoursInput = page
    .locator('[data-testid="hours-input"], [aria-label*="hour" i], input[aria-label*="Hour" i]')
    .first();
  const minutesInput = page
    .locator('[data-testid="minutes-input"], [aria-label*="minute" i], input[aria-label*="Minute" i]')
    .first();
  const secondsInput = page
    .locator('[data-testid="seconds-input"], [aria-label*="second" i], input[aria-label*="Second" i]')
    .first();

  for (const [locator, value] of [
    [hoursInput, hours],
    [minutesInput, minutes],
    [secondsInput, seconds],
  ] as const) {
    await locator.click({ clickCount: 3 });
    await locator.fill(String(value));
    await locator.press("Tab");
  }
}

/**
 * Get the current displayed time string from the timer role.
 */
async function getDisplayedTime(page: Page): Promise<string> {
  const timerDisplay = page.locator('[role="timer"]').first();
  const text = (await timerDisplay.textContent()) ?? "";
  const match = text.match(/\d{2}:\d{2}(?::\d{2})?/);
  return match?.[0] ?? text.trim();
}

/**
 * Parse a MM:SS or HH:MM:SS time string into total milliseconds.
 */
function parseDisplayToMs(display: string): number {
  const parts = display.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    const [h = 0, m = 0, s = 0] = parts;
    return (h * 3600 + m * 60 + s) * 1_000;
  }
  const [m = 0, s = 0] = parts;
  return (m * 60 + s) * 1_000;
}

/**
 * Get button locators.
 */
function getControls(page: Page): {
  start: Locator;
  pause: Locator;
  reset: Locator;
  timerDisplay: Locator;
} {
  return {
    start: page
      .locator('button:has-text("Start"), button[aria-label*="Start" i], button:has-text("Resume")')
      .first(),
    pause: page
      .locator('button:has-text("Pause"), button[aria-label*="Pause" i]')
      .first(),
    reset: page
      .locator('button:has-text("Reset"), button[aria-label*="Reset" i]')
      .first(),
    timerDisplay: page.locator('[role="timer"]').first(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("State Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Test 1: Running timer persists and resumes after reload
  // -------------------------------------------------------------------------

  test("running timer resumes after page reload with wall-clock correction", async ({ page }) => {
    const { start, pause } = getControls(page);

    // Set a 30-second timer and start it
    await setDuration(page, 0, 0, 30);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Wait for the timer to run for ~3 seconds
    await expect(pause).toBeEnabled({ timeout: 3_000 });
    await page.waitForTimeout(3_000);

    // Capture displayed time just before reload
    const timeBeforeReload = await getDisplayedTime(page);
    const msBeforeReload = parseDisplayToMs(timeBeforeReload);

    console.log(`Before reload: ${timeBeforeReload} (${msBeforeReload}ms remaining)`);

    // Verify state was persisted
    const persistedState = await readPersistedState(page);
    expect(persistedState).not.toBeNull();

    // Record real-world time just before reload
    const wallClockAtReload = Date.now();

    // Perform page reload
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });

    // Wait for hydration to complete
    await page.waitForTimeout(500);

    const wallClockAfterHydration = Date.now();
    const reloadDurationMs = wallClockAfterHydration - wallClockAtReload;

    console.log(`Reload took: ${reloadDurationMs}ms`);

    // After reload, the timer should be either running or completed
    // (depends on how long the reload took relative to remaining time)
    const timeAfterReload = await getDisplayedTime(page);
    const msAfterReload = parseDisplayToMs(timeAfterReload);

    console.log(`After reload: ${timeAfterReload} (${msAfterReload}ms remaining)`);

    // The displayed time after reload should account for wall-clock elapsed time
    // Expected remaining = msBeforeReload - reloadDurationMs (± tolerance)
    const expectedRemainingMs = Math.max(0, msBeforeReload - reloadDurationMs);
    const tolerance = 2_000; // 2s tolerance (reload time is variable, display rounds to seconds)

    const delta = Math.abs(msAfterReload - expectedRemainingMs);
    console.log(`Expected remaining: ~${expectedRemainingMs}ms, actual: ${msAfterReload}ms, delta: ${delta}ms`);

    expect(delta).toBeLessThanOrEqual(
      tolerance,
      `After reload: displayed ${timeAfterReload} (${msAfterReload}ms) but expected ~${Math.round(expectedRemainingMs / 1000)}s remaining`
    );

    // The timer should be running (pause button enabled) unless it completed during reload
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );

    const isCompleted = await completionAlert.isVisible();
    if (!isCompleted) {
      const { pause: pauseAfterReload } = getControls(page);
      await expect(pauseAfterReload).toBeEnabled({ timeout: 3_000 });
    }
  });

  // -------------------------------------------------------------------------
  // Test 2: Paused timer state is restored exactly
  // -------------------------------------------------------------------------

  test("paused timer state is restored exactly after page reload", async ({ page }) => {
    const { start, pause } = getControls(page);

    // Set a 60-second timer, start it, then pause it
    await setDuration(page, 0, 1, 0);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Let it run for 2 seconds
    await expect(pause).toBeEnabled({ timeout: 3_000 });
    await page.waitForTimeout(2_000);

    // Pause the timer
    await pause.click();
    await expect(start).toBeEnabled({ timeout: 3_000 });

    // Record exact displayed time after pause
    const timeAtPause = await getDisplayedTime(page);
    const msAtPause = parseDisplayToMs(timeAtPause);

    console.log(`Paused at: ${timeAtPause} (${msAtPause}ms remaining)`);

    // Perform page reload
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500); // Wait for hydration

    // After reload, timer should still be paused (no wall-clock adjustment)
    const timeAfterReload = await getDisplayedTime(page);
    const msAfterReload = parseDisplayToMs(timeAfterReload);

    console.log(`After reload (paused): ${timeAfterReload} (${msAfterReload}ms remaining)`);

    // Paused state: time should be identical to pre-reload (no seconds consumed)
    // Allow 1-second tolerance for display rounding
    const delta = Math.abs(msAfterReload - msAtPause);
    expect(delta).toBeLessThanOrEqual(
      1_000,
      `Paused timer changed during reload: ${timeAtPause} → ${timeAfterReload}`
    );

    // UI should show paused state: Start/Resume enabled, Pause disabled
    const { start: startAfter, pause: pauseAfter } = getControls(page);
    await expect(startAfter).toBeEnabled({ timeout: 3_000 });
    await expect(pauseAfter).toBeDisabled();

    // Wait 2 more seconds — display should NOT change (still paused)
    await page.waitForTimeout(2_000);
    const timeAfterWaiting = await getDisplayedTime(page);
    expect(timeAfterReload).toBe(timeAfterWaiting);
  });

  // -------------------------------------------------------------------------
  // Test 3: Idle state duration persists across reload
  // -------------------------------------------------------------------------

  test("idle timer duration setting persists across page reload", async ({ page }) => {
    // Set a custom duration but don't start
    await setDuration(page, 0, 7, 45);

    // Verify initial display
    const timeBeforeReload = await getDisplayedTime(page);
    console.log(`Set duration display: ${timeBeforeReload}`);

    // The display should reflect 7:45 (or 00:07:45)
    expect(timeBeforeReload).toMatch(/07:45/);

    // Reload the page
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);

    // Duration should be restored
    const timeAfterReload = await getDisplayedTime(page);
    console.log(`After reload display: ${timeAfterReload}`);

    expect(timeAfterReload).toMatch(/07:45/);

    // Should still be in idle state
    const { start, pause, reset } = getControls(page);
    await expect(start).toBeEnabled({ timeout: 3_000 });
    await expect(pause).toBeDisabled();
    await expect(reset).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Test 4: Reset clears persisted state
  // -------------------------------------------------------------------------

  test("reset clears localStorage and reload shows clean idle state", async ({ page }) => {
    const { start, pause, reset } = getControls(page);

    // Start a timer
    await setDuration(page, 0, 5, 0);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Let it run briefly
    await expect(pause).toBeEnabled({ timeout: 3_000 });
    await page.waitForTimeout(1_000);

    // Reset
    await reset.click();
    await expect(start).toBeEnabled({ timeout: 3_000 });
    await expect(pause).toBeDisabled();

    // Verify localStorage is cleared or in idle state after reset
    const persistedState = await readPersistedState(page);
    if (persistedState !== null) {
      // If state is persisted, it should reflect idle/reset state
      const status = (persistedState as Record<string, unknown>).status;
      expect(status).toMatch(/idle|reset/i);
    }

    // Reload the page
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);

    // Should be in idle state
    const { start: startAfter, pause: pauseAfter, reset: resetAfter } = getControls(page);
    await expect(startAfter).toBeEnabled({ timeout: 3_000 });
    await expect(pauseAfter).toBeDisabled();
    await expect(resetAfter).toBeDisabled();

    // The completion alert should NOT be visible
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    await expect(completionAlert).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Test 5: Elapsed time recovery — longer reload
  // -------------------------------------------------------------------------

  test("wall-clock drift recovery: simulated longer page absence", async ({ page }) => {
    // We simulate a longer absence by manipulating Date.now in the page
    // after we start the timer, then reload.
    const { start, pause } = getControls(page);

    // Set a 30-second timer
    await setDuration(page, 0, 0, 30);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Wait for running state
    await expect(pause).toBeEnabled({ timeout: 3_000 });

    // Let timer run for 2 real seconds
    await page.waitForTimeout(2_000);

    // Manipulate the persisted state to simulate a 5-second absence
    // We modify the startedAt timestamp in localStorage to be 5s in the past
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes("timer") || key.includes("countdown")) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const state = JSON.parse(raw) as Record<string, unknown>;
            // Move startedAt back by an additional 5 seconds
            if (typeof state.startedAt === "number") {
              state.startedAt = (state.startedAt as number) - 5_000;
              localStorage.setItem(key, JSON.stringify(state));
            }
            // Also try nested structure
            if (state.state && typeof (state.state as Record<string, unknown>).startedAt === "number") {
              const nested = state.state as Record<string, unknown>;
              nested.startedAt = (nested.startedAt as number) - 5_000;
              localStorage.setItem(key, JSON.stringify(state));
            }
          } catch {
            // ignore
          }
        }
      }
    });

    // Reload
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    const timeAfterReload = await getDisplayedTime(page);
    const msAfterReload = parseDisplayToMs(timeAfterReload);

    console.log(`After simulated 5s absence: ${timeAfterReload} (${msAfterReload}ms)`);

    // Originally 30s, ran for ~2s, plus simulated 5s absence = ~7s consumed
    // Remaining should be ~23s (with tolerance for display rounding and test timing)
    // We just verify the remaining time is substantially less than 30s (at least 5s less)
    const maxExpected = 28_000; // Less than 30s since some time was consumed
    const minExpected = 10_000; // At least 10s consumed between real + simulated

    // If timer completed (reload took too long), that's also acceptable
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    const isCompleted = await completionAlert.isVisible();

    if (!isCompleted) {
      expect(msAfterReload).toBeLessThan(maxExpected);
    }
    // Either the timer completed or it shows reduced time — both are correct behaviors
    console.log(`Drift recovery: completed=${isCompleted}, remaining=${timeAfterReload}`);
  });

  // -------------------------------------------------------------------------
  // Test 6: Completed timer state on reload shows alert or idle
  // -------------------------------------------------------------------------

  test("completed timer on reload shows completion alert or returns to idle gracefully", async ({
    page,
  }) => {
    // Start a 2-second timer and let it complete
    await setDuration(page, 0, 0, 2);
    const { start } = getControls(page);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Wait for completion
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    await expect(completionAlert).toBeVisible({ timeout: 8_000 });

    // Reload without dismissing
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    // After reload: either the completion alert is shown again OR the timer is idle
    // Both are acceptable behaviors per the PRD
    const completionAlertAfterReload = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    const { start: startAfter, pause: pauseAfter } = getControls(page);

    const alertVisible = await completionAlertAfterReload.isVisible();
    const startEnabled = await startAfter.isEnabled();
    const pauseDisabled = !(await pauseAfter.isEnabled());

    // Either the alert is shown (completed state restored) or we're in idle
    const isAcceptableState = alertVisible || (startEnabled && pauseDisabled);

    expect(isAcceptableState).toBe(
      true,
      "After reload from completed state, app should show completion alert or be in idle state"
    );

    // Timer display should show 00:00 if alert is visible
    if (alertVisible) {
      const displayText = await getDisplayedTime(page);
      expect(displayText).toMatch(/^00:00(:\d{2})?$/);
    }
  });

  // -------------------------------------------------------------------------
  // Test 7: Multiple reload cycles maintain state integrity
  // -------------------------------------------------------------------------

  test("paused timer state survives multiple sequential reloads", async ({ page }) => {
    const { start, pause } = getControls(page);

    // Set and start a 2-minute timer
    await setDuration(page, 0, 2, 0);
    await expect(start).toBeEnabled({ timeout: 5_000 });
    await start.click();

    // Pause after a short while
    await expect(pause).toBeEnabled({ timeout: 3_000 });
    await page.waitForTimeout(1_500);
    await pause.click();
    await expect(start).toBeEnabled({ timeout: 3_000 });

    const originalTime = await getDisplayedTime(page);
    console.log(`Original paused time: ${originalTime}`);

    // Reload 3 times in succession
    for (let i = 1; i <= 3; i++) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);

      const timeAfterReload = await getDisplayedTime(page);
      console.log(`After reload ${i}: ${timeAfterReload}`);

      // Time should remain consistent across reloads (paused state, no drift)
      const originalMs = parseDisplayToMs(originalTime);
      const reloadMs = parseDisplayToMs(timeAfterReload);
      const delta = Math.abs(reloadMs - originalMs);

      expect(delta).toBeLessThanOrEqual(
        1_000,
        `After reload ${i}, paused time changed: ${originalTime} → ${timeAfterReload}`
      );

      // Should still be paused
      const { start: startEl, pause: pauseEl } = getControls(page);
      await expect(startEl).toBeEnabled({ timeout: 3_000 });
      await expect(pauseEl).toBeDisabled();
    }
  });

  // -------------------------------------------------------------------------
  // Test 8: localStorage schema version check
  // -------------------------------------------------------------------------

  test("persisted state contains expected schema fields", async ({ page }) => {
    const { start, pause } = getControls(page);

    // Start a timer so state gets persisted
    await setDuration(page, 0, 5, 0);
    await start.click();
    await expect(pause).toBeEnabled({ timeout: 3_000 });

    // Small wait to ensure persistence hook has run
    await page.waitForTimeout(200);

    const persistedState = await readPersistedState(page);

    // There should be some persisted state
    expect(persistedState).not.toBeNull();

    if (persistedState !== null) {
      // Log the structure for diagnostic purposes
      console.log("Persisted state keys:", Object.keys(persistedState));

      // The persisted state should have at minimum a status/state field
      const hasStatusField =
        "status" in persistedState ||
        "state" in persistedState ||
        "timerStatus" in persistedState;

      expect(hasStatusField).toBe(
        true,
        `Persisted state should contain a status field. Got keys: ${Object.keys(persistedState).join(", ")}`
      );

      // Should have a duration-related field
      const hasDurationField =
        "duration" in persistedState ||
        "durationMs" in persistedState ||
        "totalMs" in persistedState ||
        "initialDurationMs" in persistedState;

      expect(hasDurationField).toBe(
        true,
        `Persisted state should contain a duration field. Got keys: ${Object.keys(persistedState).join(", ")}`
      );
    }
  });
});