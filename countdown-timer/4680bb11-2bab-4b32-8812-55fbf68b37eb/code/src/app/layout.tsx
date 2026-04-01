/**
 * Root Layout — src/app/layout.tsx
 *
 * Responsibilities:
 * - HTML shell with lang, dir, color-scheme meta
 * - Viewport and theme-color meta tags
 * - Open Graph / Twitter card metadata
 * - Inter + JetBrains Mono font loading via next/font
 * - PWA manifest link (via Next.js App Router manifest.ts convention)
 * - Global CSS injection
 * - Dark mode class on <html>
 */

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Font Loading                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Inter — primary body / UI font.
 * Subsets: latin only (reduces bundle size).
 * Variable font axes: weight 100–900.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "sans-serif",
  ],
});

/**
 * JetBrains Mono — monospaced display font for timer digits.
 * tabular-nums ensures digit-width consistency (no jitter on tick).
 * Subsets: latin only.
 * Variable font: weight 100–800.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: true,
  fallback: [
    "Fira Code",
    "Fira Mono",
    "Cascadia Code",
    "Consolas",
    "Courier New",
    "monospace",
  ],
});

/* ─────────────────────────────────────────────────────────────────────────── */
/* Viewport Configuration                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

export const viewport: Viewport = {
  /**
   * Canonical viewport for mobile responsiveness.
   * initial-scale=1 prevents auto-zoom on iOS when focusing inputs.
   */
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,

  /**
   * Theme color for browser chrome (tab bar, address bar on mobile).
   * Dark variant matches our app background; light fallback for light-mode OS.
   */
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0f0e17" },
    { media: "(prefers-color-scheme: light)", color: "#1a1830" },
  ],

  /**
   * color-scheme hint — tells the browser to render scrollbars, form controls,
   * and system UI in dark mode even if the OS is set to light mode.
   */
  colorScheme: "dark",
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Metadata                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  /* ── Core identity ──────────────────────────────────────────────────────── */
  title: {
    default:  "Countdown Timer",
    template: "%s — Countdown Timer",
  },
  description:
    "A beautiful, accurate countdown timer with start, pause, and reset controls. " +
    "Drift-resistant, keyboard-accessible, and works offline.",

  applicationName: "Countdown Timer",
  generator: "Next.js",

  /* ── Discovery / SEO ────────────────────────────────────────────────────── */
  keywords: [
    "countdown timer",
    "timer app",
    "online timer",
    "stopwatch",
    "productivity tool",
  ],
  authors: [{ name: "Countdown Timer App" }],
  creator: "Countdown Timer App",
  publisher: "Countdown Timer App",

  /* ── Robots ─────────────────────────────────────────────────────────────── */
  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true },
  },

  /* ── Canonical URL ───────────────────────────────────────────────────────── */
  // metadataBase is set here so relative OG image URLs resolve correctly.
  // Update this to your production domain before deploying.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://countdown-timer.vercel.app"
  ),

  /* ── Open Graph ─────────────────────────────────────────────────────────── */
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         "/",
    siteName:    "Countdown Timer",
    title:       "Countdown Timer — Beautiful, Accurate, Accessible",
    description:
      "A beautiful, accurate countdown timer with start, pause, and reset controls. " +
      "Drift-resistant, keyboard-accessible, and works offline.",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "Countdown Timer App — dark theme UI screenshot",
      },
    ],
  },

  /* ── Twitter / X Card ───────────────────────────────────────────────────── */
  twitter: {
    card:        "summary_large_image",
    title:       "Countdown Timer — Beautiful, Accurate, Accessible",
    description:
      "A beautiful, accurate countdown timer with start, pause, and reset controls.",
    images:      ["/og-image.png"],
  },

  /* ── Favicons & app icons ───────────────────────────────────────────────── */
  icons: {
    /**
     * SVG favicon — scales to any size, supports dark/light media queries.
     * Supported by all modern browsers (Chrome 80+, Firefox 41+, Safari 13+).
     */
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],

    /**
     * Apple touch icon — used when the app is added to the iOS home screen.
     * 180×180px is the canonical size (retina 2× of the legacy 90px).
     */
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],

    /**
     * Shortcut icon — legacy IE/Android fallback.
     */
    shortcut: [{ url: "/favicon.ico" }],
  },

  /* ── PWA / Web App Manifest ─────────────────────────────────────────────── */
  // Next.js App Router automatically links /manifest.webmanifest when
  // src/app/manifest.ts exports a default function — no explicit <link> needed.
  manifest: "/manifest.webmanifest",

  /* ── Apple Web App meta ─────────────────────────────────────────────────── */
  appleWebApp: {
    capable:           true,
    statusBarStyle:    "black-translucent",
    title:             "Timer",
  },

  /* ── Format detection ────────────────────────────────────────────────────── */
  // Prevent iOS from auto-linking phone numbers / addresses in the timer UI.
  formatDetection: {
    telephone: false,
    address:   false,
    email:     false,
  },

  /* ── Cache / HTTP equivalents ────────────────────────────────────────────── */
  other: {
    /**
     * Prevent IE from rendering in compatibility mode.
     * Moot in 2025 but harmless to include.
     */
    "X-UA-Compatible": "IE=edge",

    /**
     * Prevent old Android stock browsers from scaling fonts.
     */
    "HandheldFriendly": "True",
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Root Layout Component                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    /**
     * <html> attributes:
     * - lang="en"           → Accessibility: screen readers use correct language
     * - dir="ltr"           → Explicit text directionality
     * - className="dark"    → Activates Tailwind dark: utilities (darkMode: "class")
     * - suppressHydrationWarning → Prevents React hydration mismatch warnings
     *                              caused by browser extensions modifying the DOM
     *                              (e.g. LastPass, Grammarly adding attributes).
     */
    <html
      lang="en"
      dir="ltr"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * dns-prefetch for external resources (Google Fonts CDN).
         * next/font handles font loading, but the DNS hint can shave a few ms
         * on first load in slow network conditions.
         */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/*
         * Fallback color-scheme meta tag for browsers that don't support
         * the `viewport` export's `colorScheme` property.
         */}
        <meta name="color-scheme" content="dark" />

        {/*
         * Microsoft Tile color for Windows pinned sites (legacy, harmless).
         */}
        <meta name="msapplication-TileColor" content="#0f0e17" />
        <meta name="msapplication-config"    content="/browserconfig.xml" />
      </head>

      <body
        /**
         * Body class composition:
         * - font-sans      → Apply Inter as the default sans-serif font
         * - antialiased    → Tailwind's -webkit-font-smoothing: antialiased
         * - bg-[#0f0e17]   → Match --color-bg-base without needing a CSS var here
         * - text-[#f0eeff] → Match --color-text-primary
         * - min-h-dvh      → Dynamic viewport height (handles mobile browser bars)
         *
         * The actual background gradient is applied via globals.css on body
         * using CSS custom properties set in @layer base.
         */
        className="font-sans antialiased"
      >
        {/*
         * Skip navigation link — keyboard / screen reader users can jump
         * directly to the main content, bypassing the header (if one is added).
         *
         * Tailwind's `sr-only` + `focus:not-sr-only` pattern makes this
         * invisible until focused.
         */}
        <a
          href="#main-content"
          className={[
            "sr-only",
            "focus:not-sr-only",
            "focus:fixed",
            "focus:top-4",
            "focus:left-4",
            "focus:z-[9999]",
            "focus:px-4",
            "focus:py-2",
            "focus:bg-indigo-600",
            "focus:text-white",
            "focus:rounded-lg",
            "focus:text-sm",
            "focus:font-medium",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-indigo-400",
            "focus:ring-offset-2",
            "focus:ring-offset-[#0f0e17]",
          ].join(" ")}
        >
          Skip to main content
        </a>

        {/*
         * Main content wrapper.
         * id="main-content" is the target for the skip link above.
         * The actual page UI is rendered by src/app/page.tsx (a Client Component).
         */}
        <main id="main-content">
          {children}
        </main>

        {/*
         * Noscript fallback — shown only if JavaScript is disabled.
         * The timer requires JS to function, so we provide a clear message.
         */}
        <noscript>
          <div
            style={{
              position:        "fixed",
              inset:           0,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              backgroundColor: "#0f0e17",
              color:           "#f0eeff",
              fontFamily:      "system-ui, sans-serif",
              fontSize:        "1rem",
              textAlign:       "center",
              padding:         "2rem",
              zIndex:          9999,
            }}
          >
            <p>
              <strong>JavaScript is required</strong> to run the Countdown Timer.
              <br />
              Please enable JavaScript in your browser settings.
            </p>
          </div>
        </noscript>
      </body>
    </html>
  );
}