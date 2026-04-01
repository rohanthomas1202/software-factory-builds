/**
 * Button — src/components/ui/Button.tsx
 *
 * Reusable button primitive with:
 * - Three variants: primary, secondary, danger
 * - Three sizes: sm, md, lg
 * - Disabled state with proper ARIA attributes
 * - Loading state with spinner
 * - Focus ring styling (keyboard-navigation friendly)
 * - Icon support (leading / trailing)
 * - Full TypeScript strict typing
 */

"use client";

import React, { forwardRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction */
  isLoading?: boolean;
  /** Leading icon element (rendered before label) */
  leadingIcon?: React.ReactNode;
  /** Trailing icon element (rendered after label) */
  trailingIcon?: React.ReactNode;
  /** Accessible label — required when button has no visible text (icon-only) */
  "aria-label"?: string;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-indigo-600 text-white shadow-sm",
    "hover:bg-indigo-500 active:bg-indigo-700",
    "disabled:bg-indigo-900 disabled:text-indigo-400",
    "focus-visible:ring-indigo-500",
  ].join(" "),

  secondary: [
    "bg-white/10 text-slate-200 border border-white/20 shadow-sm backdrop-blur-sm",
    "hover:bg-white/20 hover:border-white/30 active:bg-white/5",
    "disabled:bg-white/5 disabled:text-slate-500 disabled:border-white/10",
    "focus-visible:ring-slate-400",
  ].join(" "),

  danger: [
    "bg-rose-600 text-white shadow-sm",
    "hover:bg-rose-500 active:bg-rose-700",
    "disabled:bg-rose-900 disabled:text-rose-400",
    "focus-visible:ring-rose-500",
  ].join(" "),

  ghost: [
    "bg-transparent text-slate-300",
    "hover:bg-white/10 hover:text-white active:bg-white/5",
    "disabled:text-slate-600",
    "focus-visible:ring-slate-400",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner({ size }: { size: ButtonSize }): React.ReactElement {
  return (
    <svg
      className={`animate-spin ${iconSizeStyles[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leadingIcon,
      trailingIcon,
      children,
      disabled,
      className = "",
      "aria-label": ariaLabel,
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled === true || isLoading;

    const baseStyles = [
      // Layout
      "relative inline-flex items-center justify-center font-semibold",
      // Transition
      "transition-all duration-150 ease-in-out",
      // Focus ring — visible only for keyboard navigation
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
      // Disabled / loading
      "disabled:cursor-not-allowed disabled:opacity-60",
      // Prevent text selection on rapid clicks
      "select-none",
    ].join(" ");

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        className={[baseStyles, variantStyles[variant], sizeStyles[size], className].join(" ")}
        {...rest}
      >
        {/* Loading spinner overlays the content */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size} />
          </span>
        )}

        {/* Content wrapper — hidden (invisible) while loading to preserve button dimensions */}
        <span
          className={[
            "inline-flex items-center",
            sizeStyles[size].includes("gap-")
              ? sizeStyles[size].split(" ").find((c) => c.startsWith("gap-")) ?? "gap-2"
              : "gap-2",
            isLoading ? "invisible" : "visible",
          ].join(" ")}
        >
          {leadingIcon != null && (
            <span className={`flex-shrink-0 ${iconSizeStyles[size]}`} aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          {children}
          {trailingIcon != null && (
            <span className={`flex-shrink-0 ${iconSizeStyles[size]}`} aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;