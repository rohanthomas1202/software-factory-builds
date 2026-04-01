/**
 * Vitest Global Setup — src/test/setup.ts
 *
 * This file runs before every test file via vitest.config.ts `setupFiles`.
 *
 * Responsibilities:
 * 1. Extend expect with @testing-library/jest-dom matchers
 * 2. Mock browser APIs unavailable in jsdom:
 *    - AudioContext / Web Audio API
 *    - Notification API
 *    - Screen Wake Lock API
 *    - matchMedia
 *    - ResizeObserver
 *    - IntersectionObserver
 *    - navigator.wakeLock
 * 3. Configure localStorage with a reset between tests
 * 4. Suppress known benign console errors from React / jsdom
 * 5. Global afterEach cleanup
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// 1. @testing-library/react cleanup
// ---------------------------------------------------------------------------
/**
 * Unmount React trees after each test to prevent state leaking between tests.
 * This mirrors the automatic cleanup that CRA/Jest performs, but must be
 * done explicitly with Vitest.
 */
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// 2. localStorage mock
// ---------------------------------------------------------------------------
/**
 * jsdom provides localStorage but it persists between tests.
 * We reset it before each test for a clean slate.
 */
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------
// 3. matchMedia mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement matchMedia. This mock satisfies components that
 * call window.matchMedia (e.g., dark mode detection, responsive hooks).
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),      // deprecated but still used by some libs
    removeListener: vi.fn(),   // deprecated but still used by some libs
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ---------------------------------------------------------------------------
// 4. ResizeObserver mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement ResizeObserver. Many UI component libraries
 * and responsive hooks use it.
 */
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// ---------------------------------------------------------------------------
// 5. IntersectionObserver mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement IntersectionObserver.
 */
class IntersectionObserverMock {
  root: Element | null = null;
  rootMargin = "0px";
  thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// ---------------------------------------------------------------------------
// 6. AudioContext / Web Audio API mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement AudioContext. The useAudioAlert hook falls back
 * gracefully when AudioContext is unavailable, but the mock allows us to
 * test the synthesis path.
 */
class AudioContextMock {
  state = "running" as AudioContextState;
  currentTime = 0;
  destination = {
    channelCount: 2,
    channelCountMode: "max" as ChannelCountMode,
    channelInterpretation: "speakers" as ChannelInterpretation,
    numberOfInputs: 0,
    numberOfOutputs: 0,
    context: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  createOscillator = vi.fn().mockReturnValue({
    type: "sine" as OscillatorType,
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onended: null,
  });

  createGain = vi.fn().mockReturnValue({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });

  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  });

  createBufferSource = vi.fn().mockReturnValue({
    buffer: null,
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onended: null,
  });
}

Object.defineProperty(window, "AudioContext", {
  writable: true,
  configurable: true,
  value: AudioContextMock,
});

// Also mock the webkit-prefixed version
Object.defineProperty(window, "webkitAudioContext", {
  writable: true,
  configurable: true,
  value: AudioContextMock,
});

// ---------------------------------------------------------------------------
// 7. Notification API mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement the Notification API.
 * We provide a mock that tracks calls and simulates permission states.
 */
const NotificationMock = vi.fn().mockImplementation(
  (title: string, options?: NotificationOptions) => ({
    title,
    body: options?.body ?? "",
    icon: options?.icon ?? "",
    tag: options?.tag ?? "",
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onclick: null,
    onclose: null,
    onerror: null,
    onshow: null,
  })
) as unknown as typeof Notification;

/**
 * Default permission state — can be overridden per test:
 *   vi.spyOn(Notification, "permission", "get").mockReturnValue("denied");
 */
Object.defineProperty(NotificationMock, "permission", {
  get: vi.fn().mockReturnValue("granted"),
  configurable: true,
});

Object.defineProperty(NotificationMock, "requestPermission", {
  value: vi.fn().mockResolvedValue("granted"),
  configurable: true,
  writable: true,
});

Object.defineProperty(window, "Notification", {
  writable: true,
  configurable: true,
  value: NotificationMock,
});

// ---------------------------------------------------------------------------
// 8. Screen Wake Lock API mock
// ---------------------------------------------------------------------------
/**
 * jsdom does not implement the Screen Wake Lock API.
 * The useWakeLock hook gracefully degrades when unavailable, but the mock
 * lets us test the acquisition / release logic.
 */
