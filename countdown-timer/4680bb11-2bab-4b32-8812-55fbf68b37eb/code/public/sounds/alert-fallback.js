/**
 * alert-fallback.js
 *
 * Standalone Web Audio API chime synthesiser — for development reference only.
 * This file is NOT loaded by the app at runtime; the equivalent synthesis
 * logic lives in src/hooks/useAudioAlert.ts.
 *
 * Paste this into any browser DevTools console to audition the fallback chime.
 * It plays an ascending three-note chime using pure sine waves.
 *
 * Usage:
 *   1. Open browser DevTools (F12)
 *   2. Copy and paste the entire function below
 *   3. Call: playChime()
 */

function playChime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    console.warn("Web Audio API not supported in this browser.");
    return;
  }

  const ctx = new AudioCtx();

  /**
   * Plays a single sine-wave tone.
   * @param {number} frequency  - Frequency in Hz
   * @param {number} startTime  - AudioContext time to start (seconds)
   * @param {number} duration   - Duration of the tone (seconds)
   * @param {number} peakGain   - Peak gain (0–1)
   */
  function playTone(frequency, startTime, duration, peakGain = 0.35) {
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Envelope: very fast attack, hold, gentle exponential release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);   // 20ms attack
    gainNode.gain.setValueAtTime(peakGain, startTime + duration * 0.4);  // hold
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // release

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }

  const now = ctx.currentTime;

  // Note 1: A5 — 880 Hz (0.00s, 0.55s)
  playTone(880,  now + 0.00, 0.55, 0.30);

  // Note 2: C#6 — 1108.7 Hz (0.25s, 0.55s)
  playTone(1108.73, now + 0.25, 0.55, 0.28);

  // Note 3: E6 — 1318.5 Hz (0.50s, 0.80s) — lingers longest
  playTone(1318.51, now + 0.50, 0.80, 0.25);

  // Close AudioContext after all tones finish
  setTimeout(() => {
    ctx.close().catch(() => {});
  }, 2000);

  console.log("🔔 Chime played! Frequencies: 880 Hz → 1108 Hz → 1318 Hz");
}

// Auto-play when pasted into console
playChime();