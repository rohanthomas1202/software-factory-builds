/**
 * Playwright Global Setup — e2e/global-setup.ts
 *
 * Runs once before the entire Playwright test suite starts.
 *
 * Responsibilities:
 * 1. Verify the dev/preview server is reachable
 * 2. Log environment information useful for CI debugging
 * 3. Create shared test artifacts directory
 */

import { chromium, type FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const startTime = Date.now();

  // -------------------------------------------------------------------------
  // 1. Resolve the base URL
  // -------------------------------------------------------------------------
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";

  console.log("\n🧪 Playwright Global Setup");
  console.log(`   Base URL:    ${baseURL}`);
  console.log(`   CI:          ${Boolean(process.env.CI)}`);
  console.log(`   Node:        ${process.version}`);
  console.log(`   Platform:    ${process.platform}`);

  // -------------------------------------------------------------------------
  // 2. Create artifact directories
  // -------------------------------------------------------------------------
  const artifactDirs = [
    "playwright-report",
    "test-results",
    "test-results/screenshots",
    "test-results/videos",
    "test-results/traces",
  ];

  for (const dir of artifactDirs) {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   Created:     ${dir}/`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Verify server reachability
  // -------------------------------------------------------------------------
  /**
   * Playwright's webServer config handles waiting for the server to start,
   * but we do an additional check here to provide a clearer error message
   * if the server is unreachable for an unexpected reason.
   */
  console.log(`\n   Verifying server at ${baseURL}...`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    /**
     * Attempt navigation with a generous timeout.
     * The webServer config should have already ensured the server is up,
     * so this should complete quickly.
     */
    const response = await page.goto(baseURL, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });

    if (!response) {
      throw new Error(`No response from ${baseURL}`);
    }

    const status = response.status();

    if (status >= 400) {
      throw new Error(
        `Server at ${baseURL} returned HTTP ${status}. ` +
          `Expected 2xx or 3xx. Check that the Next.js server started correctly.`
      );
    }

    console.log(`   ✅ Server reachable (HTTP ${status})`);

    // -----------------------------------------------------------------------
    // 4. Capture baseline page title for smoke test
    // -----------------------------------------------------------------------
    const title = await page.title();
    console.log(`   Page title:  "${title}"`);

    // Save baseline metadata for use in tests via process.env
    process.env.E2E_BASE_URL = baseURL;
    process.env.E2E_START_TIME = String(startTime);

    await context.close();
  } catch (error) {
    console.error("\n❌ Global setup failed:");
    console.error(
      `   ${error instanceof Error ? error.message : String(error)}`
    );
    console.error(
      "\n   Hint: Ensure the Next.js server is running on " + baseURL
    );
    console.error(
      "   Run: npm run dev\n"
    );
    throw error;
  } finally {
    await browser.close();
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n   Setup complete in ${elapsed}ms\n`);
}