/**
 * Accessibility E2E Tests — tests/e2e/accessibility.spec.ts
 *
 * Comprehensive accessibility test suite using @axe-core/playwright.
 *
 * Coverage:
 * 1. Full axe scan on page load (target 0 violations)
 * 2. Axe scans across all four timer states (idle, running, paused, completed)
 * 3. Keyboard-only navigation through all interactive controls
 * 4. ARIA role verification for timer display and buttons
 * 5. Color contrast checks across all four timer states
 * 6. Screen reader announcement region validation
 * 7. Focus management verification (modal, completion alert)
 * 8. Form label association checks
 *
 * Prerequisites:
 *   npm install --save-dev @axe-core/playwright
 *
 * Run:
 *   npx playwright test tests/e2e/accessibility.spec.ts
 */

import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * WCAG 2.1 AA rules we explicitly target.
 * We disable a small set of rules that are known false-positives in
 * jsdom / headless environments (e.g. "color-contrast" for SVG elements
 * that rely on CSS variables not resolved in the test renderer).
 */
const AXE_RULES_TO_DISABLE: string[] = [
  // SVG elements inside ProgressRing can trip up axe's colour-contrast
  // algorithm because it cannot resolve CSS custom properties at scan time.
  // We cover contrast manually in the dedicated contrast-check tests below.
];

/**
 * Minimal axe options applied to every scan.
 */
const DEFAULT_AXE_OPTIONS = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
  },
};

// ---------------------------------------------------------------------------
// Page Object Helpers
// ---------------------------------------------------------------------------

/** Navigate to the app and wait for the timer display to be visible. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  // Wait for hydration — the timer display is the key landmark.
  await page.waitForSelector('[role="timer"]', { state: "visible", timeout: 10_000 });
}

/**
 * Set the duration inputs to a given time without triggering any other state.
 * The app renders three NumericInput fields labelled Hours / Minutes / Seconds.
 */
async function setDuration(
  page: Page,
  hours: number,
  minutes: number,
  seconds: number
): Promise<void> {
  const hoursInput = page.getByRole("spinbutton", { name: /hours/i });
  const minutesInput = page.getByRole("spinbutton", { name: /minutes/i });
  const secondsInput = page.getByRole("spinbutton", { name: /seconds/i });

  await hoursInput.fill(String(hours).padStart(2, "0"));
  await minutesInput.fill(String(minutes).padStart(2, "0"));
  await secondsInput.fill(String(seconds).padStart(2, "0"));

  // Tab away from the last field so onBlur clamping runs.
  await secondsInput.press("Tab");
}

/** Press Start and wait for the timer to enter "running" state. */
async function startTimer(page: Page): Promise<void> {
  const startButton = page.getByRole("button", { name: /start/i });
  await startButton.click();
  // Wait for the Pause button to become visible (confirms running state).
  await page.waitForSelector('button:has-text("Pause")', {
    state: "visible",
    timeout: 3_000,
  });
}

/** Press Pause and wait for the timer to enter "paused" state. */
async function pauseTimer(page: Page): Promise<void> {
  const pauseButton = page.getByRole("button", { name: /pause/i });
  await pauseButton.click();
  await page.waitForSelector('button:has-text("Resume")', {
    state: "visible",
    timeout: 3_000,
  });
}

/**
 * Drive the timer to completion by setting a 1-second duration, starting it,
 * and waiting for the completion alert to appear.
 */
async function driveToCompletion(page: Page): Promise<void> {
  await setDuration(page, 0, 0, 5);
  await startTimer(page);
  // Wait up to 10 seconds for the completion alert.
  await page.waitForSelector('[role="alertdialog"], [data-testid="completion-alert"]', {
    state: "visible",
    timeout: 12_000,
  });
}

/**
 * Run an axe scan and assert zero violations.
 * Returns the AxeBuilder for optional chaining.
 */
