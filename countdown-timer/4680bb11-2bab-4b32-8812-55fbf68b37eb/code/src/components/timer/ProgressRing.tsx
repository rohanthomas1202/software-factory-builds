/**
 * ProgressRing — src/components/timer/ProgressRing.tsx
 *
 * SVG circular progress ring that visualises countdown progress.
 *
 * Technique:
 * - stroke-dasharray = full circumference (2πr)
 * - stroke-dashoffset = circumference × (1 − progress) shrinks the visible arc
 *   as the timer counts down (0% offset = full ring, 100% offset = empty ring)
 *
 * Behaviour:
 * - Visible only when timer is running or paused (hidden when idle or completed)
 * - CSS transition (1s linear) for smooth per-second animation
 * - Respects prefers-reduced-motion: disables transition when user prefers reduced motion
 * - Freezes at current value when paused (no transition on pause)
 * - Resets to 0% (full ring) instantly on reset (no transition)
 * - Gradient stroke: indigo → violet when running, slate when paused
 * - Track ring always visible as a dim background circle
 *
 * Props:
 *   progress        — 0.0 (just started / full ring) to 1.0 (completed / empty ring)
 *   status          — current TimerStatus for conditional rendering and styling
 *   size            — diameter in px (default: 280)
 *   strokeWidth     — ring stroke width in px (default: 8)
 *   className       — additional wrapper class names
 *
 * Accessibility:
 *   - aria-hidden="true" — purely decorative; TimerDisplay carries semantic meaning
 */

"use client";

