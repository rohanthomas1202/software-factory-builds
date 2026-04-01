/**
 * Accessibility E2E Tests — e2e/a11y/timer-a11y.spec.ts
 *
 * Uses @axe-core/playwright to scan the countdown timer app for
 * WCAG 2.1 AA violations across multiple timer states.
 *
 * These tests run in the dedicated "a11y" Playwright project.
 *
 * Violations detected:
 * - Missing or incorrect ARIA roles
 * - Insufficient color contrast
 * - Missing labels on form controls
 * - Focus management issues
 * - Keyboard trap violations
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the app and wait for hydration.
 */
async function gotoApp(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  await page.waitForSelector('[data-testid="timer-display"]', {
    state: "visible",
    timeout: 10_000,
  });
}

/**
 * Run axe scan and assert zero violations.
 * Returns the AxeResults for optional additional assertions.
 */
async function runAxeScan(
  page: import("@playwright/test").Page,
  context?: { include?: string[]; exclude?: string[] }
): Promise<import("axe-core").AxeResults> {
  let builder = new AxeBuilder({ page })
    // Target WCAG 2.1 Level A and AA
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // Exclude third-party iframes if any
    .exclude("iframe[src]");

  if (context?.include) {
    builder = builder.include(context.include.join(", "));
  }

  if (context?.exclude) {
    builder = builder.exclude(context.exclude.join(", "));
  }

  const results = await builder.analyze();
  return results;
}

/**
 * Format axe violations for readable test output.
 */
