/**
 * TimerControls — src/components/timer/TimerControls.tsx
 *
 * Start/Resume/Pause/Reset button group for the countdown timer.
 *
 * Button state logic (per PRD F10 state table):
 *
 *   State      │ Start/Resume │ Pause   │ Reset
 *   ───────────┼──────────────┼─────────┼──────────
 *   idle       │ enabled      │ disabled│ disabled
 *   running    │ disabled     │ enabled │ enabled
 *   paused     │ enabled(Res) │ disabled│ enabled
 *   completed  │ disabled     │ disabled│ enabled
 *
 * Label logic:
 *   - "Start"  when idle
 *   - "Resume" when paused
 *   - Button is hidden/disabled when running
 *
 * Keyboard shortcut hints are displayed below each button as secondary text.
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimerControlsProps {
  /** Current timer status from the state machine */
  status: TimerStatus;
  /** Whether the duration input has a valid (non-zero) duration set */
  hasDuration: boolean;
  /** Called when the Start or Resume button is clicked */
  onStart: () => void;
  /** Called when the Pause button is clicked */
  onPause: () => void;
  /** Called when the Reset button is clicked */
  onReset: () => void;
  /** Optional additional className for the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-component: ShortcutHint
// ---------------------------------------------------------------------------

interface ShortcutHintProps {
  label: string;
}

const ShortcutHint: React.FC<ShortcutHintProps> = ({ label }) => (
  <span
    className="
      mt-1.5
      block
      text-center text-[10px] font-mono
      text-white/30
      select-none
      leading-none
      tracking-wider
    "
    aria-hidden="true"
  >
    {label}
  </span>
);

// ---------------------------------------------------------------------------
// Sub-component: ControlButton
// ---------------------------------------------------------------------------

interface ControlButtonProps {
  /** Visible button label */
  label: string;
  /** ARIA label for screen readers (may differ from visual label) */
  ariaLabel: string;
  /** Keyboard shortcut hint text shown below the button */
  shortcutHint: string;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Visual/semantic variant */
  variant: "primary" | "secondary" | "danger" | "success";
  /** Click handler */
  onClick: () => void;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  /** Optional test id for E2E selectors */
  testId?: string;
}

const variantClasses: Record<ControlButtonProps["variant"], string> = {
  primary: `
    bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
    text-white
    shadow-lg shadow-indigo-900/40
    ring-indigo-400
    disabled:bg-indigo-900/40 disabled:text-indigo-400/40 disabled:shadow-none
  `,
  success: `
    bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
    text-white
    shadow-lg shadow-emerald-900/40
    ring-emerald-400
    disabled:bg-emerald-900/40 disabled:text-emerald-400/40 disabled:shadow-none
  `,
  secondary: `
    bg-white/10 hover:bg-white/15 active:bg-white/20
    text-white/80 hover:text-white
    shadow-md shadow-black/20
    ring-white/30
    disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none
  `,
  danger: `
    bg-rose-600/80 hover:bg-rose-500 active:bg-rose-700
    text-white
    shadow-lg shadow-rose-900/40
    ring-rose-400
    disabled:bg-rose-900/30 disabled:text-rose-400/30 disabled:shadow-none
  `,
};

const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  ariaLabel,
  shortcutHint,
  disabled,
  variant,
  onClick,
  icon,
  testId,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur(); // prevent sticky focus ring after mouse click
      if (!disabled) {
        onClick();
      }
    },
    [disabled, onClick]
  );

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        data-testid={testId}
        className={`
          relative
          inline-flex items-center justify-center gap-2
          min-w-[100px] px-5 py-3
          rounded-xl
          text-sm font-semibold tracking-wide
          border border-white/8
          outline-none
          transition-all duration-150 ease-out
          focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
          cursor-pointer
          disabled:cursor-not-allowed
          select-none
          ${variantClasses[variant]}
        `}
      >
        {icon && (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </button>
      <ShortcutHint label={shortcutHint} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external dependencies)
// ---------------------------------------------------------------------------

const PlayIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M3.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5Zm9 0a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5Z" />
  </svg>
);

const ResumeIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5Zm4 0a.5.5 0 0 1 .765.424l3 5.5a.5.5 0 0 1 0 .152l-3 5.5A.5.5 0 0 1 10 14.5V4a.5.5 0 0 1-.235-.076Z" />
    <path d="M2.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5Zm7 .424 2.536 4.576L9.5 13.076V3.924Z" />
  </svg>
);

const ResetIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z"
    />
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Derived button config helper
// ---------------------------------------------------------------------------

