/**
 * Beacon API Route — src/app/api/beacon/route.ts
 *
 * Minimal anonymous event ingestion endpoint for optional analytics.
 *
 * Contract:
 *   Method:  POST
 *   Body:    { event: string, durationMs: number, timestamp: number }
 *   Success: 204 No Content
 *   Error:   204 No Content (silent fail — app functions without analytics)
 *
 * Design decisions:
 * - Always returns 204 to avoid leaking implementation details to clients
 * - Malformed or missing body is silently dropped (no-op)
 * - Input validation is strict but non-throwing — bad payloads are discarded
 * - No PII is collected; event names are validated against an allowlist
 * - Rate limiting is intentionally omitted at this layer (handled by Vercel
 *   edge middleware / CDN in production if needed)
 * - No external service calls in this implementation — extend here to forward
 *   events to a real analytics backend (PostHog, Mixpanel, custom sink, etc.)
 *
 * @module api/beacon
 */

import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Allowlisted event names that the beacon endpoint accepts.
 * Any event name not in this set is silently discarded.
 */
const ALLOWED_EVENTS = new Set([
  "timer_started",
  "timer_paused",
  "timer_resumed",
  "timer_reset",
  "timer_completed",
  "preset_selected",
  "duration_set",
  "page_load",
  "audio_toggled",
  "notification_granted",
  "notification_denied",
  "shortcut_used",
] as const);

/**
 * Maximum allowed value for durationMs (100 hours in milliseconds).
 * Rejects implausibly large values that may indicate malformed payloads.
 */
const MAX_DURATION_MS = 100 * 60 * 60 * 1000; // 100 hours

/**
 * Maximum allowed drift between the client-reported timestamp and the
 * server's current time. Rejects replayed or heavily skewed events.
 * Set generously to accommodate clock skew and network latency.
 */
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum length for the event name string to prevent oversized payloads.
 */
const MAX_EVENT_NAME_LENGTH = 64;

/**
 * Maximum size of the request body in bytes.
 * Rejects payloads that are suspiciously large.
 */
const MAX_BODY_BYTES = 4096;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of a valid beacon payload after JSON parsing.
 */
interface BeaconPayload {
  /** Event identifier — must be in ALLOWED_EVENTS. */
  event: string;
  /** Duration in milliseconds relevant to the event (e.g. timer length). */
  durationMs: number;
  /** Client-side Unix timestamp (Date.now()) when the event occurred. */
  timestamp: number;
}

/**
 * Validated and sanitised beacon event ready for processing.
 */
interface ValidatedBeaconEvent {
  event: string;
  durationMs: number;
  timestamp: number;
  receivedAt: number;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Type guard — checks that `value` is a plain object (not null, not array).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Validates that a raw parsed JSON value conforms to the BeaconPayload shape.
 *
 * Returns the validated payload on success, or `null` if any field fails
 * validation. All validation is non-throwing.
 *
 * @param raw   - The raw value parsed from JSON.
 * @param now   - Current server time (Date.now()) used for timestamp drift check.
 * @returns ValidatedBeaconEvent or null
 */
function validatePayload(
  raw: unknown,
  now: number,
): ValidatedBeaconEvent | null {
  // Must be a plain object
  if (!isPlainObject(raw)) {
    return null;
  }

  const { event, durationMs, timestamp } = raw;

  // ── event ──────────────────────────────────────────────────────────────────

  if (typeof event !== "string") {
    return null;
  }

  if (event.length === 0 || event.length > MAX_EVENT_NAME_LENGTH) {
    return null;
  }

  // Sanitise: only allow alphanumeric characters and underscores
  if (!/^[a-z_][a-z0-9_]*$/.test(event)) {
    return null;
  }

  // Allowlist check
  if (!ALLOWED_EVENTS.has(event as Parameters<typeof ALLOWED_EVENTS.has>[0])) {
    // Not in the allowlist — silently discard (return null treated as no-op)
    return null;
  }

  // ── durationMs ─────────────────────────────────────────────────────────────

  if (typeof durationMs !== "number") {
    return null;
  }

  if (!Number.isFinite(durationMs)) {
    return null;
  }

  if (durationMs < 0 || durationMs > MAX_DURATION_MS) {
    return null;
  }

  // ── timestamp ──────────────────────────────────────────────────────────────

  if (typeof timestamp !== "number") {
    return null;
  }

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return null;
  }

