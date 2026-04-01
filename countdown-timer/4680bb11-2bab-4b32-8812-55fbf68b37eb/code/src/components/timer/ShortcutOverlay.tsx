/**
 * ShortcutOverlay — src/components/timer/ShortcutOverlay.tsx
 *
 * Keyboard shortcut help overlay triggered by pressing '?'.
 *
 * Features:
 * - Modal with all keyboard shortcuts displayed in a readable table
 * - Dismissible via Escape key or clicking outside the modal
 * - aria-modal="true" + role="dialog" for accessibility
 * - Focus trap: Tab/Shift+Tab cycles only within the modal while open
 * - Focus returns to the previously focused element on close
 * - Smooth enter/exit animations via Tailwind transition classes
 * - Dark mode native (no light mode variant needed — app is dark-only)
 * - Fully keyboard navigable close button
 */

"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutEntry {
  /** The key or key combination to display (e.g. "Space", "R", "?") */
  key: string;
  /** Human-readable description of the action */
  description: string;
  /** Optional category label for grouping */
  category?: string;
}

export interface ShortcutOverlayProps {
  /** Whether the overlay is currently visible */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
  /** Optional custom shortcut list (defaults to the full app shortcut table) */
  shortcuts?: ShortcutEntry[];
}

// ---------------------------------------------------------------------------
// Default shortcuts table (Appendix A of PRD)
// ---------------------------------------------------------------------------

const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
  // Timer control
  {
    key: "Space",
    description: "Start timer (idle) / Pause timer (running) / Resume timer (paused)",
    category: "Timer Control",
  },
  {
    key: "P",
    description: "Pause the running timer",
    category: "Timer Control",
  },
  {
    key: "R",
    description: "Reset timer to initial duration",
    category: "Timer Control",
  },
  {
    key: "Escape",
    description: "Reset timer (same as R) / Close this overlay",
    category: "Timer Control",
  },
  // UI
  {
    key: "?",
    description: "Open / close this keyboard shortcut overlay",
    category: "Interface",
  },
  {
    key: "Tab",
    description: "Move focus to the next interactive element",
    category: "Navigation",
  },
  {
    key: "Shift + Tab",
    description: "Move focus to the previous interactive element",
    category: "Navigation",
  },
  {
    key: "Enter / Space",
    description: "Activate focused button",
    category: "Navigation",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns all focusable DOM elements within a container, in tab order.
 * Used by the focus-trap logic.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "details",
    "embed",
    "iframe",
    "input:not([disabled])",
    "object",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("hidden") && el.offsetParent !== null
  );
}

// ---------------------------------------------------------------------------
// KeyBadge sub-component
// ---------------------------------------------------------------------------

interface KeyBadgeProps {
  children: React.ReactNode;
}

