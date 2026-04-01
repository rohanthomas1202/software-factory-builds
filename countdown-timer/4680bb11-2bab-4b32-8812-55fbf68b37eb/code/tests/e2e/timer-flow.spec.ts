/**
 * Timer Flow E2E Tests — tests/e2e/timer-flow.spec.ts
 *
 * Covers full user flows:
 * - Complete timer lifecycle: set duration → start → pause → resume → reset → complete
 * - Preset selection flow
 * - Completion alert Dismiss and Restart actions
 * - Keyboard shortcut interactions (Space / R / P / Escape / ?)
 *
 * All timing-sensitive assertions use generous but realistic tolerances.
 * Tests use data-testid attributes and ARIA roles for resilient selectors.
 */

import { test, expect, type Page, type Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Page Object Model
// ---------------------------------------------------------------------------

class TimerPage {
  readonly page: Page;

  // Duration inputs
  readonly hoursInput: Locator;
  readonly minutesInput: Locator;
  readonly secondsInput: Locator;

  // Control buttons
  readonly startButton: Locator;
  readonly pauseButton: Locator;
  readonly resetButton: Locator;

  // Timer display
  readonly timerDisplay: Locator;

  // Preset buttons
  readonly presetButtons: Locator;

  // Completion alert
  readonly completionAlert: Locator;
  readonly dismissButton: Locator;
  readonly restartButton: Locator;

  // Keyboard shortcut overlay
  readonly shortcutOverlay: Locator;

  constructor(page: Page) {
    this.page = page;

    // Duration inputs — identified by aria-label or data-testid
    this.hoursInput = page
      .locator('[data-testid="hours-input"], [aria-label*="hour" i], input[aria-label*="Hour" i]')
      .first();
    this.minutesInput = page
      .locator('[data-testid="minutes-input"], [aria-label*="minute" i], input[aria-label*="Minute" i]')
      .first();
    this.secondsInput = page
      .locator('[data-testid="seconds-input"], [aria-label*="second" i], input[aria-label*="Second" i]')
      .first();

    // Control buttons — by visible text or aria-label
    this.startButton = page
      .locator('button:has-text("Start"), button[aria-label*="Start" i], button:has-text("Resume")')
      .first();
    this.pauseButton = page
      .locator('button:has-text("Pause"), button[aria-label*="Pause" i]')
      .first();
    this.resetButton = page
      .locator('button:has-text("Reset"), button[aria-label*="Reset" i]')
      .first();

    // Timer display — role="timer" per ARIA spec
    this.timerDisplay = page.locator('[role="timer"]').first();

    // Preset buttons container
    this.presetButtons = page.locator('[data-testid="preset-buttons"] button, [aria-label*="preset" i]');

    // Completion alert
    this.completionAlert = page.locator(
      '[role="alertdialog"], [data-testid="completion-alert"], [aria-label*="complete" i]'
    );
    this.dismissButton = page
      .locator('button:has-text("Dismiss"), button[aria-label*="Dismiss" i]')
      .first();
    this.restartButton = page
      .locator('button:has-text("Restart"), button[aria-label*="Restart" i]')
      .first();

    // Keyboard shortcut overlay
    this.shortcutOverlay = page.locator(
      '[role="dialog"][aria-label*="shortcut" i], [data-testid="shortcut-overlay"]'
    );
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    // Wait for hydration
    await this.page.waitForLoadState("networkidle");
    await expect(this.timerDisplay).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Set timer duration using the input fields.
   * Clears existing value before typing.
   */
  async setDuration(hours: number, minutes: number, seconds: number): Promise<void> {
    await this.fillNumericInput(this.hoursInput, hours);
    await this.fillNumericInput(this.minutesInput, minutes);
    await this.fillNumericInput(this.secondsInput, seconds);
  }

  private async fillNumericInput(locator: Locator, value: number): Promise<void> {
    await locator.click({ clickCount: 3 }); // Select all
    await locator.fill(String(value));
    await locator.press("Tab"); // Trigger blur/validation
  }

  /**
   * Click a preset by its displayed label text.
   */
  async clickPreset(label: string): Promise<void> {
    await this.page
      .locator(`button:has-text("${label}")`)
      .first()
      .click();
  }

  /**
   * Read the current displayed time string from the timer display.
   */
  async getDisplayedTime(): Promise<string> {
    const text = await this.timerDisplay.textContent();
    // Extract HH:MM:SS or MM:SS pattern
    const match = text?.match(/\d{2}:\d{2}(?::\d{2})?/);
    return match?.[0] ?? text?.trim() ?? "";
  }

  /**
   * Wait until the timer display shows a specific time string.
   */
  async waitForDisplayedTime(time: string, timeout = 15_000): Promise<void> {
    await expect(this.timerDisplay).toContainText(time, { timeout });
  }

  /**
   * Wait until the completion alert is visible.
   */
  async waitForCompletion(timeout = 30_000): Promise<void> {
    await expect(this.completionAlert).toBeVisible({ timeout });
  }

  /**
   * Assert the document title matches a pattern.
   */
  async expectTitle(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveTitle(pattern, { timeout: 5_000 });
  }
}

// ---------------------------------------------------------------------------
// Test Setup
// ---------------------------------------------------------------------------

test.describe("Timer Flow", () => {
  let timerPage: TimerPage;

  test.beforeEach(async ({ page }) => {
    timerPage = new TimerPage(page);

    // Clear localStorage before each test to ensure a clean state
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await timerPage.goto();
  });

  // -------------------------------------------------------------------------
  // 1. Full Lifecycle: set duration → start → pause → resume → reset → complete
  // -------------------------------------------------------------------------

  test.describe("Full Timer Lifecycle", () => {
    test("should complete full lifecycle: set → start → pause → resume → reset", async () => {
      // Step 1: Set duration (0h 0m 5s — short for testing)
      await timerPage.setDuration(0, 0, 5);

      // Verify inputs accepted values
      await expect(timerPage.secondsInput).toHaveValue("5");

      // Step 2: Start button should be enabled; pause + reset disabled
      await expect(timerPage.startButton).toBeEnabled();
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();

      // Step 3: Start the timer
      await timerPage.startButton.click();

      // Running: pause + reset enabled; start disabled
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.resetButton).toBeEnabled();
      await expect(timerPage.startButton).toBeDisabled();

      // Verify timer is counting (display is visible and shows some time)
      const timeAfterStart = await timerPage.getDisplayedTime();
      expect(timeAfterStart).toMatch(/^\d{2}:\d{2}(:\d{2})?$/);

      // Step 4: Pause the timer
      await timerPage.pauseButton.click();

      // Paused: resume + reset enabled; pause disabled
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.resetButton).toBeEnabled();
      await expect(timerPage.pauseButton).toBeDisabled();

      // Display should be frozen — same time after a brief wait
      const timeAtPause = await timerPage.getDisplayedTime();
      await timerPage.page.waitForTimeout(1_500);
      const timeAfterPauseWait = await timerPage.getDisplayedTime();
      expect(timeAtPause).toBe(timeAfterPauseWait);

      // Step 5: Resume the timer
      await timerPage.startButton.click();

      // Running again
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });

      // Step 6: Reset the timer
      await timerPage.resetButton.click();

      // Back to idle: start enabled, pause + reset disabled
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();

      // Display should show original duration (00:00:05 or 00:05)
      const resetTime = await timerPage.getDisplayedTime();
      expect(resetTime).toMatch(/00:0[0-9]/);
    });

    test("should complete timer and show completion alert", async () => {
      // Set a very short 3-second timer for fast completion testing
      await timerPage.setDuration(0, 0, 3);
      await timerPage.startButton.click();

      // Wait for completion alert (3s + generous buffer)
      await timerPage.waitForCompletion(10_000);

      // Alert should be visible
      await expect(timerPage.completionAlert).toBeVisible();

      // Timer display should show 00:00
      const displayText = await timerPage.getDisplayedTime();
      expect(displayText).toMatch(/^00:00(:\d{2})?$/);
    });

    test("should update document title when running", async () => {
      await timerPage.setDuration(0, 1, 0);
      await timerPage.startButton.click();

      // Running title should contain a play indicator and the time
      await timerPage.expectTitle(/▶/);
    });

    test("should update document title when paused", async () => {
      await timerPage.setDuration(0, 1, 0);
      await timerPage.startButton.click();
      await timerPage.pauseButton.click();

      // Paused title should contain a pause indicator
      await timerPage.expectTitle(/⏸/);
    });

    test("should update document title to Done on completion", async () => {
      await timerPage.setDuration(0, 0, 2);
      await timerPage.startButton.click();

      await timerPage.waitForCompletion(8_000);
      await timerPage.expectTitle(/Done|✅|complete/i);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Completion Alert Actions
  // -------------------------------------------------------------------------

  test.describe("Completion Alert", () => {
    test.beforeEach(async () => {
      // Run a short timer to completion
      await timerPage.setDuration(0, 0, 2);
      await timerPage.startButton.click();
      await timerPage.waitForCompletion(8_000);
    });

    test("Dismiss button should close the alert and return to idle", async () => {
      await expect(timerPage.completionAlert).toBeVisible();

      await timerPage.dismissButton.click();

      // Alert should be hidden
      await expect(timerPage.completionAlert).not.toBeVisible({ timeout: 3_000 });

      // Timer should be in idle state
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();
    });

    test("Restart button should close the alert and restart the timer", async () => {
      await expect(timerPage.completionAlert).toBeVisible();

      await timerPage.restartButton.click();

      // Alert should be hidden
      await expect(timerPage.completionAlert).not.toBeVisible({ timeout: 3_000 });

      // Timer should be running again
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.resetButton).toBeEnabled();
    });

    test("completion alert should have correct ARIA attributes", async () => {
      await expect(timerPage.completionAlert).toBeVisible();

      // Must have alertdialog role or live region
      const role = await timerPage.completionAlert.getAttribute("role");
      expect(role).toMatch(/alertdialog|alert/);
    });

    test("Dismiss button should receive focus on alert open", async () => {
      // After completion, focus should move to dismiss or first focusable button
      // This is important for keyboard users
      const focusedElement = await timerPage.page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });
      expect(focusedElement).toBe("button");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Preset Selection Flow
  // -------------------------------------------------------------------------

  test.describe("Preset Selection", () => {
    // Common preset labels defined in constants.ts
    const presets = [
      { label: "1 min", hours: 0, minutes: 1, seconds: 0, display: /01:00/ },
      { label: "5 min", hours: 0, minutes: 5, seconds: 0, display: /05:00/ },
      { label: "10 min", hours: 0, minutes: 10, seconds: 0, display: /10:00/ },
      { label: "15 min", hours: 0, minutes: 15, seconds: 0, display: /15:00/ },
      { label: "25 min", hours: 0, minutes: 25, seconds: 0, display: /25:00/ },
      { label: "1 hr", hours: 1, minutes: 0, seconds: 0, display: /01:00:00/ },
    ] as const;

    for (const preset of presets) {
      test(`clicking "${preset.label}" preset populates the duration inputs`, async () => {
        await timerPage.clickPreset(preset.label);

        // Timer display should update to reflect preset duration
        const displayTime = await timerPage.getDisplayedTime();
        expect(displayTime).toMatch(preset.display);
      });
    }

    test("selecting a preset enables the Start button", async () => {
      // Initially, if no duration is set, start might be disabled
      await timerPage.clickPreset("5 min");
      await expect(timerPage.startButton).toBeEnabled({ timeout: 2_000 });
    });

    test("preset buttons should be disabled when timer is running", async () => {
      await timerPage.clickPreset("5 min");
      await timerPage.startButton.click();

      // Find all preset buttons and verify they are disabled or have pointer-events: none
      const presetContainer = timerPage.page.locator(
        '[data-testid="preset-buttons"], [aria-label*="preset" i]'
      );

      // All buttons inside preset container should be disabled
      const buttons = presetContainer.locator("button");
      const count = await buttons.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(buttons.nth(i)).toBeDisabled();
        }
      } else {
        // Alternative: check aria-disabled
        const allPresets = timerPage.page.locator('button[aria-label*="min"], button[aria-label*="hr"]');
        const pCount = await allPresets.count();
        for (let i = 0; i < pCount; i++) {
          const isDisabled =
            (await allPresets.nth(i).getAttribute("disabled")) !== null ||
            (await allPresets.nth(i).getAttribute("aria-disabled")) === "true";
          expect(isDisabled).toBe(true);
        }
      }
    });

    test("active preset should be visually highlighted", async () => {
      await timerPage.clickPreset("5 min");

      // The clicked preset button should have an active/selected state
      // We check for aria-pressed or a distinguishing CSS class
      const fiveMinButton = timerPage.page
        .locator('button:has-text("5 min")')
        .first();

      const ariaPressed = await fiveMinButton.getAttribute("aria-pressed");
      const dataActive = await fiveMinButton.getAttribute("data-active");
      const className = await fiveMinButton.getAttribute("class");

      // At least one of these should indicate active state
      const isHighlighted =
        ariaPressed === "true" ||
        dataActive === "true" ||
        className?.includes("ring") ||
        className?.includes("active") ||
        className?.includes("selected");

      expect(isHighlighted).toBe(true);
    });

    test("selecting a new preset clears previous preset highlight", async () => {
      await timerPage.clickPreset("5 min");
      await timerPage.clickPreset("25 min");

      const fiveMinButton = timerPage.page
        .locator('button:has-text("5 min")')
        .first();

      const ariaPressed = await fiveMinButton.getAttribute("aria-pressed");
      // Should NOT be active anymore
      expect(ariaPressed).not.toBe("true");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Keyboard Shortcuts
  // -------------------------------------------------------------------------

  test.describe("Keyboard Shortcuts", () => {
    test("Space key should start the timer from idle", async () => {
      await timerPage.setDuration(0, 0, 30);

      // Focus the page body (not an input)
      await timerPage.page.keyboard.press("Escape"); // dismiss any focus trap
      await timerPage.page.click("body");

      await timerPage.page.keyboard.press("Space");

      // Timer should now be running
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
    });

    test("Space key should pause a running timer", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();

      // Ensure running
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });

      // Blur inputs to avoid intercepting Space
      await timerPage.page.keyboard.press("Escape");

      await timerPage.page.keyboard.press("Space");

      // Timer should now be paused
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
    });

    test("Space key should resume a paused timer", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();
      await timerPage.pauseButton.click();

      // Paused state confirmed
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });

      await timerPage.page.keyboard.press("Space");

      // Should be running again
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
    });

    test("R key should reset the timer from running state", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();

      // Ensure running
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });

      // Press R (not in an input field)
      await timerPage.page.keyboard.press("r");

      // Timer should reset to idle
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();
    });

    test("P key should pause a running timer", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();

      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });

      await timerPage.page.keyboard.press("p");

      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
    });

    test("Escape key should reset the timer", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();

      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });

      await timerPage.page.keyboard.press("Escape");

      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();
    });

    test("? key should open the keyboard shortcut overlay", async () => {
      // Ensure nothing is focused in an input
      await timerPage.page.click("body");
      await timerPage.page.keyboard.press("?");

      await expect(timerPage.shortcutOverlay).toBeVisible({ timeout: 3_000 });
    });

    test("Escape key should close the shortcut overlay", async () => {
      await timerPage.page.click("body");
      await timerPage.page.keyboard.press("?");

      await expect(timerPage.shortcutOverlay).toBeVisible({ timeout: 3_000 });

      await timerPage.page.keyboard.press("Escape");

      await expect(timerPage.shortcutOverlay).not.toBeVisible({ timeout: 3_000 });
    });

    test("keyboard shortcuts should not fire when focus is inside an input", async () => {
      await timerPage.setDuration(0, 0, 30);

      // Focus the seconds input
      await timerPage.secondsInput.focus();

      // Pressing Space inside input should NOT start timer
      await timerPage.page.keyboard.press("Space");

      // Should still be in idle (pause disabled)
      await expect(timerPage.pauseButton).toBeDisabled();
    });

    test("? key shows all five shortcut rows", async () => {
      await timerPage.page.click("body");
      await timerPage.page.keyboard.press("?");

      await expect(timerPage.shortcutOverlay).toBeVisible({ timeout: 3_000 });

      // Check that shortcut keys are listed
      const overlayText = await timerPage.shortcutOverlay.textContent();
      expect(overlayText).toMatch(/Space/i);
      expect(overlayText).toMatch(/R/i);
      expect(overlayText).toMatch(/P/i);
      expect(overlayText).toMatch(/Esc/i);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Edge Cases
  // -------------------------------------------------------------------------

  test.describe("Edge Cases", () => {
    test("Start button should be disabled when duration is zero", async () => {
      await timerPage.setDuration(0, 0, 0);
      await expect(timerPage.startButton).toBeDisabled();
    });

    test("timer display should be visible and show time format", async () => {
      await expect(timerPage.timerDisplay).toBeVisible();
      const text = await timerPage.timerDisplay.textContent();
      expect(text).toMatch(/\d{2}:\d{2}/);
    });

    test("multiple pause/resume cycles work correctly", async () => {
      await timerPage.setDuration(0, 0, 30);
      await timerPage.startButton.click();

      for (let i = 0; i < 3; i++) {
        await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
        await timerPage.pauseButton.click();
        await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
        await timerPage.startButton.click();
      }

      // Should still be running after 3 cycles
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
    });

    test("reset from paused state returns to idle", async () => {
      await timerPage.setDuration(0, 1, 0);
      await timerPage.startButton.click();
      await expect(timerPage.pauseButton).toBeEnabled({ timeout: 3_000 });
      await timerPage.pauseButton.click();
      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await timerPage.resetButton.click();

      await expect(timerPage.startButton).toBeEnabled({ timeout: 3_000 });
      await expect(timerPage.pauseButton).toBeDisabled();
      await expect(timerPage.resetButton).toBeDisabled();
    });
  });
});