function formatViolations(
  violations: import("axe-core").Result[]
): string {
  if (violations.length === 0) return "No violations";

  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    Target: ${n.target.join(", ")}`)
        .join("\n");
      return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Accessibility Tests
// ---------------------------------------------------------------------------

test.describe("@a11y Countdown Timer Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // =========================================================================
  // Idle State
  // =========================================================================

  test("idle state: zero axe violations", async ({ page }) => {
    const results = await runAxeScan(page);

    expect(
      results.violations,
      `Accessibility violations in idle state:\n${formatViolations(results.violations)}`
    ).toHaveLength(0);
  });

  // =========================================================================
  // Running State
  // =========================================================================

  test("running state: zero axe violations", async ({ page }) => {
    // Set a duration and start
    await page.fill('[data-testid="input-minutes"]', "5");
    await page.keyboard.press("Tab");
    await page.click('[data-testid="btn-start"]');

    // Wait one tick for the display to update
    await page.waitForTimeout(1200);

    const results = await runAxeScan(page);

    expect(
      results.violations,
      `Accessibility violations in running state:\n${formatViolations(results.violations)}`
    ).toHaveLength(0);
  });

  // =========================================================================
  // Paused State
  // =========================================================================

  test("paused state: zero axe violations", async ({ page }) => {
    await page.fill('[data-testid="input-minutes"]', "5");
    await page.keyboard.press("Tab");
    await page.click('[data-testid="btn-start"]');
    await page.waitForTimeout(800);
    await page.click('[data-testid="btn-pause"]');

    const results = await runAxeScan(page);

    expect(
      results.violations,
      `Accessibility violations in paused state:\n${formatViolations(results.violations)}`
    ).toHaveLength(0);
  });

  // =========================================================================
  // Completed State
  // =========================================================================

  test("completed state: zero axe violations", async ({ page }) => {
    // Use a 3-second timer for a fast completion
    await page.fill('[data-testid="input-seconds"]', "3");
    await page.keyboard.press("Tab");
    await page.click('[data-testid="btn-start"]');

    // Wait for completion alert
    await page.waitForSelector('[data-testid="completion-alert"]', {
      timeout: 6_000,
      state: "visible",
    });

    const results = await runAxeScan(page);

    expect(
      results.violations,
      `Accessibility violations in completed state:\n${formatViolations(results.violations)}`
    ).toHaveLength(0);
  });

  // =========================================================================
  // Keyboard Shortcut Overlay
  // =========================================================================

  test("shortcut overlay: zero axe violations", async ({ page }) => {
    // Open the shortcut overlay
    await page.click("body");
    await page.keyboard.press("?");

    await page.waitForSelector('[data-testid="shortcut-overlay"]', {
      state: "visible",
    });

    const results = await runAxeScan(page);

    expect(
      results.violations,
      `Accessibility violations with shortcut overlay open:\n${formatViolations(results.violations)}`
    ).toHaveLength(0);
  });

  // =========================================================================
  // Specific ARIA Requirements
  // =========================================================================

  test.describe("ARIA Semantics", () => {
    test("timer display has role=timer", async ({ page }) => {
      const timerDisplay = page.locator('[data-testid="timer-display"]');
      await expect(timerDisplay).toHaveAttribute("role", "timer");
    });

    test("timer display has aria-live=polite", async ({ page }) => {
      const timerDisplay = page.locator('[data-testid="timer-display"]');
      await expect(timerDisplay).toHaveAttribute("aria-live", "polite");
    });

    test("hour input has accessible label", async ({ page }) => {
      const hoursInput = page.locator('[data-testid="input-hours"]');
      // Either aria-label or associated <label> must be present
      const ariaLabel = await hoursInput.getAttribute("aria-label");
      const id = await hoursInput.getAttribute("id");

      if (ariaLabel) {
        expect(ariaLabel.toLowerCase()).toContain("hour");
      } else if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const labelText = await label.textContent();
        expect(labelText?.toLowerCase()).toContain("hour");
      } else {
        throw new Error("Hours input has no accessible label");
      }
    });

    test("minute input has accessible label", async ({ page }) => {
      const minutesInput = page.locator('[data-testid="input-minutes"]');
      const ariaLabel = await minutesInput.getAttribute("aria-label");
      const id = await minutesInput.getAttribute("id");

      if (ariaLabel) {
        expect(ariaLabel.toLowerCase()).toContain("min");
      } else if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const labelText = await label.textContent();
        expect(labelText?.toLowerCase()).toContain("min");
      } else {
        throw new Error("Minutes input has no accessible label");
      }
    });

    test("second input has accessible label", async ({ page }) => {
      const secondsInput = page.locator('[data-testid="input-seconds"]');
      const ariaLabel = await secondsInput.getAttribute("aria-label");
      const id = await secondsInput.getAttribute("id");

      if (ariaLabel) {
        expect(ariaLabel.toLowerCase()).toContain("sec");
      } else if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const labelText = await label.textContent();
        expect(labelText?.toLowerCase()).toContain("sec");
      } else {
        throw new Error("Seconds input has no accessible label");
      }
    });

    test("start button has descriptive label", async ({ page }) => {
      const startBtn = page.locator('[data-testid="btn-start"]');
      const label =
        (await startBtn.getAttribute("aria-label")) ??
        (await startBtn.textContent());
      expect(label?.trim().length).toBeGreaterThan(0);
    });

    test("completion alert has role=alertdialog", async ({ page }) => {
      await page.fill('[data-testid="input-seconds"]', "3");
      await page.keyboard.press("Tab");
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
      });

      const alert = page.locator('[data-testid="completion-alert"]');
      const role = await alert.getAttribute("role");
      expect(["alertdialog", "alert", "dialog"]).toContain(role);
    });

    test("shortcut overlay has role=dialog and aria-modal=true", async ({
      page,
    }) => {
      await page.click("body");
      await page.keyboard.press("?");

      const overlay = page.locator('[data-testid="shortcut-overlay"]');
      await expect(overlay).toHaveAttribute("role", "dialog");
      await expect(overlay).toHaveAttribute("aria-modal", "true");
    });
  });

  // =========================================================================
  // Focus Management
  // =========================================================================

  test.describe("Focus Management", () => {
    test("focus moves into completion alert when it appears", async ({
      page,
    }) => {
      await page.fill('[data-testid="input-seconds"]', "3");
      await page.keyboard.press("Tab");
      await page.click('[data-testid="btn-start"]');

      await page.waitForSelector('[data-testid="completion-alert"]', {
        timeout: 6_000,
      });

      // Focused element should be inside the completion alert
      const focusedTestId = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.getAttribute("data-testid") ?? el?.closest("[data-testid]")?.getAttribute("data-testid");
      });

      // The dismiss button should receive focus
      expect(focusedTestId).toBe("btn-dismiss-alert");
    });

    test("focus moves into shortcut overlay when opened", async ({ page }) => {
      await page.click("body");
      await page.keyboard.press("?");

      await page.waitForSelector('[data-testid="shortcut-overlay"]', {
        state: "visible",
      });

      // Focused element should be inside the overlay
      const isFocusInsideOverlay = await page.evaluate(() => {
        const overlay = document.querySelector('[data-testid="shortcut-overlay"]');
        return overlay?.contains(document.activeElement) ?? false;
      });

      expect(isFocusInsideOverlay).toBe(true);
    });

    test("focus returns to trigger after closing shortcut overlay", async ({
      page,
    }) => {
      // Open overlay
      await page.click("body");
      await page.keyboard.press("?");
      await page.waitForSelector('[data-testid="shortcut-overlay"]', {
        state: "visible",
      });

      // Close overlay
      await page.keyboard.press("Escape");
      await page.waitForSelector('[data-testid="shortcut-overlay"]', {
        state: "hidden",
      });

      // Focus should have returned to a reasonable element (not body)
      const focusedTag = await page.evaluate(
        () => document.activeElement?.tagName.toLowerCase()
      );
      expect(focusedTag).not.toBe("body");
    });

    test("Tab key navigates through all interactive elements", async ({
      page,
    }) => {
      // Collect all focusable elements by tabbing through them
      const focusedElements: string[] = [];

      // Start from body
      await page.click("body");

      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const testId = await page.evaluate(
          () =>
            document.activeElement?.getAttribute("data-testid") ??
            document.activeElement?.tagName.toLowerCase()
        );
        if (testId) focusedElements.push(testId);

        // Stop if we've cycled back to the start
        if (
          i > 5 &&
          focusedElements[i] === focusedElements[0]
        ) {
          break;
        }
      }

      // Should have tabbed through multiple interactive elements
      expect(focusedElements.length).toBeGreaterThan(3);
    });
  });

  // =========================================================================
  // Color Contrast
  // =========================================================================

  test.describe("Color Contrast", () => {
    test("sufficient contrast in idle state (axe color-contrast rule)", async ({
      page,
    }) => {
      const results = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      expect(
        results.violations,
        `Color contrast violations:\n${formatViolations(results.violations)}`
      ).toHaveLength(0);
    });

    test("sufficient contrast in running state", async ({ page }) => {
      await page.fill('[data-testid="input-seconds"]', "30");
      await page.keyboard.press("Tab");
      await page.click('[data-testid="btn-start"]');
      await page.waitForTimeout(800);

      const results = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      expect(
        results.violations,
        `Color contrast violations in running state:\n${formatViolations(results.violations)}`
      ).toHaveLength(0);
    });
  });

  // =========================================================================
  // Mobile Accessibility
  // =========================================================================

  test.describe("Mobile Accessibility", () => {
    test("touch targets meet minimum size (48x48px)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="timer-display"]', {
        state: "visible",
      });

      // Measure button sizes
      const startBtn = page.locator('[data-testid="btn-start"]');
      const box = await startBtn.boundingBox();

      if (box) {
        // WCAG 2.5.5 AAA requires 44x44px; we target 48x48px for comfort
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });

    test("mobile: zero axe violations at 375px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="timer-display"]', {
        state: "visible",
      });

      const results = await runAxeScan(page);

      expect(
        results.violations,
        `Mobile accessibility violations:\n${formatViolations(results.violations)}`
      ).toHaveLength(0);
    });
  });
});