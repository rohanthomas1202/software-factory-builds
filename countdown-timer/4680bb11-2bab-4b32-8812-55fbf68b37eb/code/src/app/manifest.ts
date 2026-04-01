/**
 * Web App Manifest — src/app/manifest.ts
 *
 * Next.js App Router convention: exporting a default function from this file
 * automatically generates /manifest.webmanifest at build time with the correct
 * Content-Type: application/manifest+json header.
 *
 * Spec reference: https://www.w3.org/TR/appmanifest/
 * MDN reference:  https://developer.mozilla.org/en-US/docs/Web/Manifest
 */

import type { MetadataRoute } from "next";

/**
 * generateManifest
 *
 * Returns the Web App Manifest object. Next.js serialises this to JSON and
 * serves it at /manifest.webmanifest with the correct Content-Type header.
 *
 * When users "Add to Home Screen" on iOS/Android or "Install" on desktop
 * Chrome, this manifest controls:
 * - App name and short name shown on the home screen
 * - Start URL (always the root for this single-page app)
 * - Display mode (standalone = no browser chrome)
 * - Theme and background colors
 * - App icons at multiple resolutions
 * - Orientation lock (any = supports both portrait and landscape)
 * - Shortcuts (quick actions from the home screen long-press menu)
 * - Screenshots (shown in the install prompt on supporting browsers)
 *
 * @returns {MetadataRoute.Manifest} The manifest object
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    /* ── Identity ────────────────────────────────────────────────────────── */

    /**
     * Full application name — shown in install prompts and OS app lists.
     * Keep under ~30 characters to avoid truncation.
     */
    name: "Countdown Timer",

    /**
     * Short name — used on home screen icons where space is limited (< 12 chars).
     */
    short_name: "Timer",

    /**
     * Description — shown in browser install UI and app stores.
     */
    description:
      "A beautiful, accurate countdown timer with drift-resistant timing, " +
      "keyboard shortcuts, and offline support.",

    /* ── Display & UI ────────────────────────────────────────────────────── */

    /**
     * standalone — removes browser URL bar and navigation controls,
     * making the app feel native. Falls back to "browser" if unsupported.
     */
    display: "standalone",

    /**
     * Orientation: "any" allows the app to respond to device rotation.
     * The timer layout is responsive and works in both orientations.
     */
    orientation: "any",

    /* ── URLs ────────────────────────────────────────────────────────────── */

    /**
     * start_url — the URL loaded when the app is launched from the home screen.
     * "/?source=pwa" lets analytics distinguish PWA vs. browser launches.
     */
    start_url: "/?source=pwa",

    /**
     * scope — restricts which URLs are considered "in-app".
     * URLs outside this scope open in a browser tab.
     */
    scope: "/",

    /* ── Colors ──────────────────────────────────────────────────────────── */

    /**
     * theme_color — tints the browser/OS chrome (address bar, task switcher).
     * Must match the theme-color meta tag in layout.tsx.
     */
    theme_color: "#0f0e17",

    /**
     * background_color — splash screen background while the app loads.
     * Should match or complement theme_color.
     */
    background_color: "#0f0e17",

    /* ── Icons ───────────────────────────────────────────────────────────── */

    /**
     * App icons at multiple resolutions.
     *
     * Required sizes per platform:
     * - 192×192  — Android home screen (mdpi/hdpi)
     * - 512×512  — Android splash screen, Chrome install prompt
     * - maskable — Android adaptive icons (foreground on colored background)
     *
     * SVG icons are listed first; browsers that support SVG favicons will
     * use them for perfect scaling at any DPR.
     *
     * NOTE: The actual PNG files referenced below need to be generated and
     * placed in the /public/icons/ directory. The SVG source files are
     * already provided in public/icons/*.svg.
     */
    icons: [
      /* SVG — universal scaling (modern browsers) */
      {
        src:     "/favicon.svg",
        sizes:   "any",
        type:    "image/svg+xml",
        purpose: "any",
      },

      /* 192×192 PNG — Android home screen */
      {
        src:     "/icons/icon-192x192.png",
        sizes:   "192x192",
        type:    "image/png",
        purpose: "any",
      },

      /* 192×192 maskable — Android adaptive icon */
      {
        src:     "/icons/icon-192x192-maskable.png",
        sizes:   "192x192",
        type:    "image/png",
        purpose: "maskable",
      },

      /* 256×256 PNG — medium-density displays */
      {
        src:     "/icons/icon-256x256.png",
        sizes:   "256x256",
        type:    "image/png",
        purpose: "any",
      },

      /* 384×384 PNG — high-density displays */
      {
        src:     "/icons/icon-384x384.png",
        sizes:   "384x384",
        type:    "image/png",
        purpose: "any",
      },

      /* 512×512 PNG — splash screen, install prompt */
      {
        src:     "/icons/icon-512x512.png",
        sizes:   "512x512",
        type:    "image/png",
        purpose: "any",
      },

      /* 512×512 maskable — large adaptive icon */
      {
        src:     "/icons/icon-512x512-maskable.png",
        sizes:   "512x512",
        type:    "image/png",
        purpose: "maskable",
      },

      /* Apple touch icon — iOS home screen (180×180) */
      {
        src:     "/icons/apple-touch-icon.png",
        sizes:   "180x180",
        type:    "image/png",
        purpose: "any",
      },
    ],

    /* ── App Shortcuts ───────────────────────────────────────────────────── */

    /**
     * Shortcuts appear in the home screen long-press context menu on Android
     * and in the taskbar right-click menu on Windows.
     *
     * Each shortcut deep-links to a specific app state via query parameters.
     * The app reads these on load to pre-populate the timer.
     */
    shortcuts: [
      {
        name:        "5-Minute Timer",
        short_name:  "5 min",
        description: "Start a 5-minute countdown immediately",
        url:         "/?preset=5m&autostart=1",
        icons: [
          {
            src:   "/icons/shortcut-5m.png",
            sizes: "96x96",
            type:  "image/png",
          },
        ],
      },
      {
        name:        "25-Minute Pomodoro",
        short_name:  "Pomodoro",
        description: "Start a 25-minute Pomodoro session",
        url:         "/?preset=25m&autostart=1",
        icons: [
          {
            src:   "/icons/shortcut-25m.png",
            sizes: "96x96",
            type:  "image/png",
          },
        ],
      },
      {
        name:        "1-Hour Timer",
        short_name:  "1 hour",
        description: "Start a 1-hour countdown",
        url:         "/?preset=1h&autostart=1",
        icons: [
          {
            src:   "/icons/shortcut-1h.png",
            sizes: "96x96",
            type:  "image/png",
          },
        ],
      },
    ],

    /* ── Screenshots ─────────────────────────────────────────────────────── */

    /**
     * Screenshots are displayed in the browser's install prompt on
     * Chrome for Android and some desktop browsers.
     *
     * Recommended: 2–8 screenshots; 1280×720 or 750×1334 (mobile portrait).
     * NOTE: These images need to be created and added to /public/screenshots/.
     */
    screenshots: [
      {
        src:          "/screenshots/desktop-idle.png",
        sizes:        "1280x800",
        type:         "image/png",
        // @ts-expect-error — form_factor is a newer field not yet in Next.js types
        form_factor:  "wide",
        label:        "Countdown Timer — Desktop idle state",
      },
      {
        src:          "/screenshots/desktop-running.png",
        sizes:        "1280x800",
        type:         "image/png",
        // @ts-expect-error — form_factor is a newer field not yet in Next.js types
        form_factor:  "wide",
        label:        "Countdown Timer — Desktop running state",
      },
      {
        src:          "/screenshots/mobile-idle.png",
        sizes:        "390x844",
        type:         "image/png",
        // @ts-expect-error — form_factor is a newer field not yet in Next.js types
        form_factor:  "narrow",
        label:        "Countdown Timer — Mobile idle state",
      },
      {
        src:          "/screenshots/mobile-running.png",
        sizes:        "390x844",
        type:         "image/png",
        // @ts-expect-error — form_factor is a newer field not yet in Next.js types
        form_factor:  "narrow",
        label:        "Countdown Timer — Mobile running state",
      },
    ],

    /* ── Categories ──────────────────────────────────────────────────────── */

    /**
     * categories — hints to app stores / browsers about app type.
     * https://github.com/nickcoutsos/web-app-manifest-categories
     */
    categories: ["productivity", "utilities"],

    /* ── Language ────────────────────────────────────────────────────────── */
    lang: "en-US",

    /* ── Related applications ────────────────────────────────────────────── */
    /**
     * prefer_related_applications: false — instructs browsers to suggest
     * installing the PWA rather than a native app store equivalent.
     */
    prefer_related_applications: false,
  };
}