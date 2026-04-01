/**
 * TimerDisplay — src/components/timer/TimerDisplay.tsx
 *
 * Large HH:MM:SS countdown display with full accessibility support.
 *
 * Accessibility:
 * - role="timer" + aria-live="polite" + aria-atomic="true" on the visual display
 * - 15-second throttled announcements to avoid screen-reader spam
 * - A visually-hidden aria-live="assertive" region for immediate state
 *   transition announcements (start, pause, resume, complete, reset)
 *
 * Visual:
 * - Monospaced / tabular-nums font at minimum 72px (responsive up to 9rem)
 * - Color changes per timer state via data-state attribute + Tailwind style map
 * - Pulse animation on completion
 * - Separator colons that fade-blink during running state
 */

"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import { TimerStatus } from "@/types/timer";
import { formatTime } from "@/lib/time-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How often (ms) the polite aria-live region is updated during normal ticking */
const ANNOUNCEMENT_THROTTLE_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimerDisplayProps {
  /** Remaining milliseconds */
  remainingMs: number;
  /** Total duration milliseconds — used to derive urgency styling */
  totalMs: number;
  /** Current timer state */
  status: TimerStatus;
  /** Optional additional className for the outer wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Style maps (data-state driven)
// ---------------------------------------------------------------------------

/**
 * Maps TimerStatus → Tailwind text color classes for the main digit display.
 * Applied via CSS data attribute so tests can assert state easily.
 */
const STATUS_TEXT_COLOR: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "text-slate-200",
  [TimerStatus.RUNNING]: "text-emerald-300",
  [TimerStatus.PAUSED]: "text-amber-300",
  [TimerStatus.COMPLETED]: "text-rose-400",
};

/**
 * Maps TimerStatus → Tailwind drop-shadow / glow classes applied to the time digits.
 */
const STATUS_GLOW: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "drop-shadow-none",
  [TimerStatus.RUNNING]: "[filter:drop-shadow(0_0_12px_rgba(52,211,153,0.55))]",
  [TimerStatus.PAUSED]: "[filter:drop-shadow(0_0_10px_rgba(251,191,36,0.45))]",
  [TimerStatus.COMPLETED]: "[filter:drop-shadow(0_0_18px_rgba(251,113,133,0.70))]",
};

/**
 * Maps TimerStatus → human-readable state label for announcements.
 */
const STATUS_LABEL: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "Timer idle",
  [TimerStatus.RUNNING]: "Timer started",
  [TimerStatus.PAUSED]: "Timer paused",
  [TimerStatus.COMPLETED]: "Time is up",
};

// ---------------------------------------------------------------------------
// Helper: urgency threshold
// ---------------------------------------------------------------------------

/**
 * Returns true when the remaining time is in the "urgent" zone:
 * ≤ 10% of total duration remaining AND ≤ 60 seconds remaining.
 */
function isUrgent(remainingMs: number, totalMs: number): boolean {
  if (totalMs === 0) return false;
  const pct = remainingMs / totalMs;
  return pct <= 0.1 && remainingMs <= 60_000;
}

// ---------------------------------------------------------------------------
// Sub-component: VisuallyHidden
// ---------------------------------------------------------------------------

/**
 * Screen-reader-only container. Content is announced but not visually rendered.
 * Uses the classic sr-only technique (position absolute, 1×1 overflow hidden)
 * which is more reliable than `display:none` for AT compatibility.
 */
