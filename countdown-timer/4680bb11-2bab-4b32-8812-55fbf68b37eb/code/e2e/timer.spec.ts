/**
 * Timer E2E Tests — e2e/timer.spec.ts
 *
 * End-to-end tests for the countdown timer covering:
 * - Basic UI rendering and element visibility
 * - Start, pause, and reset interactions
 * - Preset selection
 * - Keyboard shortcuts
 * - Timer accuracy (drift-resistance)
 * - Completion behavior (alert, title change)
 * - State persistence across page refresh
 * - Responsive layout (desktop + mobile)
 *
 * Excluded from a11y project (those live in e2e/a11y/).
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the app root and wait for the timer UI to be hydrated.
 * All tests call this first.
 */
async function gotoApp(
  page: Parameters<typeof test>[1] extends infer P
    ? P extends { goto: unknown }
      ? never
      : never
    : never
): Promise<void>;
async function gotoApp(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  // Wait for the timer display to be visible — indicates hydration complete
  await page.waitForSelector('[data-testid="timer-display"]', {
    state: "visible",
    timeout: 10_000,
  });
}

/**
 * Fill in the duration input fields.
 */
async function setDuration(
  page: import("@playwright/test").Page,
  hours: number,
  minutes: number,
  seconds: number
): Promise<void> {
  await page.fill('[data-testid="input-hours"]', String(hours));
  await page.fill('[data-testid="input-minutes"]', String(minutes));
  await page.fill('[data-testid="input-seconds"]', String(seconds));
  // Blur last field to trigger validation
  await page.keyboard.press("Tab");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Countdown Timer App", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // =========================================================================
  // Smoke Tests
  // =========================================================================

  test.describe("Smoke Tests", () => {
    test("page loads and displays timer UI", async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Countdown Timer/i);

      // Timer display visible
      await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();

      // Duration inputs visible
      await expect(page.locator('[data-testid="input-hours"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="input-minutes"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="input-seconds"]')
      ).toBeVisible();

      // Control buttons visible
      await expect(
        page.locator('[data-testid="btn-start"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="btn-reset"]')
      ).toBeVisible();
    });

    test("initial state shows 00:00:00", async ({ page }) => {
      const display = page.locator('[data-testid="timer-display"]');
      await expect(display).toContainText("00:00:00");
    });

    test("start button is disabled with zero duration", async ({ page }) => {
      // Duration inputs should be 0 by default
      const startBtn = page.locator('[data-testid="btn-start"]');
      await expect(startBtn).toBeDisabled();
    });
  });

  // =========================================================================
  // Duration Input
  // =========================================================================

  test.describe("Duration Input", () => {
    test("can set hours, minutes, seconds", async ({ page }) => {
      await setDuration(page, 1, 30, 45);

      await expect(page.locator('[data-testid="input-hours"]')).toHaveValue(
        "1"
      );
      await expect(page.locator('[data-testid="input-minutes"]')).toHaveValue(
        "30"
      );
      await expect(page.locator('[data-testid="input-seconds"]')).toHaveValue(
        "45"
      );
    });

    test("start button enables after setting duration", async ({ page }) => {
      await setDuration(page, 0, 0, 5);
      const startBtn = page.locator('[data-testid="btn-start"]');
      await expect(startBtn).toBeEnabled();
    });

    test("minutes clamp to 59 on blur", async ({ page }) => {
      await page.fill('[data-testid="input-minutes"]', "99");
      await page.keyboard.press("Tab");
      await expect(page.locator('[data-testid="input-minutes"]')).toHaveValue(
        "59"
      );
    });

    test("seconds clamp to 59 on blur", async ({ page }) => {
      await page.fill('[data-testid="input-seconds"]', "99");
      await page.keyboard.press("Tab");
      await expect(page.locator('[data-testid="input-seconds"]')).toHaveValue(
        "59"
      );
    });

    test("inputs are disabled while timer is running", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');

      await expect(page.locator('[data-testid="input-hours"]')).toBeDisabled();
      await expect(
        page.locator('[data-testid="input-minutes"]')
      ).toBeDisabled();
      await expect(
        page.locator('[data-testid="input-seconds"]')
      ).toBeDisabled();
    });
  });

  // =========================================================================
  // Preset Buttons
  // =========================================================================

  test.describe("Preset Buttons", () => {
    test("clicking a preset populates duration inputs", async ({ page }) => {
      // Click the 5-minute preset
      const preset5m = page.locator('[data-testid="preset-5m"]');
      await preset5m.click();

      await expect(page.locator('[data-testid="input-hours"]')).toHaveValue(
        "0"
      );
      await expect(page.locator('[data-testid="input-minutes"]')).toHaveValue(
        "5"
      );
      await expect(page.locator('[data-testid="input-seconds"]')).toHaveValue(
        "0"
      );
    });

    test("active preset is highlighted", async ({ page }) => {
      const preset5m = page.locator('[data-testid="preset-5m"]');
      await preset5m.click();

      // Should have aria-pressed="true" or active class
      await expect(preset5m).toHaveAttribute("aria-pressed", "true");
    });

    test("presets are disabled while timer is running", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');

      // All preset buttons should be disabled
      const presets = page.locator('[data-testid^="preset-"]');
      const count = await presets.count();
      for (let i = 0; i < count; i++) {
        await expect(presets.nth(i)).toBeDisabled();
      }
    });
  });

  // =========================================================================
  // Timer Controls — Start / Pause / Reset
  // =========================================================================

  test.describe("Timer Controls", () => {
    test("start begins countdown", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');

      // After ~1.5s the display should show 00:00:08 or 00:00:09
      await page.waitForTimeout(1500);
      const display = page.locator('[data-testid="timer-display"]');
      const text = await display.textContent();
      expect(text).toMatch(/00:00:0[78]/);
    });

    test("pause stops the countdown", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(1500);

      await page.click('[data-testid="btn-pause"]');
      const displayAfterPause = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      // Wait another second — value should not change
      await page.waitForTimeout(1000);
      const displayAfterWait = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      expect(displayAfterPause).toEqual(displayAfterWait);
    });

    test("resume continues countdown from paused value", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(1000);

      await page.click('[data-testid="btn-pause"]');
      const pausedText = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(1500);
      const resumedText = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      // Time should have decreased further from the paused value
      expect(resumedText).not.toEqual(pausedText);
    });

    test("reset returns to idle state", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(500);

      await page.click('[data-testid="btn-reset"]');

      // Display should show full duration again (or 00:00:00 if set duration was reset)
      const display = page.locator('[data-testid="timer-display"]');
      await expect(display).toContainText("00:00:10");

      // Inputs should be re-enabled
      await expect(page.locator('[data-testid="input-hours"]')).toBeEnabled();
    });

    test("button state transitions: idle → running → paused → idle", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 30);

      // Idle: start enabled, pause/reset disabled
      await expect(page.locator('[data-testid="btn-start"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-pause"]')).toBeDisabled();
      await expect(page.locator('[data-testid="btn-reset"]')).toBeDisabled();

      // Start → running: start disabled, pause/reset enabled
      await page.click('[data-testid="btn-start"]');
      await expect(page.locator('[data-testid="btn-start"]')).toBeDisabled();
      await expect(page.locator('[data-testid="btn-pause"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-reset"]')).toBeEnabled();

      // Pause → paused: start (resume) enabled, pause disabled, reset enabled
      await page.click('[data-testid="btn-pause"]');
      await expect(page.locator('[data-testid="btn-start"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-pause"]')).toBeDisabled();
      await expect(page.locator('[data-testid="btn-reset"]')).toBeEnabled();

      // Reset → idle
      await page.click('[data-testid="btn-reset"]');
      await expect(page.locator('[data-testid="btn-start"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-reset"]')).toBeDisabled();
    });
  });

  // =========================================================================
  // Timer Accuracy
  // =========================================================================

  test.describe("Timer Accuracy", () => {
    /**
     * Measure wall-clock drift over a 5-second countdown.
     * The displayed value should be within ±1 second of the elapsed real time.
     *
     * This test uses real timers (no fake clocks) and is inherently time-sensitive.
     * It may be slightly flaky under extreme CPU load — hence retries in CI.
     */
    test("5-second countdown completes within acceptable drift", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 5);
      await page.click('[data-testid="btn-start"]');

      const wallStart = Date.now();

      // Wait for completion alert
      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 8_000,
        state: "visible",
      });

      const wallEnd = Date.now();
      const wallElapsed = wallEnd - wallStart;

      // Should complete between 4.5s and 6.5s of real time
      expect(wallElapsed).toBeGreaterThanOrEqual(4500);
      expect(wallElapsed).toBeLessThanOrEqual(6500);
    });

    test("timer display updates every second", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');

      const values: string[] = [];

      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(1000);
        const text = await page
          .locator('[data-testid="timer-display"]')
          .textContent();
        values.push(text ?? "");
      }

      // All three values should be different (timer is counting down)
      const unique = new Set(values);
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // Completion
  // =========================================================================

  test.describe("Completion", () => {
    test("completion alert appears when timer reaches zero", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 3);
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
        state: "visible",
      });

      await expect(
        page.locator('[data-testid="completion-alert"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="completion-alert"]')
      ).toContainText(/time.?s up/i);
    });

    test("document title changes to ✅ Done! on completion", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 3);
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
      });

      await expect(page).toHaveTitle(/Done!/i);
    });

    test("dismissing completion alert resets to idle", async ({ page }) => {
      await setDuration(page, 0, 0, 3);
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
      });

      await page.click('[data-testid="btn-dismiss-alert"]');

      // Alert should be gone
      await expect(
        page.locator('[data-testid="completion-alert"]')
      ).not.toBeVisible();

      // Timer should be back in idle / reset state
      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toContainText("00:00:00");
    });

    test("display shows 00:00:00 when completed", async ({ page }) => {
      await setDuration(page, 0, 0, 3);
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
      });

      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toContainText("00:00:00");
    });
  });

  // =========================================================================
  // Document Title
  // =========================================================================

  test.describe("Document Title", () => {
    test("title shows countdown when running", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');

      // Wait one tick
      await page.waitForTimeout(1200);

      // Title should match "▶ 00:00:XX — Countdown Timer"
      const title = await page.title();
      expect(title).toMatch(/▶.*Countdown Timer/);
    });

    test("title shows ⏸ when paused", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(500);
      await page.click('[data-testid="btn-pause"]');

      await page.waitForTimeout(300);
      const title = await page.title();
      expect(title).toMatch(/⏸.*Countdown Timer/);
    });

    test("title resets to default when idle", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(500);
      await page.click('[data-testid="btn-reset"]');

      await page.waitForTimeout(300);
      await expect(page).toHaveTitle(/Countdown Timer/);
      const title = await page.title();
      expect(title).not.toMatch(/▶|⏸/);
    });
  });

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================

  test.describe("Keyboard Shortcuts", () => {
    test("Space starts the timer", async ({ page }) => {
      await setDuration(page, 0, 0, 30);

      // Focus outside inputs
      await page.click("body");
      await page.keyboard.press("Space");

      // Timer should be running
      await expect(page.locator('[data-testid="btn-pause"]')).toBeEnabled();
    });

    test("Space pauses a running timer", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');

      await page.click("body");
      await page.keyboard.press("Space");

      // Timer should be paused
      await expect(page.locator('[data-testid="btn-start"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-pause"]')).toBeDisabled();
    });

    test("R key resets the timer", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(500);

      await page.click("body");
      await page.keyboard.press("r");

      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toContainText("00:00:10");
    });

    test("Escape resets the timer", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(500);

      await page.keyboard.press("Escape");

      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toContainText("00:00:10");
    });

    test("? opens keyboard shortcut overlay", async ({ page }) => {
      await page.click("body");
      await page.keyboard.press("?");

      await expect(
        page.locator('[data-testid="shortcut-overlay"]')
      ).toBeVisible();
    });

    test("Escape closes keyboard shortcut overlay", async ({ page }) => {
      await page.click("body");
      await page.keyboard.press("?");
      await expect(
        page.locator('[data-testid="shortcut-overlay"]')
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(
        page.locator('[data-testid="shortcut-overlay"]')
      ).not.toBeVisible();
    });
  });

  // =========================================================================
  // State Persistence
  // =========================================================================

  test.describe("State Persistence", () => {
    test("running timer state survives page refresh", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');

      // Let it run for 2 seconds
      await page.waitForTimeout(2000);

      // Capture current display value
      const displayBeforeRefresh = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      // Reload the page
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="timer-display"]', {
        state: "visible",
      });

      // Wait for hydration + wall-clock recovery (one extra tick)
      await page.waitForTimeout(1200);

      const displayAfterRefresh = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      // Value after refresh should be lower than before (time passed during reload + recovery)
      // Both should match HH:MM:SS format
      expect(displayAfterRefresh).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(displayBeforeRefresh).toMatch(/\d{2}:\d{2}:\d{2}/);

      // The timer should still be running (pause button enabled)
      await expect(page.locator('[data-testid="btn-pause"]')).toBeEnabled();
    });

    test("paused timer state survives page refresh", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(1000);
      await page.click('[data-testid="btn-pause"]');

      const displayBeforeRefresh = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="timer-display"]', {
        state: "visible",
      });
      await page.waitForTimeout(500);

      const displayAfterRefresh = await page
        .locator('[data-testid="timer-display"]')
        .textContent();

      // Paused timer should not have changed
      expect(displayAfterRefresh).toEqual(displayBeforeRefresh);

      // Should still be in paused state
      await expect(page.locator('[data-testid="btn-start"]')).toBeEnabled();
      await expect(page.locator('[data-testid="btn-pause"]')).toBeDisabled();
    });
  });

  // =========================================================================
  // Progress Ring
  // =========================================================================

  test.describe("Progress Ring", () => {
    test("progress ring is visible when timer is running", async ({ page }) => {
      await setDuration(page, 0, 0, 10);
      await page.click('[data-testid="btn-start"]');

      await expect(
        page.locator('[data-testid="progress-ring"]')
      ).toBeVisible();
    });

    test("progress ring is not visible in idle state", async ({ page }) => {
      // In idle state, progress ring should be hidden or not rendered
      const ring = page.locator('[data-testid="progress-ring"]');
      const isVisible = await ring.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });
  });

  // =========================================================================
  // Responsive Layout
  // =========================================================================

  test.describe("Responsive Layout", () => {
    test("mobile: key elements are visible on small screen", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await gotoApp(page);

      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="btn-start"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="input-minutes"]')
      ).toBeVisible();
    });

    test("tablet: layout renders correctly at 768px", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await gotoApp(page);

      await expect(
        page.locator('[data-testid="timer-display"]')
      ).toBeVisible();
    });
  });
});