/**
 * Badge — src/components/ui/Badge.tsx
 *
 * Compact state indicator chip used to display timer status, preset labels,
 * keyboard shortcut hints, and other contextual metadata.
 *
 * Features:
 * - Six semantic color variants: default, primary, success, warning, danger, info
 * - Three sizes: sm, md, lg
 * - Optional leading dot indicator (pulsing for "live" states)
 * - Optional leading icon
 * - Optional trailing dismiss button
 * - Polymorphic rendering (span by default, button when onClick provided)
 * - Full TypeScript strict typing
 */

"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  /** Content to display inside the badge */
  children: React.ReactNode;
  /** Visual color variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Show a leading status dot */
  dot?: boolean;
  /** Animate the dot with a pulse (implies dot=true) */
  pulseDot?: boolean;
  /** Leading icon element */
  icon?: React.ReactNode;
  /** Click handler — renders badge as a <button> for accessibility */
  onClick?: () => void;
  /** Dismiss/close handler — renders a trailing × button */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button */
  dismissLabel?: string;
  /** Extra class names */
  className?: string;
  /** Accessible label for the badge itself */
  "aria-label"?: string;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-700/60 text-slate-300 border border-slate-600/50",
  primary: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  danger:  "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  info:    "bg-sky-500/20 text-sky-300 border border-sky-500/30",
};

const dotVariantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  primary: "bg-indigo-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger:  "bg-rose-400",
  info:    "bg-sky-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-5 px-1.5 text-[10px] gap-1 rounded-md",
  md: "h-6 px-2 text-xs gap-1.5 rounded-lg",
  lg: "h-7 px-2.5 text-sm gap-2 rounded-lg",
};

const dotSizeStyles: Record<BadgeSize, string> = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
};

const iconSizeStyles: Record<BadgeSize, string> = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

// ---------------------------------------------------------------------------
// Sub-component: DotIndicator
// ---------------------------------------------------------------------------

interface DotIndicatorProps {
  variant: BadgeVariant;
  size: BadgeSize;
  pulse: boolean;
}

function DotIndicator({ variant, size, pulse }: DotIndicatorProps): React.ReactElement {
  return (
    <span className="relative flex-shrink-0 flex items-center justify-center">
      {pulse && (
        <span
          className={[
            "absolute inline-flex rounded-full opacity-75",
            dotSizeStyles[size],
            dotVariantStyles[variant],
            "animate-ping",
          ].join(" ")}
          aria-hidden="true"
        />
      )}
      <span
        className={[
          "relative inline-flex rounded-full flex-shrink-0",
          dotSizeStyles[size],
          dotVariantStyles[variant],
        ].join(" ")}
        aria-hidden="true"
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  pulseDot = false,
  icon,
  onClick,
  onDismiss,
  dismissLabel = "Dismiss",
  className = "",
  "aria-label": ariaLabel,
}: BadgeProps): React.ReactElement {
  const showDot = dot || pulseDot;

  const baseStyles = [
    "inline-flex items-center font-medium",
    "whitespace-nowrap select-none",
    variantStyles[variant],
    sizeStyles[size],
  ].join(" ");

  const interactiveStyles =
    onClick != null
      ? [
          "cursor-pointer",
          "transition-all duration-150 ease-in-out",
          "hover:opacity-80 active:opacity-60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
          variant === "primary"
            ? "focus-visible:ring-indigo-500"
            : variant === "success"
            ? "focus-visible:ring-emerald-500"
            : variant === "warning"
            ? "focus-visible:ring-amber-500"
            : variant === "danger"
            ? "focus-visible:ring-rose-500"
            : variant === "info"
            ? "focus-visible:ring-sky-500"
            : "focus-visible:ring-slate-400",
        ].join(" ")
      : "";

  const combinedClassName = [baseStyles, interactiveStyles, className].join(" ");

  const content = (
    <>
      {/* Leading dot */}
      {showDot && (
        <DotIndicator variant={variant} size={size} pulse={pulseDot} />
      )}

      {/* Leading icon */}
      {icon != null && (
        <span className={`flex-shrink-0 ${iconSizeStyles[size]}`} aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Label */}
      <span>{children}</span>

      {/* Trailing dismiss button */}
      {onDismiss != null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label={dismissLabel}
          className={[
            "flex-shrink-0 flex items-center justify-center",
            "rounded-sm opacity-60",
            "hover:opacity-100 transition-opacity duration-100",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-current",
            // Adjust negative margin to pull close button flush with padding
            size === "sm" ? "-mr-0.5 w-2.5 h-2.5" : size === "lg" ? "-mr-0.5 w-3.5 h-3.5" : "-mr-0.5 w-3 h-3",
          ].join(" ")}
        >
          <svg
            viewBox="0 0 8 8"
            fill="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            <path
              d="M1 1l6 6M7 1L1 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </>
  );

  if (onClick != null) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={combinedClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      role={ariaLabel != null ? "status" : undefined}
      aria-label={ariaLabel}
      className={combinedClassName}
    >
      {content}
    </span>
  );
}

Badge.displayName = "Badge";

export default Badge;