import React, { useId, useEffect, useRef, useState } from "react";
import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressRingProps {
  /** 0.0 = full ring (no progress consumed), 1.0 = empty ring (fully elapsed). */
  progress: number;
  /** Current timer status — controls visibility, colour, and transition behaviour. */
  status: TimerStatus;
  /** Outer diameter of the SVG in pixels. Defaults to 280. */
  size?: number;
  /** Stroke width of the progress arc in pixels. Defaults to 8. */
  strokeWidth?: number;
  /** Additional CSS class names applied to the outermost <div>. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SIZE = 280;
const DEFAULT_STROKE_WIDTH = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clamps a number between [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Reads the current prefers-reduced-motion media query value.
 * Safe to call during SSR (returns false — assume motion OK on server).
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgressRing({
  progress,
  status,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  className = "",
}: ProgressRingProps): React.ReactElement {
  // Unique IDs for SVG defs (linearGradient, filter) — avoids collisions
  // when multiple ProgressRing instances are mounted (e.g. in tests).
  const uid = useId();
  const gradientId = `pr-gradient-${uid}`;
  const glowFilterId = `pr-glow-${uid}`;

  // ─── Geometry ────────────────────────────────────────────────────────────
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // ─── Derived values ───────────────────────────────────────────────────────
  const safeProgress = clamp(progress, 0, 1);

  /**
   * dashoffset = 0         → full ring visible (0% elapsed, timer just started)
   * dashoffset = circumf.  → empty ring (100% elapsed, timer done)
   */
  const dashOffset = circumference * safeProgress;

  // ─── Motion preference ───────────────────────────────────────────────────
  // Track reduced-motion live so the component reacts to system setting changes
  // without requiring a page reload.
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    prefersReducedMotion()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);

    const handler = (e: MediaQueryListEvent): void => {
      setReduceMotion(e.matches);
    };

    // Use addEventListener when available (modern browsers), fall back to
    // deprecated addListener for older Safari.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      mq.addListener(handler);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        mq.removeListener(handler);
      };
    }
  }, []);

  // ─── Transition control ───────────────────────────────────────────────────
  /**
   * Transition rules:
   * - Idle      → no transition (ring is hidden anyway, but keep consistent)
   * - Running   → 1s linear (smooth per-second sweep), unless reduced-motion
   * - Paused    → no transition (freeze at current position)
   * - Completed → no transition (ring hidden)
   *
   * On reset (status → idle), the dashOffset snaps to 0 instantly.
   * We track the *previous* status in a ref to detect reset transitions
   * and suppress the transition for one frame.
   */
  const prevStatusRef = useRef<TimerStatus>(status);
  const [suppressTransition, setSuppressTransition] = useState(false);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const isReset =
      prev !== TimerStatus.Idle && status === TimerStatus.Idle;

    if (isReset) {
      // Instantly snap to initial position — no animation.
      setSuppressTransition(true);
      // Re-enable transition after the next paint so subsequent starts animate.
      const raf = requestAnimationFrame(() => {
        setSuppressTransition(false);
      });
      prevStatusRef.current = status;
      return () => cancelAnimationFrame(raf);
    }

    prevStatusRef.current = status;
    setSuppressTransition(false);
    return undefined;
  }, [status]);

  const shouldAnimate =
    !reduceMotion &&
    !suppressTransition &&
    status === TimerStatus.Running;

  const transitionStyle: React.CSSProperties = shouldAnimate
    ? { transition: "stroke-dashoffset 1s linear" }
    : { transition: "none" };

  // ─── Visibility ───────────────────────────────────────────────────────────
  /**
   * Per PRD: the progress ring is visible only during Running and Paused states.
   * During Idle and Completed it fades out so the timer display stands alone.
   *
   * We keep the element mounted even when invisible so that transitions from
   * hidden → running start from the correct dashoffset without a flash.
   */
  const isVisible =
    status === TimerStatus.Running || status === TimerStatus.Paused;

  // ─── Colour / gradient ────────────────────────────────────────────────────
  /**
   * Running → vibrant indigo-to-violet gradient + glow filter
   * Paused  → muted slate colour, no glow
   */
  const isRunning = status === TimerStatus.Running;
  const isPaused = status === TimerStatus.Paused;

  // Track stroke (background arc)
  const trackOpacity = isVisible ? 0.15 : 0;

  // Progress arc stroke — use gradient URL when running, flat colour when paused
  const progressStroke = isRunning
    ? `url(#${gradientId})`
    : isPaused
      ? "#64748b" // slate-500
      : "transparent";

  // Glow filter — only when running and motion is not reduced
  const filterAttr =
    isRunning && !reduceMotion ? `url(#${glowFilterId})` : undefined;

  // ─── Wrapper opacity ──────────────────────────────────────────────────────
  const wrapperStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transition: reduceMotion ? "none" : "opacity 0.4s ease",
    // Prevent the invisible ring from capturing pointer events
    pointerEvents: isVisible ? "auto" : "none",
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={wrapperStyle}
      aria-hidden="true"
      data-testid="progress-ring"
      data-status={status}
      data-progress={safeProgress.toFixed(4)}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
        focusable="false"
        overflow="visible"
      >
        {/* ── Defs: gradient + glow filter ── */}
        <defs>
          {/* Gradient for the running arc */}
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            {/* Indigo → violet — matches the app's primary colour palette */}
            <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
          </linearGradient>

          {/* Soft glow — only applied when running */}
          <filter
            id={glowFilterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              stdDeviation={strokeWidth * 0.6}
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Track ring (dim background) ── */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-white"
          opacity={trackOpacity}
          style={{
            transition: reduceMotion ? "none" : "opacity 0.4s ease",
          }}
          data-testid="progress-ring-track"
        />

        {/* ── Progress arc ── */}
        {/*
         * The arc is drawn starting from the top of the circle.
         * SVG arcs naturally start at 3 o'clock (0°), so we rotate
         * the entire element -90° to make 12 o'clock the start point.
         *
         * stroke-dasharray  = circumference  (full arc length)
         * stroke-dashoffset = dashOffset     (how much of the arc to hide)
         *
         * dashOffset = 0           → full ring  (timer fully loaded)
         * dashOffset = circumference → empty ring (all time elapsed)
         */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={progressStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Rotate -90° so the arc starts at 12 o'clock
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={filterAttr}
          style={transitionStyle}
          data-testid="progress-ring-arc"
        />

        {/* ── Paused indicator dots ── */}
        {/*
         * When paused, render two small dots at the 12 o'clock position
         * to hint at the paused state visually (subtle, not loud).
         * Omit when reduced-motion is preferred to avoid distraction.
         */}
        {isPaused && !reduceMotion && (
          <g
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity="0.7"
            data-testid="progress-ring-pause-indicator"
          >
            {/* Dot at the leading edge of the arc */}
            <circle
              cx={cx + radius}
              cy={cy}
              r={strokeWidth * 0.55}
              fill="#94a3b8" // slate-400
            />
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Named export alias (convenience)
// ---------------------------------------------------------------------------
export { ProgressRing };