/**
 * Playwright Configuration — playwright.config.ts
 *
 * E2E test configuration covering:
 * - Chromium, Firefox, and WebKit (desktop + mobile viewports)
 * - Base URL pointing at the local Next.js dev server
 * - Screenshot and video capture on failure
 * - @axe-core/playwright accessibility scanning integration
 * - Reasonable timeouts for CI and local development
 */

import { defineConfig, devices } from "@playwright/test";
import path from "path";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/**
 * Whether the test run is happening inside a CI environment.
 * Used to adjust timeouts, retries, and reporter verbosity.
 */
const IS_CI = Boolean(process.env["CI"]);

/**
 * Base URL for the app under test.
 * - Locally: Next.js dev server at port 3000
 * - CI:       Can be overridden via BASE_URL environment variable
 *             (e.g., a Vercel preview deployment URL)
 */
const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:3000";

/**
 * Whether to use a running server vs. launch one via `webServer`.
 * Set USE_RUNNING_SERVER=1 to skip the built-in server launch
 * (useful when running against a staging URL).
 */
const USE_RUNNING_SERVER = Boolean(process.env["USE_RUNNING_SERVER"]);

// ---------------------------------------------------------------------------
// Artifacts directory
// ---------------------------------------------------------------------------

const ARTIFACTS_DIR = path.join(__dirname, "test-results");
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, "screenshots");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export default defineConfig({
  // -------------------------------------------------------------------------
  // Test discovery
  // -------------------------------------------------------------------------

  /**
   * Root directory for E2E tests.
   * Vitest handles tests/unit/ and src/**/*.test.ts separately.
   */
  testDir: "./e2e",

  /**
   * Also include the tests/e2e/ directory for project-level E2E tests.
   * Use a glob that covers both locations.
   */
  // testMatch: ['**/e2e/**/*.spec.ts', '**/tests/e2e/**/*.spec.ts'],

  /**
   * Match any .spec.ts or .test.ts file under testDir.
   */
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],

  /**
   * Exclude Vitest unit test files from Playwright discovery.
   */
  testIgnore: [
    "**/node_modules/**",
    "**/.next/**",
    "**/tests/unit/**",
    "**/src/**/*.test.ts",
    "**/src/**/*.spec.ts",
  ],

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Run tests in parallel across workers.
   * In CI, limit to 1 worker to avoid resource contention on small runners.
   * Locally, use 50% of CPU cores.
   */
  workers: IS_CI ? 2 : "50%",

  /**
   * Maximum number of failures before aborting the run.
   * Prevents long CI runs when there's a fundamental breakage.
   */
  maxFailures: IS_CI ? 10 : undefined,

  /**
   * Retry failing tests in CI to reduce false negatives from flakiness.
   * Locally, 0 retries for faster feedback.
   */
  retries: IS_CI ? 2 : 0,

  /**
   * Whether to run test files in parallel within the same project.
   * true = files run concurrently within each project (default)
   */
  fullyParallel: true,

  // -------------------------------------------------------------------------
  // Timeouts
  // -------------------------------------------------------------------------

  /**
   * Per-test timeout. E2E tests can be slow due to animations and network.
   * 30 seconds locally, 60 seconds in CI.
   */
  timeout: IS_CI ? 60_000 : 30_000,

  /**
   * Per-expect timeout — how long expect().toBeVisible() etc. will poll.
   */
  expect: {
    timeout: IS_CI ? 15_000 : 8_000,
  },

  // -------------------------------------------------------------------------
  // Artifacts
  // -------------------------------------------------------------------------

  /**
   * Output directory for test results, screenshots, videos, and traces.
   */
  outputDir: ARTIFACTS_DIR,

  // -------------------------------------------------------------------------
  // Reporters
  // -------------------------------------------------------------------------

  reporter: IS_CI
    ? [
        // Compact dot reporter for CI terminal output
        ["dot"],
        // JUnit XML — consumed by CI platforms (GitHub Actions, Jenkins, etc.)
        ["junit", { outputFile: path.join(ARTIFACTS_DIR, "junit-results.xml") }],
        // HTML report for manual inspection of failures
        [
          "html",
          {
            outputFolder: path.join(ARTIFACTS_DIR, "html-report"),
            open: "never",
          },
        ],
        // JSON for programmatic consumption
        [
          "json",
          {
            outputFile: path.join(ARTIFACTS_DIR, "test-results.json"),
          },
        ],
      ]
    : [
        // Human-friendly list reporter for local development
        ["list"],
        // Always generate HTML report locally for easy failure inspection
        [
          "html",
          {
            outputFolder: path.join(ARTIFACTS_DIR, "html-report"),
            open: "on-failure",
          },
        ],
      ],

  // -------------------------------------------------------------------------
  // Global shared settings (applied to all projects unless overridden)
  // -------------------------------------------------------------------------

  use: {
    /**
     * Base URL — all page.goto('/') calls are relative to this.
     */
    baseURL: BASE_URL,

    /**
     * Collect traces on first retry only.
     * Traces are viewable in the Playwright HTML report and at
     * https://trace.playwright.dev
     */
    trace: IS_CI ? "on-first-retry" : "retain-on-failure",

    /**
     * Screenshots:
     * - "only-on-failure": capture a screenshot when a test fails
     * - Screenshots are saved to test-results/screenshots/
     */
    screenshot: {
      mode: "only-on-failure",
      fullPage: true,
    },

    /**
     * Video recording:
     * - "retain-on-failure": record video but only keep it on failure
     */
    video: IS_CI ? "retain-on-failure" : "off",

    /**
     * Browser locale and timezone for deterministic date/time rendering.
     */
    locale: "en-US",
    timezoneId: "America/New_York",

    /**
     * Viewport size for desktop tests (overridden per project for mobile).
     */
    viewport: { width: 1280, height: 720 },

    /**
     * Reduced motion — ensures CSS animations complete predictably in tests.
     * Tests that specifically test animations can override this.
     */
    reducedMotion: "reduce",

    /**
     * Color scheme — test in dark mode (the app's default).
     * The a11y project overrides this to also test light mode.
     */
    colorScheme: "dark",

    /**
     * Ignore HTTPS errors when testing against staging/preview URLs
     * that may have self-signed certificates.
     */
    ignoreHTTPSErrors: true,

    /**
     * Action timeout — how long to wait for actions like click(), fill(), etc.
     */
    actionTimeout: IS_CI ? 15_000 : 8_000,

    /**
     * Navigation timeout — how long to wait for page.goto() to complete.
     */
    navigationTimeout: IS_CI ? 30_000 : 15_000,

    /**
     * Extra HTTP headers added to every request.
     * Useful for feature flags or bypassing authentication in staging.
     */
    extraHTTPHeaders: {
      "x-playwright-test": "1",
    },
  },

  // -------------------------------------------------------------------------
  // Projects — browser matrix
  // -------------------------------------------------------------------------

  projects: [
    // -----------------------------------------------------------------------
    // Setup project — runs global authentication/state setup once
    // -----------------------------------------------------------------------
    // No auth needed for this app, but keeping the pattern for future use.

    // -----------------------------------------------------------------------
    // Desktop Chromium
    // -----------------------------------------------------------------------
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        // Use a persistent browser context for localStorage persistence tests
        // storageState is per-test, not global, so no need for globalSetup auth
      },
      // Include all E2E tests except a11y-specific ones
      testIgnore: ["**/a11y/**"],
    },

    // -----------------------------------------------------------------------
    // Desktop Firefox
    // -----------------------------------------------------------------------
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 },
      },
      // Run only smoke tests on Firefox to keep CI times reasonable
      testMatch: IS_CI ? ["**/timer.spec.ts"] : ["**/*.spec.ts"],
      testIgnore: ["**/a11y/**"],
    },

    // -----------------------------------------------------------------------
    // Desktop WebKit (Safari)
    // -----------------------------------------------------------------------
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      },
      // Run only smoke tests on WebKit to keep CI times reasonable
      testMatch: IS_CI ? ["**/timer.spec.ts"] : ["**/*.spec.ts"],
      testIgnore: ["**/a11y/**"],
    },

    // -----------------------------------------------------------------------
    // Mobile Chrome (Pixel 5)
    // -----------------------------------------------------------------------
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        // Override reducedMotion for mobile — test at full fidelity
        reducedMotion: "no-preference",
      },
      testIgnore: ["**/a11y/**"],
      // Only run mobile-relevant tests on this project
      testMatch: IS_CI ? ["**/timer.spec.ts"] : ["**/*.spec.ts"],
    },

    // -----------------------------------------------------------------------
    // Mobile Safari (iPhone 13)
    // -----------------------------------------------------------------------
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
        reducedMotion: "no-preference",
      },
      testIgnore: ["**/a11y/**"],
      testMatch: IS_CI ? ["**/timer.spec.ts"] : ["**/*.spec.ts"],
    },

    // -----------------------------------------------------------------------
    // Accessibility project — uses @axe-core/playwright
    // -----------------------------------------------------------------------
    {
      name: "a11y",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        // Test accessibility in both color schemes
        colorScheme: "dark",
        // Accessibility tests must be able to see all elements — no reduced motion
        reducedMotion: "no-preference",
      },
      // Only run tests in the a11y directory for this project
      testMatch: ["**/a11y/**/*.spec.ts", "**/a11y/**/*.test.ts"],
    },

    // -----------------------------------------------------------------------
    // Accessibility Light Mode — second a11y pass in light scheme
    // -----------------------------------------------------------------------
    {
      name: "a11y-light",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        colorScheme: "light",
        reducedMotion: "no-preference",
      },
      testMatch: ["**/a11y/**/*.spec.ts", "**/a11y/**/*.test.ts"],
    },
  ],

  // -------------------------------------------------------------------------
  // Global setup / teardown
  // -------------------------------------------------------------------------

  /**
   * Global setup — runs once before all tests.
   * Verifies the dev server is reachable and creates artifact directories.
   */
  globalSetup: "./e2e/global-setup.ts",

  /**
   * Global teardown — runs once after all tests complete.
   * Logs summary information and cleans up temporary files.
   */
  globalTeardown: "./e2e/global-teardown.ts",

  // -------------------------------------------------------------------------
  // Web server — auto-start Next.js dev server for local runs
  // -------------------------------------------------------------------------

  ...(USE_RUNNING_SERVER
    ? {}
    : {
        webServer: {
          /**
           * Command to start the Next.js development server.
           *
           * For faster E2E runs on CI, consider using `next build && next start`
           * (the production server) and setting BASE_URL to the built server's URL.
           * We use `next dev` here for simplicity.
           */
          command: "npm run dev",

          /**
           * URL that Playwright will poll until it responds with a 2xx status.
           * This ensures tests don't start before the server is ready.
           */
          url: BASE_URL,

          /**
           * How long to wait for the server to start before failing.
           * Next.js dev server can be slow on first start (compilation).
           */
          timeout: 120_000,

          /**
           * Reuse an already-running dev server instead of starting a new one.
           * This makes local development iteration much faster — run
           * `npm run dev` in one terminal and `npm run test:e2e` in another.
           */
          reuseExistingServer: !IS_CI,

          /**
           * Pipe server stdout/stderr to the Playwright terminal output.
           * Useful for debugging server startup failures.
           */
          stdout: "pipe",
          stderr: "pipe",

          /**
           * Environment variables to inject into the web server process.
           * Can be used to enable test-specific features (e.g., mock APIs).
           */
          env: {
            NODE_ENV: "test",
            NEXT_PUBLIC_TEST_MODE: "1",
          },
        },
      }),

  // -------------------------------------------------------------------------
  // Screenshot directory customisation
  // -------------------------------------------------------------------------

  /**
   * Custom screenshot path function — organise screenshots by browser and test.
   * Playwright calls this when screenshot: { mode: 'only-on-failure' } captures.
   */
  // snapshotDir: SCREENSHOTS_DIR,
  // snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
});