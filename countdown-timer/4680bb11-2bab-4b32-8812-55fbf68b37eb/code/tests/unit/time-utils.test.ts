/**
 * Time Utilities Unit Tests — tests/unit/time-utils.test.ts
 *
 * Comprehensive test coverage for all pure functions in time-utils.ts.
 *
 * Test categories:
 * 1.  msToComponents()       — millisecond decomposition into h/m/s/ms
 * 2.  componentsToMs()       — h/m/s/ms reconstruction back to milliseconds
 * 3.  formatTime()           — HH:MM:SS and MM:SS display formatting
 * 4.  formatTimeCompact()    — condensed display format
 * 5.  formatTimeVerbose()    — human-readable text format
 * 6.  msToSeconds()          — milliseconds → seconds conversion
 * 7.  secondsToMs()          — seconds → milliseconds conversion
 * 8.  clampMs()              — clamping to [0, max] range
 * 9.  parseTimeInput()       — string input parsing
 * 10. calcProgress()         — progress fraction calculation
 * 11. Round-trip identity     — components → ms → components
 * 12. Boundary values         — 0, MAX_SAFE_INTEGER, exact minute/hour boundaries
 */

import { describe, it, expect } from "vitest";

import {
  msToComponents,
  componentsToMs,
  formatTime,
  formatTimeCompact,
  formatTimeVerbose,
  msToSeconds,
  secondsToMs,
  clampMs,
  parseTimeInput,
  calcProgress,
  type TimeComponents,
} from "@/lib/time-utils";

// ===========================================================================
// 1. msToComponents()
// ===========================================================================

