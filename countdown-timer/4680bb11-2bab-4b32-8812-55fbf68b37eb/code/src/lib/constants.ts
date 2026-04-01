/**
 * Application-wide constants for the Countdown Timer App.
 *
 * This module is imported by hooks, components, and utilities.
 * Nothing in here has side-effects — all exports are plain values.
 */

import type { TimerPreset, StatusStyleConfig } from "@/types/timer";
import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Duration Limits
// ---------------------------------------------------------------------------

/** Minimum configurable duration: 1 second */
export const MIN_DURATION_MS = 1_000;

/** Maximum configurable duration: 99 hours 59 minutes 59 seconds */
export const MAX_DURATION_MS = (99 * 3600 + 59 * 60 + 59) * 1_000;

/** Default duration on first load: 5 minutes */
export const DEFAULT_DURATION_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Engine Timing Constants
// ---------------------------------------------------------------------------

/** How often the engine's internal setInterval fires (ms) */
export const ENGINE_TICK_INTERVAL_MS = 100;

/**
 * Minimum real-world elapsed time between display updates (ms).
 * Throttles React re-renders to ~1 Hz.
 */
export const DISPLAY_UPDATE_INTERVAL_MS = 250;

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** localStorage key for persisted timer state */
export const STORAGE_KEY = "countdown-timer-state";

/** Storage schema version — increment on breaking changes */
export const STORAGE_VERSION = 1;

/**
 * Debounce delay for localStorage writes (ms).
 * Prevents excessive serialisation work during rapid ticks.
 */
export const STORAGE_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Preset Durations
// ---------------------------------------------------------------------------

export const TIMER_PRESETS: readonly TimerPreset[] = [
  {
    label: "1 min",
    durationMs: 60_000,
    description: "1 minute quick timer",
  },
  {
    label: "3 min",
    durationMs: 3 * 60_000,
    description: "3 minute timer",
  },
  {
    label: "5 min",
    durationMs: 5 * 60_000,
    description: "5 minute timer",
  },
  {
    label: "10 min",
    durationMs: 10 * 60_000,
    description: "10 minute timer",
  },
  {
    label: "25 min",
    durationMs: 25 * 60_000,
    description: "25 minute Pomodoro timer",
  },
  {
    label: "1 hr",
    durationMs: 60 * 60_000,
    description: "1 hour timer",
  },
] as const;

// ---------------------------------------------------------------------------
// Status Style Configurations
// ---------------------------------------------------------------------------

export const STATUS_STYLES: Record<TimerStatus, StatusStyleConfig> = {
  [TimerStatus.Idle]: {
    textClass: "text-slate-400",
    bgClass: "bg-slate-800/60",
    ringClass: "ring-slate-600",
    label: "Ready",
    icon: "⏱",
  },
  [TimerStatus.Running]: {
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-900/40",
    ringClass: "ring-emerald-500",
    label: "Running",
    icon: "▶",
  },
  [TimerStatus.Paused]: {
    textClass: "text-amber-400",
    bgClass: "bg-amber-900/40",
    ringClass: "ring-amber-500",
    label: "Paused",
    icon: "⏸",
  },
  [TimerStatus.Completed]: {
    textClass: "text-violet-400",
    bgClass: "bg-violet-900/40",
    ringClass: "ring-violet-500",
    label: "Complete",
    icon: "✅",
  },
};

// ---------------------------------------------------------------------------
// Document Title Templates
// ---------------------------------------------------------------------------

export const APP_NAME = "Countdown Timer";

export const TITLE_TEMPLATES = {
  running: (time: string) => `▶ ${time} — ${APP_NAME}`,
  paused: (time: string) => `⏸ ${time} — ${APP_NAME}`,
  completed: () => `✅ Done! — ${APP_NAME}`,
  idle: () => APP_NAME,
} as const;

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------

export const KEYBOARD_SHORTCUTS = [
  { key: "Space", description: "Start / Pause toggle" },
  { key: "P", description: "Pause" },
  { key: "R", description: "Reset" },
  { key: "Escape", description: "Reset" },
  { key: "?", description: "Toggle this help overlay" },
] as const;

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

/**
 * Interval (ms) between aria-live announcements for the running timer.
 * 15 seconds — avoids screen-reader spam while still providing updates.
 */
export const ARIA_ANNOUNCE_INTERVAL_MS = 15_000;

// ---------------------------------------------------------------------------
// Animation Durations (keep in sync with globals.css)
// ---------------------------------------------------------------------------

export const ANIMATION = {
  /** Duration of the completion pulse animation (ms) */
  completionPulseMs: 1_000,
  /** Duration of modal entrance/exit transitions (ms) */
  modalTransitionMs: 200,
  /** Duration of ring transition (ms) */
  ringTransitionMs: 500,
} as const;

// ---------------------------------------------------------------------------
// Wake Lock
// ---------------------------------------------------------------------------

/** How long to wait before re-acquiring a dropped wake lock (ms) */
export const WAKE_LOCK_RETRY_DELAY_MS = 2_000;

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

/** How long the completion notification stays visible (ms) */
export const NOTIFICATION_DURATION_MS = 8_000;

/** Title shown in the browser notification */
export const NOTIFICATION_TITLE = "⏰ Timer Complete!";

/** Body text shown in the browser notification */
export const NOTIFICATION_BODY = "Your countdown timer has reached zero.";