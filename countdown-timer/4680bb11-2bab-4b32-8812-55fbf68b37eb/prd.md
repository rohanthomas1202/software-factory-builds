# Product Requirements Document (PRD)

## Countdown Timer App

**Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** Product Management
**Status:** Draft — Pending Engineering Review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [User Stories](#3-user-stories)
4. [Data Model](#4-data-model)
5. [User Flows](#5-user-flows)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Success Metrics](#7-success-metrics)
8. [MVP Scope](#8-mvp-scope)

---

## 1. Overview

### 1.1 Project Summary

The **Countdown Timer App** is a lightweight, client-side web application that allows users to set a custom duration and count down to zero with precise, drift-resistant timing. The app provides intuitive start, pause, and reset controls, clear visual feedback of the timer's current state, and alerts the user upon completion. It requires no backend, no user accounts, and no heavy dependencies — it runs entirely in the browser.

### 1.2 Goals

| # | Goal | Description |
|---|------|-------------|
| G1 | **Simplicity** | Deliver an instantly understandable UI that requires zero onboarding. A first-time user should be able to start a countdown within 5 seconds of loading the page. |
| G2 | **Accuracy** | Maintain sub-second timing accuracy even over multi-hour durations and during periods of browser tab inactivity. |
| G3 | **Reliability** | Persist timer state across accidental page refreshes so users never lose a running countdown. |
| G4 | **Accessibility** | Meet WCAG 2.1 AA standards, ensuring full keyboard operability and screen-reader compatibility. |
| G5 | **Performance** | Achieve a Lighthouse performance score ≥ 95 with a total bundle size under 50 KB (gzipped). |

### 1.3 Target Users

| Persona | Description | Primary Use Case |
|---------|-------------|------------------|
| **Casual User** | Anyone who needs a quick timer — cooking, workouts, study sessions | Sets a preset or custom duration; starts and walks away |
| **Productivity Enthusiast** | Uses Pomodoro or time-boxing techniques | Repeatedly sets 25-min / 5-min cycles; values keyboard shortcuts |
| **Presenter / Facilitator** | Runs meetings, workshops, or classrooms | Needs a large, visible countdown on screen; values fullscreen readability |
| **Mobile User** | Accesses the timer from a phone or tablet | Needs touch-friendly controls and responsive layout |

### 1.4 Assumptions & Constraints

- The application is **entirely client-side** — no server, no database, no authentication.
- State persistence uses `localStorage` only.
- The app targets **modern evergreen browsers** (Chrome, Firefox, Safari, Edge — latest two major versions).
- No third-party timer or UI framework is required; vanilla JS or a minimal framework (e.g., Preact) is preferred.
- The app must handle browser tab throttling (e.g., Chrome throttles `setInterval` in background tabs).

---

## 2. Features

### F1 — Custom Duration Input

| Attribute | Detail |
|-----------|--------|
| **Description** | Users can set a countdown duration by entering values into three separate numeric input fields: hours, minutes, and seconds. |
| **Behavior** | Each field accepts non-negative integers. Minutes and seconds are clamped to 0–59. Hours are clamped to 0–99. Leading zeros are auto-formatted on blur (e.g., `5` → `05`). |
| **Acceptance Criteria** | |
| AC-1.1 | Three labeled input fields (HH, MM, SS) are visible when the timer is in the `idle` or `stopped` state. |
| AC-1.2 | Inputs only accept numeric characters; non-numeric input is rejected or stripped in real-time. |
| AC-1.3 | If the user enters a value > 59 for minutes or seconds, it is automatically clamped to 59 on blur. |
| AC-1.4 | If total duration equals zero (00:00:00), the Start button remains disabled and a helper message is shown: *"Please set a duration greater than zero."* |
| AC-1.5 | Input fields are disabled while the timer is in the `running` or `paused` state. |
| AC-1.6 | Clicking/tapping into any input field selects all text within that field for easy overwriting. |

### F2 — Preset Quick-Select Durations

| Attribute | Detail |
|-----------|--------|
| **Description** | A row of buttons allows users to instantly set common durations without manual input. |
| **Default Presets** | 1 min, 5 min, 10 min, 15 min, 25 min, 30 min |
| **Acceptance Criteria** | |
| AC-2.1 | Preset buttons are displayed prominently near the duration input fields. |
| AC-2.2 | Clicking a preset populates the HH:MM:SS inputs with the corresponding value and updates the timer display. |
| AC-2.3 | The currently selected preset (if any) is visually highlighted. |
| AC-2.4 | Presets are disabled while the timer is in the `running` or `paused` state. |
| AC-2.5 | Manually editing the input fields removes the preset highlight. |

### F3 — Start / Resume Button

| Attribute | Detail |
|-----------|--------|
| **Description** | A primary action button that begins the countdown from the set duration, or resumes a paused countdown from the remaining time. |
| **Acceptance Criteria** | |
| AC-3.1 | Button label reads **"Start"** when the timer is in `idle` or `stopped` state. |
| AC-3.2 | Button label reads **"Resume"** when the timer is in `paused` state. |
| AC-3.3 | Button is **disabled** when the timer is in the `running` state or when the set duration is zero. |
| AC-3.4 | On click, timer state transitions to `running` and the countdown display begins decrementing. |
| AC-3.5 | Keyboard shortcut: `Space` or `Enter` triggers Start/Resume when the button is focused. Global shortcut `S` (when no input is focused) also triggers it. |

### F4 — Pause Button

| Attribute | Detail |
|-----------|--------|
| **Description** | Temporarily halts the countdown, preserving the remaining time. |
| **Acceptance Criteria** | |
| AC-4.1 | Button is **disabled** when the timer is not in the `running` state. |
| AC-4.2 | On click, timer state transitions to `paused` and the display freezes at the current remaining time. |
| AC-4.3 | The paused remaining time is preserved exactly (no rounding). |
| AC-4.4 | Keyboard shortcut: `P` (when no input is focused) triggers Pause. |

### F5 — Reset Button

| Attribute | Detail |
|-----------|--------|
| **Description** | Stops the countdown and restores the timer display to the originally set duration. |
| **Acceptance Criteria** | |
| AC-5.1 | On click, timer state transitions to `idle`, the display returns to the original set duration, and any active alert is dismissed. |
| AC-5.2 | Reset is available in **all states** except `idle` with an unchanged duration (in which case it is disabled since there is nothing to reset). |
| AC-5.3 | After reset, input fields become editable again. |
| AC-5.4 | Keyboard shortcut: `R` (when no input is focused) triggers Reset. |

### F6 — Time Display

| Attribute | Detail |
|-----------|--------|
| **Description** | A large, centrally positioned display showing the remaining time in `HH:MM:SS` format. |
| **Acceptance Criteria** | |
| AC-6.1 | Display uses a monospaced or tabular-number font to prevent layout shifts as digits change. |
| AC-6.2 | Font size is large enough to read from 3 meters away on a standard desktop monitor (minimum 72px effective size at 1080p). |
| AC-6.3 | Display updates every second (visual tick). |
| AC-6.4 | When hours are `00`, the display **still** shows `00:MM:SS` (no truncation) for consistency. |
| AC-6.5 | Display color/style changes based on timer state (see F10). |

### F7 — Progress Indicator

| Attribute | Detail |
|-----------|--------|
| **Description** | A visual bar or ring that shows the proportion of time elapsed vs. remaining. |
| **Acceptance Criteria** | |
| AC-7.1 | Progress indicator is visible whenever the timer is in `running` or `paused` state. |
| AC-7.2 | The indicator fills/depletes smoothly (CSS transition or animation, not stepped). |
| AC-7.3 | At `running` start, the indicator shows 0% elapsed; at completion, it shows 100% elapsed. |
| AC-7.4 | While `paused`, the indicator freezes at its current position. |
| AC-7.5 | On `reset`, the indicator returns to 0%. |

### F8 — Completion Alert

| Attribute | Detail |
|-----------|--------|
| **Description** | When the countdown reaches `00:00:00`, the user is notified via both audio and visual cues. |
| **Acceptance Criteria** | |
| AC-8.1 | A short, pleasant audio tone plays on completion (max 3 seconds). Audio respects the system volume. |
| AC-8.2 | If audio playback is blocked by the browser's autoplay policy, the alert degrades gracefully to visual-only (no JS error). |
| AC-8.3 | The timer display flashes or pulses with an accent color to indicate completion. |
| AC-8.4 | A dismissible banner or modal appears with the text *"Time's up!"* and two action buttons: **Dismiss** and **Restart**. |
| AC-8.5 | **Restart** resets the timer to the original duration and immediately starts it. |
| AC-8.6 | The `<title>` tag updates to `⏰ Time's up! — Countdown Timer`. |
| AC-8.7 | If the browser supports the Notifications API and the user has granted permission, a system notification is dispatched as a supplementary alert. |

### F9 — Browser Title / Favicon Update

| Attribute | Detail |
|-----------|--------|
| **Description** | While the timer is running, the browser tab title reflects the remaining time so users can monitor progress from another tab. |
| **Acceptance Criteria** | |
| AC-9.1 | While `running`, the document title updates every second to the format `MM:SS — Countdown Timer` (or `HH:MM:SS` if hours > 0). |
| AC-9.2 | While `paused`, the title shows `⏸ MM:SS — Countdown Timer`. |
| AC-9.3 | While `idle`, the title reverts to `Countdown Timer`. |
| AC-9.4 | Optionally, the favicon changes to a small timer icon reflecting the state (stretch goal). |

### F10 — State Visualization

| Attribute | Detail |
|-----------|--------|
| **Description** | The UI must make the current timer state immediately obvious through color, iconography, and layout. |
| **Acceptance Criteria** | |

| State | Display Color | Background Hint | Button States |
|-------|--------------|-----------------|---------------|
| `idle` | Neutral / white | Default | Start: enabled, Pause: disabled, Reset: disabled |
| `running` | Green accent | Subtle green tint or animated border | Start: disabled, Pause: enabled, Reset: enabled |
| `paused` | Amber / yellow | Subtle amber tint or "paused" badge on display | Resume: enabled, Pause: disabled, Reset: enabled |
| `completed` | Red accent / pulsing | Flash animation | Start: disabled, Pause: disabled, Reset: enabled, Restart: enabled |

### F11 — State Persistence

| Attribute | Detail |
|-----------|--------|
| **Description** | The timer state is persisted to `localStorage` so that an accidental page refresh does not lose the countdown. |
| **Acceptance Criteria** | |
| AC-11.1 | On every state change and every second tick, the following are saved: `state`, `originalDuration`, `remainingDuration`, `lastTickTimestamp`. |
| AC-11.2 | On page load, if a persisted `running` state is found, the app calculates elapsed time since `lastTickTimestamp`, subtracts it from `remainingDuration`, and resumes automatically. |
| AC-11.3 | If the recalculated remaining time is ≤ 0, the app transitions directly to `completed` and fires the alert. |
| AC-11.4 | If a persisted `paused` state is found, the app restores the paused display without auto-starting. |
| AC-11.5 | A `Reset` clears the persisted state from `localStorage`. |

### F12 — Keyboard Shortcuts

| Attribute | Detail |
|-----------|--------|
| **Description** | Power users can control the timer without a mouse. |
| **Acceptance Criteria** | |

| Shortcut | Action | Condition |
|----------|--------|-----------|
| `Space` | Start / Resume / Pause (toggle) | No input field focused |
| `R` | Reset | No input field focused |
| `Escape` | Dismiss completion alert | Alert is visible |
| `Tab` | Navigate between controls | Always |
| `?` | Show/hide keyboard shortcut help overlay | Always |

---

## 3. User Stories

### Epic 1 — Timer Setup

| ID | User Story | Priority |
|----|-----------|----------|
| US-1.1 | As a **casual user**, I want to type a specific number of hours, minutes, and seconds so that I can count down an exact duration. | P0 |
| US-1.2 | As a **casual user**, I want to tap a preset button (e.g., "5 min") so that I can start a timer without typing anything. | P0 |
| US-1.3 | As a **casual user**, I want to see an error message if I try to start a timer with zero duration so that I understand why the timer won't start. | P1 |
| US-1.4 | As a **mobile user**, I want the numeric keyboard to appear automatically when I tap a duration input field so that entry is fast and intuitive. | P1 |

### Epic 2 — Timer Controls

| ID | User Story | Priority |
|----|-----------|----------|
| US-2.1 | As a **casual user**, I want to press a Start button so that the countdown begins. | P0 |
| US-2.2 | As a **casual user**, I want to press a Pause button so that I can temporarily halt the countdown without losing my place. | P0 |
| US-2.3 | As a **casual user**, I want to press a Resume button so that a paused countdown continues from where it left off. | P0 |
| US-2.4 | As a **casual user**, I want to press a Reset button so that the timer returns to the duration I originally set. | P0 |
| US-2.5 | As a **productivity enthusiast**, I want to use keyboard shortcuts (Space, R) so that I can control the timer without reaching for my mouse. | P1 |
| US-2.6 | As a **productivity enthusiast**, I want to see a shortcut help overlay when I press `?` so that I can learn available shortcuts. | P2 |

### Epic 3 — Timer Display & Feedback

| ID | User Story | Priority |
|----|-----------|----------|
| US-3.1 | As a **presenter**, I want to see the remaining time in large HH:MM:SS format so that I and my audience can read it from a distance. | P0 |
| US-3.2 | As a **casual user**, I want the display to visually distinguish between running, paused, and idle states so that I always know what the timer is doing. | P0 |
| US-3.3 | As a **casual user**, I want a progress bar or ring to show how much time has passed so that I have an at-a-glance sense of progress. | P1 |
| US-3.4 | As a **multitasking user**, I want the browser tab title to show the remaining time so that I can monitor the timer from another tab. | P1 |

### Epic 4 — Completion & Alerts

| ID | User Story | Priority |
|----|-----------|----------|
| US-4.1 | As a **casual user**, I want to hear an audio alert when the timer reaches zero so that I'm notified even if I'm not looking at the screen. | P0 |
| US-4.2 | As a **casual user**, I want to see a visual animation and "Time's up!" message when the countdown completes so that the completion is unmistakable. | P0 |
| US-4.3 | As a **casual user**, I want a "Restart" button on the completion alert so that I can immediately run the same timer again. | P1 |
| US-4.4 | As a **multitasking user**, I want to receive a browser notification when the timer completes so that I'm alerted even if the tab is in the background. | P2 |

### Epic 5 — Reliability & Persistence

| ID | User Story | Priority |
|----|-----------|----------|
| US-5.1 | As a **casual user**, I want the timer to remain accurate even if I switch to another browser tab so that I can trust the countdown. | P0 |
| US-5.2 | As a **casual user**, I want the timer to survive an accidental page refresh so that I don't lose my running countdown. | P1 |

---

## 4. Data Model

Since the application is entirely client-side, the "data model" represents in-memory state objects and their `localStorage` serialization.

### 4.1 Entity Relationship Diagram (Conceptual)

```
┌─────────────────────┐       ┌─────────────────────┐
│     TimerConfig      │       │     TimerPreset      │
│─────────────────────│       │─────────────────────│
│ originalDuration: ms │◄──────│ label: string        │
│                      │  sets │ durationMs: number   │
└──────────┬──────────┘       └─────────────────────┘
           │ has
           ▼
┌─────────────────────────────┐
│         TimerState           │
│─────────────────────────────│
│ status: TimerStatus          │
│ remainingMs: number          │
│ lastTickTimestamp: number    │
│ originalDurationMs: number   │
│ elapsedMs: number            │
└──────────┬──────────────────┘
           │ triggers
           ▼
┌─────────────────────────────┐
│       CompletionAlert        │
│─────────────────────────────│
│ isVisible: boolean           │
│ audioPlayed: boolean         │
│ notificationSent: boolean    │
└─────────────────────────────┘
```

### 4.2 Entity Definitions

#### `TimerConfig`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `originalDurationMs` | `number` | The duration the user originally set, in milliseconds | > 0, ≤ 359,999,000 (99:59:59) |

#### `TimerPreset`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `string` | Unique identifier (e.g., `"preset-5m"`) | Non-empty |
| `label` | `string` | Display label (e.g., `"5 min"`) | Non-empty |
| `durationMs` | `number` | Duration in milliseconds | > 0 |

#### `TimerState`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `status` | `TimerStatus` | Current state of the timer | Enum: `idle`, `running`, `paused`, `completed` |
| `originalDurationMs` | `number` | Snapshot of the configured duration when Start was pressed | > 0 |
| `remainingMs` | `number` | Milliseconds remaining in the countdown | ≥ 0 |
| `elapsedMs` | `number` | Milliseconds elapsed since start (derived: `original - remaining`) | ≥ 0 |
| `lastTickTimestamp` | `number \| null` | `Date.now()` at the most recent tick; used for drift correction and persistence recovery | `null` when idle |

#### `CompletionAlert`

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `isVisible` | `boolean` | Whether the completion UI is showing | — |
| `audioPl ayed` | `boolean` | Whether the audio tone has been played for this completion | — |
| `notificationSent` | `boolean` | Whether a browser notification was dispatched | — |

### 4.3 `localStorage` Schema

**Key:** `countdown-timer-state`

```json
{
  "version": 1,
  "status": "running",
  "originalDurationMs": 300000,
  "remainingMs": 142350,
  "lastTickTimestamp": 1705312345678
}
```

> On page load, the app reads this key. If `status === "running"`, it computes `elapsed = Date.now() - lastTickTimestamp` and adjusts `remainingMs` accordingly before resuming.

---

## 5. User Flows

### Flow 1 — Set a Custom Duration and Start the Timer

```
┌──────────────┐
│  Page loads   │
│  (idle state) │
└──────┬───────┘
       ▼
┌──────────────────────────┐
│ User enters HH:MM:SS     │
│ via input fields          │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ Inputs validated in       │
│ real-time; Start button   │
│ becomes enabled if > 0    │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ User clicks "Start"       │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ Timer state → running     │
│ Display starts counting   │
│ down; progress bar moves; │
│ tab title updates         │
│ Inputs become disabled    │
└──────────────────────────┘
```

### Flow 2 — Select a Preset and Start the Timer

```
┌──────────────┐
│  Page loads   │
│  (idle state) │
└──────┬───────┘
       ▼
┌──────────────────────────┐
│ User clicks "5 min"       │
│ preset button             │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ Input fields populated:   │
│ HH=00, MM=05, SS=00      │
│ Preset button highlighted │
│ Start button enabled      │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ User clicks "Start"       │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│ Timer state → running     │
│ Countdown begins at 05:00 │
└──────────────────────────┘
```

### Flow 3 — Pause, Resume, and Reset

```
┌────────────────────┐
│ Timer is running    │
│ at 03:27 remaining  │
└──────┬─────────────┘
       ▼
┌────────────────────┐
│ User clicks "Pause" │
└──────┬─────────────┘
       ▼
┌──────────────────────────┐
│ Timer state → paused      │
│ Display freezes at 03:27  │
│ Amber visual state        │
│ "Resume" button appears   │
└──────┬───────────────────┘
       │
       ├──── User clicks "Resume" ────┐
       │                               ▼
       │                  ┌─────────────────────┐
       │                  │ Timer state → running│
       │                  │ Countdown resumes    │
       │                  │ from 03:27           │
       │                  └─────────────────────┘
       │
       └──── User clicks "Reset" ─────┐
                                       ▼
                          ┌─────────────────────┐
                          │ Timer state → idle   │
                          │ Display shows 05:00  │
                          │ (original duration)  │
                          │ Inputs re-enabled    │
                          └─────────────────────┘
```

### Flow 4 — Timer Completion

```
┌────────────────────┐
│ Timer is running    │
│ at 00:01 remaining  │
└──────┬─────────────┘
       ▼
┌──────────────────────────┐
│ Tick: remaining → 00:00   │
└──────┬───────────────────┘
       ▼
┌──────────────────────────────────────┐
│ Timer state → completed               │
│ • Display shows 00:00:00 with pulse  │
│ • Audio alert plays                   │
│ • Completion banner appears           │
│   [Dismiss]  [Restart]               │
│ • Tab title → "⏰ Time's up!"        │
│ • Browser notification (if permitted)│
└──────┬───────────────────────────────┘
       │
       ├── User clicks "Dismiss" ──────┐
       │                                ▼
       │                   ┌──────────────────┐
       │                   │ Alert dismissed   │
       │                   │ Timer stays at    │
       │                   │ 00:00 (completed) │
       │                   │ Reset available   │
       │                   └──────────────────┘
       │
       └── User clicks "Restart" ──────┐
                                        ▼
                           ┌──────────────────┐
                           │ Timer resets to   │
                           │ original duration │
                           │ and immediately   │
                           │ starts running    │
                           └──────────────────┘
```

### Flow 5 — Recovery After Page Refresh

```
┌──────────────────────────────┐
│ Timer was running at 02:15    │
│ User accidentally refreshes   │
└──────┬───────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ Page loads; reads localStorage       │
│ Finds: status=running,              │
│ remainingMs=135000,                  │
│ lastTickTimestamp=1705312345678       │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ Calculates elapsed since last tick:  │
│ e.g., 3200ms passed                  │
│ New remaining = 135000 - 3200        │
│                = 131800 (02:11.8)    │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ Timer auto-resumes at ~02:12         │
│ User sees seamless continuation      │
└──────────────────────────────────────┘
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Initial page load (LCP)** | < 1.0 second on 3G | Lighthouse lab test |
| **Total bundle size** | < 50 KB gzipped | Build output |
| **Timer tick accuracy** | ± 50ms over any 1-hour period | Automated test comparing `Date.now()` at completion vs. expected completion time |
| **Frame rate during animation** | ≥ 60 fps for progress indicator | Chrome DevTools Performance panel |
| **Memory usage** | < 20 MB heap during operation | Chrome Task Manager |

### 6.2 Accuracy & Drift Prevention

- The timer **must not** rely solely on `setInterval` counting. Instead, each tick must recalculate remaining time using `Date.now()` (wall-clock comparison) to prevent drift.
- When the browser tab is inactive, `setInterval` may be throttled to 1-second (or longer) intervals. On the next tick after re-activation, the timer must reconcile with wall-clock time and jump to the correct remaining value.

### 6.3 Security

| Requirement | Detail |
|-------------|--------|
| **No external network requests** | The app makes zero HTTP requests after initial load (no analytics, no CDN fonts unless cached). |
| **Input sanitization** | All user inputs are type-checked and clamped; no `eval()` or `innerHTML` with user data. |
| **Content Security Policy** | The app should be compatible with a strict CSP: `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'`. |
| **localStorage** | Only non-sensitive timer data is stored. No PII. |

### 6.4 Accessibility

| Requirement | Standard | Detail |
|-------------|----------|--------|
| **Keyboard navigation** | WCAG 2.1 §2.1.1 | All interactive elements reachable and operable via keyboard. |
| **Focus indicators** | WCAG 2.1 §2.4.7 | Visible focus rings on all buttons and inputs. |
| **ARIA labels** | WCAG 2.1 §4.1.2 | All buttons have `aria-label`. Timer display has `role="timer"` and `aria-live="polite"` (updates announced at reasonable intervals — not every second). |
| **Color contrast** | WCAG 2.1 §1.4.3 | All text meets 4.5:1 contrast ratio (AA). State colors have sufficient contrast against background. |
| **Reduced motion** | WCAG 2.1 §2.3.3 | If `prefers-reduced-motion` is set, all animations (pulse, progress transitions) are replaced with static state changes. |
| **Screen reader announcements** | — | State transitions (started, paused, completed) are announced via `aria-live` region. Completion alert is announced immediately. |

### 6.5 Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome / Edge | Latest 2 major |
| Firefox | Latest 2 major |
| Safari (macOS & iOS) | Latest 2 major |

### 6.6 Responsiveness

| Breakpoint | Layout Behavior |
|------------|----------------|
| **< 480px** (mobile) | Single column; full-width buttons stacked; preset buttons wrap to 2 rows; timer font scales down to fit viewport width |
| **480px – 768px** (tablet) | Single column with wider margins; buttons arranged in a row |
| **> 768px** (desktop) | Centered card layout (max-width: 600px); comfortable spacing |

---

## 7. Success Metrics

### 7.1 Product KPIs

| Metric | Definition | Target (30 days post-launch) |
|--------|-----------|------------------------------|
| **Task Completion Rate** | % of sessions where a user successfully completes a full countdown (reaches 00:00) | ≥ 70% |
| **Time to First Timer** | Median time from page load to first "Start" click | ≤ 8 seconds |
| **Preset Adoption Rate** | % of sessions using a preset vs. custom input | ≥ 40% |
| **Return Usage** | % of users who use the app more than once (cookie-based, anonymous) | ≥ 25% |
| **Restart Rate** | % of completed timers where the user clicks "Restart" | Track (no target — informational) |

### 7.2 Technical KPIs

| Metric | Target |
|--------|--------|
| **Lighthouse Performance Score** | ≥ 95 |
| **Lighthouse Accessibility Score** | ≥ 95 |
| **Core Web Vitals — LCP** | < 1.0s |
| **Core Web Vitals — CLS** | < 0.05 |
| **Core Web Vitals — INP** | < 100ms |
| **Timer Drift** | < 100ms error over 1-hour countdown (automated test) |
| **Bundle Size (gzipped)** | < 50 KB |
| **Zero JS Errors** | 0 unhandled exceptions in production monitoring |

### 7.3 Measurement Plan

| What | How | Tool |
|------|-----|------|
| Task completion & usage metrics | Anonymous event tracking (page load, start, pause, reset, complete, restart) | Lightweight, self-hosted analytics or `navigator.sendBeacon` to a simple endpoint (optional; can be deferred) |
| Performance | Automated Lighthouse CI on each deploy | Lighthouse CI / GitHub Actions |
| Accessibility | Automated axe-core scans + manual screen-reader testing | axe DevTools + VoiceOver / NVDA |
| Timer accuracy | End-to-end integration test comparing wall clock vs. timer output | Playwright or Cypress |

---

## 8. MVP Scope

### 8.1 MVP (Phase 1) — Ship First

**Goal:** Deliver a fully functional, polished countdown timer that covers the core use case.

| Feature | ID | Priority |
|---------|----|----------|
| Custom duration input (HH:MM:SS) | F1 | P0 |
| Start / Resume button | F3 | P0 |
| Pause button | F4 | P0 |
| Reset button | F5 | P0 |
| Time display (HH:MM:SS, large format) | F6 | P0 |
| State visualization (color-coded running/paused/idle/completed) | F10 | P0 |
| Audio alert on completion | F8 (AC-8.1, 8.2) | P0 |
| Visual alert on completion ("Time's up!" banner) | F8 (AC-8.3, 8.4) | P0 |
| Input validation (no zero/negative) | F1 (AC-1.4) | P0 |
| Drift-resistant timing (wall-clock based) | NFR 6.2 | P0 |
| Responsive design (mobile, tablet, desktop) | NFR 6.6 | P0 |
| Accessibility basics (keyboard nav, ARIA, contrast) | NFR 6.4 | P0 |

**Estimated Effort:** 1–2 weeks (single developer)

### 8.2 Phase 2 — Enhance

**Goal:** Add convenience features and polish that increase engagement and power-user satisfaction.

| Feature | ID | Priority |
|---------|----|----------|
| Preset quick-select durations | F2 | P1 |
| Progress indicator (bar or ring) | F7 | P1 |
| Browser tab title update with remaining time | F9 | P1 |
| State persistence across page refresh | F11 | P1 |
| Keyboard shortcuts (Space, R, P) | F12 | P1 |
| Restart button on completion alert | F8 (AC-8.5) | P1 |

**Estimated Effort:** 1 week

### 8.3 Phase 3 — Delight

**Goal:** Add nice-to-have features that differentiate the app and delight users.

| Feature | ID | Priority |
|---------|----|----------|
| Browser Notification API integration | F8 (AC-8.7) | P2 |
| Keyboard shortcut help overlay (`?`) | F12 | P2 |
| Favicon dynamic update | F9 (AC-9.4) | P2 |
| Smooth animated progress ring (SVG) | F7 enhancement | P2 |
| `prefers-reduced-motion` support | NFR 6.4 | P2 |
| Custom audio tone selection | Stretch | P3 |
| Multiple simultaneous timers | Stretch | P3 |
| Dark mode / theme toggle | Stretch | P3 |

**Estimated Effort:** 1–2 weeks

---

### Appendix A — Keyboard Shortcut Reference

| Key | Action | Context |
|-----|--------|---------|
| `Space` | Toggle Start / Pause | No input focused |
| `R` | Reset | No input focused |
| `Escape` | Dismiss alert | Alert visible |
| `?` | Toggle shortcut overlay | Any |
| `Tab` / `Shift+Tab` | Navigate controls | Always |
| `Enter` | Activate focused button | Button focused |

### Appendix B — State Machine

```
          ┌──────────┐
          │   idle    │◄────────────────────────┐
          └────┬─────┘                          │
               │ [Start]                   [Reset]
               ▼                                │
          ┌──────────┐    [Pause]    ┌──────────┤
          │ running   │─────────────►│  paused   │
          │           │◄─────────────│           │
          └────┬─────┘   [Resume]   └───────────┘
               │
               │ [remaining ≤ 0]
               ▼
          ┌──────────┐
          │ completed │
          └──────────┘
               │
               ├── [Reset] ──► idle
               └── [Restart] ─► running (with original duration)
```

---

*End of Document*