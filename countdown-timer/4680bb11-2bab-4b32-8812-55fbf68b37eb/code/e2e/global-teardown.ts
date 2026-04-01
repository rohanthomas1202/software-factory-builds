/**
 * Playwright Global Teardown — e2e/global-teardown.ts
 *
 * Runs once after the entire Playwright test suite completes.
 *
 * Responsibilities:
 * 1. Log test suite summary information
 * 2. Clean up any temporary files created during testing
 * 3. Report total elapsed time
 */

import type { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

export default async function globalTeardown(
  _config: FullConfig
): Promise<void> {
  console.log("\n🧹 Playwright Global Teardown");

  // -------------------------------------------------------------------------
  // 1. Log elapsed time
  // -------------------------------------------------------------------------
  const startTime = Number(process.env.E2E_START_TIME ?? Date.now());
  const elapsed = Date.now() - startTime;
  const elapsedSeconds = (elapsed / 1000).toFixed(1);

  console.log(`   Total elapsed: ${elapsedSeconds}s`);

  // -------------------------------------------------------------------------
  // 2. Report artifact locations
  // -------------------------------------------------------------------------
  const reportPath = path.resolve(process.cwd(), "playwright-report");
  const resultsPath = path.resolve(process.cwd(), "test-results");

  if (fs.existsSync(reportPath)) {
    console.log(`   Report:        playwright-report/index.html`);
    console.log(`     → npx playwright show-report`);
  }

  if (fs.existsSync(resultsPath)) {
    const artifacts = fs.readdirSync(resultsPath);
    const hasArtifacts = artifacts.some(
      (f) => f !== ".gitkeep" && !f.startsWith(".")
    );

    if (hasArtifacts) {
      console.log(`   Artifacts:     test-results/`);
      console.log(
        `     → ${artifacts.filter((f) => !f.startsWith(".")).length} item(s) captured`
      );
    } else {
      console.log(`   Artifacts:     none (all tests passed)`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Clean up temp env vars
  // -------------------------------------------------------------------------
  delete process.env.E2E_BASE_URL;
  delete process.env.E2E_START_TIME;

  console.log(`   ✅ Teardown complete\n`);
}