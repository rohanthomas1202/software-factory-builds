/**
 * useAudioAlert — src/hooks/useAudioAlert.ts
 *
 * Strategy (in priority order):
 *   1. HTMLAudioElement backed by /sounds/alert.mp3
 *   2. Web Audio API synthesised chime (no file required)
 *   3. Silent no-op (SSR or both APIs unavailable)
 *
 * Additional features:
 *   - Respects a user mute preference stored in localStorage
 *   - Exposes a toggleMute() action and isMuted state for the UI mute button
 *   - Preloads the audio file on mount (non-blocking)
 *   - Catches autoplay policy errors and falls back silently
 *   - Re-entrant safe: calling play() while already playing restarts the sound
 *
 * SSR safe: all browser API access is inside useEffect or guarded with
 * typeof checks.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_MP3_PATH = "/sounds/alert.mp3";
const MUTE_STORAGE_KEY = "countdown-timer:muted";

/** Chime note frequencies in Hz (ascending three-note chime) */
const CHIME_NOTES: ReadonlyArray<{
  frequency: number;
  startTime: number;
  duration: number;
  gain: number;
}> = [
  { frequency: 523.25, startTime: 0.00, duration: 0.4, gain: 0.35 }, // C5
  { frequency: 659.25, startTime: 0.18, duration: 0.4, gain: 0.30 }, // E5
  { frequency: 783.99, startTime: 0.36, duration: 0.6, gain: 0.25 }, // G5
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAudioAlertReturn {
  /** Play the completion alert sound (respects mute state) */
  playAlert: () => void;
  /** Whether audio is currently muted */
  isMuted: boolean;
  /** Toggle mute on/off and persist to localStorage */
  toggleMute: () => void;
  /** True if the audio system has been successfully initialised */
  isReady: boolean;
}

// ---------------------------------------------------------------------------
// Web Audio API synthesised chime fallback
// ---------------------------------------------------------------------------

/**
 * Plays a three-note ascending chime using the Web Audio API.
 * No external audio files required.
 * Returns a Promise that resolves when synthesis starts (not when done).
 */
function synthesiseChime(context: AudioContext): void {
  const now = context.currentTime;

  CHIME_NOTES.forEach(({ frequency, startTime, duration, gain }) => {
    // Oscillator node
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + startTime);

    // Gain node with envelope (attack + decay)
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, now + startTime);
    gainNode.gain.linearRampToValueAtTime(gain, now + startTime + 0.02); // fast attack
    gainNode.gain.exponentialRampToValueAtTime(
      0.001, // effectively zero (exponentialRamp cannot ramp to 0)
      now + startTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now + startTime);
    oscillator.stop(now + startTime + duration + 0.05); // slight buffer
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAudioAlert(): UseAudioAlertReturn {
  // ---------------------------------------------------------------------------
  // Mute state — initialised from localStorage, kept in sync
  // ---------------------------------------------------------------------------
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    // Safe to call during SSR — useState initialiser runs only once on the
    // client; on the server this returns false (no localStorage available).
    if (typeof localStorage === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // ---------------------------------------------------------------------------
  // Refs — hold mutable objects that should not trigger re-renders
  // ---------------------------------------------------------------------------

  /** The primary HTMLAudioElement (may be null if preload fails) */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** AudioContext for Web Audio API fallback */
  const audioContextRef = useRef<AudioContext | null>(null);

  /** Whether the MP3 preload succeeded */
  const mp3ReadyRef = useRef<boolean>(false);

  /** Whether the hook is fully initialised */
  const [isReady, setIsReady] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Initialisation: preload HTMLAudioElement on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    let isCancelled = false;

    const initAudio = async (): Promise<void> => {
      // ── Attempt 1: HTMLAudioElement ────────────────────────────────────────
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.volume = 0.7;

        // Probe whether the browser can play MP3
        const canPlay = audio.canPlayType("audio/mpeg");
        if (canPlay !== "" && canPlay !== "no") {
          // Listen for the canplaythrough event to confirm the file loaded.
          await new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => resolve();
            audio.onerror = () => reject(new Error("MP3 load error"));

            // Set src after attaching listeners
            audio.src = ALERT_MP3_PATH;
            audio.load();

            // Timeout in case the file is missing or server is slow
            setTimeout(() => reject(new Error("MP3 load timeout")), 5000);
          });

          if (!isCancelled) {
            audioRef.current = audio;
            mp3ReadyRef.current = true;
          }
        }
      } catch {
        // MP3 not available — will use Web Audio API fallback.
        mp3ReadyRef.current = false;
      }

      // ── Attempt 2: Initialise AudioContext for fallback ───────────────────
      // We don't create the context here (requires user gesture) — we just
      // verify the API exists. The context is created lazily on first play().
      if (!isCancelled) {
        setIsReady(true);
      }
    };

    void initAudio();

    return () => {
      isCancelled = true;
      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      // Close AudioContext if open
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => {/* ignore */});
        audioContextRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Persist mute changes to localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(isMuted));
    } catch {
      // localStorage full or unavailable — ignore silently.
    }
  }, [isMuted]);

  // ---------------------------------------------------------------------------
  // playAlert
  // ---------------------------------------------------------------------------
  const playAlert = useCallback((): void => {
    if (isMuted) return;
    if (typeof window === "undefined") return;

    // ── Path 1: HTMLAudioElement (MP3) ────────────────────────────────────────
    if (mp3ReadyRef.current && audioRef.current) {
      // Restart from beginning if already playing
      try {
        const audio = audioRef.current;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy blocked — silently fall through to Web Audio API.
            void playWebAudioFallback();
          });
        }
        return;
      } catch {
        // Synchronous error (rare) — fall through to Web Audio API.
      }
    }

    // ── Path 2: Web Audio API synthesised chime ────────────────────────────
    void playWebAudioFallback();
  }, [isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Lazily creates (or resumes) an AudioContext and plays the synthesised chime.
   * Returns a promise so callers can await it, but errors are caught internally.
   */
  async function playWebAudioFallback(): Promise<void> {
    try {
      const AudioContextClass =
        window.AudioContext ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext as typeof AudioContext | undefined;

      if (!AudioContextClass) return; // API not available

      // Lazily create the AudioContext (must happen after a user gesture for
      // some browsers, but completion events typically satisfy this requirement).
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;

      // Safari may suspend the context — resume it first.
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      synthesiseChime(ctx);
    } catch {
      // Both audio strategies failed — silent no-op.
      // This can happen in automated test environments or strict browsers.
    }
  }

  // ---------------------------------------------------------------------------
  // toggleMute
  // ---------------------------------------------------------------------------
  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => !prev);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    playAlert,
    isMuted,
    toggleMute,
    isReady,
  };
}

export default useAudioAlert;