/**
 * CompletionAlert — src/components/timer/CompletionAlert.tsx
 *
 * Dismissible completion alert/modal displayed when the countdown reaches zero.
 *
 * Features:
 * - "Time's up!" heading with animated celebration icon
 * - Pulse animation on mount (coordinates with TimerDisplay pulse)
 * - aria-live="assertive" region for immediate screen reader announcement
 * - Focus management: Dismiss button receives focus on mount
 * - Escape key dismisses the alert
 * - Dismiss: hides alert, timer remains in completed state
 * - Restart: resets to original duration and immediately starts
 * - Backdrop click dismisses the alert
 * - Smooth enter/exit animations via CSS transitions
 * - Full WCAG 2.1 AA compliance (role="alertdialog", aria-modal, aria-labelledby)
 */

"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useId,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletionAlertProps {
  /** Whether the alert is currently visible */
  isVisible: boolean;
  /** The original duration in milliseconds (used for Restart) */
  originalDurationMs: number;
  /** Called when the user clicks Dismiss — hides alert, timer stays completed */
  onDismiss: () => void;
  /** Called when the user clicks Restart — resets to originalDurationMs and starts */
  onRestart: () => void;
  /** Optional additional className for the backdrop */
  className?: string;
}

// ---------------------------------------------------------------------------
// Celebration icon — pure SVG, no external dependencies
// ---------------------------------------------------------------------------

const CelebrationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {/* Outer glow circle */}
    <circle cx="32" cy="32" r="30" fill="url(#celebGrad)" opacity="0.15" />

    {/* Bell body */}
    <path
      d="M32 8C24.268 8 18 14.268 18 22v12l-4 6h36l-4-6V22C46 14.268 39.732 8 32 8Z"
      fill="url(#bellGrad)"
      stroke="url(#bellStroke)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    {/* Bell clapper */}
    <path
      d="M28 40c0 2.209 1.791 4 4 4s4-1.791 4-4"
      stroke="#fbbf24"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Sparkle top-left */}
    <g transform="translate(10, 10)">
      <line x1="4" y1="0" x2="4" y2="8" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="4" x2="8" y2="4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Sparkle top-right */}
    <g transform="translate(46, 8)">
      <line x1="3" y1="0" x2="3" y2="6" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="3" x2="6" y2="3" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Small dot sparkles */}
    <circle cx="14" cy="34" r="2" fill="#fbbf24" opacity="0.8" />
    <circle cx="50" cy="30" r="1.5" fill="#fde68a" opacity="0.9" />
    <circle cx="20" cy="52" r="1.5" fill="#f59e0b" opacity="0.7" />
    <circle cx="46" cy="50" r="2" fill="#fbbf24" opacity="0.8" />

    <defs>
      <radialGradient id="celebGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bellGrad" x1="18" y1="8" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="bellStroke" x1="18" y1="8" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

// ---------------------------------------------------------------------------
// Confetti particle — rendered as small colored squares / circles
// ---------------------------------------------------------------------------

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  animationDuration: number;
  animationDelay: number;
  shape: "square" | "circle" | "rect";
}

const CONFETTI_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#fbbf24",
  "#06b6d4",
];

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -(Math.random() * 20 + 5),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    animationDuration: Math.random() * 2 + 2,
    animationDelay: Math.random() * 1.5,
    shape: (["square", "circle", "rect"] as const)[Math.floor(Math.random() * 3)]!,
  }));
}

// ---------------------------------------------------------------------------
// CompletionAlert Component
// ---------------------------------------------------------------------------

