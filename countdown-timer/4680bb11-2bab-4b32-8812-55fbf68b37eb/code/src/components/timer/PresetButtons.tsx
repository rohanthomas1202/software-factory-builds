/**
 * PresetButtons — src/components/timer/PresetButtons.tsx
 *
 * Renders the 6 default timer presets as clickable chip buttons.
 *
 * Behaviour:
 * - Clicking a preset populates the DurationInput fields immediately
 * - Active preset is visually highlighted (indigo ring + filled background)
 * - Disabled during Running and Paused states (grayed out, pointer-events none)
 * - Active highlight clears when user manually edits any duration field
 * - Keyboard accessible: full focus ring, Enter/Space to activate
 * - ARIA: role="group" container, aria-pressed on each button
 *
 * Presets are sourced from src/lib/constants.ts (TIMER_PRESETS array).
 */

"use client";

import React, { useCallback } from "react";
import { TimerStatus } from "@/types/timer";
import type { TimerPreset } from "@/types/timer";
import { TIMER_PRESETS } from "@/lib/constants";
import { msToComponents } from "@/lib/time-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresetButtonsProps {
  /** The id of the currently active preset, or null if no preset is selected. */
  activePresetId: string | null;
  /** Current timer status — used to derive disabled state. */
  status: TimerStatus;
  /**
   * Called when a preset is clicked.
   * Receives the full TimerPreset object so the parent can update
   * hours/minutes/seconds and track the active preset id.
   */
  onPresetSelect: (preset: TimerPreset) => void;
  /** Optional extra className for the outer container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helper: format preset label for display
// ---------------------------------------------------------------------------

/**
 * Returns a concise human-readable label for a preset duration.
 *
 * Examples:
 *   300_000   ms  →  "5 min"
 *   3_600_000 ms  →  "1 hr"
 *   5_400_000 ms  →  "1 hr 30 min"
 *   30_000    ms  →  "30 sec"
 */
function formatPresetLabel(durationMs: number): string {
  const { hours, minutes, seconds } = msToComponents(durationMs);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0 && hours === 0) {
    // Only show seconds if there are no hours (keeps label compact)
    parts.push(`${seconds} sec`);
  }

  return parts.join(" ") || "0 sec";
}

// ---------------------------------------------------------------------------
// Sub-component: Individual Preset Chip
// ---------------------------------------------------------------------------

interface PresetChipProps {
  preset: TimerPreset;
  isActive: boolean;
  isDisabled: boolean;
  onClick: (preset: TimerPreset) => void;
}

const PresetChip: React.FC<PresetChipProps> = React.memo(
  ({ preset, isActive, isDisabled, onClick }) => {
    const handleClick = useCallback(() => {
      if (!isDisabled) {
        onClick(preset);
      }
    }, [isDisabled, onClick, preset]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isDisabled) {
            onClick(preset);
          }
        }
      },
      [isDisabled, onClick, preset]
    );

    const label = preset.label ?? formatPresetLabel(preset.durationMs);

    return (
      <button
        type="button"
        role="button"
        aria-pressed={isActive}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-testid={`preset-${preset.id}`}
        data-preset-id={preset.id}
        className={`
          relative
          inline-flex items-center justify-center
          px-3 py-1.5
          rounded-full
          text-xs font-semibold
          whitespace-nowrap
          select-none
          transition-all duration-200 ease-out
          outline-none

          /* Focus ring — always visible on keyboard nav */
          focus-visible:ring-2
          focus-visible:ring-indigo-400
          focus-visible:ring-offset-2
          focus-visible:ring-offset-gray-950

          /* Active state — highlighted preset */
          ${
            isActive
              ? `
                bg-indigo-600
                text-white
                ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-950
                shadow-[0_0_12px_rgba(99,102,241,0.5)]
              `
              : `
                bg-white/8
                text-white/70
                border border-white/10
                hover:bg-white/15
                hover:text-white
                hover:border-white/20
              `
          }

          /* Disabled state */
          ${
            isDisabled
              ? `
                opacity-40
                cursor-not-allowed
                pointer-events-none
              `
              : "cursor-pointer"
          }
        `}
        title={isDisabled ? "Reset the timer to select a preset" : label}
      >
        {/* Active indicator dot */}
        {isActive && (
          <span
            className="
              absolute -top-0.5 -right-0.5
              w-2 h-2
              rounded-full
              bg-indigo-300
              ring-1 ring-gray-950
            "
            aria-hidden="true"
          />
        )}

        {label}
      </button>
    );
  }
);

PresetChip.displayName = "PresetChip";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PresetButtons: React.FC<PresetButtonsProps> = ({
  activePresetId,
  status,
  onPresetSelect,
  className = "",
}) => {
  // Presets are disabled while the timer is running or paused
  const isDisabled =
    status === TimerStatus.Running || status === TimerStatus.Paused;

  const handlePresetClick = useCallback(
    (preset: TimerPreset) => {
      onPresetSelect(preset);
    },
    [onPresetSelect]
  );

  if (TIMER_PRESETS.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      data-testid="preset-buttons-container"
    >
      {/* Section label */}
      <p
        className="
          text-[10px] font-semibold
          uppercase tracking-widest
          text-white/30
          select-none
        "
        id="presets-label"
      >
        Quick Presets
      </p>

      {/* Preset chips row */}
      <div
        role="group"
        aria-labelledby="presets-label"
        aria-label="Timer presets"
        className="
          flex flex-wrap justify-center
          gap-2
          max-w-xs sm:max-w-sm
        "
        data-testid="preset-chips"
      >
        {TIMER_PRESETS.map((preset) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            isActive={preset.id === activePresetId}
            isDisabled={isDisabled}
            onClick={handlePresetClick}
          />
        ))}
      </div>

      {/* Disabled hint (only shown when locked) */}
      {isDisabled && (
        <p
          className="
            text-[10px] text-white/20
            italic
            select-none
          "
          aria-live="polite"
          data-testid="presets-disabled-hint"
        >
          Presets unavailable while timer is active
        </p>
      )}
    </div>
  );
};

PresetButtons.displayName = "PresetButtons";

export default PresetButtons;