/**
 * Main Page — src/app/page.tsx
 *
 * The single 'use client' root for the Countdown Timer App.
 *
 * Responsibilities:
 * - Instantiates all hooks (useTimer, useTimerPersistence, useDocumentTitle,
 *   useKeyboardShortcuts, useAudioAlert, useNotification, useWakeLock)
 * - Composes the full component tree
 * - Implements responsive layout per PRD breakpoints
 * - Manages local UI state (shortcut overlay visibility)
 * - Wires completion side-effects (audio, notification, wake lock)
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";

import { useTimer } from "@/hooks/useTimer";
import { useTimerPersistence } from "@/hooks/useTimerPersistence";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAudioAlert } from "@/hooks/useAudioAlert";
import { useNotification } from "@/hooks/useNotification";
import { useWakeLock } from "@/hooks/useWakeLock";

import { DurationInput } from "@/components/timer/DurationInput";
import { PresetButtons } from "@/components/timer/PresetButtons";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { ProgressRing } from "@/components/timer/ProgressRing";
import { TimerControls } from "@/components/timer/TimerControls";
import { CompletionAlert } from "@/components/timer/CompletionAlert";
import { ShortcutOverlay } from "@/components/timer/ShortcutOverlay";

import { TimerStatus } from "@/types/timer";
import { Badge } from "@/components/ui/Badge";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  TimerStatus,
  {
    label: string;
    variant: "default" | "primary" | "success" | "warning" | "danger" | "info";
    dot: boolean;
    pulse: boolean;
  }
> = {
  [TimerStatus.Idle]: {
    label: "Ready",
    variant: "default",
    dot: true,
    pulse: false,
  },
  [TimerStatus.Running]: {
    label: "Running",
    variant: "success",
    dot: true,
    pulse: true,
  },
  [TimerStatus.Paused]: {
    label: "Paused",
    variant: "warning",
    dot: true,
    pulse: false,
  },
  [TimerStatus.Completed]: {
    label: "Complete",
    variant: "primary",
    dot: true,
    pulse: false,
  },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  // ── Core timer state machine ──────────────────────────────────────────────
  const timer = useTimer();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);

  // ── Persistence — hydrates timer state from localStorage on mount ─────────
  useTimerPersistence(timer);

  // ── Document title & favicon sync ─────────────────────────────────────────
  useDocumentTitle({
    remainingMs: timer.state.remainingMs,
    status: timer.state.status,
  });

  // ── Audio alert ───────────────────────────────────────────────────────────
  const audio = useAudioAlert();

  // ── Browser Notification ─────────────────────────────────────────────────
  const notification = useNotification();

  // ── Screen Wake Lock — active while timer is running ─────────────────────
  useWakeLock(timer.state.status === TimerStatus.Running);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const toggleShortcuts = useCallback(
    () => setShowShortcuts((prev) => !prev),
    []
  );

  useKeyboardShortcuts({
    onStartPause: useCallback(() => {
      if (timer.state.status === TimerStatus.Idle) {
        timer.start();
      } else if (timer.state.status === TimerStatus.Running) {
        timer.pause();
      } else if (timer.state.status === TimerStatus.Paused) {
        timer.resume();
      }
    }, [timer]),
    onPause: useCallback(() => {
      if (timer.state.status === TimerStatus.Running) {
        timer.pause();
      }
    }, [timer]),
    onReset: useCallback(() => {
      timer.reset();
      setCompletionDismissed(false);
    }, [timer]),
    onToggleShortcuts: toggleShortcuts,
    // Disable shortcuts when shortcut overlay is open (it handles its own Escape)
    disabled: false,
  });

  // ── Completion side-effects ───────────────────────────────────────────────
  useEffect(() => {
    if (timer.state.status === TimerStatus.Completed) {
      // Reset dismissal state so alert shows again
      setCompletionDismissed(false);
      // Play audio chime
      audio.play();
      // Fire browser notification (if permission granted)
      notification.playNotification({
        title: "⏰ Timer Complete!",
        body: "Your countdown has finished.",
        tag: "countdown-timer-complete",
      });
    }
  }, [timer.state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────────────────
  const { status, remainingMs, durationMs } = timer.state;

  const progress =
    durationMs > 0
      ? Math.max(0, Math.min(1, remainingMs / durationMs))
      : 1;

  const showCompletionAlert =
    status === TimerStatus.Completed && !completionDismissed;

  const isInputDisabled =
    status === TimerStatus.Running || status === TimerStatus.Paused;

  const badgeCfg = STATUS_BADGE[status];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDismissAlert = useCallback(() => {
    setCompletionDismissed(true);
  }, []);

  const handleRestartFromAlert = useCallback(() => {
    setCompletionDismissed(true);
    timer.reset();
    // Small delay so the reset settles before starting
    setTimeout(() => {
      timer.start();
    }, 50);
  }, [timer]);

  const handleStart = useCallback(() => {
    timer.start();
  }, [timer]);

  const handlePause = useCallback(() => {
    timer.pause();
  }, [timer]);

  const handleResume = useCallback(() => {
    timer.resume();
  }, [timer]);

  const handleReset = useCallback(() => {
    timer.reset();
    setCompletionDismissed(false);
  }, [timer]);

  const handleSetDuration = useCallback(
    (ms: number) => {
      timer.setDuration(ms);
    },
    [timer]
  );

  const handlePresetSelect = useCallback(
    (ms: number) => {
      timer.setDuration(ms);
    },
    [timer]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Full-page background ───────────────────────────────────────── */}
      <div
        className={[
          "min-h-screen w-full",
          "bg-gray-950",
          "bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950",
          "flex flex-col items-center justify-center",
          "p-4 sm:p-6 lg:p-8",
          "transition-colors duration-700",
          // Subtle tint shifts per state
          status === TimerStatus.Running
            ? "bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950"
            : status === TimerStatus.Paused
            ? "bg-gradient-to-br from-gray-950 via-amber-950/20 to-gray-950"
            : status === TimerStatus.Completed
            ? "bg-gradient-to-br from-gray-950 via-indigo-950/40 to-gray-950"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        // Expose timer status as a data attribute for E2E selectors
        data-timer-state={status}
      >
        {/* ── Ambient glow blobs (decorative) ─────────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div
            className={[
              "absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-10 blur-3xl",
              "transition-colors duration-1000",
              status === TimerStatus.Running
                ? "bg-emerald-500"
                : status === TimerStatus.Paused
                ? "bg-amber-500"
                : status === TimerStatus.Completed
                ? "bg-violet-500"
                : "bg-indigo-600",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <div
            className={[
              "absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-10 blur-3xl",
              "transition-colors duration-1000",
              status === TimerStatus.Running
                ? "bg-teal-500"
                : status === TimerStatus.Paused
                ? "bg-orange-500"
                : status === TimerStatus.Completed
                ? "bg-fuchsia-500"
                : "bg-purple-700",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>

        {/* ── App header ──────────────────────────────────────────────── */}
        <header className="relative z-10 mb-6 flex flex-col items-center gap-2 sm:mb-8">
          <div className="flex items-center gap-3">
            {/* App icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 2h6" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Countdown Timer
            </h1>
          </div>

          {/* Status badge */}
          <Badge
            variant={badgeCfg.variant}
            size="sm"
            dot={badgeCfg.dot}
            pulse={badgeCfg.pulse}
          >
            {badgeCfg.label}
          </Badge>
        </header>

        {/* ── Main card ───────────────────────────────────────────────── */}
        <main
          className={[
            "relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg",
            "rounded-2xl sm:rounded-3xl",
            "border border-white/[0.06]",
            "bg-white/[0.03] backdrop-blur-sm",
            "shadow-2xl shadow-black/50",
            "p-5 sm:p-7 lg:p-8",
            "flex flex-col gap-5 sm:gap-6",
            "transition-all duration-500",
            // Subtle card glow on active states
            status === TimerStatus.Running
              ? "shadow-emerald-900/30"
              : status === TimerStatus.Completed
              ? "shadow-indigo-900/40"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Countdown timer card"
        >
          {/* ── Duration Input ──────────────────────────────────────── */}
          <section aria-label="Set timer duration">
            <DurationInput
              durationMs={timer.state.durationMs}
              onChange={handleSetDuration}
              disabled={isInputDisabled}
            />
          </section>

          {/* ── Preset Buttons ──────────────────────────────────────── */}
          <section aria-label="Duration presets">
            <PresetButtons
              currentDurationMs={timer.state.durationMs}
              onSelect={handlePresetSelect}
              disabled={isInputDisabled}
            />
          </section>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />

          {/* ── Timer Display + Progress Ring ───────────────────────── */}
          <section
            aria-label="Timer display"
            className="flex flex-col items-center gap-5 sm:gap-6"
          >
            {/* Progress ring wraps the digital display */}
            <div className="relative flex items-center justify-center">
              <ProgressRing
                progress={progress}
                status={status}
                size={240}
                strokeWidth={6}
                className="sm:hidden"
              />
              <ProgressRing
                progress={progress}
                status={status}
                size={280}
                strokeWidth={7}
                className="hidden sm:block lg:hidden"
              />
              <ProgressRing
                progress={progress}
                status={status}
                size={300}
                strokeWidth={7}
                className="hidden lg:block"
              />

              {/* Digital display — centred over ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay
                  remainingMs={timer.state.remainingMs}
                  status={status}
                  durationMs={timer.state.durationMs}
                />
              </div>
            </div>
          </section>

          {/* ── Timer Controls ──────────────────────────────────────── */}
          <section aria-label="Timer controls">
            <TimerControls
              status={status}
              durationMs={timer.state.durationMs}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
            />
          </section>

          {/* ── Mute toggle + shortcut hint ─────────────────────────── */}
          <footer className="flex items-center justify-between pt-1">
            {/* Mute button */}
            <button
              type="button"
              onClick={audio.toggleMute}
              className={[
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                "text-xs font-medium",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                audio.isMuted
                  ? "text-gray-500 hover:text-gray-400 hover:bg-white/5"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5",
              ].join(" ")}
              aria-label={audio.isMuted ? "Unmute sound" : "Mute sound"}
              aria-pressed={audio.isMuted}
            >
              {audio.isMuted ? (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-6.414-3.586L4 13l1.586-1.414M18 6l1.414 1.414M5.586 9H4a1 1 0 00-1 1v4a1 1 0 001 1h1.586l4.707 4.707C10.923 20.337 12 19.891 12 19V5c0-.891-1.077-1.337-1.707-.707L5.586 9z"
                  />
                </svg>
              )}
              <span>{audio.isMuted ? "Sound off" : "Sound on"}</span>
            </button>

            {/* Keyboard shortcut hint */}
            <button
              type="button"
              onClick={toggleShortcuts}
              className={[
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                "text-xs font-medium text-gray-500",
                "transition-colors duration-200 hover:text-gray-400 hover:bg-white/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ].join(" ")}
              aria-label="View keyboard shortcuts"
              aria-haspopup="dialog"
              aria-expanded={showShortcuts}
            >
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                ?
              </kbd>
              <span>Shortcuts</span>
            </button>
          </footer>
        </main>

        {/* ── Notification permission request (shown once, after load) ── */}
        {notification.permissionState === "default" && (
          <div className="relative z-10 mt-4 w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <button
              type="button"
              onClick={notification.requestPermission}
              className={[
                "w-full rounded-xl border border-indigo-500/20 bg-indigo-500/5",
                "px-4 py-2.5",
                "flex items-center justify-between gap-3",
                "text-sm text-indigo-300/80 hover:text-indigo-300",
                "transition-colors duration-200 hover:bg-indigo-500/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ].join(" ")}
              aria-label="Enable desktop notifications when timer completes"
            >
              <div className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span>Enable completion notifications</span>
              </div>
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0 opacity-60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* ── App footer ──────────────────────────────────────────────── */}
        <footer
          className="relative z-10 mt-6 text-center text-xs text-gray-600"
          aria-label="App footer"
        >
          <p>
            Press{" "}
            <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
              Space
            </kbd>{" "}
            to start •{" "}
            <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
              R
            </kbd>{" "}
            to reset •{" "}
            <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
              ?
            </kbd>{" "}
            for all shortcuts
          </p>
        </footer>
      </div>

      {/* ── Completion Alert — rendered as portal outside card ──────────── */}
      {showCompletionAlert && (
        <CompletionAlert
          onDismiss={handleDismissAlert}
          onRestart={handleRestartFromAlert}
        />
      )}

      {/* ── Keyboard Shortcut Overlay ────────────────────────────────────── */}
      {showShortcuts && (
        <ShortcutOverlay onClose={() => setShowShortcuts(false)} />
      )}
    </>
  );
}