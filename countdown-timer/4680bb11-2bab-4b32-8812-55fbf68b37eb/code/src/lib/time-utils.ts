/**
 * Pure utility functions for time manipulation in the Countdown Timer App.
 *
 * All functions are stateless and side-effect-free — safe to use in any
 * context (server, client, worker, test). No imports from Next.js or
 * browser APIs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

// ---------------------------------------------------------------------------
// Decomposition
// ---------------------------------------------------------------------------

/**
 * Decomposes a millisecond value into hours, minutes, seconds, and
 * remaining milliseconds.
 *
 * @example
 * msToComponents(3_661_500) // { hours: 1, minutes: 1, seconds: 1, milliseconds: 500 }
 */
export function msToComponents(ms: number): TimeComponents {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const milliseconds = totalMs % 1_000;
  return { hours, minutes, seconds, milliseconds };
}

/**
 * Reconstructs a millisecond value from time components.
 *
 * @example
 * componentsToMs({ hours: 1, minutes: 1, seconds: 1, milliseconds: 500 }) // 3_661_500
 */
export function componentsToMs(components: Partial<TimeComponents>): number {
  const { hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = components;
  return (
    hours * 3_600_000 +
    minutes * 60_000 +
    seconds * 1_000 +
    milliseconds
  );
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a millisecond value as "HH:MM:SS" (always 3 segments) or
 * "MM:SS" when hours === 0.
 *
 * @param ms         - Duration in milliseconds
 * @param alwaysHours - Force HH:MM:SS even when hours === 0
 *
 * @example
 * formatTime(3_661_000)           // "01:01:01"
 * formatTime(61_000)              // "01:01"
 * formatTime(61_000, true)        // "00:01:01"
 */
export function formatTime(ms: number, alwaysHours = false): string {
  const { hours, minutes, seconds } = msToComponents(ms);

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0 || alwaysHours) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Formats a millisecond value as a compact human-readable string.
 * Used in document titles and notifications.
 *
 * @example
 * formatTimeCompact(3_661_000) // "1h 1m 1s"
 * formatTimeCompact(61_000)    // "1m 1s"
 * formatTimeCompact(5_000)     // "5s"
 */
export function formatTimeCompact(ms: number): string {
  const { hours, minutes, seconds } = msToComponents(ms);
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

/**
 * Formats a millisecond value as a verbose string for screen readers.
 *
 * @example
 * formatTimeVerbose(3_661_000) // "1 hour, 1 minute, 1 second"
 * formatTimeVerbose(61_000)    // "1 minute, 1 second"
 * formatTimeVerbose(5_000)     // "5 seconds"
 */
export function formatTimeVerbose(ms: number): string {
  const { hours, minutes, seconds } = msToComponents(ms);
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Validation and Clamping
// ---------------------------------------------------------------------------

/**
 * Clamps a duration to the given [min, max] range (inclusive).
 *
 * @example
 * clampDuration(0, 1_000, 3_600_000)         // 1_000
 * clampDuration(300_000, 1_000, 3_600_000)   // 300_000
 * clampDuration(99_999_999, 1_000, 3_600_000) // 3_600_000
 */
export function clampDuration(ms: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, ms));
}

/**
 * Returns true if a millisecond value is a valid, non-zero duration.
 */
export function isValidDuration(ms: number): boolean {
  return Number.isFinite(ms) && ms > 0;
}

/**
 * Parses a "HH:MM:SS" or "MM:SS" string to milliseconds.
 * Returns null if the string cannot be parsed.
 *
 * @example
 * parseTimeString("01:30:00") // 5_400_000
 * parseTimeString("01:30")    // 90_000
 * parseTimeString("invalid")  // null
 */
export function parseTimeString(value: string): number | null {
  const trimmed = value.trim();
  const parts = trimmed.split(":").map(Number);

  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (
      hours === undefined ||
      minutes === undefined ||
      seconds === undefined ||
      minutes >= 60 ||
      seconds >= 60
    ) {
      return null;
    }
    return componentsToMs({ hours, minutes, seconds });
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (
      minutes === undefined ||
      seconds === undefined ||
      seconds >= 60
    ) {
      return null;
    }
    return componentsToMs({ minutes, seconds });
  }

  return null;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * Computes a progress fraction (0.0 – 1.0) from elapsed and total durations.
 * Safe against division by zero.
 *
 * @example
 * computeProgress(30_000, 60_000) // 0.5
 * computeProgress(0, 0)           // 0
 */
export function computeProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}