interface ButtonConfigs {
  startResume: {
    label: string;
    ariaLabel: string;
    disabled: boolean;
    variant: ControlButtonProps["variant"];
    icon: React.ReactNode;
    shortcutHint: string;
  };
  pause: {
    label: string;
    ariaLabel: string;
    disabled: boolean;
    variant: ControlButtonProps["variant"];
    icon: React.ReactNode;
    shortcutHint: string;
  };
  reset: {
    label: string;
    ariaLabel: string;
    disabled: boolean;
    variant: ControlButtonProps["variant"];
    icon: React.ReactNode;
    shortcutHint: string;
  };
}

function deriveButtonConfigs(
  status: TimerStatus,
  hasDuration: boolean
): ButtonConfigs {
  const isIdle = status === TimerStatus.IDLE;
  const isRunning = status === TimerStatus.RUNNING;
  const isPaused = status === TimerStatus.PAUSED;
  const isCompleted = status === TimerStatus.COMPLETED;

  // ── Start / Resume ───────────────────────────────────────────────────────
  const startResumeLabel = isPaused ? "Resume" : "Start";
  const startResumeAriaLabel = isPaused
    ? "Resume countdown timer (Space)"
    : "Start countdown timer (Space)";
  const startResumeDisabled =
    isRunning || isCompleted || (isIdle && !hasDuration);
  const startResumeVariant: ControlButtonProps["variant"] = isPaused
    ? "success"
    : "primary";
  const startResumeIcon = isPaused ? <ResumeIcon /> : <PlayIcon />;

  // ── Pause ────────────────────────────────────────────────────────────────
  const pauseDisabled = !isRunning;
  const pauseVariant: ControlButtonProps["variant"] = "secondary";

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetDisabled = isIdle;
  const resetVariant: ControlButtonProps["variant"] = isCompleted
    ? "primary"
    : "danger";

  return {
    startResume: {
      label: startResumeLabel,
      ariaLabel: startResumeAriaLabel,
      disabled: startResumeDisabled,
      variant: startResumeVariant,
      icon: startResumeIcon,
      shortcutHint: "Space",
    },
    pause: {
      label: "Pause",
      ariaLabel: "Pause countdown timer (P)",
      disabled: pauseDisabled,
      variant: pauseVariant,
      icon: <PauseIcon />,
      shortcutHint: "P",
    },
    reset: {
      label: "Reset",
      ariaLabel: "Reset countdown timer (R / Esc)",
      disabled: resetDisabled,
      variant: resetVariant,
      icon: <ResetIcon />,
      shortcutHint: "R / Esc",
    },
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TimerControls: React.FC<TimerControlsProps> = ({
  status,
  hasDuration,
  onStart,
  onPause,
  onReset,
  className = "",
}) => {
  const configs = useMemo(
    () => deriveButtonConfigs(status, hasDuration),
    [status, hasDuration]
  );

  const isCompleted = status === TimerStatus.COMPLETED;

  return (
    <div
      role="group"
      aria-label="Timer controls"
      className={`
        flex flex-col items-center gap-4
        ${className}
      `}
    >
      {/* ── Primary action row ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
        {/* Start / Resume */}
        <ControlButton
          label={configs.startResume.label}
          ariaLabel={configs.startResume.ariaLabel}
          shortcutHint={configs.startResume.shortcutHint}
          disabled={configs.startResume.disabled}
          variant={configs.startResume.variant}
          icon={configs.startResume.icon}
          onClick={onStart}
          testId="btn-start-resume"
        />

        {/* Pause */}
        <ControlButton
          label={configs.pause.label}
          ariaLabel={configs.pause.ariaLabel}
          shortcutHint={configs.pause.shortcutHint}
          disabled={configs.pause.disabled}
          variant={configs.pause.variant}
          icon={configs.pause.icon}
          onClick={onPause}
          testId="btn-pause"
        />

        {/* Reset */}
        <ControlButton
          label={configs.reset.label}
          ariaLabel={configs.reset.ariaLabel}
          shortcutHint={configs.reset.shortcutHint}
          disabled={configs.reset.disabled}
          variant={configs.reset.variant}
          icon={configs.reset.icon}
          onClick={onReset}
          testId="btn-reset"
        />
      </div>

      {/* ── Completion sub-message ─────────────────────────────────────── */}
      {isCompleted && (
        <p
          className="
            text-xs text-white/40 text-center
            animate-fade-in
          "
          aria-live="polite"
        >
          Press&nbsp;
          <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/60">
            R
          </kbd>
          &nbsp;or click Reset to start a new countdown
        </p>
      )}

      {/* ── Idle no-duration hint ──────────────────────────────────────── */}
      {status === TimerStatus.IDLE && !hasDuration && (
        <p
          className="
            text-xs text-amber-400/70 text-center
            animate-fade-in
          "
          role="status"
          aria-live="polite"
        >
          Set a duration above to begin
        </p>
      )}
    </div>
  );
};

export default TimerControls;