  const drift = Math.abs(now - timestamp);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    // Timestamp is too far in the past or future — discard silently
    return null;
  }

  // ── All checks passed ──────────────────────────────────────────────────────

  return {
    event,
    durationMs: Math.round(durationMs), // Normalise to integer ms
    timestamp: Math.round(timestamp),
    receivedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Analytics sink
// ---------------------------------------------------------------------------

/**
 * Processes a validated beacon event.
 *
 * In this reference implementation the event is logged to the server console
 * in development and silently discarded in production. Replace this function
 * body to forward events to a real analytics backend.
 *
 * Examples of real integrations:
 *   - PostHog:   await posthog.capture(event.event, { durationMs, timestamp })
 *   - Mixpanel:  await mixpanel.track(event.event, { durationMs })
 *   - Custom DB: await db.events.insert(event)
 *   - Queue:     await queue.publish("analytics", event)
 *
 * This function must NEVER throw — all errors must be caught internally.
 */
async function processEvent(event: ValidatedBeaconEvent): Promise<void> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[beacon]", {
        event: event.event,
        durationMs: event.durationMs,
        timestamp: new Date(event.timestamp).toISOString(),
        receivedAt: new Date(event.receivedAt).toISOString(),
        latencyMs: event.receivedAt - event.timestamp,
      });
    }

    // TODO (production): forward to real analytics sink here.
    // Example:
    //
    // await fetch(process.env.ANALYTICS_ENDPOINT!, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(event),
    // });
  } catch {
    // Swallow all processing errors — analytics must never affect the user.
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * POST /api/beacon
 *
 * Accepts an anonymous analytics event. Always returns 204 No Content
 * regardless of whether the payload is valid or the event is processed
 * successfully. This prevents the client from receiving any information
 * about the server's internal state and ensures the app works identically
 * with or without this endpoint.
 *
 * Security headers:
 * - Cache-Control: no-store          — prevents caching of any response
 * - X-Content-Type-Options: nosniff  — standard hardening
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Common response — always 204 regardless of success or failure
  const noContent = new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

  try {
    // ── Check Content-Type ──────────────────────────────────────────────────
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // Not JSON — no-op
      return noContent;
    }

    // ── Guard against oversized bodies ─────────────────────────────────────
    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
      const bodyBytes = parseInt(contentLength, 10);
      if (!Number.isNaN(bodyBytes) && bodyBytes > MAX_BODY_BYTES) {
        return noContent;
      }
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let rawBody: unknown;
    try {
      // Read the body as text first to enforce size limit without relying on
      // the Content-Length header (which can be absent or spoofed).
      const text = await request.text();

      if (text.length > MAX_BODY_BYTES) {
        return noContent;
      }

      if (text.trim().length === 0) {
        return noContent;
      }

      rawBody = JSON.parse(text);
    } catch {
      // Invalid JSON — no-op
      return noContent;
    }

    // ── Validate payload ───────────────────────────────────────────────────
    const now = Date.now();
    const validated = validatePayload(rawBody, now);

    if (validated === null) {
      // Validation failed — no-op (do not leak why)
      return noContent;
    }

    // ── Process event ──────────────────────────────────────────────────────
    // Fire-and-forget: we do not await in a way that delays the 204 response.
    // In Vercel's edge/serverless environment, use `waitUntil` if available.
    void processEvent(validated);
  } catch {
    // Top-level catch-all: any unexpected error is silently swallowed.
    // The client always receives 204.
  }

  return noContent;
}

// ---------------------------------------------------------------------------
// Reject non-POST methods explicitly
// ---------------------------------------------------------------------------

/**
 * GET /api/beacon — Method Not Allowed
 *
 * Returning 405 for non-POST requests is slightly more informative than 404
 * for developers integrating against this endpoint, while still not exposing
 * sensitive server information.
 */
export async function GET(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Catch-all for HEAD, PUT, DELETE, PATCH, OPTIONS, etc.
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
    },
  });
}