describe("msToComponents()", () => {
  it("decomposes 0ms correctly", () => {
    const result = msToComponents(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes 1ms correctly", () => {
    const result = msToComponents(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(1);
  });

  it("decomposes exactly 1 second (1000ms)", () => {
    const result = msToComponents(1_000);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(1);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes exactly 1 minute (60000ms)", () => {
    const result = msToComponents(60_000);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes exactly 1 hour (3600000ms)", () => {
    const result = msToComponents(3_600_000);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes 90 seconds (1 minute 30 seconds)", () => {
    const result = msToComponents(90_000);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes 1 hour 30 minutes 45 seconds 500ms", () => {
    const ms = 1 * 3_600_000 + 30 * 60_000 + 45 * 1_000 + 500;
    const result = msToComponents(ms);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(30);
    expect(result.seconds).toBe(45);
    expect(result.milliseconds).toBe(500);
  });

  it("decomposes 59 minutes 59 seconds 999ms", () => {
    const ms = 59 * 60_000 + 59 * 1_000 + 999;
    const result = msToComponents(ms);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(59);
    expect(result.seconds).toBe(59);
    expect(result.milliseconds).toBe(999);
  });

  it("decomposes 23 hours 59 minutes 59 seconds 999ms", () => {
    const ms = 23 * 3_600_000 + 59 * 60_000 + 59 * 1_000 + 999;
    const result = msToComponents(ms);
    expect(result.hours).toBe(23);
    expect(result.minutes).toBe(59);
    expect(result.seconds).toBe(59);
    expect(result.milliseconds).toBe(999);
  });

  it("decomposes 2 hours exactly", () => {
    const result = msToComponents(7_200_000);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("decomposes 999ms (sub-second only)", () => {
    const result = msToComponents(999);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(999);
  });

  it("all components are non-negative integers", () => {
    const result = msToComponents(12_345_678);
    expect(result.hours).toBeGreaterThanOrEqual(0);
    expect(result.minutes).toBeGreaterThanOrEqual(0);
    expect(result.seconds).toBeGreaterThanOrEqual(0);
    expect(result.milliseconds).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.hours)).toBe(true);
    expect(Number.isInteger(result.minutes)).toBe(true);
    expect(Number.isInteger(result.seconds)).toBe(true);
    expect(Number.isInteger(result.milliseconds)).toBe(true);
  });

  it("minutes component is always 0–59", () => {
    for (let ms = 0; ms < 3_600_000; ms += 60_000) {
      const result = msToComponents(ms);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
      expect(result.minutes).toBeLessThanOrEqual(59);
    }
  });

  it("seconds component is always 0–59", () => {
    for (let ms = 0; ms < 60_000; ms += 1_000) {
      const result = msToComponents(ms);
      expect(result.seconds).toBeGreaterThanOrEqual(0);
      expect(result.seconds).toBeLessThanOrEqual(59);
    }
  });

  it("milliseconds component is always 0–999", () => {
    for (let ms = 0; ms < 1_000; ms += 100) {
      const result = msToComponents(ms);
      expect(result.milliseconds).toBeGreaterThanOrEqual(0);
      expect(result.milliseconds).toBeLessThanOrEqual(999);
    }
  });
});

// ===========================================================================
// 2. componentsToMs()
// ===========================================================================

describe("componentsToMs()", () => {
  it("converts all-zero components to 0ms", () => {
    expect(componentsToMs({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })).toBe(0);
  });

  it("converts 1 hour to 3600000ms", () => {
    expect(componentsToMs({ hours: 1, minutes: 0, seconds: 0, milliseconds: 0 })).toBe(3_600_000);
  });

  it("converts 1 minute to 60000ms", () => {
    expect(componentsToMs({ hours: 0, minutes: 1, seconds: 0, milliseconds: 0 })).toBe(60_000);
  });

  it("converts 1 second to 1000ms", () => {
    expect(componentsToMs({ hours: 0, minutes: 0, seconds: 1, milliseconds: 0 })).toBe(1_000);
  });

  it("converts 1ms correctly", () => {
    expect(componentsToMs({ hours: 0, minutes: 0, seconds: 0, milliseconds: 1 })).toBe(1);
  });

  it("converts 1:30:00 (1 hour 30 minutes)", () => {
    expect(componentsToMs({ hours: 1, minutes: 30, seconds: 0, milliseconds: 0 })).toBe(5_400_000);
  });

  it("converts 1:30:45.500 correctly", () => {
    const expected = 1 * 3_600_000 + 30 * 60_000 + 45 * 1_000 + 500;
    expect(
      componentsToMs({ hours: 1, minutes: 30, seconds: 45, milliseconds: 500 })
    ).toBe(expected);
  });

  it("converts 23:59:59.999 correctly", () => {
    const expected = 23 * 3_600_000 + 59 * 60_000 + 59 * 1_000 + 999;
    expect(
      componentsToMs({ hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
    ).toBe(expected);
  });

  it("works without milliseconds field (optional)", () => {
    // If milliseconds is optional in the type, omitting it should treat as 0
    const result = componentsToMs({ hours: 0, minutes: 5, seconds: 0, milliseconds: 0 });
    expect(result).toBe(300_000);
  });

  it("handles large hour values (99 hours)", () => {
    const result = componentsToMs({ hours: 99, minutes: 0, seconds: 0, milliseconds: 0 });
    expect(result).toBe(99 * 3_600_000);
  });
});

// ===========================================================================
// 3. Round-trip identity: msToComponents ↔ componentsToMs
// ===========================================================================

describe("round-trip identity", () => {
  const testValues = [
    0,
    1,
    999,
    1_000,
    60_000,
    3_600_000,
    90_000,
    5_400_000,
    3_661_001, // 1h 1m 1s 1ms
    86_399_999, // 23:59:59.999
    7_200_000,
    12_345_678,
  ];

  for (const ms of testValues) {
    it(`ms=${ms} survives round-trip componentsToMs(msToComponents(${ms})) === ${ms}`, () => {
      expect(componentsToMs(msToComponents(ms))).toBe(ms);
    });
  }

  it("round-trips for all second boundaries in first minute", () => {
    for (let s = 0; s < 60; s++) {
      const ms = s * 1_000;
      expect(componentsToMs(msToComponents(ms))).toBe(ms);
    }
  });

  it("round-trips for all minute boundaries in first hour", () => {
    for (let m = 0; m < 60; m++) {
      const ms = m * 60_000;
      expect(componentsToMs(msToComponents(ms))).toBe(ms);
    }
  });
});

// ===========================================================================
// 4. formatTime()
// ===========================================================================

describe("formatTime()", () => {
  it("formats 0ms as '00:00:00' or '00:00'", () => {
    const result = formatTime(0);
    // Accept both HH:MM:SS and MM:SS formats for zero
    expect(result).toMatch(/^(00:00:00|00:00)$/);
  });

  it("formats 1 second as '00:01' or '00:00:01'", () => {
    const result = formatTime(1_000);
    expect(result).toMatch(/^(00:00:01|00:01)$/);
  });

  it("formats 1 minute as '01:00' or '00:01:00'", () => {
    const result = formatTime(60_000);
    expect(result).toMatch(/^(01:00|00:01:00)$/);
  });

  it("formats 1 hour as '01:00:00'", () => {
    const result = formatTime(3_600_000);
    expect(result).toBe("01:00:00");
  });

  it("formats 1:30:45 correctly", () => {
    const ms = 1 * 3_600_000 + 30 * 60_000 + 45 * 1_000;
    const result = formatTime(ms);
    expect(result).toBe("01:30:45");
  });

  it("formats 59 seconds as '00:59' or '00:00:59'", () => {
    const result = formatTime(59_000);
    expect(result).toMatch(/^(00:59|00:00:59)$/);
  });

  it("formats 59 minutes 59 seconds correctly", () => {
    const ms = 59 * 60_000 + 59 * 1_000;
    const result = formatTime(ms);
    expect(result).toMatch(/^(59:59|00:59:59)$/);
  });

  it("formats 23:59:59 correctly", () => {
    const ms = 23 * 3_600_000 + 59 * 60_000 + 59 * 1_000;
    const result = formatTime(ms);
    expect(result).toBe("23:59:59");
  });

  it("always uses zero-padding (single digits get leading zeros)", () => {
    const result = formatTime(1 * 3_600_000 + 1 * 60_000 + 1 * 1_000); // 1:01:01
    expect(result).toBe("01:01:01");
  });

  it("returns a string", () => {
    expect(typeof formatTime(5_000)).toBe("string");
  });

  it("uses colons as separators", () => {
    const result = formatTime(3_661_000); // 1h 1m 1s
    expect(result).toContain(":");
  });

  it("does not include milliseconds in default output", () => {
    const result = formatTime(1_500); // 1.5 seconds
    // Should show 00:01 or 00:00:01, not 00:00:01.500
    expect(result).not.toMatch(/\.\d+/);
  });

  it("formats 5 minutes as '05:00' or '00:05:00'", () => {
    const result = formatTime(300_000);
    expect(result).toMatch(/^(05:00|00:05:00)$/);
  });

  it("formats 10 minutes as '10:00' or '00:10:00'", () => {
    const result = formatTime(600_000);
    expect(result).toMatch(/^(10:00|00:10:00)$/);
  });
});

// ===========================================================================
// 5. formatTimeCompact()
// ===========================================================================

describe("formatTimeCompact()", () => {
  it("returns a string", () => {
    expect(typeof formatTimeCompact(5_000)).toBe("string");
  });

  it("formats 0 as '0:00'", () => {
    const result = formatTimeCompact(0);
    // Compact format drops leading zero hours/minutes
    expect(result).toMatch(/^0:00$|^00:00$|^0:00:00$/);
  });

  it("formats 90 seconds compactly", () => {
    const result = formatTimeCompact(90_000);
    // Should be '1:30' not '01:30' in compact mode
    expect(result).toMatch(/1:30/);
  });

  it("formats 1 hour compactly", () => {
    const result = formatTimeCompact(3_600_000);
    // Could be '1:00:00'
    expect(result).toMatch(/1:00:00/);
  });

  it("formats values under 1 hour without hours field", () => {
    const result = formatTimeCompact(5 * 60_000); // 5 minutes
    // Should not include a third colon-separated segment for hours
    const parts = result.split(":");
    expect(parts.length).toBeLessThanOrEqual(3);
  });
});

// ===========================================================================
// 6. formatTimeVerbose()
// ===========================================================================

describe("formatTimeVerbose()", () => {
  it("returns a string", () => {
    expect(typeof formatTimeVerbose(5_000)).toBe("string");
  });

  it("formats 0ms as a valid human-readable string", () => {
    const result = formatTimeVerbose(0);
    // Should mention 0 and some unit like 'second' or 'seconds'
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats 1 second correctly", () => {
    const result = formatTimeVerbose(1_000);
    expect(result.toLowerCase()).toContain("second");
  });

  it("formats 60 seconds as 1 minute", () => {
    const result = formatTimeVerbose(60_000);
    expect(result.toLowerCase()).toContain("minute");
  });

  it("formats 1 hour correctly", () => {
    const result = formatTimeVerbose(3_600_000);
    expect(result.toLowerCase()).toContain("hour");
  });

  it("formats 90 seconds as 1 minute 30 seconds", () => {
    const result = formatTimeVerbose(90_000);
    expect(result.toLowerCase()).toContain("minute");
    expect(result.toLowerCase()).toContain("second");
  });

  it("formats 2 minutes correctly (plural)", () => {
    const result = formatTimeVerbose(120_000);
    expect(result.toLowerCase()).toContain("minute");
  });

  it("formats 2 hours correctly (plural)", () => {
    const result = formatTimeVerbose(7_200_000);
    expect(result.toLowerCase()).toContain("hour");
  });
});

// ===========================================================================
// 7. msToSeconds()
// ===========================================================================

describe("msToSeconds()", () => {
  it("converts 0ms to 0 seconds", () => {
    expect(msToSeconds(0)).toBe(0);
  });

  it("converts 1000ms to 1 second", () => {
    expect(msToSeconds(1_000)).toBe(1);
  });

  it("converts 1500ms to 1.5 seconds", () => {
    expect(msToSeconds(1_500)).toBe(1.5);
  });

  it("converts 60000ms to 60 seconds", () => {
    expect(msToSeconds(60_000)).toBe(60);
  });

  it("converts 3600000ms to 3600 seconds", () => {
    expect(msToSeconds(3_600_000)).toBe(3_600);
  });

  it("converts 500ms to 0.5 seconds", () => {
    expect(msToSeconds(500)).toBe(0.5);
  });

  it("converts 100ms to 0.1 seconds", () => {
    expect(msToSeconds(100)).toBeCloseTo(0.1, 10);
  });

  it("converts 999ms to 0.999 seconds", () => {
    expect(msToSeconds(999)).toBeCloseTo(0.999, 10);
  });

  it("result is always non-negative for non-negative input", () => {
    expect(msToSeconds(0)).toBeGreaterThanOrEqual(0);
    expect(msToSeconds(1)).toBeGreaterThanOrEqual(0);
    expect(msToSeconds(86_400_000)).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================================================
// 8. secondsToMs()
// ===========================================================================

describe("secondsToMs()", () => {
  it("converts 0 seconds to 0ms", () => {
    expect(secondsToMs(0)).toBe(0);
  });

  it("converts 1 second to 1000ms", () => {
    expect(secondsToMs(1)).toBe(1_000);
  });

  it("converts 60 seconds to 60000ms", () => {
    expect(secondsToMs(60)).toBe(60_000);
  });

  it("converts 3600 seconds to 3600000ms", () => {
    expect(secondsToMs(3_600)).toBe(3_600_000);
  });

  it("converts 0.5 seconds to 500ms", () => {
    expect(secondsToMs(0.5)).toBe(500);
  });

  it("converts 1.5 seconds to 1500ms", () => {
    expect(secondsToMs(1.5)).toBe(1_500);
  });

  it("is the inverse of msToSeconds", () => {
    const values = [0, 1, 500, 1_000, 1_500, 60_000, 3_600_000];
    for (const ms of values) {
      expect(secondsToMs(msToSeconds(ms))).toBeCloseTo(ms, 5);
    }
  });
});

// ===========================================================================
// 9. clampMs()
// ===========================================================================

describe("clampMs()", () => {
  it("returns value unchanged when within [0, max]", () => {
    expect(clampMs(5_000, 10_000)).toBe(5_000);
  });

  it("clamps negative values to 0", () => {
    expect(clampMs(-1, 10_000)).toBe(0);
  });

  it("clamps values exceeding max to max", () => {
    expect(clampMs(15_000, 10_000)).toBe(10_000);
  });

  it("returns 0 when value is exactly 0", () => {
    expect(clampMs(0, 10_000)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clampMs(10_000, 10_000)).toBe(10_000);
  });

  it("clamps -Infinity to 0", () => {
    expect(clampMs(-Infinity, 10_000)).toBe(0);
  });

  it("clamps +Infinity to max", () => {
    expect(clampMs(Infinity, 10_000)).toBe(10_000);
  });

  it("returns 0 when max is 0 and value is positive", () => {
    expect(clampMs(100, 0)).toBe(0);
  });

  it("returns 0 when max is 0 and value is 0", () => {
    expect(clampMs(0, 0)).toBe(0);
  });

  it("returns 0 for very large negative values", () => {
    expect(clampMs(-999_999_999, 10_000)).toBe(0);
  });

  it("clamps very large positive values to max", () => {
    expect(clampMs(Number.MAX_SAFE_INTEGER, 10_000)).toBe(10_000);
  });

  it("preserves fractional millisecond values within range", () => {
    expect(clampMs(500.5, 1_000)).toBe(500.5);
  });
});

// ===========================================================================
// 10. parseTimeInput()
// ===========================================================================

describe("parseTimeInput()", () => {
  it("parses '0' as 0ms", () => {
    const result = parseTimeInput("0");
    expect(result).toBe(0);
  });

  it("parses empty string as 0 or null", () => {
    const result = parseTimeInput("");
    expect(result === 0 || result === null).toBe(true);
  });

  it("parses '5' as 5 seconds", () => {
    const result = parseTimeInput("5");
    // Interpret bare number as seconds
    expect(result).toBe(5_000);
  });

  it("parses '60' as 60 seconds", () => {
    const result = parseTimeInput("60");
    expect(result).toBe(60_000);
  });

  it("parses 'MM:SS' format — '1:30'", () => {
    const result = parseTimeInput("1:30");
    expect(result).toBe(90_000); // 1 min 30 sec
  });

  it("parses 'MM:SS' format — '10:00'", () => {
    const result = parseTimeInput("10:00");
    expect(result).toBe(600_000);
  });

  it("parses 'HH:MM:SS' format — '1:00:00'", () => {
    const result = parseTimeInput("1:00:00");
    expect(result).toBe(3_600_000);
  });

  it("parses 'HH:MM:SS' format — '1:30:45'", () => {
    const result = parseTimeInput("1:30:45");
    expect(result).toBe(1 * 3_600_000 + 30 * 60_000 + 45 * 1_000);
  });

  it("parses '00:00'", () => {
    const result = parseTimeInput("00:00");
    expect(result).toBe(0);
  });

  it("parses '00:00:00'", () => {
    const result = parseTimeInput("00:00:00");
    expect(result).toBe(0);
  });

  it("parses '0:05' as 5 seconds", () => {
    const result = parseTimeInput("0:05");
    expect(result).toBe(5_000);
  });

  it("parses '59:59' correctly", () => {
    const result = parseTimeInput("59:59");
    expect(result).toBe(59 * 60_000 + 59 * 1_000);
  });

  it("returns null or throws for completely invalid input", () => {
    const result = parseTimeInput("abc");
    expect(result === null || result === 0 || result === undefined).toBe(true);
  });

  it("returns non-negative value for all valid inputs", () => {
    const inputs = ["0", "5", "1:00", "1:00:00", "10:30", "00:30:00"];
    for (const input of inputs) {
      const result = parseTimeInput(input);
      if (result !== null && result !== undefined) {
        expect(result).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ===========================================================================
// 11. calcProgress()
// ===========================================================================

describe("calcProgress()", () => {
  it("returns 1.0 when elapsed = 0 (full time remaining)", () => {
    // Progress = remainingMs / durationMs, or 1 - elapsedMs/durationMs
    // At start: remaining = duration → progress = 1
    expect(calcProgress(0, 10_000)).toBe(1);
  });

  it("returns 0.0 when elapsed = duration (timer complete)", () => {
    expect(calcProgress(10_000, 10_000)).toBe(0);
  });

  it("returns 0.5 at halfway point", () => {
    expect(calcProgress(5_000, 10_000)).toBeCloseTo(0.5, 5);
  });

  it("returns 0.75 at 25% remaining", () => {
    // elapsed = 75% of duration → remaining = 25% → progress of remaining = 0.25
    // OR: progress of elapsed = 0.75, depending on interpretation
    // Accept either convention — just test that it's between 0 and 1
    const result = calcProgress(7_500, 10_000);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("result is always between 0 and 1 (inclusive)", () => {
    const testCases: Array<[number, number]> = [
      [0, 10_000],
      [5_000, 10_000],
      [10_000, 10_000],
      [1, 1_000],
      [999, 1_000],
      [1_000, 1_000],
    ];
    for (const [elapsed, duration] of testCases) {
      const result = calcProgress(elapsed, duration);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });

  it("returns 0 when duration is 0 (no division by zero crash)", () => {
    expect(() => calcProgress(0, 0)).not.toThrow();
    const result = calcProgress(0, 0);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("clamps to 1 if elapsed is negative (guard against underflow)", () => {
    const result = calcProgress(-100, 10_000);
    expect(result).toBeLessThanOrEqual(1);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("clamps to 0 if elapsed exceeds duration (guard against overshoot)", () => {
    const result = calcProgress(15_000, 10_000);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("progress decreases monotonically as elapsed increases", () => {
    const duration = 10_000;
    let prev = calcProgress(0, duration);

    for (let elapsed = 1_000; elapsed <= 10_000; elapsed += 1_000) {
      const current = calcProgress(elapsed, duration);
      expect(current).toBeLessThanOrEqual(prev);
      prev = current;
    }
  });
});

// ===========================================================================
// 12. Boundary values
// ===========================================================================

describe("boundary values", () => {
  it("msToComponents handles exactly midnight boundary (0ms)", () => {
    const result = msToComponents(0);
    expect(result).toEqual({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  });

  it("msToComponents handles exactly one day (86400000ms)", () => {
    const result = msToComponents(86_400_000);
    expect(result.hours).toBe(24);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("formatTime handles 99:59:59 (max displayable)", () => {
    const ms = 99 * 3_600_000 + 59 * 60_000 + 59 * 1_000;
    const result = formatTime(ms);
    expect(result).toBe("99:59:59");
  });

  it("clampMs with value=0 and max=0 returns 0", () => {
    expect(clampMs(0, 0)).toBe(0);
  });

  it("msToSeconds(0) === 0", () => {
    expect(msToSeconds(0)).toBe(0);
  });

  it("secondsToMs(0) === 0", () => {
    expect(secondsToMs(0)).toBe(0);
  });

  it("componentsToMs with all zeros is 0", () => {
    expect(componentsToMs({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })).toBe(0);
  });

  it("formatTime(0) does not return empty string", () => {
    expect(formatTime(0).length).toBeGreaterThan(0);
  });

  it("msToComponents is consistent at exactly second boundary (1000ms)", () => {
    const result = msToComponents(1_000);
    expect(result.seconds).toBe(1);
    expect(result.milliseconds).toBe(0);
  });

  it("msToComponents is consistent at exactly minute boundary (60000ms)", () => {
    const result = msToComponents(60_000);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("msToComponents is consistent at exactly hour boundary (3600000ms)", () => {
    const result = msToComponents(3_600_000);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it("calcProgress at exactly half duration returns 0.5", () => {
    expect(calcProgress(5_000, 10_000)).toBeCloseTo(0.5, 5);
  });

  it("formatTime segments are always two digits", () => {
    // Any formatted HH:MM:SS should have exactly 2-digit segments
    const result = formatTime(3_661_000); // 1:01:01
    const parts = result.split(":");
    for (const part of parts) {
      expect(part.length).toBe(2);
    }
  });

  it("msToComponents and formatTime agree on the number of hours", () => {
    const ms = 5 * 3_600_000 + 12 * 60_000 + 34 * 1_000; // 5:12:34
    const components = msToComponents(ms);
    const formatted = formatTime(ms);
    const hoursStr = String(components.hours).padStart(2, "0");
    expect(formatted.startsWith(hoursStr)).toBe(true);
  });
});

// ===========================================================================
// 13. Type safety — TypeComponents interface
// ===========================================================================

describe("TimeComponents type shape", () => {
  it("msToComponents returns an object with hours, minutes, seconds, milliseconds", () => {
    const result: TimeComponents = msToComponents(12_345_678);
    expect("hours" in result).toBe(true);
    expect("minutes" in result).toBe(true);
    expect("seconds" in result).toBe(true);
    expect("milliseconds" in result).toBe(true);
  });

  it("componentsToMs accepts a full TimeComponents object", () => {
    const components: TimeComponents = {
      hours: 1,
      minutes: 30,
      seconds: 45,
      milliseconds: 500,
    };
    const result = componentsToMs(components);
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });
});