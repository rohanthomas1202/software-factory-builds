/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * React strict mode — enables double-invocation of lifecycle methods
   * in development to surface side-effect bugs early.
   */
  reactStrictMode: true,

  /**
   * Disable the `X-Powered-By: Next.js` response header for a marginally
   * cleaner security posture.
   */
  poweredByHeader: false,

  /**
   * Enable the SWC minifier (default in Next.js 13+, but explicit is better).
   * SWC is ~20x faster than Terser for production builds.
   */
  swcMinify: true,

  /**
   * Compiler options.
   */
  compiler: {
    /**
     * Remove console.log calls in production builds.
     * console.error and console.warn are kept for runtime error visibility.
     */
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  /**
   * Experimental features.
   */
  experimental: {
    /**
     * Optimise package imports to reduce bundle size by tree-shaking
     * icon libraries and other barrel-export heavy packages.
     */
    optimizePackageImports: [],

    /**
     * Typed routes — enables TypeScript checking of Next.js Link href props.
     * Requires `next build` to generate .next/types/link.d.ts.
     */
    typedRoutes: false,
  },

  /**
   * Static asset headers.
   * Applies aggressive caching to immutable build artifacts and
   * reasonable caching to public assets.
   */
  async headers() {
    return [
      {
        /**
         * Next.js build chunks are content-hashed — safe to cache for 1 year.
         */
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        /**
         * Audio assets — cache for 7 days (may be updated without deploy).
         */
        source: "/sounds/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        /**
         * SVG icons — cache for 7 days.
         */
        source: "/icons/(.*)\\.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
          {
            /**
             * Ensure SVGs are served with the correct MIME type to prevent
             * browser sniffing / XSS risks from inline scripts in SVG files.
             */
            key: "Content-Type",
            value: "image/svg+xml",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        /**
         * Security headers applied globally to all routes.
         */
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            /**
             * Allowlist only the APIs this app actually uses:
             * - notifications: required for the completion notification feature
             * - screen-wake-lock: required for the Wake Lock API feature
             * - autoplay: required for the audio alert feature
             */
            value:
              "notifications=self, screen-wake-lock=self, autoplay=self, camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  /**
   * Webpack customisation.
   * Minimal — Next.js handles most bundling automatically.
   */
  webpack(config, { isServer }) {
    /**
     * Suppress the "Critical dependency: the request of a dependency is an
     * expression" warning from packages that use dynamic require().
     * Only apply client-side where dynamic imports are more common.
     */
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        /**
         * Polyfill Node.js built-ins that some packages reference.
         * The timer app itself doesn't use these — only needed if a
         * transitive dependency references them in browser context.
         */
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;