const VisuallyHidden: React.FC<{
  children: React.ReactNode;
  "aria-live"?: "polite" | "assertive" | "off";
  "aria-atomic"?: boolean;
  id?: string;
}> = ({ children, ...ariaProps }) => (
  <span
    className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
    style={{ clip: "rect(0,0,0,0)" }}
    {...ariaProps}
  >
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Sub-component: TimeSeparator
// ---------------------------------------------------------------------------

interface TimeSeparatorProps {
  isRunning: boolean;
}

/**
 * The ":" colon between time segments. Blinks gently during running state
 * using a CSS animation defined in globals.css (or inline keyframe fallback).
 */
const TimeSeparator = memo<TimeSeparatorProps>(function TimeSeparator({
  isRunning,
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "select-none mx-0.5 sm:mx-1 inline-block",
        "transition-opacity duration-300",
        isRunning ? "animate-[colon-blink_1s_ease-in-out_infinite]" : "opacity-100",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      :
    </span>
  );
});

// ---------------------------------------------------------------------------
// Sub-component: TimeSegment
// ---------------------------------------------------------------------------

interface TimeSegmentProps {
  value: number;
  label: string;
}

/**
 * Two-digit time segment (HH, MM, or SS).
 * Uses tabular-nums so digit-width doesn't cause layout shift.
 */
const TimeSegment = memo<TimeSegmentProps>(function TimeSegment({
  value,
  label,
}) {
  const display = String(value).padStart(2, "0");
  return (
    <span
      aria-label={`${value} ${label}`}
      className="inline-block tabular-nums"
      style={{ minWidth: "2ch" }}
    >
      {display}
    </span>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const TimerDisplay = memo<TimerDisplayProps>(function TimerDisplay({
  remainingMs,
  totalMs,
  status,
  className = "",
}) {
  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = formatTime(remainingMs);
  const urgent = isUrgent(remainingMs, totalMs);
  const isRunning = status === TimerStatus.RUNNING;
  const isCompleted = status === TimerStatus.COMPLETED;

  // -------------------------------------------------------------------------
  // Aria-live throttled announcement (polite, 15s interval)
  // -------------------------------------------------------------------------

  const [throttledAnnouncement, setThrottledAnnouncement] = useState<string>("");
  const lastAnnouncedAtRef = useRef<number>(0);
  const lastAnnouncedStatusRef = useRef<TimerStatus>(TimerStatus.IDLE);

  // Publish a new throttled announcement at most once per 15 seconds
  useEffect(() => {
    if (status !== TimerStatus.RUNNING) return;

    const now = Date.now();
    const elapsed = now - lastAnnouncedAtRef.current;
    if (elapsed >= ANNOUNCEMENT_THROTTLE_MS) {
      lastAnnouncedAtRef.current = now;
      setThrottledAnnouncement(formattedTime);
    }
  }, [formattedTime, status]);

  // -------------------------------------------------------------------------
  // Immediate assertive announcement on status transitions
  // -------------------------------------------------------------------------

  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>("");
  const prevStatusRef = useRef<TimerStatus>(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === status) return;
    prevStatusRef.current = status;

    let msg = STATUS_LABEL[status];

    // Enrich messages with current time where useful
    if (status === TimerStatus.PAUSED || status === TimerStatus.RUNNING) {
      msg = `${STATUS_LABEL[status]}. ${formattedTime} remaining.`;
    } else if (status === TimerStatus.COMPLETED) {
      msg = "Time is up! The countdown has finished.";
    } else if (status === TimerStatus.IDLE) {
      msg = "Timer reset.";
    }

    setAssertiveAnnouncement(msg);
    // Clear after a short delay so a repeated transition can re-trigger
    const id = window.setTimeout(() => setAssertiveAnnouncement(""), 1000);
    return () => window.clearTimeout(id);
  }, [status, formattedTime]);

  // -------------------------------------------------------------------------
  // Reset throttle clock when timer transitions away from running
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (status !== TimerStatus.RUNNING) {
      lastAnnouncedAtRef.current = 0;
    }
  }, [status]);

  // -------------------------------------------------------------------------
  // Style composition
  // -------------------------------------------------------------------------

  const textColorClass = STATUS_TEXT_COLOR[status];
  const glowClass = STATUS_GLOW[status];

  const urgentClass =
    urgent && status === TimerStatus.RUNNING
      ? "animate-[urgent-pulse_0.8s_ease-in-out_infinite]"
      : "";

  const completedClass =
    isCompleted ? "animate-[completion-pulse_0.6s_ease-in-out_3]" : "";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      {/*
       * Visually-hidden assertive region — fires immediately on state change.
       * Separate from the polite timer region to avoid clobbering ongoing
       * tick announcements.
       */}
      <VisuallyHidden
        aria-live="assertive"
        aria-atomic={true}
        id="timer-state-announcer"
      >
        {assertiveAnnouncement}
      </VisuallyHidden>

      {/*
       * Primary timer display.
       *
       * role="timer" — semantic landmark for countdown/stopwatch widgets.
       * aria-live="polite" — announces updates when the user is idle.
       * aria-atomic="true" — the full time string is read as one unit.
       * aria-label — provides a complete description for AT users.
       *
       * The throttled announcement text is injected into a visually-hidden
       * sibling so screen readers don't interrupt on every second, but the
       * visible digits always reflect real-time values.
       */}
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Countdown timer. ${formattedTime} remaining. Status: ${status}.`}
        data-state={status}
        data-urgent={urgent ? "true" : "false"}
        className="relative flex flex-col items-center"
      >
        {/* 
         * The actual digit display.
         * font-timer maps to JetBrains Mono (tabular nums monospaced).
         * Minimum 72px via text-[4.5rem], responsive up to text-[9rem].
         */}
        <div
          className={[
            "font-timer font-bold tracking-tight select-none",
            "text-[4.5rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[8rem] xl:text-[9rem]",
            "leading-none",
            "transition-colors duration-500",
            textColorClass,
            glowClass,
            urgentClass,
            completedClass,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          {/* Hours segment */}
          <TimeSegment value={hours} label="hours" />
          <TimeSeparator isRunning={isRunning} />
          {/* Minutes segment */}
          <TimeSegment value={minutes} label="minutes" />
          <TimeSeparator isRunning={isRunning} />
          {/* Seconds segment */}
          <TimeSegment value={seconds} label="seconds" />
        </div>

        {/*
         * Throttled polite live region — hidden from view but read by screen
         * readers every ~15 seconds during a running countdown.
         */}
        <VisuallyHidden aria-live="polite" aria-atomic={true}>
          {throttledAnnouncement}
        </VisuallyHidden>

        {/* Status sub-label */}
        <StatusBadge status={status} urgent={urgent} />
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sub-component: StatusBadge
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: TimerStatus;
  urgent: boolean;
}

const STATUS_BADGE_STYLES: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "text-slate-500 border-slate-700",
  [TimerStatus.RUNNING]: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
  [TimerStatus.PAUSED]: "text-amber-400 border-amber-800 bg-amber-950/40",
  [TimerStatus.COMPLETED]: "text-rose-400 border-rose-800 bg-rose-950/40",
};

const STATUS_BADGE_DOTS: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "bg-slate-600",
  [TimerStatus.RUNNING]: "bg-emerald-400 animate-pulse",
  [TimerStatus.PAUSED]: "bg-amber-400",
  [TimerStatus.COMPLETED]: "bg-rose-400 animate-ping",
};

const STATUS_BADGE_LABELS: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "IDLE",
  [TimerStatus.RUNNING]: "RUNNING",
  [TimerStatus.PAUSED]: "PAUSED",
  [TimerStatus.COMPLETED]: "COMPLETE",
};

const StatusBadge = memo<StatusBadgeProps>(function StatusBadge({
  status,
  urgent,
}) {
  const baseStyle = STATUS_BADGE_STYLES[status];
  const dotStyle = STATUS_BADGE_DOTS[status];
  const label = urgent && status === TimerStatus.RUNNING ? "URGENT" : STATUS_BADGE_LABELS[status];

  return (
    <div
      aria-hidden="true"
      className={[
        "mt-3 inline-flex items-center gap-1.5 px-3 py-1",
        "rounded-full border text-[0.65rem] font-semibold tracking-widest uppercase",
        "transition-all duration-300",
        baseStyle,
        urgent && status === TimerStatus.RUNNING
          ? "border-rose-700 text-rose-400 bg-rose-950/60"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Live indicator dot */}
      <span
        className={[
          "inline-block w-1.5 h-1.5 rounded-full",
          dotStyle,
          urgent && status === TimerStatus.RUNNING ? "bg-rose-400 animate-ping" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {label}
    </div>
  );
});

export default TimerDisplay;