function KeyBadge({ children }: KeyBadgeProps): React.JSX.Element {
  return (
    <kbd
      className={[
        "inline-flex items-center justify-center",
        "min-w-[2rem] px-2 py-0.5",
        "rounded-md border border-white/20",
        "bg-white/10 text-white",
        "font-mono text-xs font-semibold",
        "shadow-sm shadow-black/40",
        "select-none",
      ].join(" ")}
    >
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// ShortcutRow sub-component
// ---------------------------------------------------------------------------

interface ShortcutRowProps {
  entry: ShortcutEntry;
  isEven: boolean;
}

function ShortcutRow({ entry, isEven }: ShortcutRowProps): React.JSX.Element {
  // Handle compound keys like "Shift + Tab" by splitting and rendering
  // each segment as a separate KeyBadge with "+" text between them.
  const keySegments = entry.key.split("+").map((s) => s.trim());

  return (
    <tr
      className={[
        "transition-colors duration-150",
        isEven
          ? "bg-white/[0.02]"
          : "bg-transparent",
        "hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {/* Key column */}
      <td className="py-2.5 pl-4 pr-6 align-middle whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          {keySegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-white/40 text-xs font-medium select-none">
                  +
                </span>
              )}
              <KeyBadge>{segment}</KeyBadge>
            </React.Fragment>
          ))}
        </span>
      </td>

      {/* Description column */}
      <td className="py-2.5 pr-4 align-middle text-sm text-white/75 leading-snug">
        {entry.description}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// CategoryHeader sub-component
// ---------------------------------------------------------------------------

interface CategoryHeaderProps {
  label: string;
}

function CategoryHeader({ label }: CategoryHeaderProps): React.JSX.Element {
  return (
    <tr>
      <td
        colSpan={2}
        className="pt-4 pb-1 pl-4 pr-4"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80 select-none">
          {label}
        </span>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main ShortcutOverlay component
// ---------------------------------------------------------------------------

export function ShortcutOverlay({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: ShortcutOverlayProps): React.JSX.Element | null {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // -------------------------------------------------------------------------
  // Save + restore focus
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      // Record the currently focused element so we can restore it on close.
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      // Delay focus slightly to allow the enter animation to begin first,
      // and to ensure the dialog is in the DOM.
      const raf = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

      return () => cancelAnimationFrame(raf);
    } else {
      // Restore focus to whatever had it before the overlay opened.
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") {
        // Use a microtask so the modal has finished unmounting first.
        Promise.resolve().then(() => {
          try {
            prev.focus();
          } catch {
            // Element may have been removed from DOM — ignore.
          }
        });
      }
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Focus trap
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = getFocusableElements(dialog);
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        const activeEl = document.activeElement as HTMLElement;

        if (e.shiftKey) {
          // Shift+Tab: wrap from first to last
          if (activeEl === firstEl || !dialog.contains(activeEl)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          // Tab: wrap from last to first
          if (activeEl === lastEl || !dialog.contains(activeEl)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  // -------------------------------------------------------------------------
  // Backdrop click handler
  // -------------------------------------------------------------------------

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only dismiss if the click target is the backdrop itself,
      // not a child element of the dialog panel.
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // -------------------------------------------------------------------------
  // Prevent body scroll while overlay is open
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Group shortcuts by category
  // -------------------------------------------------------------------------

  const grouped = React.useMemo(() => {
    const map = new Map<string, ShortcutEntry[]>();
    for (const entry of shortcuts) {
      const cat = entry.category ?? "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(entry);
    }
    return map;
  }, [shortcuts]);

  // -------------------------------------------------------------------------
  // Render — use CSS visibility trick so the component stays in the DOM
  // for smooth animation, but is hidden from AT when closed via aria-hidden.
  // -------------------------------------------------------------------------

  return (
    <div
      ref={overlayRef}
      role="presentation"
      aria-hidden={!isOpen}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className={[
        // Layout: fixed full-screen backdrop
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "px-4 py-8",
        // Backdrop blur + dark overlay
        "bg-black/60 backdrop-blur-sm",
        // Smooth fade transition
        "transition-opacity duration-200 ease-out",
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      ].join(" ")}
      // Let screen readers know this backdrop wraps the modal
      data-testid="shortcut-overlay-backdrop"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Dialog panel                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-overlay-title"
        aria-describedby="shortcut-overlay-desc"
        tabIndex={-1}
        data-testid="shortcut-overlay-dialog"
        className={[
          // Sizing
          "relative w-full max-w-lg max-h-[85vh]",
          "flex flex-col",
          // Visual design — glassmorphism card
          "rounded-2xl",
          "bg-gradient-to-b from-gray-900/95 to-gray-950/98",
          "border border-white/10",
          "shadow-2xl shadow-black/60",
          "ring-1 ring-inset ring-white/5",
          // Entrance animation
          "transition-all duration-200 ease-out",
          isOpen
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-2 opacity-0",
          // Overflow for scrollable content
          "overflow-hidden",
        ].join(" ")}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          {/* Icon + title */}
          <div className="flex items-center gap-3">
            {/* Keyboard icon */}
            <div
              aria-hidden="true"
              className={[
                "flex items-center justify-center",
                "w-8 h-8 rounded-lg",
                "bg-indigo-500/20 border border-indigo-500/30",
                "text-indigo-400",
              ].join(" ")}
            >
              <KeyboardIcon />
            </div>

            <div>
              <h2
                id="shortcut-overlay-title"
                className="text-base font-semibold text-white leading-tight"
              >
                Keyboard Shortcuts
              </h2>
              <p
                id="shortcut-overlay-desc"
                className="text-xs text-white/45 mt-0.5 leading-none"
              >
                Press{" "}
                <KeyBadge>?</KeyBadge>{" "}
                or{" "}
                <KeyBadge>Esc</KeyBadge>{" "}
                to close
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts overlay"
            className={[
              "flex items-center justify-center",
              "w-8 h-8 rounded-lg",
              "text-white/50 hover:text-white",
              "bg-transparent hover:bg-white/10",
              "border border-transparent hover:border-white/15",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900",
              "active:scale-95",
            ].join(" ")}
            data-testid="shortcut-overlay-close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Scrollable content                                                */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={[
            "overflow-y-auto flex-1",
            // Custom scrollbar
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20",
          ].join(" ")}
          tabIndex={-1}
        >
          <table
            className="w-full border-collapse"
            role="table"
            aria-label="Keyboard shortcuts reference"
          >
            <thead className="sr-only">
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {Array.from(grouped.entries()).map(([category, entries]) => {
                // Running index for even/odd striping across the whole table
                let globalRowIndex = 0;
                Array.from(grouped.entries()).some(([cat, ents]) => {
                  if (cat === category) return true;
                  globalRowIndex += ents.length;
                  return false;
                });

                return (
                  <React.Fragment key={category}>
                    <CategoryHeader label={category} />
                    {entries.map((entry, idx) => (
                      <ShortcutRow
                        key={`${category}-${idx}`}
                        entry={entry}
                        isEven={(globalRowIndex + idx) % 2 === 0}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Bottom padding */}
          <div className="h-3" aria-hidden="true" />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-white/35 leading-snug">
            Shortcuts are disabled when an input field is focused.
          </p>
          <button
            type="button"
            onClick={onClose}
            className={[
              "flex-shrink-0 px-3 py-1.5",
              "rounded-lg text-xs font-medium",
              "text-indigo-300 bg-indigo-500/15 border border-indigo-500/30",
              "hover:bg-indigo-500/25 hover:border-indigo-500/50",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950",
              "active:scale-95",
            ].join(" ")}
            aria-label="Close keyboard shortcuts overlay"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon sub-components (inline SVG — zero dependency)
// ---------------------------------------------------------------------------

function KeyboardIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5A.75.75 0 012.75 14h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 012 10zm3.75-.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm2.25.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 018 10zm3.75-.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm2.25.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default ShortcutOverlay;