export const CompletionAlert: React.FC<CompletionAlertProps> = ({
  isVisible,
  originalDurationMs: _originalDurationMs,
  onDismiss,
  onRestart,
  className = "",
}) => {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-desc`;

  // Refs for focus management
  const dismissBtnRef = useRef<HTMLButtonElement>(null);
  const restartBtnRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Animation state — controls CSS transition classes
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [confetti] = useState<ConfettiParticle[]>(() => generateConfetti(40));

  // Track previous visibility for animation sequencing
  const prevVisibleRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Mount / unmount animation sequencing
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isVisible && !prevVisibleRef.current) {
      // Entering: schedule mount-in animation on next frame
      setIsAnimatingOut(false);
      const raf = requestAnimationFrame(() => {
        setIsMounted(true);
      });
      prevVisibleRef.current = true;
      return () => cancelAnimationFrame(raf);
    }

    if (!isVisible && prevVisibleRef.current) {
      // Exiting: trigger animate-out, then unmount
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsAnimatingOut(false);
      }, 300);
      prevVisibleRef.current = false;
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // ---------------------------------------------------------------------------
  // Focus management — move focus to Dismiss button on open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isVisible && isMounted && !isAnimatingOut) {
      // Small delay to let the transition settle before stealing focus
      const timer = setTimeout(() => {
        dismissBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isMounted, isAnimatingOut]);

  // ---------------------------------------------------------------------------
  // Keyboard handling — Escape to dismiss, Tab focus trap
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
        return;
      }

      // Focus trap: cycle between dismiss and restart buttons
      if (e.key === "Tab") {
        const focusable = [dismissBtnRef.current, restartBtnRef.current].filter(
          Boolean
        ) as HTMLButtonElement[];

        if (focusable.length < 2) return;

        const firstEl = focusable[0]!;
        const lastEl = focusable[focusable.length - 1]!;
        const activeEl = document.activeElement;

        if (e.shiftKey) {
          // Shift+Tab: wrap from first to last
          if (activeEl === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          // Tab: wrap from last to first
          if (activeEl === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    },
    [isVisible, onDismiss]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  // ---------------------------------------------------------------------------
  // Backdrop click handler — dismiss on click outside dialog
  // ---------------------------------------------------------------------------

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) {
        onDismiss();
      }
    },
    [onDismiss]
  );

  // ---------------------------------------------------------------------------
  // Prevent body scroll while alert is open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  // ---------------------------------------------------------------------------
  // Render — nothing if never been visible
  // ---------------------------------------------------------------------------

  if (!isVisible && !isMounted && !isAnimatingOut) {
    return (
      // Keep the aria-live region in the DOM always for immediate announcement
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Derived animation classes
  // ---------------------------------------------------------------------------

  const backdropClasses = [
    // Base positioning
    "fixed inset-0 z-50 flex items-center justify-center p-4",
    // Backdrop blur + dark overlay
    "bg-black/60 backdrop-blur-sm",
    // Transition
    "transition-opacity duration-300 ease-out",
    // Animate in/out
    isMounted && !isAnimatingOut ? "opacity-100" : "opacity-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dialogClasses = [
    // Layout
    "relative w-full max-w-md mx-auto",
    // Appearance
    "bg-gradient-to-b from-gray-900 to-gray-950",
    "border border-amber-500/30",
    "rounded-2xl shadow-2xl shadow-amber-500/10",
    "overflow-hidden",
    // Transition
    "transition-all duration-300 ease-out",
    // Animate in: scale + translate up
    isMounted && !isAnimatingOut
      ? "opacity-100 scale-100 translate-y-0"
      : "opacity-0 scale-95 translate-y-4",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* ─── ARIA Live Announcement Region (always in DOM) ─── */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isVisible ? "Time's up! Your countdown has completed." : ""}
      </div>

      {/* ─── Backdrop ─── */}
      <div
        ref={backdropRef}
        className={backdropClasses}
        onClick={handleBackdropClick}
        // Prevent scrolling the backdrop
        onWheel={(e) => e.preventDefault()}
      >
        {/* ─── Confetti Layer ─── */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width:
                  particle.shape === "rect"
                    ? `${particle.size * 2}px`
                    : `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                borderRadius:
                  particle.shape === "circle" ? "50%" : "2px",
                transform: `rotate(${particle.rotation}deg)`,
                opacity: isMounted && !isAnimatingOut ? 1 : 0,
                animation:
                  isMounted && !isAnimatingOut
                    ? `confettiFall ${particle.animationDuration}s ease-in ${particle.animationDelay}s both`
                    : "none",
              }}
            />
          ))}
        </div>

        {/* ─── Dialog ─── */}
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className={dialogClasses}
        >
          {/* Top decorative gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
            aria-hidden="true"
          />

          {/* Ambient glow backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* ─── Content ─── */}
          <div className="relative px-8 pt-10 pb-8 flex flex-col items-center text-center gap-6">
            {/* Celebration icon with pulse animation */}
            <div
              className={[
                "relative flex items-center justify-center",
                "w-24 h-24",
                isMounted && !isAnimatingOut ? "animate-[celebrationPulse_0.6s_ease-out_both]" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden="true"
            >
              {/* Outer pulse ring */}
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              {/* Secondary ring */}
              <div className="absolute inset-2 rounded-full bg-amber-500/10 animate-pulse" />
              {/* Icon container */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/40 flex items-center justify-center">
                <CelebrationIcon className="w-10 h-10" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2
                id={titleId}
                className="text-3xl font-bold tracking-tight text-white"
              >
                Time&apos;s up!
              </h2>
              <p
                id={descId}
                className="text-gray-400 text-sm leading-relaxed"
              >
                Your countdown has completed. What would you like to do next?
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Dismiss Button — receives focus on mount */}
              <button
                ref={dismissBtnRef}
                type="button"
                onClick={onDismiss}
                className={[
                  // Layout
                  "flex-1 flex items-center justify-center gap-2",
                  "px-6 py-3 rounded-xl",
                  // Typography
                  "text-sm font-semibold tracking-wide",
                  // Colors — secondary/ghost style
                  "text-gray-300",
                  "bg-white/5 hover:bg-white/10",
                  "border border-white/10 hover:border-white/20",
                  // Transitions
                  "transition-all duration-150 ease-out",
                  // Focus ring
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                  // Active state
                  "active:scale-95",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <DismissIcon />
                Dismiss
              </button>

              {/* Restart Button */}
              <button
                ref={restartBtnRef}
                type="button"
                onClick={onRestart}
                className={[
                  // Layout
                  "flex-1 flex items-center justify-center gap-2",
                  "px-6 py-3 rounded-xl",
                  // Typography
                  "text-sm font-semibold tracking-wide",
                  // Colors — primary/amber style
                  "text-gray-900",
                  "bg-gradient-to-r from-amber-400 to-amber-500",
                  "hover:from-amber-300 hover:to-amber-400",
                  "border border-amber-400/50",
                  // Shadow
                  "shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
                  // Transitions
                  "transition-all duration-150 ease-out",
                  // Focus ring
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                  // Active state
                  "active:scale-95",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <RestartIcon />
                Restart
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-gray-600 text-xs" aria-hidden="true">
              Press{" "}
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 text-gray-400 font-mono text-xs">
                Esc
              </kbd>{" "}
              to dismiss
            </p>
          </div>
        </div>
      </div>

      {/* Confetti keyframe injection */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes celebrationPulse {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// ---------------------------------------------------------------------------
// Internal icon components — lightweight SVG, no external icon libraries
// ---------------------------------------------------------------------------

const DismissIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
      clipRule="evenodd"
    />
  </svg>
);

const RestartIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H5.498a.75.75 0 00-.75.75v3.219a.75.75 0 001.5 0v-1.867l.312.311a7 7 0 0011.700-3.144.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V3.953a.75.75 0 00-1.5 0v1.868l-.311-.312a7 7 0 00-11.700 3.144.75.75 0 001.449.39A5.5 5.5 0 0114.7 6.579l.311.311h-2.432a.75.75 0 000 1.5h3.433a.75.75 0 00.53-.219z"
      clipRule="evenodd"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default CompletionAlert;