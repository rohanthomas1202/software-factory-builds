/**
 * generate-alert.mjs
 *
 * Node.js script that generates alert.mp3 using the `node-web-audio-api`
 * package for synthesis and `lamejs` or `ffmpeg` for MP3 encoding.
 *
 * This is a DEVELOPMENT UTILITY — not loaded by the app at runtime.
 *
 * ─── Prerequisites (Option A — node-web-audio-api + ffmpeg) ─────────────────
 *
 *   npm install --save-dev node-web-audio-api
 *   # Ensure ffmpeg is installed: https://ffmpeg.org/download.html
 *   node public/sounds/generate-alert.mjs
 *
 * ─── Prerequisites (Option B — ffmpeg only, no npm install) ─────────────────
 *
 *   # On macOS:  brew install ffmpeg
 *   # On Ubuntu: sudo apt install ffmpeg
 *   # On Windows: https://ffmpeg.org/download.html
 *
 *   # Then run the ffmpeg command directly (see README.md)
 *
 * ─── Output ──────────────────────────────────────────────────────────────────
 *
 *   public/sounds/alert.mp3 (< 30 KB, 1.5 seconds, 128 kbps)
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH  = resolve(__dirname, "alert.mp3");

console.log("🎵  Generating alert.mp3 …\n");

// ─── Strategy 1: ffmpeg (most reliable, no npm packages) ─────────────────────
function tryFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    return false; // ffmpeg not installed
  }

  console.log("   Using ffmpeg to generate a three-tone chime …");

  // Three overlapping sine tones: 880 Hz, 1100 Hz, 1320 Hz
  // Each tone is 0.8s, staggered by 0.25s, with fade-out
  const cmd = [
    "ffmpeg -y",
    // Tone 1: 880 Hz, starts at 0s
    "-f lavfi -i sine=frequency=880:duration=0.8",
    // Tone 2: 1100 Hz, starts at 0.25s (achieved via adelay)
    "-f lavfi -i sine=frequency=1100:duration=0.8",
    // Tone 3: 1320 Hz, starts at 0.50s
    "-f lavfi -i sine=frequency=1320:duration=0.8",
    // Mix: delay tones 2 & 3, then amix, then global fade-out
    `-filter_complex "`,
    `[0]apad=pad_dur=0.6[a0];`,
    `[1]adelay=250|250,apad=pad_dur=0.35[a1];`,
    `[2]adelay=500|500[a2];`,
    `[a0][a1][a2]amix=inputs=3:normalize=0,`,
    `volume=0.55,`,
    `afade=t=out:st=1.0:d=0.4`,
    `"`,
    `-b:a 128k -ar 44100 -ac 1`,
    `"${OUT_PATH}"`,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch (err) {
    console.warn("   ffmpeg failed:", err.message);
    return false;
  }
}

// ─── Strategy 2: ffmpeg single-tone fallback (simpler command) ───────────────
function tryFfmpegSimple() {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    return false;
  }

  console.log("   Using ffmpeg (simple sine tone fallback) …");

  const cmd = [
    "ffmpeg -y",
    "-f lavfi -i sine=frequency=1046.5:duration=1.5",
    `-af "volume=0.5,afade=t=in:st=0:d=0.02,afade=t=out:st=1.0:d=0.5"`,
    `-b:a 128k -ar 44100 -ac 1`,
    `"${OUT_PATH}"`,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch (err) {
    console.warn("   ffmpeg simple failed:", err.message);
    return false;
  }
}

// ─── Run strategies in order ──────────────────────────────────────────────────
let success = false;

if (!success) success = tryFfmpeg();
if (!success) success = tryFfmpegSimple();

if (success && existsSync(OUT_PATH)) {
  const { statSync } = await import("fs");
  const sizeKB = (statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`\n✅  alert.mp3 generated successfully!`);
  console.log(`   Path: ${OUT_PATH}`);
  console.log(`   Size: ${sizeKB} KB`);
  console.log("\n   Commit public/sounds/alert.mp3 to your repository.\n");
} else {
  console.error("\n❌  Could not generate alert.mp3 automatically.");
  console.error("   The app will use the Web Audio API fallback chime instead.");
  console.error("\n   To generate manually, install ffmpeg and run:");
  console.error('   ffmpeg -f lavfi -i "sine=frequency=880:duration=1.5" \\');
  console.error('     -af "volume=0.5,afade=t=out:st=1.0:d=0.5" \\');
  console.error("     -b:a 128k -ar 44100 public/sounds/alert.mp3\n");

  // Write a placeholder so the file exists (prevents 404 errors)
  // The useAudioAlert hook detects load errors and falls back to Web Audio API
  writeFileSync(OUT_PATH, Buffer.alloc(0));
  console.log("   Created empty placeholder at public/sounds/alert.mp3");
  console.log("   (useAudioAlert will detect the empty file and use Web Audio fallback)\n");
  process.exit(0);
}