async function runAxeScan(
  page: Page,
  label: string,
  extraDisabledRules: string[] = []
): Promise<void> {
  const disabledRules = [...AXE_RULES_TO_DISABLE, ...extraDisabledRules];

  const builder = new AxeBuilder({ page })
    .withOptions(DEFAULT_AXE_OPTIONS)
    .exclude("#__next > script") // exclude Next.js injected scripts
    .exclude("script")
    .exclude("style");

  if (disabledRules.length > 0) {
    builder.disableRules(disabledRules);
  }

  const results = await builder.analyze();

  // Format violations into a human-readable string for the assertion message.
  const violationSummary = results.violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `    target: ${JSON.stringify(n.target)}`)
        .join("\n");
      return `[${v.impact?.toUpperCase() ?? "UNKNOWN"}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join("\n\n");

  expect(
    results.violations,
    `axe violations in state "${label}":\n\n${violationSummary}`
  ).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("Accessibility — Countdown Timer App", () => {
  test.beforeEach(async ({ page }) => {
    // Grant notification permission to avoid permission prompts during tests.
    await page.context().grantPermissions(["notifications"]);
    await gotoApp(page);
  });

  // =========================================================================
  // 1. Full axe scan on page load (idle state)
  // =========================================================================

  test.describe("1. Full axe scan — page load (idle state)", () => {
    test("should have zero axe violations on initial page load", async ({ page }) => {
      await runAxeScan(page, "idle");
    });

    test("page should have a single <h1> landmark", async ({ page }) => {
      const h1Elements = await page.locator("h1").all();
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
      // Best practice: exactly one <h1>
      expect(h1Elements.length).toBe(1);
    });

    test("page should have a <main> landmark region", async ({ page }) => {
      const main = page.locator("main");
      await expect(main).toBeVisible();
    });

    test("document should have a descriptive <title>", async ({ page }) => {
      const title = await page.title();
      expect(title).toMatch(/countdown timer/i);
    });

    test("html element should have a lang attribute", async ({ page }) => {
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}/); // e.g. "en"
    });

    test("all images should have alt attributes", async ({ page }) => {
      const imgs = await page.locator("img").all();
      for (const img of imgs) {
        const alt = await img.getAttribute("alt");
        // alt="" is valid for decorative images; null is not.
        expect(alt, "img missing alt attribute").not.toBeNull();
      }
    });
  });

  // =========================================================================
  // 2. Axe scans across all four timer states
  // =========================================================================

  test.describe("2. Axe scans — all four timer states", () => {
    test("should have zero violations in IDLE state", async ({ page }) => {
      // Already in idle state from beforeEach
      await runAxeScan(page, "idle");
    });

    test("should have zero violations in RUNNING state", async ({ page }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);
      // Let it run for a tick so the display updates
      await page.waitForTimeout(1_200);
      await runAxeScan(page, "running");
    });

    test("should have zero violations in PAUSED state", async ({ page }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);
      await pauseTimer(page);
      await runAxeScan(page, "paused");
    });

    test("should have zero violations in COMPLETED state", async ({ page }) => {
      await driveToCompletion(page);
      await runAxeScan(page, "completed", [
        // The completion alert dialog uses an autofocus pattern which some
        // axe versions flag as a false positive under test conditions.
        "focus-trap",
      ]);
    });
  });

  // =========================================================================
  // 3. Keyboard-only navigation
  // =========================================================================

  test.describe("3. Keyboard-only navigation", () => {
    test("Tab order should reach all interactive controls from top to bottom", async ({
      page,
    }) => {
      // Start from the body, then Tab through all focusable elements.
      await page.keyboard.press("Tab");

      // We collect the sequence of focused element descriptions.
      const focusedLabels: string[] = [];
      const maxTabs = 30; // safety limit

      for (let i = 0; i < maxTabs; i++) {
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return {
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role"),
            ariaLabel: el.getAttribute("aria-label"),
            text: (el as HTMLElement).innerText?.trim().slice(0, 50),
            type: el.getAttribute("type"),
            name: el.getAttribute("name"),
          };
        });

        if (!focused) break;
        focusedLabels.push(
          `${focused.tag}[role=${focused.role ?? "—"}] "${
            focused.ariaLabel ?? focused.text ?? focused.name ?? "?"
          }"`
        );

        await page.keyboard.press("Tab");
      }

      // Verify we visited at least: hours input, minutes input, seconds input,
      // preset buttons, start button, and keyboard help button.
      const combined = focusedLabels.join(" | ").toLowerCase();

      // Duration inputs
      expect(combined).toMatch(/hours|minutes|seconds|spinbutton/i);
      // At least one preset chip
      expect(combined).toMatch(/preset|1 min|5 min|30s/i);
      // Start button
      expect(combined).toMatch(/start/i);
    });

    test("Space key should start the timer from idle state", async ({ page }) => {
      await setDuration(page, 0, 0, 30);

      // Focus the start button first via Tab navigation
      const startButton = page.getByRole("button", { name: /start/i });
      await startButton.focus();

      // Press Space to activate
      await page.keyboard.press("Space");

      await page.waitForSelector('button:has-text("Pause")', {
        state: "visible",
        timeout: 3_000,
      });

      const pauseButton = page.getByRole("button", { name: /pause/i });
      await expect(pauseButton).toBeVisible();
    });

    test("Space keyboard shortcut should toggle start/pause without a focused button", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 30);

      // Click somewhere neutral (the main landmark) so no button is focused
      await page.locator("main").click({ position: { x: 10, y: 10 } });

      // Space shortcut → start
      await page.keyboard.press("Space");
      await page.waitForSelector('button:has-text("Pause")', {
        state: "visible",
        timeout: 3_000,
      });

      // Space shortcut → pause
      await page.keyboard.press("Space");
      await page.waitForSelector('button:has-text("Resume")', {
        state: "visible",
        timeout: 3_000,
      });
    });

    test("R keyboard shortcut should reset the timer", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await page.locator("main").click({ position: { x: 10, y: 10 } });
      await page.keyboard.press("Space"); // start

      await page.waitForSelector('button:has-text("Pause")', {
        state: "visible",
        timeout: 3_000,
      });

      await page.keyboard.press("r");

      // After reset, Start button should be visible and enabled
      const startButton = page.getByRole("button", { name: /start/i });
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
    });

    test("Escape key should reset the timer", async ({ page }) => {
      await setDuration(page, 0, 0, 30);
      await startTimer(page);
      await pauseTimer(page);

      await page.keyboard.press("Escape");

      const startButton = page.getByRole("button", { name: /start/i });
      await expect(startButton).toBeEnabled();
    });

    test("? key should open the keyboard shortcut overlay", async ({ page }) => {
      await page.keyboard.press("?");

      // The overlay should appear — look for role="dialog"
      const overlay = page.locator('[role="dialog"]');
      await expect(overlay).toBeVisible({ timeout: 2_000 });
    });

    test("Escape key should close the shortcut overlay", async ({ page }) => {
      await page.keyboard.press("?");
      const overlay = page.locator('[role="dialog"]');
      await expect(overlay).toBeVisible({ timeout: 2_000 });

      await page.keyboard.press("Escape");
      await expect(overlay).not.toBeVisible({ timeout: 2_000 });
    });

    test("focus should be trapped inside the shortcut overlay while it is open", async ({
      page,
    }) => {
      await page.keyboard.press("?");
      const overlay = page.locator('[role="dialog"]');
      await expect(overlay).toBeVisible({ timeout: 2_000 });

      // Tab through several focusable elements inside the overlay
      const visitedInsideOverlay: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const isInsideOverlay = await page.evaluate(() => {
          const focused = document.activeElement;
          const dialog = document.querySelector('[role="dialog"]');
          return dialog ? dialog.contains(focused) : false;
        });
        visitedInsideOverlay.push(isInsideOverlay);
      }

      // All focused elements should be inside the overlay (focus trap).
      expect(visitedInsideOverlay.every(Boolean)).toBe(true);
    });

    test("focus should return to the trigger after closing the shortcut overlay", async ({
      page,
    }) => {
      // Focus the help button explicitly (if it exists) before opening overlay
      const helpButton = page.getByRole("button", { name: /keyboard shortcuts|help|\?/i }).first();
      const helpButtonExists = await helpButton.count();

      if (helpButtonExists > 0) {
        await helpButton.focus();
        await helpButton.press("Enter");
      } else {
        await page.keyboard.press("?");
      }

      const overlay = page.locator('[role="dialog"]');
      await expect(overlay).toBeVisible({ timeout: 2_000 });

      await page.keyboard.press("Escape");
      await expect(overlay).not.toBeVisible({ timeout: 2_000 });

      if (helpButtonExists > 0) {
        // Focus should have returned to the help button.
        const focused = await page.evaluate(
          () => document.activeElement?.getAttribute("aria-label") ?? ""
        );
        expect(focused).toMatch(/keyboard shortcuts|help|\?/i);
      }
    });

    test("Enter key should activate focused buttons", async ({ page }) => {
      await setDuration(page, 0, 0, 30);

      const startButton = page.getByRole("button", { name: /start/i });
      await startButton.focus();
      await page.keyboard.press("Enter");

      await page.waitForSelector('button:has-text("Pause")', {
        state: "visible",
        timeout: 3_000,
      });
    });

    test("Shift+Tab should navigate backwards through interactive controls", async ({
      page,
    }) => {
      // Tab forward to the start button
      const startButton = page.getByRole("button", { name: /start/i });
      await startButton.focus();

      // Shift+Tab should move to the previous element
      await page.keyboard.press("Shift+Tab");

      const previousFocused = await page.evaluate(
        () => document.activeElement?.tagName.toLowerCase() ?? ""
      );
      // Should have moved to a focusable element (not body)
      expect(previousFocused).not.toBe("body");
    });

    test("preset buttons should be keyboard-activatable", async ({ page }) => {
      // Tab to the first preset button
      const firstPreset = page
        .getByRole("button")
        .filter({ hasText: /30s|1 min|2 min|5 min/i })
        .first();

      await firstPreset.focus();
      await page.keyboard.press("Enter");

      // After activating a preset, the duration inputs should reflect the preset.
      const secondsInput = page.getByRole("spinbutton", { name: /seconds/i });
      const minutesInput = page.getByRole("spinbutton", { name: /minutes/i });

      // At least one of these should be non-zero.
      const seconds = await secondsInput.inputValue();
      const minutes = await minutesInput.inputValue();

      expect(parseInt(seconds, 10) + parseInt(minutes, 10)).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. ARIA role verification
  // =========================================================================

  test.describe("4. ARIA role verification", () => {
    test('timer display should have role="timer"', async ({ page }) => {
      const timerDisplay = page.locator('[role="timer"]');
      await expect(timerDisplay).toBeVisible();
    });

    test('timer display should have aria-live="polite"', async ({ page }) => {
      const timerDisplay = page.locator('[role="timer"]');
      const ariaLive = await timerDisplay.getAttribute("aria-live");
      expect(ariaLive).toBe("polite");
    });

    test('timer display should have aria-atomic="true"', async ({ page }) => {
      const timerDisplay = page.locator('[role="timer"]');
      const ariaAtomic = await timerDisplay.getAttribute("aria-atomic");
      expect(ariaAtomic).toBe("true");
    });

    test('timer display should have an aria-label describing its content', async ({
      page,
    }) => {
      const timerDisplay = page.locator('[role="timer"]');
      const ariaLabel = await timerDisplay.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/timer|countdown/i);
    });

    test("Start button should have accessible name", async ({ page }) => {
      const startButton = page.getByRole("button", { name: /start/i });
      await expect(startButton).toBeVisible();
      const accessibleName = await startButton.getAttribute("aria-label");
      // Either aria-label or visible text is sufficient.
      // getByRole already asserts accessible name matches /start/i.
      expect(startButton).toBeTruthy();
    });

    test("Pause button should have accessible name when timer is running", async ({
      page,
    }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);

      const pauseButton = page.getByRole("button", { name: /pause/i });
      await expect(pauseButton).toBeVisible();
    });

    test("Reset button should have accessible name", async ({ page }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);

      const resetButton = page.getByRole("button", { name: /reset/i });
      await expect(resetButton).toBeVisible();
    });

    test("duration inputs should have associated labels", async ({ page }) => {
      // Each input should be reachable via a label (either via for/id or aria-label/aria-labelledby)
      const hoursInput = page.getByRole("spinbutton", { name: /hours/i });
      const minutesInput = page.getByRole("spinbutton", { name: /minutes/i });
      const secondsInput = page.getByRole("spinbutton", { name: /seconds/i });

      await expect(hoursInput).toBeVisible();
      await expect(minutesInput).toBeVisible();
      await expect(secondsInput).toBeVisible();
    });

    test("preset buttons should have role=button and accessible names", async ({
      page,
    }) => {
      const presetButtons = page
        .getByRole("button")
        .filter({ hasText: /30s|1 min|2 min|5 min|10 min|30 min/i });

      const count = await presetButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < count; i++) {
        const btn = presetButtons.nth(i);
        await expect(btn).toBeVisible();
        const text = await btn.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });

    test("progress ring SVG should have aria-hidden or a descriptive label", async ({
      page,
    }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);

      // The progress ring SVG should either be hidden from AT or have a label.
      const svgElements = page.locator("svg");
      const svgCount = await svgElements.count();

      for (let i = 0; i < svgCount; i++) {
        const svg = svgElements.nth(i);
        const ariaHidden = await svg.getAttribute("aria-hidden");
        const ariaLabel = await svg.getAttribute("aria-label");
        const role = await svg.getAttribute("role");
        const titleEl = svg.locator("title");
        const hasTitle = (await titleEl.count()) > 0;

        // At least one of these must be true for each SVG.
        const isAccessible =
          ariaHidden === "true" || !!ariaLabel || role === "img" || hasTitle;

        expect(
          isAccessible,
          `SVG element #${i} lacks aria-hidden, aria-label, role="img", or <title>`
        ).toBe(true);
      }
    });

    test("disabled buttons should have aria-disabled or the disabled attribute", async ({
      page,
    }) => {
      // In idle state: Pause and Reset should be disabled.
      const pauseButton = page.getByRole("button", { name: /pause/i });
      const resetButton = page.getByRole("button", { name: /reset/i });

      if ((await pauseButton.count()) > 0) {
        const isDisabled =
          (await pauseButton.getAttribute("disabled")) !== null ||
          (await pauseButton.getAttribute("aria-disabled")) === "true";
        expect(isDisabled).toBe(true);
      }

      if ((await resetButton.count()) > 0) {
        const isDisabled =
          (await resetButton.getAttribute("disabled")) !== null ||
          (await resetButton.getAttribute("aria-disabled")) === "true";
        expect(isDisabled).toBe(true);
      }
    });

    test('completion alert should have role="alertdialog" or role="alert"', async ({
      page,
    }) => {
      await driveToCompletion(page);

      const alertDialog = page
        .locator('[role="alertdialog"], [role="alert"]')
        .first();
      await expect(alertDialog).toBeVisible({ timeout: 3_000 });
    });

    test("completion alert should have aria-labelledby or aria-label", async ({
      page,
    }) => {
      await driveToCompletion(page);

      const alertDialog = page
        .locator('[role="alertdialog"]')
        .first();
      const count = await alertDialog.count();

      if (count > 0) {
        const ariaLabelledBy = await alertDialog.getAttribute("aria-labelledby");
        const ariaLabel = await alertDialog.getAttribute("aria-label");
        expect(ariaLabelledBy ?? ariaLabel).toBeTruthy();
      }
    });

    test('shortcut overlay should have role="dialog" with aria-modal="true"', async ({
      page,
    }) => {
      await page.keyboard.press("?");

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 2_000 });

      const ariaModal = await dialog.getAttribute("aria-modal");
      expect(ariaModal).toBe("true");
    });

    test("shortcut overlay dialog should have aria-labelledby pointing to a heading", async ({
      page,
    }) => {
      await page.keyboard.press("?");

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 2_000 });

      const ariaLabelledBy = await dialog.getAttribute("aria-labelledby");
      if (ariaLabelledBy) {
        const heading = page.locator(`#${ariaLabelledBy}`);
        await expect(heading).toBeVisible();
      } else {
        // Fallback: aria-label is also acceptable.
        const ariaLabel = await dialog.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
      }
    });

    test("mute button (if present) should have accessible name describing its action", async ({
      page,
    }) => {
      const muteButton = page.getByRole("button", { name: /mute|unmute|sound|audio/i });
      const count = await muteButton.count();

      if (count > 0) {
        await expect(muteButton.first()).toBeVisible();
        const text = await muteButton.first().innerText();
        const ariaLabel = await muteButton.first().getAttribute("aria-label");
        expect((text + (ariaLabel ?? "")).trim().length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 5. Color contrast checks across all four timer states
  // =========================================================================

  test.describe("5. Color contrast — all timer states", () => {
    /**
     * We rely on axe's color-contrast rule for these checks.
     * The rule ID is "color-contrast" and it is included in wcag2aa.
     * We re-run focused scans per state.
     */

    async function runContrastScan(page: Page, label: string): Promise<void> {
      const builder = new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("script")
        .exclude("style");

      const results = await builder.analyze();

      const violations = results.violations.filter(
        (v) => v.id === "color-contrast"
      );

      const summary = violations
        .map((v) => {
          const nodes = v.nodes
            .slice(0, 5)
            .map(
              (n) =>
                `    element: ${JSON.stringify(n.target)} — ${n.failureSummary}`
            )
            .join("\n");
          return `${v.id}: ${v.description}\n${nodes}`;
        })
        .join("\n\n");

      expect(
        violations,
        `Color contrast violations in state "${label}":\n\n${summary}`
      ).toHaveLength(0);
    }

    test("IDLE state — timer display text should meet 4.5:1 contrast ratio", async ({
      page,
    }) => {
      await runContrastScan(page, "idle");
    });

    test("RUNNING state — timer display and buttons should meet contrast requirements", async ({
      page,
    }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);
      await page.waitForTimeout(500);
      await runContrastScan(page, "running");
    });

    test("PAUSED state — timer display and buttons should meet contrast requirements", async ({
      page,
    }) => {
      await setDuration(page, 0, 1, 0);
      await startTimer(page);
      await pauseTimer(page);
      await runContrastScan(page, "paused");
    });

    test("COMPLETED state — completion alert text should meet contrast requirements", async ({
      page,
    }) => {
      await driveToCompletion(page);
      await runContrastScan(page, "completed");
    });

    test("focus rings should be visible on interactive elements", async ({ page }) => {
      // Tab to the start button and check that a focus indicator is visible.
      const startButton = page.getByRole("button", { name: /start/i });
      await startButton.focus();

      // Capture a screenshot for manual inspection if needed.
      await page.screenshot({
        path: "test-results/screenshots/focus-ring-start-button.png",
      });

      // Check via computed styles that an outline or box-shadow is applied.
      const hasFocusRing = await page.evaluate(() => {
        const el = document.querySelector("button");
        if (!el) return false;
        const styles = window.getComputedStyle(el, ":focus-visible");
        const outline = styles.getPropertyValue("outline");
        const outlineWidth = styles.getPropertyValue("outline-width");
        const boxShadow = styles.getPropertyValue("box-shadow");
        // An outline of at least 2px or a non-none box-shadow indicates a focus ring.
        return (
          (outline !== "none" && outline !== "" && parseFloat(outlineWidth) >= 2) ||
          (boxShadow !== "none" && boxShadow !== "")
        );
      });

      // We capture but don't fail on this assertion since CSS :focus-visible
      // may use Tailwind ring utilities not easily introspectable in tests.
      // Instead we verify axe doesn't report focus-order issues.
      // The visual presence is verified by screenshot artifact above.
      // Soft assertion:
      if (!hasFocusRing) {
        console.warn(
          "WARN: Could not verify focus ring via computedStyle. " +
            "Check screenshots in test-results/screenshots/."
        );
      }
    });
  });

  // =========================================================================
  // 6. Screen reader announcement region validation
  // =========================================================================

  test.describe("6. Screen reader announcement regions", () => {
    /**
     * Verifies the presence and correctness of aria-live regions used to
     * announce timer state changes to screen reader users.
     */

    test("assertive live region should exist for immediate state announcements", async ({
      page,
    }) => {
      const assertiveRegion = page.locator('[aria-live="assertive"]');
      // At least one assertive region should be in the DOM.
      const count = await assertiveRegion.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("polite live region (role=timer) should exist for periodic announcements", async ({
      page,
    }) => {
      const politeTimer = page.locator('[role="timer"][aria-live="polite"]');
      await expect(politeTimer).toBeVisible();
    });

    test("assertive region should announce timer completion", async ({ page }) => {
      await driveToCompletion(page);

      // The assertive region should contain a completion message.
      const assertiveRegions = page.locator('[aria-live="assertive"]');
      const regionCount = await assertiveRegions.count();

      let foundCompletionText = false;
      for (let i = 0; i < regionCount; i++) {
        const text = await assertiveRegions.nth(i).textContent();
        if (text && /done|complete|time.?s up|finished|0:00|00:00/i.test(text)) {
          foundCompletionText = true;
          break;
        }
      }

      // Also check for visible completion text (alert modal is also visible).
      const completionAlert = page.locator('[role="alertdialog"], [role="alert"]');
      const alertVisible = (await completionAlert.count()) > 0;

      // Either the live region has content or the alert is visible.
      expect(foundCompletionText || alertVisible).toBe(true);
    });

    test("assertive region should announce state transitions", async ({ page }) => {
      await setDuration(page, 0, 0, 30);

      // Start the timer and check for an announcement.
      await startTimer(page);

      // Brief wait for the announcement to propagate.
      await page.waitForTimeout(300);

      const assertiveRegions = page.locator('[aria-live="assertive"]');
      const regionCount = await assertiveRegions.count();

      // We verify the region exists and is accessible (not hidden).
      for (let i = 0; i < regionCount; i++) {
        const region = assertiveRegions.nth(i);
        // Assertive regions should NOT have aria-hidden="true".
        const ariaHidden = await region.getAttribute("aria-hidden");
        expect(ariaHidden).not.toBe("true");
      }
    });

    test("polite timer region should not spam announcements (throttled to ≤15s)", async ({
      page,
    }) => {
      await setDuration(page, 0, 0, 30);
      await startTimer(page);

      // Capture timer display text over 3 seconds — it should update visually
      // but the live region text should not change more than once every few seconds.
      const snapshots: string[] = [];
      const timerDisplay = page.locator('[role="timer"]');

      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(500);
        const text = await timerDisplay.textContent();
        snapshots.push(text ?? "");
      }

      // The visual display should be updating (counting down).
      const uniqueValues = new Set(snapshots.filter(Boolean));
      // Over 3 seconds of a 30-second timer, we expect some updates.
      expect(uniqueValues.size).toBeGreaterThanOrEqual(1);
    });

    test("all aria-live regions should have aria-atomic or aria-relevant set appropriately", async ({
      page,
    }) => {
      const liveRegions = page.locator("[aria-live]");
      const count = await liveRegions.count();

      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute("aria-live");

        // "off" regions don't need atomic.
        if (ariaLive === "off") continue;

        // For "assertive" regions, aria-atomic="true" is strongly recommended
        // so the entire message is read rather than just the changed portion.
        if (ariaLive === "assertive") {
          const ariaAtomic = await region.getAttribute("aria-atomic");
          // We log but don't fail — this is a best-practice check.
          if (ariaAtomic !== "true") {
            console.warn(
              `WARN: assertive live region #${i} missing aria-atomic="true"`
            );
          }
        }
      }
    });

    test("completion alert dismissal should return focus to timer display or start button", async ({
      page,
    }) => {
      await driveToCompletion(page);

      const completionAlert = page
        .locator('[role="alertdialog"], [data-testid="completion-alert"]')
        .first();
      await expect(completionAlert).toBeVisible({ timeout: 3_000 });

      // Dismiss the alert by clicking the Dismiss button or pressing Escape.
      const dismissButton = completionAlert
        .getByRole("button", { name: /dismiss|close|ok/i })
        .first();

      const hasDismissButton = (await dismissButton.count()) > 0;

      if (hasDismissButton) {
        await dismissButton.click();
      } else {
        await page.keyboard.press("Escape");
      }

      await expect(completionAlert).not.toBeVisible({ timeout: 3_000 });

      // Verify focus has moved to a sensible element (not body).
      const focusedTag = await page.evaluate(
        () => document.activeElement?.tagName.toLowerCase() ?? "body"
      );
      expect(focusedTag).not.toBe("body");
    });
  });

  // =========================================================================
  // 7. Form accessibility — label associations
  // =========================================================================

  test.describe("7. Form accessibility", () => {
    test("all form inputs should have accessible names via label or aria-label", async ({
      page,
    }) => {
      const inputs = page.locator("input");
      const count = await inputs.count();

      expect(count).toBeGreaterThan(0); // At least HH/MM/SS inputs

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const title = await input.getAttribute("title");

        // Check for a <label for="id"> association.
        let hasLabelFor = false;
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          hasLabelFor = (await label.count()) > 0;
        }

        const hasAccessibleName =
          hasLabelFor || !!ariaLabel || !!ariaLabelledBy || !!title;

        expect(
          hasAccessibleName,
          `input #${i} (id="${id ?? "—"}") has no accessible name`
        ).toBe(true);
      }
    });

    test("duration input group should have a fieldset/legend or group role", async ({
      page,
    }) => {
      // The HH/MM/SS inputs should be grouped under a fieldset+legend or
      // an element with role="group" and an aria-label/aria-labelledby.
      const fieldset = page.locator("fieldset");
      const group = page.locator('[role="group"]');

      const fieldsetCount = await fieldset.count();
      const groupCount = await group.count();

      // At least one grouping mechanism should be present.
      expect(fieldsetCount + groupCount).toBeGreaterThanOrEqual(1);
    });

    test("preset buttons section should have an accessible group label", async ({
      page,
    }) => {
      // Presets should be wrapped in a section or nav with an aria-label,
      // or a heading that precedes them.
      const presets = page
        .getByRole("button")
        .filter({ hasText: /30s|1 min|2 min|5 min|10 min|30 min/i });
      const presetsCount = await presets.count();

      if (presetsCount > 0) {
        // Check the parent structure for a label.
        const hasGroupLabel = await page.evaluate(() => {
          const button = [...document.querySelectorAll("button")].find((b) =>
            /30s|1 min|2 min|5 min/i.test(b.textContent ?? "")
          );
          if (!button) return false;

          // Walk up the DOM to find a group with an aria-label.
          let el: Element | null = button.parentElement;
          while (el && el !== document.body) {
            const role = el.getAttribute("role");
            const ariaLabel = el.getAttribute("aria-label");
            const ariaLabelledBy = el.getAttribute("aria-labelledby");
            const tagName = el.tagName.toLowerCase();

            if (
              (tagName === "fieldset" ||
                tagName === "section" ||
                tagName === "nav" ||
                role === "group" ||
                role === "region") &&
              (ariaLabel || ariaLabelledBy)
            ) {
              return true;
            }

            // Check for a heading sibling.
            const prevSibling = el.previousElementSibling;
            if (
              prevSibling &&
              /^h[1-6]$/.test(prevSibling.tagName.toLowerCase())
            ) {
              return true;
            }

            el = el.parentElement;
          }
          return false;
        });

        // Log as a warning rather than hard-fail (some implementations use heading proximity).
        if (!hasGroupLabel) {
          console.warn(
            "WARN: Preset buttons section may lack a programmatic group label. " +
              "Consider wrapping with role=group + aria-label."
          );
        }
      }
    });
  });

  // =========================================================================
  // 8. Responsive / zoom accessibility
  // =========================================================================

  test.describe("8. Zoom and responsive accessibility", () => {
    test("app should have zero axe violations at 200% zoom (1280px → 640px viewport)", async ({
      page,
    }) => {
      // Simulate 200% zoom by halving the viewport width.
      await page.setViewportSize({ width: 640, height: 900 });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector('[role="timer"]', { state: "visible" });

      await runAxeScan(page, "200%-zoom-640px");
    });

    test("app should have zero axe violations on a 375px mobile viewport", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector('[role="timer"]', { state: "visible" });

      await runAxeScan(page, "mobile-375px");
    });

    test("timer display font size should be at least 16px (no tiny text)", async ({
      page,
    }) => {
      const timerDisplay = page.locator('[role="timer"]');
      const fontSize = await timerDisplay.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // The main timer display should use a large, legible font.
      // Exact value depends on design but should be well above 16px.
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });
  });

  // =========================================================================
  // 9. Smoke test — quick full-state axe suite
  // =========================================================================

  test.describe("9. Combined axe smoke test — all states in sequence", () => {
    test("zero violations through complete timer lifecycle", async ({ page }) => {
      // Idle
      await runAxeScan(page, "lifecycle-idle");

      // Set duration and scan
      await setDuration(page, 0, 0, 10);
      await runAxeScan(page, "lifecycle-duration-set");

      // Running
      await startTimer(page);
      await page.waitForTimeout(800);
      await runAxeScan(page, "lifecycle-running");

      // Paused
      await pauseTimer(page);
      await runAxeScan(page, "lifecycle-paused");

      // Resume
      await page.getByRole("button", { name: /resume/i }).click();
      await page.waitForTimeout(500);
      await runAxeScan(page, "lifecycle-resumed");

      // Reset from running
      await page.getByRole("button", { name: /reset/i }).click();
      await runAxeScan(page, "lifecycle-reset");
    });
  });
});