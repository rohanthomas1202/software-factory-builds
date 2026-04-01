/**
 * localStorage persistence layer for the Countdown Timer App.
 *
 * Provides typed read/write/clear operations for the timer state,
 * with schema versioning, safe JSON parsing, and guards for environments
 * where localStorage is unavailable (SSR, private browsing with storage
 * disabled, sandboxed iframes).
 *
 * All public functions are safe to call unconditionally — they never throw.
 */

import { STORAGE_KEY, STORAGE_VERSION } from "@/lib/constants";
import type { PersistedTimerState, StorageSchema } from "@/types/timer";

// ---------------------------------------------------------------------------
// Availability Guard
// ---------------------------------------------------------------------------

/**
 * Returns true if localStorage is available and writable.
 * Catches SecurityError in sandboxed iframes / private browsing.
 */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__countdown_timer_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Schema Validation
// ---------------------------------------------------------------------------

/**
 * Performs a lightweight runtime validation of the parsed storage value.
 * Returns true only if the object has the required shape for hydration.
 */
function isValidSchema(raw: unknown): raw is StorageSchema {
  if (raw === null || typeof raw !== "object") return false;

  const obj = raw as Record<string, unknown>;

  // Schema version check
  if (typeof obj["version"] !== "number") return false;
  if (obj["version"] !== STORAGE_VERSION) return false;

  // Timer sub-object check
  if (typeof obj["timer"] !== "object" || obj["timer"] === null) return false;

  const timer = obj["timer"] as Record<string, unknown>;

  // durationMs is the only required field
  if (typeof timer["durationMs"] !== "number") return false;
  if (!Number.isFinite(timer["durationMs"])) return false;
  if (timer["durationMs"] <= 0) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads the persisted timer state from localStorage.
 *
 * @returns The persisted state if found and valid, otherwise null.
 */
export function loadTimerState(): PersistedTimerState | null {
  if (!isStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!isValidSchema(parsed)) {
      // Schema mismatch — clear stale data and return null
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.timer;
  } catch {
    // JSON.parse error or other unexpected failure
    return null;
  }
}

/**
 * Writes the current timer state to localStorage.
 *
 * Silently swallows errors (e.g. QuotaExceededError in private browsing).
 */
export function saveTimerState(state: PersistedTimerState): void {
  if (!isStorageAvailable()) return;

  try {
    const schema: StorageSchema = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      timer: state,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  } catch {
    // Storage quota exceeded or write error — fail silently
  }
}

/**
 * Removes the persisted timer state from localStorage.
 * Called on explicit user reset to prevent stale state restoration.
 */
export function clearTimerState(): void {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently
  }
}