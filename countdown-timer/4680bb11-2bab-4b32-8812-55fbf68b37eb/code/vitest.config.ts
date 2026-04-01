/**
 * Vitest Configuration — vitest.config.ts
 *
 * Configuration for unit and integration tests:
 * - jsdom environment for browser API simulation
 * - Fake timers configured globally (can be overridden per-test)
 * - Path aliases matching tsconfig.json
 * - V8 coverage with thresholds
 * - Setup file for global mocks (localStorage, matchMedia, etc.)
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    // React JSX transform support
    react(),
    // Automatically resolve path aliases from tsconfig.json
    tsconfigPaths(),
  ],

  resolve: {
    alias: {
      // Explicit alias as fallback in case tsconfigPaths doesn't pick it up
      "@": path.resolve(__dirname, "./src"),
    },
  },

  test: {
    // -------------------------------------------------------------------------
    // Environment
    // -------------------------------------------------------------------------

    /**
     * Use jsdom to simulate a browser environment.
     * This gives us access to document, window, localStorage, etc.
     */
    environment: "jsdom",

    /**
     * Global setup file — runs before every test file.
     * Extends expect with jest-dom matchers and mocks browser APIs.
     */
    setupFiles: ["./src/test/setup.ts"],

    /**
     * Expose Vitest globals (describe, it, expect, vi, beforeEach, etc.)
     * without needing explicit imports in every test file.
     */
    globals: true,

    // -------------------------------------------------------------------------
    // Fake Timers
    // -------------------------------------------------------------------------

    /**
     * Configure fake timers globally.
     * Individual tests can override via vi.useFakeTimers() / vi.useRealTimers().
     *
     * We do NOT enable fake timers globally by default here because some
     * hooks use Date.now() in ways that need to be carefully controlled.
     * Tests that need fake timers should call vi.useFakeTimers() explicitly.
     *
     * However, we pre-configure the fake timer implementation defaults:
     */
    fakeTimers: {
      // Use modern fake timer implementation
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
        "performance",
      ],
      // Advance timers automatically in tests that use vi.useFakeTimers()
      shouldAdvanceTime: false,
      // Default "now" for Date when fake timers are active
      now: new Date("2025-01-15T12:00:00.000Z").getTime(),
    },

    // -------------------------------------------------------------------------
    // Test File Patterns
    // -------------------------------------------------------------------------

    /**
     * Include patterns — match all test files in:
     * - src/**  (colocated unit tests)
     * - tests/unit/**  (dedicated unit test directory)
     *
     * E2E tests in tests/e2e/ and e2e/ are handled by Playwright, not Vitest.
     */
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
    ],

    /**
     * Exclude patterns — avoid picking up Playwright E2E tests or build output.
     */
    exclude: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "tests/e2e/**",
      "e2e/**",
      "playwright.config.ts",
      "**/*.e2e.{ts,tsx}",
      "**/*.e2e.spec.{ts,tsx}",
    ],

    // -------------------------------------------------------------------------
    // Coverage
    // -------------------------------------------------------------------------

    coverage: {
      /**
       * Use V8 native coverage — faster than Istanbul and works without
       * instrumentation transforms.
       */
      provider: "v8",

      /**
       * Reporter formats:
       * - text: inline terminal summary
       * - html: detailed HTML report in coverage/
       * - lcov: for CI coverage upload (Codecov, Coveralls, etc.)
       * - json-summary: machine-readable summary for badges
       */
      reporter: ["text", "html", "lcov", "json-summary"],

      /**
       * Output directory for HTML and LCOV reports.
       */
      reportsDirectory: "./coverage",

      /**
       * Files to include in coverage analysis.
       * Only src/ files — exclude test files themselves, config, and types.
       */
      include: ["src/**/*.{ts,tsx}"],

      /**
       * Exclude from coverage:
       * - Test files and setup
       * - Type-only files
       * - Next.js generated files
       * - Constants/config files with trivial logic
       */
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/types/**",
        "src/app/layout.tsx",
        "src/app/manifest.ts",
        "src/app/globals.css",
        "node_modules/**",
        ".next/**",
      ],

      /**
       * Coverage thresholds — fail CI if coverage drops below these values.
       * Start conservative and raise as the test suite matures.
       */
      thresholds: {
        global: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70,
        },
        // Stricter thresholds for core business logic
        "src/lib/timer-engine.ts": {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        "src/lib/time-utils.ts": {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        "src/lib/storage.ts": {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },

      /**
       * Collect coverage even from files that are never imported by tests.
       * This ensures zero-coverage files appear in reports rather than
       * inflating the average by exclusion.
       */
      all: true,

      /**
       * Enable source map support for accurate line-level coverage.
       */
      // sourcemap: true, // enabled by default with v8
    },

    // -------------------------------------------------------------------------
    // Timeouts
    // -------------------------------------------------------------------------

    /**
     * Per-test timeout in milliseconds.
     * Unit tests should be fast — 10 seconds is generous.
     * Tests that genuinely need more time should use test.timeout() explicitly.
     */
    testTimeout: 10_000,

    /**
     * Hook timeout for beforeAll/afterAll/beforeEach/afterEach.
     */
    hookTimeout: 10_000,

    // -------------------------------------------------------------------------
    // Reporters
    // -------------------------------------------------------------------------

    /**
     * Reporter configuration:
     * - default: standard terminal output with dots and failures
     * - verbose: in CI or when DEBUG=1 is set, show each test name
     */
    reporter: process.env["CI"] === "true" ? "verbose" : "default",

    // -------------------------------------------------------------------------
    // Watch Mode
    // -------------------------------------------------------------------------

    /**
     * Watch options — only re-run tests affected by changed files.
     */
    watchExclude: ["node_modules/**", ".next/**", "coverage/**", "e2e/**"],

    // -------------------------------------------------------------------------
    // Snapshot Options
    // -------------------------------------------------------------------------

    /**
     * Update snapshots automatically when running in CI is disabled.
     * Developers must run vitest --update-snapshots explicitly.
     */
    // snapshotOptions: {},

    // -------------------------------------------------------------------------
    // Pool Configuration
    // -------------------------------------------------------------------------

    /**
     * Use threads pool (default) for test parallelism.
     * Each test file runs in an isolated worker thread.
     */
    pool: "threads",

    poolOptions: {
      threads: {
        // Reuse the same worker for multiple test files to improve performance.
        singleThread: false,
        // Isolate each test file in its own module scope.
        isolate: true,
      },
    },

    // -------------------------------------------------------------------------
    // TypeScript
    // -------------------------------------------------------------------------

    /**
     * Silence TypeScript errors inside test files that use vi.fn() without
     * explicit types. Production code still enforces strict TypeScript.
     */
    typecheck: {
      enabled: false, // Run tsc --noEmit separately in CI
    },

    // -------------------------------------------------------------------------
    // Miscellaneous
    // -------------------------------------------------------------------------

    /**
     * Silence console output during tests except for errors and warnings.
     * Individual tests can spy on console methods as needed.
     */
    // silent: process.env['CI'] === 'true',

    /**
     * Retry failed tests once — catches flaky tests caused by timing
     * edge cases in fake-timer interactions.
     */
    retry: process.env["CI"] === "true" ? 1 : 0,

    /**
     * Sequence settings — randomise test order to surface hidden test
     * dependencies (tests that only pass when run in a specific order).
     */
    sequence: {
      shuffle: false, // Enable with --sequence.shuffle flag when needed
    },
  },
});