/**
 * Timer Accuracy E2E Tests — tests/e2e/timer-accuracy.spec.ts
 *
 * Verifies that the drift-corrected timer engine is accurate to within
 * ±200ms of wall-clock time over a 10-second countdown.
 *
 * Strategy:
 * - Record wall-clock start time immediately before pressing Start
 * - Poll the timer display every ~250ms and detect "00:00" transition
 * - Record wall-clock end time at the moment "00:00" appears
 * - Assert that elapsed wall-clock time is within [9800ms, 10200ms]
 *   (i.e. exactly 10s ± 200ms)
 *
 * Additional accuracy tests:
 * - 5-second timer completes within ±200ms
 * - Display updates occur approximately every second
 * - No display update is skipped (counter never jumps by more than 1s)
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCURACY_TOLERANCE_MS = 200;
const DISPLAY_POLL_INTERVAL_MS = 100;

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Wait until the role="timer" element shows "00:00" (or "00:00:00"),
 * polling at DISPLAY_POLL_INTERVAL_MS intervals.
 *
 * Returns the wall-clock timestamp (Date.now()) at the moment completion
 * was first detected, plus the full sequence of observed display values
 * for diagnostic purposes.
 */
async function waitForTimerCompletion(
  page: Page,
  timeoutMs: number
): Promise<{ completedAt: number; displayHistory: Array<{ value: string; ts: number }> }> {
  const timerLocator = page.locator('[role="timer"]').first();
  const displayHistory: Array<{ value: string; ts: number }> = [];
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const text = (await timerLocator.textContent({ timeout: 1_000 })) ?? "";
    const ts = Date.now();
    const match = text.match(/\d{2}:\d{2}(?::\d{2})?/);
    const displayValue = match?.[0] ?? text.trim();

    // Record every unique value
    const last = displayHistory[displayHistory.length - 1];
    if (!last || last.value !== displayValue) {
      displayHistory.push({ value: displayValue, ts });
    }

    // Detect completion: display shows 00:00 or 00:00:00
    if (displayValue === "00:00" || displayValue === "00:00:00") {
      return { completedAt: ts, displayHistory };
    }

    await page.waitForTimeout(DISPLAY_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timer did not complete within ${timeoutMs}ms. Last observed: ${
      displayHistory[displayHistory.length - 1]?.value ?? "none"
    }`
  );
}

/**
 * Set the timer duration using the input fields.
 */
async function setTimerDuration(
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
 * Click the Start (or Resume) button.
 */
async function clickStart(page: Page): Promise<void> {
  const startButton = page
    .locator('button:has-text("Start"), button[aria-label*="Start" i], button:has-text("Resume")')
    .first();
  await expect(startButton).toBeEnabled({ timeout: 5_000 });
  await startButton.click();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Timer Accuracy", () => {
  test.beforeEach(async ({ page }) => {
    // Clear stored state
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for the timer display to be rendered
    await expect(page.locator('[role="timer"]').first()).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Primary accuracy test: 10-second timer ± 200ms
  // -------------------------------------------------------------------------

  test("10-second timer completes within ±200ms of wall-clock time", async ({ page }) => {
    await setTimerDuration(page, 0, 0, 10);

    // Ensure start button is ready
    const startButton = page
      .locator('button:has-text("Start"), button[aria-label*="Start" i]')
      .first();
    await expect(startButton).toBeEnabled({ timeout: 5_000 });

    // Record wall-clock time just before click — click() itself adds negligible latency
    const startedAt = Date.now();
    await startButton.click();

    // Wait for completion — generous timeout of 15s (10s nominal + 5s buffer)
    const { completedAt, displayHistory } = await waitForTimerCompletion(page, 15_000);

    const elapsedMs = completedAt - startedAt;
    const expectedMs = 10_000;
    const deltaMs = Math.abs(elapsedMs - expectedMs);

    // Diagnostic output on failure
    console.log(`10-second accuracy test:`);
    console.log(`  Wall-clock elapsed: ${elapsedMs}ms`);
    console.log(`  Expected:           ${expectedMs}ms`);
    console.log(`  Delta:              ${deltaMs}ms`);
    console.log(`  Display history:    ${displayHistory.map((d) => d.value).join(" → ")}`);

    expect(deltaMs).toBeLessThanOrEqual(
      ACCURACY_TOLERANCE_MS,
      `Timer took ${elapsedMs}ms instead of expected ${expectedMs}ms (delta ${deltaMs}ms exceeds ±${ACCURACY_TOLERANCE_MS}ms tolerance)`
    );

    // Verify the completion alert appeared
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    await expect(completionAlert).toBeVisible({ timeout: 3_000 });
  });

  // -------------------------------------------------------------------------
  // Secondary accuracy test: 5-second timer ± 200ms
  // -------------------------------------------------------------------------

  test("5-second timer completes within ±200ms of wall-clock time", async ({ page }) => {
    await setTimerDuration(page, 0, 0, 5);

    const startButton = page
      .locator('button:has-text("Start"), button[aria-label*="Start" i]')
      .first();
    await expect(startButton).toBeEnabled({ timeout: 5_000 });

    const startedAt = Date.now();
    await startButton.click();

    const { completedAt, displayHistory } = await waitForTimerCompletion(page, 10_000);

    const elapsedMs = completedAt - startedAt;
    const expectedMs = 5_000;
    const deltaMs = Math.abs(elapsedMs - expectedMs);

    console.log(`5-second accuracy test:`);
    console.log(`  Wall-clock elapsed: ${elapsedMs}ms`);
    console.log(`  Expected:           ${expectedMs}ms`);
    console.log(`  Delta:              ${deltaMs}ms`);
    console.log(`  Display history:    ${displayHistory.map((d) => d.value).join(" → ")}`);

    expect(deltaMs).toBeLessThanOrEqual(
      ACCURACY_TOLERANCE_MS,
      `Timer took ${elapsedMs}ms instead of ${expectedMs}ms (delta ${deltaMs}ms exceeds ±${ACCURACY_TOLERANCE_MS}ms)`
    );
  });

  // -------------------------------------------------------------------------
  // Display update cadence: no second is skipped
  // -------------------------------------------------------------------------

  test("timer display updates every second without skipping", async ({ page }) => {
    await setTimerDuration(page, 0, 0, 10);

    await clickStart(page);

    const { displayHistory } = await waitForTimerCompletion(page, 15_000);

    // Extract numeric second values from display history
    // Display format: "00:10", "00:09", ..., "00:00"
    const secondValues = displayHistory
      .map((d) => {
        const parts = d.value.split(":");
        return parseInt(parts[parts.length - 1] ?? "0", 10);
      })
      .filter((v) => !isNaN(v));

    console.log(`Display second sequence: ${secondValues.join(", ")}`);

    // Check there are no skipped seconds
    // We should see values from 10 (or 9) down to 0 with no gap > 1
    for (let i = 0; i < secondValues.length - 1; i++) {
      const current = secondValues[i] ?? 0;
      const next = secondValues[i + 1] ?? 0;
      const diff = current - next;
      // Each transition should decrease by at most 1 second
      // (equal values are fine — same second recorded twice)
      expect(diff).toBeLessThanOrEqual(
        1,
        `Display skipped a second: went from ${current} to ${next} (gap of ${diff})`
      );
    }
  });

  // -------------------------------------------------------------------------
  // Pause accuracy: time is not consumed while paused
  // -------------------------------------------------------------------------

  test("pause does not consume time — remaining time accurate after resume", async ({ page }) => {
    await setTimerDuration(page, 0, 0, 10);

    const startButton = page
      .locator('button:has-text("Start"), button[aria-label*="Start" i]')
      .first();
    const pauseButton = page
      .locator('button:has-text("Pause"), button[aria-label*="Pause" i]')
      .first();
    const timerDisplay = page.locator('[role="timer"]').first();

    await expect(startButton).toBeEnabled({ timeout: 5_000 });

    // Start timer, let it run for ~3 seconds
    await startButton.click();
    await page.waitForTimeout(3_000);

    // Pause
    await expect(pauseButton).toBeEnabled({ timeout: 3_000 });
    await pauseButton.click();

    // Record time displayed immediately after pause
    const textAtPause = (await timerDisplay.textContent()) ?? "";
    const match = textAtPause.match(/\d{2}:\d{2}(?::\d{2})?/);
    const displayedAtPause = match?.[0] ?? "";

    // Wait 2 seconds while paused — time should NOT decrease
    await page.waitForTimeout(2_000);

    const textAfterWait = (await timerDisplay.textContent()) ?? "";
    const matchAfter = textAfterWait.match(/\d{2}:\d{2}(?::\d{2})?/);
    const displayedAfterWait = matchAfter?.[0] ?? "";

    expect(displayedAtPause).toBe(
      displayedAfterWait,
      `Display changed while paused: ${displayedAtPause} → ${displayedAfterWait}`
    );

    // Resume and measure remaining time to completion
    const resumeButton = page
      .locator('button:has-text("Resume"), button:has-text("Start"), button[aria-label*="Start" i]')
      .first();

    // Parse remaining seconds from display
    const parts = displayedAfterWait.split(":");
    const remainingSeconds = parseInt(parts[parts.length - 1] ?? "0", 10);
    const remainingMinutes = parseInt(parts[parts.length - 2] ?? "0", 10);
    const remainingMs = (remainingMinutes * 60 + remainingSeconds) * 1_000;

    const resumedAt = Date.now();
    await resumeButton.click();

    const { completedAt } = await waitForTimerCompletion(
      page,
      remainingMs + 3_000 // remaining time + 3s buffer
    );

    const elapsedAfterResume = completedAt - resumedAt;
    const deltaMs = Math.abs(elapsedAfterResume - remainingMs);

    console.log(`Pause/resume accuracy:`);
    console.log(`  Remaining at pause: ${remainingMs}ms (${displayedAfterWait})`);
    console.log(`  Elapsed after resume: ${elapsedAfterResume}ms`);
    console.log(`  Delta: ${deltaMs}ms`);

    expect(deltaMs).toBeLessThanOrEqual(
      ACCURACY_TOLERANCE_MS + 500, // slightly more generous due to display rounding
      `After pause+resume, timer elapsed ${elapsedAfterResume}ms vs expected ${remainingMs}ms`
    );
  });

  // -------------------------------------------------------------------------
  // Multiple accuracy runs: statistical consistency
  // -------------------------------------------------------------------------

  test("three consecutive 3-second timers each complete within ±200ms", async ({ page }) => {
    const completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    const dismissButton = page
      .locator('button:has-text("Dismiss"), button[aria-label*="Dismiss" i]')
      .first();
    const startButton = page
      .locator('button:has-text("Start"), button[aria-label*="Start" i], button:has-text("Restart")')
      .first();

    for (let run = 1; run <= 3; run++) {
      // For runs after the first, we need to set duration again (reset happens after dismiss)
      await setTimerDuration(page, 0, 0, 3);
      await expect(startButton).toBeEnabled({ timeout: 5_000 });

      const startedAt = Date.now();
      await startButton.click();

      const { completedAt } = await waitForTimerCompletion(page, 8_000);
      const elapsedMs = completedAt - startedAt;
      const deltaMs = Math.abs(elapsedMs - 3_000);

      console.log(`Run ${run}: elapsed=${elapsedMs}ms, delta=${deltaMs}ms`);

      expect(deltaMs).toBeLessThanOrEqual(
        ACCURACY_TOLERANCE_MS,
        `Run ${run}: elapsed ${elapsedMs}ms, delta ${deltaMs}ms exceeds ±${ACCURACY_TOLERANCE_MS}ms`
      );

      // Dismiss alert before next run
      await expect(completionAlert).toBeVisible({ timeout: 3_000 });
      await dismissButton.click();
      await expect(completionAlert).not.toBeVisible({ timeout: 3_000 });
    }
  });
});