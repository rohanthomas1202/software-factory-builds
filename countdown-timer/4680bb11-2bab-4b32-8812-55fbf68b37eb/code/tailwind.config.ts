import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /**
       * Custom font families.
       * JetBrains Mono is used for the timer digit display to ensure
       * tabular (fixed-width) numerals that don't cause layout shift on tick.
       * Inter is the UI sans-serif for labels, buttons, and body copy.
       */
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      /**
       * Font variant numeric utilities.
       * `tabular-nums` is critical for the timer display — prevents digit-width
       * jitter as the number changes each second.
       */
      fontVariantNumeric: {
        "tabular-nums": "tabular-nums",
        "oldstyle-nums": "oldstyle-nums",
        "lining-nums": "lining-nums",
      },

      /**
       * Extended colour palette.
       * Using CSS custom properties as source-of-truth so both Tailwind
       * utilities and raw CSS in globals.css share the same values.
       */
      colors: {
        /** Brand / primary — indigo family */
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        /** Success / running state — emerald */
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        /** Warning / paused state — amber */
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        /** Danger / completed state — rose */
        danger: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        /** Surface / background tokens */
        surface: {
          0: "#0a0a0f",
          50: "#0f0f1a",
          100: "#13131f",
          200: "#1a1a2e",
          300: "#1e1e35",
          400: "#252540",
          500: "#2d2d50",
          600: "#383860",
          700: "#444470",
          800: "#505080",
          900: "#606090",
        },
      },

      /**
       * Extended spacing scale.
       * A few extra steps for precise layout control in the timer components.
       */
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "17": "4.25rem",
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "88": "22rem",
        "100": "25rem",
        "112": "28rem",
        "128": "32rem",
      },

      /**
       * Custom border radius values for pill-style buttons and chips.
       */
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      /**
       * Custom breakpoints.
       * 'xs' fills the gap below Tailwind's default 'sm' (640px).
       * '3xl' and '4xl' target wide-screen and ultra-wide layouts.
       */
      screens: {
        xs: "400px",
        "3xl": "1920px",
        "4xl": "2560px",
      },

      /**
       * Extended box-shadow tokens.
       * Used for glowing ring effects on the progress ring SVG and
       * active button states.
       */
      boxShadow: {
        "glow-indigo": "0 0 20px 4px rgba(99, 102, 241, 0.35)",
        "glow-emerald": "0 0 20px 4px rgba(16, 185, 129, 0.35)",
        "glow-amber": "0 0 20px 4px rgba(245, 158, 11, 0.35)",
        "glow-rose": "0 0 20px 4px rgba(244, 63, 94, 0.35)",
        "inner-lg": "inset 0 2px 8px 0 rgba(0, 0, 0, 0.4)",
        "card-dark":
          "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
        "card-dark-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)",
      },

      /**
       * Extended backdrop blur values.
       * Used for frosted-glass effect on modal overlays.
       */
      backdropBlur: {
        xs: "2px",
        "4xl": "48px",
      },

      /**
       * Custom keyframe animations.
       *
       * completion-pulse  — fired when the countdown reaches zero; the timer
       *                     ring and digits pulse with a warm amber glow.
       * fade-in-up        — modal / alert entrance animation.
       * fade-out-down     — modal / alert exit animation.
       * spin-slow         — slow continuous rotation used on the progress ring
       *                     background track in idle state.
       * ping-slow         — slower version of Tailwind's built-in `ping`,
       *                     used for the running status dot.
       * slide-in-right    — toast / notification entrance.
       * countdown-tick    — subtle scale pulse on each digit change.
       */
      keyframes: {
        "completion-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            filter: "brightness(1) drop-shadow(0 0 0px rgba(245,158,11,0))",
          },
          "30%": {
            transform: "scale(1.06)",
            filter:
              "brightness(1.3) drop-shadow(0 0 16px rgba(245,158,11,0.8))",
          },
          "60%": {
            transform: "scale(0.97)",
            filter:
              "brightness(1.1) drop-shadow(0 0 8px rgba(245,158,11,0.5))",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(16px) scale(0.97)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "fade-out-down": {
          "0%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(16px) scale(0.97)",
          },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "ping-slow": {
          "0%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
        "slide-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(24px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "countdown-tick": {
          "0%": {
            transform: "scale(1)",
          },
          "40%": {
            transform: "scale(1.04)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
        "bounce-subtle": {
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(-4px)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 8px 2px rgba(99, 102, 241, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 24px 6px rgba(99, 102, 241, 0.5)",
          },
        },
      },

      /**
       * Animation utility classes mapped to the keyframes above.
       */
      animation: {
        "completion-pulse": "completion-pulse 0.8s ease-in-out",
        "completion-pulse-loop": "completion-pulse 0.8s ease-in-out 3",
        "fade-in-up": "fade-in-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-out-down":
          "fade-out-down 0.2s cubic-bezier(0.4, 0, 1, 1) forwards",
        "spin-slow": "spin-slow 8s linear infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "slide-in-right":
          "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "countdown-tick": "countdown-tick 0.15s ease-out both",
        shimmer: "shimmer 2s linear infinite",
        "bounce-subtle": "bounce-subtle 1.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },

      /**
       * Extended transition durations for smooth micro-interactions.
       */
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1200": "1200ms",
        "1500": "1500ms",
        "2000": "2000ms",
      },

      /**
       * Custom transition timing functions.
       */
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },

      /**
       * Extended z-index scale.
       */
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [],
};

export default config;