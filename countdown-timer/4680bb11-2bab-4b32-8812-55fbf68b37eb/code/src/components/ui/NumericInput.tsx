/**
 * NumericInput — src/components/ui/NumericInput.tsx
 *
 * A controlled numeric input field designed for time entry (hours, minutes,
 * seconds). Features:
 *
 * - inputMode="numeric" + pattern="[0-9]*" for mobile numeric keyboard
 * - Real-time stripping of non-numeric characters on every keystroke
 * - Select-all on focus for quick replacement
 * - onBlur clamping to [min, max] range
 * - Optional zero-padding on blur (e.g. "5" → "05")
 * - Support for aria-label and aria-describedby
 * - Disabled state with visual dimming
 * - Full TypeScript strict typing
 */

"use client";

import React, { forwardRef, useCallback, useId } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NumericInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "inputMode" | "pattern" | "onChange" | "value"
  > {
  /** Current string value (controlled) */
  value: string;
  /** Called whenever the value changes (after non-numeric stripping) */
  onChange: (value: string) => void;
  /** Minimum allowed value (clamped on blur) */
  min?: number;
  /** Maximum allowed value (clamped on blur) */
  max?: number;
  /** Pad value with leading zeros on blur (e.g. 5 → "05" when padLength=2) */
  padLength?: number;
  /** Visible label text above the input */
  label?: string;
  /** Accessible label override (falls back to `label` if not provided) */
  "aria-label"?: string;
  /** ID of an element that describes this input */
  "aria-describedby"?: string;
  /** Extra class names for the outer wrapper */
  wrapperClassName?: string;
  /** Extra class names for the input element */
  inputClassName?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip any character that is not a decimal digit */
function stripNonNumeric(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

/** Clamp a numeric string to [min, max]; return empty string if raw is empty */
function clampValue(raw: string, min: number, max: number): string {
  if (raw === "") return "";
  const n = parseInt(raw, 10);
  if (isNaN(n)) return String(min);
  return String(Math.min(max, Math.max(min, n)));
}

/** Left-pad a string to padLength with "0" characters */
function padValue(value: string, padLength: number): string {
  if (value === "" || padLength <= 0) return value;
  return value.padStart(padLength, "0");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      value,
      onChange,
      min = 0,
      max = 99,
      padLength,
      label,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedby,
      disabled = false,
      wrapperClassName = "",
      inputClassName = "",
      id: idProp,
      ...rest
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------

    /**
     * onChange — strip non-numeric chars in real time.
     * We do NOT clamp here so the user can type freely mid-edit
     * (e.g., typing "6" before finishing "60" shouldn't clamp to "9").
     */
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const stripped = stripNonNumeric(e.target.value);
        onChange(stripped);
      },
      [onChange]
    );

    /**
     * onFocus — select all text so the user can immediately type a new value
     * without having to clear the field first.
     */
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // requestAnimationFrame ensures the selection fires after React's
      // synthetic event handling and browser autofill have settled.
      const target = e.currentTarget;
      requestAnimationFrame(() => {
        target.select();
      });
    }, []);

    /**
     * onBlur — clamp the value to [min, max] and optionally zero-pad.
     * If the field is empty, clamp to min.
     */
    const handleBlur = useCallback(() => {
      const rawTrimmed = value.trim();

      // If empty, default to min
      const clamped = clampValue(rawTrimmed === "" ? String(min) : rawTrimmed, min, max);

      const final =
        padLength != null && padLength > 0 ? padValue(clamped, padLength) : clamped;

      if (final !== value) {
        onChange(final);
      }
    }, [value, min, max, padLength, onChange]);

    /**
     * onKeyDown — handle Up/Down arrow key nudging.
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const current = parseInt(value || "0", 10);
          const delta = e.key === "ArrowUp" ? 1 : -1;
          const next = Math.min(max, Math.max(min, current + delta));
          const nextStr =
            padLength != null && padLength > 0
              ? padValue(String(next), padLength)
              : String(next);
          onChange(nextStr);
        }
      },
      [value, min, max, padLength, onChange]
    );

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    const effectiveAriaLabel = ariaLabel ?? label;

    return (
      <div className={`flex flex-col items-center gap-1 ${wrapperClassName}`}>
        {label != null && label !== "" && (
          <label
            htmlFor={inputId}
            className={[
              "text-xs font-semibold uppercase tracking-widest",
              disabled ? "text-slate-600" : "text-slate-400",
            ].join(" ")}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          aria-label={effectiveAriaLabel}
          aria-describedby={ariaDescribedby}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={parseInt(value || "0", 10)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={[
            // Layout & sizing
            "w-16 h-14 text-center",
            // Typography — monospaced for consistent digit widths
            "font-mono text-2xl font-bold tabular-nums",
            // Colors
            "text-white",
            // Background & border
            "bg-white/5 border border-white/10 rounded-xl",
            // Transitions
            "transition-all duration-150 ease-in-out",
            // Focus ring
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
            "focus:bg-white/10 focus:border-indigo-500/50",
            // Hover (when not disabled)
            "hover:bg-white/8 hover:border-white/20",
            // Disabled
            disabled
              ? "opacity-40 cursor-not-allowed bg-white/2"
              : "cursor-text",
            // Spin buttons hidden (not applicable for text type, but defensive)
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            inputClassName,
          ].join(" ")}
          {...rest}
        />
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";

export default NumericInput;