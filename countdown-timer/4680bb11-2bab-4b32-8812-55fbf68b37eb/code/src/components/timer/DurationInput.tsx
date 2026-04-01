/**
 * DurationInput — src/components/timer/DurationInput.tsx
 *
 * Three controlled NumericInput fields (HH / MM / SS) for setting the
 * countdown duration. Features:
 *
 * - Individual hour, minute, second inputs with proper ranges (H: 0-99, M: 0-59, S: 0-59)
 * - Validation helper message when all fields are zero
 * - Disabled state during running/paused timer states
 * - Change handlers that clear the active preset selection on manual edit
 * - Keyboard navigation: Tab through fields, auto-advance on max-length entry
 * - Full ARIA labeling for screen readers
 * - Colon separators with visual grouping
 */

"use client";

import React, { useCallback, useId, useRef } from "react";
import NumericInput from "@/components/ui/NumericInput";
import { TimerStatus } from "@/types/timer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DurationInputProps {
  /** Current hours value (0–99). */
  hours: number;
  /** Current minutes value (0–59). */
  minutes: number;
  /** Current seconds value (0–59). */
  seconds: number;
  /** Current timer status — used to derive disabled state. */
  status: TimerStatus;
  /** Called whenever the hours value changes. */
  onHoursChange: (value: number) => void;
  /** Called whenever the minutes value changes. */
  onMinutesChange: (value: number) => void;
  /** Called whenever the seconds value changes. */
  onSecondsChange: (value: number) => void;
  /** Optional extra className for the container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-component: ColonSeparator
// ---------------------------------------------------------------------------

const ColonSeparator: React.FC = () => (
  <span
    className="
      select-none
      text-2xl font-bold
      text-white/40
      mx-0.5
      tabular-nums
      leading-none
      self-center
      pb-0.5
    "
    aria-hidden="true"
  >
    :
  </span>
);

// ---------------------------------------------------------------------------
// Sub-component: FieldLabel
// ---------------------------------------------------------------------------

interface FieldLabelProps {
  htmlFor: string;
  children: React.ReactNode;
}

const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="
      block
      text-center
      text-[10px] font-semibold
      uppercase tracking-widest
      text-white/40
      mt-1.5
      select-none
    "
  >
    {children}
  </label>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DurationInput: React.FC<DurationInputProps> = ({
  hours,
  minutes,
  seconds,
  status,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  className = "",
}) => {
  // Unique IDs for label associations (SSR-safe)
  const uid = useId();
  const hoursId = `${uid}-hours`;
  const minutesId = `${uid}-minutes`;
  const secondsId = `${uid}-seconds`;

  // Refs for auto-advance focus management
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  // Timer is "locked" during Running or Paused states
  const isLocked =
    status === TimerStatus.Running || status === TimerStatus.Paused;

  // Validation: all fields are zero = no duration set
  const isDurationZero = hours === 0 && minutes === 0 && seconds === 0;

  // Show error only when idle/completed AND user has "committed" to zero
  // (we show it in idle state — not while timer is running since it's locked)
  const showValidationError =
    isDurationZero &&
    (status === TimerStatus.Idle || status === TimerStatus.Completed);

  // -------------------------------------------------------------------------
  // Change handlers with auto-advance focus logic
  // -------------------------------------------------------------------------

  const handleHoursChange = useCallback(
    (value: number) => {
      onHoursChange(value);
      // Auto-advance to minutes when user fills 2 digits and hours < 10
      // (handled by the two-digit threshold below)
    },
    [onHoursChange]
  );

  const handleMinutesChange = useCallback(
    (value: number) => {
      onMinutesChange(value);
    },
    [onMinutesChange]
  );

  const handleSecondsChange = useCallback(
    (value: number) => {
      onSecondsChange(value);
    },
    [onSecondsChange]
  );

  // Auto-advance: when a field reaches 2 typed digits, move focus forward
  const handleHoursAutoAdvance = useCallback(() => {
    minutesRef.current?.focus();
    minutesRef.current?.select();
  }, []);

  const handleMinutesAutoAdvance = useCallback(() => {
    secondsRef.current?.focus();
    secondsRef.current?.select();
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Fieldset groups the three inputs semantically */}
      <fieldset
        disabled={isLocked}
        className="border-0 p-0 m-0 min-w-0"
        aria-label="Set countdown duration"
      >
        <legend className="sr-only">
          Countdown duration — hours, minutes, seconds
        </legend>

        {/* Input row */}
        <div
          className="
            flex items-end gap-0
            px-4 py-3
            rounded-2xl
            bg-white/5
            border border-white/10
            backdrop-blur-sm
            transition-all duration-300
            focus-within:border-indigo-500/50
            focus-within:bg-white/8
            focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.3)]
            aria-disabled:opacity-50
          "
          role="group"
          aria-label="Duration input"
          aria-disabled={isLocked}
          data-testid="duration-input-group"
        >
          {/* Hours */}
          <div className="flex flex-col items-center">
            <NumericInput
              id={hoursId}
              value={hours}
              min={0}
              max={99}
              disabled={isLocked}
              aria-label="Hours"
              data-testid="input-hours"
              onValueChange={handleHoursChange}
              onAutoAdvance={handleHoursAutoAdvance}
              placeholder="00"
              className="w-16 text-center"
            />
            <FieldLabel htmlFor={hoursId}>HH</FieldLabel>
          </div>

          <ColonSeparator />

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <NumericInput
              ref={minutesRef}
              id={minutesId}
              value={minutes}
              min={0}
              max={59}
              disabled={isLocked}
              aria-label="Minutes"
              data-testid="input-minutes"
              onValueChange={handleMinutesChange}
              onAutoAdvance={handleMinutesAutoAdvance}
              placeholder="00"
              className="w-16 text-center"
            />
            <FieldLabel htmlFor={minutesId}>MM</FieldLabel>
          </div>

          <ColonSeparator />

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <NumericInput
              ref={secondsRef}
              id={secondsId}
              value={seconds}
              min={0}
              max={59}
              disabled={isLocked}
              aria-label="Seconds"
              data-testid="input-seconds"
              onValueChange={handleSecondsChange}
              placeholder="00"
              className="w-16 text-center"
            />
            <FieldLabel htmlFor={secondsId}>SS</FieldLabel>
          </div>
        </div>
      </fieldset>

      {/* Validation message */}
      <div
        className="h-5 flex items-center justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {showValidationError && (
          <p
            className="
              flex items-center gap-1.5
              text-xs font-medium
              text-amber-400/90
              animate-in
              fade-in
              duration-200
            "
            role="alert"
            data-testid="duration-validation-error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            Please set a duration greater than zero
          </p>
        )}
      </div>

      {/* Locked state indicator */}
      {isLocked && (
        <p
          className="
            text-xs text-white/30
            flex items-center gap-1
          "
          aria-live="polite"
          data-testid="duration-locked-message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          Reset timer to edit duration
        </p>
      )}
    </div>
  );
};

DurationInput.displayName = "DurationInput";

export default DurationInput;