const wakeLockSentinelMock = {
  released: false,
  type: "screen" as WakeLockType,
  release: vi.fn().mockImplementation(async function (this: { released: boolean }) {
    this.released = true;
    return Promise.resolve();
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn().mockReturnValue(true),
  onrelease: null,
};

Object.defineProperty(navigator, "wakeLock", {
  writable: true,
  configurable: true,
  value: {
    request: vi.fn().mockResolvedValue(wakeLockSentinelMock),
  },
});

// ---------------------------------------------------------------------------
// 9. window.location mock helpers
// ---------------------------------------------------------------------------
/**
 * jsdom implements window.location but navigation (assign, replace) throws
 * by default. This is a no-op stub for hooks that may call location methods.
 */
Object.defineProperty(window, "location", {
  writable: true,
  configurable: true,
  value: {
    ...window.location,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    href: "http://localhost:3000/",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
});

// ---------------------------------------------------------------------------
// 10. HTMLMediaElement mock (for audio tag)
// ---------------------------------------------------------------------------
/**
 * jsdom stubs HTMLMediaElement but play() / pause() / load() return
 * undefined instead of Promises. This causes unhandled rejection warnings.
 */
Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  writable: true,
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

/**
 * Stub the `error` property so audio error handling tests work.
 */
Object.defineProperty(window.HTMLMediaElement.prototype, "error", {
  writable: true,
  configurable: true,
  value: null,
});

// ---------------------------------------------------------------------------
// 11. requestAnimationFrame / cancelAnimationFrame
// ---------------------------------------------------------------------------
/**
 * jsdom provides these but they are no-ops. For component tests that use
 * rAF for animations, we provide a synchronous implementation.
 */
let rafHandle = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();

Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((callback: FrameRequestCallback) => {
    const handle = ++rafHandle;
    rafCallbacks.set(handle, callback);
    // Synchronously invoke for test predictability unless fake timers are active
    setTimeout(() => {
      const cb = rafCallbacks.get(handle);
      if (cb) {
        rafCallbacks.delete(handle);
        cb(performance.now());
      }
    }, 0);
    return handle;
  }),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((handle: number) => {
    rafCallbacks.delete(handle);
  }),
});

// ---------------------------------------------------------------------------
// 12. console error suppression for known benign warnings
// ---------------------------------------------------------------------------
/**
 * Suppress specific console.error calls that are expected and do not
 * indicate real failures. This keeps test output clean.
 *
 * Only suppress known patterns — let unknown errors surface.
 */
const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

const SUPPRESSED_ERROR_PATTERNS = [
  // React 18 concurrent mode warnings in tests
  /Warning: An update to .* inside a test was not wrapped in act/,
  // act() warning — addressed at test level but may still surface
  /Warning: ReactDOM.render is no longer supported/,
  // jsdom CSS custom property warnings
  /CSS variables are not supported/,
  // AudioContext autoplay policy
  /The AudioContext was not allowed to start/,
];

const SUPPRESSED_WARN_PATTERNS = [
  // Next.js hydration mismatch warning (expected in test env)
  /Warning: Expected server HTML to contain/,
];

beforeEach(() => {
  console.error = (...args: unknown[]) => {
    const message = args.join(" ");
    const isSuppressed = SUPPRESSED_ERROR_PATTERNS.some((pattern) =>
      pattern.test(message)
    );
    if (!isSuppressed) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");
    const isSuppressed = SUPPRESSED_WARN_PATTERNS.some((pattern) =>
      pattern.test(message)
    );
    if (!isSuppressed) {
      originalConsoleWarn(...args);
    }
  };
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  // Reset all vi mocks between tests
  vi.clearAllMocks();

  // Clear the rAF callback map
  rafCallbacks.clear();
  rafHandle = 0;
});

// ---------------------------------------------------------------------------
// 13. Viewport size
// ---------------------------------------------------------------------------
/**
 * Set a consistent viewport for component snapshot tests.
 */
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1280,
});

Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: 720,
});

// ---------------------------------------------------------------------------
// 14. Performance API
// ---------------------------------------------------------------------------
/**
 * Ensure performance.now() is available (jsdom provides it, but mock
 * ensures it starts at 0 for deterministic timer tests when fake timers
 * are not used).
 */
if (!("performance" in globalThis)) {
  Object.defineProperty(globalThis, "performance", {
    writable: true,
    configurable: true,
    value: {
      now: vi.fn().mockReturnValue(0),
      mark: vi.fn(),
      measure: vi.fn(),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([]),
      getEntries: vi.fn().mockReturnValue([]),
      timeOrigin: Date.now(),
    },
  });
}